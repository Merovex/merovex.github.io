# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Jekyll-based personal website and blog for an author, featuring interactive science fiction worldbuilding tools. The site uses Jekyll 4.3.3 for static site generation, Tailwind CSS for styling, and Stimulus JS for progressive enhancement.

## Development Commands

### Starting Development
```bash
yarn dev           # Runs Jekyll server and Tailwind CSS watch in parallel
# OR
bin/dev           # Shell script that runs yarn dev
```

### Individual Commands
```bash
yarn jekyll       # Run Jekyll server only: bundle exec jekyll serve
yarn tailwind     # Run Tailwind CSS watch only
yarn build        # Production build with minified CSS
```

### Jekyll Commands
```bash
bundle exec jekyll serve    # Start development server on http://localhost:4000
bundle exec jekyll build    # Build static site to _site directory
```

## Architecture

### Technology Stack
- **Jekyll 4.3.3** - Static site generator
- **Tailwind CSS 3.4.0** - Utility-first CSS framework
- **Stimulus 3.2.2** - JavaScript framework for HTML-driven apps
- **Ruby** - Backend scripting and Jekyll plugins

### Directory Structure
- `_layouts/` - Jekyll page templates (default, post, book, tool, home)
- `_includes/` - Reusable HTML components and SVG graphics
- `_posts/` - Blog posts in Markdown format
- `_tools/` - Interactive web tools for science fiction writing
- `assets/controllers/` - Stimulus JavaScript controllers
- `assets/css/` - Stylesheets (Tailwind input/output)
- `assets/js/` - JavaScript files and Stimulus application

### Key Stimulus Controllers
Located in `assets/controllers/`:
- `astromap_controller.js` - Interactive star map visualization
- `color_scheme_controller.js` - Dark/light theme switching
- `orbital_calculator_controller.js` - Space travel calculations
- `calendar_graph_controller.js` - GitHub contribution heatmaps
- `fleet_builder_controller.js` - Science fiction fleet management
- `word_frequency_controller.js` - Text analysis tools

### Styling System
- Dark mode via `data-color-scheme` attribute on HTML element
- Custom CSS variables for blob shapes and theme colors
- Typography: Atkinson Hyperlegible (body) and Fjalla One (headings)
- Tailwind configuration includes custom gray color palette

### Jekyll Collections
- **_posts** - Blog articles
- **_books** - Author's published works
- **_tools** - Interactive web utilities

### Data Files
- `assets/teradoma.json` - Worldbuilding data for science fiction setting
- `assets/wordcount.json` - Writing progress tracking
- Various CSV/JSON files supporting interactive tools

## Important Notes

- Always check for existing Stimulus controllers before creating new ones
- The site uses Tailwind CSS utilities - avoid writing custom CSS when possible
- Jekyll builds to `_site/` directory (gitignored)
- No formal testing framework is present
- Site is licensed under BSD 3-Clause License