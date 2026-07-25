const legacyAssetPrefix = "/src/assets/";

function normalizeMediaValue(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().replace(/\\/g, "/");
}

function getApiOrigin() {
  const configuredApiUrl = import.meta.env.VITE_API_URL;

  if (!configuredApiUrl) {
    return "";
  }

  try {
    const url = new URL(configuredApiUrl);
    return url.origin;
  } catch {
    return "";
  }
}

export function resolveMediaUrl(value, fallback = "") {
  const normalizedValue = normalizeMediaValue(value);

  if (!normalizedValue) {
    return fallback;
  }

  if (typeof normalizedValue !== "string") {
    return normalizedValue;
  }

  if (
    normalizedValue.startsWith("http://") ||
    normalizedValue.startsWith("https://") ||
    normalizedValue.startsWith("blob:") ||
    normalizedValue.startsWith("data:")
  ) {
    return normalizedValue;
  }

  if (normalizedValue.startsWith("//")) {
    return `${window.location.protocol}${normalizedValue}`;
  }

  if (normalizedValue.startsWith(legacyAssetPrefix)) {
    return normalizedValue.replace(legacyAssetPrefix, "/media/");
  }

  return normalizedValue;
}

export function resolveMediaCandidates(value) {
  const resolved = resolveMediaUrl(value, "");

  if (!resolved || typeof resolved !== "string") {
    return [];
  }

  const candidates = [resolved];
  const apiOrigin = getApiOrigin();

  if (apiOrigin && resolved.startsWith("/")) {
    candidates.push(`${apiOrigin}${resolved}`);
  }

  return Array.from(new Set(candidates));
}
