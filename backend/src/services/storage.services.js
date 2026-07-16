const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function uploadFile(file, fileName, options = {}) {
  const requiredEnvVars = [
    "IMAGEKIT_PUBLIC_KEY",
    "IMAGEKIT_PRIVATE_KEY",
    "IMAGEKIT_URL_ENDPOINT",
  ];

  for (const variableName of requiredEnvVars) {
    if (!process.env[variableName]) {
      throw new Error(`Missing required environment variable: ${variableName}`);
    }
  }

  const result = await imagekit.upload({
    file,
    fileName,
    ...options,
  });

  return result;
}

module.exports = {
  uploadFile,
};
