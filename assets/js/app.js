import { ACCENT_THEME_BY_ID } from "./data-themes.js";
import {
  exportConfig,
  loadDraft,
  loadPreviewMode,
  parseImportedConfig,
  saveDraft,
  savePreviewMode,
  clearDraft,
  createDraftAutosave,
} from "./storage.js";
import { applyPreset, PRESETS } from "./presets.js";
import { renderPreview } from "./preview.js";
import { createInitialState, createStore } from "./state.js";
import {
  applyAccentTheme,
  hydrateFormFields,
  renderAccentThemes,
  renderFeaturedProjectRows,
  renderLanguageRows,
  renderLayoutStyles,
  renderPresetRail,
  renderSocialFields,
  renderStatsThemes,
  renderStatusOptions,
  renderTechGroups,
  renderWidgetOptions,
  setStatusMessage,
  syncDesktopPreviewMode,
  syncMobilePanel,
  updateOutputPanel,
  updateProgress,
  updateQuoteFieldVisibility,
  updateTechSummary,
} from "./ui.js";
import { generateMarkdown } from "./generator.js";
import { createId, setByPath } from "./utils.js";

const refs = {
  app: document.querySelector("[data-app]"),
  formRoot: document.querySelector("[data-form-root]"),
  presetRail: document.getElementById("preset-rail"),
  socialFields: document.getElementById("social-fields"),
  statusGrid: document.getElementById("status-grid"),
  layoutGrid: document.getElementById("layout-grid"),
  accentGrid: document.getElementById("accent-grid"),
  statsThemeGrid: document.getElementById("stats-theme-grid"),
  widgetGrid: document.getElementById("widget-grid"),
  techGroups: document.getElementById("tech-groups"),
  languageRows: document.getElementById("language-rows"),
  projectRows: document.getElementById("project-rows"),
  preview: document.getElementById("preview-content"),
  techSearch: document.getElementById("tech-search"),
  customTechInput: document.getElementById("custom-tech-input"),
  addLanguageButton: document.getElementById("add-language"),
  addProjectButton: document.getElementById("add-project"),
  addCustomTechButton: document.getElementById("add-custom-tech"),
  resetButton: document.getElementById("reset-draft"),
  copyButton: document.getElementById("copy-readme"),
  downloadButton: document.getElementById("download-readme"),
  exportButton: document.getElementById("export-config"),
  importButton: document.getElementById("import-config"),
  generateButton: document.getElementById("generate-readme"),
  importInput: document.getElementById("config-import-input"),
  outputCode: document.getElementById("output-code"),
  outputSection: document.getElementById("output"),
  progressBar: document.getElementById("progress-bar"),
  draftStatus: document.getElementById("draft-status"),
  techCount: document.getElementById("tech-count"),
  quoteField: document.getElementById("quote-field"),
  workspace: document.getElementById("workspace"),
};

const initialDraft = loadDraft();
const store = createStore(initialDraft || createInitialState());
const autosave = createDraftAutosave((state) => {
  const saved = saveDraft(state);
  setStatusMessage(refs.draftStatus, saved ? "Draft saved locally." : "Could not save this draft locally.", saved ? "success" : "danger");
});

let currentMarkdown = "";
let currentPresetId = "";
let currentTechQuery = "";
let currentMobilePanel = "form";
let currentPreviewMode = loadPreviewMode();
let skipAutosaveOnce = false;

renderSocialFields(refs.socialFields);
bindEvents();
renderFullUI(store.getState());
setStatusMessage(refs.draftStatus, initialDraft ? "Draft restored from this browser." : "Autosave is ready.", "neutral");

store.subscribe((state) => {
  renderLiveState(state);

  if (skipAutosaveOnce) {
    skipAutosaveOnce = false;
    return;
  }

  setStatusMessage(refs.draftStatus, "Saving draft...", "neutral");
  autosave(state);
});

function bindEvents() {
  refs.formRoot.addEventListener("input", handleInput);
  refs.app.addEventListener("click", handleClick);
  refs.formRoot.addEventListener("change", handleChange);
  refs.techSearch.addEventListener("input", handleTechSearch);
  refs.importInput.addEventListener("change", handleImport);

  refs.addLanguageButton.addEventListener("click", () => {
    store.update((draft) => {
      draft.spokenLanguages.push({ id: createId("lang"), name: "", level: 3 });
    });
    renderFullUI(store.getState());
    focusLatest('[data-language-field="name"]');
  });

  refs.addProjectButton.addEventListener("click", () => {
    store.update((draft) => {
      draft.featuredProjects.push({ id: createId("project"), title: "", description: "", url: "" });
    });
    renderFullUI(store.getState());
    focusLatest('[data-project-field="title"]');
  });

  refs.addCustomTechButton.addEventListener("click", addCustomTechFromInput);
  refs.customTechInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustomTechFromInput();
    }
  });

  refs.resetButton.addEventListener("click", resetDraft);
  refs.copyButton.addEventListener("click", copyMarkdown);
  refs.downloadButton.addEventListener("click", downloadMarkdown);
  refs.exportButton.addEventListener("click", exportCurrentConfig);
  refs.importButton.addEventListener("click", () => refs.importInput.click());
  refs.generateButton.addEventListener("click", () => {
    if (!currentMarkdown.trim()) {
      setStatusMessage(refs.draftStatus, "Add a bit more information before reviewing the README.", "danger");
      return;
    }
    refs.outputSection.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatusMessage(refs.draftStatus, "Jumped to the latest README output.", "success");
  });
}

function handleInput(event) {
  const target = event.target;

  if (target.matches("[data-field]")) {
    const fieldPath = target.dataset.field;
    store.update((draft) => {
      setByPath(draft, fieldPath, target.value);
    });
    return;
  }

  if (target.matches("[data-language-field]")) {
    const languageId = target.dataset.languageId;
    const fieldName = target.dataset.languageField;
    store.update((draft) => {
      const entry = draft.spokenLanguages.find((item) => item.id === languageId);
      if (entry) {
        entry[fieldName] = target.value;
      }
    });
    return;
  }

  if (target.matches("[data-project-field]")) {
    const projectId = target.dataset.projectId;
    const fieldName = target.dataset.projectField;
    store.update((draft) => {
      const entry = draft.featuredProjects.find((item) => item.id === projectId);
      if (entry) {
        entry[fieldName] = target.value;
      }
    });
  }
}

function handleChange(event) {
  const target = event.target;
  if (target.matches("[data-field]")) {
    const fieldPath = target.dataset.field;
    store.update((draft) => {
      setByPath(draft, fieldPath, target.value);
    });
  }
}

function handleClick(event) {
  const button = event.target.closest("[data-action], [data-mobile-panel-button]");

  if (!button) {
    return;
  }

  if (button.dataset.mobilePanelButton) {
    currentMobilePanel = button.dataset.mobilePanelButton;
    syncMobilePanel(refs.workspace, currentMobilePanel);
    return;
  }

  if (button.dataset.previewModeButton) {
    currentPreviewMode = button.dataset.previewModeButton;
    syncDesktopPreviewMode(refs.workspace, currentPreviewMode);
    savePreviewMode(currentPreviewMode);
    return;
  }

  switch (button.dataset.action) {
    case "apply-preset":
      currentPresetId = button.dataset.presetId;
      store.replace(applyPreset(store.getState(), currentPresetId));
      renderFullUI(store.getState());
      setStatusMessage(
        refs.draftStatus,
        `${PRESETS.find((preset) => preset.id === currentPresetId)?.label || "Preset"} applied.`,
        "success"
      );
      return;
    case "select-layout":
      store.update((draft) => {
        draft.appearance.layoutStyle = button.dataset.layoutId;
      });
      return;
    case "select-status":
      store.update((draft) => {
        draft.header.status = button.dataset.statusId;
      });
      return;
    case "select-accent":
      store.update((draft) => {
        draft.appearance.accentId = button.dataset.accentId;
      });
      return;
    case "select-stats-theme":
      store.update((draft) => {
        draft.appearance.statsThemeId = button.dataset.statsThemeId;
      });
      return;
    case "toggle-widget":
      store.update((draft) => {
        draft.widgets[button.dataset.widgetId] = !draft.widgets[button.dataset.widgetId];
      });
      return;
    case "toggle-tech":
      store.update((draft) => {
        const groupId = button.dataset.groupId;
        const itemId = button.dataset.itemId;
        const collection = draft.tech[groupId];
        const index = collection.indexOf(itemId);
        if (index >= 0) {
          collection.splice(index, 1);
        } else {
          collection.push(itemId);
        }
      });
      return;
    case "clear-tech-group":
      store.update((draft) => {
        draft.tech[button.dataset.groupId] = [];
      });
      return;
    case "remove-custom-tech":
      store.update((draft) => {
        draft.tech.custom = draft.tech.custom.filter((item) => item.id !== button.dataset.techId);
      });
      return;
    case "set-language-level":
      store.update((draft) => {
        const entry = draft.spokenLanguages.find((item) => item.id === button.dataset.languageId);
        if (entry) {
          entry.level = Number(button.dataset.level);
        }
      });
      renderLanguageRows(refs.languageRows, store.getState().spokenLanguages);
      return;
    case "remove-language":
      store.update((draft) => {
        draft.spokenLanguages = draft.spokenLanguages.filter((item) => item.id !== button.dataset.languageId);
        if (!draft.spokenLanguages.length) {
          draft.spokenLanguages.push({ id: createId("lang"), name: "", level: 3 });
        }
      });
      renderFullUI(store.getState());
      return;
    case "remove-project":
      store.update((draft) => {
        draft.featuredProjects = draft.featuredProjects.filter((item) => item.id !== button.dataset.projectId);
        if (!draft.featuredProjects.length) {
          draft.featuredProjects.push({ id: createId("project"), title: "", description: "", url: "" });
        }
      });
      renderFullUI(store.getState());
      return;
    default:
      return;
  }
}

function handleTechSearch(event) {
  currentTechQuery = event.target.value;
  renderLiveState(store.getState());
}

async function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const content = await file.text();
    const importedState = parseImportedConfig(content);
    currentPresetId = "";
    currentTechQuery = "";
    refs.techSearch.value = "";
    store.replace(importedState);
    renderFullUI(store.getState());
    setStatusMessage(refs.draftStatus, "Config imported successfully.", "success");
  } catch (error) {
    setStatusMessage(refs.draftStatus, error.message || "Could not import this config.", "danger");
  } finally {
    refs.importInput.value = "";
  }
}

function renderFullUI(state) {
  hydrateFormFields(refs.formRoot, state);
  renderLanguageRows(refs.languageRows, state.spokenLanguages);
  renderFeaturedProjectRows(refs.projectRows, state.featuredProjects);
  renderLiveState(state);
}

function renderLiveState(state) {
  renderPresetRail(refs.presetRail, PRESETS, currentPresetId);
  renderLayoutStyles(refs.layoutGrid, state.appearance.layoutStyle);
  renderStatusOptions(refs.statusGrid, state.header.status);
  renderAccentThemes(refs.accentGrid, state.appearance.accentId);
  renderStatsThemes(refs.statsThemeGrid, state.appearance.statsThemeId);
  renderWidgetOptions(refs.widgetGrid, state.widgets);
  renderTechGroups(refs.techGroups, state, currentTechQuery);
  updateQuoteFieldVisibility(refs.quoteField, state.widgets.quote);
  updateTechSummary(refs.techCount, state);
  updateProgress(refs.progressBar, state);

  const theme = ACCENT_THEME_BY_ID.get(state.appearance.accentId);
  if (theme) {
    applyAccentTheme(theme);
  }

  currentMarkdown = generateMarkdown(state);
  updateOutputPanel(refs, currentMarkdown);
  renderPreview(refs.preview, currentMarkdown, state.appearance.layoutStyle);
  syncDesktopPreviewMode(refs.workspace, currentPreviewMode);
  syncMobilePanel(refs.workspace, currentMobilePanel);
}

function addCustomTechFromInput() {
  const label = refs.customTechInput.value.trim();

  if (!label) {
    setStatusMessage(refs.draftStatus, "Type a custom technology name first.", "danger");
    return;
  }

  const existing = store.getState().tech.custom.some((item) => item.label.toLowerCase() === label.toLowerCase());
  if (existing) {
    setStatusMessage(refs.draftStatus, "That custom technology is already in the list.", "danger");
    return;
  }

  store.update((draft) => {
    draft.tech.custom.push({ id: createId("tech"), label });
  });

  refs.customTechInput.value = "";
  setStatusMessage(refs.draftStatus, `${label} added to custom tech.`, "success");
}

async function copyMarkdown() {
  if (!currentMarkdown.trim()) {
    setStatusMessage(refs.draftStatus, "There is no README to copy yet.", "danger");
    return;
  }

  if (!navigator.clipboard?.writeText) {
    setStatusMessage(refs.draftStatus, "Clipboard access is not available in this browser.", "danger");
    return;
  }

  try {
    await navigator.clipboard.writeText(currentMarkdown);
    setStatusMessage(refs.draftStatus, "README copied to clipboard.", "success");
  } catch (error) {
    setStatusMessage(refs.draftStatus, "Clipboard write failed in this browser.", "danger");
  }
}

function downloadMarkdown() {
  if (!currentMarkdown.trim()) {
    setStatusMessage(refs.draftStatus, "There is no README to download yet.", "danger");
    return;
  }

  downloadFile("README.md", currentMarkdown, "text/markdown;charset=utf-8");
  setStatusMessage(refs.draftStatus, "README.md downloaded.", "success");
}

function exportCurrentConfig() {
  const config = exportConfig(store.getState());
  downloadFile("readmeforge-config.json", config, "application/json;charset=utf-8");
  setStatusMessage(refs.draftStatus, "Config exported as JSON.", "success");
}

function resetDraft() {
  const confirmed = window.confirm("Clear this draft, remove the saved local copy, and reset the preview/output?");
  if (!confirmed) {
    return;
  }

  currentPresetId = "";
  currentTechQuery = "";
  refs.techSearch.value = "";
  refs.customTechInput.value = "";
  currentMobilePanel = "form";
  skipAutosaveOnce = true;
  clearDraft();
  store.replace(createInitialState());
  renderFullUI(store.getState());
  setStatusMessage(refs.draftStatus, "Draft reset. Local autosave was cleared.", "success");
}

function downloadFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function focusLatest(selector) {
  requestAnimationFrame(() => {
    const elements = refs.formRoot.querySelectorAll(selector);
    const latest = elements[elements.length - 1];
    latest?.focus();
  });
}
