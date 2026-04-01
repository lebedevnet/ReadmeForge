import { LANGUAGE_LEVELS, LAYOUT_STYLES } from "./data-options.js";
import { buildReadmeModel, getLanguageFlag } from "./generator.js";
import { ensureUrl } from "./utils.js";

export function renderPreview(container, state) {
  const model = buildReadmeModel(state);
  container.replaceChildren();

  if (!model.hasMeaningfulContent) {
    const empty = document.createElement("div");
    empty.className = "preview-empty";
    empty.textContent = "Fill in your details to see a faithful README preview.";
    container.append(empty);
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = `preview-readme preview-readme--${state.appearance.layoutStyle}`;

  const layoutMeta = LAYOUT_STYLES.find((item) => item.id === state.appearance.layoutStyle);
  const layoutTag = document.createElement("div");
  layoutTag.className = "preview-layout-tag";
  layoutTag.textContent = `${layoutMeta?.label || "Classic"} preview`;
  wrapper.append(layoutTag);

  if (state.appearance.layoutStyle === "minimal") {
    wrapper.append(buildMinimalPreview(model));
  } else if (state.appearance.layoutStyle === "portfolio") {
    wrapper.append(buildPortfolioPreview(model));
  } else {
    wrapper.append(buildClassicPreview(model));
  }

  container.append(wrapper);
}

function buildClassicPreview(model) {
  const fragment = document.createDocumentFragment();
  fragment.append(createImageBlock(model.bannerUrl, `${model.displayName} banner`, "preview-banner"));

  const hero = document.createElement("section");
  hero.className = "preview-hero preview-hero--center";
  const typingPreview = buildTypingPreview(model);
  if (typingPreview) {
    hero.append(typingPreview);
  }
  if (model.socials.length || (model.state.widgets.views && model.viewsUrl)) {
    hero.append(buildSocialBadgeRow(model, true));
  }
  if (model.headerBadges.length) {
    hero.append(buildHeaderBadgeRow(model));
  }
  fragment.append(hero);

  appendBodySections(fragment, model);
  return fragment;
}

function buildMinimalPreview(model) {
  const fragment = document.createDocumentFragment();
  const intro = document.createElement("section");
  intro.className = "preview-section preview-section--minimal";

  const title = document.createElement("h1");
  title.className = "preview-h1";
  title.textContent = model.displayName;
  intro.append(title);

  const role = document.createElement("p");
  role.className = "preview-role";
  role.textContent = model.role;
  intro.append(role);

  const typingPreview = buildTypingPreview(model);
  if (typingPreview) {
    intro.append(typingPreview);
  }

  if (model.state.profile.bio.trim()) {
    const bio = document.createElement("p");
    bio.className = "preview-copy";
    bio.textContent = model.state.profile.bio.trim();
    intro.append(bio);
  }

  if (model.socials.length || (model.state.widgets.views && model.viewsUrl)) {
    intro.append(buildSocialBadgeRow(model, true));
  }
  if (model.headerBadges.length) {
    intro.append(buildHeaderBadgeRow(model));
  }

  fragment.append(intro);
  appendBodySections(fragment, model, { includeBioInAbout: false });
  return fragment;
}

function buildPortfolioPreview(model) {
  const fragment = document.createDocumentFragment();
  fragment.append(createImageBlock(model.bannerUrl, `${model.displayName} banner`, "preview-banner"));

  const callout = document.createElement("section");
  callout.className = "preview-section preview-section--callout";

  const heading = document.createElement("h2");
  heading.className = "preview-h2 preview-h2--large";
  heading.textContent = model.displayName;
  callout.append(heading);

  const role = document.createElement("p");
  role.className = "preview-role";
  role.textContent = model.role;
  callout.append(role);

  const typingPreview = buildTypingPreview(model);
  if (typingPreview) {
    callout.append(typingPreview);
  }

  if (model.state.profile.bio.trim()) {
    const bio = document.createElement("p");
    bio.className = "preview-copy";
    bio.textContent = model.state.profile.bio.trim();
    callout.append(bio);
  }

  if (model.socials.length || (model.state.widgets.views && model.viewsUrl)) {
    callout.append(buildSocialBadgeRow(model, true));
  }
  if (model.headerBadges.length) {
    callout.append(buildHeaderBadgeRow(model));
  }

  if (model.primaryContactUrl) {
    const cta = document.createElement("p");
    cta.className = "preview-callout-copy";
    cta.textContent = "Building something interesting? This README pushes your contact and featured work higher up.";
    callout.append(cta);
  }

  fragment.append(callout);
  appendBodySections(fragment, model, { includeBioInAbout: false });
  return fragment;
}

function appendBodySections(fragment, model, options = { includeBioInAbout: true }) {
  const aboutSection = buildAboutSection(model, options.includeBioInAbout);
  if (aboutSection) {
    fragment.append(aboutSection);
  }

  const projectSection = buildFeaturedProjectsSection(model);
  if (projectSection) {
    fragment.append(projectSection);
  }

  const techSection = buildTechSection(model);
  if (techSection) {
    fragment.append(techSection);
  }

  const languagesSection = buildLanguagesSection(model);
  if (languagesSection) {
    fragment.append(languagesSection);
  }

  const statsSection = buildStatsSection(model);
  if (statsSection) {
    fragment.append(statsSection);
  }

  const optionalSection = buildOptionalWidgetsSection(model);
  if (optionalSection) {
    fragment.append(optionalSection);
  }

  const quoteSection = buildQuoteSection(model);
  if (quoteSection) {
    fragment.append(quoteSection);
  }

  fragment.append(buildFooterSection(model));
}

function buildAboutSection(model, includeBio = true) {
  const facts = [
    model.state.profile.location ? ["Location", model.state.profile.location.trim()] : null,
    model.state.profile.experience ? ["Experience", model.state.profile.experience.trim()] : null,
    model.state.profile.education ? ["Education", model.state.profile.education.trim()] : null,
    model.state.profile.learning ? ["Learning", model.state.profile.learning.trim()] : null,
    model.state.profile.funFact ? ["Fun fact", model.state.profile.funFact.trim()] : null,
  ].filter(Boolean);

  if ((!includeBio || !model.state.profile.bio.trim()) && !facts.length) {
    return null;
  }

  const section = createSection("About");
  if (includeBio && model.state.profile.bio.trim()) {
    const copy = document.createElement("p");
    copy.className = "preview-copy";
    copy.textContent = model.state.profile.bio.trim();
    section.append(copy);
  }

  if (facts.length) {
    const list = document.createElement("ul");
    list.className = "preview-list";
    facts.forEach(([label, value]) => {
      const item = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = `${label}: `;
      item.append(strong, document.createTextNode(value));
      list.append(item);
    });
    section.append(list);
  }

  return section;
}

function buildFeaturedProjectsSection(model) {
  if (!model.featuredProjects.length) {
    return null;
  }

  const section = createSection("Featured Projects");
  const list = document.createElement("div");
  list.className = "preview-projects";

  model.featuredProjects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "preview-project";

    const title = document.createElement("h3");
    title.className = "preview-project-title";
    title.textContent = project.title.trim() || "Untitled project";
    card.append(title);

    if (project.description.trim()) {
      const description = document.createElement("p");
      description.className = "preview-copy";
      description.textContent = project.description.trim();
      card.append(description);
    }

    if (project.url.trim()) {
      const link = document.createElement("a");
      link.className = "preview-link";
      link.href = ensureUrl(project.url.trim());
      link.target = "_blank";
      link.rel = "noreferrer noopener";
      link.textContent = project.url.trim();
      card.append(link);
    }

    list.append(card);
  });

  section.append(list);
  return section;
}

function buildTechSection(model) {
  if (!model.techGroups.some((group) => group.items.length)) {
    return null;
  }

  const section = createSection("Stack");
  const groups = document.createElement("div");
  groups.className = "preview-stack-groups";

  model.techGroups.forEach((group) => {
    if (!group.items.length) {
      return;
    }

    const block = document.createElement("div");
    block.className = "preview-stack-group";

    const label = document.createElement("p");
    label.className = "preview-muted-label";
    label.textContent = group.label;
    block.append(label);

    if (group.skillIcons.length) {
      block.append(
        createImageBlock(
          `https://skillicons.dev/icons?i=${group.skillIcons.join(",")}&theme=dark`,
          `${group.label} skillicons`,
          "preview-inline-image"
        )
      );
    }

    if (group.id === "custom" && group.items.length) {
      const row = document.createElement("div");
      row.className = "preview-chip-row";
      group.items.forEach((item) => {
        const pill = document.createElement("span");
        pill.className = "preview-pill";
        pill.textContent = item.label.trim();
        row.append(pill);
      });
      block.append(row);
    }

    groups.append(block);
  });

  section.append(groups);
  return section;
}

function buildLanguagesSection(model) {
  if (!model.spokenLanguages.length) {
    return null;
  }

  const section = createSection("Languages");
  const list = document.createElement("div");
  list.className = "preview-language-list";

  model.spokenLanguages.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "preview-language";

    const name = document.createElement("span");
    name.className = "preview-language-name";
    name.textContent = `${getLanguageFlag(entry.name)} ${entry.name.trim()}`;
    row.append(name);

    const badge = document.createElement("img");
    const levelMeta = LANGUAGE_LEVELS.find((level) => level.value === Number(entry.level)) || LANGUAGE_LEVELS[2];
    badge.src = `https://img.shields.io/badge/-${encodeURIComponent(levelMeta.label)}-${levelMeta.badgeColor}?style=flat-square`;
    badge.alt = `${entry.name.trim()} ${levelMeta.label}`;
    row.append(badge);

    list.append(row);
  });

  section.append(list);
  return section;
}

function buildStatsSection(model) {
  if (!model.username) {
    return null;
  }

  const hasStats = model.state.widgets.stats || model.state.widgets.langs || model.state.widgets.streak;
  if (!hasStats) {
    return null;
  }

  const section = createSection("GitHub Stats");
  const grid = document.createElement("div");
  grid.className = "preview-stats-grid";

  if (model.state.widgets.stats && model.statsUrl) {
    grid.append(createImageBlock(model.statsUrl, "GitHub stats", "preview-card-image"));
  }

  if (model.state.widgets.langs && model.topLanguagesUrl) {
    grid.append(createImageBlock(model.topLanguagesUrl, "Top languages", "preview-card-image"));
  }

  if (grid.childElementCount > 0) {
    section.append(grid);
  }

  if (model.state.widgets.streak && model.streakUrl) {
    section.append(createImageBlock(model.streakUrl, "GitHub streak", "preview-card-image preview-card-image--full"));
  }

  return section;
}

function buildOptionalWidgetsSection(model) {
  const blocks = [];

  if (model.state.widgets.trophies && model.trophyUrl) {
    blocks.push(["Trophies", createImageBlock(model.trophyUrl, "Trophies", "preview-card-image preview-card-image--full")]);
  }

  if (model.state.widgets.activity && model.activityUrl) {
    blocks.push(["Activity", createImageBlock(model.activityUrl, "Activity graph", "preview-card-image preview-card-image--full")]);
  }

  if (model.state.widgets.waka && model.wakaUrl) {
    blocks.push(["Coding Time", createImageBlock(model.wakaUrl, "WakaTime chart", "preview-card-image preview-card-image--full")]);
  }

  if (model.state.widgets.spotify) {
    blocks.push(["Now Playing", createImageBlock(model.spotifyUrl, "Spotify widget", "preview-card-image preview-card-image--full")]);
  }

  if (model.state.widgets.snake && model.username && model.snakeDarkUrl) {
    // GitHub README supports a picture source set here. The preview uses the dark asset directly as a close visual approximation.
    blocks.push([
      "Contribution Snake",
      createImageBlock(model.snakeDarkUrl, "Contribution snake", "preview-card-image preview-card-image--full"),
    ]);
  }

  if (!blocks.length) {
    return null;
  }

  const section = createSection("Extras");
  blocks.forEach(([label, content]) => {
    const block = document.createElement("div");
    block.className = "preview-extra";
    const heading = document.createElement("p");
    heading.className = "preview-muted-label";
    heading.textContent = label;
    block.append(heading, content);
    section.append(block);
  });

  return section;
}

function buildQuoteSection(model) {
  if (!model.state.widgets.quote) {
    return null;
  }

  const section = createSection("Quote");
  if (model.quote) {
    const quote = document.createElement("blockquote");
    quote.className = "preview-quote";
    quote.textContent = model.quote;
    section.append(quote);
    return section;
  }

  section.append(createImageBlock(model.quoteUrl, "Developer quote", "preview-card-image preview-card-image--full"));
  return section;
}

function buildFooterSection(model) {
  const section = document.createElement("section");
  section.className = "preview-footer";

  const line = document.createElement("p");
  line.className = "preview-footer-copy";
  line.textContent = model.username
    ? `Made with ReadmeForge · github.com/${model.username}`
    : "Made with ReadmeForge";
  section.append(line);

  if (model.state.appearance.layoutStyle === "classic") {
    section.append(createImageBlock(model.footerBannerUrl, "Footer wave", "preview-footer-wave"));
  }

  return section;
}

function buildSocialBadgeRow(model, includeViews) {
  const row = document.createElement("div");
  row.className = "preview-badge-row";

  model.socials.forEach((entry) => {
    const image = document.createElement("img");
    image.src = entry.badgeUrl;
    image.alt = entry.meta.badgeLabel;
    row.append(image);
  });

  if (includeViews && model.state.widgets.views && model.viewsUrl) {
    const image = document.createElement("img");
    image.src = model.viewsUrl;
    image.alt = "Profile views";
    row.append(image);
  }

  return row;
}

function buildHeaderBadgeRow(model) {
  const row = document.createElement("div");
  row.className = "preview-badge-row preview-badge-row--compact";

  model.headerBadges.forEach((badge) => {
    const image = document.createElement("img");
    image.src = badge.imageUrl;
    image.alt = badge.label;
    row.append(image);
  });

  return row;
}

function createSection(title) {
  const section = document.createElement("section");
  section.className = "preview-section";
  const heading = document.createElement("h2");
  heading.className = "preview-h2";
  heading.textContent = title;
  section.append(heading);
  return section;
}

function buildTypingPreview(model) {
  if (!model.state.widgets.typing || !model.typingLines.length) {
    return null;
  }

  const shell = document.createElement("div");
  shell.className = "preview-typing";
  shell.setAttribute("aria-label", "Typing lines preview");

  model.typingLines.forEach((line) => {
    const row = document.createElement("div");
    row.className = "preview-typing-line";

    const prompt = document.createElement("span");
    prompt.className = "preview-typing-prompt";
    prompt.textContent = ">";

    const text = document.createElement("span");
    text.className = "preview-typing-text";
    text.textContent = line;

    row.append(prompt, text);
    shell.append(row);
  });

  return shell;
}

function createImageBlock(src, alt, className) {
  const image = document.createElement("img");
  image.className = className;
  image.src = src;
  image.alt = alt;
  image.loading = "lazy";
  return image;
}
