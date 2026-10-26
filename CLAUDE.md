# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Jekyll-based personal website and blog for an author, featuring interactive science fiction worldbuilding tools. The site uses Jekyll 4.3.3 for static site generation, Open Props plus a hand-written `assets/site.css` for styling, and Stimulus JS for progressive enhancement. There is no build step for CSS — `assets/site.css` is served as-is.

## Development Commands

### Starting Development
```bash
yarn dev           # Runs bundle exec jekyll serve (see package.json)
# OR
bin/dev            # Shell script that runs `yarn dev`
```

### Available scripts (package.json)
```bash
yarn jekyll       # bundle exec jekyll serve
yarn dev          # bundle exec jekyll serve
yarn build        # bundle exec jekyll build
```

### Jekyll Commands
```bash
bundle exec jekyll serve    # Start development server on http://localhost:4000
bundle exec jekyll build    # Build static site to _site directory
```

## Architecture

### Technology Stack
- **Jekyll 4.3.3** - Static site generator
- **Open Props** - CSS custom-property design tokens (`assets/vendor/open-props*.css`)
- **`assets/site.css`** - Hand-written stylesheet with the site's own utility-ish classes (`.card`, `.surface-2`, `.bg-amber-100`, `.prosed`, etc.) and theme tokens. No Tailwind, no PostCSS build.
- **Stimulus 3.2.2** - JavaScript framework for HTML-driven apps (loaded per-page from unpkg)
- **Ruby** - Backend scripting and Jekyll plugins

### Directory Structure
- `_layouts/` - Jekyll page templates (default, post, book, tool, home)
- `_includes/` - Reusable HTML components and SVG graphics (`head.html` lists the stylesheets)
- `_posts/` - Blog posts in Markdown format
- `_tools/` - Interactive web tools for science fiction writing
- `assets/controllers/` - Stimulus JavaScript controllers (one more lives in `assets/js/controllers/`)
- `assets/*.css` - Stylesheets served directly: `site.css`, `fonts.css`, `cal-heatmap.css`, plus `assets/vendor/` for Open Props
- `assets/js/` - JavaScript files

### Key Stimulus Controllers
Located in `assets/controllers/` (each tool page loads its own controller via a `<script type="module">` tag):
- `astromap_controller.js` - Interactive star map visualization
- `color_scheme_controller.js` - Dark/light theme switching
- `orbital_calculator_controller.js` / `travel_calculator_controller.js` - Space travel calculations
- `calendar_graph_controller.js` - Contribution heatmaps
- `uwp_translator_controller.js` - Traveller UWP translator: per-ruleset tables, trade codes and the T5 Importance (Ix) extension
- `wordcount_budget_controller.js`, `plot_generator_controller.js`, `season_shaper_controller.js`, `haiku_controller.js`, `drifter_saga_controller.js`, `c_story_engine_controller.js`, `days_clock_controller.js`, `shape_export_controller.js`

Most controllers self-start the Stimulus application with `window.Stimulus = Application.start()`. When a page loads more than one controller, the second one should reuse the existing app via `window.Stimulus || Application.start()` rather than starting a second application.

### Styling System
- Dark mode via `data-color-scheme` attribute on the `:root`/HTML element
- CSS custom properties for the color palette and theme tokens, defined at the top of `assets/site.css`
- Typography: Atkinson Hyperlegible (body), Fjalla One and Outfit (headings) — see `assets/fonts.css`
- Utility-style classes are hand-defined in `assets/site.css`; classes referenced only from JS controllers must exist there (nothing scans/generates them)
- Calculator-style tools (travel, orbital, UWP translator) share `assets/calculator.css`: a `.calc` wrapper that breaks out of the tool column, with cards, fields, stat tiles, a big headline number and reference tables, built only on site tokens and contrast-checked to WCAG AA. Each page links it and keeps only its own diagram styles in a page `<style>` block. Reuse it for new calculators.
- World sizes come from `assets/js/traveller_worlds.js`: the Classic, Mongoose, T5 and Cepheus size tables (gravity where the ruleset gives it, T5 gas giants converted from miles), the UWP parser, and the remembered ruleset choice. The two calculators and the UWP Translator import it.

### Jekyll Collections
- **_posts** - Blog articles
- **_books** - Author's published works
- **_tools** - Interactive web utilities

### Data Files
- `assets/terradoma/` - The Terradoma star chart (Imperium, Decline and Expanse layers as JSON + SVG), copied from the Postal Marines repo; the astromap tool reads the Imperium layer. See its README.
- `assets/gendaldea*.json` - The retired Gendaldea chart, kept for reference
- `assets/wordcount.json` - Writing progress tracking
- Various CSV/JSON files supporting interactive tools

## Important Notes

- Always check for existing Stimulus controllers before creating new ones
- There is NO Tailwind/PostCSS pipeline. Styling is Open Props + the hand-written `assets/site.css`. If you use a utility class (e.g. `bg-amber-100`, `text-amber-900`), confirm it is defined in `assets/site.css` — otherwise add it. Nothing purges or generates CSS.
- Jekyll builds to `_site/` directory (gitignored)
- No formal testing framework is present
- Site is licensed under BSD 3-Clause License