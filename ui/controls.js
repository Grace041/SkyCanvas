export function createControls({droneFleet, onShapeSelected}) {
    const rotationSpeedInput = document.querySelector("#rotation-speed");
    const droneColorInput = document.querySelector("#drone-color");
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

    droneFleet.setRotationSpeed(initialRotationSpeed);
    droneFleet.setColor(initialDroneColor);

    return {
        setActiveShape(shape) {
            shapeButtons.forEach((button) => {
                button.classList.toggle("is-active", button.dataset.shape === shape);
            });
        }
    };
}
