import { CONFIG_VERSION, STORAGE_KEY } from "./data-options.js";
import { normalizeState, serializeState } from "./state.js";
import { debounce } from "./utils.js";

export function loadDraft() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || parsedValue.version !== CONFIG_VERSION || !parsedValue.data) {
      return null;
    }

    return normalizeState(parsedValue);
  } catch (error) {
    return null;
  }
}

export function saveDraft(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(state)));
    return true;
  } catch (error) {
    return false;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

export function createDraftAutosave(callback) {
  return debounce(callback, 300);
}

export function exportConfig(state) {
  return JSON.stringify(serializeState(state), null, 2);
}

export function parseImportedConfig(text) {
  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error("This file is not valid JSON.");
  }

  if (!parsed || parsed.version !== CONFIG_VERSION || !parsed.data) {
    throw new Error(`Unsupported config format. Expected version ${CONFIG_VERSION}.`);
  }

  return normalizeState(parsed);
}
