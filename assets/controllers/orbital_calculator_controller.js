import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
import { RULESETS, JUPITER_MASS, savedRuleset, saveRuleset, sizeFor, fillSizeSelect, parseUWP } from "/assets/js/traveller_worlds.js"
window.Stimulus = Application.start()

const SUN_MASS = 1988500       // 10^24 kg
const KM_PER_AU = 149597870.7

// Sol system reference bodies: mass (10^24 kg), volume (10^12 km^3), mean radius (km),
// sidereal rotation (hours), and what they orbit (for the Hill sphere).
const BODIES = [
  { name: "Mercury", mass: 0.3302, volume: 0.06083, radius: 2439.74, hours: 1407.5, parent: [1, "sun"], distance: [0.387, "au"] },
  { name: "Venus", mass: 4.8685, volume: 0.92843, radius: 6051.83, hours: 5832.5, parent: [1, "sun"], distance: [0.723, "au"] },
  { name: "Earth", mass: 5.9736, volume: 1.08321, radius: 6371.01, hours: 23.934, parent: [1, "sun"], distance: [1, "au"] },
  { name: "Mars", mass: 0.64185, volume: 0.16318, radius: 3389.95, hours: 24.623, parent: [1, "sun"], distance: [1.524, "au"] },
  { name: "Jupiter", mass: 1898.6, volume: 1431.28, radius: 69910.97, hours: 9.925, parent: [1, "sun"], distance: [5.203, "au"] },
  { name: "Saturn", mass: 568.46, volume: 827.13, radius: 58232.0, hours: 10.656, parent: [1, "sun"], distance: [9.537, "au"] },
  { name: "Uranus", mass: 86.81, volume: 68.33, radius: 25361.46, hours: 17.24, parent: [1, "sun"], distance: [19.19, "au"] },
  { name: "Neptune", mass: 102.43, volume: 62.526, radius: 24622.04, hours: 16.11, parent: [1, "sun"], distance: [30.07, "au"] },
  { name: "Europa", mass: 0.048, volume: 0.01593, radius: 1560.9, hours: 85.2, parent: [1, "jupiter"], distance: [671100, "km"] },
]

// Connects to data-controller="orbital-calculator"
Stimulus.register("orbital-calculator", class extends Controller {
  static targets = [
    // inputs
    "density",
    "distance",
    "distanceUnit",
    "gravity",
    "mass",
    "parentMass",
    "parentUnit",
    "planetSize",
    "radius",
    "rotationPeriod",
    "ruleset",
    "uwp",
    // readouts
    "altitude",
    "bodies",
    "days",
    "deltaV",
    "deltaVNote",
    "earthMasses",
    "escape",
    "heldNote",
    "hill",
    "hillNote",
    "lag",
    "latitude",
    "orbitRing",
    "planetDisc",
    "radii",
    "ring",
    "satellite",
    "semiMajor",
    "speed",
    "speedKmh",
    "status",
    "uwpNote",
  ]
  G_CONSTANT = 6.67430e-11
  EARTH_MASS = 5.9736          // 10^24 kg
  STANDARD_GRAVITY = 9.80665   // m/s^2
  C_KM = 299792.458            // km/s
  GAS_GIANT_DENSITY = 1.3      // g/cm^3, between Saturn (0.69) and Neptune (1.64)

  connect() {
    // Which of mass, gravity and density stays fixed when the radius changes.
    this.held = "mass";
    this.rulesetTarget.innerHTML = Object.entries(RULESETS)
      .map(([key, r]) => "<option value='" + key + "'>" + r.name + "</option>").join("");
    this.rulesetTarget.value = savedRuleset();
    fillSizeSelect(this.planetSizeTarget, this.rulesetTarget.value, "6");
    this.renderBodies();
    this.setSize();
  }

  // =================================================================================================
  // Helpers
  num(target) { var n = parseFloat(target.value); return isFinite(n) ? n : 0 }
  format(n, digits = 0) {
    return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
  }
  trim(n, digits) { return String(parseFloat(n.toFixed(digits))) }

  // Mass (10^24 kg) <-> surface gravity (G) and mean density (g/cm^3) for a radius in km.
  gravityOf(mass, radius) { return radius > 0 ? this.G_CONSTANT * mass * 1e24 / Math.pow(radius * 1000, 2) / this.STANDARD_GRAVITY : 0 }
  massFromGravity(g, radius) { return g * this.STANDARD_GRAVITY * Math.pow(radius * 1000, 2) / this.G_CONSTANT / 1e24 }
  volumeCm3(radius) { return 4 / 3 * Math.PI * Math.pow(radius * 1e5, 3) }
  densityOf(mass, radius) { return radius > 0 ? mass * 1e27 / this.volumeCm3(radius) : 0 }
  massFromDensity(d, radius) { return d * this.volumeCm3(radius) / 1e27 }

  // Parent mass in 10^24 kg and orbital distance in km.
  parentMass() {
    var factor = { sun: SUN_MASS, jupiter: JUPITER_MASS, e24: 1 }[this.parentUnitTarget.value];
    return this.num(this.parentMassTarget) * factor;
  }
  distanceKm() {
    return this.num(this.distanceTarget) * (this.distanceUnitTarget.value === "au" ? KM_PER_AU : 1);
  }

  // Synchronous orbit for a body. Inputs in 10^24 kg, km and hours; returns km and km/s.
  syncOrbit(mass, radius, hours) {
    var seconds = hours * 3600;
    var semiMajor = Math.cbrt(this.G_CONSTANT * mass * 1e24 * seconds * seconds / (4 * Math.PI * Math.PI)) / 1000;
    return {
      semiMajor: semiMajor,
      altitude: semiMajor - radius,
      speed: seconds > 0 ? 2 * Math.PI * semiMajor / seconds : 0,
    };
  }

  // Hill sphere radius (km): where the planet's gravity still beats its parent's.
  hillRadius(mass, parentMass, distance) {
    return parentMass > 0 ? distance * Math.cbrt(mass / (3 * parentMass)) : Infinity;
  }

  // Prograde moons stay put inside about a third of the Hill radius; past half
  // they are lost over time; past the Hill radius they never belonged to the planet.
  stability(semiMajor, radius, hill) {
    if (semiMajor <= radius) return { key: "impossible", label: "Below the surface", note: "This world spins too fast for a synchronous orbit." };
    var ratio = semiMajor / hill;
    if (ratio <= 1 / 3) return { key: "stable", label: "Stable", note: "Well inside the Hill sphere." };
    if (ratio <= 1 / 2) return { key: "marginal", label: "Marginal", note: "Close to the Hill sphere's edge; needs station-keeping." };
    if (ratio <= 1) return { key: "unstable", label: "Unstable", note: "The parent's tides will pull a satellite away." };
    return { key: "impossible", label: "Impossible", note: "Outside the Hill sphere: the satellite would orbit the parent instead." };
  }

  // =================================================================================================
  // Actions
  changeRuleset() {
    saveRuleset(this.rulesetTarget.value);
    fillSizeSelect(this.planetSizeTarget, this.rulesetTarget.value, this.planetSizeTarget.value);
    if (this.uwpTarget.value.trim()) this.applyUWP();
    else this.setSize();
  }

  // A size from the table sets the radius, plus gravity or mass where the ruleset gives them.
  setSize() {
    var size = this.planetSizeTarget.value && sizeFor(this.rulesetTarget.value, this.planetSizeTarget.value);
    if (size) {
      this.radiusTarget.value = size.diameter / 2;
      if (size.gravity) { this.gravityTarget.value = size.gravity; this.held = "gravity"; }
      else if (size.jupiters) { this.massTarget.value = size.jupiters * JUPITER_MASS; this.held = "mass"; }
      else if (size.kind === "gas giant") { this.densityTarget.value = this.GAS_GIANT_DENSITY; this.held = "density"; }
      else if (this.held === "mass") { this.held = "density"; }
    }
    this.syncMass();
  }

  applyUWP() {
    var parsed = parseUWP(this.uwpTarget.value);
    if (parsed.error !== undefined) {
      this.uwpNoteTarget.textContent = parsed.error || "Optional: sets the world size from its UWP";
      return;
    }
    var size = sizeFor(this.rulesetTarget.value, parsed.size);
    if (!size) {
      this.uwpNoteTarget.textContent = "Size " + parsed.size + " isn't in the " + RULESETS[this.rulesetTarget.value].name + " table";
      return;
    }
    fillSizeSelect(this.planetSizeTarget, this.rulesetTarget.value, size.code);
    if (this.planetSizeTarget.value !== size.code) this.planetSizeTarget.value = "";
    this.radiusTarget.value = size.diameter / 2;
    this.uwpNoteTarget.textContent = (parsed.uwp ? parsed.uwp + " · " : "") + "size " + size.code + " → " +
      this.format(size.diameter) + " km" + (size.gravity ? ", " + size.gravity + " G" : "") +
      (size.beyondTable ? " (extrapolated)" : "");
    this.setSize();
    if (!this.planetSizeTarget.value) this.syncMass();
  }

  // Typing a radius by hand detaches it from the world-size code.
  customRadius() {
    this.planetSizeTarget.value = "";
    this.syncMass();
  }
  holdMass() { this.held = "mass"; this.syncMass() }
  holdGravity() { this.held = "gravity"; this.syncMass() }
  holdDensity() { this.held = "density"; this.syncMass() }

  useBody(event) {
    var body = BODIES[event.currentTarget.dataset.index];
    this.massTarget.value = body.mass;
    this.radiusTarget.value = body.radius;
    this.rotationPeriodTarget.value = body.hours;
    this.parentMassTarget.value = body.parent[0];
    this.parentUnitTarget.value = body.parent[1];
    this.distanceTarget.value = body.distance[0];
    this.distanceUnitTarget.value = body.distance[1];
    this.planetSizeTarget.value = "";
    this.uwpTarget.value = "";
    this.uwpNoteTarget.textContent = "Loaded " + body.name;
    this.held = "mass";
    this.syncMass();
  }

  // Keep mass, gravity and density consistent, deriving the other two from the held one.
  syncMass() {
    var radius = this.num(this.radiusTarget);
    var mass;
    if (this.held === "gravity") mass = this.massFromGravity(this.num(this.gravityTarget), radius);
    else if (this.held === "density") mass = this.massFromDensity(this.num(this.densityTarget), radius);
    else mass = this.num(this.massTarget);

    if (this.held !== "mass") this.massTarget.value = this.trim(mass, 4);
    if (this.held !== "gravity") this.gravityTarget.value = this.trim(this.gravityOf(mass, radius), 3);
    if (this.held !== "density") this.densityTarget.value = this.trim(this.densityOf(mass, radius), 2);
    this.heldNoteTarget.textContent = "Holding " + this.held + " fixed when the size changes · " +
      this.format(mass / this.EARTH_MASS, 3) + " Earth masses";
    this.calculate();
  }

  calculate() {
    var mass = this.num(this.massTarget);
    var radius = this.num(this.radiusTarget);
    var hours = this.num(this.rotationPeriodTarget);
    var orbit = this.syncOrbit(mass, radius, hours);
    var mu = this.G_CONSTANT * mass * 1e24 / 1e9; // km^3/s^2
    var above = orbit.semiMajor > radius && radius > 0;

    this.daysTarget.textContent = this.format(hours / 24, 2);

    // Headline and stability.
    var hill = this.hillRadius(mass, this.parentMass(), this.distanceKm());
    var status = this.stability(orbit.semiMajor, radius, hill);
    this.altitudeTarget.textContent = this.format(orbit.altitude);
    this.statusTarget.textContent = status.label;
    this.statusTarget.dataset.status = status.key;
    this.radiiTarget.textContent = above
      ? this.format(orbit.altitude / radius, 2) + " planet radii above the surface. " + status.note
      : status.note;

    // Orbit.
    this.semiMajorTarget.textContent = this.format(orbit.semiMajor);
    this.speedTarget.textContent = this.format(orbit.speed, 2);
    this.speedKmhTarget.textContent = this.format(orbit.speed * 3600) + " km/h";
    this.lagTarget.textContent = this.format(Math.max(orbit.altitude, 0) / this.C_KM * 1000, 1);
    this.hillTarget.textContent = isFinite(hill) ? this.format(hill) : "—";
    this.hillNoteTarget.textContent = isFinite(hill) && above
      ? "orbit sits at " + this.format(orbit.semiMajor / hill * 100) + "% of it"
      : "set the parent body below";

    // Delta-v: escape, and an ideal equatorial launch plus Hohmann transfer to sync orbit.
    var escape = radius > 0 ? Math.sqrt(2 * mu / radius) : 0;
    this.escapeTarget.textContent = this.format(escape, 2);
    if (above) {
      var r1 = radius, r2 = orbit.semiMajor;
      var perigee = Math.sqrt(mu / r1) * Math.sqrt(2 * r2 / (r1 + r2));
      var spin = 2 * Math.PI * r1 / (hours * 3600);
      var circularize = Math.sqrt(mu / r2) * (1 - Math.sqrt(2 * r1 / (r1 + r2)));
      this.deltaVTarget.textContent = this.format(Math.max(perigee - spin, 0) + circularize, 2);
      this.deltaVNoteTarget.textContent = "ideal; no drag or gravity losses";
    } else {
      this.deltaVTarget.textContent = "—";
      this.deltaVNoteTarget.textContent = "no synchronous orbit";
    }

    // Coverage from one satellite, down to the horizon.
    if (above) {
      var halfAngle = Math.acos(radius / orbit.semiMajor) * 180 / Math.PI;
      this.latitudeTarget.textContent = this.format(halfAngle, 1);
      this.ringTarget.textContent = Math.ceil(360 / (2 * halfAngle));
    } else {
      this.latitudeTarget.textContent = "—";
      this.ringTarget.textContent = "—";
    }

    this.drawOrbit(radius, orbit.semiMajor);
  }

  // Planet and orbit to scale in a 260×260 SVG; the larger of the two fills the frame.
  drawOrbit(radius, semiMajor) {
    var scale = 120 / Math.max(radius, semiMajor, 1);
    var orbitR = semiMajor * scale;
    this.orbitRingTarget.setAttribute("r", orbitR.toFixed(1));
    this.planetDiscTarget.setAttribute("r", Math.max(radius * scale, 2).toFixed(1));
    this.satelliteTarget.setAttribute("cy", (130 - orbitR).toFixed(1));
  }

  renderBodies() {
    var parentMass = { sun: SUN_MASS, jupiter: JUPITER_MASS };
    this.bodiesTarget.innerHTML = BODIES.map((body, i) => {
      var orbit = this.syncOrbit(body.mass, body.radius, body.hours);
      var distance = body.distance[0] * (body.distance[1] === "au" ? KM_PER_AU : 1);
      var hill = this.hillRadius(body.mass, body.parent[0] * parentMass[body.parent[1]], distance);
      var status = this.stability(orbit.semiMajor, body.radius, hill);
      return "<tr>" +
        "<td>" + body.name + "</td>" +
        "<td>" + body.mass + "</td>" +
        "<td>" + body.volume + "</td>" +
        "<td>" + this.format(body.radius) + "</td>" +
        "<td>" + body.hours + "</td>" +
        "<td class='accent'>" + this.format(orbit.altitude) + "</td>" +
        "<td>" + this.format(orbit.semiMajor) + "</td>" +
        "<td>" + this.format(orbit.speed, 2) + "</td>" +
        "<td><span class='status' data-status='" + status.key + "'>" + status.label + "</span></td>" +
        "<td><button type='button' class='ghost' data-index='" + i + "'" +
        " data-action='orbital-calculator#useBody' aria-label='Use " + body.name + "'>Use</button></td>" +
        "</tr>";
    }).join("");
  }
});
