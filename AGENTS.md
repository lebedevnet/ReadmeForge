# ReadmeForge Agent Notes

This repository is a fully static GitHub Pages app.

- No backend.
- No mandatory build step.
- Keep local asset paths relative and GitHub Pages compatible.
- Prefer small, safe fixes over broad rewrites.
- Keep the code understandable for a beginner maintainer.

## Validation Checklist

- Validate `index.html` asset paths and ES module imports under `assets/js`.
- Validate local draft autosave and restore behavior with `localStorage`.
- Validate config export/import roundtrips and invalid-config handling.
- Validate README copy/download logic and output non-empty behavior.
- Validate preview/output parity for enabled sections and widgets.
- Validate the mobile `Form / Preview` switch and its selector wiring.
- Keep preview rendering safe for user input and avoid brittle HTML interpolation.
