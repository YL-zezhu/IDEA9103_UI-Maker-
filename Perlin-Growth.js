// Some parts of the code structure were refined with guidance from Claude,
// and a few sections were simplified to make the overall architecture clearer
// Stage 3: Black dots appear on component borders and increase in size to cover the components
// Stage 4: Dots stop appearing. New vines grow from the components to fill the canvas
// These two stages are separate. Dots from Stage 3 remain as a background for Stage 4
// A persistent transparent layer covers the canvas. All dots and vines are drawn here
// Graphics are never cleared. If a component is removed, the drawn marks remain as a permanent trace


let corruptionLayer = null;

// List of active moving points for the vines.
let tendrilTips = [];


// color：mold and vine color control
function dotBleed(a)      { return color(0, 0, 0, a); }   
function dotBody(a)       { return color(0, 0, 0, a); }   
function dotCore(a)       { return color(0, 0, 0, a); }   
function tendrilStroke(a) { return color(0, 0, 0, a); }   
function tendrilGlow(a)   { return color(0, 0, 0, a); }   



function drawCorruption() {

  // Create a transparent graphic layer on the first call. Do not use background() to keep it transparent
  if (corruptionLayer === null) {
    corruptionLayer = createGraphics(width, height);
  }

  // Stage 3: Generate only red dots along the borders, growing from small to large
  if (timeState.currentStage === 3) {
    growDiffusion();
  }
  // Stage 4: Generate only vines. Dot generation stops, but existing drawings remain
  if (timeState.currentStage >= 4) {
    growTendrils();
  }

  // Render the persistent layer onto the main canvas
  image(corruptionLayer, 0, 0);
}

// Generate random coordinate centers on the border of each component for dot diffusion
function ensureCorruptionPoints(c) {
  if (c.corruptionPoints) return;

  c.corruptionPoints = [];

  let pointCount = 40;

  for (let i = 0; i < pointCount; i++) {
    let p = randomBorderPoint(c);

    c.corruptionPoints.push({
      rx: p.x - c.x,
      ry: p.y - c.y
    });
  }
}

// Dot Diffusion (Stage 3): Dots generate on borders, and their radii expand based on stage progress
function growDiffusion() {
  let g = corruptionLayer;

  // Stage 3 progress mapped to 0-1 (the raw corruption variable runs from 0 to 0.5 in Stage 3)
  let prog = constrain(timeState.corruption / 0.5, 0, 1);

  // Number of dots to generate per frame.
  let spawnCount = 1 + floor(prog * 0.3);

  g.noStroke();

  for (let c of placedComponents) {
    ensureCorruptionPoints(c);
    // Target radius for the component, expanding from 1px to a size sufficient to cover the component area
    // A larger maxR allows the dots to extend further beyond the component boundaries
    let maxR  = min(c.w, c.h) * 0.4;
    let growR = lerp(1, maxR, prog);

    for (let i = 0; i < spawnCount; i++) {

      // Select a random predefined point from the component and apply a small coordinate offset
      let anchor = random(c.corruptionPoints);

      let p = {
        x: c.x + anchor.rx + random(-3, 3),
        y: c.y + anchor.ry + random(-3, 3)
      };

      // Modify the radius using Perlin noise for random variation while scaling up with overall progress
      let n = noise(p.x * 0.02, p.y * 0.02, frameCount * 0.003);
      let r = growR * (0.25 + n * 0.8);

      // Draw three layers of circles to create a glow effect. Without a clip mask, circles naturally overlap the edges.
      g.fill(dotBleed(8));
      g.circle(p.x, p.y, r * 1.6);
      g.fill(dotBody(38));
      g.circle(p.x, p.y, r * 1.1);
      g.fill(dotCore(70));
      g.circle(p.x, p.y, r * 0.35);
    }
  }
}


// Get a random position on the rectangular border of the component with a slight perpendicular offset
function randomBorderPoint(c) {
  let side   = floor(random(4));   
  let jitter = random(-3, 3);      
  if (side === 0) return { x: random(c.x, c.x + c.w), y: c.y + jitter };
  if (side === 1) return { x: c.x + c.w + jitter,     y: random(c.y, c.y + c.h) };
  if (side === 2) return { x: random(c.x, c.x + c.w), y: c.y + c.h + jitter };
  return            { x: c.x + jitter,                y: random(c.y, c.y + c.h) };
}


// Vine Generation (Stage 4): Initialize coordinate points within components
function growTendrils() {
  let g = corruptionLayer;

  
  let prog = constrain((timeState.corruption - 0.5) / 0.5, 0, 1);

  // 1) Initialize new growth points. Generation becomes more frequent over time, subject to a maximum limit for performance stability.
  let spawnCount = 1 + floor(prog * 0.5);              
  for (let i = 0; i < spawnCount; i++) {
    if (tendrilTips.length >= 120) break;            // Maximum capacity limit for active vine points
    if (placedComponents.length === 0) break;
    let c = random(placedComponents);                // Select a component at random as the starting area
    spawnTip(random(c.x, c.x + c.w), random(c.y, c.y + c.h), random(TWO_PI));
  }

  
  for (let i = tendrilTips.length - 1; i >= 0; i--) {
    let t = tendrilTips[i];

    // Use Perlin noise to apply smooth changes to the heading angle
    let n = noise(t.x * 0.005, t.y * 0.005, t.seed);
    t.angle += (n - 0.5) * 0.45;                      

    // Apply occasional sharp directional changes to simulate random branching paths
    if (random() < 0.02) {                           
      t.angle += (random() - 0.5) * PI * 0.5;
    }

    // Calculate the coordinates for the next step.
    let nx = t.x + cos(t.angle) * 0.9;                
    let ny = t.y + sin(t.angle) * 0.9;

    // Decrease the alpha opacity linearly based on the remaining lifespan of the point
    let a = map(t.life, 0, t.maxLife, 0, 90);

    // Primary line segment.
    g.stroke(tendrilStroke(a));
    g.strokeWeight(t.weight);
    g.line(t.x, t.y, nx, ny);

    // Overlay a secondary line with a thinner stroke and brighter color to create a highlighted core effect
    g.stroke(tendrilGlow(a * 0.4));
    g.strokeWeight(t.weight * 0.35);
    g.line(t.x, t.y, nx, ny);

    // Branching: Low probability to initialize a new growth point. The chance scales up with stage progress
    if (random() < (0.012 + prog * 0.02) && tendrilTips.length < 120) { 
      spawnTip(nx, ny, t.angle + (random() - 0.5) * PI * 0.55);
    }


    t.x = nx;
    t.y = ny;
    t.life--;

    // Remove the tracking point if it exits the viewport boundaries or its lifespan reaches zero. Existing drawings remain on the layer
    let out = nx < -20 || ny < -20 || nx > width + 20 || ny > height + 20;
    if (t.life <= 0 || out) {
      tendrilTips.splice(i, 1);
    }
  }
}


// Initialize a new growth tracking point with randomized life, weight, and noise seed.
function spawnTip(x, y, angle) {
  let maxLife = random(60, 130);                    
  tendrilTips.push({
    x: x,
    y: y,
    angle: angle,
    life: maxLife,
    maxLife: maxLife,
    weight: random(0.6, 1.8),                        
    seed: random(1000),                              
  });
}


function resizeCorruption() {
  corruptionLayer = createGraphics(width, height);
  tendrilTips = [];
}

// Create a ghost trace effect: Copy the current graphic canvas, clear the original, re-render the copy at 20 percent opacity, and reset active points
function fadeCorruptionLayer() {
  if (corruptionLayer === null) return;

  let oldLayer = corruptionLayer.get();

  corruptionLayer.clear();

  corruptionLayer.tint(255, 51); // 51 = 255 * 0.2, keep 20%
  corruptionLayer.image(oldLayer, 0, 0);
  corruptionLayer.noTint();

  tendrilTips = [];
}