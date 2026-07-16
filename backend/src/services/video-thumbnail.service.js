const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { promisify } = require("util");
const { execFile } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const ffprobe = require("ffprobe-static");

const execFileAsync = promisify(execFile);

function getCandidateOffsets(durationInSeconds) {
  if (!Number.isFinite(durationInSeconds) || durationInSeconds <= 0) {
    return [0.1];
  }

  const offsets = [0.2, 0.15, 0.3]
    .map((fraction) => Number((durationInSeconds * fraction).toFixed(3)))
    .filter((offset) => offset > 0 && offset < durationInSeconds);

  offsets.push(Math.min(0.1, durationInSeconds));

  return [...new Set(offsets)];
}

async function getDurationInSeconds(sourcePath) {
  try {
    const { stdout } = await execFileAsync(ffprobe.path, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      sourcePath,
    ]);

    const parsed = Number.parseFloat(stdout.trim());
    return Number.isFinite(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

async function extractFrame(sourcePath, outputPath, offsetInSeconds) {
  await execFileAsync(ffmpegPath, [
    "-y",
    "-ss",
    String(offsetInSeconds),
    "-i",
    sourcePath,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    outputPath,
  ]);

  const stats = await fs.stat(outputPath);
  if (!stats.size) {
    throw new Error("Generated thumbnail is empty");
  }
}

async function generateThumbnailFile({ sourcePath, outputPath }) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const durationInSeconds = await getDurationInSeconds(sourcePath);
  const candidateOffsets = getCandidateOffsets(durationInSeconds);
  let lastError = null;

  for (const offsetInSeconds of candidateOffsets) {
    try {
      await extractFrame(sourcePath, outputPath, offsetInSeconds);
      return outputPath;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Could not generate thumbnail");
}

async function generateThumbnailBuffer({ videoBuffer, extension = ".mp4" }) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "foodiek-thumb-"));
  const sourcePath = path.join(tempDir, `source${extension}`);
  const outputPath = path.join(tempDir, "thumbnail.jpg");

  try {
    await fs.writeFile(sourcePath, videoBuffer);
    await generateThumbnailFile({ sourcePath, outputPath });
    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

module.exports = {
  generateThumbnailBuffer,
  generateThumbnailFile,
};
