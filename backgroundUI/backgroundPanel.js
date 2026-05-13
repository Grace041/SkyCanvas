export function createBackgroundPanel(){
    const app = document.querySelector("#app");
    app.innerHTML = `
        <div id="left-area">
            <div class="render-view"></div>
        </div>
        <div id="left-panel">
            <div class="panel-section">
                <h3>Background Controls</h3>
                <p class="hint">Add a model first, then drag the sliders to move, resize and rotate it.</p>
                <div id="model-info">Selected Model: None</div>
            </div>
            <div class="panel-section">
                <div class="panel-title">Model</div>
                <button id="addModel" class="wide-button main-button">Add City Model</button>
                <button id="addFerrisWheel" class="wide-button main-button">Add Ferris Wheel</button>
                <button id="addOperaHouse" class="wide-button main-button">Add Opera House</button>
                <button id="addAirplane" class="wide-button main-button">Add Airplane</button>
                <button id="addAsianCity" class="wide-button main-button">Add Asian City</button>
                <button id="addNightSkyline" class="wide-button main-button">Add Night Skyline</button>
                <div class="button-row">
                    <button id="prevModel">Previous</button>
                    <button id="nextModel">Next</button>
                </div>
                <button id="deleteModel" class="wide-button delete-button">Delete Model</button>
                <button id="resetModel" class="wide-button">Reset Model</button>
            </div>
            <div class="panel-section">
                <div class="panel-title">Move</div>
                <div class="slider-box">
                    <div class="slider-top">
                        <div class="slider-name">Left / Right</div>
                        <div class="slider-value" id="xValue">0</div>
                    </div>
                    <div class="slider-ends">
                        <span>Left</span>
                        <span>Right</span>
                    </div>
                    <input id="xSlider" type="range" min="-4000" max="4000" step="20" value="0">
                </div>
                <div class="slider-box">
                    <div class="slider-top">
                        <div class="slider-name">Forward / Back</div>
                        <div class="slider-value" id="zValue">-40</div>
                    </div>
                    <div class="slider-ends">
                        <span>Forward</span>
                        <span>Back</span>
                    </div>
                    <input id="zSlider" type="range" min="-4000" max="4000" step="20" value="-40">
                </div>
                <div class="slider-box">
                    <div class="slider-top">
                        <div class="slider-name">Down / Up</div>
                        <div class="slider-value" id="yValue">-10</div>
                    </div>
                    <div class="slider-ends">
                        <span>Down</span>
                        <span>Up</span>
                    </div>
                    <input id="ySlider" type="range" min="-500" max="1000" step="10" value="-10">
                </div>
            </div>
            <div class="panel-section">
                <div class="panel-title">Size</div>
                <div class="slider-box">
                    <div class="slider-top">
                        <div class="slider-name">Smaller / Bigger</div>
                        <div class="slider-value" id="scaleValue">1.0</div>
                    </div>
                    <div class="slider-ends">
                        <span>Smaller</span>
                        <span>Bigger</span>
                    </div>
                    <input id="scaleSlider" type="range" min="0.1" max="150" step="0.1" value="1">
                </div>
            </div>
            <div class="panel-section">
                <div class="panel-title">Rotation</div>
                <div class="slider-box">
                    <div class="slider-top">
                        <div class="slider-name">Rotate L / Rotate R</div>
                        <div class="slider-value" id="rotationValue">0°</div>
                    </div>
                    <div class="slider-ends">
                        <span>Left</span>
                        <span>Right</span>
                    </div>
                    <input id="rotationSlider" type="range" min="-180" max="180" step="1" value="0">
                </div>
            </div>
        </div>
    `;
}
