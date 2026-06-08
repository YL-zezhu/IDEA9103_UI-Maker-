//  Stage 0: Diffusion  →  Stage 1: Tendrils

//  STRUCTURE

//  1. CANVAS CONFIG          canvas dimensions & background
//  2. REGION CONFIG          rectangle definitions
//  3. COLOUR HELPERS         all colour values live here
//  4. class DiffusionEffect  Stage-0 logic
//  5. class TendrilEffect    Stage-1 logic
//  6. class EffectRegion     one rect + one state machine
//  7. class EffectManager    drives all regions
//  8. p5.js LIFECYCLE        setup() and draw()
//  9. UI BINDINGS            DOM event listeners (no inline HTML)
//  10. WINDOW API            public functions for HTML buttons




//  1. CANVAS CONFIG
//  Change canvasWidth / canvasHeight to resize the sketch.
//  For a full-browser canvas set them to windowWidth /
//  windowHeight inside setup() and uncomment windowResized().


let canvasWidth           = 900;
let canvasHeight          = 600;
let canvasBackgroundColor = [30, 28, 28];  



//  2. REGION CONFIG
//  Add or remove objects here to define effect rectangles.
//
//  Required fields per region:
//    regionX, regionY, regionWidth, regionHeight
//
//  Optional overrides (class defaults used when omitted):
//
//  Timing:
//    stageDurationFrames   — frames before switching stages
//    startStage            — 0 = diffusion first, 1 = tendrils first
//
//  Diffusion:
//    diffusionMaxCircles, diffusionNoiseScaleXY,
//    diffusionNoiseScaleTime, diffusionMinRadius,
//    diffusionMaxRadius, diffusionTrailFadeAlpha,
//    diffusionDotAlpha, diffusionSpawnRate
//
//  Tendrils:
//    tendrilMaxActiveTips, tendrilSpawnPerFrame,
//    tendrilStepLength, tendrilAngleNoiseScale,
//    tendrilAngleBendStrength, tendrilBranchProbability,
//    tendrilMaxLifeFrames, tendrilStrokeAlpha,
//    tendrilStrokeWeight, tendrilTrailFadeAlpha,
//    tendrilSpreadBeyondRect  (true = escape full canvas)


let effectRegions = [
  {
    regionX:                  30,
    regionY:                  60,
    regionWidth:              380,
    regionHeight:             260,

    stageDurationFrames:      660,

    diffusionMaxCircles:      180,
    diffusionMaxRadius:       52,
    diffusionNoiseScaleTime:  0.0008,

    tendrilMaxActiveTips:     260,
    tendrilBranchProbability: 0.013,
    tendrilSpreadBeyondRect:  true,
  },
  {
    regionX:                  460,
    regionY:                  80,
    regionWidth:              410,
    regionHeight:             200,

    stageDurationFrames:      540,

    diffusionMaxCircles:      110,
    diffusionMaxRadius:       38,
    diffusionSpawnRate:       2,

    tendrilMaxActiveTips:     200,
    tendrilStepLength:        3.2,
    tendrilBranchProbability: 0.018,
    tendrilSpreadBeyondRect:  true,
  },
  {
    regionX:                  460,
    regionY:                  330,
    regionWidth:              410,
    regionHeight:             220,

    stageDurationFrames:      480,
    startStage:               0,

    diffusionMaxCircles:      90,
    diffusionMaxRadius:       44,
    diffusionNoiseScaleXY:    0.0035,

    tendrilAngleBendStrength: 1.1,
    tendrilSpreadBeyondRect:  true,
  },
];



//  3. COLOUR HELPERS
//  Edit these four functions to retheme the entire sketch.
//  All colour decisions flow through here — nowhere else.


function buildDotBleedColor(alphaValue) {
  // Outer halo ring around each diffusion circle
  return color(178, 16, 16, alphaValue);
}

function buildDotFillColor(alphaValue) {
  // Main body and bright core of each diffusion circle
  return color(178, 16, 16, alphaValue);
}

function buildTendrilStrokeColor(alphaValue) {
  // Primary vein colour for tendril lines
  return color(150, 10, 10, alphaValue);
}

function buildTendrilGlowColor(alphaValue) {
  // Thin hot-ember shimmer layered on top of each tendril
  return color(210, 45, 10, alphaValue);
}



//  4. class DiffusionEffect
//  Stage 0 — spreading red circles driven by Perlin noise.
//  Created once per EffectRegion; called each frame while
//  that region is in state 0.


class DiffusionEffect {

  constructor(regionConfig) {
    // Geometry
    this.regionXPosition          = regionConfig.regionX;
    this.regionYPosition          = regionConfig.regionY;
    this.rectangleWidth           = regionConfig.regionWidth;
    this.rectangleHeight          = regionConfig.regionHeight;

    // Tunable params — regionConfig values override defaults
    this.diffusionMaxCircles      = regionConfig.diffusionMaxCircles      ?? 200;
    this.diffusionNoiseScaleXY    = regionConfig.diffusionNoiseScaleXY    ?? 0.003;
    this.diffusionNoiseScaleTime  = regionConfig.diffusionNoiseScaleTime  ?? 0.0009;
    this.diffusionMinRadius       = regionConfig.diffusionMinRadius       ?? 2;
    this.diffusionMaxRadius       = regionConfig.diffusionMaxRadius       ?? 55;
    this.diffusionTrailFadeAlpha  = regionConfig.diffusionTrailFadeAlpha  ?? 4;
    this.diffusionDotAlpha        = regionConfig.diffusionDotAlpha        ?? 22;
    this.diffusionSpawnRate       = regionConfig.diffusionSpawnRate       ?? 3;

    // Internal state
    this.circlePool               = [];
    this.diffusionFrameCount      = 0;
  }

  // Called when this stage activates or re-activates
  reset() {
    this.circlePool          = [];
    this.diffusionFrameCount = 0;
  }

  // Add one circle descriptor with its own independent noise offsets
  _spawnCircle() {
    this.circlePool.push({
      circleSeedX:        random(this.regionXPosition,
                                 this.regionXPosition + this.rectangleWidth),
      circleSeedY:        random(this.regionYPosition,
                                 this.regionYPosition + this.rectangleHeight),
      circleNoiseOffsetX: random(0,    9999),
      circleNoiseOffsetY: random(1000, 9999),
      circleNoiseOffsetR: random(2000, 9999),
      circleBirthFrame:   this.diffusionFrameCount,
      circleMaxRadius:    random(this.diffusionMinRadius * 2, this.diffusionMaxRadius),
    });
  }

  // Draw one frame of diffusion.
  // graphicsBuffer   : p5.Graphics — the region's off-screen layer
  // stageDurationFrames : number   — used for growth timing
  update(graphicsBuffer, stageDurationFrames) {
    this.diffusionFrameCount++;

    // Spawn rate ramps from slow → fast as the stage matures
    let stageProgress    = this.diffusionFrameCount / stageDurationFrames;
    let dynamicSpawnRate = floor(
      this.diffusionSpawnRate * (0.3 + stageProgress * 3.5)
    );

    for (
      let spawnIndex = 0;
      spawnIndex < dynamicSpawnRate && this.circlePool.length < this.diffusionMaxCircles;
      spawnIndex++
    ) {
      this._spawnCircle();
    }

    // Clip all drawing to this rectangle
    graphicsBuffer.drawingContext.save();
    graphicsBuffer.drawingContext.beginPath();
    graphicsBuffer.drawingContext.rect(
      this.regionXPosition,
      this.regionYPosition,
      this.rectangleWidth,
      this.rectangleHeight
    );
    graphicsBuffer.drawingContext.clip();

    // Soft white wash each frame — creates the stain / bleed trail
    graphicsBuffer.noStroke();
    graphicsBuffer.fill(255, 255, 255, this.diffusionTrailFadeAlpha);
    graphicsBuffer.rect(
      this.regionXPosition, this.regionYPosition,
      this.rectangleWidth,  this.rectangleHeight
    );

    for (let circleDescriptor of this.circlePool) {
      let circleAge    = this.diffusionFrameCount - circleDescriptor.circleBirthFrame;
      let circleAgePct = min(circleAge / (stageDurationFrames * 0.6), 1);

      // Perlin-driven radius — grows with age
      let radiusNoiseValue = noise(
        circleDescriptor.circleNoiseOffsetR +
        this.diffusionFrameCount * this.diffusionNoiseScaleTime
      );
      let currentRadius = this.diffusionMinRadius +
        circleAgePct * circleDescriptor.circleMaxRadius * (0.5 + radiusNoiseValue * 0.5);

      // Perlin-driven position drift
      let positionDriftX = (noise(
        circleDescriptor.circleNoiseOffsetX +
        this.diffusionFrameCount * this.diffusionNoiseScaleTime
      ) - 0.5) * currentRadius * 0.6;

      let positionDriftY = (noise(
        circleDescriptor.circleNoiseOffsetY +
        this.diffusionFrameCount * this.diffusionNoiseScaleTime
      ) - 0.5) * currentRadius * 0.6;

      let drawPositionX = constrain(
        circleDescriptor.circleSeedX + positionDriftX,
        this.regionXPosition + currentRadius,
        this.regionXPosition + this.rectangleWidth - currentRadius
      );
      let drawPositionY = constrain(
        circleDescriptor.circleSeedY + positionDriftY,
        this.regionYPosition + currentRadius,
        this.regionYPosition + this.rectangleHeight - currentRadius
      );

      // Layer 1 — outer bleed halo
      graphicsBuffer.fill(buildDotBleedColor(6));
      graphicsBuffer.ellipse(drawPositionX, drawPositionY,
                             currentRadius * 2.8, currentRadius * 2.8);

      // Layer 2 — main dot body
      graphicsBuffer.fill(buildDotFillColor(this.diffusionDotAlpha));
      graphicsBuffer.ellipse(drawPositionX, drawPositionY,
                             currentRadius * 2,   currentRadius * 2);

      // Layer 3 — bright wet-ink core
      graphicsBuffer.fill(buildDotFillColor(this.diffusionDotAlpha + 20));
      graphicsBuffer.ellipse(drawPositionX, drawPositionY,
                             currentRadius * 0.5, currentRadius * 0.5);
    }

    graphicsBuffer.drawingContext.restore();
  }
}


// ════════════════════════════════════════════════════════════
//  5. class TendrilEffect
//  Stage 1 — mycelium-like tendrils steered by a Perlin field.
// ════════════════════════════════════════════════════════════

class TendrilEffect {

  constructor(regionConfig, totalCanvasWidth, totalCanvasHeight) {
    // Geometry
    this.regionXPosition          = regionConfig.regionX;
    this.regionYPosition          = regionConfig.regionY;
    this.rectangleWidth           = regionConfig.regionWidth;
    this.rectangleHeight          = regionConfig.regionHeight;
    this.totalCanvasWidth         = totalCanvasWidth;
    this.totalCanvasHeight        = totalCanvasHeight;

    // Tunable params
    this.tendrilMaxActiveTips     = regionConfig.tendrilMaxActiveTips     ?? 300;
    this.tendrilSpawnPerFrame     = regionConfig.tendrilSpawnPerFrame     ?? 5;
    this.tendrilStepLength        = regionConfig.tendrilStepLength        ?? 2.4;
    this.tendrilAngleNoiseScale   = regionConfig.tendrilAngleNoiseScale   ?? 0.006;
    this.tendrilAngleBendStrength = regionConfig.tendrilAngleBendStrength ?? 0.9;
    this.tendrilBranchProbability = regionConfig.tendrilBranchProbability ?? 0.012;
    this.tendrilMaxLifeFrames     = regionConfig.tendrilMaxLifeFrames     ?? 340;
    this.tendrilStrokeAlpha       = regionConfig.tendrilStrokeAlpha       ?? 130;
    this.tendrilStrokeWeight      = regionConfig.tendrilStrokeWeight      ?? 1.1;
    this.tendrilTrailFadeAlpha    = regionConfig.tendrilTrailFadeAlpha    ?? 1;
    this.tendrilSpreadBeyondRect  = regionConfig.tendrilSpreadBeyondRect  ?? true;

    // Internal state
    this.activeTendrilTips        = [];
    this.tendrilFrameCount        = 0;
  }

  reset() {
    this.activeTendrilTips = [];
    this.tendrilFrameCount = 0;
  }

  // Spawn a tendril tip at an explicit position with a given heading
  _spawnTendrilTip(startPositionX, startPositionY, initialHeadingAngle) {
    this.activeTendrilTips.push({
      tendrilCurrentX:      startPositionX,
      tendrilCurrentY:      startPositionY,
      tendrilHeadingAngle:  initialHeadingAngle ?? random(TWO_PI),
      tendrilRemainingLife: this.tendrilMaxLifeFrames + random(-80, 80),
      tendrilLineWeight:    random(0.6, this.tendrilStrokeWeight * 2),
      tendrilNoiseOffset:   random(0, 9999),
    });
  }

  // Pick a random point on the rectangle border and spawn inward
  _spawnTipFromRectEdge() {
    let edgeSide = floor(random(4));
    let spawnPositionX, spawnPositionY, facingAngle;

    if (edgeSide === 0) {          // top
      spawnPositionX = random(this.regionXPosition,
                              this.regionXPosition + this.rectangleWidth);
      spawnPositionY = this.regionYPosition;
      facingAngle    = random(PI * 0.1, PI * 0.9);
    } else if (edgeSide === 1) {   // right
      spawnPositionX = this.regionXPosition + this.rectangleWidth;
      spawnPositionY = random(this.regionYPosition,
                              this.regionYPosition + this.rectangleHeight);
      facingAngle    = random(PI * 0.6, PI * 1.4);
    } else if (edgeSide === 2) {   // bottom
      spawnPositionX = random(this.regionXPosition,
                              this.regionXPosition + this.rectangleWidth);
      spawnPositionY = this.regionYPosition + this.rectangleHeight;
      facingAngle    = random(PI * 1.1, PI * 1.9);
    } else {                       // left
      spawnPositionX = this.regionXPosition;
      spawnPositionY = random(this.regionYPosition,
                              this.regionYPosition + this.rectangleHeight);
      facingAngle    = random(-PI * 0.4, PI * 0.4);
    }

    this._spawnTendrilTip(spawnPositionX, spawnPositionY, facingAngle);
  }

  // Draw one frame of tendrils.
  update(graphicsBuffer, stageDurationFrames) {
    this.tendrilFrameCount++;
    let stageProgress = this.tendrilFrameCount / stageDurationFrames;

    // Trail decay — full canvas or clipped to rect
    graphicsBuffer.noStroke();
    graphicsBuffer.fill(255, 255, 255, this.tendrilTrailFadeAlpha);
    if (this.tendrilSpreadBeyondRect) {
      graphicsBuffer.rect(0, 0, this.totalCanvasWidth, this.totalCanvasHeight);
    } else {
      graphicsBuffer.rect(
        this.regionXPosition, this.regionYPosition,
        this.rectangleWidth,  this.rectangleHeight
      );
    }

    // Spawn new tips, rate ramps with stage progress
    let dynamicSpawnRate = floor(
      this.tendrilSpawnPerFrame * (0.4 + stageProgress * 2.2)
    );
    for (
      let spawnIndex = 0;
      spawnIndex < dynamicSpawnRate &&
        this.activeTendrilTips.length < this.tendrilMaxActiveTips;
      spawnIndex++
    ) {
      this._spawnTipFromRectEdge();
    }

    // Step and draw each active tip
    for (
      let tipIndex = this.activeTendrilTips.length - 1;
      tipIndex >= 0;
      tipIndex--
    ) {
      let tendrilTip = this.activeTendrilTips[tipIndex];

      // 2-D Perlin field steers the heading
      let noiseFieldInputX = tendrilTip.tendrilCurrentX * this.tendrilAngleNoiseScale
                             + tendrilTip.tendrilNoiseOffset;
      let noiseFieldInputY = tendrilTip.tendrilCurrentY * this.tendrilAngleNoiseScale
                             + tendrilTip.tendrilNoiseOffset * 0.7;

      tendrilTip.tendrilHeadingAngle +=
        (noise(noiseFieldInputX, noiseFieldInputY) - 0.5) * this.tendrilAngleBendStrength;

      // Occasional sharp kink — aggressive, biological feel
      if (random() < 0.022) {
        tendrilTip.tendrilHeadingAngle += (random() - 0.5) * PI * 0.5;
      }

      let previousPositionX = tendrilTip.tendrilCurrentX;
      let previousPositionY = tendrilTip.tendrilCurrentY;
      tendrilTip.tendrilCurrentX +=
        cos(tendrilTip.tendrilHeadingAngle) * this.tendrilStepLength;
      tendrilTip.tendrilCurrentY +=
        sin(tendrilTip.tendrilHeadingAngle) * this.tendrilStepLength;

      let lifeRatio     = tendrilTip.tendrilRemainingLife / this.tendrilMaxLifeFrames;
      let computedAlpha = this.tendrilStrokeAlpha * lifeRatio;

      // Primary vein line
      graphicsBuffer.stroke(buildTendrilStrokeColor(computedAlpha));
      graphicsBuffer.strokeWeight(tendrilTip.tendrilLineWeight);
      graphicsBuffer.line(
        previousPositionX, previousPositionY,
        tendrilTip.tendrilCurrentX, tendrilTip.tendrilCurrentY
      );

      // Thin hot-ember shimmer overlaid on each segment
      graphicsBuffer.stroke(buildTendrilGlowColor(computedAlpha * 0.35));
      graphicsBuffer.strokeWeight(tendrilTip.tendrilLineWeight * 0.3);
      graphicsBuffer.line(
        previousPositionX, previousPositionY,
        tendrilTip.tendrilCurrentX, tendrilTip.tendrilCurrentY
      );

      // Branching — probability increases with stage progress
      let branchChance = this.tendrilBranchProbability * (0.5 + stageProgress);
      if (random() < branchChance &&
          this.activeTendrilTips.length < this.tendrilMaxActiveTips) {
        this._spawnTendrilTip(
          tendrilTip.tendrilCurrentX,
          tendrilTip.tendrilCurrentY,
          tendrilTip.tendrilHeadingAngle + (random() - 0.5) * PI * 0.55
        );
      }

      tendrilTip.tendrilRemainingLife--;

      let tipIsOutOfBounds =
        tendrilTip.tendrilCurrentX < -20 ||
        tendrilTip.tendrilCurrentY < -20 ||
        tendrilTip.tendrilCurrentX > this.totalCanvasWidth  + 20 ||
        tendrilTip.tendrilCurrentY > this.totalCanvasHeight + 20;

      if (tendrilTip.tendrilRemainingLife <= 0 || tipIsOutOfBounds) {
        this.activeTendrilTips.splice(tipIndex, 1);
      }
    }
  }
}


// ════════════════════════════════════════════════════════════
//  6. class EffectRegion
//  Owns one rectangle, one DiffusionEffect, one TendrilEffect,
//  and one independent state machine with its own frame clock.
//  Each region draws into its own p5.Graphics buffer so
//  regions never bleed paint into one another.
// ════════════════════════════════════════════════════════════

class EffectRegion {

  constructor(regionConfig, totalCanvasWidth, totalCanvasHeight) {
    this.regionXPosition     = regionConfig.regionX;
    this.regionYPosition     = regionConfig.regionY;
    this.rectangleWidth      = regionConfig.regionWidth;
    this.rectangleHeight     = regionConfig.regionHeight;

    this.stageDurationFrames = regionConfig.stageDurationFrames ?? 720;
    this.currentStage        = regionConfig.startStage          ?? 0;
    this.stageElapsedFrames  = 0;

    this.diffusionEffect = new DiffusionEffect(regionConfig);
    this.tendrilEffect   = new TendrilEffect(
      regionConfig, totalCanvasWidth, totalCanvasHeight
    );

    // Private off-screen buffer — isolates each region's pixels
    this.graphicsBuffer = createGraphics(totalCanvasWidth, totalCanvasHeight);
    this.graphicsBuffer.background(255);
    this.graphicsBuffer.noSmooth();
  }

  update() {
    this.stageElapsedFrames++;

    if (this.stageElapsedFrames >= this.stageDurationFrames) {
      this.stageElapsedFrames = 0;

      if (this.currentStage === 0) {
        // Diffusion → Tendrils: keep buffer (tendrils grow from the stain)
        this.tendrilEffect.reset();
        this.currentStage = 1;
      } else {
        // Tendrils → Diffusion: wipe buffer clean for next cycle
        this.graphicsBuffer.background(255);
        this.diffusionEffect.reset();
        this.currentStage = 0;
      }
    }

    this.graphicsBuffer.push();
    this.graphicsBuffer.noStroke();

    if (this.currentStage === 0) {
      this.diffusionEffect.update(this.graphicsBuffer, this.stageDurationFrames);
    } else {
      this.tendrilEffect.update(this.graphicsBuffer, this.stageDurationFrames);
    }

    this.graphicsBuffer.pop();
  }

  render() {
    image(this.graphicsBuffer, 0, 0);

    // Rectangle border
    noFill();
    stroke(40, 28, 28, 160);
    strokeWeight(1.2);
    rect(this.regionXPosition, this.regionYPosition,
         this.rectangleWidth,  this.rectangleHeight);

    // HUD label above the rectangle
    noStroke();
    fill(200, 190, 190);
    textFont('monospace');
    textSize(10);
    let stageLabelText  = this.currentStage === 0 ? 'DIFFUSION' : 'TENDRILS';
    let progressPercent = floor(
      (this.stageElapsedFrames / this.stageDurationFrames) * 100
    );
    text(
      `${stageLabelText}  ${progressPercent}%`,
      this.regionXPosition + 6,
      this.regionYPosition - 5
    );
  }
}


// ════════════════════════════════════════════════════════════
//  7. class EffectManager
//  Owns all EffectRegion instances.
//  setup() and draw() interact only through this class.
// ════════════════════════════════════════════════════════════

class EffectManager {

  constructor(regionConfigArray, totalCanvasWidth, totalCanvasHeight) {
    this.totalCanvasWidth  = totalCanvasWidth;
    this.totalCanvasHeight = totalCanvasHeight;

    this.effectRegionList = regionConfigArray.map(
      (regionConfig) =>
        new EffectRegion(regionConfig, totalCanvasWidth, totalCanvasHeight)
    );
  }

  // Call once per draw() — updates then renders every region
  tick() {
    for (let effectRegion of this.effectRegionList) {
      effectRegion.update();
      effectRegion.render();
    }
  }

  // Add a new region at runtime (called from UI or console)
  addRegion(regionConfig) {
    this.effectRegionList.push(
      new EffectRegion(regionConfig, this.totalCanvasWidth, this.totalCanvasHeight)
    );
  }

  // Remove a region by array index
  removeRegionByIndex(regionIndex) {
    if (regionIndex >= 0 && regionIndex < this.effectRegionList.length) {
      this.effectRegionList.splice(regionIndex, 1);
    }
  }

  // Jump a region directly to a specific stage without waiting
  setRegionStage(regionIndex, targetStage) {
    let effectRegion = this.effectRegionList[regionIndex];
    if (!effectRegion) return;
    effectRegion.stageElapsedFrames = 0;
    if (targetStage === 0) {
      effectRegion.graphicsBuffer.background(255);
      effectRegion.diffusionEffect.reset();
    } else {
      effectRegion.tendrilEffect.reset();
    }
    effectRegion.currentStage = targetStage;
  }

  // Returns the number of currently active regions
  getRegionCount() {
    return this.effectRegionList.length;
  }
}


// ════════════════════════════════════════════════════════════
//  8. p5.js LIFECYCLE
// ════════════════════════════════════════════════════════════

let effectManager;

function setup() {
  // To fill the browser window, replace the block below with:
  //   canvasWidth  = windowWidth;
  //   canvasHeight = windowHeight;
  let sketchCanvas = createCanvas(canvasWidth, canvasHeight);

  // p5 appends the canvas to <body> by default.
  // If you want it inside a specific element, use:
  //   sketchCanvas.parent('canvasContainer');
  // and add <div id="canvasContainer"></div> to index.html.

  noiseDetail(4, 0.5);   // 4 octaves, falloff 0.5 — organic multi-scale noise
  frameRate(60);

  effectManager = new EffectManager(effectRegions, canvasWidth, canvasHeight);

  // Wire up all DOM controls after p5 is ready
  _bindUIControls();
}

function draw() {
  background(...canvasBackgroundColor);
  effectManager.tick();
}

// Uncomment to support responsive full-window canvas:
// function windowResized() {
//   canvasWidth  = windowWidth;
//   canvasHeight = windowHeight;
//   resizeCanvas(canvasWidth, canvasHeight);
// }


// ════════════════════════════════════════════════════════════
//  9. UI BINDINGS
//  All DOM event listeners are wired here — zero onclick=""
//  attributes remain in index.html.
//  Teammates: add new button listeners in _bindUIControls().
// ════════════════════════════════════════════════════════════

function _bindUIControls() {
  let diffusionButton    = document.getElementById('btnDiffusion');
  let tendrilsButton     = document.getElementById('btnTendrils');
  let removeRegionButton = document.getElementById('btnRemoveRegion');
  let addRegionButton    = document.getElementById('btnAddRegion');
  let regionSelectMenu   = document.getElementById('regionSelect');

  if (diffusionButton) {
    diffusionButton.addEventListener('click', () => {
      let selectedRegionIndex = parseInt(regionSelectMenu.value);
      effectManager.setRegionStage(selectedRegionIndex, 0);
    });
  }

  if (tendrilsButton) {
    tendrilsButton.addEventListener('click', () => {
      let selectedRegionIndex = parseInt(regionSelectMenu.value);
      effectManager.setRegionStage(selectedRegionIndex, 1);
    });
  }

  if (removeRegionButton) {
    removeRegionButton.addEventListener('click', () => {
      let selectedRegionIndex = parseInt(regionSelectMenu.value);
      effectManager.removeRegionByIndex(selectedRegionIndex);
      _syncRegionSelectOptions();
    });
  }

  if (addRegionButton) {
    addRegionButton.addEventListener('click', () => {
      effectManager.addRegion({
        regionX:                 200,
        regionY:                 150,
        regionWidth:             260,
        regionHeight:            180,
        stageDurationFrames:     420,
        diffusionMaxRadius:      40,
        tendrilSpreadBeyondRect: true,
      });
      _syncRegionSelectOptions();
    });
  }
}

// Rebuild <select> options whenever regions are added or removed
function _syncRegionSelectOptions() {
  let regionSelectMenu    = document.getElementById('regionSelect');
  if (!regionSelectMenu) return;

  let currentCount        = effectManager.getRegionCount();
  let currentOptionCount  = regionSelectMenu.options.length;

  // Add missing options
  for (let optionIndex = currentOptionCount; optionIndex < currentCount; optionIndex++) {
    let newOption       = document.createElement('option');
    newOption.value     = optionIndex;
    newOption.textContent = `Region ${optionIndex}`;
    regionSelectMenu.appendChild(newOption);
  }

  // Remove extra options
  while (regionSelectMenu.options.length > currentCount) {
    regionSelectMenu.remove(regionSelectMenu.options.length - 1);
  }
}


// ════════════════════════════════════════════════════════════
//  10. WINDOW API
//  Functions exposed on window so they can be called from
//  the browser console for quick debugging.
//  They are NOT called from HTML onclick="" — that pattern
//  is replaced by the addEventListener bindings above.
// ════════════════════════════════════════════════════════════

window.jumpToStage = function(targetStage) {
  let regionSelectMenu    = document.getElementById('regionSelect');
  let selectedRegionIndex = regionSelectMenu ? parseInt(regionSelectMenu.value) : 0;
  effectManager.setRegionStage(selectedRegionIndex, targetStage);
};

window.addTestRegion = function(regionConfig) {
  effectManager.addRegion(regionConfig ?? {
    regionX:             100,
    regionY:             100,
    regionWidth:         220,
    regionHeight:        160,
    stageDurationFrames: 420,
  });
  _syncRegionSelectOptions();
};

window.removeRegionByIndex = function(regionIndex) {
  effectManager.removeRegionByIndex(regionIndex);
  _syncRegionSelectOptions();
};


