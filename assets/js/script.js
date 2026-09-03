// ==========================================================================
// Windows XP Luna Desktop Interactive System
// ==========================================================================

const desktopWindows = document.querySelectorAll(".window");
const folderButtons = document.querySelectorAll(".folder-button:not(.desktop-link)");
const taskButtons = document.querySelectorAll(".task-button");
const menuItems = document.querySelectorAll(".menu-item:not(.menu-link)");
const dots = document.querySelectorAll(".dot");
const slides = document.querySelectorAll(".project-slide");
const startButton = document.querySelector(".start-button");
const startMenu = document.querySelector(".start-menu");
const bootScreen = document.getElementById("bootScreen");
const clockEl = document.getElementById("clock");
const winControls = document.querySelectorAll(".win-btn");

let currentSlide = 0;
let audioContextInstance = null;

// Helper to get or resume Web Audio Context safely
const getAudioContext = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContextInstance) {
    audioContextInstance = new AudioContextClass();
  }
  if (audioContextInstance.state === "suspended") {
    audioContextInstance.resume().catch(() => {});
  }
  return audioContextInstance;
};

// Play realistic XP-like short click
const playClickSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = 720;
    gainNode.gain.value = 0.0001;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
    oscillator.stop(ctx.currentTime + 0.07);
  } catch {
    // Audio policies handled silently
  }
};

// Play chord startup sound
const playStartupSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5 major chord

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.value = 0.0001;

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = ctx.currentTime + idx * 0.12;
      osc.start(startTime);
      gain.gain.exponentialRampToValueAtTime(0.09, startTime + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.55);
      osc.stop(startTime + 0.58);
    });
  } catch {
    // Audio policies handled silently
  }
};

// Window Management
const openWindow = (targetId) => {
  desktopWindows.forEach((win) => {
    const isActive = win.id === targetId;
    win.classList.toggle("active", isActive);
    if (isActive) {
      // Bring to top
      win.style.zIndex = "15";
    } else {
      win.style.zIndex = "10";
    }
  });

  folderButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.window === targetId);
  });

  taskButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.window === targetId);
  });

  if (startMenu) {
    startMenu.classList.add("hidden");
    if (startButton) startButton.setAttribute("aria-expanded", "false");
  }
};

// Folder Button clicks
folderButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    playClickSound();
    openWindow(btn.dataset.window);
  });
});

// Taskbar buttons (toggles minimize if active, opens if inactive)
taskButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    playClickSound();
    const targetId = btn.dataset.window;
    const win = document.getElementById(targetId);

    if (win && win.classList.contains("active")) {
      win.classList.remove("active");
      btn.classList.remove("is-active");
    } else {
      openWindow(targetId);
    }
  });
});

// Start menu items
menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    playClickSound();
    openWindow(item.dataset.window);
  });
});

// Start Button Toggle
if (startButton && startMenu) {
  startButton.addEventListener("click", (e) => {
    e.stopPropagation();
    playClickSound();
    const isHidden = startMenu.classList.toggle("hidden");
    startButton.setAttribute("aria-expanded", isHidden ? "false" : "true");
  });
}

// Window Titlebar Controls (Minimize, Maximize, Close)
winControls.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    playClickSound();
    const action = btn.dataset.action;
    const win = btn.closest(".window");
    if (!win) return;

    if (action === "minimize") {
      win.classList.remove("active");
      const taskBtn = document.querySelector(`.task-button[data-window="${win.id}"]`);
      if (taskBtn) taskBtn.classList.remove("is-active");
    } else if (action === "maximize") {
      win.classList.toggle("is-maximized");
    } else if (action === "close") {
      win.classList.remove("active");
      win.classList.remove("is-maximized");
      const taskBtn = document.querySelector(`.task-button[data-window="${win.id}"]`);
      if (taskBtn) taskBtn.classList.remove("is-active");
      const folderBtn = document.querySelector(`.folder-button[data-window="${win.id}"]`);
      if (folderBtn) folderBtn.classList.remove("active");
    }
  });
});

// Project Carousel Management
const showSlide = (index) => {
  if (!slides.length) return;
  currentSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, idx) => {
    slide.classList.toggle("is-active", idx === currentSlide);
  });

  dots.forEach((dot, idx) => {
    dot.classList.toggle("is-active", idx === currentSlide);
  });
};

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    playClickSound();
    showSlide(index);
  });
});

const prevBtn = document.querySelector(".carousel-nav.prev");
const nextBtn = document.querySelector(".carousel-nav.next");

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    playClickSound();
    showSlide(currentSlide - 1);
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    playClickSound();
    showSlide(currentSlide + 1);
  });
}

// System Tray Clock
const updateClock = () => {
  if (!clockEl) return;
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

updateClock();
setInterval(updateClock, 10000);

// Close start menu when clicking outside
document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (
    startMenu &&
    !startMenu.classList.contains("hidden") &&
    !target.closest(".start-menu") &&
    !target.closest(".start-button")
  ) {
    startMenu.classList.add("hidden");
    if (startButton) startButton.setAttribute("aria-expanded", "false");
  }
});

// Initialization & Boot sequence
window.addEventListener("load", () => {
  showSlide(0);

  // Dismiss boot screen after progress animation
  setTimeout(() => {
    if (bootScreen) {
      bootScreen.classList.add("hidden");
    }
  }, 1900);
});

// User-gesture audio unlock
const unlockAudio = () => {
  playStartupSound();
  window.removeEventListener("pointerdown", unlockAudio);
  window.removeEventListener("keydown", unlockAudio);
};

window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });
