const savedShapesStorageKey = "skyCanvas.savedCustomShapes";
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function createCustomShapeControls({droneFleet, isCustomActive, onCustomSelected}) {
    const shapePanel = document.querySelector("#shape-controls");
    const shapeCanvas = document.querySelector("#shape-canvas");
    const shapeDroneCountValue = document.querySelector("#shape-drone-count-value");
    const shapeDroneCountInput = document.querySelector("#shape-drone-count");
    const applyShapeButton = document.querySelector("#apply-shape");
    const clearShapeButton = document.querySelector("#clear-shape");
    const savedShapeNameInput = document.querySelector("#saved-shape-name");
    const saveShapeButton = document.querySelector("#save-shape");
    const deleteShapeButton = document.querySelector("#delete-shape");
    const customShapeButtons = document.querySelector("#custom-shape-buttons");
    const shapeContext = shapeCanvas.getContext("2d");
    const shapePoints = [];
    let shapeDroneCount = 160;
    let isDrawingShape = false;
    let selectedSavedShapeId = null;
    const savedShapes = loadSavedShapes();

    shapeCanvas.addEventListener("pointerdown", (event) => {
        isDrawingShape = true;
        shapeCanvas.setPointerCapture(event.pointerId);
        addShapePoint(event);
    });

    shapeCanvas.addEventListener("pointermove", (event) => {
        if (isDrawingShape) {
            addShapePoint(event);
        }
    });

    shapeCanvas.addEventListener("pointerup", (event) => {
        isDrawingShape = false;
        shapeCanvas.releasePointerCapture(event.pointerId);
    });

    shapeCanvas.addEventListener("pointercancel", () => {
        isDrawingShape = false;
    });

    shapeDroneCountInput.addEventListener("input", () => {
        shapeDroneCount = Number(shapeDroneCountInput.value);
        shapeDroneCountValue.textContent = shapeDroneCountInput.value;

        if (isCustomActive() && shapePoints.length >= 3) {
            applyToFleet();
        }
    });

    applyShapeButton.addEventListener("click", () => {
        if (shapePoints.length < 3) {
            return;
        }

        onCustomSelected();
    });

    clearShapeButton.addEventListener("click", () => {
        shapePoints.length = 0;
        drawShapeCanvas();
        updateActionStates();

        if (isCustomActive()) {
            droneFleet.setFormation("idle");
        }
    });

    saveShapeButton.addEventListener("click", saveCustomShape);
    deleteShapeButton.addEventListener("click", deleteSelectedCustomShape);

    shapeDroneCountValue.textContent = shapeDroneCount;
    shapeDroneCountInput.value = shapeDroneCount;
    renderSavedShapeButtons();
    updateActionStates();
    drawShapeCanvas();

    return {
        show() {
            shapePanel.hidden = false;
            drawShapeCanvas();
        },
        hide() {
            shapePanel.hidden = true;
        },
        applyToFleetOrIdle() {
            if (shapePoints.length >= 3) {
                applyToFleet();
            } else {
                droneFleet.setFormation("idle");
            }
        },
        applySavedShape(savedShapeId, options = {}) {
            loadSavedShape(savedShapeId, {
                openPanel: false,
                selectCustom: false,
                ...options
            });
        }
    };

    function addShapePoint(event) {
        const canvasBounds = shapeCanvas.getBoundingClientRect();
        const x = (event.clientX - canvasBounds.left) / canvasBounds.width;
        const y = (event.clientY - canvasBounds.top) / canvasBounds.height;
        const lastPoint = shapePoints[shapePoints.length - 1];

        if (lastPoint && Math.hypot(lastPoint.x - x, lastPoint.y - y) < 0.01) {
            return;
        }

        shapePoints.push({
            x: clamp(x, 0, 1),
            y: clamp(y, 0, 1)
        });

        drawShapeCanvas();
        updateActionStates();
    }

    function applyToFleet() {
        droneFleet.setCustomShape(shapePoints, getShapeDroneCount());
    }

    function getShapeDroneCount() {
        return shapeDroneCount;
    }

    function saveCustomShape() {
        if (shapePoints.length < 3) {
            return;
        }

        const savedShape = {
            id: `shape-${Date.now()}`,
            name: getSavedShapeName(),
            droneCount: getShapeDroneCount(),
            points: shapePoints.map((point) => ({x: point.x, y: point.y}))
        };

        savedShapes.push(savedShape);
        selectedSavedShapeId = savedShape.id;
        persistSavedShapes();
        renderSavedShapeButtons(savedShape.id);
        savedShapeNameInput.value = "";
        updateActionStates();
    }

    function startNewCustomShape() {
        selectedSavedShapeId = null;
        shapePoints.length = 0;
        savedShapeNameInput.value = "";
        shapePanel.hidden = false;
        renderSavedShapeButtons();
        drawShapeCanvas();
        updateActionStates();

        if (isCustomActive()) {
            droneFleet.setFormation("idle");
        }
    }

    function loadSavedShape(savedShapeId, options = {}) {
        const {openPanel = true, selectCustom = true} = options;
        const selectedShape = savedShapes.find((shape) => shape.id === savedShapeId);

        if (!selectedShape) {
            return;
        }

        selectedSavedShapeId = savedShapeId;
        shapePoints.length = 0;
        shapePoints.push(...selectedShape.points.map((point) => ({x: point.x, y: point.y})));
        shapeDroneCount = selectedShape.droneCount || shapeDroneCount;
        shapeDroneCountInput.value = shapeDroneCount;
        shapeDroneCountValue.textContent = shapeDroneCount;
        renderSavedShapeButtons(savedShapeId);

        if (selectCustom) {
            onCustomSelected();
        }

        if (openPanel) {
            shapePanel.hidden = false;
        }

        drawShapeCanvas();
        updateActionStates();
        applyToFleet();
    }

    function deleteSelectedCustomShape() {
        if (!selectedSavedShapeId) {
            return;
        }

        const selectedShapeIndex = savedShapes.findIndex((shape) => shape.id === selectedSavedShapeId);

        if (selectedShapeIndex === -1) {
            selectedSavedShapeId = null;
            updateActionStates();
            return;
        }

        savedShapes.splice(selectedShapeIndex, 1);
        selectedSavedShapeId = null;
        shapePoints.length = 0;
        savedShapeNameInput.value = "";
        persistSavedShapes();
        renderSavedShapeButtons();
        drawShapeCanvas();
        updateActionStates();

        if (isCustomActive()) {
            droneFleet.setFormation("idle");
        }
    }

    function getSavedShapeName() {
        const customName = savedShapeNameInput.value.trim();

        if (customName) {
            return customName;
        }

        return `Shape ${savedShapes.length + 1}`;
    }

    function loadSavedShapes() {
        try {
            const savedShapeData = JSON.parse(localStorage.getItem(savedShapesStorageKey) || "[]");

            if (!Array.isArray(savedShapeData)) {
                return [];
            }

            return savedShapeData.filter((shape) => {
                return shape && typeof shape.id === "string" && Array.isArray(shape.points);
            });
        } catch {
            return [];
        }
    }

    function persistSavedShapes() {
        localStorage.setItem(savedShapesStorageKey, JSON.stringify(savedShapes));
    }

    function renderSavedShapeButtons(activeShapeId) {
        selectedSavedShapeId = activeShapeId || selectedSavedShapeId;
        customShapeButtons.replaceChildren();

        if (savedShapes.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.textContent = "No saved shapes";
            customShapeButtons.appendChild(emptyState);
        }

        for (const savedShape of savedShapes) {
            const button = document.createElement("button");
            button.className = "shape-button";
            button.classList.toggle("is-active", savedShape.id === activeShapeId);
            button.type = "button";
            button.draggable = true;
            button.textContent = savedShape.name;
            button.addEventListener("dragstart", (event) => {
                event.dataTransfer.setData("text/shape", "custom");
                event.dataTransfer.setData("text/custom-shape-id", savedShape.id);
                event.dataTransfer.setData("text/custom-shape-name", savedShape.name);
                event.dataTransfer.effectAllowed = "copy";
            });
            button.addEventListener("click", () => {
                loadSavedShape(savedShape.id);
            });
            customShapeButtons.appendChild(button);
        }

        customShapeButtons.appendChild(createAddCustomShapeButton());
    }

    function createAddCustomShapeButton() {
        const button = document.createElement("button");
        button.id = "add-custom-shape";
        button.className = "shape-button add-custom-shape-button";
        button.type = "button";
        button.textContent = "+";
        button.addEventListener("click", startNewCustomShape);

        return button;
    }

    function updateActionStates() {
        saveShapeButton.disabled = shapePoints.length < 3;
        deleteShapeButton.disabled = !selectedSavedShapeId;
    }

    function drawShapeCanvas() {
        const width = shapeCanvas.width;
        const height = shapeCanvas.height;

        shapeContext.clearRect(0, 0, width, height);
        drawShapeGrid(width, height);

        if (shapePoints.length === 0) {
            return;
        }

        shapeContext.lineWidth = 5;
        shapeContext.lineCap = "round";
        shapeContext.lineJoin = "round";
        shapeContext.strokeStyle = "#7df7ff";
        shapeContext.beginPath();
        shapeContext.moveTo(shapePoints[0].x * width, shapePoints[0].y * height);

        for (let i = 1; i < shapePoints.length; i += 1) {
            shapeContext.lineTo(shapePoints[i].x * width, shapePoints[i].y * height);
        }

        if (shapePoints.length > 2) {
            shapeContext.closePath();
        }

        shapeContext.stroke();

        shapeContext.fillStyle = "#ffffff";
        for (let i = 0; i < shapePoints.length; i += Math.max(1, Math.floor(shapePoints.length / 18))) {
            shapeContext.beginPath();
            shapeContext.arc(shapePoints[i].x * width, shapePoints[i].y * height, 3.2, 0, Math.PI * 2);
            shapeContext.fill();
        }
    }

    function drawShapeGrid(width, height) {
        shapeContext.fillStyle = "rgba(255, 255, 255, 0.04)";
        shapeContext.fillRect(0, 0, width, height);
        shapeContext.strokeStyle = "rgba(255, 255, 255, 0.12)";
        shapeContext.lineWidth = 1;

        for (let x = 0; x <= width; x += width / 4) {
            shapeContext.beginPath();
            shapeContext.moveTo(x, 0);
            shapeContext.lineTo(x, height);
            shapeContext.stroke();
        }

        for (let y = 0; y <= height; y += height / 4) {
            shapeContext.beginPath();
            shapeContext.moveTo(0, y);
            shapeContext.lineTo(width, y);
            shapeContext.stroke();
        }
    }
}
