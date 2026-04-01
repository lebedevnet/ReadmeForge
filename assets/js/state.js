import { CONFIG_VERSION } from "./data-options.js";
import { clone, createId } from "./utils.js";

export function createInitialState() {
  return {
    profile: {
      name: "",
      username: "",
      role: "",
      location: "",
      bio: "",
      experience: "",
      education: "",
      learning: "",
      funFact: "",
      typingLines: ["", ""],
      quote: "",
    },
    socials: {
      linkedin: "",
      twitter: "",
      telegram: "",
      youtube: "",
      twitch: "",
      devto: "",
      medium: "",
      email: "",
      website: "",
      buymeacoffee: "",
    },
    header: {
      status: "open",
      project: "",
      projectUrl: "",
      timezone: "",
      customStatus: "",
    },
    appearance: {
      accentId: "matrix",
      statsThemeId: "tokyonight",
      layoutStyle: "classic",
    },
    widgets: {
      typing: true,
      stats: true,
      streak: false,
      langs: true,
      trophies: false,
      activity: false,
      quote: false,
      views: false,
      snake: false,
      waka: false,
      spotify: false,
      bmc: false,
    },
    tech: {
      languages: [],
      frontend: [],
      backend: [],
      devops: [],
      ai: [],
      custom: [],
    },
    spokenLanguages: [
      {
        id: createId("lang"),
        name: "English",
        level: 5,
      },
    ],
    featuredProjects: [
      {
        id: createId("project"),
        title: "",
        description: "",
        url: "",
      },
    ],
    meta: {
      configVersion: CONFIG_VERSION,
    },
  };
}

export function normalizeState(input = {}) {
  const base = createInitialState();
  const nextState = clone(base);
  const source = input?.data && input.version ? input.data : input;

  if (!source || typeof source !== "object") {
    return nextState;
  }

  nextState.profile = {
    ...base.profile,
    ...(source.profile || {}),
    typingLines: Array.isArray(source.profile?.typingLines)
      ? source.profile.typingLines.slice(0, 4).map((line) => `${line ?? ""}`)
      : base.profile.typingLines,
  };
  nextState.socials = { ...base.socials, ...(source.socials || {}) };
  nextState.header = { ...base.header, ...(source.header || {}) };
  nextState.appearance = { ...base.appearance, ...(source.appearance || {}) };
  nextState.widgets = { ...base.widgets, ...(source.widgets || {}) };
  nextState.tech = {
    ...base.tech,
    ...(source.tech || {}),
    custom: Array.isArray(source.tech?.custom)
      ? source.tech.custom.map((item) => ({
          id: item.id || createId("tech"),
          label: `${item.label || ""}`.trim(),
        }))
      : [],
  };

  nextState.tech.languages = ensureStringArray(source.tech?.languages);
  nextState.tech.frontend = ensureStringArray(source.tech?.frontend);
  nextState.tech.backend = ensureStringArray(source.tech?.backend);
  nextState.tech.devops = ensureStringArray(source.tech?.devops);
  nextState.tech.ai = ensureStringArray(source.tech?.ai);

  nextState.spokenLanguages = normalizeSpokenLanguages(source.spokenLanguages);
  nextState.featuredProjects = normalizeFeaturedProjects(source.featuredProjects);
  nextState.meta = {
    configVersion: CONFIG_VERSION,
  };

  return nextState;
}

function ensureStringArray(value) {
  return Array.isArray(value)
    ? value.filter((entry) => typeof entry === "string" && entry.trim().length > 0)
    : [];
}

function normalizeSpokenLanguages(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return createInitialState().spokenLanguages;
  }

  return value.map((entry) => ({
    id: entry.id || createId("lang"),
    name: `${entry.name || ""}`,
    level: Number.isFinite(Number(entry.level))
      ? Math.max(1, Math.min(5, Number(entry.level)))
      : 3,
  }));
}

function normalizeFeaturedProjects(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return createInitialState().featuredProjects;
  }

  return value.map((entry) => ({
    id: entry.id || createId("project"),
    title: `${entry.title || ""}`,
    description: `${entry.description || ""}`,
    url: `${entry.url || ""}`,
  }));
}

export function serializeState(state) {
  const normalized = normalizeState(state);

  return {
    version: CONFIG_VERSION,
    data: {
      profile: normalized.profile,
      socials: normalized.socials,
      header: normalized.header,
      appearance: normalized.appearance,
      widgets: normalized.widgets,
      tech: normalized.tech,
      spokenLanguages: normalized.spokenLanguages,
      featuredProjects: normalized.featuredProjects,
    },
  };
}

export function createStore(initialState) {
  let currentState = normalizeState(initialState);
  const listeners = new Set();

  return {
    getState() {
      return currentState;
    },
    replace(nextState) {
      currentState = normalizeState(nextState);
      emit();
    },
    update(updater) {
      const draft = clone(currentState);
      updater(draft);
      currentState = normalizeState(draft);
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  function emit() {
    listeners.forEach((listener) => listener(currentState));
  }
}
