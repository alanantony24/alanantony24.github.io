const desktopWindows = document.querySelectorAll(".window");
const folderButtons = document.querySelectorAll(".folder-button");
const taskButtons = document.querySelectorAll(".task-button");
const menuItems = document.querySelectorAll(".menu-item");
const dots = document.querySelectorAll(".dot");
const slides = document.querySelectorAll(".project-slide");
const startButton = document.querySelector(".start-button");
const startMenu = document.querySelector(".start-menu");
const bootScreen = document.getElementById("bootScreen");
const clockEl = document.getElementById("clock");

let currentSlide = 0;

const openWindow = (targetId) => {
  desktopWindows.forEach((windowEl) => {
    const isActive = windowEl.id === targetId;
    windowEl.classList.toggle("active", isActive);
  });

  folderButtons.forEach((button) => {
    const isActive = button.dataset.window === targetId;
    button.classList.toggle("active", isActive);
  });

  taskButtons.forEach((button) => {
    const isActive = button.dataset.window === targetId;
    button.classList.toggle("is-active", isActive);
  });

  startMenu.classList.add("hidden");
};

folderButtons.forEach((button) => {
  button.addEventListener("click", () => {
    playClickSound();
    openWindow(button.dataset.window);
  });
});

taskButtons.forEach((button) => {
  button.addEventListener("click", () => {
    playClickSound();
    openWindow(button.dataset.window);
  });
});

menuItems.forEach((button) => {
  button.addEventListener("click", () => {
    playClickSound();
    openWindow(button.dataset.window);
  });
});

startButton.addEventListener("click", () => {
  playClickSound();
  startMenu.classList.toggle("hidden");
});

const showSlide = (index) => {
  currentSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === currentSlide);
  });

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === currentSlide);
  });
};

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    playClickSound();
    showSlide(index);
  });
});

document.querySelector(".carousel-nav.prev").addEventListener("click", () => {
  playClickSound();
  showSlide(currentSlide - 1);
});

document.querySelector(".carousel-nav.next").addEventListener("click", () => {
  playClickSound();
  showSlide(currentSlide + 1);
});

const updateClock = () => {
  const now = new Date();
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  clockEl.textContent = time;
};

updateClock();
setInterval(updateClock, 30000);

const playStartupSound = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const notes = [392, 523.25, 659.25];

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.0001;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime + index * 0.14);
    gainNode.gain.exponentialRampToValueAtTime(
      0.12,
      audioContext.currentTime + index * 0.14 + 0.05,
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + index * 0.14 + 0.32,
    );
    oscillator.stop(audioContext.currentTime + index * 0.14 + 0.34);
  });

  setTimeout(() => {
    bootScreen.classList.add("hidden");
  }, 2100);
};

const playClickSound = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.value = 680;
  gainNode.gain.value = 0.0001;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(
    0.05,
    audioContext.currentTime + 0.01,
  );
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    audioContext.currentTime + 0.08,
  );
  oscillator.stop(audioContext.currentTime + 0.09);
};

window.addEventListener("load", () => {
  showSlide(0);
  playStartupSound();
});

document.addEventListener("click", (event) => {
  const clickTarget = event.target;

  if (!(clickTarget instanceof HTMLElement)) return;

  if (
    !clickTarget.closest(".folder-button") &&
    !clickTarget.closest(".task-button") &&
    !clickTarget.closest(".menu-item") &&
    !clickTarget.closest(".start-button") &&
    !clickTarget.closest(".dot") &&
    !clickTarget.closest(".carousel-nav")
  ) {
    startMenu.classList.add("hidden");
  }
});
