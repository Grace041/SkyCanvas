import * as THREE from "/build/three.module.js";

export function getIdlePosition(i, droneCount) {
    const columns = Math.ceil(Math.sqrt(droneCount * 2));
    const rows = Math.ceil(droneCount / columns);
    const usableFloorSize = 44;
    const spacing = Math.min(4, usableFloorSize / Math.max(1, columns - 1), usableFloorSize / Math.max(1, rows - 1));
    const droneRadius = 0.25;
    const floorY = -10;
    const row = Math.floor(i / columns);
    const column = i % columns;
    const x = (column - (columns - 1) / 2) * spacing;
    const z = (row - (rows - 1) / 2) * spacing;

    return new THREE.Vector3(x, floorY + droneRadius, z);
}

export function getHeartPosition(i, droneCount) {
    const progress = i / droneCount;
    const angle = progress * Math.PI * 2;
    const layer = i % 5;
    const scale = 0.65;
    const heightOffset = 8;
    const depthSpacing = 1.2;

    const x = 16 * Math.pow(Math.sin(angle), 3);
    const y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);
    const z = (layer - 2) * depthSpacing;

    return new THREE.Vector3(x * scale, y * scale + heightOffset, z);
}

export function getPlanetPosition(i, droneCount) {
    const planetDroneCount = Math.floor(droneCount * 0.72);
    const centerY = 6;
    const planetRadius = 5.5;

    if (i < planetDroneCount) {
        return getPlanetBodyPosition(i, planetDroneCount, centerY, planetRadius);
    }

    return getPlanetRingPosition(i - planetDroneCount, droneCount - planetDroneCount, centerY);
}

function getPlanetBodyPosition(i, planetDroneCount, centerY, planetRadius) {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (i / Math.max(1, planetDroneCount - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const angle = i * goldenAngle;
    const x = Math.cos(angle) * radiusAtY * planetRadius;
    const z = Math.sin(angle) * radiusAtY * planetRadius;

    return new THREE.Vector3(x, y * planetRadius + centerY, z);
}

function getPlanetRingPosition(i, ringDroneCount, centerY) {
    const ringBands = 3;
    const band = i % ringBands;
    const dronesPerBand = Math.ceil(ringDroneCount / ringBands);
    const bandIndex = Math.floor(i / ringBands);
    const angle = (bandIndex / dronesPerBand) * Math.PI * 2 + band * 0.18;
    const ringRadius = 7.5 + band * 0.8;
    const tilt = 0.55;
    const localX = Math.cos(angle) * ringRadius;
    const localZ = Math.sin(angle) * ringRadius;
    const y = -localZ * Math.sin(tilt) + (band - 1) * 0.18;
    const z = localZ * Math.cos(tilt);

    return new THREE.Vector3(localX, y + centerY, z);
}
