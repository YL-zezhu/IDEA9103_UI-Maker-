let timeState = {
  currentStage: 1,       
  corruption: 0,         
  elapsedMs: 0,          
  glitchesEnabled: false
};

let corruption = 0;     
let placedComponents = [];

const STAGE_DURATION_MS = 60000; 
const STAGE_FLOOR_MS    = 35000; 
const MAX_SPEED = STAGE_DURATION_MS / STAGE_FLOOR_MS; 
const COMPONENT_THRESHOLD = 6; //start speed up count
const SPEED_PER_COMPONENT = 0.07; 

let virtualElapsedMs = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  placedComponents.push({ x: 250, y: 200, w: 600, h: 80, text: "I AM A VERY LONG TESTING TEXT" });
}

function draw() {
  background(250);
  updateTime();
  updateStage2Glitches(); 

  for (let c of placedComponents) {
    if (timeState.glitchesEnabled && typeof glitchComponent === 'function') {
      glitchComponent(c);   
    } else {
      drawComponentClean(c); 
    }
  }
  if (typeof drawCorruption === 'function') drawCorruption();

  drawDebugHUD();
}

function updateTime() {
  let extra = max(0, placedComponents.length - COMPONENT_THRESHOLD);
  let speed = constrain(1 + extra * SPEED_PER_COMPONENT, 1, MAX_SPEED);

  virtualElapsedMs += deltaTime * speed;

  let stage = constrain(floor(virtualElapsedMs / STAGE_DURATION_MS) + 1, 1, 4);

  let corr = constrain(
    map(virtualElapsedMs, STAGE_DURATION_MS * 2, STAGE_DURATION_MS * 4, 0, 1),
    0, 1
  );

  timeState.currentStage    = stage;
  timeState.elapsedMs       = round(virtualElapsedMs);
  timeState.corruption      = corr;
  timeState.glitchesEnabled = (stage >= 3);

  corruption = timeState.corruption;
}

function drawComponentClean(c) {
  push();

  translate(c._shakeX || 0, c._shakeY || 0);         
  if (c._blur && c._blur > 0.01) {                  
    drawingContext.filter = 'blur(' + c._blur + 'px)';
  }

  rectMode(CORNER);
  noStroke();
  fill(245);
  rect(c.x, c.y, c.w, c.h, 8);
  noFill();
  stroke(200);
  rect(c.x, c.y, c.w, c.h, 8);
  noStroke();
  fill(60);
  textAlign(LEFT, CENTER);
  textSize(18);
  text(c.text, c.x + 16, c.y + c.h / 2);

  drawingContext.filter = 'none'; 
  pop();
}

function drawDebugHUD() {
  push(); 
  resetMatrix();
  drawingContext.filter = 'none';

  noStroke(); 
  fill(0, 180);
  rect(0, 0, 230, 72);
  fill(255); 
  textAlign(LEFT, TOP); 
  textSize(14);
  text('Stage: ' + timeState.currentStage, 12, 10);
  text('Time: ' + (timeState.elapsedMs / 1000).toFixed(1) + ' s', 12, 32);
  text('corruption: ' + timeState.corruption.toFixed(2), 12, 54);
  text('Components: ' + placedComponents.length, 12, 72);
  pop();
}

function keyPressed() {
  if (key === '1') virtualElapsedMs = STAGE_DURATION_MS * 0;
  if (key === '2') virtualElapsedMs = STAGE_DURATION_MS * 1;
  if (key === '3') virtualElapsedMs = STAGE_DURATION_MS * 2;
  if (key === '4') virtualElapsedMs = STAGE_DURATION_MS * 3;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (typeof resizeCorruption === 'function') resizeCorruption();
}

