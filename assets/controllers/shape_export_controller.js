import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = window.Stimulus || Application.start()
// Connects to data-controller="shape-export"
// Fuses the whole page into one portable "shape" prompt: the season length and
// scene count, the wordcount targets, the C-story spine and its per-episode
// beats, and the Season Shaper's A/B/C allocation down to the scene. It reads
// the live state of the other three controllers through the Stimulus app, so it
// always reflects whatever is on screen. The built text lives in a hidden
// textarea; the button copies it.
Stimulus.register("shape-export", class extends Controller {
  static targets = ["output", "button"];

  connect() { this.refresh(); }

  // Reach a sibling controller instance through the Stimulus application.
  controllerFor(id) {
    const el = document.querySelector(`[data-controller~="${id}"]`);
    if (!el || !window.Stimulus || !window.Stimulus.getControllerForElementAndIdentifier) return null;
    return window.Stimulus.getControllerForElementAndIdentifier(el, id);
  }

  refresh() {
    if (this.hasOutputTarget) this.outputTarget.value = this.buildShape();
  }

  buildShape() {
    const cstory = this.controllerFor("c-story-engine");
    const shaper = this.controllerFor("season-shaper");
    const wc = this.controllerFor("wordcount-budget");
    const fmt = (n) => Math.round(n).toLocaleString("en-US");
    const pad = (n) => String(n).padStart(2, " ");
    const lines = [];

    lines.push("# SERIES SHAPE");
    lines.push("");
    lines.push(
      "Use this as a binding blueprint for a serialized pulp series. The A-story opens and closes each " +
      "episode and carries the three surprises at the quarter marks; B is relational / thematic counterpoint " +
      "woven through the gaps; C advances the serialized spine exactly one click per episode so it resolves on " +
      "the finale."
    );
    lines.push("");

    // Format + wordcount budget
    const episodes = shaper ? shaper.clampEpisodes() : (cstory ? cstory.episodesValue : null);
    const scenes = shaper ? shaper.clampScenes() : null;
    lines.push("## Format");
    if (episodes != null) lines.push(`- Season length: ${episodes} episodes`);
    if (scenes != null) lines.push(`- Scenes per episode: ${scenes}`);
    if (wc) {
      lines.push(
        `- Wordcount targets: ${fmt(wc.sceneWC)} words/scene · ${fmt(wc.episodeWC)} words/episode · ` +
        `${fmt(wc.total)} words total`
      );
    }
    lines.push("");

    // Archetype + C-story spine
    if (cstory) {
      const label = cstory.ARCHETYPE_LABELS[cstory.archetypeValue] || cstory.archetypeValue;
      lines.push(`## Archetype: ${label}`);
      lines.push(cstory.archetypeNote);
      lines.push("");
      if (cstory.isCarrying && cstory.current) {
        const c = cstory.current;
        lines.push("## C-story spine (serialized continuity — one click per episode)");
        lines.push(`- Question: ${c.question}`);
        lines.push(`- Stake: ${c.stake}`);
        lines.push(`- Terminus: ${c.terminus}`);
        lines.push(`- Signature key: ${c.key}`);
        lines.push("");
        lines.push("Per-episode spine beats:");
        c.timeline.forEach((b) => lines.push(`  Ep ${pad(b.episode)}  [${b.role}]  ${b.click}`));
        lines.push("");
      } else {
        lines.push("(This archetype does not carry an episodic spine — see the note above.)");
        lines.push("");
      }
    }

    // A/B/C allocation + per-episode scene breakdown
    if (shaper && shaper.current) {
      const t = shaper.totals();
      lines.push("## A/B/C allocation");
      lines.push(`Season totals — A:${t.a}  B:${t.b}  C:${t.c}  (${t.scenes} scenes)`);
      lines.push(
        "Legend: A = self-contained plot (opens & closes); B = relational / thematic counterpoint; " +
        "C = serialized spine click."
      );
      lines.push("");
      shaper.current.episodes.forEach((ep) => {
        lines.push(`### Episode ${ep.number} — ${ep.c_role}  (${ep.total} scenes · A:${ep.a} B:${ep.b} C:${ep.c})`);
        ep.scenes.forEach((s) => lines.push(`  ${pad(s.position)}  ${s.track}  ${s.beat}`));
        lines.push("");
      });
    }

    lines.push("## Task");
    lines.push(
      "Draft the season to this shape. Keep each episode's A-story self-contained, weave B through the gaps, " +
      "and advance the C-spine one click per episode so it pays off on the finale. Hold the wordcount targets."
    );

    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  copy() {
    this.refresh(); // always copy the current state
    const text = this.hasOutputTarget ? this.outputTarget.value : this.buildShape();
    const done = () => {
      if (!this.hasButtonTarget) return;
      const label = this.buttonTarget.textContent;
      this.buttonTarget.textContent = "Shape copied";
      this.buttonTarget.classList.add("copied");
      setTimeout(() => {
        this.buttonTarget.textContent = label;
        this.buttonTarget.classList.remove("copied");
      }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => this.fallbackCopy(text, done));
    } else {
      this.fallbackCopy(text, done);
    }
  }

  // The hidden textarea can't be selected (display:none), so copy via a
  // temporary off-screen one, matching the other tools' fallback.
  fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } finally { document.body.removeChild(ta); }
  }
});
