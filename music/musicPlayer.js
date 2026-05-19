const music = new Audio();

music.loop = true;

let selectedMusicUrl = "";
let selectedMusicFile = null;
let onStateChange = () => {};
let audioContext = null;
let analyser = null;
let frequencyData = null;

export function setupMusicPlayer({ initialVolume = 0.65, onChange = () => {} } = {}) {
    music.volume = Number(initialVolume);
    onStateChange = onChange;

    music.addEventListener("play", onStateChange);
    music.addEventListener("pause", onStateChange);
    music.addEventListener("ended", onStateChange);

    onStateChange();
}

export function getSelectedMusicFile() {
    return selectedMusicFile;
}

export function hasMusic() {
    return Boolean(music.src);
}

export function isMusicPaused() {
    return music.paused;
}

export function loadMusic(file, shouldPlay = true) {
    if (!file) {
        return null;
    }

    if (selectedMusicUrl) {
        URL.revokeObjectURL(selectedMusicUrl);
    }

    selectedMusicFile = file;
    selectedMusicUrl = URL.createObjectURL(selectedMusicFile);
    music.src = selectedMusicUrl;

    if (shouldPlay) {
        playMusic();
    } else {
        onStateChange();
    }

    return selectedMusicFile;
}

export function playMusic() {
    analyserSetup();
    music.play().catch(() => {
        onStateChange();
    });
}

export function pauseMusic() {
    music.pause();
}

export function setMusicVolume(volume) {
    music.volume = Number(volume);
}

function analyserSetup() {
    if (audioContext !== null) return;

    audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(music);

    analyser = audioContext.createAnalyser();
    analyser.fftsSize = 256;

    frequencyData = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);
    analyser.connect(audioContext.destination);
}

export function getFrequencyData() {
    if (analyser === null) return null;

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    analyser.getByteFrequencyData(frequencyData);
    return frequencyData;
}

export function getBassLevel() {
    const data = getFrequencyData();
    if (!data) return 0;

    let sum = 0;
    const bassRange = 8;
    for (let i = 0; i < bassRange; i++) {
        sum += data[i];
    }
    return sum/(bassRange * 255);
}

export function getMidLevel() {
    const data = getFrequencyData();
    if (!data) return 0;
    let sum = 0;
    const start = 8;
    const end = 40;
    for (let i = start; i < end; i++) {
        sum += data[i];
    }
    return sum/((end - start)*255);
}

export function getTrebleLevel() {
    const data = getFrequencyData();
    if (!data) return 0;
    let sum = 0;
    const start = 40;
    const end = 80;
    for (let i = start; i < end; i++) {
        sum += data[i];
    }
    return sum/((end - start)*255);
}