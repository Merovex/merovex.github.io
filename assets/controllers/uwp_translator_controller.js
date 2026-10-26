import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
import { RULESETS, savedRuleset, saveRuleset, sizeFor } from "/assets/js/traveller_worlds.js"
window.Stimulus = Application.start()

// UWP tables per ruleset. Each field has a shared base table; a ruleset lists only
// the codes it changes (or a whole replacement table). Sources: Classic Traveller
// Book 3; Mongoose Traveller 2e Core; Traveller5 Book 3 (pp. 24–25); Cepheus Engine
// SRD (Worlds). Codes missing from a ruleset's table read as "not defined".
const PORTS = {
  A: ["Excellent", "refined fuel, overhauls, and a shipyard that builds starships"],
  B: ["Good", "refined fuel, overhauls, and a shipyard that builds spacecraft"],
  C: ["Routine", "unrefined fuel and reasonable repairs"],
  D: ["Poor", "unrefined fuel and limited repairs"],
  E: ["Frontier", "a marked landing site with no fuel or repairs"],
  X: ["no", "nothing at all"],
}

const ATMOSPHERE = {
  0: ["Vacuum", "a vacc suit"],
  1: ["Trace", "a vacc suit"],
  2: ["Very thin, tainted", "a respirator and filter"],
  3: ["Very thin", "a respirator"],
  4: ["Thin, tainted", "a filter mask"],
  5: ["Thin", null],
  6: ["Standard", null],
  7: ["Standard, tainted", "a filter mask"],
  8: ["Dense", null],
  9: ["Dense, tainted", "a filter mask"],
  A: ["Exotic", "an air supply"],
  B: ["Corrosive", "a vacc suit"],
  C: ["Insidious", "a vacc suit, which it defeats within hours"],
}

// Atmosphere entries are [name, gear needed] or [name, null, "where it is breathable"].

// Hydrographics in tenths (Classic, T5) or in the Mongoose/Cepheus percentage bands.
const HYDRO_TENTHS = {
  0: ["0%", "a desert world"], 1: ["10%", "a dry world"], 2: ["20%", "a dry world"],
  3: ["30%", "a wet world"], 4: ["40%", "a wet world"], 5: ["50%", "a wet world"],
  6: ["60%", "a wet world"], 7: ["70%", "a wet world"], 8: ["80%", "a wet world"],
  9: ["90%", "a wet world"], A: ["100%", "a water world"],
}
const HYDRO_BANDS = {
  0: ["0–5%", "a desert world"], 1: ["6–15%", "a dry world"], 2: ["16–25%", "a world of a few small seas"],
  3: ["26–35%", "a world of small seas and oceans"], 4: ["36–45%", "a wet world"],
  5: ["46–55%", "a world of large oceans"], 6: ["56–65%", "a wet world"], 7: ["66–75%", "an Earth-like world"],
  8: ["76–85%", "a water world"], 9: ["86–95%", "a world of only a few small islands"],
  A: ["96–100%", "a world almost entirely of water"],
}

const POPULATION = {
  0: ["no", "none"], 1: ["a tiny", "tens of"], 2: ["a tiny", "hundreds of"], 3: ["a small", "thousands of"],
  4: ["a small", "tens of thousands of"], 5: ["a moderate", "hundreds of thousands of"],
  6: ["a moderate", "millions of"], 7: ["a large", "tens of millions of"], 8: ["a large", "hundreds of millions of"],
  9: ["a huge", "billions of"], A: ["a huge", "tens of billions of"],
}
const POPULATION_T5 = {
  B: ["a vast", "hundreds of billions of"], C: ["a vast", "trillions of"], D: ["a vast", "tens of trillions of"],
  E: ["a vast", "hundreds of trillions of"], F: ["a vast", "quadrillions of"],
}

const GOVERNMENT = {
  0: "No Government Structure", 1: "Company/Corporation", 2: "Participating Democracy",
  3: "Self-Perpetuating Oligarchy", 4: "Representative Democracy", 5: "Feudal Technocracy",
  6: "Captive Government/Colony", 7: "Balkanization", 8: "Civil Service Bureaucracy",
  9: "Impersonal Bureaucracy", A: "Charismatic Dictatorship", B: "Non-Charismatic Leadership",
  C: "Charismatic Oligarchy", D: "Religious Dictatorship", E: "Religious Autocracy",
  F: "Totalitarian Oligarchy",
}

// Law: [level, what it prohibits].
const LAW_CLASSIC = {
  0: ["No Law", "nothing"], 1: ["Low Law", "body pistols, explosives and poison gas"],
  2: ["Low Law", "portable energy weapons"], 3: ["Low Law", "machine guns and automatic rifles"],
  4: ["Moderate Law", "light assault weapons"], 5: ["Moderate Law", "personal concealable firearms"],
  6: ["Moderate Law", "all firearms except shotguns"], 7: ["High Law", "shotguns"],
  8: ["High Law", "open possession of long bladed weapons"], 9: ["High Law", "any weapon outside the home"],
}
const LAW_MONGOOSE = {
  0: ["No Law", "nothing"], 1: ["Low Law", "poison gas, explosives, undetectable weapons and weapons of mass destruction"],
  2: ["Low Law", "portable energy and laser weapons"], 3: ["Low Law", "military weapons"],
  4: ["Moderate Law", "light assault weapons and submachine guns"], 5: ["Moderate Law", "personal concealable weapons"],
  6: ["Moderate Law", "all firearms except shotguns and stunners"], 7: ["High Law", "shotguns"],
  8: ["High Law", "all bladed weapons and stunners"], 9: ["Extreme Law", "all weapons"],
}
const LAW_CEPHEUS = {
  0: ["No Law", "nothing"], 1: ["Low Law", "poison gas, explosives, undetectable weapons and weapons of mass destruction"],
  2: ["Low Law", "portable energy weapons"], 3: ["Low Law", "heavy weapons"],
  4: ["Medium Law", "light assault weapons and submachine guns"], 5: ["Medium Law", "personal concealable weapons"],
  6: ["Medium Law", "all firearms except shotguns and stunners"], 7: ["High Law", "shotguns"],
  8: ["High Law", "all bladed weapons and stunners"], 9: ["High Law", "any weapon outside the residence"],
  A: ["Extreme Law", "all weapons"],
}
const LAW_T5 = {
  0: ["No Law", "nothing"], 1: ["Low Law", "weapons of mass destruction and psi weapons"],
  2: ["Low Law", "“portable” weapons"], 3: ["Low Law", "acid, fire and gas weapons"],
  4: ["Moderate Law", "laser and beam weapons"], 5: ["Moderate Law", "shock, EMP, rad, mag and grav weapons"],
  6: ["Moderate Law", "machine guns"], 7: ["Moderate Law", "pistols"],
  8: ["High Law", "the open display of weapons"], 9: ["High Law", "any weapon outside the home"],
  A: ["Extreme Law", "all weapons"], B: ["Extreme Law", "travel without continental passports"],
  C: ["Extreme Law", "privacy, invaded without restriction"], D: ["Extreme Law", "civil life under paramilitary police"],
  E: ["Extreme Law", "civil life in a full police state"], F: ["Extreme Law", "daily life outside rigid control"],
  G: ["Extreme Law", "minor offenses, punished disproportionately"], H: ["Extreme Law", "dissent, under legalized oppression"],
  J: ["Extreme Law", "dissent, under routine oppression"],
}

const RULES = {
  classic: {
    port: PORTS,
    atmos: { ...ATMOSPHERE, D: ["Dense, high", null, "at high altitude"], E: ["Ellipsoid", null, "in some latitude bands"], F: ["Thin, low", null, "in the lowlands"] },
    hydro: HYDRO_TENTHS, popx: POPULATION,
    govt: Object.fromEntries(Object.entries(GOVERNMENT).filter(([k]) => !"EF".includes(k))),
    law: LAW_CLASSIC,
  },
  mongoose: {
    port: { ...PORTS, C: ["Routine", "unrefined fuel, repairs and a shipyard for small craft"] },
    atmos: { ...ATMOSPHERE, D: ["Very dense", null, "at high altitude"], E: ["Low", null, "in the deepest lowlands"], F: ["Unusual", "gear that varies with conditions"] },
    hydro: HYDRO_BANDS, popx: POPULATION, govt: GOVERNMENT, law: LAW_MONGOOSE,
  },
  t5: {
    port: {
      ...PORTS,
      A: ["Excellent", "refined fuel, overhauls, and yards that build starships"],
      B: ["Good", "refined fuel, overhauls, and yards that build spacecraft"],
      C: ["Routine", "unrefined fuel and major repairs"],
      D: ["Poor", "unrefined fuel and minor repairs"],
      E: ["Frontier", "a beacon, with no fuel or repairs"],
      F: ["Good spaceport", "unrefined fuel and minor repairs"],
      G: ["Poor spaceport", "unrefined fuel and slight repairs"],
      H: ["Basic spaceport", "a beacon, with no fuel or repairs"],
      Y: ["no", "nothing at all"],
    },
    atmos: { ...ATMOSPHERE, D: ["Dense, high", null, "at high altitude"], E: ["Thin, low", null, "in the lowlands"], F: ["Unusual", "gear that varies with conditions"] },
    hydro: HYDRO_TENTHS, popx: { ...POPULATION, ...POPULATION_T5 }, govt: GOVERNMENT, law: LAW_T5,
  },
  cepheus: {
    port: { ...PORTS, C: ["Routine", "unrefined fuel and reasonable repairs"], D: ["Poor", "unrefined fuel and no shipyard"] },
    atmos: { ...ATMOSPHERE, D: ["Dense, high", null, "at high altitude"], E: ["Thin, low", null, "in the lowlands"], F: ["Unusual", "gear that varies with conditions"] },
    hydro: HYDRO_BANDS, popx: POPULATION, govt: GOVERNMENT, law: LAW_CEPHEUS,
  },
}

const TECH = {
  0: "Stone Age (fire)", 1: "Pre-Industrial (3500 BC–600 AD)", 2: "Age of Sail (c. 1450 AD)",
  3: "Industrial Revolution (c. 1730 AD)", 4: "Mechanized Age (c. 1880 AD)", 5: "Broadcast Age (c. 1910 AD)",
  6: "Nuclear Age (c. 1940 AD)", 7: "Digital precursor (c. 1970 AD)", 8: "Digital Age (c. 1990 AD)",
  9: "Early Stellar (c. 2050 AD)", A: "Early Stellar (c. 2120 AD)", B: "Average Stellar",
  C: "Average Imperial", D: "Average Stellar", E: "High Stellar", F: "Imperial Maximum",
}

// Trade classifications per ruleset: each lists the digits allowed for the
// characteristics it tests (port, siz, atm, hyd, pop, gov, law, tl). Climate and
// referee-assigned codes (T5 Tr, Tu, Px, capitals...) need more than a UWP.
const ANY_POP = "123456789ABCDEF"
const T = (code, name, rules) => ({ code, name, ...rules })
const TRADE_CLASSIC = [
  T("Ag", "Agricultural", { atm: "456789", hyd: "45678", pop: "567" }),
  T("Na", "Non-agricultural", { atm: "0123", hyd: "0123", pop: "6789A" }),
  T("In", "Industrial", { atm: "012479", pop: "9A" }),
  T("Ni", "Non-industrial", { pop: "0123456" }),
  T("Ri", "Rich", { atm: "68", pop: "678", gov: "456789" }),
  T("Po", "Poor", { atm: "2345", hyd: "0123" }),
]
const TRADE_CEPHEUS = [
  T("Ag", "Agricultural", { atm: "456789", hyd: "45678", pop: "567" }),
  T("As", "Asteroid", { siz: "0", atm: "0", hyd: "0" }),
  T("Ba", "Barren", { pop: "0", gov: "0", law: "0" }),
  T("De", "Desert", { atm: "23456789ABCDEF", hyd: "0" }),
  T("Fl", "Fluid oceans", { atm: "ABCDEF", hyd: "123456789A" }),
  T("Ga", "Garden", { atm: "568", hyd: "456789", pop: "45678" }),
  T("Hi", "High population", { pop: "9ABCDEF" }),
  T("Ht", "High technology", { tl: "CDEFGHJKL" }),
  T("Ic", "Ice-capped", { atm: "01", hyd: "123456789A" }),
  T("In", "Industrial", { atm: "012479", pop: "9ABCDEF" }),
  T("Lo", "Low population", { pop: "123" }),
  T("Lt", "Low technology", { tl: "012345" }),
  T("Na", "Non-agricultural", { atm: "0123", hyd: "0123", pop: "6789ABCDEF" }),
  T("Ni", "Non-industrial", { pop: "456" }),
  T("Po", "Poor", { atm: "2345", hyd: "0123" }),
  T("Ri", "Rich", { atm: "68", pop: "678" }),
  T("Wa", "Water world", { hyd: "A" }),
  T("Va", "Vacuum", { atm: "0" }),
]
const TRADE_MONGOOSE = TRADE_CEPHEUS.map(t => ({
  Ga: T("Ga", "Garden", { siz: "678", atm: "568", hyd: "567" }),
  De: T("De", "Desert", { atm: "23456789", hyd: "0" }),
  In: T("In", "Industrial", { atm: "012479ABC", pop: "9ABCDEF" }),
  Lt: T("Lt", "Low technology", { pop: ANY_POP, tl: "012345" }),
  Ri: T("Ri", "Rich", { atm: "68", pop: "678", gov: "456789" }),
  Wa: T("Wa", "Water world", { atm: "3456789DEF", hyd: "A" }),
}[t.code] || t))
const TRADE_T5 = [
  T("As", "Asteroid belt", { siz: "0", atm: "0", hyd: "0" }),
  T("De", "Desert", { atm: "23456789", hyd: "0" }),
  T("Fl", "Fluid", { atm: "ABC", hyd: "123456789A" }),
  T("Ga", "Garden world", { siz: "678", atm: "568", hyd: "567" }),
  T("He", "Hellworld", { siz: "3456789ABC", atm: "2479ABC", hyd: "012" }),
  T("Ic", "Ice-capped", { atm: "01", hyd: "123456789A" }),
  T("Oc", "Ocean world", { siz: "ABCDEF", atm: "3456789DEF", hyd: "A" }),
  T("Va", "Vacuum", { atm: "0" }),
  T("Wa", "Water world", { siz: "3456789", atm: "3456789DEF", hyd: "A" }),
  T("Di", "Dieback", { pop: "0", gov: "0", law: "0", tl: "123456789ABCDEFGHJKL" }),
  T("Ba", "Barren", { pop: "0", gov: "0", law: "0", tl: "0" }),
  T("Lo", "Low population", { pop: "123" }),
  T("Ni", "Non-industrial", { pop: "456" }),
  T("Ph", "Pre-high population", { pop: "8" }),
  T("Hi", "High population", { pop: "9ABCDEF" }),
  T("Pa", "Pre-agricultural", { atm: "456789", hyd: "45678", pop: "48" }),
  T("Ag", "Agricultural", { atm: "456789", hyd: "45678", pop: "567" }),
  T("Na", "Non-agricultural", { atm: "0123", hyd: "0123", pop: "6789ABCDEF" }),
  T("Pi", "Pre-industrial", { atm: "012479", pop: "78" }),
  T("In", "Industrial", { atm: "012479ABC", pop: "9ABCDEF" }),
  T("Po", "Poor", { atm: "2345", hyd: "0123" }),
  T("Pr", "Pre-rich", { atm: "68", pop: "59" }),
  T("Ri", "Rich", { atm: "68", pop: "678" }),
]
const TRADE = { classic: TRADE_CLASSIC, mongoose: TRADE_MONGOOSE, t5: TRADE_T5, cepheus: TRADE_CEPHEUS }

// UWP digits are extended hex (I and O are skipped).
const EHEX = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"
const ehex = c => EHEX.indexOf(c)

// T5 Importance (Book 3, Ix table): the UWP part, without bases.
function importanceFromUWP(port, pop, tl, codes) {
  var ix = 0;
  if ("AB".includes(port)) ix += 1;
  if ("DEX".includes(port)) ix -= 1;
  if (ehex(tl) >= 16) ix += 1;
  if (ehex(tl) >= 10) ix += 1;
  if (ehex(tl) <= 8) ix -= 1;
  ix += codes.filter(c => ["Ag", "Hi", "In", "Ri"].includes(c)).length;
  if (ehex(pop) <= 6) ix -= 1;
  return ix;
}

function describeImportance(ix) {
  if (ix >= 5) return ["a highly Important world", "a likely sector capital, anchoring trade routes across its region."];
  if (ix === 4) return ["an Important world", "a likely subsector capital, linked to its peers by established trade routes of Jump-4 or less."];
  if (ix === 3) return ["a notable world", "a significant center of trade, just short of Important."];
  if (ix === 2) return ["an ordinary world", "a modest center of commerce and influence among its neighbors."];
  if (ix === 1) return ["an ordinary world", "with some influence over nearby systems."];
  if (ix >= -1) return ["an Unimportant world", "of little weight beyond its own system."];
  return ["a thoroughly Unimportant world", "an isolated backwater of negligible regional influence."];
}

const KEYS = ["port", "size", "atmos", "hydro", "popx", "govt", "law", "tech"]
const NAMES = {
  port: "Starport", size: "Size", atmos: "Atmosphere", hydro: "Hydrographics",
  popx: "Population", govt: "Government", law: "Law Level", tech: "Tech Level",
}

// Connects to data-controller="uwp-translator"
Stimulus.register("uwp-translator", class extends Controller {
  static targets = ["name", "uwp", "ruleset", "rulesetNote", "heading", "chips", "tiles", "prose",
    "ix", "ixScale", "ixText", "ixNote"]

  connect() {
    this.rulesetTarget.innerHTML = Object.entries(RULESETS)
      .map(([key, r]) => "<option value='" + key + "'>" + r.name + "</option>").join("");
    this.rulesetTarget.value = savedRuleset();
    this.ixEdited = false;
    // Tapped tooltips stay open until a tap lands outside a tile, or Escape.
    this.closeOnOutside = event => { if (!event.target.closest(".tile")) this.closeTips() };
    this.closeOnEscape = event => { if (event.key === "Escape") this.closeTips() };
    document.addEventListener("click", this.closeOnOutside);
    document.addEventListener("keydown", this.closeOnEscape);
    this.translate();
  }

  disconnect() {
    document.removeEventListener("click", this.closeOnOutside);
    document.removeEventListener("keydown", this.closeOnEscape);
  }

  // =================================================================================================
  // Tooltips: hover and focus are CSS; a tap toggles .open. Either way the tooltip is
  // shifted sideways so it fits the viewport, whatever the tile's position in the grid.
  toggleTip(event) {
    var tile = event.currentTarget;
    var wasOpen = tile.classList.contains("open");
    this.closeTips();
    if (!wasOpen) { tile.classList.add("open"); this.placeTip(event) }
  }
  closeTips() { this.tilesTarget.querySelectorAll(".tile.open").forEach(t => t.classList.remove("open")) }
  placeTip(event) {
    var tile = event.currentTarget, tip = tile.querySelector(".tip");
    var margin = 16, viewport = document.documentElement.clientWidth;
    var left = tile.getBoundingClientRect().left, width = tip.offsetWidth || Math.min(260, viewport - 2 * margin);
    var shift = Math.min(0, viewport - margin - (left + width));
    shift = Math.max(shift, margin - left);
    tip.style.left = shift + "px";
  }

  changeRuleset() {
    saveRuleset(this.rulesetTarget.value);
    this.translate();
  }

  // =================================================================================================
  // Lookups
  lookup(key, value) {
    if (key === "tech") return TECH[value] !== undefined ? TECH[value] : (ehex(value) > 15 ? "Beyond Imperial maximum" : undefined);
    if (key === "size") return sizeFor(this.rulesetTarget.value, value) || undefined;
    return RULES[this.rulesetTarget.value][key][value];
  }

  tradeCodes(d) {
    var fields = { port: d[0], siz: d[1], atm: d[2], hyd: d[3], pop: d[4], gov: d[5], law: d[6], tl: d[7] };
    return TRADE[this.rulesetTarget.value].filter(t =>
      Object.keys(fields).every(k => !t[k] || t[k].includes(fields[k])));
  }

  sizeClass(size) {
    if (size.kind === "gas giant") return "a gas giant";
    if (size.code === "0") return "an asteroid belt";
    var n = parseInt(size.code, 16);
    if (n <= 3) return "a small world";
    if (n <= 6) return "a medium world";
    if (n <= 9) return "a large world";
    return "a huge world";
  }

  // Tile label: the short reading shown under each code.
  tileFor(key, value, d) {
    switch (key) {
      case "port":  return value === "X" || value === "Y" ? "None" : d[0];
      case "size":  return d.code === "0" ? "Asteroid belt" : d.diameter.toLocaleString("en-US") + " km";
      case "atmos": return d[0];
      case "hydro": return d[0] + " water";
      case "popx":  return value === "0" ? "None" : d[1].replace(/ of$/, "");
      case "govt":  return d;
      case "law":   return d[0];
      default:      return "TL " + ehex(value);
    }
  }

  // Tooltip: the full definition.
  definitionFor(key, value, d) {
    switch (key) {
      case "port":  return `${d[0]} &mdash; ${d[1]}`;
      case "size":  return d.code === "0" ? "Asteroid belt"
        : `${d.diameter.toLocaleString("en-US")} km${d.gravity ? `, ${d.gravity} G` : ""}${d.beyondTable ? " (extrapolated)" : ""}`;
      case "atmos": return d[1] ? `${d[0]} &mdash; ${d[1]}` : `${d[0]} &mdash; breathable${d[2] ? ` only ${d[2]}` : ""}`;
      case "hydro": return `${d[0]} water, ${d[1]}`;
      case "popx":  return value === "0" ? "Unpopulated" : `${d[1]} inhabitants`;
      case "govt":  return d;
      case "law":   return `${d[0]} &mdash; prohibits ${d[1]}`;
      default:      return `TL ${ehex(value)} &middot; ${d}`;
    }
  }

  // One sentence per characteristic for the plain-English paragraph.
  sentenceFor(key, value, d) {
    switch (key) {
      case "port":
        return value === "X" || value === "Y"
          ? "It has <strong>no</strong> starport."
          : `Its <strong>${d[0]}</strong> ${/spaceport/.test(d[0]) ? "" : "starport "}offers ${d[1]}.`;
      case "size":
        return d.code === "0"
          ? "The main world is <strong>an asteroid belt</strong>."
          : `The main world is <strong>${this.sizeClass(d)}</strong>, roughly ${d.diameter.toLocaleString("en-US")} km across` +
            (d.gravity ? `, with ${d.gravity} G gravity.` : ".");
      case "atmos":
        if (d[1]) return `The atmosphere is <strong>${d[0].toLowerCase()}</strong>, requiring ${d[1]}.`;
        return d[2]
          ? `The <strong>${d[0].toLowerCase()}</strong> atmosphere is breathable only ${d[2]}.`
          : `The <strong>${d[0].toLowerCase()}</strong> atmosphere is breathable without aid.`;
      case "hydro": return `Its surface is <strong>${d[0]}</strong> water, ${d[1]}.`;
      case "popx":
        return value === "0" ? "It is <strong>unpopulated</strong>."
          : `It holds <strong>${d[0]}</strong> population of ${d[1]} residents.`;
      case "govt": return `Government: <strong>${d}</strong>.`;
      case "law":
        return value === "0" ? "There is <strong>no law</strong>; nothing is prohibited."
          : `Law is <strong>${d[0].replace(/ Law$/, "").toLowerCase()}</strong>, prohibiting ${d[1]}.`;
      default: return `Technology is <strong>${d}</strong> (TL ${ehex(value)}).`;
    }
  }

  // =================================================================================================
  // Render
  translate() {
    var raw = this.uwpTarget.value.toUpperCase().replace(/\s+/g, "");
    var digits = raw.replace(/-/g, "").split("");
    var rules = RULESETS[this.rulesetTarget.value].name;
    var name = this.nameTarget.value.trim();

    if (digits.length !== KEYS.length) {
      this.rulesetNoteTarget.textContent = "A UWP has eight characters, such as B937411-B.";
      return;
    }
    var code = digits.slice(0, 7).join("") + "-" + digits[7];
    var entries = KEYS.map((key, i) => ({ key, value: digits[i], d: this.lookup(key, digits[i]) }));
    var missing = entries.filter(e => e.d === undefined);
    this.rulesetNoteTarget.textContent = missing.length
      ? `${rules} doesn't define ${missing.map(e => `${NAMES[e.key].toLowerCase()} ${e.value}`).join(", ")}.`
      : `Read under ${rules} rules.`;

    // Heading and trade codes.
    this.headingTarget.textContent = name ? `${name} · ${code}` : code;
    var codes = this.tradeCodes(digits);
    this.chipsTarget.innerHTML = codes.length
      ? codes.map(t => `<span class="chip-tc" title="${t.name}"><b>${t.code}</b>${t.name}</span>`).join("")
      : `<span class="faint">No trade classifications</span>`;

    // Code tiles with their full definitions.
    this.tilesTarget.innerHTML = entries.map(({ key, value, d }, i) => {
      var tipId = `uwp-tip-${key}`;
      var label = d === undefined ? "Not defined" : this.tileFor(key, value, d);
      var tip = d === undefined ? `${rules} has no ${NAMES[key].toLowerCase()} ${value}.` : this.definitionFor(key, value, d);
      return `<div class="tile${d === undefined ? " undefined" : ""}" tabindex="0" aria-describedby="${tipId}"
        data-action="click->uwp-translator#toggleTip mouseenter->uwp-translator#placeTip focus->uwp-translator#placeTip">
        <span class="code">${value}</span>
        <span class="label">${NAMES[key]}</span>
        <span class="reading">${label}</span>
        <span class="tip" role="tooltip" id="${tipId}"><span class="tip-head">${NAMES[key]} ${value}</span>${tip}</span>
      </div>`;
    }).join("");

    // Plain English.
    this.proseTarget.innerHTML = entries.filter(e => e.d !== undefined)
      .map(({ key, value, d }) => this.sentenceFor(key, value, d)).join(" ");

    // Importance: what the UWP alone gives, unless the reader has set a value.
    this.uwpIx = importanceFromUWP(digits[0], digits[4], digits[7], codes.map(t => t.code));
    if (!this.ixEdited) this.ixTarget.value = this.formatIx(this.uwpIx);
    this.renderImportance();
  }

  formatIx(n) { return `{ ${n >= 0 ? "+" : ""}${n} }` }
  readIx() {
    var m = this.ixTarget.value.match(/[-−]?\d+/);
    return m ? parseInt(m[0].replace("−", "-"), 10) : null;
  }

  editIx() { this.ixEdited = true; this.renderImportance() }
  stepIx(event) {
    var n = this.readIx();
    n = (n === null ? this.uwpIx : n) + parseInt(event.currentTarget.dataset.step, 10);
    this.ixTarget.value = this.formatIx(n);
    this.editIx();
  }
  resetIx() { this.ixEdited = false; this.ixTarget.value = this.formatIx(this.uwpIx); this.renderImportance() }

  renderImportance() {
    var ix = this.readIx();
    this.ixScaleTarget.innerHTML = [-3, -2, -1, 0, 1, 2, 3, 4, 5].map(n => {
      var cls = ["cell"];
      if (n === ix || (n === 5 && ix > 5) || (n === -3 && ix < -3)) cls.push("current");
      if (n === this.uwpIx) cls.push("computed");
      return `<span class="${cls.join(" ")}">${n > 0 ? "+" : ""}${n}</span>`;
    }).join("");
    if (ix === null) {
      this.ixTextTarget.innerHTML = "Enter an Importance value, such as <code>{ +2 }</code>.";
    } else {
      var [label, rest] = describeImportance(ix);
      this.ixTextTarget.innerHTML = `An Importance of ${ix >= 0 ? "+" : ""}${ix} marks this as <strong>${label}</strong>, ${rest}`;
    }
    var signed = `${this.uwpIx >= 0 ? "+" : ""}${this.uwpIx}`;
    this.ixNoteTarget.innerHTML = `From the UWP alone, Ix works out to ${signed} (dashed cell)` +
      (this.ixEdited && ix !== this.uwpIx ? ` <button type="button" class="link" data-action="uwp-translator#resetIx">Use ${signed}</button>` : "") +
      `. Bases aren't in the UWP: add +1 for a naval and a scout base, and +1 for a way station. See the ` +
      `<a href="https://wiki.travellerrpg.com/Importance_Extension">Importance Extension</a>.`;
  }
});
