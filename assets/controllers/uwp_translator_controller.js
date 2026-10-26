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

// Connects to data-controller="uwp-translator"
Stimulus.register("uwp-translator", class extends Controller {
  static targets = ["name", "uwp", "code", "output", "list", "ruleset", "rulesetNote",
    "port", "size", "atmos", "popx", "hydro", "govt", "law", "tech",
  ];

  // Display order and labels for the UWP fields (standard SAEHPGLT order).
  static keys = ["port", "size", "atmos", "hydro", "popx", "govt", "law", "tech"];
  static names = {
    port: "Starport", size: "Size", atmos: "Atmosphere", hydro: "Hydrographics",
    popx: "Population", govt: "Government", law: "Law Level", tech: "Tech Level",
  };

  connect() {
    this.rulesetTarget.innerHTML = Object.entries(RULESETS)
      .map(([key, r]) => "<option value='" + key + "'>" + r.name + "</option>").join("");
    this.rulesetTarget.value = savedRuleset();
    this.translate();
  }

  changeRuleset() {
    saveRuleset(this.rulesetTarget.value);
    this.codeTarget.innerHTML = ""; // re-render every clause under the new rules
    this.translate();
  }

  highlight(target) {
    let el = this[`${target}Target`];
    el.classList.add("bg-amber-100", "text-amber-900");
    setTimeout(() => { el.classList.remove("bg-amber-100", "text-amber-900"); }, 1000);
  }

  translate() {
    let keys = this.constructor.keys;
    let names = this.constructor.names;
    let bits = this.uwpTarget.value.toUpperCase().split("").filter(bit => bit !== "-");
    let prev = this.codeTarget.innerHTML.split("").filter(bit => bit !== "-");
    if (bits.length !== keys.length) { return; }

    let rules = RULESETS[this.rulesetTarget.value].name;
    let undefinedCodes = keys.filter((key, i) => this.lookup(key, bits[i]) === undefined);
    this.rulesetNoteTarget.textContent = undefinedCodes.length
      ? `${rules} doesn't define: ${undefinedCodes.map(k => `${names[k]} ${bits[keys.indexOf(k)]}`).join(", ")}.`
      : `Read under ${rules} rules.`;

    // Itemized quick-reference table, rebuilt each change.
    this.listTarget.innerHTML = keys.map((key, i) =>
      `<tr><th scope='row'>${names[key]}</th><td class='uwp-code'>${bits[i]}</td><td>${this.shortFor(key, bits[i])}</td></tr>`
    ).join("");

    // Narrative prose: only re-render and flash the fields that changed.
    keys.forEach((key, i) => {
      if (prev[i] !== bits[i]) {
        this[`${key}Target`].innerHTML = this.narrativeFor(key, bits[i]);
        this.highlight(key);
      }
    });
    this.codeTarget.innerHTML = this.uwpTarget.value.toUpperCase();
  }

  // The entry for a code under the current ruleset, or undefined when it has none.
  lookup(key, value) {
    if (key === "tech") return TECH[value];
    if (key === "size") return sizeFor(this.rulesetTarget.value, value) || undefined;
    return RULES[this.rulesetTarget.value][key][value];
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

  // Terse label for the itemized list.
  shortFor(key, value) {
    let d = this.lookup(key, value);
    if (d === undefined) return "&mdash; not defined in these rules";
    switch (key) {
      case "port":  return `${d[0]} &mdash; ${d[1]}`;
      case "size":  return d.code === "0" ? "Asteroid belt"
        : `${d.diameter.toLocaleString("en-US")} km${d.gravity ? `, ${d.gravity} G` : ""}${d.beyondTable ? " (extrapolated)" : ""}`;
      case "atmos": return d[1] ? `${d[0]} &mdash; ${d[1]}` : `${d[0]} &mdash; breathable${d[2] ? ` only ${d[2]}` : ""}`;
      case "hydro": return `${d[0]} water, ${d[1]}`;
      case "popx":  return value === "0" ? "Unpopulated" : `${d[1].replace(/ of$/, "")}`;
      case "govt":  return d;
      case "law":   return `${d[0]} &mdash; prohibits ${d[1]}`;
      default:      return d; // tech
    }
  }

  // Concise narrative clause for the prose paragraph.
  narrativeFor(key, value) {
    let d = this.lookup(key, value);
    if (d === undefined) return "";
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
      default:     return `Technology is <strong>${d}</strong>.`;
    }
  }
});
