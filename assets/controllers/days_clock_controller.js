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
    const endDate = new Date(this.countdownTarget.dataset.clockCountdownDate);
    this.countdownInterval = setInterval(() => {
      const now = new Date();
      const difference = endDate - now;
      this.countdownTarget.textContent = this.formatDecimalTime(difference);
    }, 100);
  }

  startCountup() {
    const startDate = new Date(this.countupTarget.dataset.clockCountupDate);
    this.countupInterval = setInterval(() => {
      const now = new Date();
      const difference = now - startDate;
      this.countupTarget.textContent = this.formatDecimalTime(difference);
    }, 100);
  }
  formatDecimalTime(difference) {
    // Total seconds in a day
    const secondsInDay = 86400; // 24 hours * 60 minutes * 60 seconds

    // Calculate the total seconds difference
    const totalSeconds = difference / 1000; // Convert milliseconds to seconds

    // Calculate the decimal day value
    const decimalDay = totalSeconds / secondsInDay;

    // Format the decimal day to show up to 6 decimal places for precision
    const formattedDecimalDay = decimalDay.toFixed(6); // Adjust decimal places as needed

    // Compute days separately
    let days = Math.floor(difference / (1000 * 60 * 60 * 24));

    // Return formatted string combining days and the decimal of the day
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
    clearInterval(this.countdownInterval);
    clearInterval(this.countupInterval);
  }
});