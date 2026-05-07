const music = new Audio();

music.loop = true;

let selectedMusicUrl = "";
let selectedMusicFile = null;
let onStateChange = () => {};

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
