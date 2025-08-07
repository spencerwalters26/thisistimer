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

  const savedColor = localStorage.getItem("userColor") || "cyan";
  applyColor(savedColor);

  let previewColor = null;

  const pickr = Pickr.create({
    el: "#color-picker-anchor",
    container: "#color-picker-wrapper",
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
        cancel: true,
      },
    },
  });

  // Toggle Pickr
  colorPickerToggle.addEventListener("click", () => {
    pickr.show();
  });

  // On color change (live preview only)
  pickr.on("change", (color) => {
    previewColor = color.toHEXA().toString();
    applyColor(previewColor);
  });

  // On save → store and apply
  pickr.on("save", (color) => {
    const hex = color.toHEXA().toString();
    localStorage.setItem("userColor", hex);
    applyColor(hex);
    pickr.hide();
  });

  // On cancel → revert preview to saved color
  pickr.on("cancel", () => {
    applyColor(localStorage.getItem("userColor") || "cyan");
    pickr.hide();
  });

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
  }
});
