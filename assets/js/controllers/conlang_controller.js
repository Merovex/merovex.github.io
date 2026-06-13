// Stellar Drift — Stimulus glue.
// ---------------------------------------------------------------------------
// This file holds NO linguistics logic. It reads form values, assembles a
// world card, calls evolve(), and writes the returned data into the page.
// All language decisions live in conlang_engine.js. If you find a sound-change
// rule in here, the build is wrong.
// ---------------------------------------------------------------------------

import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js";
import {
  evolve,
  SEED_PROFILES,
  ENVIRONMENT_TAGS,
} from "/assets/js/conlang_engine.js";

window.Stimulus = window.Stimulus || Application.start();

Stimulus.register(
  "conlang",
  class extends Controller {
    static targets = [
      "seed",
      "primary",
      "secondary",
      "share",
      "shareReadout",
      "years",
      "yearsReadout",
      "brake",
      "brakeReadout",
      "environment",
      "sacred",
      "output",
    ];

    connect() {
      this.populateProfileSelects();
      this.generate();
    }

    // Fill the founder / sacred <select>s from the engine's profile registry,
    // so adding a family is a pure data edit on the engine side.
    populateProfileSelects() {
      const opts = Object.entries(SEED_PROFILES)
        .map(([key, p]) => `<option value="${key}">${p.label}</option>`)
        .join("");

      if (this.hasPrimaryTarget && !this.primaryTarget.dataset.filled) {
        this.primaryTarget.innerHTML = opts;
        this.primaryTarget.value = "anglic";
        this.primaryTarget.dataset.filled = "1";
      }
      if (this.hasSecondaryTarget && !this.secondaryTarget.dataset.filled) {
        this.secondaryTarget.innerHTML = opts;
        this.secondaryTarget.value = "sinitic";
        this.secondaryTarget.dataset.filled = "1";
      }
      if (this.hasSacredTarget && !this.sacredTarget.dataset.filled) {
        this.sacredTarget.innerHTML =
          `<option value="">— none —</option>` + opts;
        this.sacredTarget.value = "";
        this.sacredTarget.dataset.filled = "1";
      }
    }

    randomize() {
      // 32-bit seed; the seed is the only entropy source the engine ever sees.
      const seed = Math.floor(Math.random() * 0xffffffff) >>> 0;
      if (this.hasSeedTarget) this.seedTarget.value = seed;
      this.generate();
    }

    generate() {
      const card = this.readCard();
      this.syncReadouts(card);
      let result;
      try {
        result = evolve(card);
      } catch (err) {
        this.outputTarget.innerHTML = `<p class="cl-error">Engine error: ${escapeHtml(
          String(err && err.message ? err.message : err)
        )}</p>`;
        return;
      }
      this.outputTarget.innerHTML = this.renderHtml(result);
    }

    // --- World card assembly -------------------------------------------------

    readCard() {
      const seed = this.hasSeedTarget ? parseInt(this.seedTarget.value, 10) : 0;
      const primary = this.hasPrimaryTarget ? this.primaryTarget.value : "anglic";
      const secondary = this.hasSecondaryTarget ? this.secondaryTarget.value : primary;
      const shareRaw = this.hasShareTarget ? parseFloat(this.shareTarget.value) : 1;

      // If primary and secondary match, treat as a single founder at full share.
      const founders = {};
      if (!secondary || secondary === primary) {
        founders[primary] = 1;
      } else {
        const primaryShare = Math.min(1, Math.max(0, shareRaw));
        founders[primary] = primaryShare;
        founders[secondary] = 1 - primaryShare;
      }

      const environment = this.hasEnvironmentTarget
        ? this.environmentTargets.filter((c) => c.checked).map((c) => c.value)
        : [];

      const sacred =
        this.hasSacredTarget && this.sacredTarget.value
          ? this.sacredTarget.value
          : null;

      return {
        name: "Drift Output",
        seed: Number.isFinite(seed) ? seed : 0,
        founders,
        isolationYears: this.hasYearsTarget ? parseInt(this.yearsTarget.value, 10) : 1000,
        techBrake: this.hasBrakeTarget ? parseFloat(this.brakeTarget.value) : 0,
        environment,
        sacred,
      };
    }

    syncReadouts(card) {
      const single = Object.keys(card.founders).length === 1;
      if (this.hasShareReadoutTarget) {
        this.shareReadoutTarget.textContent = single
          ? "single founder · 100%"
          : Object.entries(card.founders)
              .map(([k, w]) => `${k} ${Math.round(w * 100)}%`)
              .join(" / ");
      }
      if (this.hasYearsReadoutTarget) {
        this.yearsReadoutTarget.textContent = `${card.isolationYears} years`;
      }
      if (this.hasBrakeReadoutTarget) {
        const b = card.techBrake;
        const label =
          b < 0.15 ? "drift unleashed" : b > 0.85 ? "near-frozen" : "throttled";
        this.brakeReadoutTarget.textContent = `${b.toFixed(2)} · ${label}`;
      }
    }

    // --- Pure templating of the engine's render object -----------------------

    renderHtml(r) {
      const m = r.meta;
      const p = r.phonology;

      const creoleTag = m.creole
        ? `<span class="cl-flag">CREOLE · leveled</span>`
        : "";

      const glossary = r.glossary
        .map(
          (g) =>
            `<div class="cl-cell"><span class="cl-en">${escapeHtml(
              g.concept
            )}</span><span class="cl-word">${escapeHtml(g.form)}</span></div>`
        )
        .join("");

      const grammar = r.grammar
        .map(
          (g) =>
            `<div class="cl-cell"><span class="cl-en">${escapeHtml(
              g.role
            )} <em>&larr; ${escapeHtml(g.from)}</em></span><span class="cl-word">=${escapeHtml(
              g.form
            )}</span></div>`
        )
        .join("");

      const high = r.highRegister.length
        ? r.highRegister
            .map(
              (g) =>
                `<div class="cl-cell"><span class="cl-en">${escapeHtml(
                  g.concept
                )}</span><span class="cl-word cl-sacred">${escapeHtml(
                  g.form
                )}</span></div>`
            )
            .join("")
        : `<p class="cl-empty">No sacred source set — vernacular only.</p>`;

      const mythic = r.mythic.length
        ? `<div class="cl-block"><h3 class="cl-h">Mythic / lost words</h3>${r.mythic
            .map(
              (g) =>
                `<div class="cl-cell"><span class="cl-en">${escapeHtml(
                  g.gloss
                )}</span><span class="cl-word">${escapeHtml(g.form)}</span></div>`
            )
            .join("")}</div>`
        : "";

      const sentences = r.sentences
        .map(
          (s) =>
            `<div class="cl-sentence"><div class="cl-surface">${escapeHtml(
              s.surface
            )}</div><div class="cl-gloss">${escapeHtml(s.gloss)}</div></div>`
        )
        .join("");

      const log = r.log
        .map((l) => `<li>${escapeHtml(l)}</li>`)
        .join("");

      return `
        <header class="cl-readout-head">
          <div class="cl-meta">
            <span class="cl-k">SEED</span><span class="cl-v">${escapeHtml(
              String(m.seed)
            )}</span>
            <span class="cl-k">FOUNDERS</span><span class="cl-v">${escapeHtml(
              m.founderSummary
            )}</span>
            <span class="cl-k">ISOLATION</span><span class="cl-v">${escapeHtml(
              String(m.isolationYears)
            )} yr</span>
            <span class="cl-k">BRAKE</span><span class="cl-v">${escapeHtml(
              String(m.techBrake)
            )}</span>
          </div>
          ${creoleTag}
        </header>

        <div class="cl-block">
          <h3 class="cl-h">Phonology</h3>
          <div class="cl-phon">
            <span class="cl-k">vowels</span><span class="cl-v">${escapeHtml(
              p.vowels.join(" ")
            )}</span>
            <span class="cl-k">consonants</span><span class="cl-v">${escapeHtml(
              p.consonants.join(" ")
            )}</span>
            <span class="cl-k">syllable</span><span class="cl-v">${escapeHtml(
              p.syllableComplexity
            )}</span>
            <span class="cl-k">tonal</span><span class="cl-v">${p.tonal ? "yes" : "no"}</span>
            <span class="cl-k">order</span><span class="cl-v">${escapeHtml(
              p.wordOrder
            )}</span>
            <span class="cl-k">morphology</span><span class="cl-v">${escapeHtml(
              p.morphology
            )}</span>
          </div>
        </div>

        <div class="cl-block">
          <h3 class="cl-h">Sentences</h3>
          <div class="cl-sentences">${sentences}</div>
        </div>

        <div class="cl-block">
          <h3 class="cl-h">Glossary</h3>
          <div class="cl-grid">${glossary}</div>
        </div>

        <div class="cl-block">
          <h3 class="cl-h">Grammaticalized particles</h3>
          <div class="cl-grid">${grammar}</div>
        </div>

        <div class="cl-block">
          <h3 class="cl-h">High register <span class="cl-sub">(frozen liturgical)</span></h3>
          <div class="cl-grid">${high}</div>
        </div>

        ${mythic}

        <details class="cl-log">
          <summary>Transform log (${r.log.length})</summary>
          <ol>${log}</ol>
        </details>
      `;
    }
  }
);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
