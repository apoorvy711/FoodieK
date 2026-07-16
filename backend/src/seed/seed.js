require("dotenv").config();
const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const path = require("path");
const connectDB = require("../db/db");
const Category = require("../models/category.model");
const FoodPartner = require("../models/foodpartner.model");
const Food = require("../models/food.model");
const User = require("../models/user.model");
const Like = require("../models/likes.model");
const Save = require("../models/save.model");
const PaymentTransaction = require("../models/payment-transaction.model");
const thumbnailService = require("../services/video-thumbnail.service");
const storageService = require("../services/storage.services");
const { v4: uuid } = require("uuid");

function toPublicMediaPath(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace("/src/assets/", "/media/");
}

function normalizeSeedItem(item) {
  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [key, toPublicMediaPath(value)]),
  );
}

const frontendRoot = path.resolve(__dirname, "../../../frontend/vite-project");
const sourceVideoDirectory = path.join(frontendRoot, "src/assets/videos");
const publicThumbnailDirectory = path.join(
  frontendRoot,
  "public/media/thumbnails",
);
const seedMediaMode = (process.env.SEED_MEDIA_MODE || "local").toLowerCase();
const useImageKitSeedMedia = seedMediaMode === "imagekit";
const seedMediaUrlCache = new Map();

function isRemoteUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

async function resolveLocalMediaPath(mediaPath) {
  if (typeof mediaPath !== "string") {
    return null;
  }

  const mapping = [
    {
      prefix: "/media/videos/",
      baseFolders: [
        path.join(frontendRoot, "public/media/videos"),
        path.join(frontendRoot, "src/assets/videos"),
      ],
    },
    {
      prefix: "/media/thumbnails/",
      baseFolders: [path.join(frontendRoot, "public/media/thumbnails")],
    },
    {
      prefix: "/media/restaurant-images/",
      baseFolders: [
        path.join(frontendRoot, "public/media/restaurant-images"),
        path.join(frontendRoot, "src/assets/restaurant-images"),
      ],
    },
    {
      prefix: "/media/",
      baseFolders: [path.join(frontendRoot, "public/media")],
    },
    {
      prefix: "/src/assets/",
      baseFolders: [path.join(frontendRoot, "src/assets")],
    },
  ];

  for (const item of mapping) {
    if (!mediaPath.startsWith(item.prefix)) {
      continue;
    }

    const relativePath = mediaPath
      .slice(item.prefix.length)
      .split("/")
      .filter(Boolean)
      .join(path.sep);

    for (const baseFolder of item.baseFolders) {
      const candidate = path.resolve(baseFolder, relativePath);
      if (await fileExists(candidate)) {
        return candidate;
      }
    }

    return path.resolve(item.baseFolders[0], relativePath);
  }

  return null;
}

async function uploadSeedMediaByPath(mediaPath, folder) {
  const cacheKey = `${folder}:${mediaPath}`;
  if (seedMediaUrlCache.has(cacheKey)) {
    return seedMediaUrlCache.get(cacheKey);
  }

  const localPath = await resolveLocalMediaPath(mediaPath);
  if (!localPath || !(await fileExists(localPath))) {
    throw new Error(`Seed media file not found: ${mediaPath}`);
  }

  const fileBuffer = await fs.readFile(localPath);
  const parsed = path.parse(localPath);
  const uploaded = await storageService.uploadFile(
    fileBuffer,
    `${parsed.name}-${uuid()}${parsed.ext}`,
    {
      folder,
      useUniqueFileName: false,
    },
  );

  seedMediaUrlCache.set(cacheKey, uploaded.url);
  return uploaded.url;
}

async function resolveSeedMediaValue(value, folder) {
  const normalized = toPublicMediaPath(value);

  if (!useImageKitSeedMedia || typeof normalized !== "string") {
    return normalized;
  }

  if (isRemoteUrl(normalized)) {
    return normalized;
  }

  if (
    !normalized.startsWith("/media/") &&
    !normalized.startsWith("/src/assets/")
  ) {
    return normalized;
  }

  return uploadSeedMediaByPath(normalized, folder);
}

function buildThumbnailPublicPath(fileName) {
  return `/media/thumbnails/${path.parse(fileName).name}.jpg`;
}

async function ensureSeedThumbnail(fileName) {
  const sourcePath = path.join(sourceVideoDirectory, fileName);
  const outputPath = path.join(
    publicThumbnailDirectory,
    `${path.parse(fileName).name}.jpg`,
  );

  await fs.mkdir(publicThumbnailDirectory, { recursive: true });
  await thumbnailService.generateThumbnailFile({ sourcePath, outputPath });

  return buildThumbnailPublicPath(fileName);
}

async function resolveFoodSeedMedia(fileName) {
  if (!useImageKitSeedMedia) {
    return {
      video: `/media/videos/${fileName}`,
      thumbnail: await ensureSeedThumbnail(fileName),
    };
  }

  const sourcePath = path.join(sourceVideoDirectory, fileName);
  if (!(await fileExists(sourcePath))) {
    throw new Error(`Seed video file not found: ${sourcePath}`);
  }

  const videoBuffer = await fs.readFile(sourcePath);
  const videoParsed = path.parse(fileName);
  const uploadedVideo = await storageService.uploadFile(
    videoBuffer,
    `${videoParsed.name}-${uuid()}${videoParsed.ext}`,
    {
      folder: "/foodiek/videos",
      useUniqueFileName: false,
    },
  );

  await fs.mkdir(publicThumbnailDirectory, { recursive: true });

  const tempThumbnailPath = path.join(
    publicThumbnailDirectory,
    `seed-temp-${uuid()}.jpg`,
  );

  try {
    await thumbnailService.generateThumbnailFile({
      sourcePath,
      outputPath: tempThumbnailPath,
    });

    const thumbnailBuffer = await fs.readFile(tempThumbnailPath);
    const uploadedThumbnail = await storageService.uploadFile(
      thumbnailBuffer,
      `${videoParsed.name}-${uuid()}.jpg`,
      {
        folder: "/foodiek/thumbnails",
        useUniqueFileName: false,
      },
    );

    return {
      video: uploadedVideo.url,
      thumbnail: uploadedThumbnail.url,
    };
  } finally {
    await fs.rm(tempThumbnailPath, { force: true });
  }
}

const restaurantImages = [
  "/src/assets/restaurant-images/pexels-willianjusten-29366216.jpg",
  "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
  "/src/assets/restaurant-images/pexels-james-collington-2147687246-31045433.jpg",
  "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
  "/src/assets/restaurant-images/pexels-calvinseng-31233699.jpg",
];

const categorySeedData = [
  {
    name: "North Indian",
    image: "/src/assets/restaurant-images/pexels-willianjusten-29366216.jpg",
  },
  {
    name: "Italian",
    image:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    name: "Pizza",
    image:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    name: "Burgers",
    image:
      "/src/assets/restaurant-images/pexels-james-collington-2147687246-31045433.jpg",
  },
  {
    name: "Street Food",
    image: "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
  },
  {
    name: "Desserts",
    image:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    name: "Beverages",
    image: "/src/assets/restaurant-images/pexels-calvinseng-31233699.jpg",
  },
  {
    name: "Healthy",
    image: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
  },
  {
    name: "Cafe",
    image: "/src/assets/restaurant-images/pexels-calvinseng-31233699.jpg",
  },
  {
    name: "Wraps",
    image: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
  },
  {
    name: "Pasta",
    image:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    name: "Grills",
    image:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  },
];

const partnerSeedData = [
  {
    name: "Saffron Street",
    contactName: "Asha Kapoor",
    phone: "+91 98765 11223",
    address: "12, Gulmohar Lane, Delhi",
    email: "asha@saffronstreet.com",
    password: "FoodieK@123",
    avatar: "/src/assets/restaurant-images/pexels-willianjusten-29366216.jpg",
    coverImage:
      "/src/assets/restaurant-images/pexels-willianjusten-29366216.jpg",
    rating: 4.8,
    followersCount: 18240,
    totalMeals: 148,
    customersServed: 26480,
  },
  {
    name: "Urban Tandoor",
    contactName: "Nikhil Rao",
    phone: "+91 98980 33111",
    address: "88, Connaught Place, Delhi",
    email: "nikhil@urbantandoor.com",
    password: "FoodieK@123",
    avatar:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
    coverImage:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
    rating: 4.6,
    followersCount: 13890,
    totalMeals: 126,
    customersServed: 19520,
  },
  {
    name: "Fire & Spice",
    contactName: "Meera Iqbal",
    phone: "+91 98222 77880",
    address: "14, Sector 18, Gurgaon",
    email: "meera@fireandspice.com",
    password: "FoodieK@123",
    avatar: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
    coverImage: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
    rating: 4.5,
    followersCount: 10740,
    totalMeals: 93,
    customersServed: 16550,
  },
  {
    name: "Pizzeria Napoletana",
    contactName: "Luca Benedetti",
    phone: "+91 98111 22005",
    address: "20, Banjara Hills, Hyderabad",
    email: "luca@pizzerianapoletana.com",
    password: "FoodieK@123",
    avatar:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
    coverImage:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
    rating: 4.7,
    followersCount: 15430,
    totalMeals: 131,
    customersServed: 22860,
  },
  {
    name: "Burger & Brûlée",
    contactName: "Daniel Brooks",
    phone: "+91 98444 88776",
    address: "44, Churchgate, Mumbai",
    email: "daniel@burgerandbrulee.com",
    password: "FoodieK@123",
    avatar:
      "/src/assets/restaurant-images/pexels-james-collington-2147687246-31045433.jpg",
    coverImage:
      "/src/assets/restaurant-images/pexels-james-collington-2147687246-31045433.jpg",
    rating: 4.4,
    followersCount: 9110,
    totalMeals: 82,
    customersServed: 13240,
  },
  {
    name: "Waffle & Whisk",
    contactName: "Priya Menon",
    phone: "+91 98001 66789",
    address: "6, Indiranagar, Bangalore",
    email: "priya@waffleandwhisk.com",
    password: "FoodieK@123",
    avatar:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
    coverImage:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
    rating: 4.6,
    followersCount: 9540,
    totalMeals: 68,
    customersServed: 12180,
  },
  {
    name: "Momo House",
    contactName: "Tenzin Dorjee",
    phone: "+91 97650 22551",
    address: "9, Kamla Nagar, Jaipur",
    email: "tenzin@momo-house.com",
    password: "FoodieK@123",
    avatar: "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
    coverImage:
      "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
    rating: 4.5,
    followersCount: 8620,
    totalMeals: 77,
    customersServed: 11750,
  },
  {
    name: "Bowl Street",
    contactName: "Ava Singh",
    phone: "+91 98233 44556",
    address: "32, Ashok Vihar, Chandigarh",
    email: "ava@bowlstreet.com",
    password: "FoodieK@123",
    avatar: "/src/assets/restaurant-images/pexels-calvinseng-31233699.jpg",
    coverImage: "/src/assets/restaurant-images/pexels-calvinseng-31233699.jpg",
    rating: 4.7,
    followersCount: 10120,
    totalMeals: 90,
    customersServed: 14820,
  },
];

const foodSeedData = [
  {
    file: "10200311-hd_1080_1920_25fps.mp4",
    name: "Butter Chicken",
    partner: "Saffron Street",
    category: "North Indian",
    price: 280,
    description:
      "Silky tomato gravy with charred chicken and a rich buttery finish.",
    ingredients: ["Chicken thigh", "Tomato", "Cream", "Butter", "Kasuri methi"],
    preparationTime: 40,
    foodType: "Non Veg",
    cuisine: "North Indian",
    spiceLevel: "Medium",
    tags: ["comfort", "signature", "dinner"],
    rating: 4.7,
    likeCount: 980,
    savesCount: 176,
    commentsCount: 98,
    shareCount: 61,
    viewCount: 1240,
    thumbnail:
      "/src/assets/restaurant-images/pexels-willianjusten-29366216.jpg",
  },
  {
    file: "10200320-hd_1080_1920_25fps.mp4",
    name: "Smoky Butter Chicken",
    partner: "Urban Tandoor",
    category: "North Indian",
    price: 260,
    description:
      "Slow-cooked chicken in a smoky tomato gravy with a charred finish.",
    ingredients: ["Chicken", "Tomato", "Onion", "Cream", "Tandoori masala"],
    preparationTime: 38,
    foodType: "Non Veg",
    cuisine: "North Indian",
    spiceLevel: "Medium",
    tags: ["smoky", "grill", "comfort"],
    rating: 4.6,
    likeCount: 712,
    savesCount: 104,
    commentsCount: 61,
    shareCount: 47,
    viewCount: 958,
    thumbnail:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  },
  {
    file: "10907636-hd_1080_1920_30fps.mp4",
    name: "Paneer Tikka",
    partner: "Saffron Street",
    category: "North Indian",
    price: 220,
    description:
      "Soft paneer cubes marinated in spices and grilled until lightly charred.",
    ingredients: ["Paneer", "Yogurt", "Capsicum", "Turmeric", "Cumin"],
    preparationTime: 24,
    foodType: "Veg",
    cuisine: "North Indian",
    spiceLevel: "Medium",
    tags: ["starter", "grilled", "vegetarian"],
    rating: 4.5,
    likeCount: 410,
    savesCount: 87,
    commentsCount: 42,
    shareCount: 29,
    viewCount: 720,
    thumbnail:
      "/src/assets/restaurant-images/pexels-willianjusten-29366216.jpg",
  },
  {
    file: "11131968-hd_1080_1920_25fps.mp4",
    name: "Chicken Biryani",
    partner: "Urban Tandoor",
    category: "North Indian",
    price: 320,
    description:
      "Layered basmati rice and marinated chicken slow-cooked with aromatic spices.",
    ingredients: ["Basmati rice", "Chicken", "Onion", "Mint", "Saffron"],
    preparationTime: 45,
    foodType: "Non Veg",
    cuisine: "North Indian",
    spiceLevel: "Medium",
    tags: ["biryani", "festival", "rice"],
    rating: 4.8,
    likeCount: 1180,
    savesCount: 214,
    commentsCount: 122,
    shareCount: 84,
    viewCount: 1420,
    thumbnail:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  },
  {
    file: "11588447-hd_1080_1920_24fps.mp4",
    name: "Chicken Shawarma",
    partner: "Fire & Spice",
    category: "Wraps",
    price: 220,
    description:
      "Succulent chicken wrapped in warm bread with garlic tahini and crunchy salad.",
    ingredients: ["Chicken", "Flatbread", "Tahini", "Lettuce", "Pickle"],
    preparationTime: 22,
    foodType: "Non Veg",
    cuisine: "Middle Eastern",
    spiceLevel: "Medium",
    tags: ["wrap", "handheld", "spicy"],
    rating: 4.5,
    likeCount: 610,
    savesCount: 96,
    commentsCount: 48,
    shareCount: 37,
    viewCount: 894,
    thumbnail: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
  },
  {
    file: "11895617-hd_1920_1080_60fps.mp4",
    name: "Hummus Bowl",
    partner: "Fire & Spice",
    category: "Healthy",
    price: 190,
    description:
      "Creamy hummus, roasted vegetables, and toasted pita in a wholesome bowl.",
    ingredients: ["Chickpeas", "Olive oil", "Cucumber", "Pita", "Lemon"],
    preparationTime: 14,
    foodType: "Veg",
    cuisine: "Mediterranean",
    spiceLevel: "Mild",
    tags: ["healthy", "fresh", "lunch"],
    rating: 4.4,
    likeCount: 289,
    savesCount: 122,
    commentsCount: 31,
    shareCount: 18,
    viewCount: 490,
    thumbnail: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
  },
  {
    file: "12063840_1920_1080_30fps.mp4",
    name: "Margherita Pizza",
    partner: "Pizzeria Napoletana",
    category: "Pizza",
    price: 360,
    description:
      "Wood-fired pizza with tomato, basil, and a generous blanket of mozzarella.",
    ingredients: ["Mozzarella", "Tomato", "Basil", "Dough", "Olive oil"],
    preparationTime: 24,
    foodType: "Veg",
    cuisine: "Italian",
    spiceLevel: "Mild",
    tags: ["classic", "cheesy", "viral"],
    rating: 4.8,
    likeCount: 1340,
    savesCount: 246,
    commentsCount: 144,
    shareCount: 102,
    viewCount: 1780,
    thumbnail:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    file: "12213680_1080_1920_30fps.mp4",
    name: "Pepperoni Pizza",
    partner: "Pizzeria Napoletana",
    category: "Pizza",
    price: 420,
    description:
      "Bold pepperoni slices layered over a crisp crust and bubbling cheese.",
    ingredients: ["Pepperoni", "Mozzarella", "Tomato", "Dough", "Oregano"],
    preparationTime: 24,
    foodType: "Non Veg",
    cuisine: "Italian",
    spiceLevel: "Medium",
    tags: ["pepperoni", "crispy", "shareable"],
    rating: 4.7,
    likeCount: 1090,
    savesCount: 191,
    commentsCount: 114,
    shareCount: 73,
    viewCount: 1320,
    thumbnail:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    file: "12265876_1080_1920_60fps.mp4",
    name: "Veggie Pizza",
    partner: "Pizzeria Napoletana",
    category: "Pizza",
    price: 340,
    description:
      "A colorful medley of vegetables and mozzarella on a crisp Neapolitan base.",
    ingredients: ["Mozzarella", "Bell pepper", "Olive", "Onion", "Dough"],
    preparationTime: 22,
    foodType: "Veg",
    cuisine: "Italian",
    spiceLevel: "Mild",
    tags: ["veg", "colorful", "comfort"],
    rating: 4.5,
    likeCount: 530,
    savesCount: 98,
    commentsCount: 51,
    shareCount: 33,
    viewCount: 760,
    thumbnail:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    file: "12570659_1080_1920_30fps.mp4",
    name: "BBQ Chicken Pizza",
    partner: "Pizzeria Napoletana",
    category: "Pizza",
    price: 450,
    description:
      "Smoky barbecue chicken with caramelized onions on a blistered crust.",
    ingredients: ["Chicken", "BBQ sauce", "Onion", "Mozzarella", "Dough"],
    preparationTime: 26,
    foodType: "Non Veg",
    cuisine: "Italian",
    spiceLevel: "Medium",
    tags: ["bbq", "smoky", "indulgent"],
    rating: 4.6,
    likeCount: 760,
    savesCount: 134,
    commentsCount: 72,
    shareCount: 49,
    viewCount: 1010,
    thumbnail:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    file: "12662121-hd_1080_2048_50fps.mp4",
    name: "Classic Cheeseburger",
    partner: "Burger & Brûlée",
    category: "Burgers",
    price: 260,
    description:
      "A juicy beef burger with melted cheese, pickle, and house sauce.",
    ingredients: ["Beef patty", "Cheese", "Bun", "Pickle", "Onion"],
    preparationTime: 20,
    foodType: "Non Veg",
    cuisine: "American",
    spiceLevel: "Medium",
    tags: ["burger", "juicy", "classic"],
    rating: 4.6,
    likeCount: 830,
    savesCount: 128,
    commentsCount: 79,
    shareCount: 54,
    viewCount: 1180,
    thumbnail:
      "/src/assets/restaurant-images/pexels-james-collington-2147687246-31045433.jpg",
  },
  {
    file: "12662121-hd_1080_2048_50fps (1).mp4",
    name: "Spicy Chicken Burger",
    partner: "Burger & Brûlée",
    category: "Burgers",
    price: 280,
    description:
      "Crisp chicken burger layered with spicy sauce and crunchy slaw.",
    ingredients: ["Chicken", "Bun", "Slaw", "Spicy mayo", "Pickle"],
    preparationTime: 21,
    foodType: "Non Veg",
    cuisine: "American",
    spiceLevel: "Hot",
    tags: ["spicy", "crispy", "bold"],
    rating: 4.5,
    likeCount: 690,
    savesCount: 112,
    commentsCount: 66,
    shareCount: 43,
    viewCount: 930,
    thumbnail:
      "/src/assets/restaurant-images/pexels-james-collington-2147687246-31045433.jpg",
  },
  {
    file: "12747115_1920_1080_25fps.mp4",
    name: "Loaded Fries",
    partner: "Burger & Brûlée",
    category: "Burgers",
    price: 170,
    description:
      "Crispy fries topped with cheese sauce, herbs, and a smoky drizzle.",
    ingredients: ["Potato", "Cheese", "Herbs", "Mayo", "Paprika"],
    preparationTime: 14,
    foodType: "Veg",
    cuisine: "American",
    spiceLevel: "Mild",
    tags: ["sides", "comfort", "shareable"],
    rating: 4.3,
    likeCount: 360,
    savesCount: 74,
    commentsCount: 34,
    shareCount: 20,
    viewCount: 560,
    thumbnail:
      "/src/assets/restaurant-images/pexels-james-collington-2147687246-31045433.jpg",
  },
  {
    file: "12888249_1080_1920_30fps.mp4",
    name: "Belgian Waffle",
    partner: "Waffle & Whisk",
    category: "Desserts",
    price: 180,
    description: "Golden waffle with warm syrup and a soft, airy center.",
    ingredients: ["Flour", "Egg", "Butter", "Milk", "Maple syrup"],
    preparationTime: 18,
    foodType: "Veg",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["brunch", "sweet", "warm"],
    rating: 4.7,
    likeCount: 720,
    savesCount: 148,
    commentsCount: 58,
    shareCount: 39,
    viewCount: 960,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "12888272_1920_1080_25fps.mp4",
    name: "Pancake Stack",
    partner: "Waffle & Whisk",
    category: "Desserts",
    price: 160,
    description:
      "Fluffy pancakes served with whipped butter and berry compote.",
    ingredients: ["Flour", "Egg", "Butter", "Berry compote", "Cream"],
    preparationTime: 16,
    foodType: "Veg",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["breakfast", "fluffy", "cozy"],
    rating: 4.5,
    likeCount: 510,
    savesCount: 112,
    commentsCount: 44,
    shareCount: 27,
    viewCount: 760,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "12888307_1080_1920_30fps.mp4",
    name: "Strawberry Smoothie",
    partner: "Waffle & Whisk",
    category: "Beverages",
    price: 140,
    description:
      "A chilled berry smoothie with a creamy finish and fresh fruit garnish.",
    ingredients: ["Strawberry", "Banana", "Milk", "Honey", "Ice"],
    preparationTime: 8,
    foodType: "Vegan",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["smoothie", "fruit", "refreshing"],
    rating: 4.4,
    likeCount: 430,
    savesCount: 131,
    commentsCount: 39,
    shareCount: 23,
    viewCount: 650,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "12888309_1080_1920_30fps.mp4",
    name: "Veg Momos",
    partner: "Momo House",
    category: "Street Food",
    price: 160,
    description:
      "Steamed dumplings filled with fresh vegetables and served with a zingy dip.",
    ingredients: ["Cabbage", "Carrot", "Garlic", "Soy", "Chili oil"],
    preparationTime: 18,
    foodType: "Veg",
    cuisine: "Tibetan",
    spiceLevel: "Medium",
    tags: ["momos", "dumplings", "comfort"],
    rating: 4.6,
    likeCount: 620,
    savesCount: 118,
    commentsCount: 54,
    shareCount: 36,
    viewCount: 910,
    thumbnail:
      "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
  },
  {
    file: "12888314_1080_1920_30fps.mp4",
    name: "Chicken Momos",
    partner: "Momo House",
    category: "Street Food",
    price: 210,
    description: "Juicy chicken dumplings with aromatic herbs and a smoky dip.",
    ingredients: ["Chicken", "Garlic", "Ginger", "Coriander", "Soy"],
    preparationTime: 20,
    foodType: "Non Veg",
    cuisine: "Tibetan",
    spiceLevel: "Medium",
    tags: ["momos", "savory", "spicy"],
    rating: 4.7,
    likeCount: 710,
    savesCount: 126,
    commentsCount: 61,
    shareCount: 41,
    viewCount: 1010,
    thumbnail:
      "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
  },
  {
    file: "12888321_1080_1920_30fps.mp4",
    name: "Chili Garlic Noodles",
    partner: "Momo House",
    category: "Street Food",
    price: 190,
    description:
      "Wok-tossed noodles with chili heat, garlic, and a glossy sauce.",
    ingredients: ["Noodles", "Garlic", "Soy sauce", "Chili", "Scallions"],
    preparationTime: 15,
    foodType: "Veg",
    cuisine: "Asian",
    spiceLevel: "Hot",
    tags: ["noodles", "street-food", "spicy"],
    rating: 4.4,
    likeCount: 450,
    savesCount: 82,
    commentsCount: 40,
    shareCount: 25,
    viewCount: 690,
    thumbnail:
      "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
  },
  {
    file: "12888336_1080_1920_30fps.mp4",
    name: "Chicken Seekh Kebab",
    partner: "Urban Tandoor",
    category: "Grills",
    price: 240,
    description:
      "Char-grilled minced chicken skewers served with mint chutney.",
    ingredients: ["Chicken mince", "Onion", "Coriander", "Chili", "Ginger"],
    preparationTime: 24,
    foodType: "Non Veg",
    cuisine: "North Indian",
    spiceLevel: "Medium",
    tags: ["kebab", "smoky", "starter"],
    rating: 4.6,
    likeCount: 760,
    savesCount: 110,
    commentsCount: 64,
    shareCount: 44,
    viewCount: 1020,
    thumbnail:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  },
  {
    file: "12888340_1080_1920_30fps.mp4",
    name: "Lamb Kofta",
    partner: "Urban Tandoor",
    category: "Grills",
    price: 320,
    description: "Juicy lamb kofta with a deep char and bright herb garnish.",
    ingredients: ["Lamb", "Onion", "Coriander", "Garlic", "Spices"],
    preparationTime: 28,
    foodType: "Non Veg",
    cuisine: "Middle Eastern",
    spiceLevel: "Medium",
    tags: ["kofta", "rich", "dinner"],
    rating: 4.5,
    likeCount: 560,
    savesCount: 90,
    commentsCount: 50,
    shareCount: 32,
    viewCount: 820,
    thumbnail:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  },
  {
    file: "12920559_1080_1920_25fps.mp4",
    name: "Buddha Bowl",
    partner: "Bowl Street",
    category: "Healthy",
    price: 220,
    description:
      "A colorful bowl of grains, greens, and roasted vegetables with a tangy dressing.",
    ingredients: [
      "Quinoa",
      "Spinach",
      "Roasted vegetables",
      "Tahini",
      "Pumpkin seeds",
    ],
    preparationTime: 14,
    foodType: "Vegan",
    cuisine: "Healthy",
    spiceLevel: "Mild",
    tags: ["wellness", "fresh", "protein"],
    rating: 4.6,
    likeCount: 610,
    savesCount: 145,
    commentsCount: 52,
    shareCount: 34,
    viewCount: 860,
    thumbnail: "/src/assets/restaurant-images/pexels-calvinseng-31233699.jpg",
  },
  {
    file: "13111088_1080_1920_25fps.mp4",
    name: "Avocado Toast",
    partner: "Bowl Street",
    category: "Healthy",
    price: 180,
    description:
      "Toasted sourdough topped with avocado, herbs, and a bright citrus finish.",
    ingredients: ["Sourdough", "Avocado", "Lemon", "Chili flakes", "Herbs"],
    preparationTime: 10,
    foodType: "Vegan",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["brunch", "healthy", "trendy"],
    rating: 4.4,
    likeCount: 480,
    savesCount: 118,
    commentsCount: 41,
    shareCount: 24,
    viewCount: 700,
    thumbnail: "/src/assets/restaurant-images/pexels-calvinseng-31233699.jpg",
  },
  {
    file: "13351825_1080_1920_25fps.mp4",
    name: "Detox Smoothie",
    partner: "Bowl Street",
    category: "Beverages",
    price: 140,
    description:
      "A green smoothie with citrus, spinach, and a clean refreshing finish.",
    ingredients: ["Spinach", "Cucumber", "Lemon", "Banana", "Ice"],
    preparationTime: 7,
    foodType: "Vegan",
    cuisine: "Healthy",
    spiceLevel: "Mild",
    tags: ["smoothie", "wellness", "clean"],
    rating: 4.3,
    likeCount: 360,
    savesCount: 96,
    commentsCount: 31,
    shareCount: 18,
    viewCount: 560,
    thumbnail: "/src/assets/restaurant-images/pexels-calvinseng-31233699.jpg",
  },
  {
    file: "13450737_1080_1920_30fps.mp4",
    name: "Salmon Sushi Roll",
    partner: "Bowl Street",
    category: "Healthy",
    price: 380,
    description:
      "Fresh salmon roll with crisp cucumber and a delicate rice finish.",
    ingredients: ["Salmon", "Rice", "Nori", "Cucumber", "Wasabi"],
    preparationTime: 18,
    foodType: "Non Veg",
    cuisine: "Japanese",
    spiceLevel: "Mild",
    tags: ["sushi", "premium", "aesthetic"],
    rating: 4.7,
    likeCount: 540,
    savesCount: 103,
    commentsCount: 57,
    shareCount: 38,
    viewCount: 820,
    thumbnail: "/src/assets/restaurant-images/pexels-calvinseng-31233699.jpg",
  },
  {
    file: "13573226_1080_1920_60fps.mp4",
    name: "Veg Tempura Roll",
    partner: "Bowl Street",
    category: "Healthy",
    price: 320,
    description: "Crisp tempura vegetables folded into a light sushi roll.",
    ingredients: ["Rice", "Nori", "Tempura vegetables", "Soy", "Sesame"],
    preparationTime: 16,
    foodType: "Veg",
    cuisine: "Japanese",
    spiceLevel: "Mild",
    tags: ["tempura", "crispy", "modern"],
    rating: 4.5,
    likeCount: 420,
    savesCount: 89,
    commentsCount: 37,
    shareCount: 23,
    viewCount: 650,
    thumbnail: "/src/assets/restaurant-images/pexels-calvinseng-31233699.jpg",
  },
  {
    file: "13579725_1080_1920_30fps.mp4",
    name: "Matcha Latte",
    partner: "Waffle & Whisk",
    category: "Beverages",
    price: 180,
    description:
      "Creamy matcha latte with a frothy finish and mellow bitterness.",
    ingredients: ["Matcha", "Milk", "Sugar", "Ice"],
    preparationTime: 8,
    foodType: "Vegan",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["matcha", "calm", "premium"],
    rating: 4.6,
    likeCount: 590,
    savesCount: 142,
    commentsCount: 51,
    shareCount: 30,
    viewCount: 840,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "13643468_1080_1920_30fps.mp4",
    name: "Shakshuka",
    partner: "Waffle & Whisk",
    category: "Cafe",
    price: 220,
    description: "Poached eggs in a spiced tomato skillet with warm bread.",
    ingredients: ["Eggs", "Tomato", "Pepper", "Bread", "Olive oil"],
    preparationTime: 20,
    foodType: "Veg",
    cuisine: "Mediterranean",
    spiceLevel: "Medium",
    tags: ["brunch", "cozy", "hearty"],
    rating: 4.4,
    likeCount: 320,
    savesCount: 71,
    commentsCount: 29,
    shareCount: 16,
    viewCount: 500,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "14483966_1080_1920_24fps.mp4",
    name: "Cappuccino",
    partner: "Waffle & Whisk",
    category: "Beverages",
    price: 150,
    description:
      "Espresso-based cappuccino with velvety foam and a rich aroma.",
    ingredients: ["Espresso", "Milk", "Sugar"],
    preparationTime: 6,
    foodType: "Veg",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["coffee", "morning", "cafe"],
    rating: 4.5,
    likeCount: 470,
    savesCount: 97,
    commentsCount: 42,
    shareCount: 29,
    viewCount: 710,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "14487866_1080_1920_60fps.mp4",
    name: "Lemon Tart",
    partner: "Waffle & Whisk",
    category: "Desserts",
    price: 200,
    description: "Bright citrus tart with buttery pastry and a glossy finish.",
    ingredients: ["Flour", "Butter", "Lemon", "Sugar", "Cream"],
    preparationTime: 22,
    foodType: "Veg",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["tart", "citrus", "elegant"],
    rating: 4.6,
    likeCount: 560,
    savesCount: 126,
    commentsCount: 48,
    shareCount: 31,
    viewCount: 820,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "14537808_1080_1920_60fps.mp4",
    name: "Chicken Kebab Platter",
    partner: "Urban Tandoor",
    category: "Grills",
    price: 300,
    description:
      "A generous platter of grilled chicken skewers with pickled onions.",
    ingredients: ["Chicken", "Onion", "Mint", "Yogurt", "Spices"],
    preparationTime: 28,
    foodType: "Non Veg",
    cuisine: "North Indian",
    spiceLevel: "Medium",
    tags: ["shareable", "grilled", "dinner"],
    rating: 4.6,
    likeCount: 720,
    savesCount: 108,
    commentsCount: 62,
    shareCount: 43,
    viewCount: 980,
    thumbnail:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  },
  {
    file: "14753606_1920_1080_25fps.mp4",
    name: "Masala Chai",
    partner: "Urban Tandoor",
    category: "Beverages",
    price: 90,
    description: "Aromatic tea brewed with spices and a silky finish.",
    ingredients: ["Tea", "Cardamom", "Ginger", "Milk", "Sugar"],
    preparationTime: 8,
    foodType: "Veg",
    cuisine: "North Indian",
    spiceLevel: "Mild",
    tags: ["chai", "comfort", "evening"],
    rating: 4.4,
    likeCount: 390,
    savesCount: 98,
    commentsCount: 36,
    shareCount: 22,
    viewCount: 630,
    thumbnail:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  },
  {
    file: "14776894_1080_1920_24fps.mp4",
    name: "Gulab Jamun",
    partner: "Saffron Street",
    category: "Desserts",
    price: 140,
    description: "Soft milk-solid dumplings soaked in fragrant rose syrup.",
    ingredients: ["Khoya", "Sugar", "Rose water", "Cardamom", "Flour"],
    preparationTime: 24,
    foodType: "Veg",
    cuisine: "North Indian",
    spiceLevel: "Mild",
    tags: ["sweet", "festive", "indulgent"],
    rating: 4.6,
    likeCount: 580,
    savesCount: 126,
    commentsCount: 49,
    shareCount: 35,
    viewCount: 860,
    thumbnail:
      "/src/assets/restaurant-images/pexels-willianjusten-29366216.jpg",
  },
  {
    file: "14887166_1080_1920_30fps.mp4",
    name: "Falafel Wrap",
    partner: "Fire & Spice",
    category: "Wraps",
    price: 180,
    description:
      "Crunchy falafel tucked into warm bread with fresh greens and tahini.",
    ingredients: ["Falafel", "Flatbread", "Lettuce", "Tahini", "Pickle"],
    preparationTime: 18,
    foodType: "Vegan",
    cuisine: "Middle Eastern",
    spiceLevel: "Medium",
    tags: ["falafel", "fresh", "handheld"],
    rating: 4.4,
    likeCount: 310,
    savesCount: 78,
    commentsCount: 28,
    shareCount: 16,
    viewCount: 520,
    thumbnail: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
  },
  {
    file: "14923399_1280_720_30fps.mp4",
    name: "Garlic Bread",
    partner: "Pizzeria Napoletana",
    category: "Pizza",
    price: 140,
    description:
      "Buttery garlic bread finished with a toasted crust and herbs.",
    ingredients: ["Bread", "Butter", "Garlic", "Parsley", "Cheese"],
    preparationTime: 12,
    foodType: "Veg",
    cuisine: "Italian",
    spiceLevel: "Mild",
    tags: ["cheesy", "shareable", "side"],
    rating: 4.4,
    likeCount: 420,
    savesCount: 91,
    commentsCount: 38,
    shareCount: 24,
    viewCount: 620,
    thumbnail:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    file: "15102399_1080_1920_30fps.mp4",
    name: "Tiramisu",
    partner: "Pizzeria Napoletana",
    category: "Desserts",
    price: 220,
    description:
      "Layered coffee-soaked sponge with mascarpone and cocoa dusting.",
    ingredients: ["Espresso", "Mascarpone", "Ladyfingers", "Cocoa", "Sugar"],
    preparationTime: 20,
    foodType: "Veg",
    cuisine: "Italian",
    spiceLevel: "Mild",
    tags: ["dessert", "elegant", "cafe"],
    rating: 4.7,
    likeCount: 760,
    savesCount: 154,
    commentsCount: 70,
    shareCount: 48,
    viewCount: 1040,
    thumbnail:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    file: "15478967_1080_1920_30fps.mp4",
    name: "Vanilla Milkshake",
    partner: "Burger & Brûlée",
    category: "Beverages",
    price: 160,
    description:
      "A thick milkshake with vanilla cream and a nostalgic diner vibe.",
    ingredients: ["Milk", "Ice cream", "Vanilla", "Sugar"],
    preparationTime: 6,
    foodType: "Veg",
    cuisine: "American",
    spiceLevel: "Mild",
    tags: ["shake", "creamy", "nostalgic"],
    rating: 4.4,
    likeCount: 400,
    savesCount: 95,
    commentsCount: 37,
    shareCount: 21,
    viewCount: 610,
    thumbnail:
      "/src/assets/restaurant-images/pexels-james-collington-2147687246-31045433.jpg",
  },
  {
    file: "15541517_1080_1920_25fps.mp4",
    name: "Cold Brew",
    partner: "Waffle & Whisk",
    category: "Beverages",
    price: 140,
    description: "Dark, chilled cold brew with a smooth and balanced finish.",
    ingredients: ["Coffee", "Water", "Ice"],
    preparationTime: 6,
    foodType: "Vegan",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["coffee", "chilled", "brunch"],
    rating: 4.5,
    likeCount: 460,
    savesCount: 111,
    commentsCount: 40,
    shareCount: 24,
    viewCount: 700,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "15666121-hd_1080_1920_60fps.mp4",
    name: "Momo Platter",
    partner: "Momo House",
    category: "Street Food",
    price: 260,
    description:
      "A generous platter of dumplings served with fiery sauces and herbs.",
    ingredients: ["Vegetables", "Chicken", "Soy", "Garlic", "Chili"],
    preparationTime: 18,
    foodType: "Veg",
    cuisine: "Tibetan",
    spiceLevel: "Medium",
    tags: ["shareable", "cozy", "street-food"],
    rating: 4.6,
    likeCount: 640,
    savesCount: 115,
    commentsCount: 56,
    shareCount: 34,
    viewCount: 900,
    thumbnail:
      "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
  },
  {
    file: "15994005_1080_1920_60fps.mp4",
    name: "Ginger Tea",
    partner: "Momo House",
    category: "Beverages",
    price: 90,
    description: "A fragrant cup of ginger tea with a soothing finish.",
    ingredients: ["Ginger", "Tea", "Honey", "Water"],
    preparationTime: 7,
    foodType: "Vegan",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["tea", "herbal", "soothing"],
    rating: 4.3,
    likeCount: 310,
    savesCount: 76,
    commentsCount: 29,
    shareCount: 16,
    viewCount: 480,
    thumbnail:
      "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
  },
  {
    file: "19107070-hd_1080_1920_30fps.mp4",
    name: "Hyderabadi Dum Biryani",
    partner: "Urban Tandoor",
    category: "North Indian",
    price: 360,
    description:
      "Hand-layered dum biryani with saffron-rich rice and tender meat.",
    ingredients: ["Basmati rice", "Chicken", "Mint", "Saffron", "Ghee"],
    preparationTime: 50,
    foodType: "Non Veg",
    cuisine: "Hyderabadi",
    spiceLevel: "Medium",
    tags: ["premium", "biryani", "festive"],
    rating: 4.8,
    likeCount: 1260,
    savesCount: 228,
    commentsCount: 132,
    shareCount: 91,
    viewCount: 1540,
    thumbnail:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  },
  {
    file: "19107092-hd_1080_1920_30fps.mp4",
    name: "Paneer Butter Masala",
    partner: "Saffron Street",
    category: "North Indian",
    price: 260,
    description:
      "Soft paneer in a creamy tomato gravy brightened with kasuri methi.",
    ingredients: ["Paneer", "Tomato", "Cream", "Butter", "Kasuri methi"],
    preparationTime: 32,
    foodType: "Veg",
    cuisine: "North Indian",
    spiceLevel: "Medium",
    tags: ["creamy", "comfort", "vegetarian"],
    rating: 4.7,
    likeCount: 880,
    savesCount: 168,
    commentsCount: 90,
    shareCount: 58,
    viewCount: 1180,
    thumbnail:
      "/src/assets/restaurant-images/pexels-willianjusten-29366216.jpg",
  },
  {
    file: "19389080-hd_1080_1920_60fps.mp4",
    name: "Chicken Pulao",
    partner: "Urban Tandoor",
    category: "North Indian",
    price: 260,
    description:
      "A fragrant one-pot rice with chicken, caramelized onion, and warm spice.",
    ingredients: ["Chicken", "Rice", "Onion", "Cumin", "Ghee"],
    preparationTime: 34,
    foodType: "Non Veg",
    cuisine: "North Indian",
    spiceLevel: "Medium",
    tags: ["comfort", "family meal", "rice"],
    rating: 4.5,
    likeCount: 530,
    savesCount: 100,
    commentsCount: 46,
    shareCount: 32,
    viewCount: 800,
    thumbnail:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  },
  {
    file: "19480315-hd_1080_1920_60fps.mp4",
    name: "Mini Burger Trio",
    partner: "Burger & Brûlée",
    category: "Burgers",
    price: 240,
    description:
      "Three tiny sliders with different sauces for a fun sharing plate.",
    ingredients: ["Beef", "Bun", "Cheese", "Pickle", "Onion"],
    preparationTime: 16,
    foodType: "Non Veg",
    cuisine: "American",
    spiceLevel: "Medium",
    tags: ["sliders", "shareable", "fun"],
    rating: 4.3,
    likeCount: 320,
    savesCount: 63,
    commentsCount: 29,
    shareCount: 17,
    viewCount: 490,
    thumbnail:
      "/src/assets/restaurant-images/pexels-james-collington-2147687246-31045433.jpg",
  },
  {
    file: "19834780-hd_1080_1920_24fps.mp4",
    name: "Berry Cheesecake",
    partner: "Waffle & Whisk",
    category: "Desserts",
    price: 220,
    description:
      "Silky cheesecake with fresh berry topping and a buttery crust.",
    ingredients: ["Cream cheese", "Berry", "Crust", "Sugar", "Cream"],
    preparationTime: 24,
    foodType: "Veg",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["dessert", "creamy", "indulgent"],
    rating: 4.7,
    likeCount: 780,
    savesCount: 163,
    commentsCount: 71,
    shareCount: 49,
    viewCount: 1080,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "19981549-hd_1080_1920_24fps.mp4",
    name: "Mochi",
    partner: "Waffle & Whisk",
    category: "Desserts",
    price: 180,
    description:
      "Soft chewy mochi with a gentle sweetness and a modern finish.",
    ingredients: ["Glutinous rice", "Sugar", "Mango", "Matcha"],
    preparationTime: 12,
    foodType: "Vegan",
    cuisine: "Japanese",
    spiceLevel: "Mild",
    tags: ["mochi", "soft", "trendy"],
    rating: 4.4,
    likeCount: 340,
    savesCount: 94,
    commentsCount: 30,
    shareCount: 20,
    viewCount: 510,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "20712257-hd_1080_1920_60fps.mp4",
    name: "Chicken Caesar Wrap",
    partner: "Fire & Spice",
    category: "Wraps",
    price: 220,
    description:
      "Chicken wrap with crisp romaine, parmesan, and a creamy dressing.",
    ingredients: ["Chicken", "Romaine", "Parmesan", "Dressing", "Flatbread"],
    preparationTime: 16,
    foodType: "Non Veg",
    cuisine: "American",
    spiceLevel: "Medium",
    tags: ["wrap", "lunch", "handheld"],
    rating: 4.4,
    likeCount: 370,
    savesCount: 80,
    commentsCount: 33,
    shareCount: 19,
    viewCount: 560,
    thumbnail: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
  },
  {
    file: "4146191-hd_1920_1080_24fps.mp4",
    name: "Veggie Burger",
    partner: "Burger & Brûlée",
    category: "Burgers",
    price: 240,
    description:
      "A grilled vegetable patty with house sauce and fresh toppings.",
    ingredients: ["Veg patty", "Bun", "Tomato", "Lettuce", "Sauce"],
    preparationTime: 18,
    foodType: "Veg",
    cuisine: "American",
    spiceLevel: "Mild",
    tags: ["plant-based", "trendy", "burger"],
    rating: 4.3,
    likeCount: 290,
    savesCount: 70,
    commentsCount: 26,
    shareCount: 15,
    viewCount: 450,
    thumbnail:
      "/src/assets/restaurant-images/pexels-james-collington-2147687246-31045433.jpg",
  },
  {
    file: "4199499-hd_1920_1080_30fps.mp4",
    name: "Chicken Caesar Salad",
    partner: "Bowl Street",
    category: "Healthy",
    price: 240,
    description:
      "Crisp greens, roasted chicken, and parmesan with a bright dressing.",
    ingredients: ["Chicken", "Lettuce", "Parmesan", "Croutons", "Dressing"],
    preparationTime: 12,
    foodType: "Non Veg",
    cuisine: "Healthy",
    spiceLevel: "Mild",
    tags: ["fresh", "lunch", "balanced"],
    rating: 4.4,
    likeCount: 330,
    savesCount: 84,
    commentsCount: 31,
    shareCount: 19,
    viewCount: 500,
    thumbnail: "/src/assets/restaurant-images/pexels-calvinseng-31233699.jpg",
  },
  {
    file: "4473180-hd_1920_1080_25fps.mp4",
    name: "Veg Spring Rolls",
    partner: "Momo House",
    category: "Street Food",
    price: 150,
    description:
      "Crisp rolls served with a sweet chili dip and a crunchy bite.",
    ingredients: ["Vegetables", "Wrapper", "Garlic", "Soy", "Chili"],
    preparationTime: 14,
    foodType: "Veg",
    cuisine: "Asian",
    spiceLevel: "Mild",
    tags: ["crunchy", "starter", "shareable"],
    rating: 4.3,
    likeCount: 280,
    savesCount: 58,
    commentsCount: 24,
    shareCount: 13,
    viewCount: 430,
    thumbnail:
      "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
  },
  {
    file: "4519062-hd_1920_1080_25fps.mp4",
    name: "Chicken Fried Rice",
    partner: "Momo House",
    category: "Street Food",
    price: 220,
    description: "Wok-fried rice with chicken, eggs, and savory seasoning.",
    ingredients: ["Rice", "Chicken", "Egg", "Soy sauce", "Scallions"],
    preparationTime: 16,
    foodType: "Non Veg",
    cuisine: "Asian",
    spiceLevel: "Medium",
    tags: ["fried rice", "comfort", "quick"],
    rating: 4.4,
    likeCount: 400,
    savesCount: 80,
    commentsCount: 37,
    shareCount: 24,
    viewCount: 610,
    thumbnail:
      "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
  },
  {
    file: "4786589-hd_1920_1080_25fps.mp4",
    name: "Falooda",
    partner: "Fire & Spice",
    category: "Desserts",
    price: 180,
    description: "Layered rose falooda with ice cream and sweet basil seeds.",
    ingredients: ["Falooda", "Rose syrup", "Ice cream", "Basil seeds", "Milk"],
    preparationTime: 10,
    foodType: "Veg",
    cuisine: "Indian",
    spiceLevel: "Mild",
    tags: ["dessert", "cool", "festive"],
    rating: 4.6,
    likeCount: 560,
    savesCount: 118,
    commentsCount: 48,
    shareCount: 31,
    viewCount: 810,
    thumbnail: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
  },
  {
    file: "4932519-hd_2048_1080_30fps.mp4",
    name: "Chicken Alfredo Pasta",
    partner: "Pizzeria Napoletana",
    category: "Pasta",
    price: 320,
    description: "Velvety chicken pasta with parmesan and a silky cream sauce.",
    ingredients: ["Chicken", "Pasta", "Cream", "Parmesan", "Garlic"],
    preparationTime: 22,
    foodType: "Non Veg",
    cuisine: "Italian",
    spiceLevel: "Mild",
    tags: ["pasta", "creamy", "dinner"],
    rating: 4.6,
    likeCount: 640,
    savesCount: 111,
    commentsCount: 56,
    shareCount: 38,
    viewCount: 890,
    thumbnail:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    file: "5059604-hd_1080_2048_30fps.mp4",
    name: "Truffle Pasta",
    partner: "Pizzeria Napoletana",
    category: "Pasta",
    price: 360,
    description: "A rich pasta dish with truffle aroma and a glossy finish.",
    ingredients: ["Pasta", "Truffle oil", "Parmesan", "Cream", "Mushroom"],
    preparationTime: 20,
    foodType: "Veg",
    cuisine: "Italian",
    spiceLevel: "Mild",
    tags: ["truffle", "premium", "indulgent"],
    rating: 4.7,
    likeCount: 700,
    savesCount: 136,
    commentsCount: 60,
    shareCount: 42,
    viewCount: 970,
    thumbnail:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    file: "5534141-hd_1080_1920_30fps.mp4",
    name: "Veg Galouti Kebab",
    partner: "Urban Tandoor",
    category: "Grills",
    price: 220,
    description: "Soft vegetarian kebabs with a melt-in-the-mouth finish.",
    ingredients: ["Paneer", "Potato", "Masala", "Cream", "Herbs"],
    preparationTime: 22,
    foodType: "Veg",
    cuisine: "North Indian",
    spiceLevel: "Medium",
    tags: ["royal", "soft", "vegetarian"],
    rating: 4.5,
    likeCount: 420,
    savesCount: 84,
    commentsCount: 38,
    shareCount: 26,
    viewCount: 640,
    thumbnail:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  },
  {
    file: "5658735-hd_1920_1080_30fps.mp4",
    name: "Chicken Galouti Kebab",
    partner: "Urban Tandoor",
    category: "Grills",
    price: 260,
    description: "Tender minced chicken kebabs with a rich, smoky profile.",
    ingredients: ["Chicken mince", "Onion", "Spices", "Cream", "Mint"],
    preparationTime: 22,
    foodType: "Non Veg",
    cuisine: "North Indian",
    spiceLevel: "Medium",
    tags: ["kebab", "rich", "premium"],
    rating: 4.6,
    likeCount: 590,
    savesCount: 100,
    commentsCount: 52,
    shareCount: 35,
    viewCount: 840,
    thumbnail:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  },
  {
    file: "5820008-hd_1920_1080_25fps.mp4",
    name: "Mint Lemonade",
    partner: "Fire & Spice",
    category: "Beverages",
    price: 120,
    description: "A cooling lemonade with mint, lime, and a sparkling finish.",
    ingredients: ["Lime", "Mint", "Sugar", "Water", "Ice"],
    preparationTime: 6,
    foodType: "Vegan",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["cooling", "sharp", "summer"],
    rating: 4.3,
    likeCount: 300,
    savesCount: 77,
    commentsCount: 27,
    shareCount: 16,
    viewCount: 470,
    thumbnail: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
  },
  {
    file: "5848625-hd_1920_1080_25fps.mp4",
    name: "Croissant",
    partner: "Waffle & Whisk",
    category: "Cafe",
    price: 140,
    description: "Flaky, buttery croissant baked to a golden finish.",
    ingredients: ["Flour", "Butter", "Milk", "Sugar", "Yeast"],
    preparationTime: 12,
    foodType: "Veg",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["bakery", "morning", "flaky"],
    rating: 4.4,
    likeCount: 340,
    savesCount: 79,
    commentsCount: 31,
    shareCount: 18,
    viewCount: 520,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "5848631-hd_1920_1080_25fps.mp4",
    name: "Cappuccino",
    partner: "Waffle & Whisk",
    category: "Beverages",
    price: 150,
    description:
      "A classic cappuccino with a mellow coffee profile and creamy foam.",
    ingredients: ["Espresso", "Milk", "Sugar"],
    preparationTime: 6,
    foodType: "Veg",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["coffee", "cafe", "cozy"],
    rating: 4.5,
    likeCount: 480,
    savesCount: 99,
    commentsCount: 42,
    shareCount: 25,
    viewCount: 690,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "6017724-hd_1080_1440_30fps.mp4",
    name: "Chicken Noodles",
    partner: "Momo House",
    category: "Street Food",
    price: 200,
    description: "Savory noodles tossed with chicken and a glossy sauce.",
    ingredients: ["Noodles", "Chicken", "Scallions", "Soy", "Garlic"],
    preparationTime: 16,
    foodType: "Non Veg",
    cuisine: "Asian",
    spiceLevel: "Medium",
    tags: ["noodles", "savory", "quick"],
    rating: 4.3,
    likeCount: 330,
    savesCount: 69,
    commentsCount: 30,
    shareCount: 19,
    viewCount: 500,
    thumbnail:
      "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
  },
  {
    file: "6156279-hd_1080_1920_30fps.mp4",
    name: "Veggie Wrap",
    partner: "Fire & Spice",
    category: "Wraps",
    price: 170,
    description:
      "A fresh veggie wrap with crunchy greens and a herby dressing.",
    ingredients: ["Vegetables", "Flatbread", "Herbs", "Dressing"],
    preparationTime: 12,
    foodType: "Veg",
    cuisine: "Healthy",
    spiceLevel: "Mild",
    tags: ["fresh", "lunch", "healthy"],
    rating: 4.2,
    likeCount: 240,
    savesCount: 54,
    commentsCount: 21,
    shareCount: 11,
    viewCount: 380,
    thumbnail: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
  },
  {
    file: "6289327-hd_1080_1920_25fps.mp4",
    name: "Chicken Popcorn",
    partner: "Burger & Brûlée",
    category: "Burgers",
    price: 160,
    description: "Crisp chicken popcorn bites served hot and crunchy.",
    ingredients: ["Chicken", "Breadcrumbs", "Spices", "Dip"],
    preparationTime: 14,
    foodType: "Non Veg",
    cuisine: "American",
    spiceLevel: "Medium",
    tags: ["crispy", "snack", "shareable"],
    rating: 4.3,
    likeCount: 280,
    savesCount: 61,
    commentsCount: 25,
    shareCount: 14,
    viewCount: 430,
    thumbnail:
      "/src/assets/restaurant-images/pexels-james-collington-2147687246-31045433.jpg",
  },
  {
    file: "6412308-hd_1920_1080_30fps.mp4",
    name: "Veg Pulao",
    partner: "Urban Tandoor",
    category: "North Indian",
    price: 220,
    description:
      "A fragrant vegetable pulao finished with toasted nuts and herbs.",
    ingredients: ["Rice", "Vegetables", "Cashew", "Cumin", "Ghee"],
    preparationTime: 24,
    foodType: "Veg",
    cuisine: "North Indian",
    spiceLevel: "Mild",
    tags: ["wholesome", "comfort", "vegetarian"],
    rating: 4.4,
    likeCount: 480,
    savesCount: 88,
    commentsCount: 41,
    shareCount: 25,
    viewCount: 700,
    thumbnail:
      "/src/assets/restaurant-images/pexels-paul-espinoza-841364529-33124152.jpg",
  },
  {
    file: "6645700-hd_1920_1080_30fps.mp4",
    name: "Chicken Dumplings",
    partner: "Momo House",
    category: "Street Food",
    price: 180,
    description: "Soft dumplings filled with seasoned chicken and served hot.",
    ingredients: ["Chicken", "Wrapper", "Garlic", "Ginger", "Soy"],
    preparationTime: 16,
    foodType: "Non Veg",
    cuisine: "Asian",
    spiceLevel: "Medium",
    tags: ["dumplings", "asian", "snack"],
    rating: 4.3,
    likeCount: 260,
    savesCount: 56,
    commentsCount: 23,
    shareCount: 13,
    viewCount: 410,
    thumbnail:
      "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
  },
  {
    file: "6645705-hd_1920_1080_30fps.mp4",
    name: "Veg Dumplings",
    partner: "Momo House",
    category: "Street Food",
    price: 160,
    description: "Vegetable-filled dumplings with a gentle, earthy flavor.",
    ingredients: ["Cabbage", "Carrot", "Mushroom", "Wrapper", "Soy"],
    preparationTime: 15,
    foodType: "Veg",
    cuisine: "Asian",
    spiceLevel: "Mild",
    tags: ["dumplings", "vegetarian", "snack"],
    rating: 4.3,
    likeCount: 250,
    savesCount: 52,
    commentsCount: 22,
    shareCount: 12,
    viewCount: 390,
    thumbnail:
      "/src/assets/restaurant-images/pexels-elizabethcoded-36523979.jpg",
  },
  {
    file: "6645710-hd_1920_1080_30fps.mp4",
    name: "Chicken Pot Pie",
    partner: "Waffle & Whisk",
    category: "Cafe",
    price: 220,
    description: "A flaky pie filled with creamy chicken and vegetables.",
    ingredients: ["Chicken", "Pastry", "Carrot", "Peas", "Cream"],
    preparationTime: 26,
    foodType: "Non Veg",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["comfort", "bakery", "cozy"],
    rating: 4.4,
    likeCount: 360,
    savesCount: 78,
    commentsCount: 33,
    shareCount: 20,
    viewCount: 560,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "6645813-hd_1080_1920_30fps.mp4",
    name: "Chocolate Lava Cake",
    partner: "Waffle & Whisk",
    category: "Desserts",
    price: 220,
    description: "Warm chocolate cake with a molten center and a soft crust.",
    ingredients: ["Chocolate", "Butter", "Sugar", "Egg", "Flour"],
    preparationTime: 20,
    foodType: "Veg",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["dessert", "gooey", "indulgent"],
    rating: 4.7,
    likeCount: 760,
    savesCount: 152,
    commentsCount: 67,
    shareCount: 45,
    viewCount: 1070,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "7361610-hd_1080_1920_25fps.mp4",
    name: "Chicken Schnitzel",
    partner: "Waffle & Whisk",
    category: "Cafe",
    price: 260,
    description:
      "Crisp, golden chicken cutlet served with herb butter and fries.",
    ingredients: ["Chicken", "Breadcrumbs", "Egg", "Butter", "Potato"],
    preparationTime: 24,
    foodType: "Non Veg",
    cuisine: "European",
    spiceLevel: "Medium",
    tags: ["crispy", "comfort", "dinner"],
    rating: 4.5,
    likeCount: 460,
    savesCount: 89,
    commentsCount: 39,
    shareCount: 24,
    viewCount: 710,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "7601416-hd_1080_1920_24fps.mp4",
    name: "Veggie Wrap",
    partner: "Bowl Street",
    category: "Wraps",
    price: 180,
    description:
      "Fresh wrap packed with crunchy vegetables and a light dressing.",
    ingredients: ["Wrap", "Cucumber", "Carrot", "Lettuce", "Mayo"],
    preparationTime: 10,
    foodType: "Veg",
    cuisine: "Healthy",
    spiceLevel: "Mild",
    tags: ["healthy", "lunch", "convenient"],
    rating: 4.3,
    likeCount: 260,
    savesCount: 60,
    commentsCount: 23,
    shareCount: 14,
    viewCount: 410,
    thumbnail: "/src/assets/restaurant-images/pexels-calvinseng-31233699.jpg",
  },
  {
    file: "7653233-hd_2048_1080_25fps.mp4",
    name: "French Fries",
    partner: "Burger & Brûlée",
    category: "Burgers",
    price: 120,
    description: "Classic fries with crisp edges and a soft center.",
    ingredients: ["Potato", "Salt", "Oil", "Paprika"],
    preparationTime: 10,
    foodType: "Veg",
    cuisine: "American",
    spiceLevel: "Mild",
    tags: ["fries", "snack", "shareable"],
    rating: 4.2,
    likeCount: 240,
    savesCount: 49,
    commentsCount: 22,
    shareCount: 12,
    viewCount: 350,
    thumbnail:
      "/src/assets/restaurant-images/pexels-james-collington-2147687246-31045433.jpg",
  },
  {
    file: "7929025-hd_1080_1920_24fps.mp4",
    name: "Chicken Pizza",
    partner: "Pizzeria Napoletana",
    category: "Pizza",
    price: 430,
    description: "A generous chicken-topped pizza with paprika and mozzarella.",
    ingredients: ["Chicken", "Mozzarella", "Tomato", "Dough", "Paprika"],
    preparationTime: 24,
    foodType: "Non Veg",
    cuisine: "Italian",
    spiceLevel: "Medium",
    tags: ["chicken", "cheesy", "family"],
    rating: 4.6,
    likeCount: 690,
    savesCount: 122,
    commentsCount: 59,
    shareCount: 39,
    viewCount: 960,
    thumbnail:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    file: "7934026-hd_1920_1080_30fps.mp4",
    name: "Pasta Primavera",
    partner: "Pizzeria Napoletana",
    category: "Pasta",
    price: 300,
    description: "A fresh pasta dish with colorful vegetables and herbs.",
    ingredients: ["Pasta", "Zucchini", "Tomato", "Olive oil", "Basil"],
    preparationTime: 20,
    foodType: "Veg",
    cuisine: "Italian",
    spiceLevel: "Mild",
    tags: ["pasta", "fresh", "colorful"],
    rating: 4.5,
    likeCount: 410,
    savesCount: 85,
    commentsCount: 37,
    shareCount: 22,
    viewCount: 620,
    thumbnail:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    file: "8107806-hd_2048_1080_25fps.mp4",
    name: "Cheese Nachos",
    partner: "Fire & Spice",
    category: "Wraps",
    price: 180,
    description:
      "Loaded tortilla chips with cheese, salsa, and a sharp finish.",
    ingredients: ["Tortilla chips", "Cheese", "Salsa", "Jalapeno", "Guacamole"],
    preparationTime: 12,
    foodType: "Veg",
    cuisine: "Mexican",
    spiceLevel: "Medium",
    tags: ["nachos", "shareable", "snack"],
    rating: 4.3,
    likeCount: 310,
    savesCount: 69,
    commentsCount: 28,
    shareCount: 15,
    viewCount: 470,
    thumbnail: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
  },
  {
    file: "8523306-hd_1920_1080_30fps.mp4",
    name: "Chicken Quesadilla",
    partner: "Fire & Spice",
    category: "Wraps",
    price: 220,
    description: "Crisp tortilla stuffed with chicken and melted cheese.",
    ingredients: ["Chicken", "Cheese", "Tortilla", "Salsa", "Onion"],
    preparationTime: 16,
    foodType: "Non Veg",
    cuisine: "Mexican",
    spiceLevel: "Medium",
    tags: ["quesadilla", "cheesy", "handheld"],
    rating: 4.4,
    likeCount: 390,
    savesCount: 82,
    commentsCount: 35,
    shareCount: 21,
    viewCount: 590,
    thumbnail: "/src/assets/restaurant-images/pexels-khezez-28442293.jpg",
  },
  {
    file: "854345-hd_1280_720_30fps.mp4",
    name: "Iced Latte",
    partner: "Waffle & Whisk",
    category: "Beverages",
    price: 160,
    description: "A chilled latte poured over ice with a creamy top.",
    ingredients: ["Espresso", "Milk", "Ice"],
    preparationTime: 6,
    foodType: "Veg",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["latte", "iced", "cafe"],
    rating: 4.4,
    likeCount: 370,
    savesCount: 90,
    commentsCount: 34,
    shareCount: 20,
    viewCount: 570,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "857138-hd_1280_720_30fps.mp4",
    name: "Hot Chocolate",
    partner: "Waffle & Whisk",
    category: "Beverages",
    price: 140,
    description: "Rich hot chocolate topped with cream and a cocoa finish.",
    ingredients: ["Milk", "Chocolate", "Cream", "Sugar"],
    preparationTime: 8,
    foodType: "Veg",
    cuisine: "Cafe",
    spiceLevel: "Mild",
    tags: ["hot chocolate", "cozy", "winter"],
    rating: 4.4,
    likeCount: 350,
    savesCount: 87,
    commentsCount: 32,
    shareCount: 18,
    viewCount: 540,
    thumbnail:
      "/src/assets/restaurant-images/pexels-jack-baghel-2199968-20408448.jpg",
  },
  {
    file: "8880956-hd_2048_1080_25fps.mp4",
    name: "Veggie Lasagna",
    partner: "Pizzeria Napoletana",
    category: "Pasta",
    price: 340,
    description: "Layered pasta bake with roasted vegetables and cheese.",
    ingredients: ["Pasta", "Vegetables", "Cheese", "Tomato", "Cream"],
    preparationTime: 32,
    foodType: "Veg",
    cuisine: "Italian",
    spiceLevel: "Mild",
    tags: ["lasagna", "baked", "comfort"],
    rating: 4.7,
    likeCount: 720,
    savesCount: 140,
    commentsCount: 64,
    shareCount: 41,
    viewCount: 1000,
    thumbnail:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
  {
    file: "9984058-hd_1080_1920_25fps.mp4",
    name: "Chicken Alfredo Ravioli",
    partner: "Pizzeria Napoletana",
    category: "Pasta",
    price: 340,
    description: "Stuffed ravioli in a creamy alfredo sauce with chicken.",
    ingredients: ["Ravioli", "Chicken", "Cream", "Parmesan", "Garlic"],
    preparationTime: 24,
    foodType: "Non Veg",
    cuisine: "Italian",
    spiceLevel: "Mild",
    tags: ["ravioli", "rich", "cozy"],
    rating: 4.5,
    likeCount: 500,
    savesCount: 103,
    commentsCount: 45,
    shareCount: 28,
    viewCount: 760,
    thumbnail:
      "/src/assets/restaurant-images/pexels-luiz-eduardo-pacheco-706192036-18203253.jpg",
  },
];

const userSeedData = [
  {
    fullName: "FoodieK Admin",
    email: "admin@foodiek.com",
    password: "FoodieK@123",
    role: "admin",
  },
  {
    fullName: "Aarav Sharma",
    email: "aarav@example.com",
    password: "FoodieK@123",
  },
  {
    fullName: "Megha Verma",
    email: "megha@example.com",
    password: "FoodieK@123",
  },
  {
    fullName: "Rohan Das",
    email: "rohan@example.com",
    password: "FoodieK@123",
  },
  { fullName: "Isha Nair", email: "isha@example.com", password: "FoodieK@123" },
  {
    fullName: "Kunal Patel",
    email: "kunal@example.com",
    password: "FoodieK@123",
  },
  { fullName: "Sara Khan", email: "sara@example.com", password: "FoodieK@123" },
];

function buildSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seedDatabase() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log(
      `Seed media mode: ${useImageKitSeedMedia ? "imagekit" : "local"}`,
    );

    console.log("Clearing existing seed collections...");
    await Promise.all([
      Category.deleteMany({}),
      FoodPartner.deleteMany({}),
      Food.deleteMany({}),
      User.deleteMany({}),
      Like.deleteMany({}),
      Save.deleteMany({}),
      PaymentTransaction.deleteMany({}),
    ]);

    console.log("Creating categories...");
    const createdCategories = [];
    for (const category of categorySeedData.map(normalizeSeedItem)) {
      const resolvedCategoryImage = await resolveSeedMediaValue(
        category.image,
        "/foodiek/restaurants",
      );

      const created = await Category.create({
        name: category.name,
        slug: buildSlug(category.name),
        image: resolvedCategoryImage,
        isActive: true,
      });
      createdCategories.push(created);
    }

    const categoryMap = new Map(
      createdCategories.map((item) => [item.name, item]),
    );

    console.log("Creating food partners...");
    const createdPartners = [];
    for (const partner of partnerSeedData.map(normalizeSeedItem)) {
      const hashedPassword = await bcrypt.hash(partner.password, 10);
      const resolvedAvatar = await resolveSeedMediaValue(
        partner.avatar,
        "/foodiek/restaurants",
      );
      const resolvedCoverImage = await resolveSeedMediaValue(
        partner.coverImage,
        "/foodiek/restaurants",
      );

      const created = await FoodPartner.create({
        ...partner,
        avatar: resolvedAvatar,
        coverImage: resolvedCoverImage,
        password: hashedPassword,
      });
      createdPartners.push(created);
    }

    const partnerMap = new Map(
      createdPartners.map((item) => [item.name, item]),
    );

    console.log("Creating users...");
    const createdUsers = [];
    for (const user of userSeedData) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const created = await User.create({
        ...user,
        password: hashedPassword,
      });
      createdUsers.push(created);
    }

    console.log("Creating foods...");
    const createdFoods = [];
    for (const item of foodSeedData.map(normalizeSeedItem)) {
      const category = categoryMap.get(item.category);
      const partner = partnerMap.get(item.partner);
      if (!category || !partner) continue;

      const resolvedFoodMedia = await resolveFoodSeedMedia(item.file);

      const food = await Food.create({
        name: item.name,
        description: item.description,
        video: resolvedFoodMedia.video,
        thumbnail: resolvedFoodMedia.thumbnail,
        category: category._id,
        foodPartner: partner._id,
        price: item.price,
        preparationTime: item.preparationTime,
        foodType: item.foodType,
        cuisine: item.cuisine,
        spiceLevel: item.spiceLevel,
        ingredients: item.ingredients,
        tags: item.tags,
        isAvailable: true,
        rating: item.rating,
        totalRatings: Math.max(1, Math.round(item.likeCount / 120)),
        likeCount: item.likeCount,
        savesCount: item.savesCount,
        commentsCount: item.commentsCount,
        shareCount: item.shareCount,
        viewCount: item.viewCount,
      });
      createdFoods.push(food);
    }

    console.log("Creating likes and saves...");
    const foodIds = createdFoods.map((food) => food._id);
    const userIds = createdUsers.map((user) => user._id);

    for (let index = 0; index < foodIds.length; index += 1) {
      const foodId = foodIds[index];
      const userId = userIds[index % userIds.length];
      const like = await Like.create({ user: userId, food: foodId });
      if (index % 3 === 0) {
        await Save.create({ user: userId, food: foodId });
      }
      if (!like) {
        throw new Error("Failed to create like");
      }
    }

    const favoriteFoods = createdFoods.slice(0, 18);
    for (let index = 0; index < favoriteFoods.length; index += 1) {
      const food = favoriteFoods[index];
      const user = createdUsers[index % createdUsers.length];
      await Like.create({ user: user._id, food: food._id });
    }

    console.log("Seed complete.");
    console.log({
      categories: createdCategories.length,
      foodPartners: createdPartners.length,
      users: createdUsers.length,
      foods: createdFoods.length,
    });
    process.exit(0);
  } catch (error) {
    console.error("Seed failed", error);
    process.exit(1);
  }
}

seedDatabase();
