// import { Controller } from "@hotwired/stimulus"
import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = Application.start()

// Connects to data-controller="uwp-translator"
Stimulus.register("uwp-translator", class extends Controller {
  connect() {
    console.log("connected uwp-translator")
    this.translate();
  }
  static targets = ["name", "uwp", "code", "output", "list",
    'port', 'size', 'atmos', 'popx', 'hydro', 'govt', 'law', 'tech',
  ];

  // Display order and labels for the UWP fields (standard SAEHPGLT order).
  static keys = ['port', 'size', 'atmos', 'hydro', 'popx', 'govt', 'law', 'tech'];
  static names = {
    port: 'Starport', size: 'Size', atmos: 'Atmosphere', hydro: 'Hydrographics',
    popx: 'Population', govt: 'Government', law: 'Law Level', tech: 'Tech Level',
  };

  highlight(target) {
    let el = this[`${target}Target`];
    el.classList.add('bg-amber-100', 'text-amber-900');
    setTimeout(() => { el.classList.remove('bg-amber-100', 'text-amber-900'); }, 1000);
  }

  translate() {
    let keys = this.constructor.keys;
    let names = this.constructor.names;
    let bits = this.uwpTarget.value.split('').filter(bit => bit !== '-');
    let prev = this.codeTarget.innerHTML.split('').filter(bit => bit !== '-');
    if (bits.length !== keys.length) { return; }

    // Itemized quick-reference table, rebuilt each change.
    this.listTarget.innerHTML = keys.map((key, i) =>
      `<tr><th scope='row'>${names[key]}</th><td class='uwp-code'>${bits[i]}</td><td>${this.shortFor(key, bits[i])}</td></tr>`
    ).join('');

    // Narrative prose: only re-render and flash the fields that changed.
    keys.forEach((key, i) => {
      if (prev[i] !== bits[i]) {
        this[`${key}Target`].innerHTML = this.narrativeFor(key, bits[i]);
        this.highlight(key);
      }
    });
    this.codeTarget.innerHTML = this.uwpTarget.value;
  }

  // Terse label for the itemized list.
  shortFor(key, value) {
    let datum = this.metadata.code[key][value];
    if (datum === undefined) return '&mdash;';
    switch (key) {
      case 'port':  return this.metadata.short.port[value] || '&mdash;';
      case 'atmos': return this.metadata.short.atmos[value] || '&mdash;';
      case 'size':  return `${datum[0]}, ${datum[1]} km`;
      case 'hydro': return `${datum[0]}% water, ${datum[1]}`;
      case 'popx':  return `${datum[0]}, ${datum[1]}`;
      case 'govt':  return datum[0];
      case 'law':   return datum[1];
      default:      return datum; // tech
    }
  }

  // Concise narrative clause for the prose paragraph.
  narrativeFor(key, value) {
    let datum = this.metadata.code[key][value];
    let template = this.metadata.templates[key];
    if (datum === undefined) return '';
    if (Array.isArray(datum)) {
      return template.replace('{0}', datum[0]).replace('{1}', datum[1]);
    }
    return template.replace('{0}', datum);
  }

  metadata = {
    "templates": {
      "size":  "The main world is <strong>{0}</strong>, roughly {1} km across.",
      "port":  "{0}",
      "atmos": "{0}",
      "hydro": "Its surface is <strong>{0}%</strong> water, a <strong>{1}</strong>.",
      "popx":  "It holds a <strong>{0}</strong> population of {1} residents.",
      "govt":  "Government is a <strong>{0}</strong>.",
      "law":   "The law is <strong>{0}</strong>, regulating {1}.",
      "tech":  "Technology is <strong>{0}</strong>."
    },
    // Terse labels for the itemized list (port/atmos only; others derive
    // from the narrative data in shortFor()).
    "short": {
      "port": {
        "A": "Excellent &mdash; shipyards, refined fuel",
        "B": "Good &mdash; shipyards, refined fuel",
        "C": "Routine &mdash; major repairs, unrefined fuel",
        "D": "Poor &mdash; major repairs, unrefined fuel",
        "E": "Frontier &mdash; no fuel or repairs",
        "F": "Good spaceport &mdash; minor repairs, unrefined fuel",
        "G": "Basic spaceport &mdash; superficial repairs, unrefined fuel",
        "H": "Primitive spaceport &mdash; no fuel or repairs",
        "X": "None",
        "Y": "None"
      },
      "atmos": {
        "0": "Vacuum &mdash; vacc suit",
        "1": "Trace &mdash; vacc suit",
        "2": "Very thin, tainted &mdash; respirator",
        "3": "Very thin &mdash; compressor",
        "4": "Thin &mdash; breathable",
        "5": "Thin &mdash; breathable",
        "6": "Standard &mdash; breathable",
        "7": "Standard, tainted &mdash; filter mask",
        "8": "Dense &mdash; breathable",
        "9": "Dense, tainted &mdash; filter mask",
        "A": "Exotic &mdash; oxygen tanks",
        "B": "Corrosive &mdash; protective suit",
        "C": "Insidious &mdash; extreme corrosion",
        "D": "High pressure &mdash; breathable at altitude",
        "E": "Ellipsoidal &mdash; pressure varies",
        "F": "Thin &mdash; breathable in lowlands"
      }
    },
    "code": {
      "port": {
        "A": "Its <strong>Excellent</strong> starport has shipyards and sells refined fuel.",
        "B": "Its <strong>Good</strong> starport has shipyards and sells refined fuel.",
        "C": "Its <strong>Routine</strong> starport handles major repairs and sells unrefined fuel.",
        "D": "Its <strong>Poor</strong> starport handles major repairs and sells unrefined fuel.",
        "E": "Its <strong>Frontier</strong> starport offers no fuel or repair facilities.",
        "F": "Its <strong>Good</strong> spaceport handles minor repairs and sells unrefined fuel.",
        "G": "Its <strong>Basic</strong> spaceport handles superficial repairs and sells unrefined fuel.",
        "H": "Its <strong>Primitive</strong> spaceport offers no fuel or repair facilities.",
        "X": "It has <strong>no</strong> starport or spaceport.",
        "Y": "It has <strong>no</strong> starport or spaceport."
      },
      "size": {
        "R": ["an Asteroid/Planetary Ring", "multiple &lt; 1"],
        "0": ["an Asteroid/Planetary Belt", "multiple &lt; 200"],
        "D": ["Debris", "&lt; 200"],
        "S": ["a Very Small terrestrial (e.g. Luna)", "200&ndash;6,399"],
        "1": ["a Tiny terrestrial (e.g. Mars)", "6,400&ndash;7,199"],
        "2": ["a Small terrestrial", "7,200&ndash;7,999"],
        "3": ["a Small terrestrial", "8,000&ndash;8,799"],
        "4": ["a Small terrestrial", "8,800&ndash;9,599"],
        "5": ["a Medium terrestrial", "9,600&ndash;10,399"],
        "6": ["a Medium terrestrial", "10,400&ndash;11,199"],
        "7": ["a Medium terrestrial (e.g. Venus)", "11,200&ndash;12,799"],
        "8": ["a Large terrestrial (e.g. Terra)", "12,800&ndash;14,399"],
        "9": ["a Large terrestrial", "14,400&ndash;15,999"],
        "A": ["a Large terrestrial", "16,000&ndash;16,799"],
        "B": ["a Huge terrestrial", "16,800+"]
      },
      "atmos": {
        "0": "The atmosphere is a near-vacuum, requiring a vacc suit.",
        "1": "The atmosphere is a trace, requiring a vacc suit.",
        "2": "The very thin atmosphere is tainted, requiring a respirator.",
        "3": "The atmosphere is very thin, requiring a compressor for adequate oxygen.",
        "4": "The thin atmosphere is breathable without aid.",
        "5": "The thin atmosphere is breathable without aid.",
        "6": "The standard atmosphere is breathable without aid.",
        "7": "The standard atmosphere is tainted, requiring a filter mask.",
        "8": "The dense atmosphere is breathable without aid.",
        "9": "The dense atmosphere is tainted, requiring a filter mask.",
        "A": "An exotic gas mix requires oxygen tanks (but no protective suit).",
        "B": "A corrosive atmosphere requires a protective suit.",
        "C": "An insidious atmosphere defeats protective gear within hours.",
        "D": "Pressure is too high at sea level but breathable at altitude.",
        "E": "The world is ellipsoidal; pressure varies and is breathable only in some bands.",
        "F": "A thin atmosphere settles into the lowlands, breathable only there."
      },
      "hydro": {
        "0": ["0&ndash;4", "Desert world"], "1": ["5&ndash;14", "Dry world"],
        "2": ["15&ndash;24", "Dry world"], "3": ["25&ndash;34", "Wet world"],
        "4": ["35&ndash;44", "Wet world"], "5": ["45&ndash;54", "Wet world"],
        "6": ["55&ndash;64", "Wet world"], "7": ["65&ndash;74", "Wet world"],
        "8": ["75&ndash;84", "Wet world"], "9": ["85&ndash;94", "Wet world"],
        "A": ["95&ndash;100", "Water world"]
      },
      "popx": {
        "0": ["Low", "&lt;10 (P)"], "1": ["Low", "10 to 100 (P0)"],
        "2": ["Low", "100 to 1,000 (P00)"], "3": ["Low", "1,000 to 10,000 (P,000)"],
        "4": ["Moderate", "10,000 to 100,000 (P0,000)"],
        "5": ["Moderate", "100,000 to 1,000,000 (P00,000)"],
        "6": ["Moderate", "1 Million to 10 Million (P,000,000)"],
        "7": ["Moderate", "10 Million to 100 Million (P0,000,000)"],
        "8": ["Moderate", "100 Million to 1 Billion (P00,000,000)"],
        "9": ["High", "1 Billion to 10 Billion (P,000,000,000)"],
        "A": ["High", "10 Billion to 100 Billion (P0,000,000,000)"],
        "B": ["High", "100 Billion to 1 Trillion (P00,000,000,000)"]
      },
      "govt": {
        "0": ["No Government Structure"],
        "1": ["Company/Corporation"],
        "2": ["Participating Democracy"],
        "3": ["Self-Perpetuating Oligarchy"],
        "4": ["Representative Democracy"],
        "5": ["Feudal Technocracy"],
        "6": ["Captive Government/Colony"],
        "7": ["Balkanized State"],
        "8": ["Civil Service Bureaucracy"],
        "9": ["Impersonal Bureaucracy"],
        "A": ["Charismatic Dictatorship"],
        "B": ["Non-Charismatic Leadership"],
        "C": ["Charismatic Oligarchy"],
        "D": ["Religious Dictatorship"],
        "E": ["Religious Autocracy"],
        "F": ["Totalitarian Oligarchy"]
      },
      "law": {
        "0": ["unrestricted", "no weapons (even nuclear)"],
        "1": ["barely restrictive", "only body pistols, explosives, poison gas"],
        "2": ["barely restrictive", "portable energy weapons"],
        "3": ["barely restrictive", "machine guns and automatic weapons"],
        "4": ["moderately restrictive", "light assault weapons"],
        "5": ["moderately restrictive", "personal concealable weapons"],
        "6": ["moderately restrictive", "all firearms except shotguns"],
        "7": ["moderately restrictive", "shotguns"],
        "8": ["highly restrictive", "blade weapons"],
        "9": ["highly restrictive", "weapons outside the home"],
        "A": ["extremely restrictive", "weapon possession"],
        "B": ["extremely restrictive", "civilian movement"],
        "C": ["extremely restrictive", "privacy"],
        "D": ["extremely restrictive", "daily life via paramilitary police"],
        "E": ["extremely restrictive", "daily life in a police state"],
        "F": ["extremely restrictive", "all facets of daily life"],
        "G": ["extremely restrictive", "petty infractions with severe punishment"],
        "H": ["extremely restrictive", "daily life via legalized oppression"],
        "J": ["extremely restrictive", "daily life, routinely oppressive"],
        "K": ["extremely restrictive", "daily life, excessively oppressive"],
        "L": ["extremely restrictive", "daily life, totally oppressive"]
      },
      "tech": {
        "0": "Stone Age (fire)",
        "1": "Pre-Industrial (3500 BC&ndash;600 AD)",
        "2": "Age of Sail (c. 1450 AD)",
        "3": "Industrial Revolution (c. 1730 AD)",
        "4": "Mechanized Age (c. 1880 AD)",
        "5": "Broadcast Age (c. 1910 AD)",
        "6": "Nuclear Age (c. 1940 AD)",
        "7": "Digital precursor (c. 1970 AD)",
        "8": "Digital Age (c. 1990 AD)",
        "9": "Early Stellar (c. 2050 AD)",
        "A": "Early Stellar (c. 2120 AD)",
        "B": "Average Stellar",
        "C": "Average Imperial",
        "D": "Average Stellar",
        "E": "High Stellar",
        "F": "Imperial Maximum"
      }
    }
  }
});
