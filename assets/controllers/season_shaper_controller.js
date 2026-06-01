import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = window.Stimulus || Application.start()
// Connects to data-controller="season-shaper"
// The Season Shaper: shapes the A/B/C structure of an episodic season for a
// dynamic scene count AND a dynamic season length. Answers two questions:
//
//   1. Within an episode: given N scenes, how many are A-story (the self-
//      contained plot), B-story (relational/thematic counterpoint), and
//      C-story (the serialized spine click), and in what order.
//   2. Across a season: given M episodes, what C-story role each episode
//      carries so the spine resolves on the final episode and never sags.
//
// Companion to the Western Engine (rolls the A-story) and the C-Story Engine
// (rolls the C-story content). This is the skeleton both hang on. A-story
// always opens and closes an episode; B is woven into the interior gaps; C
// lands where its season-role dictates.
//
// Direct port of season_shaper.rb.
Stimulus.register("season-shaper", class extends Controller {
  static targets = [
    "scenes", "scenesOut", "episodes", "episodesOut",
    "totals", "season", "copyBtn",
  ];
  static values = {
    scenes: { type: Number, default: 10 },
    episodes: { type: Number, default: 6 },
  };

  // Canonical C-story role arcs. Four and six run straight to terminus. Eight
  // uses a double-pump: a false terminus mid-back, then the real one, so the
  // stretch episodes don't go soft.
  C_ARCS = {
    4: ["PLANT", "COMPLICATE", "TURN", "TERMINUS"],
    6: ["PLANT", "COMPLICATE", "TURN", "DEEPEN", "PRESSURE", "TERMINUS"],
    8: ["PLANT", "COMPLICATE", "TURN", "FALSE_TERMINUS", "RESET", "DEEPEN", "PRESSURE", "TERMINUS"],
  };

  // The C-story claims more scenes on the load-bearing roles (default 1).
  C_WEIGHT = { FALSE_TERMINUS: 2, TERMINUS: 2 };

  B_SHARE = 0.27; // share of the non-C scenes given to the B-story

  C_BEATS = {
    PLANT: "the season question surfaces",
    COMPLICATE: "the question proves bigger than it looked",
    TURN: "a reveal reverses the spine's direction",
    DEEPEN: "the cost of the question turns personal",
    PRESSURE: "the spine tightens toward resolution",
    FALSE_TERMINUS: "a false resolution: the spine looks settled",
    RESET: "the false win unravels; the real stakes appear",
    TERMINUS: "the season spine resolves",
  };

  connect() { this.plan(); }

  scenesInput() {
    this.scenesValue = this.clampScenes();
    if (this.hasScenesOutTarget) this.scenesOutTarget.textContent = this.scenesValue;
    this.plan();
  }

  episodesInput() {
    this.episodesValue = this.clampEpisodes();
    if (this.hasEpisodesOutTarget) this.episodesOutTarget.textContent = this.episodesValue;
    this.plan();
  }

  clampScenes() {
    const n = this.hasScenesTarget ? parseInt(this.scenesTarget.value, 10) : this.scenesValue;
    return isNaN(n) ? 10 : Math.max(4, Math.min(20, n)); // shape_episode needs >= 4
  }

  clampEpisodes() {
    const n = this.hasEpisodesTarget ? parseInt(this.episodesTarget.value, 10) : this.episodesValue;
    return isNaN(n) ? 6 : Math.max(4, Math.min(12, n)); // c_arc needs >= 4
  }

  // ── Main entry — mirrors SeasonShaper.plan ────────────────────────────────
  plan() {
    const episodes = this.clampEpisodes();
    const scenes = this.clampScenes();
    if (this.hasScenesOutTarget) this.scenesOutTarget.textContent = scenes;
    if (this.hasEpisodesOutTarget) this.episodesOutTarget.textContent = episodes;

    const arc = this.cArc(episodes);
    const counts = this.sceneCounts(scenes, episodes);
    this.current = {
      length: episodes,
      scenes,
      episodes: arc.map((role, i) => this.shapeEpisode(i + 1, role, counts[i])),
    };
    this.render();
  }

  // ── Season-level arc ──────────────────────────────────────────────────────
  cArc(episodes) {
    if (this.C_ARCS[episodes]) return this.C_ARCS[episodes];
    return this.buildArc(episodes);
  }

  // Generic arc for non-canonical lengths: plant first, turn at the midpoint,
  // double-pump for long seasons, terminus last, deepen across the back half.
  buildArc(n) {
    const arc = new Array(n).fill("COMPLICATE");
    arc[0] = "PLANT";
    arc[n - 1] = "TERMINUS";
    arc[Math.floor(n / 2) - 1] = "TURN";
    if (n >= 8) {
      arc[Math.floor((n * 2) / 3) - 1] = "FALSE_TERMINUS";
      arc[Math.floor((n * 2) / 3)] = "RESET";
    }
    for (let i = Math.floor(n / 2); i < n - 1; i++) {
      if (arc[i] === "COMPLICATE") arc[i] = "DEEPEN";
    }
    return arc;
  }

  sceneCounts(scenes, episodes) {
    return new Array(episodes).fill(scenes);
  }

  // ── Episode-level allocation — mirrors shape_episode ──────────────────────
  shapeEpisode(number, role, total) {
    const c = Math.min(this.cWeight(role), total - 3); // never starve A below 3
    const remaining = total - c;
    let b = Math.max(Math.round(remaining * this.B_SHARE), 1);
    b = Math.min(b, remaining - 2); // leave A at least 2
    const a = remaining - b;

    const scenes = this.sequence(total, role, a, b, c);
    return { number, c_role: role, total, a, b, c, scenes };
  }

  cWeight(role) { return this.C_WEIGHT[role] || 1; }

  // A opens and closes; C placed by season-role; B spread through the gaps.
  sequence(total, role, a, b, c) {
    const slots = new Array(total).fill(null);
    slots[0] = "A";
    slots[total - 1] = "A";

    this.cSlots(total, role, c).forEach((p) => { slots[p] = "C"; });

    const openInterior = this.range(1, total - 1).filter((i) => !slots[i]);
    this.spread(openInterior, b).forEach((p) => { slots[p] = "B"; });

    for (let i = 0; i < total; i++) if (!slots[i]) slots[i] = "A";
    return this.label(slots, role);
  }

  cSlots(total, role, count) {
    let anchor;
    if (role === "PLANT") {
      anchor = Math.max(Math.round(total * 0.25), 1);
    } else if (role === "TERMINUS" || role === "FALSE_TERMINUS") {
      anchor = total - 2;
    } else {
      anchor = Math.floor(total / 2);
    }
    return this.uniq(
      [anchor, anchor - 1].slice(0, count).map((p) => this.clamp(p, 1, total - 2))
    );
  }

  spread(openSlots, n) {
    if (n <= 0 || openSlots.length === 0) return [];
    if (n >= openSlots.length) return openSlots;
    const step = openSlots.length / n;
    const out = [];
    for (let i = 0; i < n; i++) out.push(openSlots[Math.floor(i * step + step / 2)]);
    return this.uniq(out);
  }

  // ── Labeling ──────────────────────────────────────────────────────────────
  label(slots, role) {
    const aIndices = [];
    slots.forEach((s, i) => { if (s === "A") aIndices.push(i); });
    const aArc = this.aArc(aIndices.length);
    const aMap = {};
    aIndices.forEach((idx, i) => { aMap[idx] = aArc[i]; });

    return slots.map((track, i) => {
      let beat;
      if (track === "A") beat = aMap[i];
      else if (track === "B") beat = "relational / thematic counterpoint";
      else beat = this.cBeat(role);
      return { position: i + 1, track, beat };
    });
  }

  // Compressed A-story arc across however many A scenes the episode has.
  aArc(n) {
    if (n <= 0) return [];
    const spine = ["OPENER", "SQUEEZE", "COMPLICATION", "TURN", "RECKONING", "EXIT"];
    if (n <= spine.length) return spine.slice(0, n);
    const extra = n - spine.length;
    return ["OPENER", "SQUEEZE"]
      .concat(new Array(1 + extra).fill("COMPLICATION"))
      .concat(["TURN", "RECKONING", "EXIT"]);
  }

  cBeat(role) { return this.C_BEATS[role] || "advance one click"; }

  // ── Totals ────────────────────────────────────────────────────────────────
  totals() {
    const eps = this.current.episodes;
    return {
      a: eps.reduce((s, e) => s + e.a, 0),
      b: eps.reduce((s, e) => s + e.b, 0),
      c: eps.reduce((s, e) => s + e.c, 0),
      scenes: eps.reduce((s, e) => s + e.total, 0),
    };
  }

  // ── Render ────────────────────────────────────────────────────────────────
  render() {
    if (!this.current) return;
    const t = this.totals();
    if (this.hasTotalsTarget) {
      this.totalsTarget.textContent =
        `${this.current.length} episodes × ${this.current.scenes} scenes — ` +
        `A:${t.a}  B:${t.b}  C:${t.c}  (${t.scenes} scenes total)`;
    }
    if (!this.hasSeasonTarget) return;
    this.seasonTarget.innerHTML = "";
    this.current.episodes.forEach((ep) => this.seasonTarget.appendChild(this.episodeEl(ep)));
  }

  episodeEl(ep) {
    const card = document.createElement("div");
    card.className = "episode";

    const head = document.createElement("div");
    head.className = "ep-head";
    const num = document.createElement("span");
    num.className = "ep-num";
    num.textContent = `Ep ${ep.number}`;
    const role = document.createElement("span");
    role.className = `ep-role role-${ep.c_role.toLowerCase()}`;
    role.textContent = ep.c_role.replace("_", " ");
    const mix = document.createElement("span");
    mix.className = "ep-mix";
    mix.textContent = `${ep.total} scenes · A:${ep.a} B:${ep.b} C:${ep.c}`;
    head.append(num, role, mix);
    card.appendChild(head);

    const strip = document.createElement("div");
    strip.className = "scene-strip";
    ep.scenes.forEach((s) => {
      const cell = document.createElement("div");
      cell.className = `scene track-${s.track.toLowerCase()}`;
      const pos = document.createElement("span");
      pos.className = "sc-pos";
      pos.textContent = s.position;
      const trk = document.createElement("span");
      trk.className = "sc-track";
      trk.textContent = s.track;
      const beat = document.createElement("span");
      beat.className = "sc-beat";
      beat.textContent = s.beat;
      cell.append(pos, trk, beat);
      strip.appendChild(cell);
    });
    card.appendChild(strip);
    return card;
  }

  // ── Copy — replicates the Ruby to_s output ────────────────────────────────
  buildCopyText() {
    if (!this.current) return "";
    const t = this.totals();
    const lines = [
      `Season: ${this.current.length} episodes x ${this.current.scenes} scenes`,
      `Totals across season:  A:${t.a}  B:${t.b}  C:${t.c}  (${t.scenes} scenes)`,
      "",
    ];
    this.current.episodes.forEach((ep, idx) => {
      const role = ep.c_role.padEnd(14, " ");
      const total = String(ep.total).padStart(2, " ");
      lines.push(`Ep ${ep.number}  [${role}]  ${total} scenes   A:${ep.a}  B:${ep.b}  C:${ep.c}`);
      ep.scenes.forEach((s) => {
        const pos = String(s.position).padStart(2, " ");
        lines.push(`    ${pos}  ${s.track}  ${s.beat}`);
      });
      if (idx < this.current.episodes.length - 1) lines.push("");
    });
    return lines.join("\n");
  }

  copy() {
    const text = this.buildCopyText();
    const done = () => {
      this.copyBtnTarget.textContent = "Copied";
      this.copyBtnTarget.classList.add("copied");
      setTimeout(() => {
        this.copyBtnTarget.textContent = "Copy";
        this.copyBtnTarget.classList.remove("copied");
      }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => this.fallbackCopy(text, done));
    } else {
      this.fallbackCopy(text, done);
    }
  }

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

  // ── Small helpers ─────────────────────────────────────────────────────────
  range(start, end) {
    const out = [];
    for (let i = start; i < end; i++) out.push(i);
    return out;
  }

  uniq(arr) { return [...new Set(arr)]; }

  clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
});
