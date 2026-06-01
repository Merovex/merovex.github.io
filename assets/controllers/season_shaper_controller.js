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
    scenes: { type: Number, default: 24 },
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

  connect() {
    this.restore();
    this.plan();
  }

  // Restore the last-used sliders. localStorage persists across visits like a
  // cookie, but stays on the device.
  restore() {
    const s = parseInt(this.load("scenes"), 10);
    if (!isNaN(s) && this.hasScenesTarget) {
      const v = Math.max(4, Math.min(60, s));
      this.scenesTarget.value = v;
      if (this.hasScenesOutTarget) this.scenesOutTarget.textContent = v;
    }
    const e = parseInt(this.load("episodes"), 10);
    if (!isNaN(e) && this.hasEpisodesTarget) {
      const v = Math.max(4, Math.min(12, e));
      this.episodesTarget.value = v;
      if (this.hasEpisodesOutTarget) this.episodesOutTarget.textContent = v;
    }
  }

  persist() {
    this.save("scenes", String(this.clampScenes()));
    this.save("episodes", String(this.clampEpisodes()));
  }

  save(k, v) { try { localStorage.setItem(`shaper.${k}`, v); } catch (e) { /* storage off */ } }
  load(k) { try { return localStorage.getItem(`shaper.${k}`); } catch (e) { return null; } }

  scenesInput() {
    this.scenesValue = this.clampScenes();
    if (this.hasScenesOutTarget) this.scenesOutTarget.textContent = this.scenesValue;
    this.persist();
    this.plan();
  }

  episodesInput() {
    this.episodesValue = this.clampEpisodes();
    if (this.hasEpisodesOutTarget) this.episodesOutTarget.textContent = this.episodesValue;
    this.persist();
    this.plan();
  }

  clampScenes() {
    const n = this.hasScenesTarget ? parseInt(this.scenesTarget.value, 10) : this.scenesValue;
    return isNaN(n) ? 24 : Math.max(4, Math.min(60, n)); // shape_episode needs >= 4
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

  // ── Episode-level allocation ──────────────────────────────────────────────
  // Ingermanson's four acts are divided by THREE surprises at the quarter marks
  // (25% / 50% / 75%). Those three beats — plus the opener and the exit — are
  // reserved for the A-story regardless of scene count or season length. The
  // C-click lands adjacent to its role's anchor (never on a surprise), and the
  // B-story fills the valleys, kept off the surprise slots entirely.
  shapeEpisode(number, role, total) {
    const surprises = this.surpriseIdx(total);
    const scenes = this.sequence(total, role, surprises);
    const count = (t) => scenes.filter((s) => s.track === t).length;
    return { number, c_role: role, total, a: count("A"), b: count("B"), c: count("C"), scenes };
  }

  cWeight(role) { return this.C_WEIGHT[role] || 1; }

  // 0-indexed positions of the three surprises, at the quarter marks. Clamped to
  // the interior and de-duplicated so very short episodes degrade gracefully.
  surpriseIdx(total) {
    const used = new Set([0, total - 1]); // opener + exit are reserved
    const out = [];
    [0.25, 0.5, 0.75].forEach((frac) => {
      let i = this.clamp(Math.round(total * frac) - 1, 1, total - 2);
      while (used.has(i) && i < total - 2) i++;
      if (!used.has(i)) { used.add(i); out.push(i); }
    });
    return out.sort((x, y) => x - y);
  }

  // A opens and closes AND holds the three surprise beats; C lands by role,
  // never on a reserved slot; B fills the remaining valleys.
  sequence(total, role, surprises) {
    const slots = new Array(total).fill(null);
    slots[0] = "A";
    slots[total - 1] = "A";
    surprises.forEach((i) => { slots[i] = "A"; });

    this.placeC(slots, total, role, this.cWeight(role), surprises);

    const open = this.range(1, total - 1).filter((i) => slots[i] === null);
    let bTarget = 0;
    if (open.length > 2) {
      bTarget = Math.min(Math.max(Math.round(open.length * this.B_SHARE), 1), open.length - 2);
    }
    this.spread(open, bTarget).forEach((p) => { slots[p] = "B"; });

    for (let i = 0; i < total; i++) if (!slots[i]) slots[i] = "A";
    return this.label(slots, role, surprises);
  }

  // Place the C-click(s) near the role's anchor, snapping to the nearest free
  // interior slot so they never collide with a surprise or an endpoint.
  placeC(slots, total, role, count, surprises) {
    let target;
    if (role === "PLANT") {
      target = (surprises[0] != null ? surprises[0] : Math.round(total * 0.25)) + 1;
    } else if (role === "TERMINUS" || role === "FALSE_TERMINUS") {
      target = total - 2;
    } else {
      target = (surprises[1] != null ? surprises[1] : Math.floor(total / 2)) + 1;
    }
    for (let k = 0; k < count; k++) {
      const idx = this.nearestFree(slots, target + k, total);
      if (idx != null) slots[idx] = "C";
    }
  }

  nearestFree(slots, target, total) {
    for (let d = 0; d < total; d++) {
      for (const i of [target + d, target - d]) {
        if (i >= 1 && i <= total - 2 && slots[i] === null) return i;
      }
    }
    return null;
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
  // Opener and exit bracket the A-story; the three quarter-mark surprises get
  // the act-turn labels; A scenes after the last surprise are the climax run
  // (RECKONING); the rest are connective tissue (SQUEEZE in act one, else
  // COMPLICATION). B and C keep their track labels.
  SURPRISE_LABELS = [
    "SURPRISE 1 — act-one turn (lock-in)",
    "SURPRISE 2 — midpoint reversal",
    "SURPRISE 3 — act-three turn (all is lost)",
  ];

  label(slots, role, surprises) {
    const aIdx = [];
    slots.forEach((s, i) => { if (s === "A") aIdx.push(i); });
    const first = aIdx[0];
    const last = aIdx[aIdx.length - 1];
    const lastSurprise = surprises.length ? surprises[surprises.length - 1] : -1;
    const firstSurprise = surprises.length ? surprises[0] : Infinity;

    return slots.map((track, i) => {
      let beat;
      if (track === "B") beat = "relational / thematic counterpoint";
      else if (track === "C") beat = this.cBeat(role);
      else if (i === first) beat = "OPENER";
      else if (i === last) beat = "EXIT";
      else if (surprises.includes(i)) beat = this.SURPRISE_LABELS[surprises.indexOf(i)];
      else if (i > lastSurprise) beat = "RECKONING";
      else if (i < firstSurprise) beat = "SQUEEZE";
      else beat = "COMPLICATION";
      return { position: i + 1, track, beat };
    });
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
