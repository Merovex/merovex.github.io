import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = window.Stimulus || Application.start()
// Connects to data-controller="trope-stack"
// The Trope Stack: one trope per role (hero, conflict, world, theme), drawn from
// the tropes that fit the chosen subgenre. The data lives in _data/tropes/*.json
// and is inlined into the page as a JSON script tag (the "data" target).
// Each pick is weighted random with weight = w; every w ships as 1, so all
// tropes are equally likely until someone tunes them.
Stimulus.register("trope-stack", class extends Controller {
  static targets = ["data", "subPill", "summary", "copyBtn", "row", "name", "desc", "lockBtn"];
  static values = { sub: { type: String, default: "any" } };

  ROLES = ["hero", "conflict", "world", "theme"];
  LABELS = { hero: "Protagonist", conflict: "Conflict", world: "Setting", theme: "Theme" };

  current = {};
  locked = new Set();

  connect() {
    this.deck = JSON.parse(this.dataTarget.textContent);
    this.roll();
  }

  subValueChanged() {
    this.subPillTargets.forEach((pill) => {
      pill.setAttribute("aria-pressed", pill.dataset.tropeStackSubParam === this.subValue ? "true" : "false");
    });
  }

  setSub(event) {
    this.subValue = event.params.sub;
    // A locked trope may not fit the new subgenre; keep it anyway. The writer locked it on purpose.
    this.roll();
  }

  pool(role) {
    return this.deck.tropes.filter((t) =>
      t.role === role && (this.subValue === "any" || t.subs.includes(this.subValue)));
  }

  pick(role, avoid) {
    let list = this.pool(role);
    // Reroll should change the trope when there is anything else to change it to.
    if (avoid && list.length > 1) list = list.filter((t) => t.n !== avoid.n);
    const total = list.reduce((sum, t) => sum + (t.w ?? 1), 0);
    let r = Math.random() * total;
    for (const t of list) {
      r -= t.w ?? 1;
      if (r < 0) return t;
    }
    return list[list.length - 1];
  }

  roll() {
    this.ROLES.forEach((role) => {
      if (!this.locked.has(role)) this.current[role] = this.pick(role);
    });
    this.render();
  }

  reroll(event) {
    const role = event.params.role;
    if (this.locked.has(role)) return;
    this.current[role] = this.pick(role, this.current[role]);
    this.render();
  }

  toggleLock(event) {
    const role = event.params.role;
    if (this.locked.has(role)) this.locked.delete(role);
    else this.locked.add(role);
    this.render();
  }

  render() {
    this.ROLES.forEach((role, i) => {
      const t = this.current[role];
      const held = this.locked.has(role);
      this.nameTargets[i].textContent = t ? t.n : "—";
      this.descTargets[i].textContent = t ? t.d : "";
      this.rowTargets[i].classList.toggle("locked", held);
      this.lockBtnTargets[i].setAttribute("aria-pressed", held ? "true" : "false");
      this.lockBtnTargets[i].textContent = held ? "🔒" : "🔓";
    });
    this.summaryTarget.textContent = this.ROLES.map((r) => this.current[r]?.n).filter(Boolean).join(" · ");
  }

  buildCopyText() {
    const sub = this.subValue === "any" ? "Any subgenre" : this.deck.subgenres[this.subValue];
    const lines = [`${this.deck.genre} — ${sub}`, ""];
    this.ROLES.forEach((role) => {
      const t = this.current[role];
      if (t) lines.push(`${this.LABELS[role]}: ${t.n} — ${t.d}`);
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
});
