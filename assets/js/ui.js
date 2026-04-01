import { LANGUAGE_LEVELS, LAYOUT_STYLES, SOCIAL_FIELDS, STATUS_OPTIONS, WIDGET_OPTIONS } from "./data-options.js";
import { ACCENT_THEMES, STATS_THEMES } from "./data-themes.js";
import { TECH_GROUPS } from "./data-tech.js";
import { getByPath, hexToRgb, isFilled } from "./utils.js";

export function applyAccentTheme(theme) {
  const rgb = hexToRgb(theme.color);
  const root = document.documentElement;

  root.style.setProperty("--accent", theme.color);
  root.style.setProperty("--accent-r", `${rgb.r}`);
  root.style.setProperty("--accent-g", `${rgb.g}`);
  root.style.setProperty("--accent-b", `${rgb.b}`);
  root.style.setProperty("--accent-gradient", theme.gradient ? `linear-gradient(135deg, ${theme.gradientCss || gradientToCss(theme.gradient)})` : theme.color);
}

export function renderPresetRail(container, presets, activePresetId = "") {
  container.replaceChildren();

  presets.forEach((preset) => {
    const button = createElement("button", "preset-card");
    button.type = "button";
    button.dataset.action = "apply-preset";
    button.dataset.presetId = preset.id;
    button.setAttribute("aria-pressed", `${preset.id === activePresetId}`);
    button.classList.toggle("is-active", preset.id === activePresetId);

    const title = createElement("span", "preset-title", preset.label);
    const description = createElement("span", "preset-description", preset.description);

    button.append(title, description);
    container.append(button);
  });
}

export function renderSocialFields(container) {
  container.replaceChildren();

  SOCIAL_FIELDS.forEach((field) => {
    const wrapper = createElement("label", "social-field");
    const chrome = createElement("span", "social-icon");
    chrome.style.setProperty("--social-accent", field.accent);

    const icon = createElement("i");
    icon.className = field.iconClass;
    chrome.append(icon);

    const content = createElement("span", "social-input-wrap");
    const title = createElement("span", "social-label", field.label);

    const input = createElement("input");
    input.type = field.id === "email" ? "email" : "text";
    input.placeholder = field.placeholder;
    input.dataset.field = `socials.${field.id}`;
    input.autocomplete = "off";
    input.spellcheck = false;

    content.append(title, input);
    wrapper.append(chrome, content);
    container.append(wrapper);
  });
}

export function renderLayoutStyles(container, currentStyle) {
  container.replaceChildren();

  LAYOUT_STYLES.forEach((style) => {
    const button = createElement("button", "choice-card");
    button.type = "button";
    button.dataset.action = "select-layout";
    button.dataset.layoutId = style.id;
    button.setAttribute("aria-pressed", `${style.id === currentStyle}`);
    button.classList.toggle("is-active", style.id === currentStyle);

    button.append(
      createElement("span", "choice-title", style.label),
      createElement("span", "choice-description", style.description)
    );

    container.append(button);
  });
}

export function renderStatusOptions(container, currentStatus) {
  container.replaceChildren();

  STATUS_OPTIONS.forEach((status) => {
    const button = createElement("button", "choice-card choice-card--compact");
    button.type = "button";
    button.dataset.action = "select-status";
    button.dataset.statusId = status.id;
    button.setAttribute("aria-pressed", `${status.id === currentStatus}`);
    button.classList.toggle("is-active", status.id === currentStatus);

    button.append(
      createElement("span", "choice-title", `${status.emoji} ${status.label}`),
      createElement("span", "choice-description", status.id === "none" ? "Hide the status badge" : "Single-select status badge")
    );

    container.append(button);
  });
}

export function renderAccentThemes(container, currentAccentId) {
  container.replaceChildren();

  ACCENT_THEMES.forEach((theme) => {
    const button = createElement("button", "theme-chip");
    button.type = "button";
    button.dataset.action = "select-accent";
    button.dataset.accentId = theme.id;
    button.setAttribute("aria-pressed", `${theme.id === currentAccentId}`);
    button.classList.toggle("is-active", theme.id === currentAccentId);

    const swatch = createElement("span", "theme-swatch");
    swatch.style.background = theme.gradient ? `linear-gradient(135deg, ${gradientToCss(theme.gradient)})` : theme.color;

    const meta = createElement("span", "theme-meta");
    meta.append(createElement("span", "theme-name", theme.name), createElement("span", "theme-subtitle", theme.subtitle));
    button.append(swatch, meta);
    container.append(button);
  });
}

export function renderStatsThemes(container, currentThemeId) {
  container.replaceChildren();

  STATS_THEMES.forEach((theme) => {
    const button = createElement("button", "stats-card");
    button.type = "button";
    button.dataset.action = "select-stats-theme";
    button.dataset.statsThemeId = theme.id;
    button.setAttribute("aria-pressed", `${theme.id === currentThemeId}`);
    button.classList.toggle("is-active", theme.id === currentThemeId);

    const preview = createElement("span", "stats-card-preview", theme.label);
    preview.style.background = theme.background;
    preview.style.color = theme.color;

    const code = createElement("span", "stats-card-code", theme.code);
    button.append(preview, code);
    container.append(button);
  });
}

export function renderWidgetOptions(container, widgets) {
  container.replaceChildren();

  WIDGET_OPTIONS.forEach((widget) => {
    const button = createElement("button", "toggle-card");
    button.type = "button";
    button.dataset.action = "toggle-widget";
    button.dataset.widgetId = widget.id;
    button.setAttribute("aria-pressed", `${Boolean(widgets[widget.id])}`);
    button.classList.toggle("is-active", Boolean(widgets[widget.id]));

    const meta = createElement("span", "toggle-copy");
    meta.append(createElement("span", "toggle-title", widget.label), createElement("span", "toggle-description", widget.description));

    const switchPill = createElement("span", "toggle-switch");
    button.append(meta, switchPill);
    container.append(button);
  });
}

export function renderTechGroups(container, state, searchQuery) {
  container.replaceChildren();

  const query = `${searchQuery || ""}`.trim().toLowerCase();
  let visibleCount = 0;

  TECH_GROUPS.forEach((group) => {
    const selectedIds = new Set(state.tech[group.id] || []);
    const visibleItems = group.items.filter((item) => {
      if (!query) {
        return true;
      }

      if (selectedIds.has(item.id)) {
        return true;
      }

      const haystack = [item.label, item.value, ...(item.aliases || [])].join(" ").toLowerCase();
      return haystack.includes(query);
    });

    if (!visibleItems.length) {
      return;
    }

    visibleCount += visibleItems.length;

    const section = createElement("section", "tech-group");
    const header = createElement("div", "section-head");
    header.append(
      createElement("h3", "section-title", group.label),
      createClearButton(group.id, selectedIds.size === 0)
    );
    section.append(header);

    const grid = createElement("div", "tech-grid");
    visibleItems.forEach((item) => {
      const button = createElement("button", "tech-chip");
      button.type = "button";
      button.dataset.action = "toggle-tech";
      button.dataset.groupId = group.id;
      button.dataset.itemId = item.id;
      button.setAttribute("aria-pressed", `${selectedIds.has(item.id)}`);
      button.classList.toggle("is-active", selectedIds.has(item.id));

      button.append(createElement("span", "tech-chip-label", item.label));
      if (item.aliases?.length) {
        button.append(createElement("span", "tech-chip-meta", item.aliases[0]));
      }

      grid.append(button);
    });

    section.append(grid);
    container.append(section);
  });

  const customSection = createElement("section", "tech-group");
  const customHeader = createElement("div", "section-head");
  customHeader.append(
    createElement("h3", "section-title", "Custom Tech"),
    createElement("span", "section-caption", "Add anything missing from the built-in list")
  );
  customSection.append(customHeader);

  const pillRow = createElement("div", "custom-tech-list");
  if (state.tech.custom.length) {
    state.tech.custom.forEach((item) => {
      const pill = createElement("span", "custom-tech-pill");
      pill.append(createElement("span", "custom-tech-pill-text", item.label));
      const removeButton = createElement("button", "icon-button icon-button--danger", "×");
      removeButton.type = "button";
      removeButton.dataset.action = "remove-custom-tech";
      removeButton.dataset.techId = item.id;
      removeButton.setAttribute("aria-label", `Remove ${item.label}`);
      pill.append(removeButton);
      pillRow.append(pill);
    });
  } else {
    pillRow.append(createElement("p", "helper-copy", "No custom technologies added yet."));
  }
  customSection.append(pillRow);
  container.append(customSection);

  if (query && visibleCount === 0) {
    const empty = createElement("div", "empty-search", `No tech matched “${searchQuery}”. Selected chips stay visible, so try a broader term.`);
    container.prepend(empty);
  }
}

export function renderLanguageRows(container, spokenLanguages) {
  container.replaceChildren();

  spokenLanguages.forEach((entry) => {
    const row = createElement("div", "repeater-row");
    row.dataset.languageId = entry.id;

    const field = createElement("div", "repeater-main");
    const label = createElement("label", "field-label", "Language");
    const input = createElement("input");
    input.type = "text";
    input.placeholder = "English, Deutsch, Русский...";
    input.value = entry.name;
    input.dataset.languageId = entry.id;
    input.dataset.languageField = "name";
    field.append(label, input);

    const levels = createElement("div", "language-levels");
    levels.append(createElement("span", "field-label", "Level"));
    const dots = createElement("div", "language-level-buttons");
    LANGUAGE_LEVELS.forEach((level) => {
      const button = createElement("button", "level-dot");
      button.type = "button";
      button.dataset.action = "set-language-level";
      button.dataset.languageId = entry.id;
      button.dataset.level = `${level.value}`;
      button.setAttribute("aria-label", `${entry.name || "Language"} level ${level.label}`);
      button.setAttribute("aria-pressed", `${Number(entry.level) === level.value}`);
      button.classList.toggle("is-active", Number(entry.level) === level.value);
      dots.append(button);
    });
    levels.append(dots, createElement("span", "helper-copy helper-copy--inline", getLanguageLevelLabel(entry.level)));

    const removeButton = createElement("button", "icon-button icon-button--danger", "×");
    removeButton.type = "button";
    removeButton.dataset.action = "remove-language";
    removeButton.dataset.languageId = entry.id;
    removeButton.setAttribute("aria-label", "Remove language");

    row.append(field, levels, removeButton);
    container.append(row);
  });
}

export function renderFeaturedProjectRows(container, projects) {
  container.replaceChildren();

  projects.forEach((project, index) => {
    const card = createElement("div", "project-row");
    card.dataset.projectId = project.id;

    const heading = createElement("div", "project-row-head");
    heading.append(
      createElement("span", "project-row-title", `Project ${index + 1}`),
      buildProjectActions(project.id)
    );

    card.append(
      heading,
      buildProjectField(project.id, "title", "Title", "Project name", project.title),
      buildProjectField(project.id, "description", "Description", "What is it about?", project.description, true),
      buildProjectField(project.id, "url", "Link", "https://example.com", project.url)
    );

    container.append(card);
  });
}

export function hydrateFormFields(root, state) {
  root.querySelectorAll("[data-field]").forEach((field) => {
    const nextValue = getByPath(state, field.dataset.field);
    const normalized = Array.isArray(nextValue) ? nextValue.join("\n") : `${nextValue ?? ""}`;
    if (field.value !== normalized) {
      field.value = normalized;
    }
  });
}

export function updateQuoteFieldVisibility(container, enabled) {
  container.classList.toggle("is-disabled", !enabled);
}

export function updateTechSummary(element, state) {
  const count =
    state.tech.languages.length +
    state.tech.frontend.length +
    state.tech.backend.length +
    state.tech.devops.length +
    state.tech.ai.length +
    state.tech.custom.filter((item) => isFilled(item.label)).length;

  element.textContent = `${count}`;
}

export function updateOutputPanel(refs, markdown) {
  const hasMarkdown = Boolean(markdown.trim());
  refs.outputCode.textContent = hasMarkdown
    ? markdown
    : "Your generated README.md will appear here once the draft has enough information.";

  refs.generateButton.disabled = !hasMarkdown;
  refs.copyButton.disabled = !hasMarkdown;
  refs.downloadButton.disabled = !hasMarkdown;
}

export function updateProgress(element, state) {
  const completedFields = [
    state.profile.name,
    state.profile.username,
    state.profile.role,
    state.profile.bio,
    state.profile.location,
  ].filter((value) => isFilled(value)).length;
  const selectedTech =
    state.tech.languages.length +
    state.tech.frontend.length +
    state.tech.backend.length +
    state.tech.devops.length +
    state.tech.ai.length;
  const hasSocial = Object.values(state.socials).some((value) => isFilled(value));
  const hasProjects = state.featuredProjects.some((entry) => isFilled(entry.title) || isFilled(entry.description) || isFilled(entry.url));
  const score = Math.min(
    100,
    Math.round((completedFields / 5) * 40 + Math.min(selectedTech / 6, 1) * 30 + (hasSocial ? 15 : 0) + (hasProjects ? 15 : 0))
  );

  element.style.width = `${score}%`;
}

export function setStatusMessage(element, text, tone = "neutral") {
  element.textContent = text;
  element.dataset.tone = tone;
}

export function syncMobilePanel(root, panel) {
  root.dataset.mobilePanel = panel;
  document.querySelectorAll("[data-mobile-panel-button]").forEach((button) => {
    const isActive = button.dataset.mobilePanelButton === panel;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", `${isActive}`);
  });
}

function gradientToCss(gradient) {
  return gradient
    .split(",")
    .map((chunk) => chunk.split(":")[1])
    .join(", ");
}

function createClearButton(groupId, disabled) {
  const button = createElement("button", "link-button", "Clear");
  button.type = "button";
  button.dataset.action = "clear-tech-group";
  button.dataset.groupId = groupId;
  button.disabled = disabled;
  return button;
}

function buildProjectField(projectId, fieldName, labelText, placeholder, value, multiline = false) {
  const field = createElement("label", "project-field");
  field.append(createElement("span", "field-label", labelText));

  const control = createElement(multiline ? "textarea" : "input");
  if (!multiline) {
    control.type = "text";
  } else {
    control.rows = 3;
  }
  control.placeholder = placeholder;
  control.value = value;
  control.dataset.projectId = projectId;
  control.dataset.projectField = fieldName;
  field.append(control);

  return field;
}

function buildProjectActions(projectId) {
  const actions = createElement("div", "project-row-actions");
  const remove = createElement("button", "icon-button icon-button--danger", "×");
  remove.type = "button";
  remove.dataset.action = "remove-project";
  remove.dataset.projectId = projectId;
  remove.setAttribute("aria-label", "Remove project");
  actions.append(remove);
  return actions;
}

function getLanguageLevelLabel(value) {
  return LANGUAGE_LEVELS.find((level) => level.value === Number(value))?.label || LANGUAGE_LEVELS[2].label;
}

function createElement(tagName, className = "", text = "") {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}
