// World sizes for the Traveller rulesets, shared by the travel and orbital calculators.
//
// Every ruleset sizes terrestrial worlds the same way: digit n is n × 1,000 miles,
// i.e. n × 1,600 km. They differ in what else the table gives:
//   - Mongoose (1e/2e) and Cepheus Engine (SRD book 3) list surface gravity per size.
//   - Classic (Book 3) and T5 (Book 3, p. "World Profile") give diameter only.
//   - T5 adds gas giants L–Y, sized in miles, with Jupiter masses for U–Y.
// Size 0 is an asteroid belt; we model a typical 800 km body so the maths still runs.

const KM_PER_MILE = 1.609344
export const JUPITER_MASS = 1898.6 // 10^24 kg

// Mongoose and Cepheus surface gravity (G) by size digit.
const GRAVITY_TABLE = { 1: 0.05, 2: 0.15, 3: 0.25, 4: 0.35, 5: 0.45, 6: 0.7, 7: 0.9, 8: 1.0, 9: 1.25, A: 1.4 }

// T5 gas giants: size code, diameter in miles, Jupiter masses where the table gives one.
const GAS_GIANTS = [
  ["L", 20000], ["M", 30000, null, "Neptune"], ["N", 40000], ["P", 50000], ["Q", 60000],
  ["R", 70000, null, "Saturn"], ["S", 80000], ["T", 90000, null, "Jupiter"],
  ["U", 125000, 2], ["V", 180000, 4], ["W", 220000, 6], ["X", 250000, 8], ["Y", 250000, 10],
]

const HEX = "0123456789ABCDEF"

function terrestrial(maxDigit, withGravity) {
  return HEX.slice(0, HEX.indexOf(maxDigit) + 1).split("").map(code => {
    var n = HEX.indexOf(code);
    var size = { code, diameter: n === 0 ? 800 : n * 1600, kind: "world" };
    if (withGravity && GRAVITY_TABLE[code] !== undefined) size.gravity = GRAVITY_TABLE[code];
    return size;
  });
}

function gasGiants() {
  return GAS_GIANTS.map(([code, miles, jupiters, like]) => ({
    code, diameter: Math.round(miles * KM_PER_MILE), kind: "gas giant", jupiters, like,
  }));
}

export const RULESETS = {
  classic:  { name: "Classic Traveller", sizes: terrestrial("A", false) },
  mongoose: { name: "Mongoose Traveller", sizes: terrestrial("A", true) },
  t5:       { name: "Traveller5", sizes: terrestrial("F", false).concat(gasGiants()) },
  cepheus:  { name: "Cepheus Engine", sizes: terrestrial("A", true) },
}
export const DEFAULT_RULESET = "cepheus"

// The ruleset choice is a per-viewer preference shared by both calculators.
const STORAGE_KEY = "traveller-ruleset"
export function savedRuleset() {
  try { var r = localStorage.getItem(STORAGE_KEY); if (RULESETS[r]) return r } catch (e) {}
  return DEFAULT_RULESET
}
export function saveRuleset(key) {
  try { localStorage.setItem(STORAGE_KEY, key) } catch (e) {}
}

// Look a size code up in a ruleset. Digits past the ruleset's table (B–F outside T5)
// fall back to the shared n × 1,600 km rule, without gravity.
export function sizeFor(rulesetKey, code) {
  code = String(code).toUpperCase();
  var found = RULESETS[rulesetKey].sizes.find(s => s.code === code);
  if (found) return found;
  var n = HEX.indexOf(code);
  if (n > 0) return { code, diameter: n * 1600, kind: "world", beyondTable: true };
  return null;
}

export function sizeLabel(size) {
  var km = size.diameter.toLocaleString("en-US") + " km";
  if (size.kind === "gas giant") {
    var extra = size.jupiters ? " · " + (size.code === "Y" ? "≥" : "") + size.jupiters + " Mj" : (size.like ? " (" + size.like + ")" : "");
    return size.code + " · Gas giant · " + km + extra;
  }
  if (size.code === "0") return "Size 0 · Asteroid / belt (~800 km)";
  return "Size " + size.code + " · " + km + (size.gravity ? " · " + size.gravity + " G" : "");
}

// Fill a <select> with a ruleset's sizes, keeping the current code when it still exists.
export function fillSizeSelect(select, rulesetKey, keepCode) {
  var sizes = RULESETS[rulesetKey].sizes;
  var worlds = sizes.filter(s => s.kind === "world");
  var giants = sizes.filter(s => s.kind === "gas giant");
  var option = s => "<option value='" + s.code + "'>" + sizeLabel(s) + "</option>";
  select.innerHTML = "<option value='' hidden>Custom</option>" +
    "<optgroup label='Worlds'>" + worlds.map(option).join("") + "</optgroup>" +
    (giants.length ? "<optgroup label='Gas giants'>" + giants.map(option).join("") + "</optgroup>" : "");
  select.value = sizes.some(s => s.code === keepCode) ? keepCode : "";
}

// Parse a Universal World Profile such as "A788899-C" (starport, size, atmosphere,
// hydrographics, population, government, law - tech level). Also accepts a bare
// size code. Returns { size, uwp } or { error }.
export function parseUWP(text) {
  var s = String(text || "").trim().toUpperCase();
  if (!s) return { error: null };
  var m = s.match(/([A-HXY])([0-9A-Z])([0-9A-F])([0-9A])([0-9A-F])([0-9A-F])([0-9A-J])\s*-?\s*([0-9A-Z])/);
  if (m) return { size: m[2], uwp: m.slice(1, 8).join("") + "-" + m[8] };
  if (/^[0-9A-Z]$/.test(s)) return { size: s, uwp: null };
  return { error: "Expected a UWP such as A788899-C, or a single size code" };
}
