export function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

export function debounce(callback, wait = 250) {
  let timeoutId = null;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
}

export function createId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getByPath(source, path) {
  return path.split(".").reduce((current, segment) => current?.[segment], source);
}

export function setByPath(target, path, value) {
  const segments = path.split(".");
  const lastSegment = segments.pop();
  const parent = segments.reduce((current, segment) => {
    if (!current[segment] || typeof current[segment] !== "object") {
      current[segment] = {};
    }

    return current[segment];
  }, target);

  parent[lastSegment] = value;
}

export function ensureUrl(value) {
  const trimmed = `${value || ""}`.trim();

  if (!trimmed) {
    return "";
  }

  if (/^(mailto:|https?:\/\/)/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function encodeBadgeText(value) {
  return encodeURIComponent(`${value || ""}`.trim()).replace(/%20/g, "%20");
}

export function joinDefined(values, separator = " ") {
  return values.filter(Boolean).join(separator);
}

export function stripTrailingWhitespace(value) {
  return value
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n");
}

export function normalizeMarkdown(value) {
  return stripTrailingWhitespace(value)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const numeric = Number.parseInt(value, 16);

  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  };
}

export function isFilled(value) {
  return `${value || ""}`.trim().length > 0;
}

export function arrayMove(items, fromIndex, toIndex) {
  const nextItems = [...items];
  const [moved] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, moved);
  return nextItems;
}
