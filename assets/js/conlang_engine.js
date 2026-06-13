// Stellar Drift — Conlang Engine
// ---------------------------------------------------------------------------
// A deterministic, DOM-free language drift engine. Given a seed language plus
// a "world card", it returns a daughter language. Same card + same seed always
// rebuilds the identical language, byte for byte.
//
// This module has zero DOM dependencies and is importable on its own. All
// linguistics logic lives here; the Stimulus controller is glue only.
//
// Public entry: evolve(worldCard) -> render object (see RENDER CONTRACT).
// ---------------------------------------------------------------------------

// === Determinism primitives ================================================

// mulberry32: a small, fast, fully deterministic PRNG seeded from an integer.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a, 32-bit. Turns concept/founder keys into seed material.
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Combine a world seed with the FNV-1a hashes of one or more keys to derive an
// independent child stream. Each (seed, ...keys) tuple is reproducible.
export function streamSeed(worldSeed, ...keys) {
  let h = worldSeed >>> 0;
  for (const k of keys) {
    h = (h ^ fnv1a(String(k))) >>> 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function rngFor(worldSeed, ...keys) {
  return mulberry32(streamSeed(worldSeed, ...keys));
}

// === Small deterministic helpers ===========================================

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function intRange(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

// Bias toward fewer extra consonants so words stay pronounceable.
function clusterCount(rng, max) {
  let n = 0;
  while (n < max && rng() < 0.42) n++;
  return n;
}

function weightedPick(rng, entries) {
  const total = entries.reduce((s, [, w]) => s + w, 0) || 1;
  let r = rng() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const VOWELS = "aeiou";
const isV = (c) => VOWELS.includes(c);
const isC = (c) => !!c && !isV(c);
const hasVowel = (s) => /[aeiou]/.test(s);
const LABIALS = "pbmfv";

// === SEED PROFILES =========================================================
// Generative fingerprints of today's families. Never their actual words.
// Adding a family is a single entry here — no code change.

export const SEED_PROFILES = {
  anglic: {
    label: "Anglic (English-ish)",
    vowels: ["a", "e", "i", "o", "u"],
    consonants: ["p", "t", "k", "b", "d", "g", "f", "v", "s", "z", "m", "n", "l", "r", "w", "h"],
    codaSet: ["t", "d", "k", "n", "s", "l", "r", "m"],
    onsetMax: 3,
    codaMax: 3,
    syllableRange: [1, 2],
    tonal: false,
    wordOrder: "SVO",
    morphology: "analytic",
  },
  sinitic: {
    label: "Sinitic (Mandarin-ish)",
    vowels: ["a", "e", "i", "o", "u"],
    consonants: ["p", "t", "k", "m", "n", "s", "l", "h", "w", "j"],
    codaSet: ["n", "m"],
    onsetMax: 1,
    codaMax: 1,
    syllableRange: [1, 1],
    tonal: true,
    wordOrder: "SVO",
    morphology: "analytic",
  },
  semitic: {
    label: "Semitic (Arabic-ish)",
    vowels: ["a", "i", "u"],
    consonants: ["k", "t", "s", "b", "d", "m", "n", "l", "r", "h", "q", "w", "f"],
    codaSet: ["k", "t", "s", "b", "d", "m", "n", "l", "r", "q"],
    onsetMax: 2,
    codaMax: 2,
    syllableRange: [1, 2],
    tonal: false,
    wordOrder: "VSO",
    morphology: "fusional",
  },
  indic: {
    label: "Indic (Hindi-ish)",
    vowels: ["a", "e", "i", "o", "u"],
    consonants: ["t", "d", "k", "g", "p", "b", "n", "m", "r", "l", "s", "h", "j", "v"],
    codaSet: ["n", "m", "r", "l"],
    onsetMax: 2,
    codaMax: 1,
    syllableRange: [2, 3],
    tonal: false,
    wordOrder: "SOV",
    morphology: "agglutinative",
  },
  romance: {
    label: "Romance (Iberian-ish)",
    vowels: ["a", "e", "i", "o", "u"],
    consonants: ["p", "t", "k", "b", "d", "g", "f", "v", "s", "m", "n", "l", "r", "j"],
    codaSet: ["s", "n", "r", "l"],
    onsetMax: 2,
    codaMax: 1,
    syllableRange: [2, 3],
    tonal: false,
    wordOrder: "SVO",
    morphology: "fusional",
  },
  bantu: {
    label: "Bantu (Swahili-ish)",
    vowels: ["a", "e", "i", "o", "u"],
    consonants: ["p", "t", "k", "b", "d", "g", "m", "n", "s", "l", "w", "j"],
    codaSet: [],
    onsetMax: 1,
    codaMax: 0,
    syllableRange: [2, 3],
    tonal: true,
    wordOrder: "SVO",
    morphology: "agglutinative",
  },
};

// === CONCEPT SET ===========================================================
// A fixed core list, grouped so the renderer can build sentences.

export const CONCEPTS = {
  pronouns: ["i", "you", "we", "they"],
  verbs: ["go", "come", "see", "eat", "give", "speak", "make", "die", "finish"],
  nouns: [
    "water", "fire", "stone", "star", "ship", "world", "sun", "hand",
    "night", "food", "person", "light", "name", "god", "death", "sky",
  ],
  adjectives: ["big", "small", "old", "new"],
};

export const CONCEPT_LIST = [
  ...CONCEPTS.pronouns,
  ...CONCEPTS.verbs,
  ...CONCEPTS.nouns,
  ...CONCEPTS.adjectives,
];

// Interlinear glosses for pronouns; everything else glosses as itself.
const PRONOUN_GLOSS = { i: "1SG", you: "2SG", we: "1PL", they: "3PL" };

// === SOUND-CHANGE RULE LIBRARY =============================================
// Ten named rules. Each returns a (possibly unchanged) form. The engine draws
// an ordered subset per world. Rules are contractive or neutral so repeated
// rounds never balloon word length. Adding a rule is one entry here.

export const RULES = [
  {
    name: "final-vowel-loss",
    desc: "drop a word-final vowel when the word stays at least two characters",
    apply(f) {
      if (isV(f[f.length - 1]) && f.length >= 3) return f.slice(0, -1);
      return f;
    },
  },
  {
    name: "intervocalic-voicing",
    desc: "voiceless stops between vowels become voiced (p,t,k → b,d,g)",
    apply(f) {
      const map = { p: "b", t: "d", k: "g" };
      const out = f.split("");
      for (let i = 1; i < f.length - 1; i++) {
        if (map[f[i]] && isV(f[i - 1]) && isV(f[i + 1])) out[i] = map[f[i]];
      }
      return out.join("");
    },
  },
  {
    name: "lenition",
    desc: "voiced stops between vowels become fricatives (b,d,g → v,z,h)",
    apply(f) {
      const map = { b: "v", d: "z", g: "h" };
      const out = f.split("");
      for (let i = 1; i < f.length - 1; i++) {
        if (map[f[i]] && isV(f[i - 1]) && isV(f[i + 1])) out[i] = map[f[i]];
      }
      return out.join("");
    },
  },
  {
    name: "vowel-shift",
    desc: "a chain raise applied simultaneously (a→e, e→i, o→u)",
    apply(f) {
      const map = { a: "e", e: "i", o: "u" };
      return f.replace(/[aeo]/g, (c) => map[c]);
    },
  },
  {
    name: "cluster-reduction",
    desc: "a two-consonant cluster collapses to its second consonant",
    apply(f) {
      for (let i = 0; i < f.length - 1; i++) {
        if (isC(f[i]) && isC(f[i + 1])) return f.slice(0, i) + f.slice(i + 1);
      }
      return f;
    },
  },
  {
    name: "debuccalization",
    desc: "s becomes h",
    apply(f) {
      return f.replace(/s/g, "h");
    },
  },
  {
    name: "h-loss",
    desc: "h is deleted where a valid word survives",
    apply(f) {
      const i = f.indexOf("h");
      if (i === -1) return f;
      const next = f.slice(0, i) + f.slice(i + 1);
      return hasVowel(next) && next.length >= 2 ? next : f;
    },
  },
  {
    name: "final-devoicing",
    desc: "word-final voiced obstruents devoice",
    apply(f) {
      const map = { b: "p", d: "t", g: "k", v: "f", z: "s" };
      const last = f[f.length - 1];
      if (map[last]) return f.slice(0, -1) + map[last];
      return f;
    },
  },
  {
    name: "nasal-assimilation",
    desc: "n before a labial becomes m",
    apply(f) {
      const out = f.split("");
      for (let i = 0; i < f.length - 1; i++) {
        if (f[i] === "n" && LABIALS.includes(f[i + 1])) out[i] = "m";
      }
      return out.join("");
    },
  },
  {
    name: "aphaeresis",
    desc: "drop a word-initial vowel on longer words",
    apply(f) {
      if (isV(f[0]) && f.length >= 3) return f.slice(1);
      return f;
    },
  },
];

// Guard every result: never empty, never vowel-less, cap length.
function guard(orig, next) {
  if (!next || next.length < 1) return orig;
  if (!hasVowel(next)) return orig;
  if (next.length > 14) return orig;
  return next;
}

// === Word minting ==========================================================

function mintWord(profile, rng) {
  const [minS, maxS] = profile.syllableRange;
  const sylls = intRange(rng, minS, maxS);
  let form = "";
  for (let s = 0; s < sylls; s++) {
    const onsetN = clusterCount(rng, profile.onsetMax);
    for (let i = 0; i < onsetN; i++) form += pick(rng, profile.consonants);
    form += pick(rng, profile.vowels);
    const codaPool = profile.codaSet && profile.codaSet.length ? profile.codaSet : profile.consonants;
    const codaN = profile.codaMax > 0 && codaPool.length ? clusterCount(rng, profile.codaMax) : 0;
    for (let i = 0; i < codaN; i++) form += pick(rng, codaPool);
  }
  if (!hasVowel(form)) form = pick(rng, profile.vowels) + form;
  const tone = profile.tonal ? intRange(rng, 1, 4) : 0;
  return { form, tone };
}

// Creole leveling: collapse clusters to single consonants and make every word
// vowel-final, so syllables read as open.
function levelForm(form) {
  let f = form;
  // collapse any consonant cluster to its second member
  let i = 0;
  while (i < f.length - 1) {
    if (isC(f[i]) && isC(f[i + 1])) {
      f = f.slice(0, i) + f.slice(i + 1);
    } else {
      i++;
    }
  }
  // strip trailing consonants
  while (f.length > 1 && isC(f[f.length - 1])) f = f.slice(0, -1);
  return hasVowel(f) ? f : form;
}

// === Particle erosion (grammaticalization) =================================

// Erode a content word into a short bound clitic. Heavier drift → shorter.
function erode(form, rounds) {
  const vi = form.search(/[aeiou]/);
  let cut = vi === -1 ? Math.min(2, form.length) : vi + 1;
  if (cut < 2 && form.length > cut) cut++;
  let clitic = form.slice(0, cut);
  if (rounds >= 5 && clitic.length > 1) clitic = clitic.slice(0, clitic.length - 0); // hold at CV under heavy drift
  return hasVowel(clitic) ? clitic : form.slice(0, Math.min(2, form.length));
}

// === ENVIRONMENT RELEXIFY TABLES ===========================================
// Adding an environment is one entry here.

export const ENVIRONMENTS = {
  desert: {
    add: ["dune", "glare", "dustfall"],
    demote: [{ concept: "rain", gloss: "rain (mythic: water that once fell from the sky)" }],
  },
  lowgrav: { add: ["driftwalk", "leap"], demote: [] },
  tidallock: { add: ["brightside", "dimlands", "terminator"], demote: [] },
  ice: { add: ["meltwater", "whiteout"], demote: [] },
  ocean: { add: ["tide", "depths"], demote: [] },
};

export const ENVIRONMENT_TAGS = Object.keys(ENVIRONMENTS);

// Concepts the sacred high register freezes, if a sacred source is set.
const SACRED_CONCEPTS = ["god", "light", "name", "death", "water", "world"];

// === The pipeline ==========================================================

export function evolve(worldCard) {
  const card = normalizeCard(worldCard);
  const seed = card.seed >>> 0;
  const log = [];

  // sorted founder entries for stable, order-independent determinism
  const founderEntries = Object.entries(card.founders)
    .filter(([, w]) => w > 0)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

  // ---- Stage 1: Found ------------------------------------------------------
  let dominantKey = founderEntries[0][0];
  let dominantShare = founderEntries[0][1];
  for (const [k, w] of founderEntries) {
    if (w > dominantShare) {
      dominantShare = w;
      dominantKey = k;
    }
  }

  const profile = cloneProfile(SEED_PROFILES[dominantKey]);
  let creole = false;

  log.push(
    `Stage 1 — Found: dominant founder “${dominantKey}” (${pct(dominantShare)}); ` +
      `founders ${founderEntries.map(([k, w]) => `${k} ${pct(w)}`).join(", ")}.`
  );

  const lexicon = {};
  for (const concept of CONCEPT_LIST) {
    const chooser = rngFor(seed, "found", concept);
    const founderKey = weightedPick(chooser, founderEntries);
    const minter = rngFor(seed, founderKey, concept);
    lexicon[concept] = mintWord(SEED_PROFILES[founderKey], minter);
  }

  if (dominantShare < 0.55) {
    creole = true;
    profile.codaMax = 0;
    profile.codaSet = [];
    profile.morphology = "analytic";
    for (const concept of CONCEPT_LIST) {
      lexicon[concept].form = levelForm(lexicon[concept].form);
    }
    log.push(
      `Stage 1 — Creole: dominant share ${pct(dominantShare)} < 55%. ` +
        `Leveling applied: open syllables forced, codas stripped, morphology → analytic.`
    );
  }

  let wordOrder = profile.wordOrder;
  let morphology = profile.morphology;

  // ---- Stage 2: Drift Sound ------------------------------------------------
  const rounds = Math.min(
    8,
    Math.max(1, Math.round((card.isolationYears / 150) * (1 - card.techBrake)))
  );
  const ruleRng = rngFor(seed, "drift-rules");
  const ruleCount = intRange(ruleRng, 4, 7);
  const drawn = shuffle(ruleRng, RULES.map((_, i) => i)).slice(0, ruleCount).map((i) => RULES[i]);

  log.push(
    `Stage 2 — Drift Sound: ${rounds} round(s) ` +
      `(isolation ${card.isolationYears}y, tech brake ${card.techBrake}); ` +
      `rule chain: ${drawn.map((r) => r.name).join(" → ")}.`
  );

  for (let round = 0; round < rounds; round++) {
    for (const concept of CONCEPT_LIST) {
      let f = lexicon[concept].form;
      for (const rule of drawn) f = guard(f, rule.apply(f));
      lexicon[concept].form = f;
    }
  }

  // ---- Stage 3: Grammaticalize --------------------------------------------
  const grammarMap = [
    { concept: "go", role: "FUT", label: "future" },
    { concept: "finish", role: "PFV", label: "perfective" },
    { concept: "come", role: "VEN", label: "venitive (motion toward)" },
    { concept: "person", role: "PL", label: "plural / agentive clitic" },
  ];
  const grammar = {};
  for (const g of grammarMap) {
    const src = lexicon[g.concept];
    if (!src) continue;
    grammar[g.role] = { form: erode(src.form, rounds), role: g.label, from: g.concept };
  }
  log.push(
    `Stage 3 — Grammaticalize: ${grammarMap
      .map((g) => `${g.concept} → ${g.role} (${grammar[g.role].form})`)
      .join(", ")}. Content words retained.`
  );

  // ---- Stage 4: Relexify ---------------------------------------------------
  const coined = [];
  const mythic = {};
  const envTags = card.environment.slice().sort();
  for (const tag of envTags) {
    const table = ENVIRONMENTS[tag];
    if (!table) continue;
    for (const concept of table.add) {
      const minter = rngFor(seed, "relex", tag, concept);
      const word = mintWord(profile, minter);
      // run the established drift chain once so it reads as native, not bolted-on
      let f = word.form;
      for (const rule of drawn) f = guard(f, rule.apply(f));
      word.form = f;
      lexicon[concept] = word;
      coined.push({ concept, form: word.form, tag });
    }
    for (const d of table.demote || []) {
      const minter = rngFor(seed, "relex-mythic", tag, d.concept);
      const word = mintWord(profile, minter);
      mythic[d.concept] = { form: word.form, gloss: d.gloss };
    }
  }
  if (envTags.length) {
    log.push(
      `Stage 4 — Relexify: environment [${envTags.join(", ")}] ` +
        `coined ${coined.map((c) => `${c.concept}=${c.form}`).join(", ") || "nothing"}` +
        (Object.keys(mythic).length
          ? `; demoted ${Object.keys(mythic).join(", ")} to mythic register.`
          : ".")
    );
  } else {
    log.push("Stage 4 — Relexify: no environment tags; lexicon unchanged.");
  }

  // ---- Stage 5: Stratify ---------------------------------------------------
  const registers = { high: {} };
  if (card.sacred && SEED_PROFILES[card.sacred]) {
    const sacredProfile = SEED_PROFILES[card.sacred];
    for (const concept of SACRED_CONCEPTS) {
      const minter = rngFor(seed, "sacred", card.sacred, concept);
      const word = mintWord(sacredProfile, minter); // undrifted, frozen founding form
      registers.high[concept] = word;
    }
    log.push(
      `Stage 5 — Stratify: sacred source “${card.sacred}” froze a high register ` +
        `[${SACRED_CONCEPTS.join(", ")}] in undrifted founding form.`
    );
  } else {
    log.push("Stage 5 — Stratify: no sacred source; vernacular only.");
  }

  // ---- Stage 6: Render -----------------------------------------------------
  const language = {
    name: card.name,
    seed,
    lexicon,
    profile,
    wordOrder,
    morphology,
    creole,
    grammar,
    registers,
    mythic,
    coined,
    founderEntries,
    dominantKey,
    dominantShare,
    isolationYears: card.isolationYears,
    techBrake: card.techBrake,
    rounds,
    drawnRules: drawn.map((r) => r.name),
    log,
  };

  log.push("Stage 6 — Render: read-only output assembled.");
  return render(language);
}

// === Render contract =======================================================

function render(lang) {
  const tones = ["", "¹", "²", "³", "⁴"];
  const show = (rec) => (rec.tone ? rec.form + tones[rec.tone] : rec.form);

  const founderSummary = lang.founderEntries
    .map(([k, w]) => `${k} ${pct(w)}`)
    .join(" / ");

  const usedChars = new Set();
  for (const concept of CONCEPT_LIST) {
    for (const c of lang.lexicon[concept].form) usedChars.add(c);
  }
  const vowelsUsed = [...usedChars].filter(isV).sort();
  const consUsed = [...usedChars].filter(isC).sort();

  // Glossary: a stable, representative ~12-word window, with coined env words
  // surfaced when present.
  const baseGloss = [
    "i", "you", "we",
    "see", "go", "eat",
    "water", "fire", "star",
    "ship", "person", "light",
  ];
  const coinedConcepts = lang.coined.map((c) => c.concept);
  const glossConcepts = [...coinedConcepts.slice(0, 3), ...baseGloss].slice(0, 12);
  const glossary = glossConcepts.map((concept) => ({
    concept,
    form: show(lang.lexicon[concept]),
  }));

  const grammar = Object.entries(lang.grammar).map(([abbr, g]) => ({
    role: g.role,
    abbr,
    form: g.form,
    from: g.from,
  }));

  const highRegister = Object.entries(lang.registers.high).map(([concept, rec]) => ({
    concept,
    form: show(rec),
  }));

  const mythic = Object.entries(lang.mythic).map(([concept, rec]) => ({
    concept,
    form: rec.form,
    gloss: rec.gloss,
  }));

  const sentences = buildSentences(lang, show);

  return {
    meta: {
      name: lang.name,
      seed: lang.seed,
      founderSummary,
      isolationYears: lang.isolationYears,
      techBrake: lang.techBrake,
      creole: lang.creole,
    },
    phonology: {
      vowels: vowelsUsed,
      consonants: consUsed,
      syllableComplexity: `onset ≤ ${lang.profile.onsetMax}, coda ≤ ${lang.profile.codaMax}`,
      tonal: !!lang.profile.tonal,
      wordOrder: lang.wordOrder,
      morphology: lang.morphology,
    },
    glossary,
    grammar,
    highRegister,
    mythic,
    sentences,
    log: lang.log.slice(),
  };
}

// Assemble surface strings per word order, with particles placed on the verb.
function buildSentences(lang, show) {
  const lex = lang.lexicon;
  const order = lang.wordOrder;

  const glossOf = (concept) => PRONOUN_GLOSS[concept] || concept;

  function clause(subj, verb, obj, particle) {
    const vSurface = particle ? `${lex[verb].form}=${particle.form}` : lex[verb].form;
    const vGloss = particle ? `${glossOf(verb)}=${particle.abbr}` : glossOf(verb);

    const S = { s: show(lex[subj]), g: glossOf(subj) };
    const V = { s: applyTone(vSurface, lex[verb]), g: vGloss };
    const O = { s: show(lex[obj]), g: glossOf(obj) };

    let seq;
    if (order === "SOV") seq = [S, O, V];
    else if (order === "VSO") seq = [V, S, O];
    else seq = [S, V, O]; // SVO

    return {
      surface: seq.map((t) => t.s).join(" "),
      gloss: seq.map((t) => t.g).join(" "),
    };
  }

  const out = [];
  // present transitive
  out.push(clause("i", "see", "water", null));
  // future (go grammaticalized into FUT, so use a different lexical verb)
  out.push(clause("i", "make", "ship", { form: lang.grammar.FUT.form, abbr: "FUT" }));
  // perfective (finish → PFV)
  out.push(clause("i", "eat", "food", { form: lang.grammar.PFV.form, abbr: "PFV" }));
  return out;
}

// keep the tone mark on the verb stem even when a particle is cliticized
function applyTone(surface, rec) {
  if (!rec.tone) return surface;
  const tones = ["", "¹", "²", "³", "⁴"];
  const eq = surface.indexOf("=");
  if (eq === -1) return surface + tones[rec.tone];
  return surface.slice(0, eq) + tones[rec.tone] + surface.slice(eq);
}

// === Card normalization ====================================================

function normalizeCard(card) {
  const c = card || {};
  let founders = c.founders && Object.keys(c.founders).length ? { ...c.founders } : { anglic: 1 };
  // keep only known founders; renormalize shares to sum ~1
  const known = {};
  for (const [k, v] of Object.entries(founders)) {
    if (SEED_PROFILES[k] && v > 0) known[k] = v;
  }
  if (!Object.keys(known).length) known.anglic = 1;
  const total = Object.values(known).reduce((s, w) => s + w, 0);
  for (const k of Object.keys(known)) known[k] = known[k] / total;

  return {
    name: typeof c.name === "string" && c.name.trim() ? c.name.trim() : "Unnamed World",
    seed: Number.isFinite(c.seed) ? c.seed | 0 : 0,
    founders: known,
    isolationYears: clampInt(c.isolationYears, 200, 2000, 1000),
    techBrake: clampFloat(c.techBrake, 0, 1, 0),
    environment: Array.isArray(c.environment)
      ? c.environment.filter((t) => ENVIRONMENTS[t])
      : [],
    sacred: c.sacred && SEED_PROFILES[c.sacred] ? c.sacred : null,
  };
}

function cloneProfile(p) {
  return {
    label: p.label,
    vowels: p.vowels.slice(),
    consonants: p.consonants.slice(),
    codaSet: (p.codaSet || p.consonants).slice(),
    onsetMax: p.onsetMax,
    codaMax: p.codaMax,
    syllableRange: p.syllableRange.slice(),
    tonal: p.tonal,
    wordOrder: p.wordOrder,
    morphology: p.morphology,
  };
}

function clampInt(v, lo, hi, dflt) {
  const n = Number.isFinite(v) ? Math.round(v) : dflt;
  return Math.min(hi, Math.max(lo, n));
}
function clampFloat(v, lo, hi, dflt) {
  const n = Number.isFinite(v) ? v : dflt;
  return Math.min(hi, Math.max(lo, n));
}
function pct(x) {
  return `${Math.round(x * 100)}%`;
}
