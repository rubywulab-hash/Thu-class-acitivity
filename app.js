const DURATIONS = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const MODE_LABELS = {
  focus: "專注中",
  short: "短休息",
  long: "長休息",
};

const timerDisplay = document.querySelector("#timerDisplay");
const timerLabel = document.querySelector("#timerLabel");
const sessionCount = document.querySelector("#sessionCount");
const toggleButton = document.querySelector("#toggleButton");
const resetButton = document.querySelector("#resetButton");
const skipButton = document.querySelector("#skipButton");
const soundButton = document.querySelector("#soundButton");
const themeButton = document.querySelector("#themeButton");
const progressRing = document.querySelector(".progress-value");
const progressDots = [...document.querySelectorAll(".progress-dot")];
const completedCount = document.querySelector("#completedCount");
const modeTabs = [...document.querySelectorAll(".mode-tab")];

let currentMode = "focus";
let remainingSeconds = DURATIONS.focus;
let isRunning = false;
let intervalId = null;
let completedSessions = 0;
let soundEnabled = true;

const ringCircumference = 2 * Math.PI * 150;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateDisplay() {
  const formatted = formatTime(remainingSeconds);
  timerDisplay.textContent = formatted;
  timerDisplay.dateTime = `PT${remainingSeconds}S`;

  const elapsedRatio = 1 - remainingSeconds / DURATIONS[currentMode];
  progressRing.style.strokeDashoffset = String(ringCircumference * elapsedRatio);
  document.title = `${formatted} - ${MODE_LABELS[currentMode]}`;

  if (currentMode === "focus") {
    sessionCount.textContent = `第 ${completedSessions % 4 + 1} 個番茄鐘`;
  } else {
    sessionCount.textContent = MODE_LABELS[currentMode];
  }
}

function playChime() {
  if (!soundEnabled) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.8);
  gain.connect(context.destination);

  [523.25, 659.25].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(context.currentTime + index * 0.12);
    oscillator.stop(context.currentTime + 0.8);
  });
}

function stopTimer() {
  isRunning = false;
  window.clearInterval(intervalId);
  intervalId = null;
  toggleButton.classList.remove("running");
  toggleButton.setAttribute("aria-label", "開始計時");
}

function startTimer() {
  isRunning = true;
  toggleButton.classList.add("running");
  toggleButton.setAttribute("aria-label", "暫停計時");

  intervalId = window.setInterval(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      updateDisplay();
      stopTimer();
      completeSession();
      return;
    }

    updateDisplay();
  }, 1000);
}

function completeSession() {
  playChime();

  if (currentMode === "focus") {
    completedSessions += 1;
    updateCompletedProgress();
    selectMode(completedSessions % 4 === 0 ? "long" : "short");
  } else {
    selectMode("focus");
  }
}

function updateCompletedProgress() {
  const completedInCycle = completedSessions % 4;
  progressDots.forEach((dot, index) => {
    dot.classList.toggle("complete", index < completedInCycle);
  });
  completedCount.textContent = `${completedInCycle} / 4`;
}

function selectMode(mode) {
  stopTimer();
  currentMode = mode;
  remainingSeconds = DURATIONS[mode];

  modeTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });

  timerLabel.textContent = MODE_LABELS[mode];
  updateDisplay();
}

toggleButton.addEventListener("click", () => {
  if (isRunning) {
    stopTimer();
  } else {
    if (remainingSeconds <= 0) {
      remainingSeconds = DURATIONS[currentMode];
    }
    startTimer();
  }
});

resetButton.addEventListener("click", () => {
  selectMode(currentMode);
});

skipButton.addEventListener("click", () => {
  if (currentMode === "focus") {
    completedSessions += 1;
    updateCompletedProgress();
    selectMode(completedSessions % 4 === 0 ? "long" : "short");
  } else {
    selectMode("focus");
  }
});

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => selectMode(tab.dataset.mode));
});

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.classList.toggle("muted", !soundEnabled);
  soundButton.setAttribute("aria-label", soundEnabled ? "關閉提示音" : "開啟提示音");
});

themeButton.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  themeButton.classList.toggle("dark", isDark);
  themeButton.setAttribute("aria-label", isDark ? "切換淺色模式" : "切換深色模式");
  window.localStorage.setItem("pomodoro-theme", isDark ? "dark" : "light");
});

if (window.localStorage.getItem("pomodoro-theme") === "dark") {
  document.body.classList.add("dark");
  themeButton.classList.add("dark");
  themeButton.setAttribute("aria-label", "切換淺色模式");
}

progressRing.style.strokeDasharray = String(ringCircumference);
progressRing.style.strokeDashoffset = "0";
updateDisplay();
