import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = window.Stimulus || Application.start()
// Connects to data-controller="plot-generator"
// The Western Engine: a genre-agnostic, Western-boned pulp premise generator.
// One chassis, seven archetypes. Only two slots ever encode the archetype —
// the STANCE (beat 1) and the DISPOSITION (beat 7). Everything between is shared.
// NOTE on naming: the original engine's "WOUND" array was renamed REVERSAL here —
// it is a plot betrayal that flips the board, NOT the internal-arc backstory Wound
// (that one is intentionally absent). The spec's POWER is split into SYSTEM + ENFORCER.
Stimulus.register("plot-generator", class extends Controller {
  static targets = [
    "stance", "code", "edge", "system", "enforcer", "squeeze", "job",
    "premise",
    "expansion", "reversal", "oneWorthSaving", "turn", "reckoning", "disposition", "wildcard",
    "skin", "expandToggle", "clip", "copyBtn", "lockBtn",
    "archetypePill",
    "genreNeutral", "genreFantasy", "genreScifi", "toneAny", "toneDark", "toneHeroic",
    "modeConfrontation", "modeInvestigation",
    "investigationGroup", "systemRow", "reversalRow", "turnRow",
    "scheme", "surface", "scope", "betrayal", "personal", "trueStakes",
    "clock", "redHerring", "stepBehind",
  ];
  static values = {
    archetype: { type: String, default: "drifter" },
    genre: { type: String, default: "neutral" },
    tone: { type: String, default: "any" },
    mode: { type: String, default: "confrontation" },
  };

  // Slot names frozen against the global Roll. Re-roll keeps locked slots and
  // regenerates the rest. Which slots are even lockable depends on the archetype
  // (see LOCKABLE), because each archetype's C-spine rides on different slots.
  locked = new Set();

  // Per-archetype lockable slots. The Code always carries the spine; the rest
  // ride on whatever that archetype's spine lives in. Locking a slot the form
  // doesn't ride on would quietly reassign the archetype, so those locks aren't
  // even shown. Archetypes not listed (and "any") fall back to LOCKABLE_DEFAULT.
  LOCKABLE = {
    drifter: ["code", "stance"],
    lawman: ["code", "system", "enforcer"],
    trek: ["code", "wildcard", "edge"],
    outlaw: ["code", "oneWorthSaving", "system"],
    homesteader: ["code", "edge", "system"],
    avenger: ["code"],
    defense: ["code"],
  };
  LOCKABLE_DEFAULT = ["code"];

  SKINS = {
    neutral: "Neutral: the slots are abstract. Pick a genre to paint them.",
    fantasy: "Fantasy: the System is a guild / order / road-baron; the route is a post-road or river; the thing that must arrive is a sealed writ or relic.",
    scifi: "Sci-fi: the System is a Combine; the route is a jump-lane; the thing that must arrive is a data-core or dispatch.",
  };
  TONES = {
    any: "",
    dark: " Play it dark: the Squeeze is cruel, the Reversal cuts deep, the Disposition steep.",
    heroic: " Play it light: more heroic, the Disposition gentler. The chassis holds; only the lean changes.",
  };

  // Standing legend, emitted with every copy so each pasted premise carries its
  // own craft contract (and never drifts from external Project instructions).
  LEGEND = [
    "LEGEND — what each slot means in craft terms",
    "Archetype = the hero's relationship to place and order; swaps the Stance and Disposition banks only.",
    "Stance = beat 1; how the hero stands toward the Edge at the start.",
    "Code = governing value / moral spine. NOT yet flagged as Truth or Lie — that call is open.",
    "Edge = arena + ticking clock; the pressured setting.",
    "System (Power) = the antagonist force, larger than any one person.",
    "Enforcer = the antagonist's human face / agent.",
    "Squeeze = the Enforcer's coercion mechanism.",
    "Job (Spur) = what binds the hero to act and pulls them in (hire, duty, defense, vengeance, loyalty, the crossing, holding the line).",
    "Reversal = a hidden plot betrayal (the renamed WOUND array). NOT the SEQ backstory Wound.",
    "One Worth Saving = the relationship character.",
    "Turn = midpoint reversal where the protagonist's own fix backfires (Snowflake disaster-by-protagonist).",
    "Reckoning = climax; the Code tested at full cost.",
    "Disposition = beat 7; the costly outcome, ended in the archetype's signature key (the Drifter's is the old Price).",
    "Wildcard = a complication object or MacGuffin.",
    "",
    "These slots define external plot, arena, and one relationship only. The internal arc — Lie, Fear, Flaw, Need, Wound, Epiphany — is intentionally absent and must be built separately.",
  ].join("\n");

  // Appended to the legend when Investigation mode is on.
  INVESTIGATION_LEGEND = [
    "INVESTIGATION (Revelation Ladder) — A-story plot-mode layer for conspiracy thrillers",
    "Scheme = what the System is secretly doing; in investigation mode it replaces the visible System in the logline.",
    "Revelation Ladder = a graduated reveal; climb one rung per tier, in order:",
    "  Surface (1), Scope (2), Betrayal (3 = the Reversal), Personal (4 = the Turn), True Stakes (5).",
    "Clock = the explicit deadline the case races.",
    "Red Herring = the lead that burns the hero's most expensive hours.",
    "One Step Behind = how the antagonist stays ahead of the hero.",
  ].join("\n");

  ARCHETYPE_LABELS = {
    drifter: "Drifter", lawman: "Lawman", homesteader: "Homesteader",
    avenger: "Avenger", outlaw: "Outlaw", trek: "Trek", defense: "Defense",
  };
  GENRE_LABELS = { neutral: "Neutral", fantasy: "Fantasy", scifi: "Sci-fi" };
  TONE_LABELS = { any: "Any", dark: "Dark", heroic: "Heroic" };

  // One chassis, seven archetypes. Each supplies a STANCE bank (beat 1), a
  // DISPOSITION bank (beat 7), an honest-broker note (series fit + melancholy
  // tax), and a lead() that frames the logline with the archetype's own Spur.
  // Defined as a getter so it can reference the shared/per-archetype banks below.
  get ARCHETYPES() {
    const cap = (s) => this.capitalize(s);
    return {
      drifter: {
        STANCE: this.DRIFTER,
        DISPOSITION: this.PRICE,
        note: "Drifter: an outsider arrives, takes a hire, and moves on — episodic, fits a long series cleanly, and the melancholy comes free with the departure.",
        lead: (c) => `${cap(c.stance)} reaches ${c.edge}, where ${c.system}, working through ${c.enforcer}, is ${c.squeeze}. The drifter, who holds that ${c.code}, takes one job: to ${c.job}.`,
      },
      lawman: {
        STANCE: this.LAWMAN_STANCE,
        DISPOSITION: this.LAWMAN_DISPOSITION,
        note: "Lawman: he is the order here, and he stays — the cleanest series fit, episodic by nature, and no melancholy tax because he belongs.",
        lead: (c) => `${cap(c.stance)} keeps the peace in ${c.edge}, where ${c.system}, working through ${c.enforcer}, is ${c.squeeze}. The lawman, who holds that ${c.code}, is sworn by duty to ${c.job}.`,
      },
      homesteader: {
        STANCE: this.HOMESTEADER_STANCE,
        DISPOSITION: this.HOMESTEADER_DISPOSITION,
        note: "Homesteader: rooted, defending his own ground — a warm, belonging form with no melancholy tax; a series can run across seasons or generations on the same land.",
        lead: (c) => `${cap(c.stance)}, rooted on ${c.edge}, where ${c.system}, working through ${c.enforcer}, is ${c.squeeze}. The household, who hold that ${c.code}, refuse to be moved and must ${c.job}.`,
      },
      avenger: {
        STANCE: this.AVENGER_STANCE,
        DISPOSITION: this.AVENGER_DISPOSITION,
        note: "Avenger: the Reversal is the spine — sample it first. This resolves when vengeance lands, so it's a standalone or tight trilogy, not a long arc, and the ending is terminal and hollow.",
        lead: (c) => `${cap(c.stance)} comes to ${c.edge}, where ${c.system}, working through ${c.enforcer}, is ${c.squeeze}. Carrying that ${c.code} and a wrong that won't rest, the avenger hunts to ${c.job}.`,
      },
      outlaw: {
        STANCE: this.OUTLAW_STANCE,
        DISPOSITION: this.OUTLAW_DISPOSITION,
        note: "Outlaw: the moral polarity flips — the System is the encroaching law and you root for the squeezed crew. Inherently terminal and elegiac: the frontier wins.",
        lead: (c) => `${cap(c.stance)} runs the country around ${c.edge}, where ${c.system}, working through ${c.enforcer}, is ${c.squeeze} — closing the frontier for good. The crew, who hold that ${c.code}, ride on loyalty for one last bid to ${c.job}.`,
      },
      trek: {
        STANCE: this.TREK_STANCE,
        DISPOSITION: this.TREK_DISPOSITION,
        note: "Trek: the trail itself is the antagonist (terrain over Power). A single crossing resolves — run it as self-contained legs to sustain a series. Melancholy is paid per leg.",
        lead: (c) => `${cap(c.stance)}, bound for ${c.edge} across country that is the real enemy. ${cap(c.system)}, working through ${c.enforcer}, is ${c.squeeze} along the way — but the trail comes first, and the party must ${c.job}.`,
      },
      defense: {
        STANCE: this.DEFENSE_STANCE,
        DISPOSITION: this.DEFENSE_DISPOSITION,
        note: "Defense: an ensemble holds a siege on a clock; the One Worth Saving is the whole community. The place endures with no melancholy tax, but the recruited defenders often pay the drifter's price.",
        lead: (c) => `${cap(c.stance)} — ${c.edge}, where ${c.system}, working through ${c.enforcer}, is ${c.squeeze}. Holding to that ${c.code}, the defenders gather to ${c.job} before the clock runs out.`,
      },
    };
  }

  // The active archetype key. "any" resolves to whatever was rolled for the
  // current premise (stored on this.current), so a single roll stays coherent
  // across its Stance, Disposition, lead, and note.
  get archetypeKey() {
    if (this.archetypeValue && this.archetypeValue !== "any") return this.archetypeValue;
    return (this.current && this.current.archetypeKey) || "drifter";
  }
  get archetype() { return this.ARCHETYPES[this.archetypeKey] || this.ARCHETYPES.drifter; }

  // Resolve the key to sample from now: a fixed pick, or a random one for "any".
  rollArchetypeKey() {
    return this.archetypeValue === "any"
      ? this.pick(Object.keys(this.ARCHETYPES))
      : this.archetypeValue;
  }

  connect() {
    this.renderSkin();
    this.roll();
    this.updateLockVisibility();
    this.applyMode();
    this.loadLadder();
  }

  // Fetch the shared investigation data once (assets/revelation_ladder.json),
  // shared with the C-Story Engine. If we're already in investigation mode when
  // it lands, populate the ladder and repaint.
  loadLadder() {
    fetch("/assets/revelation_ladder.json")
      .then((r) => r.json())
      .then((data) => {
        this.ladder = data;
        if (this.modeValue === "investigation") { this.fillInvestigation(); this.renderPremise(); }
      })
      .catch(() => { this.ladder = null; });
  }

  // Sample a fresh premise: all SEED slots plus the EXPANSION skeleton.
  // The skeleton slots are always rolled and shown; the toggle only decides
  // whether they're woven into the premise text above.
  roll() {
    const prev = this.current;
    // Locking Stance or Disposition pins the hero's archetype too, so when "any"
    // is selected and one of those is held, keep the prior archetype.
    const keepArch = prev && (this.isLocked("stance") || this.isLocked("disposition"));
    const key = keepArch ? prev.archetypeKey : this.rollArchetypeKey();
    const arch = this.ARCHETYPES[key];
    this.current = {
      archetypeKey: key,
      stance: this.keepOrPick(prev, "stance", arch.STANCE),
      code: this.keepOrPick(prev, "code", this.CODE),
      edge: this.keepOrPick(prev, "edge", this.EDGE),
      system: this.keepOrPick(prev, "system", this.SYSTEM),
      enforcer: this.keepOrPick(prev, "enforcer", this.ENFORCER),
      squeeze: this.keepOrPick(prev, "squeeze", this.SQUEEZE),
      job: this.keepOrPick(prev, "job", this.JOB),
    };
    this.fillExpansion(prev);
    this.fillInvestigation();
    this.renderSeed();
  }

  // Roll the investigation layer (scheme, the five rungs, clock, red herring,
  // step-behind). No-op until the shared ladder data has loaded.
  fillInvestigation() {
    if (!this.ladder) return;
    const L = this.ladder;
    this.current.scheme = this.pick(L.scheme);
    this.current.surface = this.pick(L.rungs.tier_1_surface);
    this.current.scope = this.pick(L.rungs.tier_2_scope);
    this.current.betrayal = this.pick(L.rungs.tier_3_betrayal);
    this.current.personal = this.pick(L.rungs.tier_4_personal);
    this.current.trueStakes = this.pick(L.rungs.tier_5_true_stakes);
    this.current.clock = this.pick(L.clock);
    this.current.redHerring = this.pick(L.red_herring);
    this.current.stepBehind = this.pick(L.step_behind);
    this.renderInvestigation();
  }

  renderInvestigation() {
    if (!this.current || !this.current.scheme) return;
    ["scheme", "surface", "scope", "betrayal", "personal", "trueStakes", "clock", "redHerring", "stepBehind"]
      .forEach((slot) => {
        const has = `has${slot[0].toUpperCase()}${slot.slice(1)}Target`;
        if (this[has]) this[`${slot}Target`].textContent = this.current[slot];
      });
  }

  // Keep a locked slot's prior value; otherwise pick fresh from its bank.
  keepOrPick(prev, slot, bank) {
    return (prev && this.isLocked(slot) && prev[slot] != null) ? prev[slot] : this.pick(bank);
  }

  // Toggle a slot's lock. The button names the slot via data-slot.
  toggleLock(event) {
    const slot = event.params.slot;
    const btn = event.currentTarget;
    const row = btn.closest(".row");
    const on = !this.locked.has(slot);
    if (on) this.locked.add(slot); else this.locked.delete(slot);
    btn.textContent = on ? "🔒" : "🔓";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    if (row) row.classList.toggle("locked", on);
  }

  isLocked(slot) { return this.locked.has(slot); }

  // The slots whose lock is relevant to the current archetype.
  lockableSlots() {
    if (this.archetypeValue === "any") return this.LOCKABLE_DEFAULT;
    return this.LOCKABLE[this.archetypeValue] || this.LOCKABLE_DEFAULT;
  }

  // Show only the lock buttons the selected archetype's spine rides on; hide the
  // rest. A lock that no longer applies is released so it can't silently persist.
  updateLockVisibility() {
    if (!this.hasLockBtnTarget) return;
    const allowed = this.lockableSlots();
    this.lockBtnTargets.forEach((btn) => {
      const slot = btn.dataset.plotGeneratorSlotParam;
      const show = allowed.includes(slot);
      btn.style.display = show ? "" : "none";
      if (!show && this.locked.has(slot)) {
        this.locked.delete(slot);
        btn.textContent = "🔓";
        btn.setAttribute("aria-pressed", "false");
        const row = btn.closest(".row");
        if (row) row.classList.remove("locked");
      }
    });
  }

  // Re-roll a single slot. The triggering button names the slot via data-slot.
  reroll(event) {
    const slot = event.params.slot;
    if (this.isLocked(slot)) return; // frozen — unlock to change it
    const arch = this.archetype;
    const banks = {
      stance: arch.STANCE, code: this.CODE, edge: this.EDGE,
      system: this.SYSTEM, enforcer: this.ENFORCER, squeeze: this.SQUEEZE, job: this.JOB,
      reversal: this.REVERSAL, oneWorthSaving: this.ONE_WORTH_SAVING, turn: this.TURN,
      reckoning: this.RECKONING, disposition: arch.DISPOSITION, wildcard: this.WILDCARD,
    };
    if (this.ladder) {
      const L = this.ladder;
      Object.assign(banks, {
        scheme: L.scheme, surface: L.rungs.tier_1_surface, scope: L.rungs.tier_2_scope,
        betrayal: L.rungs.tier_3_betrayal, personal: L.rungs.tier_4_personal,
        trueStakes: L.rungs.tier_5_true_stakes,
        clock: L.clock, redHerring: L.red_herring, stepBehind: L.step_behind,
      });
    }
    if (!banks[slot]) return;
    this.current[slot] = this.pick(banks[slot]);
    this[`${slot}Target`].textContent = this.current[slot];
    // Any reroll may change the premise text (seed always; skeleton when toggled).
    this.renderPremise();
  }

  // The toggle just re-renders the premise; the skeleton slots stay visible.
  toggleExpansion() {
    this.renderPremise();
  }

  // Copy a self-contained block: the premise narrative, the labelled slot
  // values, the archetype/genre/tone note, and the standing legend — so whatever
  // is pasted elsewhere needs no inference about what each slot means.
  buildCopyText() {
    const c = this.current;
    const inv = this.modeValue === "investigation" && c.scheme;
    const expanded = this.hasExpandToggleTarget && this.expandToggleTarget.checked;
    const archLabel = this.archetypeValue === "any"
      ? `Any (rolled ${this.ARCHETYPE_LABELS[this.archetypeKey]})`
      : this.ARCHETYPE_LABELS[this.archetypeValue];
    const common = [`Stance: ${c.stance}`, `Code: ${c.code}`, `Edge: ${c.edge}`];
    const slotLines = inv
      ? [
          ...common,
          `Enforcer: ${c.enforcer}`,
          `Squeeze: ${c.squeeze}`,
          `Job: ${c.job}`,
          `Scheme: ${c.scheme}`,
          `Surface (rung 1): ${c.surface}`,
          `Scope (rung 2): ${c.scope}`,
          `Betrayal (rung 3 = Reversal): ${c.betrayal}`,
          `Personal (rung 4 = Turn): ${c.personal}`,
          `True Stakes (rung 5): ${c.trueStakes}`,
          `Clock: ${c.clock}`,
          `Red Herring: ${c.redHerring}`,
          `One Step Behind: ${c.stepBehind}`,
          `One Worth Saving: ${c.oneWorthSaving}`,
          `Reckoning: ${c.reckoning}`,
          `Disposition: ${c.disposition}`,
          `Wildcard: ${c.wildcard}`,
        ]
      : [
          ...common,
          `System: ${c.system}`,
          `Enforcer: ${c.enforcer}`,
          `Squeeze: ${c.squeeze}`,
          `Job: ${c.job}`,
          `Reversal: ${c.reversal}`,
          `One Worth Saving: ${c.oneWorthSaving}`,
          `Turn: ${c.turn}`,
          `Reckoning: ${c.reckoning}`,
          `Disposition: ${c.disposition}`,
          `Wildcard: ${c.wildcard}`,
        ];
    const lines = [
      "PREMISE",
      this.premiseTarget.textContent,
      "",
      "SLOTS",
      `Archetype: ${archLabel}`,
      ...slotLines,
      "",
      `Archetype: ${archLabel} · Mode: ${inv ? "Investigation" : "Confrontation"} · Genre: ${this.GENRE_LABELS[this.genreValue]} · Tone: ${this.TONE_LABELS[this.toneValue]} · Skeleton woven into premise: ${expanded ? "yes" : "no"}`,
      "",
      inv ? `${this.LEGEND}\n\n${this.INVESTIGATION_LEGEND}` : this.LEGEND,
    ];
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

  // Pull from the five EXPANSION slots (plus optional wildcard) to flesh out the skeleton.
  fillExpansion(prev) {
    prev = prev || this.current;
    this.current.reversal = this.keepOrPick(prev, "reversal", this.REVERSAL);
    this.current.oneWorthSaving = this.keepOrPick(prev, "oneWorthSaving", this.ONE_WORTH_SAVING);
    this.current.turn = this.keepOrPick(prev, "turn", this.TURN);
    this.current.reckoning = this.keepOrPick(prev, "reckoning", this.RECKONING);
    this.current.disposition = this.keepOrPick(prev, "disposition", this.archetype.DISPOSITION);
    this.current.wildcard = this.keepOrPick(prev, "wildcard", this.WILDCARD);

    this.reversalTarget.textContent = this.current.reversal;
    this.oneWorthSavingTarget.textContent = this.current.oneWorthSaving;
    this.turnTarget.textContent = this.current.turn;
    this.reckoningTarget.textContent = this.current.reckoning;
    this.dispositionTarget.textContent = this.current.disposition;
    this.wildcardTarget.textContent = this.current.wildcard;
  }

  setArchetype(event) { this.archetypeValue = event.params.archetype; }
  setGenre(event) { this.genreValue = event.params.genre; }
  setTone(event) { this.toneValue = event.params.tone; }
  setMode(event) { this.modeValue = event.params.mode; }

  // Investigation swaps the visible System for the Scheme, hides the generic
  // Reversal and Turn (the ladder supersedes them), and surfaces the ladder.
  modeValueChanged() {
    if (!this.current) return;
    if (this.modeValue === "investigation" && this.ladder && !this.current.scheme) this.fillInvestigation();
    this.applyMode();
    this.renderPremise();
    this.highlightDials();
  }

  applyMode() {
    const inv = this.modeValue === "investigation";
    if (this.hasInvestigationGroupTarget) this.investigationGroupTarget.classList.toggle("hidden", !inv);
    if (this.hasSystemRowTarget) this.systemRowTarget.classList.toggle("hidden", inv);
    if (this.hasReversalRowTarget) this.reversalRowTarget.classList.toggle("hidden", inv);
    if (this.hasTurnRowTarget) this.turnRowTarget.classList.toggle("hidden", inv);
  }

  // Switching archetype resamples the two swappable slots from the new banks
  // and re-renders the note and premise; the shared middle is left intact.
  archetypeValueChanged() {
    if (!this.current) { this.renderSkin(); return; }
    const key = this.rollArchetypeKey();
    this.current.archetypeKey = key;
    const arch = this.ARCHETYPES[key];
    this.current.stance = this.pick(arch.STANCE);
    this.current.disposition = this.pick(arch.DISPOSITION);
    this.stanceTarget.textContent = this.current.stance;
    this.dispositionTarget.textContent = this.current.disposition;
    this.renderSkin();
    this.renderPremise();
    this.updateLockVisibility();
  }

  genreValueChanged() { this.renderSkin(); }
  toneValueChanged() { this.renderSkin(); }

  renderSkin() {
    if (!this.hasSkinTarget) return;
    const note = this.archetype.note;
    const anyTag = this.archetypeValue === "any" ? `Any → rolled ${this.ARCHETYPE_LABELS[this.archetypeKey]}. ` : "";
    this.skinTarget.textContent =
      anyTag + note + " " + (this.SKINS[this.genreValue] || this.SKINS.neutral) + (this.TONES[this.toneValue] || "");
    this.highlightDials();
  }

  // Mark the active archetype/genre/tone pill via aria-pressed (styled in the page CSS).
  highlightDials() {
    if (this.hasArchetypePillTarget) {
      this.archetypePillTargets.forEach((el) =>
        el.setAttribute("aria-pressed", el.dataset.plotGeneratorArchetypeParam === this.archetypeValue));
    }
    const genrePills = {
      neutral: this.genreNeutralTarget, fantasy: this.genreFantasyTarget, scifi: this.genreScifiTarget,
    };
    const tonePills = {
      any: this.toneAnyTarget, dark: this.toneDarkTarget, heroic: this.toneHeroicTarget,
    };
    Object.entries(genrePills).forEach(([k, el]) => el.setAttribute("aria-pressed", k === this.genreValue));
    Object.entries(tonePills).forEach(([k, el]) => el.setAttribute("aria-pressed", k === this.toneValue));
    if (this.hasModeConfrontationTarget) {
      this.modeConfrontationTarget.setAttribute("aria-pressed", this.modeValue === "confrontation");
      this.modeInvestigationTarget.setAttribute("aria-pressed", this.modeValue === "investigation");
    }
  }

  renderSeed() {
    this.stanceTarget.textContent = this.current.stance;
    this.codeTarget.textContent = this.current.code;
    this.edgeTarget.textContent = this.current.edge;
    this.systemTarget.textContent = this.current.system;
    this.enforcerTarget.textContent = this.current.enforcer;
    this.squeezeTarget.textContent = this.current.squeeze;
    this.jobTarget.textContent = this.current.job;
    this.renderPremise();
  }

  // Weave the seed slots into a logline using the active archetype's lead; when
  // the toggle is on, append the expanded skeleton (Reversal, One Worth Saving,
  // Turn, Reckoning, Disposition, Wildcard).
  renderPremise() {
    if (!this.current) return;
    const c = this.current;
    const expanded = this.hasExpandToggleTarget && this.expandToggleTarget.checked;
    let text;
    if (this.modeValue === "investigation" && c.scheme) {
      text = this.investigationLead(c);
      if (expanded) {
        text +=
          ` The reveal climbs — Surface: ${c.surface} Scope: ${c.scope} Betrayal: ${c.betrayal} ` +
          `Personal: ${c.personal} True stakes: ${c.trueStakes} Red herring: ${c.redHerring} ` +
          `Always a step behind: ${c.stepBehind}`;
      }
    } else {
      text = this.archetype.lead(c);
      if (expanded && c.reversal) {
        text +=
          ` The reversal: ${c.reversal}. The one worth saving is ${c.oneWorthSaving}. ` +
          `The turn comes when ${c.turn}. Everything tightens toward the reckoning — ${c.reckoning} — ` +
          `and the disposition: ${c.disposition}. Wildcard: ${c.wildcard}.`;
      }
    }
    this.premiseTarget.textContent = text;
  }

  // Mode-level investigation logline: the visible squeeze is cover, the Scheme is
  // the truth, the Clock is load-bearing. Replaces the System with the Scheme.
  investigationLead(c) {
    const cap = (s) => this.capitalize(s);
    return `${cap(c.stance)} comes to ${c.edge}. On the surface, ${c.enforcer} is ${c.squeeze} — but that is ` +
      `cover. ${c.scheme} Holding that ${c.code}, they work the case to ${c.job}. Clock: ${c.clock}`;
  }

  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

  // ── Stance banks (beat 1) — one per archetype ─────────────────────────────

  // The Drifter's stance: an outsider with a Code and a Wound arrives at the Edge.
  DRIFTER = [
    "a mustered-out soldier with nowhere to be",
    "a courier who always finishes the run",
    "a disgraced professional working under another name",
    "a hunter between contracts",
    "a fixer who has seen too much",
    "an exile who can't go home",
    "a repentant killer trying to do one clean thing",
    "a wanderer chasing a rumor",
    "a deserter who chose the wrong side to leave",
    "a former enforcer for the Power, now adrift",
    "a scout who knows country no one else will cross",
    "a debt-collector who quit mid-job",
    "a widower working their way somewhere",
    "a prodigy cast out of the order that made them",
    "a smuggler done with the trade but not the road",
    "a guard who outlived the thing they guarded",
  ];

  LAWMAN_STANCE = [
    "the marshal of a circuit too wide to hold",
    "the only authority for a hundred miles, and tired of it",
    "newly sworn, and not yet feared",
    "a keeper of a peace that's fraying at the edges",
    "the law in a place outgrowing the law",
    "an officer holding a post the center forgot to staff",
    "a warden of a route reopening faster than he can patrol it",
    "the last honest badge in a bought town",
    "a peacekeeper inheriting a predecessor's unfinished trouble",
    "a circuit-rider whose jurisdiction nobody respects yet",
    "the order's man in a place that resents the order",
    "a constable whose authority ends where the Power's begins",
  ];

  HOMESTEADER_STANCE = [
    "a holder who built the place with their own hands",
    "an heir to ground they didn't choose but won't surrender",
    "a family rooted deeper than the Power's claim",
    "a settler one season from making it or losing it",
    "a steward of land that's been theirs longer than memory",
    "a widow holding a claim alone",
    "a clan whose roots are the one thing the Power can't buy",
    "a builder who turned wilderness into something worth taking",
    "a holder whose deed is older than the Power's charter",
    "someone who has nowhere else, and so will not move",
    "a household that's all that's left of a vanished community",
    "the keeper of the one well, the one mill, the one bridge",
  ];

  AVENGER_STANCE = [
    "a hunter with one name left on the list",
    "someone who has crossed half the country to find one person",
    "a survivor of a wrong no one else will answer for",
    "a figure who buried everything except the debt",
    "someone the Power thought it had already killed",
    "a tracker following a trail years cold",
    "one who turned grief into a single purpose",
    "a returnee, come back to where it all started",
    "someone owed blood, with the law unwilling to collect it",
    "a wronged party who has stopped waiting for justice",
    "a ghost the guilty thought they'd left behind",
    "the last of a line, hunting the ones who ended it",
  ];

  OUTLAW_STANCE = [
    "a gang whose territory shrinks every season",
    "a crew of holdouts the new order has criminalized",
    "free riders the closing frontier is squeezing out",
    "a band loyal to a way of life the world is ending",
    "outlaws who were heroes before the law caught up",
    "a crew running out of country to disappear into",
    "the last of an old breed, hunted by the new one",
    "a gang that knows this is the last good year",
    "free company — useful once, hunted now",
    "the ones the Power needs gone to call itself legitimate",
    "a crew whose code is older and cleaner than the law hunting them",
    "holdouts choosing one last stand over surrender",
  ];

  TREK_STANCE = [
    "a party setting out across country that kills the unprepared",
    "a drive moving something valuable through a wilderness",
    "a column fleeing toward a place that might not take them",
    "a guide leading those who can't lead themselves",
    "a crossing that has to be made before a season closes",
    "a caravan with more cargo than the road can bear",
    "a group bound for a destination none of them have seen",
    "a march away from a ruin toward a rumor of safety",
    "a congregation moving, or dying where they stand",
    "a passage through ground that has swallowed others",
    "a journey already too late to turn back from",
    "a hard road taken because every other road is worse",
  ];

  DEFENSE_STANCE = [
    "a place that knows the attack is coming and can't stop it alone",
    "a community scraping together its own defenders",
    "a holding recruiting strangers because it has no soldiers",
    "a town hiring guns it can barely afford",
    "a refuge rallying everyone who can hold a weapon",
    "a settlement with a deadline and no army",
    "a place where the few who'll fight gather for the many who can't",
    "a holdout assembling its defense from the unlikely and unwilling",
    "a community choosing to stand instead of scatter",
    "a place recruiting protectors knowing most won't survive",
    "a siege forming, and a handful deciding to meet it",
    "a town finding its courage one volunteer at a time",
  ];

  // ── Shared pool — carries over for every archetype ────────────────────────

  CODE = [
    "the job gets finished, whatever it costs",
    "never leave a debt unpaid",
    "the weak don't get left behind",
    "a promise to the dead is still a promise",
    "no killing unless there's no other door",
    "the truth gets told, even to the powerful",
    "you protect what you're paid to protect",
    "you don't run, once you've taken a side",
    "you finish what someone else abandoned",
    "you don't take a job you can't look at afterward",
    "a roof and a meal are owed to anyone who asks",
    "you never sell out the one who hired you",
    "mercy is offered once, and meant",
    "you don't draw first, but you don't draw slow",
    "what's given in trust is never spent",
    "you answer for your own dead",
  ];

  EDGE = [
    "the last free holding on a dying route",
    "a source everyone needs and one person owns",
    "a relay station at the end of the line",
    "a boomtown gone sour",
    "a border outpost the center has forgotten",
    "a refuge that takes anyone who's running",
    "a crossing no one controls cleanly",
    "a settlement built on something buried",
    "a waystation that survives on neutrality alone",
    "a quarantine town the center walled off and left",
    "a market that thrives because no law reaches it",
    "a way through the wild only one guide knows",
    "a holding promised help that never came",
    "the ruins of a greater place, half-resettled",
    "a chokepoint two powers both claim",
    "a sanctuary running out of whatever keeps it safe",
  ];

  // SYSTEM = the antagonist force, larger than any one person (the spec's "Power").
  SYSTEM = [
    "a company that owns the law here",
    "a guild that stopped serving anyone but itself",
    "a faith with soldiers and a ledger",
    "a syndicate that took the route piece by piece",
    "an old order clinging past its time",
    "a cartel that wants the one thing this place has",
    "a banking house that forecloses with hired guns",
    "a peacekeeping force that has stopped keeping peace",
    "a dynasty that treats the region as inheritance",
    "a charter that lets one outfit do anything it likes",
    "a monopoly that starves out every rival",
    "a trading combine that answers to no local law",
    "a crown that has written this place out of its maps",
    "a chartered militia that polices its own profits",
    "a holy order that taxes in both souls and silver",
    "a coalition of houses that fixed the price of everything",
  ];

  // ENFORCER = the System's human face / agent on the ground.
  ENFORCER = [
    "a warlord dressed as a governor",
    "a magistrate with a private agenda",
    "a boss whose word is the only law for a hundred miles",
    "a zealot who believes the cruelty is righteous",
    "a quiet broker who owns everyone's debts",
    "a company factor with a ledger and hired guns",
    "a marshal who serves the highest bidder",
    "a captain who plainly enjoys the work",
    "a tax-farmer squeezing the last coin from the place",
    "a foreman who rules the works like a private fief",
    "a smiling envoy who never says the threat out loud",
    "an inquisitor sent to make an example",
    "an overseer promoted well past their conscience",
    "a fixer who launders the System's cruelty into paperwork",
    "a favored heir testing how much they can take",
    "a turncoat local raised up to keep the others in line",
  ];

  SQUEEZE = [
    "forcing the holder to sell, wed, or yield",
    "choking the route until the locals beg",
    "bleeding the place into submission",
    "disappearing anyone who refuses",
    "seizing the resource and calling it law",
    "driving the people off the land they hold",
    "buying the loyal and breaking the rest",
    "demanding a person, not a price",
    "rewriting the records so the place was never theirs",
    "cutting off the one thing the place can't live without",
    "turning neighbor against neighbor with rumor and coin",
    "installing a puppet and calling it consent",
    "holding someone's kin to guarantee obedience",
    "flooding the place with its own people to outnumber the locals",
    "making an example of the first to say no",
    "offering protection from a threat it secretly runs",
  ];

  // JOB = the Spur: what binds the hero to act. Each archetype reframes it in
  // its lead() (a hire, a duty, a defense, a hunt, a last score, a crossing,
  // holding the line) — the bank of concrete tasks is shared.
  JOB = [
    "escort something precious through hostile ground",
    "deliver a thing that has to arrive",
    "defend a place that can't defend itself",
    "retrieve someone or something taken",
    "track a person and bring them back",
    "broker a deal between people who hate each other",
    "guard a holder until a deadline",
    "clear a road the Power has closed",
    "carry a warning ahead of the thing that's coming",
    "get a witness somewhere they can be heard",
    "find out what happened to someone who vanished",
    "hold a line long enough for others to get clear",
    "recover proof the Power buried",
    "lead people out through country that will kill them",
    "settle a debt that isn't the drifter's own",
    "stand in for someone who can't make the stand themselves",
  ];

  // REVERSAL = a hidden plot betrayal / a buried truth that flips the board.
  // This is the renamed WOUND array — NOT a backstory injury (that internal-arc
  // "Wound" is intentionally absent). For the Avenger, sample this first: it is
  // the spine the whole plot collects toward.
  REVERSAL = [
    "an ally has been the System's informer all along",
    "the one worth saving has been lying about who they are",
    "the Job was a setup to flush the drifter into the open",
    "the thing being protected is the thing causing the harm",
    "a trusted local sold the others out long ago",
    "the rescue was staged to draw the drifter in",
    "the System's claim to the place is legally airtight",
    "the Enforcer and the drifter share a buried history",
    "the witness everyone trusts is fabricating the story",
    "the place's salvation rests on a cruelty no one admits",
    "the dead the drifter answers to were never innocent",
    "the map, writ, or proof has been forged from the start",
    "the one who hired the drifter wants the Job to fail",
    "the Squeeze is cover for a far larger crime",
    "a second faction has been steering events from the dark",
    "a past act of the drifter's set this whole thing in motion",
  ];

  ONE_WORTH_SAVING = [
    "a holder who won't be moved",
    "a child who shouldn't be in this",
    "an old friend on the wrong side now",
    "a people the Power wants gone",
    "an heir who doesn't know what they carry",
    "a fugitive worth more alive than dead",
    "a stubborn elder holding the last line",
    "a stranger who reminds the drifter of someone they lost",
    "a young hothead about to get themselves killed",
    "a turncoat trying to make it right",
    "a healer the whole place depends on",
    "someone who saved the drifter once",
    "a witness no one will believe yet",
    "a rival the drifter can't quite hate",
    "the last person still telling the truth out loud",
    "a whole town that doesn't know it's already a target",
  ];

  TURN = [
    "the drifter's fix hands the Power what it wanted",
    "the ally is the Power's, and has been all along",
    "the one worth saving isn't who they seemed",
    "the job was bait for a bigger trap",
    "the masked figure from the wild is the drifter's lost kin",
    "the thing everyone's fighting for is dangerous",
    "the law arrives, and it's on the wrong side",
    "the price of the Code comes due early",
    "winning the first round only raises the stakes",
    "the drifter's past walks into town",
    "the Power was the lesser of two threats all along",
    "the one worth saving makes a choice that dooms them both",
    "the Code forces the drifter to spare the wrong person",
    "help that was promised turns back at the border",
    "the secret the drifter's been keeping gets out",
    "the Power offers a deal that's genuinely tempting",
  ];

  RECKONING = [
    "a siege: hold the place against the closing force",
    "a confrontation that can't be talked out",
    "a flight to a refuge that can be sealed behind them",
    "the Power's crime named where it can't be hidden",
    "a raid to take back what was taken",
    "a last stand bought to buy others time",
    "a trade: the drifter for the one worth saving",
    "one chance to get the proof to the one who matters",
    "turning the Power's own people against it at the breaking point",
    "a gambit that only works if the Code holds",
    "luring the force into ground that levels the odds",
    "an ultimatum delivered to the Power's face, alone",
    "holding the gate while the clock runs out",
    "forcing the choice the Power thought it could avoid",
  ];

  // ── Disposition banks (beat 7) — one per archetype ────────────────────────

  // The Drifter's disposition: a partial, costly win, then the road again (the old PRICE).
  PRICE = [
    "the place is saved, but the drifter can't stay",
    "they win, and someone they couldn't save is gone",
    "the Power falls, but the rot it leaves doesn't",
    "the Code holds, and costs the drifter the thing they wanted",
    "this corner mended, the larger dark untouched",
    "the truth is out, but no one in power will act on it",
    "the drifter rides on, a little more hollow and a little more whole",
    "the win belongs to the locals; the drifter is forgotten by spring",
    "the Code is kept, and it makes the drifter an outlaw",
    "the one worth saving is safe, and never knows the cost",
    "a new power rises in the old one's place — better, for now",
    "the drifter buries the old grief, but not the limp it left",
    "peace is bought with a compromise that will ache for years",
    "the drifter could have stayed, and chooses the road anyway",
  ];

  LAWMAN_DISPOSITION = [
    "the peace holds, and he stays to keep it",
    "order is restored, and the cost is written on him",
    "he wins, and the badge weighs more than before",
    "the town keeps him, and he's no longer sure it should",
    "the line is held; he rides the circuit again, alone",
    "justice is done by the book, and the book feels thinner for it",
    "he keeps his oath and loses the illusion that it's clean",
    "the Power breaks here; he stays for whatever comes next",
    "he belongs, and belonging is its own kind of trap",
    "order returns, and he's the one who has to live inside it",
    "he stays, older, with one more grave to tend",
    "the law wins, and he learns what it cost to make it",
  ];

  HOMESTEADER_DISPOSITION = [
    "the land stays theirs, and the cost is buried in it",
    "they hold, and the holding is thinner than before",
    "the Power breaks against them; the household survives, smaller",
    "the place endures, and so does the grief it took",
    "they keep the ground and lose someone who worked it",
    "the deed holds, and the next threat is already on the horizon",
    "they win the season; the war for the land is never over",
    "the home stands, marked forever by what was paid",
    "they refuse to move, and the Power moves on to easier prey",
    "the roots hold, deeper now, fed by a new grave",
    "the place is saved and changed into something harder",
    "they stay, because staying was always the whole point",
  ];

  AVENGER_DISPOSITION = [
    "the last name is crossed off, and nothing fills the space",
    "vengeance is done, and the wound is still there",
    "they win, and find the purpose was the only thing holding them up",
    "justice by their own hand, and exile from everyone else's",
    "the guilty pay, and the cost is the avenger's own soul",
    "they get it, and learn it was never going to be enough",
    "the debt is collected; there's no home left to return to",
    "the Power falls, and the avenger has nowhere left to point",
    "they choose mercy at the last, and have to live with that instead",
    "the reckoning lands, and the framing doorway closes them out",
    "they finish it and ride into a country with no use for them",
    "it's done — and that's the worst thing that could happen",
  ];

  OUTLAW_DISPOSITION = [
    "they go out on their own terms, and the country closes over them",
    "the crew is broken, and the way of life with it",
    "they win the fight and lose the era",
    "one rides clear; the rest become a story told in past tense",
    "the score lands, and there's nowhere left to spend it",
    "the law wins, as it always would, and is poorer for it",
    "they choose the stand over the surrender — beautiful and doomed",
    "the frontier dies the day they do",
    "they make it across, into a world with no place for them",
    "the gang ends; the legend starts the same afternoon",
    "they're hunted down, and the ones who do it know what they're killing",
    "freedom, for exactly as long as it takes to end",
  ];

  TREK_DISPOSITION = [
    "they arrive, fewer than they set out, and changed",
    "the crossing is made; the cost stays on the trail behind them",
    "they reach it, and it isn't what the rumor promised",
    "the destination is real, and so are the graves between",
    "they make it, and the ones who didn't mattered most",
    "arrival, paid for leg by leg",
    "the road ends; the people who finished it aren't who started",
    "they get there, and the guide can't follow them in",
    "the cargo arrives; the carriers are spent",
    "the crossing succeeds, and proves the trail always wins eventually",
    "they reach safety and find the trail followed them in",
    "home, or its nearest substitute, bought with the whole journey",
  ];

  DEFENSE_DISPOSITION = [
    "the line holds, and most of the defenders don't",
    "they win, and the cost is counted in the people who saved them",
    "the attack breaks against them; the survivors are few",
    "the place stands, emptied of the ones who made it stand",
    "they hold the line and learn what holding it costs",
    "victory, and a long list of names to remember",
    "the siege is lifted; those left can't go back to who they were",
    "they win it together and pay for it one by one",
    "the town survives; the band that saved it is mostly gone",
    "the line holds long enough, which was always all that was asked",
    "they break the assault, and the ones left ride out quieter",
    "the place is saved, and the saving is the whole story",
  ];

  WILDCARD = [
    "a clock: relief arrives at a fixed hour",
    "a hidden third faction playing both sides",
    "a relic everyone underestimates",
    "a turncoat with a change of heart",
    "the terrain, the weather, or the dark as a second enemy",
    "a favor that comes due at the worst moment",
    "a rumor that's worth more than the truth",
    "a map or key that only half-works",
    "an old enemy who wants the same thing, for once",
    "a gathering that fills the place with strangers",
    "a wound or sickness the drifter is hiding",
    "a message that arrives too late to change anything but the ending",
  ];
});
