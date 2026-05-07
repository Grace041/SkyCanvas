const musicDatabaseName = "sky-canvas-music";
const musicStoreName = "tracks";
const savedMusicListKey = "saved-tracks";
const oldSavedMusicKey = "active-track";

function openMusicDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(musicDatabaseName, 1);

        request.addEventListener("upgradeneeded", () => {
            request.result.createObjectStore(musicStoreName);
        });

        request.addEventListener("success", () => {
            resolve(request.result);
        });

        request.addEventListener("error", () => {
            reject(request.error);
        });
    });
}

export async function readSavedTrackList() {
    const database = await openMusicDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(musicStoreName, "readonly");
        const store = transaction.objectStore(musicStoreName);
        const request = store.get(savedMusicListKey);

        request.addEventListener("success", () => {
            resolve(request.result || []);
        });

        request.addEventListener("error", () => {
            reject(request.error);
        });

        transaction.addEventListener("complete", () => {
            database.close();
        });
    });
}

export async function readOldSavedMusic() {
    const database = await openMusicDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(musicStoreName, "readonly");
        const store = transaction.objectStore(musicStoreName);
        const request = store.get(oldSavedMusicKey);

        request.addEventListener("success", () => {
            resolve(request.result);
        });

        request.addEventListener("error", () => {
            reject(request.error);
        });

        transaction.addEventListener("complete", () => {
            database.close();
        });
    });
}

export async function writeSavedTrackList(tracks) {
    const database = await openMusicDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(musicStoreName, "readwrite");
        const store = transaction.objectStore(musicStoreName);

        store.put(tracks, savedMusicListKey);

        transaction.addEventListener("complete", () => {
            database.close();
            resolve();
        });

        transaction.addEventListener("error", () => {
            database.close();
            reject(transaction.error);
        });
    });
}

export async function deleteSavedTracks() {
    const database = await openMusicDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(musicStoreName, "readwrite");
        const store = transaction.objectStore(musicStoreName);

        store.delete(savedMusicListKey);
        store.delete(oldSavedMusicKey);

        transaction.addEventListener("complete", () => {
            database.close();
            resolve();
        });

        transaction.addEventListener("error", () => {
            database.close();
            reject(transaction.error);
        });
    });
}
