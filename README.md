<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:006633,100:00e87a&height=240&section=header&text=ReadmeForge&fontSize=78&fontColor=ffffff&fontAlignY=38&fontStyle=bold&desc=Static%20GitHub%20Profile%20README%20Generator&descSize=20&descAlignY=58&descColor=ffffffbb&animation=fadeIn&stroke=ffffff&strokeWidth=2" width="100%" alt="ReadmeForge banner"/>
</div>

<div align="center">

<a href="https://lebedevnet.github.io/ReadmeForge/">
  <img src="https://img.shields.io/badge/Open%20ReadmeForge-00e87a?style=for-the-badge&logo=github&logoColor=04110b" alt="Open ReadmeForge"/>
</a>

[![Stars](https://img.shields.io/github/stars/lebedevnet/ReadmeForge?style=flat-square&color=ffd700&logo=github&logoColor=white)](https://github.com/lebedevnet/ReadmeForge/stargazers)
[![Forks](https://img.shields.io/github/forks/lebedevnet/ReadmeForge?style=flat-square&color=6366f1&logo=github&logoColor=white)](https://github.com/lebedevnet/ReadmeForge/network/members)
[![License](https://img.shields.io/badge/MIT-3b82f6?style=flat-square)](LICENSE)

**A cleaner, preview-trustworthy way to build your GitHub profile README.**  
Static, browser-based, no sign-up, no backend, no build step.

</div>

---

## Preview

<div align="center">

[![ReadmeForge Preview](https://raw.githubusercontent.com/lebedevnet/ReadmeForge/main/preview.png)](https://lebedevnet.github.io/ReadmeForge/)

</div>

---

## What's New

- Unified state model: the editor, preview, and markdown output now read from the same canonical app state.
- Local draft persistence: everything autosaves to `localStorage` and survives refreshes.
- Config portability: export/import generator state as versioned JSON.
- Better output workflow: copy, download `README.md`, export config, import config, and reset draft from one action bar.
- Mobile-friendly preview: Form / Preview switch on smaller screens instead of hiding the preview.
- Faster stack editing: searchable tech chips, clearer grouping, and support for custom tech entries.
- Cleaner output styles: `Classic`, `Minimal`, and `Portfolio`.
- Safer rendering: preview content is rendered through DOM APIs instead of unsafe user-content interpolation.
- Modular static architecture: the old monolith is split into readable files under `assets/js` and `assets/css`.

---

## Features

- Live preview that tracks the generated markdown much more closely.
- Starter presets for Developer, Frontend, Backend, AI/ML, Designer, Student, Founder, and Minimal setups.
- Three README layout styles with one shared generator pipeline.
- Accent themes, stats themes, widget toggles, and separate header-status controls.
- Spoken languages with level badges.
- Optional featured projects section.
- Import/export JSON configs with schema versioning.
- One-click `README.md` download.
- Fully static deployment friendly to GitHub Pages.

---

## Quick Start

### Online

```text
https://lebedevnet.github.io/ReadmeForge/
```

### Local

```bash
git clone https://github.com/lebedevnet/ReadmeForge.git
cd ReadmeForge
open index.html
```

No npm. No bundler. No server required.

---

## Project Structure

```text
/
  index.html
  README.md
  /assets
    /css
      styles.css
    /js
      app.js
      data-options.js
      data-tech.js
      data-themes.js
      generator.js
      preview.js
      presets.js
      state.js
      storage.js
      ui.js
      utils.js
```

---

## How It Works

1. The form writes into one app state object.
2. Preview and markdown generation both derive from that state.
3. Draft changes autosave locally with a versioned storage key.
4. Config export/import serializes the same normalized data structure.

That keeps the product static while making the codebase much easier to extend.

---

## Contributing

Suggestions and pull requests are welcome.

If you want to make changes:

```bash
git clone https://github.com/YOUR_USERNAME/ReadmeForge.git
cd ReadmeForge
git checkout -b feat/your-change
open index.html
```

Helpful starting points:

- Add more technologies or aliases in `assets/js/data-tech.js`
- Add new presets in `assets/js/presets.js`
- Improve markdown layouts in `assets/js/generator.js`
- Improve preview parity in `assets/js/preview.js`
- Tweak visual language in `assets/css/styles.css`

---

## Roadmap

- Section reordering
- More advanced featured project layouts
- More tech aliases and custom icon support
- Updated screenshots for the upgraded UI
- Localization

---

## License

MIT © [lebedevnet](https://github.com/lebedevnet)

---

<div align="center">

<sub>If ReadmeForge saved you time, a star helps more people find it.</sub>

[![Star](https://img.shields.io/github/stars/lebedevnet/ReadmeForge?style=social)](https://github.com/lebedevnet/ReadmeForge)

</div>
