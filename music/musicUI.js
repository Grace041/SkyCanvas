import { getSelectedMusicFile, hasMusic, isMusicPaused, loadMusic, pauseMusic, playMusic, setMusicVolume, setupMusicPlayer } from "/music/musicPlayer.js";
import { deleteSavedTracks, readOldSavedMusic, readSavedTrackList, writeSavedTrackList } from "/music/musicStorage.js";

let savedTracks = [];

function createSavedTrack(oldSavedMusic) {
    return {
        id: crypto.randomUUID(),
        name: oldSavedMusic.name,
        type: oldSavedMusic.type,
        file: oldSavedMusic.file
    };
}

export function setupMusicControls() {
    const musicFileInput = document.querySelector(".music-panel_file");
    const musicButton = document.querySelector(".music-panel_button");
    const musicTrack = document.querySelector(".music-panel_track");
    const saveMusicButton = document.querySelector(".music-panel_save");
    const clearMusicButton = document.querySelector(".music-panel_clear");
    const savedMusicList = document.querySelector(".music-panel_saved");
    const volumeSlider = document.querySelector(".music-panel_volume-slider");

    function setMusicButtonState() {
        musicButton.textContent = isMusicPaused() ? "Play" : "Pause";
        musicButton.setAttribute("aria-label", isMusicPaused() ? "Play music" : "Pause music");
    }

    function setCurrentTrack(file) {
        if (!file) {
            return;
        }

        musicTrack.textContent = file.name;
        musicButton.disabled = false;
        saveMusicButton.disabled = false;
    }

    function renderSavedTracks() {
        savedMusicList.replaceChildren();
        clearMusicButton.disabled = savedTracks.length === 0;

        savedTracks.forEach((track) => {
            const trackButton = document.createElement("button");

            trackButton.className = "music-panel_saved-button";
            trackButton.type = "button";
            trackButton.textContent = track.name;
            trackButton.title = track.name;
            trackButton.addEventListener("click", () => {
                setCurrentTrack(loadMusic(track.file));
            });

            savedMusicList.appendChild(trackButton);
        });
    }

    setupMusicPlayer({
        initialVolume: volumeSlider.value,
        onChange: setMusicButtonState
    });

    musicFileInput.addEventListener("change", (event) => {
        setCurrentTrack(loadMusic(event.target.files[0]));
    });

    saveMusicButton.addEventListener("click", async () => {
        const selectedMusicFile = getSelectedMusicFile();

        if (!selectedMusicFile) {
            return;
        }

        saveMusicButton.disabled = true;

        try {
            const track = {
                id: crypto.randomUUID(),
                name: selectedMusicFile.name,
                type: selectedMusicFile.type,
                file: selectedMusicFile
            };

            savedTracks = savedTracks.filter((savedTrack) => savedTrack.name !== track.name);
            savedTracks.push(track);
            await writeSavedTrackList(savedTracks);
            renderSavedTracks();
        } catch (error) {
            saveMusicButton.disabled = false;
        }
    });

    clearMusicButton.addEventListener("click", async () => {
        try {
            await deleteSavedTracks();
            savedTracks = [];
            renderSavedTracks();
        } catch (error) {
            clearMusicButton.disabled = savedTracks.length === 0;
        }
    });

    musicButton.addEventListener("click", () => {
        if (!hasMusic()) {
            return;
        }

        if (isMusicPaused()) {
            playMusic();
        } else {
            pauseMusic();
        }
    });

    volumeSlider.addEventListener("input", () => {
        setMusicVolume(volumeSlider.value);
    });

    readSavedTrackList().then(async (tracks) => {
        savedTracks = tracks;

        if (savedTracks.length === 0) {
            const oldSavedMusic = await readOldSavedMusic();

            if (oldSavedMusic) {
                savedTracks = [createSavedTrack(oldSavedMusic)];
                await writeSavedTrackList(savedTracks);
            }
        }

        renderSavedTracks();
    }).catch(() => {
        savedTracks = [];
        renderSavedTracks();
    });
}
