import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = Application.start()
// Connects to data-controller="travel-calculator"
Stimulus.register("travel-calculator", class extends Controller {
  static targets = [
    // inputs
    "acceleration",
    "chip",
    "distance",
    "distanceAU",
    "flyButton",
    "fuelConversionRate",
    "planetSize",
    "spaceshipMass",
    "stopButton",
    // distance readouts
    "cables",
    "limit",
    "rods",
    "roemers",
    // results
    "accDur",
    "accPhase",
    "area",
    "burnNote",
    "burnTime",
    "coastDur",
    "coastPhase",
    "curve",
    "decDur",
    "decPhase",
    "decimal",
    "deltaV",
    "deltaVNote",
    "dilation",
    "distSummary",
    "distanceLs",
    "driveName",
    "fuelConsumed",
    "lightFraction",
    "maxVelocity",
    "observerTime",
    "peakShort",
    "profileNote",
    "thrust",
    "thrustNote",
    "timeParts",
    "totalShort",
    "turnLabel",
    "turnLine",
  ]
  SPEED_OF_LIGHT = 299792458;       // m/sec
  C_KM = 299792.458                 // km/sec
  ACCELERATION_IN_G = 0.0098        // km/sec^2
  // Hard speed limit: never exceed 1% of light speed, no matter the distance.
  // Once reached, the ship stops accelerating and coasts.
  VELOCITY_CAP_FRACTION = 0.01
  KM_PER_AU = 149597870.700
  // Roemetric measures. The base unit (Roemer) is one light-second, approximated
  // in meters behind the scenes so the breakdown adjusts with the other settings.
  // 1 Roemer = 1 light-second = 20 Rods; 1 Rod = 12 Cables.
  ROEMER_IN_METERS = 299792458 // == SPEED_OF_LIGHT, one light-second
  RODS_PER_ROEMER = 20
  CABLES_PER_ROD = 12
  // Fuel Conversion Rate is HALF whatever is said in TNE: Fire, Fusion & Steel.
  // FUEL_CONVERSION_RATE = 0.00125; // HEPlaR
  FUEL_CONVERSION_RATE = 0.0025; // M-Drive

  // =================================================================================================
  // Connect: Called when the controller is connected to the DOM.
  connect() {
    this.flyPast = false;
    this.showLimit();
    // Populate every derived distance (AU, Roemetric) from the default km value,
    // then run the flight calculation.
    this.setDistanceFromKM();
  }

  // =================================================================================================
  // Helper Functions
  num(target) { var n = parseFloat(target.value); return isFinite(n) ? n : 0 }
  gees() { return this.num(this.accelerationTarget) }
  acceleration() { return this.gees() * this.ACCELERATION_IN_G }
  km() { return this.num(this.distanceTarget) }
  format(n) { return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") }
  fuel_conversion_rate() { return this.fuelConversionRateTarget.value }

  // Imperial seconds as metric days.cycles.beats (1 metric second = 0.864 s).
  secondsToCycles(imperialSeconds) {
    var metricSeconds = Math.ceil(imperialSeconds / 0.864);
    var days = Math.floor(metricSeconds / 100000)
    var cycles = Math.floor((metricSeconds % 100000) / 10000);
    var beats = Math.floor(metricSeconds % (10000) / 100);
    return days + "." + cycles + "." + String(beats).padStart(2, "0");
  }
  dhms(seconds) {
    return {
      d: Math.floor(seconds / 86400),
      h: Math.floor(seconds % 86400 / 3600),
      m: Math.floor(seconds % 3600 / 60),
      s: Math.floor(seconds % 60),
    }
  }
  secondsToDhms(seconds) {
    var t = this.dhms(seconds);
    var dDisplay = t.d > 0 ? t.d + (t.d == 1 ? " day, " : " days, ") : "";
    var hDisplay = t.h > 0 ? t.h + (t.h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = t.m > 0 ? t.m + (t.m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = t.s > 0 ? t.s + (t.s == 1 ? " second" : " seconds") : "";
    var result = dDisplay + hDisplay + mDisplay + sDisplay;
    return result.replace(/, $/, "") || "0 seconds"
  }
  // Two most significant units, e.g. "2h 48m".
  shortDuration(seconds) {
    var t = this.dhms(seconds);
    if (t.d > 0) return t.d + "d " + t.h + "h";
    if (t.h > 0) return t.h + "h " + t.m + "m";
    if (t.m > 0) return t.m + "m " + t.s + "s";
    return t.s + "s";
  }
  // Three most significant units as [number, unit] pairs for the big readout.
  timeParts(seconds) {
    var t = this.dhms(seconds);
    if (t.d > 0) return [[t.d, "d"], [t.h, "h"], [t.m, "m"]];
    if (t.h > 0) return [[t.h, "h"], [t.m, "m"], [t.s, "s"]];
    if (t.m > 0) return [[t.m, "m"], [t.s, "s"]];
    return [[t.s, "s"]];
  }
  smallTime(seconds) {
    if (seconds < 1e-3) return (seconds * 1e6).toFixed(1) + " µs";
    if (seconds < 1) return (seconds * 1e3).toFixed(1) + " ms";
    if (seconds < 60) return seconds.toFixed(2) + " s";
    return this.secondsToDhms(seconds);
  }

  // =================================================================================================
  // Actions
  showLimit() { this.limitTarget.textContent = this.format(this.planetSizeTarget.value * 100) }
  use100D() {
    this.distanceTarget.value = this.planetSizeTarget.value * 100;
    this.setDistanceFromKM();
  }
  pickG(event) {
    this.accelerationTarget.value = event.currentTarget.dataset.g;
    this.calculate();
  }
  pickStop() { this.flyPast = false; this.calculate() }
  pickFly() { this.flyPast = true; this.calculate() }

  // =================================================================================================
  // Setters: Calculate values from other fields.
  setDistanceFromKM() {
    var km = this.km();
    this.setAU(km);
    this.setRoemetric(km);
    this.calculate();
  }
  setDistanceFromAU() {
    var km = this.num(this.distanceAUTarget) * this.KM_PER_AU;
    this.distanceTarget.value = Math.round(km);
    this.setRoemetric(km);
    this.calculate();
  }
  setAU(km) {
    var au = km / this.KM_PER_AU;
    this.distanceAUTarget.value = au < 1 ? parseFloat(au.toPrecision(4)) : parseFloat(au.toFixed(3));
  }
  // Meters in one Rod / one Cable, derived from the Roemer so they stay in sync.
  rodInMeters() { return this.ROEMER_IN_METERS / this.RODS_PER_ROEMER }
  cableInMeters() { return this.rodInMeters() / this.CABLES_PER_ROD }
  setRoemetric(km) {
    // Work in meters so the unit sizes stay approximate, then split the distance
    // into whole Roemers, Rods, and Cables.
    var meters = km * 1000;
    var roemerTotal = meters / this.ROEMER_IN_METERS;
    var roemers = Math.floor(roemerTotal);
    var rodTotal = (roemerTotal - roemers) * this.RODS_PER_ROEMER;
    var rods = Math.floor(rodTotal);
    var cables = Math.round((rodTotal - rods) * this.CABLES_PER_ROD);
    // Carry rounded-up cables/rods so we never display the unit maximum.
    if (cables >= this.CABLES_PER_ROD) { cables -= this.CABLES_PER_ROD; rods += 1; }
    if (rods >= this.RODS_PER_ROEMER) { rods -= this.RODS_PER_ROEMER; roemers += 1; }
    this.roemersTarget.textContent = this.format(roemers);
    this.rodsTarget.textContent = rods;
    this.cablesTarget.textContent = cables;
  }

  // =================================================================================================
  // Calculations
  // Speed cap expressed in km/sec (matches the km/sec^2 acceleration).
  velocityCap() { return this.VELOCITY_CAP_FRACTION * this.C_KM }

  // Newtonian flight profile. The 1% c cap keeps relativistic effects negligible,
  // so this stays accurate while covering both flight modes plus the coast phase.
  // Returns phase durations in seconds and the peak velocity in km/sec.
  kinematics() {
    var a = this.acceleration();  // km/sec^2
    var d = this.km();            // km
    var none = { acc: 0, coast: 0, dec: 0, time: 0, maxVelocity: 0 };
    if (!(a > 0) || !(d > 0)) return none;

    var vCap = this.velocityCap();
    var tRamp = vCap / a;                 // time to spin up to the cap
    var dRamp = (vCap * vCap) / (2 * a);  // distance covered in one ramp
    var p;

    if (!this.flyPast) {
      // Accelerate to the midpoint, then decelerate to rest.
      var vPeak = Math.sqrt(a * d);
      if (vPeak <= vCap) {
        var half = Math.sqrt(d / a);
        p = { acc: half, coast: 0, dec: half, maxVelocity: vPeak };
      } else {
        // Capped: ramp up, coast at the cap, ramp down.
        p = { acc: tRamp, coast: (d - 2 * dRamp) / vCap, dec: tRamp, maxVelocity: vCap };
      }
    } else {
      // Accelerate the whole way and fly past at full speed.
      var vFinal = Math.sqrt(2 * a * d);
      if (vFinal <= vCap) {
        p = { acc: Math.sqrt(2 * d / a), coast: 0, dec: 0, maxVelocity: vFinal };
      } else {
        // Capped: ramp up, then coast at the cap to the destination.
        p = { acc: tRamp, coast: (d - dRamp) / vCap, dec: 0, maxVelocity: vCap };
      }
    }
    p.time = p.acc + p.coast + p.dec;
    return p;
  }

  // How far the ship's clock falls behind the observer's. At these speeds
  // dτ ≈ v²/2c² dt; a linear ramp to v over t integrates to v²t/6c².
  timeDilation(p) {
    var beta2 = Math.pow(p.maxVelocity / this.C_KM, 2);
    return beta2 * ((p.acc + p.dec) / 6 + p.coast / 2);
  }

  calcFuelMass(maxVelocity) {
    // Liquid Hydrogen weighs 71kg
    // HEPlaR is 0.25 cubic meter of liquid hydrogen per Megawatt Hour

    // This is a more scientific calculation.
    var mass = this.num(this.spaceshipMassTarget) * 1000; // Mass in Metric tons to KGs
    var vel_to_c = maxVelocity / this.SPEED_OF_LIGHT;
    var per_kg_100percent = 2 * vel_to_c / (1 - vel_to_c);
    return per_kg_100percent * mass / this.fuel_conversion_rate();
  }

  calculate() {
    var p = this.kinematics();
    var seconds = Math.floor(p.time);
    var v = p.maxVelocity;
    var km = this.km();
    var tons = this.num(this.spaceshipMassTarget);

    // Inputs reflect state.
    this.chipTargets.forEach(chip =>
      chip.setAttribute("aria-pressed", parseFloat(chip.dataset.g) === this.gees()));
    this.stopButtonTarget.setAttribute("aria-pressed", !this.flyPast);
    this.flyButtonTarget.setAttribute("aria-pressed", this.flyPast);
    var note = this.flyPast
      ? "Keep accelerating the whole way and fly past the destination at full speed."
      : "Flip at the midpoint and brake to a full stop at the destination.";
    if (p.coast > 0) note += " Hits the 1% light cap and coasts for " + this.shortDuration(p.coast) + ".";
    this.profileNoteTarget.textContent = note;

    // Travel time.
    this.timePartsTarget.innerHTML = this.timeParts(seconds)
      .map(([n, u]) => "<span><span class='n'>" + n + "</span><span class='u'>" + u + "</span></span>")
      .join("");
    this.decimalTarget.textContent = this.secondsToCycles(seconds);
    this.peakShortTarget.textContent = v.toFixed(1) + " km/s";
    this.totalShortTarget.textContent = this.shortDuration(seconds);
    this.drawProfile(p);

    // Stats.
    this.maxVelocityTarget.textContent = v.toFixed(2);
    this.lightFractionTarget.textContent = (v / this.C_KM * 100).toFixed(3) + "% of light";
    this.deltaVTarget.textContent = (this.flyPast ? v : 2 * v).toFixed(1);
    this.deltaVNoteTarget.textContent = this.flyPast ? "accelerate only" : "accelerate + brake";
    this.fuelConsumedTarget.textContent = this.format(this.calcFuelMass(v));
    var drive = this.fuelConversionRateTarget;
    this.driveNameTarget.textContent = drive.options[drive.selectedIndex].text;
    this.burnTimeTarget.textContent = this.shortDuration(p.acc + p.dec);
    this.burnNoteTarget.textContent = p.coast > 0
      ? "coasting " + this.shortDuration(p.coast)
      : "thrusting the whole way";
    this.thrustTarget.textContent = this.format(tons * this.acceleration() * 1000);
    this.thrustNoteTarget.textContent = this.format(tons) + " t at " + this.gees() + " G";
    var lag = km / this.C_KM;
    this.distanceLsTarget.textContent = lag < 100 ? lag.toFixed(2) : this.format(lag);

    // Summary.
    this.observerTimeTarget.textContent = this.secondsToDhms(seconds);
    this.dilationTarget.textContent = this.smallTime(this.timeDilation(p));
    this.distSummaryTarget.textContent =
      (km / 1e6).toFixed(3) + " Gm · " + parseFloat((km / this.KM_PER_AU).toPrecision(3)) + " AU";
  }

  // Velocity-over-time chart (SVG viewBox 1000×200) plus the phase bar below it.
  drawProfile(p) {
    var T = p.time || 1;
    var x = t => (t / T * 1000).toFixed(1);
    var top = p.maxVelocity > 0 ? 0 : 200;
    var pts = [[0, 200], [x(p.acc), top]];
    if (this.flyPast) pts.push([1000, top]);
    else pts.push([x(p.acc + p.coast), top], [1000, 200]);
    var line = pts.map(pt => pt.join(",")).join(" ");
    this.curveTarget.setAttribute("points", line);
    this.areaTarget.setAttribute("points", line + (this.flyPast ? " 1000,200" : ""));

    // Turnover marker: where braking begins.
    var showTurn = !this.flyPast && p.time > 0;
    var turnAt = p.acc + p.coast;
    var left = turnAt / T * 100;
    this.turnLineTarget.style.display = showTurn ? "" : "none";
    this.turnLineTarget.setAttribute("x1", x(turnAt));
    this.turnLineTarget.setAttribute("x2", x(turnAt));
    this.turnLabelTarget.style.display = showTurn ? "" : "none";
    this.turnLabelTarget.style.left = left + "%";
    this.turnLabelTarget.style.transform = left > 70 ? "translateX(calc(-100% - 8px))" : "";
    this.turnLabelTarget.textContent = "turnover · T+" + this.shortDuration(turnAt);

    [[this.accPhaseTarget, this.accDurTarget, p.acc],
     [this.coastPhaseTarget, this.coastDurTarget, p.coast],
     [this.decPhaseTarget, this.decDurTarget, p.dec]].forEach(([bar, label, t]) => {
      bar.style.display = t > 0 ? "" : "none";
      bar.style.flexGrow = t;
      label.textContent = this.shortDuration(t);
    });
  }
});
