import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"
window.Stimulus = Application.start()

// Connects to data-controller="days-clock"
Stimulus.register("days-clock", class extends Controller {
  static targets = ["countdown", "countup"];

  connect() {
    this.startCountdown();
    this.startCountup();
  }

  startCountdown() {
    this.countdownTargets.forEach(target => {
      console.log()
      const endDate = new Date(target.dataset.clockCountdownDate);
      target.countdownInterval = setInterval(() => {
        const now = new Date();
        const difference = endDate - now;
        target.textContent = this.formatDecimalTime(difference);
      }, 100);
    });
  }

  startCountup() {
    this.countupTargets.forEach(target => {
      const startDate = new Date(target.dataset.clockCountupDate);
      target.countupInterval = setInterval(() => {
        const now = new Date();
        const difference = now - startDate;
        target.textContent = this.formatDecimalTime(difference);
      }, 100);
    });
  }

  formatDecimalTime(difference) {
    const decimalDay = difference / (86400 * 1000);
    const formattedDecimalDay = decimalDay.toFixed(5); // Adjust decimal places as needed
    return `${formattedDecimalDay}`;
  }

  formatTime(difference) {
    // Calculate the time components
    let days = Math.floor(difference / (1000 * 60 * 60 * 24));
    let hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((difference % (1000 * 60)) / 1000);
    let milliseconds = difference % 1000;
    let hundredths = Math.floor(milliseconds / 10); // Convert milliseconds to hundredths of a second

    // Format the time string with leading zeros where necessary
    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');
    hundredths = String(hundredths).padStart(2, '0');

    return `${days} ${hours}:${minutes}:${seconds}`;
  }

  disconnect() {
    this.countdownTargets.forEach(target => {
      clearInterval(target.countdownInterval);
    });
    this.countupTargets.forEach(target => {
      clearInterval(target.countupInterval);
    });
  }
});