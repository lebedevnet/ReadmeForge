import {
  ACTIVITY_GRAPH_THEME_MAP,
  LANGUAGE_LEVELS,
  SOCIAL_FIELDS,
  STATUS_OPTIONS,
  TROPHY_SUPPORTED_THEMES,
} from "./data-options.js";
import { ACCENT_THEME_BY_ID, STATS_THEME_BY_ID } from "./data-themes.js";
import { TECH_BY_ID, TECH_GROUPS } from "./data-tech.js";
import {
  encodeBadgeText,
  ensureUrl,
  escapeHtml,
  escapeHtmlAttribute,
  escapeMarkdownText,
  isFilled,
  joinDefined,
  normalizeMarkdown,
} from "./utils.js";

export function buildReadmeModel(state) {
  const accentTheme = ACCENT_THEME_BY_ID.get(state.appearance.accentId) || ACCENT_THEME_BY_ID.values().next().value;
  const statsTheme = STATS_THEME_BY_ID.get(state.appearance.statsThemeId) || STATS_THEME_BY_ID.values().next().value;
  const statusMeta = STATUS_OPTIONS.find((option) => option.id === state.header.status) || STATUS_OPTIONS[0];
  const accentHex = accentTheme.color.replace("#", "");
  const bannerColor = accentTheme.gradient || accentHex;
  const typingLines = state.profile.typingLines.map((line) => `${line || ""}`.trim()).filter(Boolean);
  const socials = buildSocials(state);
  const headerBadges = buildHeaderBadges(state, statusMeta, accentHex);
  const techGroups = buildTechGroups(state);
  const spokenLanguages = state.spokenLanguages
    .filter((entry) => isFilled(entry.name))
    .map((entry) => ({
      ...entry,
      levelMeta: LANGUAGE_LEVELS.find((level) => level.value === Number(entry.level)) || LANGUAGE_LEVELS[2],
    }));
  const featuredProjects = state.featuredProjects.filter(
    (entry) => isFilled(entry.title) || isFilled(entry.description) || isFilled(entry.url)
  );
  const displayName = state.profile.name.trim() || state.profile.username.trim() || "GitHub Profile";
  const role = state.profile.role.trim() || "Developer";
  const username = state.profile.username.trim();
  const quote = state.profile.quote.trim();
  const hasPrimaryIdentity =
    isFilled(state.profile.name) ||
    isFilled(state.profile.username) ||
    isFilled(state.profile.role) ||
    isFilled(state.profile.bio);
  const hasMeaningfulContent =
    hasPrimaryIdentity ||
    techGroups.some((group) => group.items.length > 0) ||
    socials.length > 0 ||
    featuredProjects.length > 0 ||
    headerBadges.length > 0;

  return {
    state,
    accentTheme,
    statsTheme,
    statusMeta,
    accentHex,
    bannerColor,
    displayName,
    username,
    role,
    typingLines,
    socials,
    headerBadges,
    techGroups,
    spokenLanguages,
    featuredProjects,
    quote,
    hasMeaningfulContent,
    bannerUrl: `https://capsule-render.vercel.app/api?type=waving&color=${bannerColor}&height=240&section=header&text=${encodeURIComponent(
      displayName
    )}&fontSize=68&fontColor=ffffff&fontAlignY=38&fontStyle=bold&desc=${encodeURIComponent(role)}&descSize=20&descAlignY=58&descColor=ffffffaa&animation=fadeIn&stroke=ffffff&strokeWidth=2`,
    footerBannerUrl: `https://capsule-render.vercel.app/api?type=waving&color=${bannerColor}&height=120&section=footer`,
    typingUrl:
      typingLines.length > 0
        ? `https://readme-typing-svg.demolab.com?font=Fira+Code&size=20&pause=1000&color=${accentHex}&center=true&vCenter=true&width=640&lines=${typingLines
            .map((line) => encodeURIComponent(line))
            .join(";")}`
        : "",
    statsUrl: username
      ? `https://github-readme-stats.vercel.app/api?username=${encodeURIComponent(
          username
        )}&show_icons=true&theme=${statsTheme.code}&include_all_commits=true&count_private=true&hide_border=true`
      : "",
    topLanguagesUrl: username
      ? `https://github-readme-stats.vercel.app/api/top-langs/?username=${encodeURIComponent(
          username
        )}&layout=compact&langs_count=8&theme=${statsTheme.code}&hide_border=true`
      : "",
    streakUrl: username
      ? `https://streak-stats.demolab.com?user=${encodeURIComponent(username)}&theme=${statsTheme.code}&hide_border=true`
      : "",
    trophyUrl: username
      ? `https://github-profile-trophy.vercel.app/?username=${encodeURIComponent(
          username
        )}&theme=${TROPHY_SUPPORTED_THEMES.has(statsTheme.code) ? statsTheme.code : "tokyonight"}&column=6&no-frame=true&margin-w=8`
      : "",
    activityUrl: username
      ? `https://github-readme-activity-graph.vercel.app/graph?username=${encodeURIComponent(
          username
        )}&theme=${ACTIVITY_GRAPH_THEME_MAP[statsTheme.code] || "tokyo-night"}&hide_border=true&area=true`
      : "",
    wakaUrl: username
      ? `https://github-readme-stats.vercel.app/api/wakatime?username=${encodeURIComponent(
          username
        )}&theme=${statsTheme.code}&hide_border=true`
      : "",
    spotifyUrl: "https://novatorem.vercel.app/api/spotify",
    snakeDarkUrl: username
      ? `https://raw.githubusercontent.com/${encodeURIComponent(username)}/${encodeURIComponent(
          username
        )}/output/github-contribution-grid-snake-dark.svg`
      : "",
    snakeLightUrl: username
      ? `https://raw.githubusercontent.com/${encodeURIComponent(username)}/${encodeURIComponent(
          username
        )}/output/github-contribution-grid-snake.svg`
      : "",
    quoteUrl: `https://quotes-github-readme.vercel.app/api?type=horizontal&theme=${statsTheme.code}`,
    viewsUrl: username
      ? `https://komarev.com/ghpvc/?username=${encodeURIComponent(username)}&color=${accentHex}&style=flat-square`
      : "",
    websiteUrl: socials.find((entry) => entry.meta.id === "website")?.url || "",
    primaryContactUrl:
      socials.find((entry) => entry.meta.id === "website")?.url ||
      socials.find((entry) => entry.meta.id === "linkedin")?.url ||
      socials.find((entry) => entry.meta.id === "email")?.url ||
      "",
  };
}

export function generateMarkdown(state) {
  const model = buildReadmeModel(state);

  if (!model.hasMeaningfulContent) {
    return "";
  }

  const markdown =
    model.state.appearance.layoutStyle === "minimal"
      ? renderMinimalMarkdown(model)
      : model.state.appearance.layoutStyle === "portfolio"
      ? renderPortfolioMarkdown(model)
      : renderClassicMarkdown(model);

  return normalizeMarkdown(markdown);
}

function renderClassicMarkdown(model) {
  const blocks = [];

  blocks.push(
    `<div align="center">\n  <img src="${model.bannerUrl}" width="100%" alt="${escapeHtmlAttribute(
      `${model.displayName} banner`
    )}"/>\n</div>`
  );

  const centerBits = [];
  if (model.state.widgets.typing && model.typingUrl) {
    centerBits.push(`[![Typing SVG](${model.typingUrl})](https://git.io/typing-svg)`);
  }
  const socialLine = buildSocialBadgeMarkdown(model, true);
  if (socialLine) {
    centerBits.push(socialLine);
  }
  if (model.headerBadges.length) {
    centerBits.push(model.headerBadges.map((badge) => badge.markdown).join(" "));
  }
  if (centerBits.length) {
    blocks.push(`<div align="center">\n\n${centerBits.join("\n\n")}\n\n</div>`);
  }

  blocks.push(renderAboutMarkdown(model));
  blocks.push(renderFeaturedProjectsMarkdown(model));
  blocks.push(renderTechMarkdown(model));
  blocks.push(renderLanguagesMarkdown(model));
  blocks.push(renderStatsMarkdown(model, true));
  blocks.push(renderOptionalWidgetsMarkdown(model));
  blocks.push(renderQuoteMarkdown(model));
  blocks.push(
    `---\n\n<div align="center">\n\n<sub>Made with <a href="https://lebedevnet.github.io/ReadmeForge/">ReadmeForge</a>${
      model.username
        ? ` · <a href="https://github.com/${encodeURIComponent(model.username)}">github.com/${escapeHtml(model.username)}</a>`
        : ""
    }</sub>\n\n<img src="${model.footerBannerUrl}" width="100%" alt="Footer wave"/>\n\n</div>`
  );

  return blocks.filter(Boolean).join("\n\n");
}

function renderMinimalMarkdown(model) {
  const lines = [];

  lines.push(`# ${escapeMarkdownText(model.displayName)}`);
  lines.push(`**${escapeMarkdownText(model.role)}**`);
  if (model.state.widgets.typing && model.typingUrl) {
    lines.push(`[![Typing SVG](${model.typingUrl})](https://git.io/typing-svg)`);
  }
  if (isFilled(model.state.profile.bio)) {
    lines.push(escapeMarkdownText(model.state.profile.bio.trim()));
  }

  const headerInfo = buildInlineHeaderInfo(model);
  if (headerInfo.length) {
    lines.push(headerInfo.join(" · "));
  }

  const minimalSocials = buildSocialBadgeMarkdown(model, true);
  if (minimalSocials) {
    lines.push(minimalSocials);
  }

  lines.push(renderAboutMarkdown(model, "## Snapshot", false));
  lines.push(renderFeaturedProjectsMarkdown(model, "## Featured Work"));
  lines.push(renderTechMarkdown(model, "## Stack"));
  lines.push(renderLanguagesMarkdown(model, "## Languages"));
  lines.push(renderStatsMarkdown(model, false, "## GitHub Signals"));
  lines.push(renderOptionalWidgetsMarkdown(model, "## Extras"));
  lines.push(renderQuoteMarkdown(model, "## Note"));

  const footerLinks = [];
  if (model.primaryContactUrl) {
    footerLinks.push(`[Say hello](${model.primaryContactUrl})`);
  }
  footerLinks.push("[Made with ReadmeForge](https://lebedevnet.github.io/ReadmeForge/)");
  lines.push(footerLinks.join(" · "));

  return lines.filter(Boolean).join("\n\n");
}

function renderPortfolioMarkdown(model) {
  const sections = [];
  sections.push(
    `<div align="center">\n  <img src="${model.bannerUrl}" width="100%" alt="${escapeHtmlAttribute(
      `${model.displayName} banner`
    )}"/>\n</div>`
  );

  const heroBits = [`## ${escapeMarkdownText(model.displayName)}`, `**${escapeMarkdownText(model.role)}**`];
  if (model.state.widgets.typing && model.typingUrl) {
    heroBits.push(`[![Typing SVG](${model.typingUrl})](https://git.io/typing-svg)`);
  }
  const socialLine = buildSocialBadgeMarkdown(model, true);
  if (socialLine) {
    heroBits.push(socialLine);
  }
  if (model.headerBadges.length) {
    heroBits.push(model.headerBadges.map((badge) => badge.markdown).join(" "));
  }
  sections.push(heroBits.join("\n\n"));

  const ctaLines = [];
  if (isFilled(model.state.profile.bio)) {
    ctaLines.push(escapeMarkdownText(model.state.profile.bio.trim()));
  }
  if (model.primaryContactUrl) {
    ctaLines.push(`> Building something interesting? Let's connect: ${model.primaryContactUrl}`);
  }
  sections.push(ctaLines.join("\n\n"));

  sections.push(renderAboutMarkdown(model, "## Snapshot", false));
  sections.push(renderFeaturedProjectsMarkdown(model, "## Featured Projects"));
  sections.push(renderTechMarkdown(model, "## Tools I Reach For"));
  sections.push(renderLanguagesMarkdown(model, "## Languages"));
  sections.push(renderStatsMarkdown(model, false, "## GitHub Signals"));
  sections.push(renderOptionalWidgetsMarkdown(model, "## Extras"));
  sections.push(renderQuoteMarkdown(model, "## Quote"));

  sections.push(
    `<div align="center">\n\n<sub>[Open ReadmeForge](https://lebedevnet.github.io/ReadmeForge/)${
      model.primaryContactUrl ? ` · [Get in touch](${model.primaryContactUrl})` : ""
    }</sub>\n\n</div>`
  );

  return sections.filter(Boolean).join("\n\n");
}

function renderAboutMarkdown(model, heading = "### About", includeIntro = true) {
  const intro = includeIntro && isFilled(model.state.profile.bio) ? escapeMarkdownText(model.state.profile.bio.trim()) : "";
  const lines = [];

  const facts = [
    model.state.profile.location ? `⌖ **Location** · ${escapeMarkdownText(model.state.profile.location.trim())}` : "",
    model.state.profile.experience ? `⌗ **Experience** · ${escapeMarkdownText(model.state.profile.experience.trim())}` : "",
    model.state.profile.education ? `◎ **Education** · ${escapeMarkdownText(model.state.profile.education.trim())}` : "",
    model.state.profile.learning ? `⟳ **Learning** · ${escapeMarkdownText(model.state.profile.learning.trim())}` : "",
    model.state.profile.funFact ? `✦ **Fun fact** · ${escapeMarkdownText(model.state.profile.funFact.trim())}` : "",
  ].filter(Boolean);

  if (!intro && !facts.length) {
    return "";
  }

  if (heading) {
    lines.push(heading);
  }
  if (intro) {
    lines.push(intro);
  }

  if (facts.length) {
    lines.push(facts.map((fact) => `- ${fact}`).join("\n"));
  }
  return lines.join("\n\n");
}

function renderFeaturedProjectsMarkdown(model, heading = "### Featured Projects") {
  if (!model.featuredProjects.length) {
    return "";
  }

  const lines = [heading];

  model.featuredProjects.forEach((project) => {
    const title = isFilled(project.title) ? project.title.trim() : "Untitled project";
    const label = project.url
      ? `[${escapeMarkdownText(title)}](${ensureUrl(project.url)})`
      : `**${escapeMarkdownText(title)}**`;
    const description = escapeMarkdownText(project.description.trim());
    lines.push(`- ${joinDefined([label, description], " — ")}`);
  });

  return lines.join("\n\n");
}

function renderTechMarkdown(model, heading = "### Stack") {
  if (!model.techGroups.some((group) => group.items.length > 0)) {
    return "";
  }

  const lines = [heading];

  model.techGroups.forEach((group) => {
    if (!group.items.length) {
      return;
    }

    lines.push(`**${group.label}**`);

    if (group.skillIcons.length) {
      lines.push(`<img src="https://skillicons.dev/icons?i=${group.skillIcons.join(",")}&theme=dark" alt="${group.label}"/>`);
    }

    if (group.badgeOnlyItems.length) {
      lines.push(group.badgeOnlyItems.map((item) => buildTechBadgeMarkdown(item)).join(" "));
    }
  });

  return lines.join("\n\n");
}

function renderLanguagesMarkdown(model, heading = "### Languages") {
  if (!model.spokenLanguages.length) {
    return "";
  }

  const lines = [heading];

  model.spokenLanguages.forEach((entry) => {
    lines.push(
      `- ${getLanguageFlag(entry.name)} **${escapeMarkdownText(entry.name.trim())}** · ![${entry.levelMeta.label}](https://img.shields.io/badge/-${encodeBadgeText(
        entry.levelMeta.label
      )}-${entry.levelMeta.badgeColor}?style=flat-square)`
    );
  });

  return lines.join("\n");
}

function renderStatsMarkdown(model, centered = true, heading = "### GitHub Stats") {
  if (!model.username) {
    return "";
  }

  const imageBits = [];
  if (model.state.widgets.stats && model.statsUrl) {
    imageBits.push(
      `<img height="165" src="${model.statsUrl}" alt="${escapeHtmlAttribute(`${model.displayName} stats`)}"/>`
    );
  }
  if (model.state.widgets.langs && model.topLanguagesUrl) {
    imageBits.push(
      `<img height="165" src="${model.topLanguagesUrl}" alt="${escapeHtmlAttribute(`${model.displayName} top languages`)}"/>`
    );
  }

  const lines = [heading];

  if (centered && imageBits.length) {
    lines.push(`<div align="center">\n\n${imageBits.join(" ")}\n\n</div>`);
  } else if (imageBits.length) {
    lines.push(imageBits.join("\n\n"));
  }

  if (model.state.widgets.streak && model.streakUrl) {
    lines.push(
      centered
        ? `<div align="center">\n\n[![GitHub Streak](${model.streakUrl})](https://git.io/streak-stats)\n\n</div>`
        : `[![GitHub Streak](${model.streakUrl})](https://git.io/streak-stats)`
    );
  }

  return lines.length > 1 ? lines.join("\n\n") : "";
}

function renderOptionalWidgetsMarkdown(model, heading = "") {
  const blocks = [];

  if (model.state.widgets.trophies && model.trophyUrl) {
    blocks.push(
      `### Trophies\n\n<div align="center">\n\n<img src="${model.trophyUrl}" alt="${escapeHtmlAttribute(
        `${model.displayName} trophies`
      )}"/>\n\n</div>`
    );
  }

  if (model.state.widgets.activity && model.activityUrl) {
    blocks.push(`### Activity\n\n[![Activity Graph](${model.activityUrl})](${model.activityUrl})`);
  }

  if (model.state.widgets.waka && model.wakaUrl) {
    blocks.push(
      `### Coding Time\n\n<div align="center">\n\n[![WakaTime](${model.wakaUrl})](https://wakatime.com/@${model.username})\n\n</div>\n\n> Requires a public WakaTime profile`
    );
  }

  if (model.state.widgets.spotify) {
    blocks.push(
      `### Now Playing\n\n<div align="center">\n\n[![Spotify](${model.spotifyUrl})](https://open.spotify.com)\n\n</div>\n\n> Requires [Novatorem](https://github.com/novatorem/novatorem) setup`
    );
  }

  if (model.state.widgets.snake && model.username) {
    blocks.push(
      `### Contribution Snake\n\n<div align="center">\n\n<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="${model.snakeDarkUrl}">\n  <img alt="Contribution snake" src="${model.snakeLightUrl}">\n</picture>\n\n</div>\n\n> Requires GitHub Actions setup`
    );
  }

  if (!blocks.length) {
    return "";
  }

  if (!heading) {
    return blocks.join("\n\n");
  }

  return `${heading}\n\n${blocks.join("\n\n")}`;
}

function renderQuoteMarkdown(model, heading = "") {
  if (!model.state.widgets.quote) {
    return "";
  }

  if (model.quote) {
    return joinDefined([heading, `> "${escapeMarkdownText(model.quote)}"`], "\n\n");
  }

  return joinDefined([heading, `![Quote](${model.quoteUrl})`], "\n\n");
}

function buildSocials(state) {
  return SOCIAL_FIELDS.map((meta) => {
    const rawValue = state.socials[meta.id];

    if (!isFilled(rawValue)) {
      return null;
    }

    if (meta.id === "buymeacoffee" && !state.widgets.bmc) {
      return null;
    }

    const url = meta.id === "email" ? `mailto:${rawValue.trim()}` : ensureUrl(rawValue);
    return {
      meta,
      rawValue,
      url,
      badgeUrl: `https://img.shields.io/badge/${encodeBadgeText(meta.badgeLabel)}-${meta.badgeColor}?style=flat-square&logo=${meta.badgeLogo}&logoColor=${meta.badgeLogoColor}`,
      markdown: `[![${meta.badgeLabel}](https://img.shields.io/badge/${encodeBadgeText(meta.badgeLabel)}-${meta.badgeColor}?style=flat-square&logo=${meta.badgeLogo}&logoColor=${meta.badgeLogoColor})](${url})`,
    };
  }).filter(Boolean);
}

function buildHeaderBadges(state, statusMeta, accentHex) {
  const badges = [];
  const statusText = state.header.customStatus.trim() || statusMeta.defaultText;
  const statusColor = statusMeta.color === "accent" ? accentHex : statusMeta.color;

  if (state.header.status !== "none" && statusText) {
    const badgeText = `${statusMeta.emoji} ${statusText}`;
    badges.push({
      label: statusText,
      markdown: `![${escapeMarkdownText(statusText)}](https://img.shields.io/badge/${encodeBadgeText(
        badgeText
      )}-${statusColor}?style=flat-square)`,
      imageUrl: `https://img.shields.io/badge/${encodeBadgeText(badgeText)}-${statusColor}?style=flat-square`,
    });
  }

  if (isFilled(state.header.project)) {
    const label = `Building -> ${state.header.project.trim()}`;
    const imageMarkdown = `![${escapeMarkdownText(label)}](https://img.shields.io/badge/${encodeBadgeText(
      label
    )}-6366f1?style=flat-square&logo=github&logoColor=white)`;
    badges.push({
      label,
      markdown: isFilled(state.header.projectUrl) ? `[${imageMarkdown}](${ensureUrl(state.header.projectUrl)})` : imageMarkdown,
      imageUrl: `https://img.shields.io/badge/${encodeBadgeText(
        label
      )}-6366f1?style=flat-square&logo=github&logoColor=white`,
    });
  }

  if (isFilled(state.header.timezone)) {
    badges.push({
      label: state.header.timezone.trim(),
      markdown: `![${escapeMarkdownText(state.header.timezone.trim())}](https://img.shields.io/badge/${encodeBadgeText(
        state.header.timezone.trim()
      )}-333?style=flat-square)`,
      imageUrl: `https://img.shields.io/badge/${encodeBadgeText(state.header.timezone.trim())}-333?style=flat-square`,
    });
  }

  return badges;
}

function buildTechGroups(state) {
  const groups = TECH_GROUPS.map((group) => {
    const selectedItems = state.tech[group.id]
      .map((itemId) => TECH_BY_ID.get(itemId))
      .filter(Boolean);

    return {
      id: group.id,
      label: group.label,
      items: selectedItems,
      skillIcons: selectedItems.map((item) => item.skillIcon).filter(Boolean),
      badgeOnlyItems: [],
    };
  });

  if (Array.isArray(state.tech.custom) && state.tech.custom.length) {
    groups.push({
      id: "custom",
      label: "Custom",
      items: state.tech.custom.filter((item) => isFilled(item.label)),
      skillIcons: [],
      badgeOnlyItems: state.tech.custom
        .filter((item) => isFilled(item.label))
        .map((item) => ({
          label: item.label.trim(),
          badgeLabel: item.label.trim(),
          badgeColor: "111827",
          badgeLogo: "",
          badgeLogoColor: "white",
        })),
    });
  }

  return groups.map((group) => ({
    ...group,
    badgeOnlyItems:
      group.id === "custom"
        ? group.badgeOnlyItems
        : group.items.filter((item) => !item.skillIcon),
  }));
}

function buildTechBadgeMarkdown(item) {
  const badgeLabel = encodeBadgeText(item.badgeLabel || item.label);
  const altLabel = escapeMarkdownText(item.label);

  if (!item.badgeLogo) {
    return `![${altLabel}](https://img.shields.io/badge/${badgeLabel}-${item.badgeColor}?style=for-the-badge)`;
  }

  return `![${altLabel}](https://img.shields.io/badge/${badgeLabel}-${item.badgeColor}?style=for-the-badge&logo=${item.badgeLogo}&logoColor=${item.badgeLogoColor || "white"})`;
}

function buildSocialBadgeMarkdown(model, includeViews) {
  const entries = [...model.socials];

  if (includeViews && model.state.widgets.views && model.viewsUrl) {
    entries.push({
      markdown: `![Profile Views](${model.viewsUrl})`,
    });
  }

  return entries.map((entry) => entry.markdown).join(" ");
}

function buildInlineHeaderInfo(model) {
  return [
    model.state.profile.location ? `Location: ${escapeMarkdownText(model.state.profile.location.trim())}` : "",
    model.state.profile.experience ? `Experience: ${escapeMarkdownText(model.state.profile.experience.trim())}` : "",
    model.state.profile.learning ? `Learning: ${escapeMarkdownText(model.state.profile.learning.trim())}` : "",
  ].filter(Boolean);
}

export function getLanguageFlag(name) {
  const normalized = name.toLowerCase();

  if (normalized.includes("russian") || normalized.includes("рус")) return "🇷🇺";
  if (normalized.includes("english")) return "🇬🇧";
  if (normalized.includes("german") || normalized.includes("deutsch")) return "🇩🇪";
  if (normalized.includes("french")) return "🇫🇷";
  if (normalized.includes("spanish")) return "🇪🇸";
  if (normalized.includes("chinese")) return "🇨🇳";
  if (normalized.includes("japanese")) return "🇯🇵";
  if (normalized.includes("portuguese")) return "🇧🇷";
  if (normalized.includes("arabic")) return "🇸🇦";
  if (normalized.includes("turkish")) return "🇹🇷";

  return "🌐";
}
