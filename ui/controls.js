export function createControls({droneFleet, onShapeSelected}) {
    const rotationSpeedInput = document.querySelector("#rotation-speed");
    const droneColorInput = document.querySelector("#drone-color");
    const breathingButton = document.querySelector("#breathing-button");
    const beatSyncButton = document.querySelector("#beat-sync-button");
    const shapeButtons = document.querySelectorAll(".shape-option");
    const initialRotationSpeed = Number(rotationSpeedInput.value);
    const initialDroneColor = droneColorInput.value;

    shapeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            onShapeSelected(button.dataset.shape);
        });

        button.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData("text/shape", button.dataset.shape);
            event.dataTransfer.effectAllowed = "copy";
        });
    });

    rotationSpeedInput.addEventListener("input", () => {
        droneFleet.setRotationSpeed(Number(rotationSpeedInput.value));
    });

    droneColorInput.addEventListener("input", () => {
        droneFleet.setColor(droneColorInput.value);
    });

    let breathingEnabled = true;
    if (breathingButton) {
        breathingButton.addEventListener("click", () => {
            breathingEnabled = !breathingEnabled;
            droneFleet.setBreathing(breathingEnabled);
            if (breathingEnabled === true) {
                breathingButton.textContent = "Disable Breathing";
                beatSyncEnabled = false;
                droneFleet.setBeatSync(false);
                beatSyncButton.textContent = "Enable Beat Sync";
            } else {
                breathingButton.textContent = "Enable Breathing";
            }
        });
    }

    let beatSyncEnabled = false;
    if (beatSyncButton) {
        beatSyncButton.addEventListener("click", () => {
            beatSyncEnabled = !beatSyncEnabled;
            droneFleet.setBeatSync(beatSyncEnabled);
            if (beatSyncEnabled === true) {
                beatSyncButton.textContent = "Disable Beat Sync";
                breathingEnabled = false;
                droneFleet.setBreathing(false);
                breathingButton.textContent = "Enable Breathing";
            } else {
                beatSyncButton.textContent = "Enable Beat Sync";
            }
        });
    }

    droneFleet.setRotationSpeed(initialRotationSpeed);
    droneFleet.setColor(initialDroneColor);

    return {
        setActiveShape(shape) {
            shapeButtons.forEach((button) => {
                button.classList.toggle("is-active", button.dataset.shape === shape);
            });
        },
        getTimelineSettings() {
            return {
                color: droneColorInput.value,
                rotationSpeed: Number(rotationSpeedInput.value)
            };
        },
        applyTimelineSettings({color, rotationSpeed}) {
            if (color) {
                droneColorInput.value = color;
                droneFleet.setColor(color);
            }

            if (typeof rotationSpeed === "number") {
                rotationSpeedInput.value = rotationSpeed;
                droneFleet.setRotationSpeed(rotationSpeed);
            }
        }
    };
}
