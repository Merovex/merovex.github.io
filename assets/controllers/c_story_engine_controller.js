import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = window.Stimulus || Application.start()
// Connects to data-controller="c-story-engine"
// The C-Story Engine: companion to the Western Engine (plot-generator).
// The Western Engine rolls the A-story — the self-contained episode that
// opens and closes inside one installment. This rolls the C-story: the
// serialized continuity spine that advances one click per episode and pays
// off across the whole arc.
//
// Design rule: a C-story is generated ONCE per series, not per episode. You
// roll a spine, then the generator distributes its clicks across N episodes
// on a plant / nudge / tag rhythm so each installment advances the arc
// exactly one notch while the A-story resolves clean.
//
// Honest-broker scope: only three archetypes sustain an episodic A/B/C run,
// so only three carry a portable spine here. The other four terminate or
// resist episodic structure and get notes instead of generators. This is
// deliberate, not an omission.
Stimulus.register("c-story-engine", class extends Controller {
  static targets = [
    "archetypePill", "episodes", "episodesOut",
    "spine", "note",
    "question", "stake", "terminus", "key",
    "timeline", "copyBtn",
  ];
  static values = {
    archetype: { type: String, default: "lawman" },
    episodes: { type: Number, default: 6 },
  };

  ARCHETYPE_LABELS = {
    lawman: "Lawman", drifter: "Drifter", trek: "Trek",
    homesteader: "Homesteader", outlaw: "Outlaw", defense: "Defense", avenger: "Avenger",
  };

  // Per-archetype default run length. The generator default is 6; the Drifter's
  // tighter pursuit fits 4, the Lawman's institutional rot wants 8. Selecting an
  // archetype seeds its default; the slider still overrides freely after that.
  DEFAULT_EPISODES = { lawman: 8, drifter: 4, trek: 6 };

  // ── LAWMAN ────────────────────────────────────────────────────────────────
  // Belongs to the order, so the A-story carries no melancholy tax. That frees
  // the spine to be the dark one: is the institution that gives him belonging
  // worth serving? The wound and the duty are at war.
  LAWMAN = {
    note: "Belongs to the order, so the A-story carries no melancholy tax. That frees the spine to be the dark one: is the institution that gives him belonging worth serving? The wound and the duty are at war.",
    questions: [
      "Who inside the Service ordered the route closed that killed his partner?",
      "Does the quota corruption he keeps brushing reach all the way to the Postmaster?",
      "Is the Reclamation buying marshals on his circuit, and is he already bought without knowing it?",
      "Why was his jurisdiction redrawn the week before the massacre he keeps being told to forget?",
      "What did his oath actually cost the people he was sworn to protect?",
    ],
    stakes: [
      "If the rot reaches the top, the badge is a leash, not a duty.",
      "Every case he closes clean may be laundering a larger crime he can't see.",
      "The institution that gives him belonging may be the thing he has to bring down.",
      "Clearing his partner's name may require burning the order that gave him a home.",
    ],
    clicks: [
      "A sealed quota-order surfaces with his own seal forged onto it.",
      "A witness who could name the buyer dies in custody, ruled natural causes.",
      "An older marshal warns him off the thread, then is quietly reassigned coreward.",
      "A ledger fragment links his partner's death to a hop-quota auction.",
      "His own superior commends him for the exact case he was trying to bury.",
      "A courier he once protected turns out to have carried the evidence the whole time.",
      "The Reclamation contact everyone fears turns out to wear a Service uniform.",
      "A clean case forces him to enforce the very rule that hid the crime.",
    ],
    termini: [
      "He proves the rot, and the proof ends his career to keep the circuit honest.",
      "He brings down the buyer and is handed the buyer's compromised seat as reward.",
      "He keeps the badge by burying the truth, and has to live knowing it.",
      "He clears his partner and learns the order let the partner die on purpose.",
    ],
    keys: [
      "Order kept, faith in it broken.",
      "Duty honored, the institution mourned.",
      "Belonging preserved, conscience mortgaged.",
      "The badge held, the man hollowed.",
    ],
  };

  // ── DRIFTER ───────────────────────────────────────────────────────────────
  // He leaves every episode, so the spine cannot live in a place. It rides
  // entirely on what he carries internally: a pursuit, a search, a debt, a
  // record he's outrunning. The Hulk-TV model. The melancholy tax stays.
  DRIFTER = {
    note: "He leaves every episode, so the spine cannot live in a place. It rides entirely on what he carries internally: a pursuit, a search, a debt, a record he's outrunning. The Hulk-TV model. The melancholy tax stays.",
    questions: [
      "What is he carrying coreward that he won't open, and who is willing to kill for it?",
      "Which of the names on his list is the one who actually wronged him?",
      "Can a man who fixes every town he enters ever be allowed to stay in one?",
      "What did he do at the thing he won't name, and how long until it catches up?",
      "Is the figure pursuing him a man, the Reclamation, or just his own record?",
    ],
    stakes: [
      "Each town he saves is one more place he can never return to.",
      "The pursuit closes a little every leg; standing still means capture.",
      "The package may be the only leverage keeping him alive, or the reason he'll die.",
      "If he stops moving, the wound he's outrunning finally catches him.",
    ],
    clicks: [
      "A bounty notice with his old name reaches a town one leg behind him.",
      "Someone he saved last episode is questioned by people he's never met.",
      "The sealed package leaks a single detail that rewrites why he's running.",
      "A face from before recognizes him across a crowded dock and says nothing.",
      "He learns the pursuer isn't chasing him but herding him coreward.",
      "A town offers him exactly the staying he wants; the spine makes him refuse.",
      "A clue proves the man he blames may have been a courier like him.",
      "Word arrives that the place he's running toward already knows he's coming.",
    ],
    termini: [
      "He delivers the package, and the delivery is what frees or dooms him.",
      "He confronts the pursuer and learns he was the wrong quarry all along.",
      "He gets the chance to stay and walks, because the wound never closed.",
      "He finds the last name on the list, and the name is already dead.",
    ],
    keys: [
      "The mystery closed, the man still unrooted.",
      "The leaving earned, the melancholy intact.",
      "One thing answered, the road unchanged.",
      "The pursuit ended, the staying still impossible.",
    ],
  };

  // ── TREK ──────────────────────────────────────────────────────────────────
  // Episodic only as legs of a single journey, so the spine is FINITE by
  // design: destination plus attrition. Plan the terminus before you start.
  // Each leg is an A-story; the trail is the C-story, and it ends.
  TREK = {
    note: "Episodic only as legs of a single journey, so the spine is FINITE by design: destination plus attrition. Plan the terminus before you start. Each leg is an A-story; the trail is the C-story, and it ends.",
    questions: [
      "Will the convoy reach the waypoint before route pollution seals it for good?",
      "Which of the company will still be alive when the trail finally ends?",
      "Is the cargo worth the cost the trail keeps extracting to move it?",
      "Who in the company is feeding their position to the Power waiting ahead?",
    ],
    stakes: [
      "Every leg closes a route behind them; there is no turning back.",
      "The destination may already be gone by the time they arrive.",
      "The thing they're hauling may not be worth a single life it's costing.",
      "If the traitor isn't found, the next ambush is the last one.",
    ],
    clicks: [
      "A founding member of the company dies, and the cargo somehow gets heavier.",
      "A closed hop-route forces a longer, deadlier leg than anyone planned.",
      "The cargo's true nature is revealed and splits the company in half.",
      "A traitor's sign appears: the Power knew their next waypoint before they did.",
      "Word from the destination arrives garbled — come faster, or don't come at all.",
      "A leg that should have been safe takes the strongest of them.",
      "The map proves the safe route was never going to exist.",
    ],
    termini: [
      "They arrive diminished, and the cargo's worth is finally weighed against the dead.",
      "They arrive to find the destination changed past recognizing.",
      "The trail takes the leader at the last waypoint; the rest finish it without them.",
      "They reach the end and learn the crossing mattered to no one but themselves.",
    ],
    keys: [
      "Arrival paid for in attrition.",
      "The crossing made, the company hollowed.",
      "The trail finished, the reason for it lost.",
      "They got there; not all of them, and not whole.",
    ],
  };

  get ARCHETYPES() {
    return { lawman: this.LAWMAN, drifter: this.DRIFTER, trek: this.TREK };
  }

  // The four that do not get a generator, and why. Honest-broker flags so the
  // user is never surprised that a spine didn't come back.
  ARCHETYPE_NOTES = {
    homesteader: "Rooted, not episodic. Plausible week-of-threats against one place run out fast. The form wants generational serial, not A/B/C. Build a saga, not a spine.",
    outlaw: "Elegiac and terminal. Caper-of-the-week fights the closing frontier the form is about. Run it as an anthology of jobs heading toward one ending, not an open spine.",
    defense: "A single siege, climactic and ensemble. Recurring sieges strain belief. One-shot.",
    avenger: "Terminal by design. The spine IS the whole story, and there are no episodes to hang an A-plot on. Write the book, not the series.",
  };

  // Standing legend, emitted with every copy so each pasted spine carries its
  // own craft contract.
  LEGEND = [
    "LEGEND — what each part of a C-story spine means",
    "C-story = the serialized continuity spine; advances one click per episode and pays off across the arc.",
    "Generated ONCE per series, not per episode. Only three archetypes sustain an episodic A/B/C run.",
    "Question = the dramatic question the whole arc is built to answer.",
    "Stake = why the question matters; what is on the line across the series.",
    "Terminus = how the spine resolves at the end of the run (plan this before you start).",
    "Key = the signature emotional note the resolution lands on.",
    "PLANT (Ep 1) = the question surfaces.",
    "NUDGE (middle episodes) = one click of advancement, woven behind that week's A-story.",
    "TAG (final episode) = the spine resolves on the terminus.",
  ].join("\n");

  connect() {
    this.applyArchetypeDefaultEpisodes();
    this.render();
  }

  // Seed the episode count from the selected archetype's default (falling back
  // to the generator default of 6) and sync the slider + readout to it.
  applyArchetypeDefaultEpisodes() {
    const def = this.DEFAULT_EPISODES[this.archetypeValue] || this.episodesValue;
    this.episodesValue = def;
    if (this.hasEpisodesTarget) this.episodesTarget.value = def;
    if (this.hasEpisodesOutTarget) this.episodesOutTarget.textContent = def;
  }

  get isCarrying() { return !!this.ARCHETYPES[this.archetypeValue]; }

  // Roll a single series spine and distribute its clicks across the episodes.
  // Rhythm: plant in Ep 1, one nudge per middle episode, tag/terminus in Ep N.
  // Mirrors CStoryEngine.roll in the Ruby companion.
  roll() {
    if (!this.isCarrying) { this.render(); return; }
    const pool = this.ARCHETYPES[this.archetypeValue];
    const episodes = this.clampedEpisodes();

    const middle = episodes - 2; // episodes between plant and terminus
    let clicks = this.shuffle(pool.clicks.slice());
    while (clicks.length < middle) clicks = clicks.concat(clicks); // repeat to cover
    const middleClicks = clicks.slice(0, middle);

    const question = this.pick(pool.questions);
    const terminus = this.pick(pool.termini);

    const timeline = [
      { episode: 1, role: "PLANT", click: `The question surfaces: ${question}` },
    ];
    middleClicks.forEach((click, i) => {
      timeline.push({ episode: i + 2, role: "NUDGE", click });
    });
    timeline.push({ episode: episodes, role: "TAG", click: `Spine resolves: ${terminus}` });

    this.current = {
      archetypeKey: this.archetypeValue,
      question,
      stake: this.pick(pool.stakes),
      terminus,
      key: this.pick(pool.keys),
      timeline,
    };
    this.render();
  }

  setArchetype(event) { this.archetypeValue = event.params.archetype; }

  // Switching archetype rolls a fresh spine for a carrying one, or shows the
  // honest-broker note for a non-episodic one.
  archetypeValueChanged() {
    if (!this.hasArchetypePillTarget) return; // not connected yet
    this.highlightPills();
    this.applyArchetypeDefaultEpisodes();
    if (this.isCarrying) {
      this.roll();
    } else {
      this.current = null;
      this.render();
    }
  }

  episodesInput() {
    this.episodesValue = this.clampedEpisodes();
    if (this.hasEpisodesOutTarget) this.episodesOutTarget.textContent = this.episodesValue;
    if (this.current && this.isCarrying) this.roll();
  }

  clampedEpisodes() {
    const n = this.hasEpisodesTarget ? parseInt(this.episodesTarget.value, 10) : this.episodesValue;
    if (isNaN(n)) return 8;
    return Math.max(2, Math.min(24, n));
  }

  // The design note for the active archetype: the carrying ones explain how
  // their spine behaves; the non-episodic ones explain why no spine is rolled.
  get archetypeNote() {
    return this.isCarrying
      ? this.ARCHETYPES[this.archetypeValue].note
      : this.ARCHETYPE_NOTES[this.archetypeValue];
  }

  render() {
    this.highlightPills();
    if (this.hasEpisodesOutTarget) this.episodesOutTarget.textContent = this.clampedEpisodes();

    const carrying = this.isCarrying;
    // The note is always shown — it's the archetype's design comment, surfaced
    // the moment an archetype is selected.
    if (this.hasNoteTarget) {
      const label = this.ARCHETYPE_LABELS[this.archetypeValue];
      this.noteTarget.textContent = `${label}: ${this.archetypeNote}`;
    }
    if (this.hasSpineTarget) this.spineTarget.classList.toggle("hidden", !carrying || !this.current);

    if (!carrying || !this.current) return;

    const c = this.current;
    this.questionTarget.textContent = c.question;
    this.stakeTarget.textContent = c.stake;
    this.terminusTarget.textContent = c.terminus;
    this.keyTarget.textContent = c.key;
    this.renderTimeline(c.timeline);
  }

  renderTimeline(timeline) {
    if (!this.hasTimelineTarget) return;
    this.timelineTarget.innerHTML = "";
    timeline.forEach((beat) => {
      const row = document.createElement("div");
      row.className = `beat beat-${beat.role.toLowerCase()}`;
      const ep = document.createElement("span");
      ep.className = "ep";
      ep.textContent = `Ep ${beat.episode}`;
      const role = document.createElement("span");
      role.className = "role";
      role.textContent = beat.role;
      const click = document.createElement("span");
      click.className = "click";
      click.textContent = beat.click;
      row.append(ep, role, click);
      this.timelineTarget.appendChild(row);
    });
  }

  highlightPills() {
    if (!this.hasArchetypePillTarget) return;
    this.archetypePillTargets.forEach((el) =>
      el.setAttribute("aria-pressed", el.dataset.cStoryEngineArchetypeParam === this.archetypeValue));
  }

  // Copy a self-contained block: the spine, the per-episode allocation, and
  // the standing legend — so whatever is pasted elsewhere needs no inference.
  buildCopyText() {
    const label = this.ARCHETYPE_LABELS[this.archetypeValue];
    if (!this.isCarrying) {
      return [
        `C-STORY — ${label} (non-episodic)`,
        "",
        this.ARCHETYPE_NOTES[this.archetypeValue],
      ].join("\n");
    }
    if (!this.current) return "";
    const c = this.current;
    const lines = [
      `C-STORY SPINE  [${label}]`,
      `  ${label}: ${this.ARCHETYPES[this.archetypeValue].note}`,
      "",
      `  Question : ${c.question}`,
      `  Stake    : ${c.stake}`,
      `  Terminus : ${c.terminus}`,
      `  Key      : ${c.key}`,
      "",
      `  Per-episode allocation (${c.timeline.length} episodes):`,
    ];
    c.timeline.forEach((beat) => {
      const ep = String(beat.episode).padStart(2, " ");
      const role = beat.role.padEnd(6, " ");
      lines.push(`    Ep ${ep}  [${role}]  ${beat.click}`);
    });
    lines.push("", this.LEGEND);
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

  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // Fisher–Yates shuffle (matches Ruby's Array#shuffle role in the engine).
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
});
