import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = window.Stimulus || Application.start()
// Connects to data-controller="wordcount-budget"
// A wordcount target calculator that rides alongside the Season Shaper. It is
// a separate concern: the Shaper decides scene/episode *counts*; this turns
// those counts into a word budget.
//
//   scene wordcount  × scenes-per-episode = episode wordcount
//   episode wordcount × episodes-per-season = total
//
// Either Scene or Episode is fillable; whichever the user last touched is the
// basis. Editing Scene recomputes Episode + Total; editing Episode recomputes
// Scene + Total. Moving the Shaper's scene/episode sliders recomputes from the
// current basis. Total is always derived (read-only).
Stimulus.register("wordcount-budget", class extends Controller {
  static targets = ["scene", "episode", "total", "sceneCount", "episodeCount"];

  connect() {
    this.restore();
    this.compute();
    this.render(null);
  }

  // The scene/episode counts come from the Season Shaper's sliders, which this
  // controller shares an element with.
  scenes() { const n = parseInt(this.sceneCountTarget.value, 10); return isNaN(n) || n < 1 ? 1 : n; }
  episodes() { const n = parseInt(this.episodeCountTarget.value, 10); return isNaN(n) || n < 1 ? 1 : n; }

  // Derive the non-basis word figures from the basis and the current counts.
  compute() {
    const S = this.scenes();
    const E = this.episodes();
    if (this.basis === "episode") {
      this.sceneWC = S ? this.episodeWC / S : this.episodeWC;
    } else {
      this.episodeWC = this.sceneWC * S;
    }
    this.total = this.episodeWC * E;
  }

  // Write the figures back to the fields. `skip` is the field the user is
  // actively typing in, so we don't clobber their caret.
  render(skip) {
    if (skip !== "scene") this.sceneTarget.value = Math.round(this.sceneWC);
    if (skip !== "episode") this.episodeTarget.value = Math.round(this.episodeWC);
    this.totalTarget.value = Math.round(this.total).toLocaleString("en-US");
  }

  sceneInput() {
    this.basis = "scene";
    this.sceneWC = this.num(this.sceneTarget.value);
    this.compute();
    this.render("scene");
    this.persist();
  }

  episodeInput() {
    this.basis = "episode";
    this.episodeWC = this.num(this.episodeTarget.value);
    this.compute();
    this.render("episode");
    this.persist();
  }

  // The Shaper's sliders moved: keep the basis figure, recompute the rest.
  countsChanged() {
    this.compute();
    this.render(null);
    this.persist();
  }

  num(v) { const n = parseInt(v, 10); return isNaN(n) || n < 0 ? 0 : n; }

  // ── Persistence (localStorage; survives across visits, stays on device) ────
  restore() {
    const b = this.load("basis");
    this.basis = b === "episode" ? "episode" : "scene";
    const s = parseFloat(this.load("scene"));
    this.sceneWC = isNaN(s) ? 1500 : s; // a sensible default pulp scene length
    const e = parseFloat(this.load("episode"));
    this.episodeWC = isNaN(e) ? this.sceneWC * this.scenes() : e;
  }

  persist() {
    this.save("basis", this.basis);
    this.save("scene", String(this.sceneWC));
    this.save("episode", String(this.episodeWC));
  }

  save(k, v) { try { localStorage.setItem(`wcbudget.${k}`, v); } catch (e) { /* storage off */ } }
  load(k) { try { return localStorage.getItem(`wcbudget.${k}`); } catch (e) { return null; } }
});
