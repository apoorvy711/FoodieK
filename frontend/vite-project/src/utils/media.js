const legacyAssetPrefix = "/src/assets/";

export function resolveMediaUrl(value, fallback = "") {
  if (!value) {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith(legacyAssetPrefix)) {
    return value.replace(legacyAssetPrefix, "/media/");
  }

  return value;
}
