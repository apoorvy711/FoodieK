#!/usr/bin/env node

require("dotenv").config();

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const ImageKit = require("imagekit");

const connectDB = require("../src/db/db");
const Food = require("../src/models/food.model");
const FoodPartner = require("../src/models/foodpartner.model");
const Category = require("../src/models/category.model");
const User = require("../src/models/user.model");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const workspaceRoot = path.resolve(__dirname, "..", "..");
const frontendRoot = path.join(workspaceRoot, "frontend", "vite-project");

const mediaPathMap = [
  {
    prefixes: ["/media/videos/", "/src/assets/videos/"],
    folders: [
      path.join(frontendRoot, "public", "media", "videos"),
      path.join(frontendRoot, "src", "assets", "videos"),
    ],
  },
  {
    prefixes: ["/media/thumbnails/", "/src/assets/thumbnails/"],
    folders: [
      path.join(frontendRoot, "public", "media", "thumbnails"),
      path.join(frontendRoot, "src", "assets", "thumbnails"),
    ],
  },
  {
    prefixes: ["/media/restaurant-images/", "/src/assets/restaurant-images/"],
    folders: [
      path.join(frontendRoot, "public", "media", "restaurant-images"),
      path.join(frontendRoot, "src", "assets", "restaurant-images"),
    ],
  },
  {
    prefixes: ["/media/"],
    folders: [path.join(frontendRoot, "public", "media")],
  },
  {
    prefixes: ["/src/assets/"],
    folders: [path.join(frontendRoot, "src", "assets")],
  },
];

const counters = {
  foodsChecked: 0,
  foodPartnersChecked: 0,
  categoriesChecked: 0,
  usersChecked: 0,
  videosUploaded: 0,
  thumbnailsUploaded: 0,
  restaurantImagesUploaded: 0,
  categoryImagesUploaded: 0,
  userImagesUploaded: 0,
  alreadyMigratedOrSkipped: 0,
  missingLocalFiles: 0,
  uploadFailures: 0,
  docsUpdated: 0,
};

const missingFiles = [];
const failedUploads = [];

function validateImageKitEnv() {
  const required = [
    "IMAGEKIT_PUBLIC_KEY",
    "IMAGEKIT_PRIVATE_KEY",
    "IMAGEKIT_URL_ENDPOINT",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(
      `Missing required ImageKit env vars: ${missing.join(", ")}`,
    );
  }
}

function getImageKitClient() {
  return new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
}

function isRemoteUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function toSafeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function buildUploadFileName({ filePath, documentId, field }) {
  const parsed = path.parse(filePath);
  const safeBaseName = toSafeFileName(parsed.name);
  const extension = parsed.ext || "";
  return `${safeBaseName}-${documentId}-${field}${extension}`;
}

async function fileExists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

async function resolveLocalFilePath(value) {
  if (typeof value !== "string") {
    return null;
  }

  for (const mapItem of mediaPathMap) {
    const matchedPrefix = mapItem.prefixes.find((prefix) =>
      value.startsWith(prefix),
    );
    if (!matchedPrefix) {
      continue;
    }

    const relativeRaw = value.slice(matchedPrefix.length);
    const relativeNormalized = decodeURIComponent(relativeRaw)
      .split("/")
      .filter(Boolean)
      .join(path.sep);

    for (const folder of mapItem.folders) {
      const candidate = path.resolve(folder, relativeNormalized);
      if (await fileExists(candidate)) {
        return candidate;
      }
    }

    const fallback = path.resolve(mapItem.folders[0], relativeNormalized);
    return fallback;
  }

  return null;
}

async function uploadLocalFileToImageKit({
  imageKit,
  localFilePath,
  documentId,
  field,
  imageKitFolder,
}) {
  const uploadFileName = buildUploadFileName({
    filePath: localFilePath,
    documentId,
    field,
  });

  return imageKit.upload({
    file: fs.createReadStream(localFilePath),
    fileName: uploadFileName,
    folder: imageKitFolder,
    useUniqueFileName: false,
  });
}

async function migrateField({
  imageKit,
  collectionName,
  doc,
  field,
  imageKitFolder,
  counterKey,
  dry,
}) {
  const currentValue = doc[field];

  if (!currentValue || typeof currentValue !== "string") {
    counters.alreadyMigratedOrSkipped += 1;
    return { changed: false, nextValue: null };
  }

  if (isRemoteUrl(currentValue)) {
    counters.alreadyMigratedOrSkipped += 1;
    return { changed: false, nextValue: null };
  }

  const localFilePath = await resolveLocalFilePath(currentValue);

  if (!localFilePath) {
    counters.alreadyMigratedOrSkipped += 1;
    return { changed: false, nextValue: null };
  }

  const exists = await fileExists(localFilePath);
  if (!exists) {
    counters.missingLocalFiles += 1;
    missingFiles.push({
      collection: collectionName,
      id: String(doc._id),
      name: doc.name || doc.fullName || "(unnamed)",
      field,
      source: currentValue,
      resolvedPath: localFilePath,
    });

    console.log(`  ${field}: MISSING FILE -> ${localFilePath}`);
    return { changed: false, nextValue: null };
  }

  if (dry) {
    console.log(`  ${field}: DRY RUN upload -> ${localFilePath}`);
    return { changed: false, nextValue: null };
  }

  try {
    const uploadResult = await uploadLocalFileToImageKit({
      imageKit,
      localFilePath,
      documentId: String(doc._id),
      field,
      imageKitFolder,
    });

    counters[counterKey] += 1;
    console.log(`  ${field}: UPLOAD SUCCESS`);
    return { changed: true, nextValue: uploadResult.url };
  } catch (error) {
    counters.uploadFailures += 1;
    failedUploads.push({
      collection: collectionName,
      id: String(doc._id),
      name: doc.name || doc.fullName || "(unnamed)",
      field,
      source: currentValue,
      resolvedPath: localFilePath,
      error: error.message,
    });

    console.log(`  ${field}: UPLOAD FAILED -> ${error.message}`);
    return { changed: false, nextValue: null };
  }
}

async function processCollection({
  imageKit,
  collectionName,
  model,
  labelField,
  checkCounterKey,
  fieldConfigs,
  dry,
}) {
  const docs = await model.find({}).lean();

  for (let index = 0; index < docs.length; index += 1) {
    const doc = docs[index];
    counters[checkCounterKey] += 1;

    const label =
      doc[labelField] || doc.name || doc.fullName || String(doc._id);
    console.log(
      `\n[${index + 1}/${docs.length}] ${collectionName} -> ${label}`,
    );

    const updatePayload = {};

    for (const config of fieldConfigs) {
      const fieldResult = await migrateField({
        imageKit,
        collectionName,
        doc,
        field: config.field,
        imageKitFolder: config.imageKitFolder,
        counterKey: config.counterKey,
        dry,
      });

      if (fieldResult.changed) {
        updatePayload[config.field] = fieldResult.nextValue;
      }
    }

    const hasChanges = Object.keys(updatePayload).length > 0;

    if (!hasChanges) {
      console.log("  MongoDB: NO CHANGE");
      continue;
    }

    if (dry) {
      console.log("  MongoDB: DRY RUN (not updated)");
      continue;
    }

    await model.updateOne({ _id: doc._id }, { $set: updatePayload });
    counters.docsUpdated += 1;
    console.log("  MongoDB: UPDATED");
  }
}

function printSummary() {
  const totalChecked =
    counters.foodsChecked +
    counters.foodPartnersChecked +
    counters.categoriesChecked +
    counters.usersChecked;

  console.log("\n========== MIGRATION SUMMARY ==========");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "REAL MIGRATION"}`);
  console.log(`Documents checked: ${totalChecked}`);
  console.log(`Foods checked: ${counters.foodsChecked}`);
  console.log(`Food partners checked: ${counters.foodPartnersChecked}`);
  console.log(`Categories checked: ${counters.categoriesChecked}`);
  console.log(`Users checked: ${counters.usersChecked}`);
  console.log(`Videos uploaded: ${counters.videosUploaded}`);
  console.log(`Thumbnails uploaded: ${counters.thumbnailsUploaded}`);
  console.log(
    `Restaurant images uploaded: ${counters.restaurantImagesUploaded}`,
  );
  console.log(`Category images uploaded: ${counters.categoryImagesUploaded}`);
  console.log(`User images uploaded: ${counters.userImagesUploaded}`);
  console.log(`Already migrated/skipped: ${counters.alreadyMigratedOrSkipped}`);
  console.log(`Missing local files: ${counters.missingLocalFiles}`);
  console.log(`Upload failures: ${counters.uploadFailures}`);
  console.log(`MongoDB documents updated: ${counters.docsUpdated}`);

  if (missingFiles.length) {
    console.log("\nMissing local files detail:");
    for (const item of missingFiles) {
      console.log(
        `- ${item.collection} ${item.id} ${item.field} | source=${item.source} | path=${item.resolvedPath}`,
      );
    }
  }

  if (failedUploads.length) {
    console.log("\nUpload failures detail:");
    for (const item of failedUploads) {
      console.log(
        `- ${item.collection} ${item.id} ${item.field} | source=${item.source} | error=${item.error}`,
      );
    }
  }

  console.log("=======================================");
}

async function run() {
  console.log("FoodieK media migration started.");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "REAL MIGRATION"}`);
  console.log("Recommendation: take a MongoDB backup before real migration.");

  if (!dryRun) {
    validateImageKitEnv();
  }

  await connectDB();
  const imageKit = dryRun ? null : getImageKitClient();

  await processCollection({
    imageKit,
    collectionName: "foods",
    model: Food,
    labelField: "name",
    checkCounterKey: "foodsChecked",
    dry: dryRun,
    fieldConfigs: [
      {
        field: "video",
        imageKitFolder: "/foodiek/videos",
        counterKey: "videosUploaded",
      },
      {
        field: "thumbnail",
        imageKitFolder: "/foodiek/thumbnails",
        counterKey: "thumbnailsUploaded",
      },
    ],
  });

  await processCollection({
    imageKit,
    collectionName: "foodpartners",
    model: FoodPartner,
    labelField: "name",
    checkCounterKey: "foodPartnersChecked",
    dry: dryRun,
    fieldConfigs: [
      {
        field: "avatar",
        imageKitFolder: "/foodiek/restaurants",
        counterKey: "restaurantImagesUploaded",
      },
      {
        field: "coverImage",
        imageKitFolder: "/foodiek/restaurants",
        counterKey: "restaurantImagesUploaded",
      },
    ],
  });

  await processCollection({
    imageKit,
    collectionName: "categories",
    model: Category,
    labelField: "name",
    checkCounterKey: "categoriesChecked",
    dry: dryRun,
    fieldConfigs: [
      {
        field: "image",
        imageKitFolder: "/foodiek/restaurants",
        counterKey: "categoryImagesUploaded",
      },
    ],
  });

  await processCollection({
    imageKit,
    collectionName: "users",
    model: User,
    labelField: "fullName",
    checkCounterKey: "usersChecked",
    dry: dryRun,
    fieldConfigs: [
      {
        field: "avatar",
        imageKitFolder: "/foodiek/users",
        counterKey: "userImagesUploaded",
      },
    ],
  });

  printSummary();
}

run()
  .catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
