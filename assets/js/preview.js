const BLOCK_START_PATTERN = /^(#{1,6})\s+|^-\s+|^>\s?|^---+$|^<(div|picture|img|sub)\b/i;
const ALLOWED_IMAGE_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function renderPreview(container, markdown, layoutStyle = "classic") {
  container.replaceChildren();

  if (!markdown.trim()) {
    const empty = document.createElement("div");
    empty.className = "preview-empty";
    empty.textContent = "Fill in your details to see the generated README rendered here.";
    container.append(empty);
    return;
  }

  const surface = document.createElement("article");
  surface.className = "preview-readme markdown-body";
  surface.dataset.layoutStyle = layoutStyle;
  surface.setAttribute("aria-label", "Generated README preview");
  renderMarkdownInto(surface, markdown);
  container.append(surface);
}

function renderMarkdownInto(parent, markdown) {
  const lines = `${markdown || ""}`.replace(/\r\n?/g, "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^<div\b/i.test(trimmed)) {
      const { node, nextIndex } = consumeCenteredBlock(lines, index);
      parent.append(node);
      index = nextIndex;
      continue;
    }

    if (/^<picture\b/i.test(trimmed)) {
      const { html, nextIndex } = collectHtmlBlock(lines, index, "picture");
      parent.append(sanitizeHtmlFragment(html));
      index = nextIndex;
      continue;
    }

    if (/^<(img|sub)\b/i.test(trimmed)) {
      parent.append(sanitizeHtmlFragment(trimmed));
      index += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      parent.append(document.createElement("hr"));
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const heading = document.createElement(`h${Math.min(headingMatch[1].length, 6)}`);
      heading.append(renderInlineContent(headingMatch[2].trim()));
      parent.append(heading);
      index += 1;
      continue;
    }

    if (/^-\s+/.test(trimmed)) {
      const { node, nextIndex } = consumeList(lines, index);
      parent.append(node);
      index = nextIndex;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const { node, nextIndex } = consumeBlockquote(lines, index);
      parent.append(node);
      index = nextIndex;
      continue;
    }

    const { node, nextIndex } = consumeParagraph(lines, index);
    parent.append(node);
    index = nextIndex;
  }
}

function consumeCenteredBlock(lines, startIndex) {
  const openLine = lines[startIndex].trim();
  const innerLines = [];
  let index = startIndex + 1;

  while (index < lines.length && !/^<\/div>\s*$/i.test(lines[index].trim())) {
    innerLines.push(lines[index]);
    index += 1;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "markdown-align-center";

  if (/align\s*=\s*["']?center["']?/i.test(openLine)) {
    wrapper.dataset.align = "center";
  }

  renderMarkdownInto(wrapper, innerLines.join("\n"));

  return {
    node: wrapper,
    nextIndex: index < lines.length ? index + 1 : index,
  };
}

function consumeList(lines, startIndex) {
  const list = document.createElement("ul");
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!/^-+\s+/.test(line)) {
      break;
    }

    const item = document.createElement("li");
    item.append(renderInlineContent(line.replace(/^-+\s+/, "")));
    list.append(item);
    index += 1;
  }

  return { node: list, nextIndex: index };
}

function consumeBlockquote(lines, startIndex) {
  const quoteLines = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!/^>\s?/.test(line)) {
      break;
    }

    quoteLines.push(line.replace(/^>\s?/, ""));
    index += 1;
  }

  const blockquote = document.createElement("blockquote");
  renderMarkdownInto(blockquote, quoteLines.join("\n"));
  return { node: blockquote, nextIndex: index };
}

function consumeParagraph(lines, startIndex) {
  const paragraphLines = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      break;
    }

    if (index !== startIndex && BLOCK_START_PATTERN.test(trimmed)) {
      break;
    }

    paragraphLines.push(trimmed);
    index += 1;
  }

  const paragraph = document.createElement("p");
  paragraph.append(renderInlineContent(paragraphLines.join(" ")));
  return { node: paragraph, nextIndex: index };
}

function collectHtmlBlock(lines, startIndex, tagName) {
  const blockLines = [];
  let index = startIndex;
  const closePattern = new RegExp(`^<\\/${tagName}>\\s*$`, "i");

  while (index < lines.length) {
    blockLines.push(lines[index]);
    if (closePattern.test(lines[index].trim())) {
      index += 1;
      break;
    }
    index += 1;
  }

  return { html: blockLines.join("\n"), nextIndex: index };
}

function renderInlineContent(text) {
  const fragment = document.createDocumentFragment();
  let buffer = "";
  let cursor = 0;

  while (cursor < text.length) {
    const remainder = text.slice(cursor);

    if (text[cursor] === "\\") {
      buffer += text[cursor + 1] || "";
      cursor += 2;
      continue;
    }

    const linkedImageMatch = remainder.match(/^\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/);
    if (linkedImageMatch) {
      flushInlineBuffer(fragment, buffer);
      buffer = "";
      fragment.append(createLinkedImage(linkedImageMatch[1], linkedImageMatch[2], linkedImageMatch[3]));
      cursor += linkedImageMatch[0].length;
      continue;
    }

    const imageMatch = remainder.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      flushInlineBuffer(fragment, buffer);
      buffer = "";
      fragment.append(createImageNode(imageMatch[1], imageMatch[2]));
      cursor += imageMatch[0].length;
      continue;
    }

    const strongMatch = remainder.match(/^\*\*([\s\S]+?)\*\*/);
    if (strongMatch) {
      flushInlineBuffer(fragment, buffer);
      buffer = "";
      const strong = document.createElement("strong");
      strong.append(renderInlineContent(strongMatch[1]));
      fragment.append(strong);
      cursor += strongMatch[0].length;
      continue;
    }

    const linkMatch = remainder.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      flushInlineBuffer(fragment, buffer);
      buffer = "";
      fragment.append(createLinkNode(linkMatch[1], linkMatch[2]));
      cursor += linkMatch[0].length;
      continue;
    }

    buffer += text[cursor];
    cursor += 1;
  }

  flushInlineBuffer(fragment, buffer);
  return fragment;
}

function flushInlineBuffer(parent, buffer) {
  if (!buffer) {
    return;
  }

  parent.append(document.createTextNode(decodeText(buffer)));
}

function createLinkedImage(alt, src, href) {
  const link = document.createElement("a");
  const safeHref = sanitizeUrl(href, ALLOWED_LINK_PROTOCOLS);

  if (safeHref) {
    link.href = safeHref;
    link.target = "_blank";
    link.rel = "noreferrer noopener";
  }

  link.append(createImageNode(alt, src));
  return link;
}

function createLinkNode(label, href) {
  const safeHref = sanitizeUrl(href, ALLOWED_LINK_PROTOCOLS);

  if (!safeHref) {
    return document.createTextNode(decodeText(label));
  }

  const link = document.createElement("a");
  link.href = safeHref;
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.append(renderInlineContent(label));
  return link;
}

function createImageNode(alt, src) {
  const safeSrc = sanitizeUrl(src, ALLOWED_IMAGE_PROTOCOLS);

  if (!safeSrc) {
    return document.createTextNode("");
  }

  const image = document.createElement("img");
  image.src = safeSrc;
  image.alt = decodeText(alt);
  image.loading = "lazy";
  image.decoding = "async";
  return image;
}

function sanitizeHtmlFragment(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  return sanitizeChildNodes(template.content.childNodes);
}

function sanitizeChildNodes(nodes) {
  const fragment = document.createDocumentFragment();

  nodes.forEach((node) => {
    const sanitized = sanitizeNode(node);
    if (sanitized) {
      fragment.append(sanitized);
    }
  });

  return fragment;
}

function sanitizeNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const value = decodeText(node.textContent || "");
    return value.trim() ? document.createTextNode(value) : null;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  switch (node.tagName) {
    case "A":
      return sanitizeAnchor(node);
    case "IMG":
      return sanitizeImage(node);
    case "PICTURE":
      return sanitizePicture(node);
    case "SOURCE":
      return sanitizeSource(node);
    case "SUB":
      return sanitizeSub(node);
    default:
      return sanitizeChildNodes(node.childNodes);
  }
}

function sanitizeAnchor(node) {
  const href = sanitizeUrl(node.getAttribute("href"), ALLOWED_LINK_PROTOCOLS);
  if (!href) {
    return sanitizeChildNodes(node.childNodes);
  }

  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noreferrer noopener";
  anchor.append(sanitizeChildNodes(node.childNodes));
  return anchor;
}

function sanitizeImage(node) {
  const src = sanitizeUrl(node.getAttribute("src"), ALLOWED_IMAGE_PROTOCOLS);
  if (!src) {
    return null;
  }

  const image = document.createElement("img");
  image.src = src;
  image.alt = decodeText(node.getAttribute("alt") || "");
  image.loading = "lazy";
  image.decoding = "async";

  const width = (node.getAttribute("width") || "").trim();
  const height = (node.getAttribute("height") || "").trim();

  if (width) {
    if (width.endsWith("%")) {
      image.style.width = width;
    } else {
      image.setAttribute("width", width);
    }
  }

  if (height) {
    image.setAttribute("height", height);
  }

  return image;
}

function sanitizePicture(node) {
  const picture = document.createElement("picture");
  Array.from(node.childNodes).forEach((child) => {
    const sanitized = sanitizeNode(child);
    if (sanitized) {
      picture.append(sanitized);
    }
  });
  return picture.childNodes.length ? picture : null;
}

function sanitizeSource(node) {
  const srcset = sanitizeUrl(node.getAttribute("srcset"), ALLOWED_IMAGE_PROTOCOLS);
  if (!srcset) {
    return null;
  }

  const source = document.createElement("source");
  source.srcset = srcset;

  const media = node.getAttribute("media");
  if (media) {
    source.media = media;
  }

  return source;
}

function sanitizeSub(node) {
  const sub = document.createElement("sub");
  sub.append(sanitizeChildNodes(node.childNodes));
  return sub;
}

function sanitizeUrl(value, allowedProtocols) {
  const candidate = decodeText(`${value || ""}`.trim());

  if (!candidate) {
    return "";
  }

  try {
    const parsed = new URL(candidate, window.location.origin);
    return allowedProtocols.has(parsed.protocol) ? parsed.href : "";
  } catch (error) {
    return "";
  }
}

function decodeText(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = `${value || ""}`;
  return textarea.value;
}
