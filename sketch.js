//  Stage 0: Diffusion  →  Stage 1: Tendrils
//  TUNING GUIDE  (look for these constants at the top of each
//  section and in PARAMS below)
//
//  RECT_W / RECT_H       — size of the infection rectangle
//  STAGE_DURATION        — frames before transitioning (60 fps)
//  DIFFUSE_*             — controls Stage 0
//  TENDRIL_*             — controls Stage 1

// ── Canvas / rectangle geometry ─────────────────────────────
const CANVAS_W      = 800;
const CANVAS_H      = 600;
const RECT_W        = 560;
const RECT_H        = 380;
// Rectangle top-left corner (computed in setup so we can centre it)
let RX, RY;

// ── State machine ────────────────────────────────────────────
// 0 = diffusion   1 = tendrils
let state = 0;
const STAGE_DURATION = 60 * 12;   // frames per stage  (~12 s at 60 fps)
let stageTimer = 0;

// ── Shared graphics buffer ───────────────────────────────────
// We paint everything onto a p5.Graphics object so the
// bleed/trail from previous frames accumulates organically.
let gfx;

// ── Perlin noise offsets (unique per dimension) ───────────────
let noiseOffX, noiseOffY, noiseOffR;

// ────────────────────────────────────────────────────────────
//  DIFFUSION PARAMETERS
// ────────────────────────────────────────────────────────────
const DIFFUSE = {
  maxCircles:    220,    // pool size — more = denser final state
  noiseScaleXY:  0.003,  // spatial freq of position wobble  (↓ = broader blobs)
  noiseScaleR:   0.004,  // spatial freq of radius variation (↓ = smoother sizes)
  noiseScaleT:   0.0009, // how fast noise "breathes" over time (↑ = more restless)
  minRadius:     2,      // starting dot size
  maxRadius:     55,     // maximum dot size at full intensity
  fadeAlpha:     4,      // trail decay per frame  (↓ = longer ghosts)
  spawnRate:     3,      // new circles spawned per frame at start
  alphaDot:      22,     // per-dot fill opacity (0-255)
};

// ────────────────────────────────────────────────────────────
//  TENDRIL PARAMETERS
// ────────────────────────────────────────────────────────────
const TENDRIL = {
  maxActive:     320,    // max live tips
  spawnPerFrame: 6,      // new tips per frame (ramps with time)
  stepLen:       2.4,    // pixels per step
  angleNoise:    0.006,  // spatial freq for noise-driven steering
  angleStrength: 0.9,    // how hard noise bends the heading (radians)
  branchProb:    0.012,  // probability a tip spawns a child each frame
  maxLife:       340,    // frames a tip lives before dying
  strokeAlpha:   130,    // stroke opacity (0-255)
  strokeWeight:  1.1,    // base stroke width
  fadeAlpha:     1,      // trail decay per frame (↓ = more accumulation)
};

// ────────────────────────────────────────────────────────────
//  COLOUR HELPERS
// ────────────────────────────────────────────────────────────
// All reds are generated here so you can tweak one place.
function dotColor(alpha) {
  // Deep, slightly desaturated crimson
  return color(180, 18, 18, alpha);
}
function tendrilColor(alpha) {
  // Slightly darker / cooler red for veins
  return color(155, 12, 12, alpha);
}
function tendrilGlow(alpha) {
  // Thin ochre-red shimmer on top of each line
  return color(200, 40, 10, alpha);
}

// ────────────────────────────────────────────────────────────
//  CIRCLE POOL  (Stage 0)
// ────────────────────────────────────────────────────────────
let circles = [];

function spawnCircle() {
  // Seed position inside the rectangle with slight noise bias
  let nx = random(RX, RX + RECT_W);
  let ny = random(RY, RY + RECT_H);
  circles.push({
    x:      nx,
    y:      ny,
    // Independent noise offsets so each circle breathes differently
    ox:     random(0, 9999),
    oy:     random(0, 9999),
    or_:    random(0, 9999),
    born:   stageTimer,   // used to ramp up size over life
    maxR:   random(DIFFUSE.minRadius * 2, DIFFUSE.maxRadius),
  });
}

function updateDiffusion() {
  // Spawn rate ramps from slow → fast as the stage matures
  let progress = stageTimer / STAGE_DURATION;   // 0 → 1
  let rate = floor(DIFFUSE.spawnRate * (0.3 + progress * 3.5));

  if (circles.length < DIFFUSE.maxCircles) {
    for (let i = 0; i < rate && circles.length < DIFFUSE.maxCircles; i++) {
      spawnCircle();
    }
  }

  // Soft fade so old blobs linger as stains
  gfx.noStroke();
  gfx.fill(255, 255, 255, DIFFUSE.fadeAlpha);
  gfx.rect(RX, RY, RECT_W, RECT_H);

  // Draw each circle with noise-driven radius & position jitter
  for (let c of circles) {
    let age   = stageTimer - c.born;
    let agePct = min(age / (STAGE_DURATION * 0.6), 1); // growth curve

    // Perlin-driven size: starts tiny, grows with age
    let nR  = noise(c.or_ + stageTimer * DIFFUSE.noiseScaleT);
    let r   = DIFFUSE.minRadius + agePct * c.maxR * (0.5 + nR * 0.5);

    // Perlin-driven position drift
    let nX  = noise(c.ox + stageTimer * DIFFUSE.noiseScaleT) - 0.5;
    let nY  = noise(c.oy + stageTimer * DIFFUSE.noiseScaleT) - 0.5;
    let px  = c.x + nX * r * 0.6;
    let py  = c.y + nY * r * 0.6;

    // Keep circles inside rectangle
    px = constrain(px, RX + r, RX + RECT_W - r);
    py = constrain(py, RY + r, RY + RECT_H - r);

    // Outer bleed ring — very transparent
    gfx.fill(dotColor(6));
    gfx.ellipse(px, py, r * 2.8, r * 2.8);

    // Main body
    gfx.fill(dotColor(DIFFUSE.alphaDot));
    gfx.ellipse(px, py, r * 2, r * 2);

    // Bright core — makes dots look like wet ink drops
    gfx.fill(dotColor(DIFFUSE.alphaDot + 20));
    gfx.ellipse(px, py, r * 0.5, r * 0.5);
  }
}

// ────────────────────────────────────────────────────────────
//  TENDRIL SYSTEM  (Stage 1)
// ────────────────────────────────────────────────────────────
let tendrils = [];   // each tip: { x, y, angle, life, weight }

function spawnTendril(x, y, angle) {
  tendrils.push({
    x,  y,
    angle:  angle ?? random(TWO_PI),
    life:   TENDRIL.maxLife + random(-80, 80),
    weight: random(0.6, TENDRIL.strokeWeight * 2),
    noiseOff: random(0, 9999),
  });
}

function spawnEdgeTendril() {
  // Spawn from the border of the rectangle with inward-ish heading
  let side = floor(random(4));
  let x, y, angle;

  if (side === 0) {          // top edge
    x = random(RX, RX + RECT_W);
    y = RY;
    angle = random(PI * 0.1, PI * 0.9);
  } else if (side === 1) {   // right edge
    x = RX + RECT_W;
    y = random(RY, RY + RECT_H);
    angle = random(PI * 0.6, PI * 1.4);
  } else if (side === 2) {   // bottom edge
    x = random(RX, RX + RECT_W);
    y = RY + RECT_H;
    angle = random(PI * 1.1, PI * 1.9);
  } else {                   // left edge
    x = RX;
    y = random(RY, RY + RECT_H);
    angle = random(-PI * 0.4, PI * 0.4);
  }

  spawnTendril(x, y, angle);
}

function updateTendrils() {
  let progress = stageTimer / STAGE_DURATION;

  // Decay the previous frame gently — long trails feel infected
  gfx.noStroke();
  gfx.fill(255, 255, 255, TENDRIL.fadeAlpha);
  gfx.rect(0, 0, CANVAS_W, CANVAS_H);  // full canvas fade in stage 1

  // Spawn new tips with increasing frequency
  let rate = floor(TENDRIL.spawnPerFrame * (0.4 + progress * 2.2));
  for (let i = 0; i < rate && tendrils.length < TENDRIL.maxActive; i++) {
    spawnEdgeTendril();
  }

  // Step each tip
  for (let i = tendrils.length - 1; i >= 0; i--) {
    let t = tendrils[i];

    // Noise-steered heading — 2D noise field using position
    let n = noise(
      t.x * TENDRIL.angleNoise + t.noiseOff,
      t.y * TENDRIL.angleNoise + t.noiseOff * 0.7
    );
    t.angle += (n - 0.5) * TENDRIL.angleStrength;

    // Occasional sharp kink — makes tendrils feel aggressive
    if (random() < 0.02) {
      t.angle += (random() - 0.5) * PI * 0.5;
    }

    let px = t.x;
    let py = t.y;
    t.x  += cos(t.angle) * TENDRIL.stepLen;
    t.y  += sin(t.angle) * TENDRIL.stepLen;

    // Life-alpha: brightest when young, fades with age
    let lifeRatio = t.life / TENDRIL.maxLife;
    let a  = TENDRIL.strokeAlpha * lifeRatio;

    // Main vein
    gfx.stroke(tendrilColor(a));
    gfx.strokeWeight(t.weight);
    gfx.line(px, py, t.x, t.y);

    // Thin hot shimmer — gives organic luminescence
    gfx.stroke(tendrilGlow(a * 0.35));
    gfx.strokeWeight(t.weight * 0.3);
    gfx.line(px, py, t.x, t.y);

    // Branching
    if (random() < TENDRIL.branchProb * (0.5 + progress)) {
      if (tendrils.length < TENDRIL.maxActive) {
        spawnTendril(t.x, t.y, t.angle + (random() - 0.5) * PI * 0.55);
      }
    }

    t.life--;
    if (t.life <= 0) tendrils.splice(i, 1);
  }
}

// ────────────────────────────────────────────────────────────
//  p5.js LIFECYCLE
// ────────────────────────────────────────────────────────────
function setup() {
  createCanvas(CANVAS_W, CANVAS_H);

  // Centre the infection rectangle
  RX = (CANVAS_W - RECT_W) / 2;
  RY = (CANVAS_H - RECT_H) / 2;

  // Off-screen buffer — everything is painted here and blitted to canvas
  gfx = createGraphics(CANVAS_W, CANVAS_H);
  gfx.noSmooth();   // sharper edges for raw, bio-hazard feel

  // White canvas background
  gfx.background(255);
  noiseDetail(4, 0.5);  // 4 octaves, 0.5 falloff — more organic

  // Unique noise offsets per dimension
  noiseOffX = random(0, 1000);
  noiseOffY = random(1000, 2000);
  noiseOffR = random(2000, 3000);

  frameRate(60);
}

function draw() {
  // ── State transitions ──────────────────────────────────────
  stageTimer++;

  if (state === 0 && stageTimer >= STAGE_DURATION) {
    // Transition: diffusion → tendrils
    state      = 1;
    stageTimer = 0;
    circles    = [];          // release circle pool
    // Note: gfx is NOT cleared — tendrils grow from the stained rect
  }

  // ── Run current stage ──────────────────────────────────────
  gfx.push();
  gfx.noStroke();

  if (state === 0) {
    // Clip drawing to the rectangle
    gfx.drawingContext.save();
    gfx.drawingContext.beginPath();
    gfx.drawingContext.rect(RX, RY, RECT_W, RECT_H);
    gfx.drawingContext.clip();

    updateDiffusion();

    gfx.drawingContext.restore();
  } else {
    updateTendrils();
  }

  gfx.pop();

  // ── Composite: canvas background + rectangle border + gfx ──
  background(240);  // outer canvas — neutral grey

  // White rectangle as base plate (visible through transparent gfx)
  noStroke();
  fill(255);
  rect(RX, RY, RECT_W, RECT_H);

  // Blit the painted buffer
  image(gfx, 0, 0);

  // Rectangle border — thin dark rule to frame the infection zone
  noFill();
  stroke(30, 30, 30, 120);
  strokeWeight(1);
  rect(RX, RY, RECT_W, RECT_H);

  // ── HUD label ─────────────────────────────────────────────
  noStroke();
  fill(30);
  textSize(11);
  textFont('monospace');
  let label = state === 0
    ? `STAGE 0 — DIFFUSION   [${stageTimer} / ${STAGE_DURATION}]`
    : `STAGE 1 — TENDRILS    [${stageTimer} / ${STAGE_DURATION}]`;
  text(label, RX, RY + RECT_H + 20);
}
