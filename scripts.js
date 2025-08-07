// scripts.js

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const setup = document.getElementById("setup");
  const timerScreen = document.getElementById("timerScreen");
  const timerTitle = document.getElementById("timer-title");
  const timerDisplay = document.getElementById("timer");
  const percentage = document.getElementById("percentage");
  const progressBar = document.getElementById("progress-bar");
  const restartBtn = document.getElementById("restart");
  const colorPickerToggle = document.getElementById("color-picker-toggle");

  let savedColor = localStorage.getItem("userColor") || "cyan";
  applyColor(savedColor);

  const pickr = Pickr.create({
    el: "#color-picker-anchor",
    container: "#color-picker-wrapper", // 👈 ADD THIS
    theme: "nano",
    default: savedColor,
    components: {
      preview: true,
      opacity: false,
      hue: true,
      interaction: {
        hex: true,
        input: true,
        save: true,
      },
    },
  });

  // Show on click
  colorPickerToggle.addEventListener("click", () => {
    pickr.show();
  });

  // Live preview while dragging the picker
  pickr.on("change", (color) => {
    const hex = color.toHEXA().toString();
    previewColor(hex); // 👈 Apply without saving
  });

  // Save and apply color
  pickr.on("save", (color) => {
    const hex = color.toHEXA().toString();
    savedColor = hex;
    applyColor(hex);
    pickr.hide();
  });

  pickr.on("hide", () => {
    applyColor(savedColor); // 👈 revert to last saved color
  });

  function previewColor(color) {
    document.querySelector("#progress-bar").style.backgroundColor = color;
    document.querySelector("button").style.backgroundColor = color;
    document.querySelectorAll('input[type="text"]').forEach((input) => {
      input.style.borderBottom = `2px solid ${color}`;
    });
  }

  let totalSeconds = 0;
  let elapsed = 0;
  let interval;

  function parseTime(input) {
    const str = input.toLowerCase();
    let seconds = 0;
    const hrMatch = str.match(/(\d+)\s*hour/);
    const minMatch = str.match(/(\d+)\s*min/);
    const secMatch = str.match(/(\d+)\s*sec/);
    if (hrMatch) seconds += parseInt(hrMatch[1]) * 3600;
    if (minMatch) seconds += parseInt(minMatch[1]) * 60;
    if (secMatch) seconds += parseInt(secMatch[1]);
    if (!hrMatch && !minMatch && !secMatch) seconds = parseInt(str) * 60;
    return seconds;
  }

  function formatTime(secs) {
    const h = String(Math.floor(secs / 3600)).padStart(2, "0");
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function updateTimer() {
    elapsed += 0.1;
    const remaining = totalSeconds - elapsed;
    timerDisplay.textContent = formatTime(Math.max(0, Math.floor(remaining)));
    const percent = Math.min((elapsed / totalSeconds) * 100, 100);
    percentage.textContent = percent.toFixed(1) + "%";
    progressBar.style.width = percent + "%";
    if (elapsed >= totalSeconds) clearInterval(interval);
  }

  function startTimer() {
    const title = document.getElementById("titleInput").value;
    const timeInput = document.getElementById("timeInput").value;
    totalSeconds = parseTime(timeInput);
    elapsed = 0;

    if (totalSeconds <= 0) return;

    timerTitle.textContent = title;
    setup.classList.add("hidden");
    timerScreen.classList.remove("hidden");
    restartBtn.style.display = "block";
    updateTimer();
    interval = setInterval(updateTimer, 100);
  }

  startBtn.addEventListener("click", startTimer);
  restartBtn.addEventListener("click", () => location.reload());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startTimer();
  });

  document.querySelectorAll("input").forEach((input) => {
    const originalPlaceholder = input.placeholder;

    input.addEventListener("focus", () => {
      input.placeholder = "";
    });

    input.addEventListener("blur", () => {
      if (input.value.trim() === "") {
        input.placeholder = originalPlaceholder;
      }
    });
  });

  function applyColor(color) {
    document.querySelector("#progress-bar").style.backgroundColor = color;
    document.querySelector("button").style.backgroundColor = color;
    document.querySelectorAll('input[type="text"]').forEach((input) => {
      input.style.borderBottom = `2px solid ${color}`;
    });
    localStorage.setItem("userColor", color);
  }
});
