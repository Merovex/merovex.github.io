import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = window.Stimulus || Application.start()
// Connects to data-controller="drifter-saga"
// Drifter Saga: Book Generator — a focused clone of the Episode Plot Generator,
// pinned to Season 1 (a Drifter season). The C-Spine, the Code, and the Stance
// are LOCKED reference (shown, never rolled); the Code is woven into every
// book's logline. The generator rolls only the per-book local color (Edge,
// System, Enforcer, Squeeze, Job, and the expansion skeleton), held to the
// Drifter banks. Stoddard Locke is weather here, not the per-book villain.
Stimulus.register("drifter-saga", class extends Controller {
  static targets = [
    "edge", "system", "enforcer", "squeeze", "job",
    "reversal", "oneWorthSaving", "turn", "reckoning", "disposition", "wildcard",
    "premise", "expandToggle", "copyBtn",
    "spineQuestion", "spineStake", "spineTerminus", "spineKey", "spineCode", "spineStance", "spineLocke",
  ];

  // Ethan Weldy's creed — the locked Code, woven into every book's logline.
  CODE = "a delivery is a bond worth dying for";

  // ── Local-color banks (re-rolled per book; Drifter chassis) ───────────────
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

  // The Drifter's disposition (the old PRICE): a partial, costly win, then the
  // road again. Left to vary — it lands in the Drifter key on its own.
  DISPOSITION = [
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

  LOCAL_SLOTS = [
    "edge", "system", "enforcer", "squeeze", "job",
    "reversal", "oneWorthSaving", "turn", "reckoning", "disposition", "wildcard",
  ];

  LEGEND = [
    "LEGEND — Drifter Saga, Season 1 (a Drifter season; the spine is internal)",
    "C-Spine: rolled once per season, never touched. Every book answers to it.",
    "Code (locked): the moral spine the season exists to test; every re-rolled run is a fresh trial of it.",
    "Stance (locked): the same man every book; the Terminus is this stance cracking.",
    "Local color (re-rolled per book): Edge, System, Enforcer, Squeeze, Job, Reversal, One Worth Saving, Turn, Reckoning, Disposition, Wildcard.",
    "Do NOT lock the Edge or the System — a recurring place + foe turns the Drifter into a Lawman or a Homesteader.",
    "Stoddard Locke is weather in Season 1: ambient pressure named in the C-clicks, not the per-book villain.",
  ].join("\n");

  connect() { this.roll(); }

  // Roll a fresh book's local color. The Code and Stance never roll.
  roll() {
    const banks = this.banks();
    this.current = {};
    this.LOCAL_SLOTS.forEach((slot) => { this.current[slot] = this.pick(banks[slot]); });
    this.render();
  }

  banks() {
    return {
      edge: this.EDGE, system: this.SYSTEM, enforcer: this.ENFORCER, squeeze: this.SQUEEZE, job: this.JOB,
      reversal: this.REVERSAL, oneWorthSaving: this.ONE_WORTH_SAVING, turn: this.TURN,
      reckoning: this.RECKONING, disposition: this.DISPOSITION, wildcard: this.WILDCARD,
    };
  }

  // Re-roll a single local-color slot. The triggering button names it via data-slot.
  reroll(event) {
    const slot = event.params.slot;
    const banks = this.banks();
    if (!banks[slot]) return;
    this.current[slot] = this.pick(banks[slot]);
    this[`${slot}Target`].textContent = this.current[slot];
    this.renderPremise();
  }

  toggleExpansion() { this.renderPremise(); }

  render() {
    this.LOCAL_SLOTS.forEach((slot) => {
      if (this[`has${this.cap(slot)}Target`]) this[`${slot}Target`].textContent = this.current[slot];
    });
    this.renderPremise();
  }

  // The per-book logline: the same man, the same Code, fresh local color. The
  // Stance is reference (it's the same man every book), so it isn't restated.
  renderPremise() {
    if (!this.current) return;
    const c = this.current;
    let text =
      `A run carries him to ${c.edge}, where ${c.system}, working through ${c.enforcer}, is ${c.squeeze}. ` +
      `Holding that ${this.CODE}, he takes the run: to ${c.job}.`;
    if (this.hasExpandToggleTarget && this.expandToggleTarget.checked) {
      text +=
        ` The reversal: ${c.reversal}. The one worth saving is ${c.oneWorthSaving}. ` +
        `The turn comes when ${c.turn}. Everything tightens toward the reckoning — ${c.reckoning} — ` +
        `and the disposition: ${c.disposition}. Wildcard: ${c.wildcard}.`;
    }
    this.premiseTarget.textContent = text;
  }

  buildCopyText() {
    const c = this.current;
    const expanded = this.hasExpandToggleTarget && this.expandToggleTarget.checked;
    const ref = (t) => (this[`has${this.cap(t)}Target`] ? this[`${t}Target`].textContent.trim() : "");
    const lines = [
      "DRIFTER SAGA — SEASON 1, BOOK PREMISE",
      this.premiseTarget.textContent,
      "",
      "LOCKED SPINE (rolled once per season, never touched)",
      "Archetype: Drifter",
      `Question: ${ref("spineQuestion")}`,
      `Stake: ${ref("spineStake")}`,
      `Terminus: ${ref("spineTerminus")}`,
      `Key: ${ref("spineKey")}`,
      `Code: ${ref("spineCode")}`,
      `Stance: ${ref("spineStance")}`,
      `Standing antagonist: ${ref("spineLocke")}`,
      "",
      "THIS BOOK (local color, re-rolled per book)",
      `Edge: ${c.edge}`,
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
      "",
      `Skeleton woven into premise: ${expanded ? "yes" : "no"}`,
      "",
      this.LEGEND,
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

  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
});
