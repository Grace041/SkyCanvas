# Sky Canvas

Sky Canvas is an interactive 3D drone show simulator built with Three.js. It lets users design animated drone formations, customize colours and motion, add music, build a show timeline, and place the performance inside different 3D city/background scenes.

## Features

- 3D drone fleet rendered in real time with Three.js
- Built-in formations: heart, star, planet, spiral, Mobius strip, and idle
- Custom shape drawing tool for creating user-defined drone formations
- Timeline editor for sequencing drone formations and music
- Music upload, saved tracks, volume control, and beat-sync effects
- Adjustable drone colour, breathing animation, and rotation speed
- Background scene controls with imported 3D models such as city skylines, Sydney Opera House, ferris wheel, airplane, and Asian city buildings
- Camera controls for exploring the scene

## How to Run

This project is can be run with the **Live Server** extension in Visual Studio Code.

1. Open the `SkyCanvas` project folder in VS Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right click `index.html`.
4. Select **Open with Live Server**.
5. The project will open in your browser through a local development server.

Do not open `index.html` directly from the file system, because the project uses ES modules and local 3D assets that need to be served through a local server.