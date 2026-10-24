import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = window.Stimulus || Application.start()
// Connects to data-controller="pen-name"
// SF/F pen names: first + last, or two initials + last, from the chosen style.
// The data lives in _data/pen_names.json and is inlined as a JSON script tag.
// Surnames on the blocked list are skipped so a name can't collide with a
// well-known SF/F author, even if someone later adds one to a style's list.
Stimulus.register("pen-name", class extends Controller {
  static targets = ["data", "stylePill", "formPill", "list"];
  static values = {
    style: { type: String, default: "golden" },
    form: { type: String, default: "any" },
  };

  COUNT = 8;

  connect() {
    this.deck = JSON.parse(this.dataTarget.textContent);
    this.blocked = new Set(this.deck.blocked_surnames.map((s) => s.toLowerCase()));
    this.roll();
  }

  styleValueChanged() { this.press(this.stylePillTargets, "penNameStyleParam", this.styleValue); }
  formValueChanged() { this.press(this.formPillTargets, "penNameFormParam", this.formValue); }

  press(pills, key, value) {
    pills.forEach((pill) => pill.setAttribute("aria-pressed", pill.dataset[key] === value ? "true" : "false"));
  }

  setStyle(event) { this.styleValue = event.params.style; this.roll(); }
  setForm(event) { this.formValue = event.params.form; this.roll(); }

  sample(list) { return list[Math.floor(Math.random() * list.length)]; }

  initial() { return this.sample("ABCDEFGHJKLMNPRSTW".split("")) + "."; }

  one(style) {
    const last = this.sample(style.l.filter((l) => !this.blocked.has(l.toLowerCase())));
    const form = this.formValue === "any" ? this.sample(["f", "m", "initials"]) : this.formValue;
    if (form === "initials") return `${this.initial()} ${this.initial()} ${last}`;
    return `${this.sample(style[form])} ${last}`;
  }

  roll() {
    const style = this.deck.styles[this.styleValue];
    const names = new Set();
    // Each style has 16 × 16 combinations per gender, so 8 unique names come quickly;
    // the attempt cap only guards against someone shrinking the lists to almost nothing.
    for (let tries = 0; names.size < this.COUNT && tries < 200; tries++) names.add(this.one(style));
    this.listTarget.replaceChildren(...[...names].map((name) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "name";
      btn.title = "Copy to clipboard";
      btn.textContent = name;
      btn.dataset.action = "click->pen-name#copy";
      li.appendChild(btn);
      return li;
    }));
  }

  copy(event) {
    const btn = event.currentTarget;
    const name = btn.textContent;
    const done = () => {
      btn.classList.add("copied");
      setTimeout(() => btn.classList.remove("copied"), 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(name).then(done).catch(() => this.fallbackCopy(name, done));
    } else {
      this.fallbackCopy(name, done);
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
