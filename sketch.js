// timer
let timeState = {
  currentStage: 1,       
  corruption: 0,         
  elapsedMs: 0,          
  glitchesEnabled: false
};
//duration of the effect（time-base）
const STAGE_DURATION_MS = 60000; 
const STAGE_FLOOR_MS    = 35000; 
const MAX_SPEED = STAGE_DURATION_MS / STAGE_FLOOR_MS; 
const COMPONENT_THRESHOLD = 6; //start speed up count
const SPEED_PER_COMPONENT = 0.07; 

let virtualElapsedMs = 0;

//UI
let outerSegments;
let panelSegments;
let workspaceSegments;
let missionSegments;
let bgmSegments;

let paletteComponents = [];
let placedComponents = [];
let traces = [];

let refreshCount = 0;

let draggingComponent = null;

let flyingComponentIndex = -1;
let systemOverloaded = false;

let workspaceX;
let workspaceY;
let workspaceW;
let workspaceH;

let refreshX;
let refreshY;
let refreshR;

let trashX;
let trashY;
let trashR;

let bgmX;
let bgmY;
let bgmW;
let bgmH;

let bgmDropdown;
let bgmDropdownOpen = false;

let bgmOptions = [
  "bgm1",
  "bgm2",
  "bgm3",
  "bonus"
];

let selectedBgmIndex = 0;

let titleList = [
  "Untitled #47",
  "Memory",
  "What Remains",
  "(do not look)",
  "...",
  // ...
];

let textList = [
  "An artist's reflection\non memory.",
  "This piece was not\nmeant to be seen.",
  "Translated from a language\nno longer spoken.",
  "The viewer becomes\npart of the work.",
  "Please do not touch.\nPlease do not look too long.",
  // ...
];

let titleIndex = 0;
let textIndex = 0;

//audio
let song = [];
let fft;
let corruption = 1;
let smoothBass = 0, smoothMid = 0, smoothTreble = 0;

let playButton;
let currentSongIndex = 0;
let songSettings = [
  { bassMin: 150, midMin: 75, trebleMin: 50, bassMax: 240, midMax: 170, trebleMax: 150, bassRange: 1, midRange: 0.4, trebleRange: 6 , smoothB: 0.8, smoothM: 0.6, smoothT: 1},
  { bassMin: 150, midMin: 110, trebleMin: 25, bassMax: 255, midMax: 170, trebleMax: 60, bassRange: 1, midRange: 0.4, trebleRange: 6 , smoothB: 0.8, smoothM: 0.6, smoothT: 1},
  { bassMin: 200, midMin: 30, trebleMin: 0, bassMax: 255, midMax: 80, trebleMax: 255, bassRange: 1, midRange: 0.4, trebleRange: 6 , smoothB: 0.8, smoothM: 0.6, smoothT: 0.2},
  { bassMin: 210, midMin: 120, trebleMin: 100, bassMax: 255, midMax: 230, trebleMax: 160, bassRange: 1, midRange: 0.4, trebleRange: 6 , smoothB: 0.8, smoothM: 0.6, smoothT: 1},
];

let currentSettings = songSettings[0];
let bgmStarted = false;

function preload() {
  song[0] = loadSound("Assets/songs/塞壬唱片-MSR,Elvin Shen - Visage.mp3");
  song[1] = loadSound("Assets/songs/The Caretaker - We don't have many days.mp3");
  song[2] = loadSound("Assets/songs/Brian Eno - Music for Airports.mp3");
  song[3] = loadSound("Assets/songs/Victor Borba - Bury the Light.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  fft = new p5.FFT(0.8, 1024);
  fft.setInput(song[0]);

  createInterfaceSegments();
  createPaletteComponents();

  playButton = createButton('Play');
  playButton.position(20, 20);
  playButton.mousePressed(bgmPlay);


  // testing buttons
  let btn1 = createButton('song 1');
  btn1.position(80, 20);
  btn1.mousePressed(() => switchBGM(0));
  
  let btn2 = createButton('song 2');
  btn2.position(130, 20);
  btn2.mousePressed(() => switchBGM(1));
  
  let btn3 = createButton('song 3');
  btn3.position(180, 20);
  btn3.mousePressed(() => switchBGM(2));

  let btn4 = createButton('bonus');
  btn4.position(230, 20);
  btn4.mousePressed(() => switchBGM(3));
}

function bgmPlay() {
  if (!song[currentSongIndex].isPlaying()) {
    song[currentSongIndex].loop();
    playButton.html('Pause');
  } else {
    song[currentSongIndex].pause();
    playButton.html('Play');
  }
}

function draw() {
  background(245);

  updateTime();
  updateStage2Glitches(); 
  
  fft.analyze();
  let bass = fft.getEnergy(60, 150);
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");

  smoothBass = lerp(smoothBass, bass, currentSettings.smoothB);
  smoothMid = lerp(smoothMid, mid, currentSettings.smoothM);
  smoothTreble = lerp(smoothTreble, treble, currentSettings.smoothT);

  computeAllShakes();

  drawInterface();
  drawTraces();
  checkOverload();
  drawPaletteComponents();
  drawDraggingComponent();
  
  if (bgmDropdownOpen) {
    drawBgmDropdown(bgmDropdown, selectedBgmIndex);
  }

  

  for (let comp of placedComponents) {
    push();
    translate(comp._shakeX || 0, comp._shakeY || 0);
    if (comp._blur && comp._blur > 0.01) { 
      drawingContext.filter = 'blur(' + comp._blur + 'px)';
    }
    comp.display(true);
    glitchComponent(comp);
    drawingContext.filter = 'none';
    pop();
  }
  
  drawDebugHUD();

  fill(120);
  textAlign(LEFT, TOP);
  textSize(13);
  text(
    "bass: " + smoothBass.toFixed(0) +
    "   mid: " + smoothMid.toFixed(0) +
    "   treble: " + smoothTreble.toFixed(0) +
    "     corruption: " + corruption,
    20, 60
  );
  textAlign(CENTER, CENTER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createInterfaceSegments();
  createPaletteComponents();
  if (typeof resizeCorruption === 'function') resizeCorruption();
}

function switchBGM(index) {
  // pause before switching
  if (song[currentSongIndex] && song[currentSongIndex].isPlaying()) {
    song[currentSongIndex].stop();
  }
  
  currentSongIndex = index;            // change index
  fft.setInput(song[index]);           // analysize new song
  song[index].loop();                  // play new song
  currentSettings = songSettings[index];   // change new song settings
  
  playButton.html('Pause');
}

function createInterfaceSegments() {
  let roughnessLarge = 0.8;
  let roughnessSmall = 1.2;

  workspaceX = width * 0.25;
  workspaceY = height * 0.19;
  workspaceW = width * 0.63;
  workspaceH = height * 0.75;

  refreshX = width * 0.875;
  refreshY = height * 0.10;
  refreshR = width * 0.0275;

  trashX = width * 0.94;
  trashY = height * 0.10;
  trashR = width * 0.0275;

  bgmX = width * 0.64;
  bgmY = height * 0.075;
  bgmW = width * 0.18;
  bgmH = height * 0.055;

  outerSegments = createSketchRect(
    width * 0.02,
    height * 0.03,
    width * 0.96,
    height * 0.95,
    width * 0.025,
    roughnessLarge
  );

  panelSegments = createSketchRect(
    width * 0.035,
    height * 0.055,
    width * 0.16,
    height * 0.89,
    width * 0.02,
    roughnessSmall
  );

  workspaceSegments = createSketchRect(
    workspaceX,
    workspaceY,
    workspaceW,
    workspaceH,
    width * 0.025,
    roughnessSmall
  );

  missionSegments = createSketchRect(
    width * 0.28,
    height * 0.06,
    width * 0.30,
    height * 0.12,
    width * 0.018,
    roughnessSmall
  );

  bgmSegments = createSketchRect(
    bgmX,
    bgmY,
    bgmW,
    bgmH,
    width * 0.015,
    roughnessSmall
  );

  bgmDropdown = createBgmDropdown(
    bgmX,
    bgmY + bgmH + height * 0.01,
    bgmW,
    bgmH * 0.85,
    bgmOptions,
    width * 0.012,
    1
  );
}



function createPaletteComponents() {
  paletteComponents = [];

  let panelX = width * 0.035;
  let panelY = height * 0.055;
  let panelW = width * 0.16;

  let componentX = panelX + panelW * 0.15;
  let componentW = panelW * 0.7;

  let currentY = panelY + height * 0.12;
  let gap = height * 0.025;

  let backgroundH = height * 0.06;
  let imageW = componentW * 0.55;
  let imageH = height * 0.14;
  let searchH = height * 0.04;
  let titleH = height * 0.035;
  let textH = height * 0.06;
  let cardW = componentW * 0.9;
  let cardH = height * 0.25;

  paletteComponents.push(
    new Component(
      componentX,
      currentY,
      componentW,
      backgroundH,
      "backgroundImage"
    )
  );

  currentY += backgroundH + gap;

  paletteComponents.push(
    new Component(
      componentX + panelW * 0.15,
      currentY,
      imageW,
      imageH,
      "image"
    )
  );

  currentY += imageH + gap;

  paletteComponents.push(
    new Component(
      componentX,
      currentY,
      componentW,
      searchH,
      "search"
    )
  );

  currentY += searchH + gap;

  paletteComponents.push(
    new Component(
      componentX,
      currentY,
      componentW,
      titleH,
      "title"
    )
  );

  currentY += titleH + gap;

  paletteComponents.push(
    new Component(
      componentX,
      currentY,
      componentW,
      textH,
      "text"
    )
  );

  currentY += textH + gap;

  paletteComponents.push(
    new Component(
      componentX + panelX * 0.15,
      currentY,
      cardW,
      cardH,
      "card"
    )
  );
}



function drawPaletteComponents() {
  for (let component of paletteComponents) {
    component.display(false);
  }
}



function drawPlacedComponents() {
  for (let component of placedComponents) {
    component.display(true);
  }
}



function drawDraggingComponent() {
  if (draggingComponent != null) {
    let targetX = mouseX - draggingComponent.w / 2;
    let targetY = mouseY - draggingComponent.h / 2;

    let dx = targetX - draggingComponent.x;
    let dy = targetY - draggingComponent.y;

    moveComponent(draggingComponent, dx, dy);

    draggingComponent.display();
  }
}



function drawInterface() {
  noStroke();
  fill(190);
  rect(width * 0.02, height * 0.03, width * 0.96, height * 0.95);

  fill(250);
  rect(width * 0.035, height * 0.055, width * 0.16, height * 0.89);

  fill(255);
  rect(workspaceX, workspaceY, workspaceW, workspaceH);

  stroke(70);
  strokeWeight(3);
  drawSegments(outerSegments);
  drawSegments(panelSegments);
  drawSegments(workspaceSegments);
  drawSegments(missionSegments);
  drawSegments(bgmSegments);

  noStroke();
  fill(70);
  textAlign(LEFT, CENTER);
  textSize(width * 0.02);
  text("Components", width * 0.045, height * 0.09);

  textAlign(CENTER, CENTER);
  textSize(width * 0.015);
  text("Design a website for our 美术馆~", width * 0.43, height * 0.12);

  stroke(70);
  strokeWeight(3);
  noFill();

  ellipse(width * 0.25, height * 0.08, width * 0.025, width * 0.018);
  line(width * 0.25, height * 0.095, width * 0.235, height * 0.18);
  line(width * 0.25, height * 0.095, width * 0.265, height * 0.18);
  line(width * 0.235, height * 0.18, width * 0.265, height * 0.18);

  noStroke();
  fill(70);
  textAlign(LEFT, CENTER);
  textSize(width * 0.014);

  text(
    bgmOptions[selectedBgmIndex],
    bgmX + bgmW * 0.08,
    bgmY + bgmH / 2
  );

  stroke(70);
  strokeWeight(3);

  line(
    bgmX + bgmW * 0.86,
    bgmY + bgmH * 0.38,
    bgmX + bgmW * 0.90,
    bgmY + bgmH * 0.62
  );

  line(
    bgmX + bgmW * 0.94,
    bgmY + bgmH * 0.38,
    bgmX + bgmW * 0.90,
    bgmY + bgmH * 0.62
  );

  noFill();
  stroke(70);
  strokeWeight(3);

  drawSketchCircle(refreshX, refreshY, refreshR, 2, 10);
  drawSketchCircle(trashX, trashY, trashR, 2, 20);
}

function drawTraces() {
  for (let trace of traces) {
    stroke(80, 80, 80, 45);
    strokeWeight(3);
    noFill();

    for (let seg of trace.segments) {
      line(seg.x1, seg.y1, seg.x2, seg.y2);
    }

    noStroke();
    fill(80, 80, 80, 35);
    textSize(width * 0.012);
    textAlign(CENTER, CENTER);

    text(
      trace.type,
      trace.x + trace.w / 2,
      trace.y + trace.h / 2
    );
  }
}

function mousePressed() {
  startBGMOnFirstInteraction();
  if (
    mouseX > bgmX &&
    mouseX < bgmX + bgmW &&
    mouseY > bgmY &&
    mouseY < bgmY + bgmH
  ) {
    bgmDropdownOpen = !bgmDropdownOpen;
    return;
  }

  if (bgmDropdownOpen) {
    let clickedOption = getBgmOptionIndex(
      mouseX,
      mouseY,
      bgmDropdown
    );

    if (clickedOption >= 0) {
      selectedBgmIndex = clickedOption;
      switchBGM(clickedOption);
      bgmDropdownOpen = false;
      return;
    }

    bgmDropdownOpen = false;
    return;
  }

  if (isInsideCircle(mouseX, mouseY, refreshX, refreshY, refreshR)) {
    fakeRefresh();
    return;
  }

  if (isInsideCircle(mouseX, mouseY, trashX, trashY, trashR)) {
    placedComponents = [];
    systemOverloaded = false;
    flyingComponentIndex = -1;
    return;
  }

  for (let component of paletteComponents) {
    if (isInsideComponent(mouseX, mouseY, component)) {
      let size = getWorkspaceComponentSize(component.type);

      draggingComponent = new Component(
        mouseX - size.w / 2,
        mouseY - size.h / 2,
        size.w,
        size.h,
        component.type,
        component.textContent
      );

      return;
    }
  }
}



function mouseReleased() {
  if (draggingComponent != null) {
    if (isInsideWorkspace(mouseX, mouseY)) {
      placedComponents.push(draggingComponent);
      refreshPaletteText(draggingComponent.type);
    }

    draggingComponent = null;
  }
}

function checkOverload() {
  if (placedComponents.length > 10 && !systemOverloaded) {
    systemOverloaded = true;

    flyingComponentIndex = Math.floor(random(placedComponents.length));

    placedComponents[flyingComponentIndex].vx = random(-5, 5);
    placedComponents[flyingComponentIndex].vy = random(-5, 5);
  }

  if (systemOverloaded && flyingComponentIndex >= 0) {
    let component = placedComponents[flyingComponentIndex];

    moveComponent(component, component.vx, component.vy);

    if (
      component.x < workspaceX ||
      component.x + component.w > workspaceX + workspaceW
    ) {
      component.vx *= -1;
    }

    if (
      component.y < workspaceY ||
      component.y + component.h > workspaceY + workspaceH
    ) {
      component.vy *= -1;
    }
  }
}

function getWorkspaceComponentSize(type) {
  if (type == "backgroundImage") {
    return {
      w: workspaceW * 0.55,
      h: workspaceH * 0.18
    };
  } else if (type == "image") {
    let imageSize = workspaceW * 0.11;

    return {
      w: imageSize,
      h: imageSize
    };
  } else if (type == "search") {
    return {
      w: workspaceW * 0.35,
      h: workspaceH * 0.07
    };
  } else if (type == "title") {
    return {
      w: workspaceW * 0.175,
      h: workspaceH * 0.035
    };
  } else if (type == "text") {
    return {
      w: workspaceW * 0.175,
      h: workspaceH * 0.06
    };
  } else if (type == "card") {
    let cardW = workspaceW * 0.16;

    return {
      w: cardW,
      h: cardW * 1.25
    };
  }

  return {
    w: workspaceW * 0.2,
    h: workspaceH * 0.1
  };
}






function fakeRefresh() {
  refreshCount++;

  if (refreshCount >= 2) {
    for (let component of placedComponents) {
      traces.push(copyComponentAsTrace(component));
    }
  }

  placedComponents = [];

  systemOverloaded = false;
  flyingComponentIndex = -1;
}



function copyComponentAsTrace(component) {
  let copiedSegments = [];

  for (let seg of component.segments) {
    copiedSegments.push({
      x1: seg.x1,
      y1: seg.y1,
      x2: seg.x2,
      y2: seg.y2
    });
  }

  return {
    x: component.x,
    y: component.y,
    w: component.w,
    h: component.h,
    type: component.type,
    segments: copiedSegments
  };
}


function moveComponent(component, dx, dy) {
  component.x += dx;
  component.y += dy;

  for (let seg of component.segments) {
    seg.x1 += dx;
    seg.y1 += dy;
    seg.x2 += dx;
    seg.y2 += dy;
  }
}



function isInsideComponent(px, py, component) {
  return (
    px > component.x &&
    px < component.x + component.w &&
    py > component.y &&
    py < component.y + component.h
  );
}



function isInsideWorkspace(px, py) {
  return (
    px > workspaceX &&
    px < workspaceX + workspaceW &&
    py > workspaceY &&
    py < workspaceY + workspaceH
  );
}



function isInsideCircle(px, py, cx, cy, r) {
  let dx = px - cx;
  let dy = py - cy;

  return dx * dx + dy * dy < r * r;
}


function getNextTitle() {
  let t = titleList[titleIndex];
  titleIndex = (titleIndex + 1) % titleList.length;
  return t;
}

function getNextText() {
  let t = textList[textIndex];
  textIndex = (textIndex + 1) % textList.length;
  return t;
}

function refreshPaletteText(type) {
  for (let comp of paletteComponents) {
    if (comp.type === type) {
      if (type === "title") {
        comp.textContent = getNextTitle();
      } else if (type === "text") {
        comp.textContent = getNextText();
      }
    }
  }
}

function computeAllShakes() {
  let bass = constrain(map(smoothBass, currentSettings.bassMin, currentSettings.bassMax, 0, currentSettings.bassRange), 0, currentSettings.bassRange);
  let dongcidaci = bass * bass * bass * bass;
  let bassShake = dongcidaci * 10 * corruption;
  
  for (let comp of placedComponents) {
    comp._shakeX = (comp._shakeX || 0) + random(-bassShake, bassShake);
    comp._shakeY = (comp._shakeY || 0) + random(-bassShake, bassShake);
  }
}
//accelerate
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
//for testing - get testing data
function drawDebugHUD() {
  push(); 
  resetMatrix();
  drawingContext.filter = 'none';
  let rectX = 0;
  let rectY = height - 86;
  noStroke(); 
  fill(255, 180);
  rect(rectX, rectY, 160, 96);
  fill(0); 
  textAlign(LEFT, TOP); 
  textSize(14);
  text('Stage: ' + timeState.currentStage, rectX + 12, rectY + 12);
  text('Time: ' + (timeState.elapsedMs / 1000).toFixed(1) + ' s', rectX + 12, rectY + 28);
  text('Corruption: ' + timeState.corruption.toFixed(2), rectX + 12, rectY + 44);
  text('Components: ' + placedComponents.length, rectX + 12, rectY + 60);
  pop();
}
//for testing - change stage
function keyPressed() {
  if (key === '1') virtualElapsedMs = STAGE_DURATION_MS * 0;
  if (key === '2') virtualElapsedMs = STAGE_DURATION_MS * 1;
  if (key === '3') virtualElapsedMs = STAGE_DURATION_MS * 2;
  if (key === '4') virtualElapsedMs = STAGE_DURATION_MS * 3;
}

function startBGMOnFirstInteraction() {
  if (bgmStarted) return;
  if (!song[currentSongIndex] || !song[currentSongIndex].isLoaded()) return;
  
  song[currentSongIndex].loop();
  playButton.html('Pause');
  bgmStarted = true;
}