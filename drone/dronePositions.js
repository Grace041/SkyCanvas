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

export function getStarPosition(i, droneCount) {
    const faceLineDroneCount = Math.floor(droneCount * 0.78);
    const centerY = 6;
    const outerRadius = 8.6;
    const innerRadius = 3.9;
    const depth = 1;
    const relief = 3.2;

    if (i < faceLineDroneCount) {
        return getStarFaceLinePosition(i, faceLineDroneCount, centerY, outerRadius, innerRadius, depth, relief);
    }

    return getStarDepthEdgePosition(i - faceLineDroneCount, droneCount - faceLineDroneCount, centerY, outerRadius, innerRadius, depth);
}

export function getCustomShapePosition(i, droneCount, shapePoints) {
    if (!shapePoints || shapePoints.length < 2) {
        return getIdlePosition(i, droneCount);
    }

    const depthBands = 3;
    const band = i % depthBands;
    const samplesPerBand = Math.ceil(droneCount / depthBands);
    const pointOnPath = sampleShapePath(shapePoints, Math.floor(i / depthBands), samplesPerBand);
    const centeredPoint = normalizeShapePoint(pointOnPath, shapePoints);
    const shapeWidth = 18;
    const shapeHeight = 14;
    const centerY = 6;

    return new THREE.Vector3(
        centeredPoint.x * shapeWidth,
        -centeredPoint.y * shapeHeight + centerY,
        (band - 1) * 0.75
    );
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

function getStarFaceLinePosition(i, faceLineDroneCount, centerY, outerRadius, innerRadius, depth, relief) {
    const face = i % 2;
    const faceIndex = Math.floor(i / 2);
    const dronesPerFace = Math.ceil(faceLineDroneCount / 2);
    const outlineDroneCount = Math.floor(dronesPerFace * 0.48);
    const faceDirection = face === 0 ? 1 : -1;
    const outlineZ = faceDirection * depth / 2;
    const peakZ = faceDirection * (depth / 2 + relief);

    if (faceIndex < outlineDroneCount) {
        const point = sampleStarPerimeter(faceIndex, outlineDroneCount, outerRadius, innerRadius);

        return new THREE.Vector3(point.x, point.y + centerY, outlineZ);
    }

    return getStarSeamPosition(
        faceIndex - outlineDroneCount,
        dronesPerFace - outlineDroneCount,
        centerY,
        outerRadius,
        innerRadius,
        peakZ,
        outlineZ
    );
}

function getStarSeamPosition(i, seamDroneCount, centerY, outerRadius, innerRadius, peakZ, outlineZ) {
    const vertices = getStarVertices(outerRadius, innerRadius);
    const seamIndex = i % vertices.length;
    const dronesPerSeam = Math.ceil(seamDroneCount / vertices.length);
    const seamProgress = ((Math.floor(i / vertices.length) + 1) / (dronesPerSeam + 1));
    const vertex = vertices[seamIndex];
    const x = vertex.x * seamProgress;
    const y = vertex.y * seamProgress;
    const z = THREE.MathUtils.lerp(peakZ, outlineZ, seamProgress);

    return new THREE.Vector3(x, y + centerY, z);
}

function getStarDepthEdgePosition(i, edgeDroneCount, centerY, outerRadius, innerRadius, depth) {
    const vertices = getStarVertices(outerRadius, innerRadius);
    const edgeIndex = i % vertices.length;
    const dronesPerEdge = Math.ceil(edgeDroneCount / vertices.length);
    const progress = ((Math.floor(i / vertices.length) + 1) / (dronesPerEdge + 1));
    const vertex = vertices[edgeIndex];
    const z = THREE.MathUtils.lerp(depth / 2, -depth / 2, progress);

    return new THREE.Vector3(vertex.x, vertex.y + centerY, z);
}

function sampleStarPerimeter(sampleIndex, sampleCount, outerRadius, innerRadius) {
    const vertices = getStarVertices(outerRadius, innerRadius);
    const segmentLengths = [];
    let totalLength = 0;

    for (let i = 0; i < vertices.length; i += 1) {
        const currentPoint = vertices[i];
        const nextPoint = vertices[(i + 1) % vertices.length];
        const segmentLength = Math.hypot(nextPoint.x - currentPoint.x, nextPoint.y - currentPoint.y);

        segmentLengths.push(segmentLength);
        totalLength += segmentLength;
    }

    let targetDistance = (sampleIndex / sampleCount) * totalLength;

    for (let i = 0; i < vertices.length; i += 1) {
        if (targetDistance <= segmentLengths[i]) {
            const currentPoint = vertices[i];
            const nextPoint = vertices[(i + 1) % vertices.length];
            const progress = targetDistance / Math.max(segmentLengths[i], 0.0001);

            return {
                x: currentPoint.x + (nextPoint.x - currentPoint.x) * progress,
                y: currentPoint.y + (nextPoint.y - currentPoint.y) * progress
            };
        }

        targetDistance -= segmentLengths[i];
    }

    return vertices[vertices.length - 1];
}

function getStarVertices(outerRadius, innerRadius) {
    const vertices = [];

    for (let i = 0; i < 10; i += 1) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = -Math.PI / 2 + i * Math.PI / 5;

        vertices.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        });
    }

    return vertices;
}

function sampleShapePath(shapePoints, sampleIndex, sampleCount) {
    const segmentLengths = [];
    let totalLength = 0;

    for (let i = 0; i < shapePoints.length; i += 1) {
        const currentPoint = shapePoints[i];
        const nextPoint = shapePoints[(i + 1) % shapePoints.length];
        const segmentLength = Math.hypot(nextPoint.x - currentPoint.x, nextPoint.y - currentPoint.y);

        segmentLengths.push(segmentLength);
        totalLength += segmentLength;
    }

    if (totalLength === 0) {
        return shapePoints[0];
    }

    let targetDistance = (sampleIndex / sampleCount) * totalLength;

    for (let i = 0; i < shapePoints.length; i += 1) {
        if (targetDistance <= segmentLengths[i]) {
            const currentPoint = shapePoints[i];
            const nextPoint = shapePoints[(i + 1) % shapePoints.length];
            const progress = targetDistance / Math.max(segmentLengths[i], 0.0001);

            return {
                x: currentPoint.x + (nextPoint.x - currentPoint.x) * progress,
                y: currentPoint.y + (nextPoint.y - currentPoint.y) * progress
            };
        }

        targetDistance -= segmentLengths[i];
    }

    return shapePoints[shapePoints.length - 1];
}

function normalizeShapePoint(point, shapePoints) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < shapePoints.length; i += 1) {
        minX = Math.min(minX, shapePoints[i].x);
        maxX = Math.max(maxX, shapePoints[i].x);
        minY = Math.min(minY, shapePoints[i].y);
        maxY = Math.max(maxY, shapePoints[i].y);
    }

    const width = Math.max(maxX - minX, 0.0001);
    const height = Math.max(maxY - minY, 0.0001);
    const largestDimension = Math.max(width, height);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
        x: (point.x - centerX) / largestDimension,
        y: (point.y - centerY) / largestDimension
    };
}
