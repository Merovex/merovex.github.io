import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
// Reuse the page's Stimulus application if one already exists (the UWP
// translator on the same page starts it), otherwise start our own.
const application = window.Stimulus || (window.Stimulus = Application.start())

// Connects to data-controller="ix-translator"
application.register("ix-translator", class extends Controller {
  static targets = ["ix", "code", "output"];

  connect() {
    console.log("connected ix-translator")
    this.translate();
  }

  translate() {
    // The Importance Extension is a signed integer, usually written in
    // braces (e.g. "{ 2 }"). Pull the first signed number out of the field.
    let match = this.ixTarget.value.match(/-?\d+/);
    if (!match) {
      this.codeTarget.textContent = "";
      this.outputTarget.innerHTML = "Enter an Importance value, for example <code>{ 2 }</code>.";
      return;
    }

    let value = parseInt(match[0], 10);
    let signed = (value >= 0 ? "+" : "") + value;
    this.codeTarget.textContent = `{ ${signed} }`;
    this.outputTarget.innerHTML =
      `The main world carries an Importance Extension of <strong>${signed}</strong>, ` +
      `which marks it as ${this.describe(value)} ${this.factors}`;
  }

  describe(value) {
    if (value >= 4) return "<strong>an exceptionally important world</strong> &mdash; a major hub that anchors trade routes and political influence across its region.";
    if (value === 3) return "<strong>a very important world</strong>, a significant center of trade and influence within its subsector.";
    if (value === 2) return "<strong>an important world</strong>, a notable center of commerce and influence among its neighbors.";
    if (value === 1) return "<strong>a moderately important world</strong> that exerts some influence over nearby systems.";
    if (value === 0) return "<strong>an ordinary world</strong> of average importance to its neighbors.";
    if (value === -1) return "<strong>an unimportant world</strong>, a minor backwater with little regional influence.";
    return "<strong>a thoroughly unimportant world</strong>, an isolated backwater of negligible regional influence.";
  }

  get factors() {
    return "Importance is derived from the main world's starport quality, technology level, population, and key trade classifications (Agricultural, Rich, Industrial, and High Population). See the <a href='https://wiki.travellerrpg.com/Importance_Extension'>Importance Extension</a> for the full calculation.";
  }
});
