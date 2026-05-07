import * as THREE from "/build/three.module.js";

const shapeNames = {
    idle: "Idle",
    heart: "Heart",
    star: "Star",
    planet: "Planet",
    custom: "Custom"
};
const gridStep = 2;
const minimumClipDuration = 0.5;
const overlapPadding = 0.001;

export function createTimeline({onShapeChange}) {
    const timeline = document.querySelector("#timeline");
    const timelineRuler = document.querySelector("#timeline-ruler");
    const timelineClips = document.querySelector("#timeline-clips");
    const timelineEmpty = document.querySelector("#timeline-empty");
    const timelinePlayhead = document.querySelector("#timeline-playhead");
    const playShowButton = document.querySelector("#play-show");
    const stopShowButton = document.querySelector("#stop-show");
    const timelineDurationInput = document.querySelector("#timeline-duration");
    const showClips = [];
    let selectedClipId = null;
    let isPlaying = false;
    let showTime = 0;
    let activeClipId = null;
    let resizingClip = null;

    timeline.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = event.dataTransfer.types.includes("text/clip-id") ? "move" : "copy";
    });

    timeline.addEventListener("drop", (event) => {
        event.preventDefault();

        const clipId = event.dataTransfer.getData("text/clip-id");
        const shape = event.dataTransfer.getData("text/shape");
        const customShapeId = event.dataTransfer.getData("text/custom-shape-id");
        const customShapeName = event.dataTransfer.getData("text/custom-shape-name");
        const startTime = getTimelineTimeFromEvent(event);

        if (clipId) {
            moveClip(clipId, startTime);
        } else if (shape) {
            addClip(shape, startTime, {customShapeId, customShapeName});
        }
    });

    timeline.addEventListener("click", (event) => {
        if (event.target === timeline || event.target === timelineClips) {
            setSelectedClip(null);
        }
    });

    playShowButton.addEventListener("click", () => {
        isPlaying = !isPlaying;
        playShowButton.textContent = isPlaying ? "Pause" : "Play";

        if (isPlaying && showTime >= getTimelineDuration()) {
            showTime = 0;
        }
    });

    stopShowButton.addEventListener("click", stop);

    timelineDurationInput.addEventListener("input", () => {
        showTime = THREE.MathUtils.clamp(showTime, 0, getTimelineDuration());
        clampClips();
        render();
    });

    window.addEventListener("pointermove", (event) => {
        if (!resizingClip) {
            return;
        }

        const clip = getClip(resizingClip.id);

        if (!clip) {
            return;
        }

        resizeClip(clip, resizingClip.edge, getTimelineTimeFromEvent(event));
        render();
    });

    window.addEventListener("pointerup", () => {
        resizingClip = null;
    });

    render();

    return {
        update(delta) {
            if (!isPlaying) {
                return;
            }

            showTime += delta;

            if (showTime >= getTimelineDuration()) {
                showTime = getTimelineDuration();
                stop();
                return;
            }

            const activeClip = getActiveClip(showTime);

            if (activeClip && activeClip.id !== activeClipId) {
                activeClipId = activeClip.id;
                onShapeChange(activeClip.shape, activeClip);
            } else if (!activeClip && activeClipId) {
                activeClipId = null;
                onShapeChange("idle");
            }

            updatePlayhead();
        }
    };

    function addClip(shape, start, options = {}) {
        const duration = Math.min(gridStep, getTimelineDuration());
        const placement = findAvailablePlacement(clampStart(start, duration), duration);

        if (!placement) {
            return;
        }

        const clip = {
            id: `clip-${Date.now()}-${Math.round(Math.random() * 1000)}`,
            shape,
            customShapeId: options.customShapeId || null,
            customShapeName: options.customShapeName || "",
            start: placement.start,
            duration
        };

        showClips.push(clip);
        setSelectedClip(clip.id);
        render();
    }

    function moveClip(clipId, start) {
        const clip = getClip(clipId);

        if (!clip) {
            return;
        }

        const nextStart = clampStart(start, clip.duration);

        if (doesClipOverlap(clip.id, nextStart, clip.duration)) {
            return;
        }

        clip.start = nextStart;
        setSelectedClip(clip.id);
        render();
    }

    function getClip(clipId) {
        return showClips.find((clip) => clip.id === clipId);
    }

    function setSelectedClip(clipId) {
        selectedClipId = clipId;
        render();
    }

    function render() {
        timelineClips.replaceChildren();
        renderRuler();
        timelineEmpty.hidden = showClips.length > 0;
        timeline.style.setProperty("--timeline-grid-size", `${(gridStep / getTimelineDuration()) * 100}%`);

        for (const clip of showClips) {
            const clipElement = document.createElement("div");
            clipElement.className = "timeline-clip";
            clipElement.classList.toggle("is-selected", clip.id === selectedClipId);
            clipElement.draggable = true;
            clipElement.dataset.clipId = clip.id;
            clipElement.textContent = clip.customShapeName || shapeNames[clip.shape] || clip.shape;
            clipElement.style.left = `${(clip.start / getTimelineDuration()) * 100}%`;
            clipElement.style.width = `${(clip.duration / getTimelineDuration()) * 100}%`;

            const leftResizeHandle = document.createElement("div");
            leftResizeHandle.className = "clip-resize-handle is-left";
            clipElement.appendChild(leftResizeHandle);

            const rightResizeHandle = document.createElement("div");
            rightResizeHandle.className = "clip-resize-handle is-right";
            clipElement.appendChild(rightResizeHandle);

            clipElement.addEventListener("click", (event) => {
                event.stopPropagation();
                setSelectedClip(clip.id);
            });

            clipElement.addEventListener("dragstart", (event) => {
                event.dataTransfer.setData("text/clip-id", clip.id);
                event.dataTransfer.effectAllowed = "move";
            });

            leftResizeHandle.addEventListener("pointerdown", (event) => {
                event.stopPropagation();
                event.preventDefault();
                resizingClip = {id: clip.id, edge: "left"};
                setSelectedClip(clip.id);
            });

            rightResizeHandle.addEventListener("pointerdown", (event) => {
                event.stopPropagation();
                event.preventDefault();
                resizingClip = {id: clip.id, edge: "right"};
                setSelectedClip(clip.id);
            });

            timelineClips.appendChild(clipElement);
        }

        updatePlayhead();
    }

    function renderRuler() {
        timelineRuler.replaceChildren();

        const duration = getTimelineDuration();
        const markerCount = Math.floor(duration / gridStep);

        for (let i = 0; i <= markerCount; i += 1) {
            const label = document.createElement("div");
            const time = gridStep * i;

            label.className = "timeline-time-label";
            label.textContent = `${formatTime(time)}s`;
            label.style.left = `${(i / markerCount) * 100}%`;
            timelineRuler.appendChild(label);
        }
    }

    function resizeClip(clip, edge, time) {
        if (edge === "left") {
            const nextStart = THREE.MathUtils.clamp(time, 0, clip.start + clip.duration - minimumClipDuration);
            const nextDuration = clip.start + clip.duration - nextStart;

            if (!doesClipOverlap(clip.id, nextStart, nextDuration)) {
                clip.start = nextStart;
                clip.duration = nextDuration;
            }

            return;
        }

        const nextDuration = Math.max(minimumClipDuration, time - clip.start);
        const clampedDuration = Math.min(nextDuration, getTimelineDuration() - clip.start);

        if (!doesClipOverlap(clip.id, clip.start, clampedDuration)) {
            clip.duration = clampedDuration;
        }
    }

    function findAvailablePlacement(start, duration) {
        if (!doesClipOverlap(null, start, duration)) {
            return {start};
        }

        for (let nextStart = 0; nextStart <= getTimelineDuration() - duration; nextStart += gridStep) {
            if (!doesClipOverlap(null, nextStart, duration)) {
                return {start: nextStart};
            }
        }

        return null;
    }

    function doesClipOverlap(clipId, start, duration) {
        const end = start + duration;

        return showClips.some((clip) => {
            if (clip.id === clipId) {
                return false;
            }

            const clipEnd = clip.start + clip.duration;
            return start < clipEnd - overlapPadding && end > clip.start + overlapPadding;
        });
    }

    function getActiveClip(time) {
        return showClips
            .filter((clip) => time >= clip.start && time < clip.start + clip.duration)
            .sort((a, b) => b.start - a.start)[0] || null;
    }

    function stop() {
        isPlaying = false;
        playShowButton.textContent = "Play";
        showTime = 0;
        activeClipId = null;
        updatePlayhead();
    }

    function updatePlayhead() {
        timelinePlayhead.style.left = `${(showTime / getTimelineDuration()) * 100}%`;
    }

    function getTimelineTimeFromEvent(event) {
        const rect = timelineClips.getBoundingClientRect();
        const progress = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width, 0, 1);

        return progress * getTimelineDuration();
    }

    function getTimelineDuration() {
        return Math.max(4, Number(timelineDurationInput.value) || 20);
    }

    function clampStart(start, duration) {
        return THREE.MathUtils.clamp(start, 0, Math.max(0, getTimelineDuration() - duration));
    }

    function clampClips() {
        for (const clip of showClips) {
            clip.duration = Math.min(clip.duration, getTimelineDuration());
            clip.start = clampStart(clip.start, clip.duration);

            while (doesClipOverlap(clip.id, clip.start, clip.duration) && clip.duration > minimumClipDuration) {
                clip.duration = Math.max(minimumClipDuration, clip.duration - 0.25);
            }
        }
    }

    function formatTime(value) {
        return Number(value.toFixed(1));
    }
}
