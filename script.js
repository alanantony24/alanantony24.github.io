const nowPlaying = document.getElementById("nowPlaying");
const trackButtons = Array.from(document.querySelectorAll(".track"));
const randomSpin = document.getElementById("randomSpin");
const vuMeter = document.getElementById("vuMeter");
const deckLeftEl = document.getElementById("deckLeft");
const deckRightEl = document.getElementById("deckRight");
const asciiWave = document.getElementById("asciiWave");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const crossfader = document.getElementById("crossfader");

const tracks = [
  {
    title: "Levels",
    line: "Mainstage pulse.",
    src: "audio/Avicii - Levels - Avicii (128k).mp3",
    color: "#58f4ff",
    bpm: 126,
    deck: "left",
  },
  {
    title: "Wake Me Up",
    line: "Folk-meets-EDM lift.",
    src: "audio/Avicii - Wake Me Up (Official Video) - Avicii (128k).mp3",
    color: "#ffd26f",
    bpm: 124,
    deck: "right",
  },
  {
    title: "The Nights",
    line: "Anthem energy.",
    src: "audio/Avicii - The Nights - Avicii (128k).mp3",
    color: "#7dffad",
    bpm: 128,
    deck: "left",
  },
  {
    title: "Waiting For Love",
    line: "Driving melodic tension.",
    src: "audio/Avicii - Waiting For Love - Avicii (128k).mp3",
    color: "#ff8be1",
    bpm: 128,
    deck: "right",
  },
];

let audioContext;
let masterGain;
let frameId;
let activeWaveColor = "#59e6ff";

const decks = {
  left: {
    key: "left",
    el: deckLeftEl,
    screen: deckLeftEl.querySelector(".center-screen"),
    playBtn: deckLeftEl.querySelector('[data-action="play"]'),
    cueBtn: deckLeftEl.querySelector('[data-action="cue"]'),
    syncBtn: deckLeftEl.querySelector('[data-action="sync"]'),
    tempoRail: deckLeftEl.querySelector(".tempo-rail"),
    tempoKnob: deckLeftEl.querySelector(".tempo-rail span"),
    platter: deckLeftEl.querySelector(".platter"),
    audio: null,
    source: null,
    analyser: null,
    gain: null,
    trackIndex: null,
    activePad: null,
    isPlaying: false,
    isSynced: false,
    cueHolding: false,
    pitchPercent: 0,
    defaultBpm: "126.0",
  },
  right: {
    key: "right",
    el: deckRightEl,
    screen: deckRightEl.querySelector(".center-screen"),
    playBtn: deckRightEl.querySelector('[data-action="play"]'),
    cueBtn: deckRightEl.querySelector('[data-action="cue"]'),
    syncBtn: deckRightEl.querySelector('[data-action="sync"]'),
    tempoRail: deckRightEl.querySelector(".tempo-rail"),
    tempoKnob: deckRightEl.querySelector(".tempo-rail span"),
    platter: deckRightEl.querySelector(".platter"),
    audio: null,
    source: null,
    analyser: null,
    gain: null,
    trackIndex: null,
    activePad: null,
    isPlaying: false,
    isSynced: false,
    cueHolding: false,
    pitchPercent: 0,
    defaultBpm: "124.0",
  },
};

function hasAudioSupport() {
  return !!(window.AudioContext || window.webkitAudioContext);
}

function encodeAudioSrc(src) {
  return src
    .split("/")
    .map((part, index) => (index === 0 ? part : encodeURIComponent(part)))
    .join("/");
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function deckLabel(key) {
  return key === "left" ? "Deck A" : "Deck B";
}

function otherDeckKey(key) {
  return key === "left" ? "right" : "left";
}

function trackBpm(index) {
  return tracks[index].bpm;
}

function getEffectiveBpm(deck) {
  if (deck.trackIndex === null) {
    const base = parseFloat(deck.defaultBpm);
    return base * (1 + deck.pitchPercent / 100);
  }
  let base = trackBpm(deck.trackIndex);
  if (deck.isSynced) {
    const partner = decks[otherDeckKey(deck.key)];
    if (partner.trackIndex !== null) {
      base = trackBpm(partner.trackIndex);
    }
  }
  return base * (1 + deck.pitchPercent / 100);
}

function updateDeckBpmDisplay(deck) {
  const bpm = getEffectiveBpm(deck);
  deck.screen.textContent = bpm.toFixed(1);
}

function applyDeckPlaybackRate(deck) {
  if (!deck.audio) return;
  let baseRate = 1.0;
  if (deck.isSynced && deck.trackIndex !== null) {
    const partner = decks[otherDeckKey(deck.key)];
    if (partner.trackIndex !== null) {
      baseRate = trackBpm(partner.trackIndex) / trackBpm(deck.trackIndex);
    }
  }
  const effectiveRate = Math.max(0.5, Math.min(2.0, baseRate * (1 + deck.pitchPercent / 100)));
  deck.audio.playbackRate = effectiveRate;
  updateDeckBpmDisplay(deck);
}

async function ensureAudio() {
  if (!hasAudioSupport()) {
    throw new Error("Web Audio is not supported in this browser.");
  }
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);

    Object.values(decks).forEach((deck) => {
      deck.gain = audioContext.createGain();
      deck.gain.connect(masterGain);
    });
    applyCrossfade();
  }
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
  return audioContext;
}

function deckKeyForTrack(index) {
  return tracks[index].deck;
}

function updatePadVisuals() {
  trackButtons.forEach((button, index) => {
    const track = tracks[index];
    const deck = decks[track.deck];
    const isLoaded = deck.trackIndex === index;
    const isPlaying = isLoaded && deck.isPlaying;
    button.classList.toggle("is-active", isPlaying);
    button.classList.toggle("is-loaded", isLoaded && !deck.isPlaying);
  });
}

function updateWavePausedState() {
  const anyPaused = Object.values(decks).some(
    (deck) => deck.trackIndex !== null && !deck.isPlaying
  );
  asciiWave.classList.toggle("is-paused", anyPaused);
}

function updateNowPlaying() {
  const playing = Object.values(decks).filter((deck) => deck.isPlaying);
  const paused = Object.values(decks).filter(
    (deck) => deck.trackIndex !== null && !deck.isPlaying
  );

  if (playing.length === 0 && paused.length === 0) {
    nowPlaying.textContent = "Deck ready. Tap a performance pad to load a tribute snippet.";
    updatePadVisuals();
    updateWavePausedState();
    return;
  }

  const parts = [];

  playing.forEach((deck) => {
    const track = tracks[deck.trackIndex];
    const pos = deck.audio ? formatTime(deck.audio.currentTime) : "0:00";
    const syncTag = deck.isSynced ? " [SYNC]" : "";
    const pitchTag = deck.pitchPercent !== 0 ? ` (${deck.pitchPercent > 0 ? "+" : ""}${deck.pitchPercent.toFixed(1)}%)` : "";
    parts.push(`▶ ${deckLabel(deck.key)}: ${track.title} (${pos}) · ${getEffectiveBpm(deck).toFixed(1)} BPM${syncTag}${pitchTag}`);
  });

  paused.forEach((deck) => {
    const track = tracks[deck.trackIndex];
    const pos = deck.audio ? formatTime(deck.audio.currentTime) : "0:00";
    parts.push(`⏸ ${deckLabel(deck.key)}: ${track.title} at ${pos}`);
  });

  nowPlaying.textContent = parts.join("  |  ");
  updatePadVisuals();
  updateWavePausedState();
}

function buildWaveFrame(intensities) {
  const rows = 12;
  const charset = " .:-=+*#%@";
  const heights = intensities.map((value) =>
    Math.max(1, Math.floor((value / 255) * rows))
  );
  const lines = [];

  for (let row = rows; row >= 1; row -= 1) {
    let line = "";
    heights.forEach((height) => {
      if (height >= row) {
        const charIndex = Math.min(
          charset.length - 1,
          Math.floor((height / rows) * (charset.length - 1))
        );
        line += charset[charIndex];
      } else {
        line += " ";
      }
    });
    lines.push(line);
  }
  return lines.join("\n");
}

function renderIdleWave() {
  const idle = "............................::............................";
  asciiWave.textContent = `${idle}\n${idle}\n${idle}\n${idle}\n${idle}\n${idle}`;
  asciiWave.classList.remove("is-paused");
}

function sampleAnalyser(analyser, columns) {
  if (!analyser) return Array(columns).fill(0);
  const bins = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(bins);
  const step = Math.max(1, Math.floor(bins.length / columns));
  return Array.from({ length: columns }, (_, index) => bins[index * step] || 0);
}

function updateVuMeter(leftLevel, rightLevel) {
  if (!vuMeter) return;
  const bars = Array.from(vuMeter.children);
  const mix = Math.max(leftLevel, rightLevel);

  // Scaled VU response across 5 LED bars
  const scales = [0.65, 0.95, 1.3, 0.85, 0.7];
  const heights = scales.map((scale) => {
    return Math.min(28, Math.max(6, Math.round(mix * 32 * scale)));
  });

  bars.forEach((bar, index) => {
    const level = heights[index];
    bar.style.height = `${level}px`;
    if (mix > 0.03) {
      bar.style.background =
        level > 20 ? "#ffe1a8" : level > 12 ? "#6be1d3" : "#00e9ff";
      bar.style.boxShadow =
        level > 18
          ? "0 0 8px rgba(255, 225, 168, 0.7)"
          : "0 0 5px rgba(0, 233, 255, 0.4)";
    } else {
      bar.style.height = "6px";
      bar.style.background = "rgba(0, 233, 255, 0.24)";
      bar.style.boxShadow = "none";
    }
  });

  vuMeter.classList.toggle("is-active", mix > 0.03);
}

function applyCrossfade() {
  if (!masterGain || !decks.left.gain || !decks.right.gain) return;
  const position = crossfader ? Number(crossfader.value) : 50;
  const blend = position / 100; // 0 = 100% Left, 1 = 100% Right
  decks.left.gain.gain.value = Math.cos(blend * Math.PI * 0.5);
  decks.right.gain.gain.value = Math.sin(blend * Math.PI * 0.5);
}

function stopAnimationLoop(resetWave = true) {
  if (frameId) {
    cancelAnimationFrame(frameId);
    frameId = null;
  }
  updateVuMeter(0, 0);
  if (resetWave) {
    renderIdleWave();
  }
}

function startAnimationLoop() {
  if (frameId) return;

  const columns = 56;

  const draw = () => {
    const leftSample = sampleAnalyser(decks.left.analyser, columns);
    const rightSample = sampleAnalyser(decks.right.analyser, columns);
    const leftLevel = leftSample.reduce((sum, value) => sum + value, 0) / (255 * columns);
    const rightLevel = rightSample.reduce((sum, value) => sum + value, 0) / (255 * columns);

    const mixed = leftSample.map((value, index) =>
      Math.max(value, rightSample[index] || 0)
    );

    // Pick dominant track color or active color
    if (decks.left.isPlaying && !decks.right.isPlaying && decks.left.trackIndex !== null) {
      activeWaveColor = tracks[decks.left.trackIndex].color;
    } else if (decks.right.isPlaying && !decks.left.isPlaying && decks.right.trackIndex !== null) {
      activeWaveColor = tracks[decks.right.trackIndex].color;
    }

    asciiWave.style.setProperty("--wave-color", activeWaveColor);
    asciiWave.textContent = buildWaveFrame(mixed);
    updateVuMeter(leftLevel, rightLevel);

    const anyPlaying = Object.values(decks).some((deck) => deck.isPlaying);
    if (!anyPlaying) {
      stopAnimationLoop(false);
      updateWavePausedState();
      return;
    }

    frameId = requestAnimationFrame(draw);
  };

  draw();
}

function teardownDeckAudio(deck) {
  if (deck.audio) {
    deck.audio.pause();
    deck.audio.currentTime = 0;
    deck.audio.playbackRate = 1;
    deck.audio.removeAttribute("src");
    deck.audio.load();
    deck.audio = null;
  }
  if (deck.source) {
    try {
      deck.source.disconnect();
    } catch (_) {
      /* already disconnected */
    }
    deck.source = null;
  }
  if (deck.analyser) {
    try {
      deck.analyser.disconnect();
    } catch (_) {
      /* already disconnected */
    }
    deck.analyser = null;
  }
}

function resetDeckVisuals(deck) {
  deck.el.classList.remove("is-active", "is-paused");
  deck.playBtn.classList.remove("is-lit");
  deck.playBtn.textContent = "PLAY";
  deck.cueBtn.classList.remove("is-holding");
  deck.syncBtn.classList.remove("is-lit");
  deck.isSynced = false;
  deck.pitchPercent = 0;
  if (deck.tempoKnob) {
    deck.tempoKnob.style.top = "50%";
  }
  deck.screen.textContent = deck.defaultBpm;
}

function clearSync(deck) {
  deck.isSynced = false;
  deck.syncBtn.classList.remove("is-lit");
  applyDeckPlaybackRate(deck);
}

function applySync(key) {
  const deck = decks[key];
  const partnerKey = otherDeckKey(key);
  const partner = decks[partnerKey];

  if (deck.trackIndex === null || !deck.audio) {
    nowPlaying.textContent = `${deckLabel(key)}: load a track before syncing.`;
    return;
  }

  if (partner.trackIndex === null) {
    nowPlaying.textContent = `Load a track on ${deckLabel(partnerKey)} first, then press SYNC.`;
    return;
  }

  deck.isSynced = true;
  deck.syncBtn.classList.add("is-lit");
  applyDeckPlaybackRate(deck);

  const targetBpm = getEffectiveBpm(partner);
  nowPlaying.textContent = `⚡ ${deckLabel(key)} synced to ${deckLabel(partnerKey)} at ${targetBpm.toFixed(1)} BPM.`;
}

function stopDeck(key) {
  const deck = decks[key];
  teardownDeckAudio(deck);
  deck.isPlaying = false;
  deck.cueHolding = false;
  deck.trackIndex = null;
  deck.activePad = null;
  resetDeckVisuals(deck);

  if (!Object.values(decks).some((item) => item.isPlaying)) {
    const anyLoaded = Object.values(decks).some((item) => item.trackIndex !== null);
    stopAnimationLoop(!anyLoaded);
  }
  updateNowPlaying();
}

function pauseDeck(key) {
  const deck = decks[key];
  if (!deck.audio || !deck.isPlaying) return;

  deck.audio.pause();
  deck.isPlaying = false;
  deck.el.classList.remove("is-active");
  deck.el.classList.add("is-paused");
  deck.playBtn.classList.remove("is-lit");
  deck.playBtn.textContent = "PLAY";

  if (!Object.values(decks).some((item) => item.isPlaying)) {
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
    updateVuMeter(0, 0);
  }

  updateNowPlaying();
}

async function resumeDeck(key) {
  const deck = decks[key];
  if (!deck.audio) return;

  await ensureAudio();
  applyDeckPlaybackRate(deck);
  await deck.audio.play();
  deck.isPlaying = true;
  deck.el.classList.add("is-active");
  deck.el.classList.remove("is-paused");
  deck.playBtn.classList.add("is-lit");
  deck.playBtn.textContent = "PAUSE";
  updateNowPlaying();
  startAnimationLoop();
}

async function playDeckTrack(key, trackIndex, padButton) {
  const deck = decks[key];
  const track = tracks[trackIndex];
  const ctx = await ensureAudio();

  // If already loaded on this deck
  if (deck.trackIndex === trackIndex && deck.audio) {
    if (deck.audio.paused) {
      await resumeDeck(key);
    } else {
      // Hot-cue re-trigger from 0:00
      deck.audio.currentTime = 0;
      updateNowPlaying();
    }
    updatePadVisuals();
    return;
  }

  stopDeck(key);

  const audio = new Audio(encodeAudioSrc(track.src));
  audio.preload = "auto";

  const source = ctx.createMediaElementSource(audio);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  analyser.connect(deck.gain);

  deck.audio = audio;
  deck.source = source;
  deck.analyser = analyser;
  deck.trackIndex = trackIndex;
  deck.activePad = padButton;
  deck.isPlaying = true;
  deck.isSynced = false;

  activeWaveColor = track.color;
  applyDeckPlaybackRate(deck);

  deck.el.classList.add("is-active");
  deck.el.classList.remove("is-paused");
  deck.playBtn.classList.add("is-lit");
  deck.playBtn.textContent = "PAUSE";
  deck.syncBtn.classList.remove("is-lit");

  audio.addEventListener("ended", () => {
    stopDeck(key);
    nowPlaying.textContent = `${track.title} ended. Load another pad or spin again.`;
  });

  audio.addEventListener("error", () => {
    stopDeck(key);
    nowPlaying.textContent = `Missing audio file for ${track.title}. Check ${track.src}.`;
  });

  try {
    await audio.play();
    updateNowPlaying();
    startAnimationLoop();
  } catch (error) {
    stopDeck(key);
    nowPlaying.textContent = "Playback blocked by browser. Tap a pad again to activate audio.";
    console.error(error);
  }
}

async function ensureDeckLoaded(key) {
  const deck = decks[key];
  if (deck.audio) return true;
  const fallbackIndex = key === "left" ? 0 : 1;
  await playDeckTrack(key, fallbackIndex, trackButtons[fallbackIndex]);
  return !!deck.audio;
}

async function cueDeck(key) {
  const deck = decks[key];
  if (!(await ensureDeckLoaded(key))) return;

  deck.audio.currentTime = 0;
  clearSync(deck);
  pauseDeck(key);
  nowPlaying.textContent = `⏸ ${deckLabel(key)} cued to 0:00. Hold CUE for preview or press PLAY.`;
}

async function startCuePreview(key) {
  const deck = decks[key];
  if (!(await ensureDeckLoaded(key))) return;

  deck.cueHolding = true;
  deck.cueBtn.classList.add("is-holding");
  deck.audio.currentTime = 0;

  if (!deck.isPlaying) {
    await resumeDeck(key);
  }
}

function stopCuePreview(key) {
  const deck = decks[key];
  if (!deck.cueHolding) return;

  deck.cueHolding = false;
  deck.cueBtn.classList.remove("is-holding");
  if (deck.audio) {
    deck.audio.currentTime = 0;
  }
  pauseDeck(key);
  nowPlaying.textContent = `⏸ ${deckLabel(key)} cued at start (0:00). Press PLAY to resume.`;
}

async function toggleDeckPlay(key) {
  const deck = decks[key];
  if (!deck.audio) {
    const fallbackIndex = key === "left" ? 0 : 1;
    await playDeckTrack(key, fallbackIndex, trackButtons[fallbackIndex]);
    return;
  }
  if (deck.isPlaying) {
    pauseDeck(key);
  } else {
    await resumeDeck(key);
  }
}

function stopAllDecks() {
  stopDeck("left");
  stopDeck("right");
  renderIdleWave();
  nowPlaying.textContent = "⏹ All decks stopped and unloaded. Tap any pad to load a track.";
}

async function startAllDecks() {
  await ensureAudio();
  const tasks = [];

  if (decks.left.trackIndex !== null && !decks.left.isPlaying) {
    tasks.push(resumeDeck("left"));
  }
  if (decks.right.trackIndex !== null && !decks.right.isPlaying) {
    tasks.push(resumeDeck("right"));
  }

  if (tasks.length === 0) {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    const key = deckKeyForTrack(randomIndex);
    tasks.push(playDeckTrack(key, randomIndex, trackButtons[randomIndex]));
  }

  await Promise.all(tasks);
}

function pauseAllDecks() {
  pauseDeck("left");
  pauseDeck("right");
  updateNowPlaying();
}

// Interactive Pitch / Tempo Slider
function setupTempoFaders() {
  Object.entries(decks).forEach(([key, deck]) => {
    if (!deck.tempoRail || !deck.tempoKnob) return;

    let isDragging = false;

    const updateFaderFromEvent = (clientX, clientY) => {
      const rect = deck.tempoRail.getBoundingClientRect();
      const isHorizontal = rect.width > rect.height;
      let normalized;
      if (isHorizontal) {
        normalized = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        // Left = -8%, Right = +8%
        const pitch = (normalized - 0.5) * 16;
        deck.pitchPercent = Math.round(pitch * 10) / 10;
        deck.tempoKnob.style.left = `${normalized * 100}%`;
        deck.tempoKnob.style.top = "50%";
      } else {
        normalized = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        // Top = +8%, Bottom = -8%
        const pitch = (0.5 - normalized) * 16;
        deck.pitchPercent = Math.round(pitch * 10) / 10;
        deck.tempoKnob.style.top = `${normalized * 100}%`;
        deck.tempoKnob.style.left = "50%";
      }
      applyDeckPlaybackRate(deck);
      updateNowPlaying();
    };

    deck.tempoRail.addEventListener("mousedown", (e) => {
      isDragging = true;
      updateFaderFromEvent(e.clientX, e.clientY);
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (isDragging) {
        updateFaderFromEvent(e.clientX, e.clientY);
      }
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Touch support for mobile / tablets
    deck.tempoRail.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) {
        isDragging = true;
        updateFaderFromEvent(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (isDragging && e.touches.length > 0) {
        updateFaderFromEvent(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("touchend", () => {
      isDragging = false;
    });

    // Double-click to reset pitch to 0%
    deck.tempoRail.addEventListener("dblclick", () => {
      deck.pitchPercent = 0;
      deck.tempoKnob.style.top = "50%";
      deck.tempoKnob.style.left = "50%";
      applyDeckPlaybackRate(deck);
      updateNowPlaying();
    });
  });
}

// Platter interactive nudge / scratch
function setupPlatterNudge() {
  Object.entries(decks).forEach(([key, deck]) => {
    if (!deck.platter) return;

    let startX = 0;
    let isScratching = false;

    deck.platter.addEventListener("mousedown", (e) => {
      if (!deck.audio) return;
      isScratching = true;
      startX = e.clientX;
    });

    window.addEventListener("mousemove", (e) => {
      if (!isScratching || !deck.audio) return;
      const deltaX = e.clientX - startX;
      startX = e.clientX;
      // Nudge playback time by delta
      const nudgeSeconds = deltaX * 0.05;
      deck.audio.currentTime = Math.max(0, Math.min(deck.audio.duration || 300, deck.audio.currentTime + nudgeSeconds));
      updateNowPlaying();
    });

    window.addEventListener("mouseup", () => {
      isScratching = false;
    });
  });
}

// Performance pad buttons
trackButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const index = Number(button.dataset.track);
    const key = deckKeyForTrack(index);
    try {
      await playDeckTrack(key, index, button);
    } catch (error) {
      nowPlaying.textContent = "Could not start playback. Tap pad again to activate.";
      console.error(error);
    }
  });
});

// Auto Mashup: mixes 2 songs together (Deck A + Deck B) with auto beatmatching
async function autoMixDecks() {
  try {
    await ensureAudio();

    // Pick 1 track for Deck A (0: Levels, 2: The Nights)
    const deckATracks = [0, 2];
    let aIndex = deckATracks[Math.floor(Math.random() * deckATracks.length)];
    if (decks.left.trackIndex !== null && decks.left.trackIndex === aIndex) {
      aIndex = deckATracks.find((i) => i !== decks.left.trackIndex) ?? aIndex;
    }

    // Pick 1 track for Deck B (1: Wake Me Up, 3: Waiting For Love)
    const deckBTracks = [1, 3];
    let bIndex = deckBTracks[Math.floor(Math.random() * deckBTracks.length)];
    if (decks.right.trackIndex !== null && decks.right.trackIndex === bIndex) {
      bIndex = deckBTracks.find((i) => i !== decks.right.trackIndex) ?? bIndex;
    }

    const trackA = tracks[aIndex];
    const trackB = tracks[bIndex];

    // Smoothly center the crossfader (50%) so both tracks blend equally
    if (crossfader) {
      crossfader.value = "50";
      applyCrossfade();
    }

    // Reset pitch faders to neutral (0%)
    decks.left.pitchPercent = 0;
    if (decks.left.tempoKnob) decks.left.tempoKnob.style.top = "50%";
    decks.right.pitchPercent = 0;
    if (decks.right.tempoKnob) decks.right.tempoKnob.style.top = "50%";

    // Concurrently load and start playback on both decks
    await Promise.all([
      playDeckTrack("left", aIndex, trackButtons[aIndex]),
      playDeckTrack("right", bIndex, trackButtons[bIndex]),
    ]);

    // Automatically sync Deck B tempo to Deck A for harmonic beatmatching
    applySync("right");

    nowPlaying.textContent = `🔥 Live Auto-Mashup: ${trackA.title} (Deck A) + ${trackB.title} (Deck B) beatmatched & synced at ${trackBpm(aIndex).toFixed(1)} BPM!`;
  } catch (error) {
    nowPlaying.textContent = "Auto mashup failed to start. Tap any pad to activate audio.";
    console.error(error);
  }
}

if (randomSpin) {
  randomSpin.addEventListener("click", autoMixDecks);
}

// Transport buttons
if (startBtn) {
  startBtn.addEventListener("click", () => {
    startAllDecks().catch((error) => {
      nowPlaying.textContent = "Start failed. Tap a pad first, then try again.";
      console.error(error);
    });
  });
}

if (pauseBtn) {
  pauseBtn.addEventListener("click", pauseAllDecks);
}

if (stopBtn) {
  stopBtn.addEventListener("click", stopAllDecks);
}

// Deck controls (PLAY, CUE, SYNC)
Object.entries(decks).forEach(([key, deck]) => {
  deck.playBtn.addEventListener("click", () => {
    toggleDeckPlay(key).catch((error) => {
      nowPlaying.textContent = "Deck play failed. Tap a pad to load audio.";
      console.error(error);
    });
  });

  deck.syncBtn.addEventListener("click", () => {
    if (deck.isSynced) {
      clearSync(deck);
      nowPlaying.textContent = `${deckLabel(key)} sync off — restored original tempo.`;
      return;
    }
    applySync(key);
  });

  let cuePressAt = 0;

  const beginPreview = (event) => {
    if (event.type === "mousedown" && event.button !== 0) return;
    event.preventDefault();
    cuePressAt = Date.now();
    startCuePreview(key).catch((error) => {
      console.error(error);
    });
  };

  const endPreview = (event) => {
    const pressDuration = Date.now() - cuePressAt;
    stopCuePreview(key);
    if (pressDuration < 250) {
      cueDeck(key).catch(console.error);
    }
  };

  deck.cueBtn.addEventListener("mousedown", beginPreview);
  deck.cueBtn.addEventListener("mouseup", endPreview);
  deck.cueBtn.addEventListener("mouseleave", () => {
    if (deck.cueHolding) {
      stopCuePreview(key);
    }
  });
  deck.cueBtn.addEventListener("touchstart", beginPreview, { passive: false });
  deck.cueBtn.addEventListener("touchend", endPreview);
  deck.cueBtn.addEventListener("touchcancel", () => {
    if (deck.cueHolding) {
      stopCuePreview(key);
    }
  });
});

if (crossfader) {
  crossfader.addEventListener("input", applyCrossfade);
}

// Initialize
renderIdleWave();
setupTempoFaders();
setupPlatterNudge();
