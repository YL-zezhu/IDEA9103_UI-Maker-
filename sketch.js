// timer
let timeState = {
  currentStage: 1,       
  corruption: 0,         
  elapsedMs: 0,          
  glitchesEnabled: false
};
//duration of the effect（time-base）
const STAGE_DURATION_MS = 30000; 
const STAGE_FLOOR_MS    = 15000; 
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
let refreshIcon;

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

//UI images
let exhibitionImgs = [];
let backgroundImgs = [];

let exhibitionIndex = 0;
let backgroundIndex = 0;

//audio
let song = [];
let fft;
let corruption = 1;
let smoothBass = 0, smoothMid = 0, smoothTreble = 0;

//let playButton;
let currentSongIndex = 0;
let songSettings = [    // each song has its own settings for best visual experience
  { bassMin: 150, midMin: 75, trebleMin: 50, bassMax: 240, midMax: 170, trebleMax: 150, bassRange: 1, midRange: 0.4, trebleRange: 6 , smoothB: 0.8, smoothM: 0.6, smoothT: 1},
  { bassMin: 150, midMin: 110, trebleMin: 25, bassMax: 255, midMax: 170, trebleMax: 60, bassRange: 1, midRange: 0.4, trebleRange: 6 , smoothB: 0.8, smoothM: 0.6, smoothT: 1},
  { bassMin: 200, midMin: 90, trebleMin: 5, bassMax: 255, midMax: 160, trebleMax: 30, bassRange: 1, midRange: 0.4, trebleRange: 6 , smoothB: 0.8, smoothM: 0.6, smoothT: 0.2},
  { bassMin: 210, midMin: 120, trebleMin: 100, bassMax: 255, midMax: 230, trebleMax: 160, bassRange: 1, midRange: 0.4, trebleRange: 6 , smoothB: 0.8, smoothM: 0.6, smoothT: 1},
];

let currentSettings = songSettings[0];
let bgmStarted = false;

// start screen (advised by Claude)
let curatorImg;
let galleryStarted = false;

//typer
let typewriterProgress = 0;
const TYPEWRITER_SPEED = 0.5;
const startScreenText = 
  "Oh no! We lost our last designer.\n" +
  "Could you please finish the gallery's\nofficial website for us?\n" +
  "If you're willing, click anywhere to begin.";

let curatorTileJitters = [];
let curatorJitterFrame = 0;
const GRID_COLS = 12;
const GRID_ROWS = 18;

let startScreenReady = false;
let skipTypewriter = false;

let handFont;
let typewriterFont;

function preload() {
  //preload songs
  song[0] = loadSound("Assets/songs/塞壬唱片-MSR,Elvin Shen - Visage.mp3");
  song[1] = loadSound("Assets/songs/The Caretaker - We don't have many days.mp3");
  song[2] = loadSound("Assets/songs/塞壬唱片-MSR,PMP - 光影.mp3");
  song[3] = loadSound("Assets/songs/Victor Borba - Bury the Light.mp3");

  //preload all UI images
  refreshIcon = loadImage("assets/images/icon/refresh.png");
  for (let i = 1; i <= 25; i++) {
  exhibitionImgs.push(loadImage("assets/images/exhibitions/exhibition" + i + ".png"));
  }
  for (let i = 1; i <= 6; i++) {
  backgroundImgs.push(loadImage("assets/images/background_images/bgi" + i + ".png"));
  }

  curatorImg = loadImage("Assets/images/curator.png");
  handFont = loadFont("Assets/fonts/SpecialElite-Regular.ttf");
  typewriterFont = loadFont("Assets/fonts/SpecialElite-Regular.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textFont(handFont);

  fft = new p5.FFT(0.8, 1024);
  fft.setInput(song[0]);

  createInterfaceSegments();
  createPaletteComponents();

  /*
  // testing button
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
  */
}

// loop function
function bgmPlay() {
  if (!song[currentSongIndex].isPlaying()) {
    song[currentSongIndex].loop();
    //playButton.html('Pause');
  } else {
    song[currentSongIndex].pause();
    //playButton.html('Play');
  }
}

function draw() {
  if (!galleryStarted) {
    drawStartScreen();
    return;
  }

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
  
  // Draw the independent corruption layer
  if (typeof drawCorruption === 'function') {
  drawCorruption();
  }

  //drawDebugHUD();

  /*
  // testing text for audio part
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
  */
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
  
  currentSongIndex = index;                // change index
  fft.setInput(song[index]);               // analysize new song
  song[index].loop();                      // play new song
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

    if (component.type === "image") {

      noStroke();
      fill(30);

      textAlign(CENTER, CENTER);
      textSize(width * 0.012);

      text(
        "image",
        component.x + component.w / 2,
        component.y + component.h / 2
      );
    }

    if (component.type === "backgroundImage") {

      noStroke();
      fill(30);

      textAlign(CENTER, CENTER);
      textSize(width * 0.012);

      text(
        "background image",
        component.x + component.w / 2,
        component.y + component.h / 2
      );
    }
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
  text("Design a website for our gallery~", width * 0.43, height * 0.12);

  stroke(70);
  strokeWeight(3);
  noFill();

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

  if (refreshIcon) {
    push();
    imageMode(CENTER);
    image(
      refreshIcon,
      refreshX,
      refreshY,
      refreshR * 1.25,
      refreshR * 1.25
    );
    pop();
  }
}

//draw the ghost traces of placed components to make them look like not be erased
function drawTraces() {
  for (let trace of traces) {
    stroke(80, 80, 80, 45);
    strokeWeight(3);
    noFill();

    for (let seg of trace.segments) {
      line(seg.x1, seg.y1, seg.x2, seg.y2);
    }
  }
}

function mousePressed() {
  // click to start
  if (!galleryStarted) {
    if (!startScreenReady) return;
    //skip typing
    if (typewriterProgress < startScreenText.length) {
      skipTypewriter = true;
      return;
    }
    galleryStarted = true;
    startBGMOnFirstInteraction();
    return;
  }

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

  //start dragging a component when the user clicks it
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

      //exhibition images rotation
      if (draggingComponent.type === "image") {
        draggingComponent.img = exhibitionImgs[exhibitionIndex];
        exhibitionIndex = (exhibitionIndex + 1) % exhibitionImgs.length;
      }

      //background images rotation
      if (draggingComponent.type === "backgroundImage") {
        draggingComponent.img = backgroundImgs[backgroundIndex];
        backgroundIndex = (backgroundIndex + 1) % backgroundImgs.length;
      }

      return;
    }
  }
}



function mouseReleased() {
//Place the component into the workspace when the mouse is released
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

//create refresh count for change the effect of refresh
function fakeRefresh() {
  refreshCount++;

  if (refreshCount >= 2) {
    for (let component of placedComponents) {
      traces.push(copyComponentAsTrace(component));
    }
  }

  if (typeof fadeCorruptionLayer === 'function') {
    fadeCorruptionLayer();
  }

  placedComponents = [];

  systemOverloaded = false;
  flyingComponentIndex = -1;
}


//create copies of placed components for the ghost trace effect
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

// show the next title/text in the list after placing
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

// shaking effect (whole component)
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

/*
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
  if (!galleryStarted) {
    galleryStarted = true;
    startBGMOnFirstInteraction();
    return;
  }

  if (key === '1') virtualElapsedMs = STAGE_DURATION_MS * 0;
  if (key === '2') virtualElapsedMs = STAGE_DURATION_MS * 1;
  if (key === '3') virtualElapsedMs = STAGE_DURATION_MS * 2;
  if (key === '4') virtualElapsedMs = STAGE_DURATION_MS * 3;
}
  */

function startBGMOnFirstInteraction() {
  if (bgmStarted) return;
  if (!song[currentSongIndex] || !song[currentSongIndex].isLoaded()) return;
  
  song[currentSongIndex].loop();
  playButton.html('Pause');
  bgmStarted = true;
}

// start screen (organized by Claude)
function drawStartScreen() {
  background(245);
  
  push();
  textFont(typewriterFont);
  
  let curatorW = width * 0.25;
  let curatorH = curatorW * (curatorImg.height / curatorImg.width);
  let curatorX = width * 0.1;
  let curatorY = height / 2 - curatorH / 2;
  
  drawCuratorTiled(curatorX, curatorY, curatorW, curatorH);
  
  // put talking frame
  let bubbleX = width * 0.42;
  let bubbleY = height * 0.32;
  let bubbleW = width * 0.48;
  let bubbleH = height * 0.35;
  
  noStroke();
  fill(250);
  rect(bubbleX, bubbleY, bubbleW, bubbleH);
  
  let bubbleSegments = createSketchRect(
    bubbleX, bubbleY, bubbleW, bubbleH,
    width * 0.02, 1.5
  );
  stroke(30);
  strokeWeight(3);
  drawSegments(bubbleSegments);
  
  // put talking frame pointer
  let jitter = 1.5;
  let triTopX = bubbleX + random(-jitter, jitter);
  let triTopY = bubbleY + bubbleH * 0.35 + random(-jitter, jitter);
  let triTipX = bubbleX - bubbleW * 0.04 + random(-jitter, jitter);
  let triTipY = bubbleY + bubbleH * 0.45 + random(-jitter, jitter);
  let triBotX = bubbleX + random(-jitter, jitter);
  let triBotY = bubbleY + bubbleH * 0.5 + random(-jitter, jitter);
  
  noStroke();
  fill(250);
  triangle(triTopX, triTopY, triTipX, triTipY, triBotX, triBotY);
  
  stroke(30);
  strokeWeight(3);
  line(triTopX, triTopY, triTipX, triTipY);
  line(triTipX, triTipY, triBotX, triBotY);
  
  // typer and text
  typewriterProgress = min(typewriterProgress + TYPEWRITER_SPEED, startScreenText.length);
  if (skipTypewriter) {
    typewriterProgress = startScreenText.length;
  } else {
    typewriterProgress = min(typewriterProgress + TYPEWRITER_SPEED, startScreenText.length);
  }
  let visibleText = startScreenText.substring(0, floor(typewriterProgress));
  let lines = visibleText.split('\n');
  
  let textX = bubbleX + bubbleW * 0.06;
  let textY = bubbleY + bubbleH * 0.15;
  let lineGap = bubbleH * 0.22;
  
  noStroke();
  textAlign(LEFT, TOP);
  
  for (let i = 0; i < lines.length; i++) {
  if (i === 3) {
    fill(100);
    textSize(width * 0.013);
  } else {
    fill(30);
    textSize(width * 0.018);
  }
  
  // type every char
  let charX = textX;
  let charY = textY + lineGap * i;
  
  for (let ch of lines[i]) {
    let charJitterX = random(-0.8, 0.8);
    let charJitterY = random(-0.8, 0.8);
    text(ch, charX + charJitterX, charY + charJitterY);
    charX += textWidth(ch);
  }
}
  
  pop();
  startScreenReady = true;
}

// curator shaking
function drawCuratorTiled(curatorX, curatorY, curatorW, curatorH) {
  let tileSrcW = curatorImg.width / GRID_COLS;
  let tileSrcH = curatorImg.height / GRID_ROWS;
  let tileDestW = curatorW / GRID_COLS;
  let tileDestH = curatorH / GRID_ROWS;
  
  // shake frequency
  curatorJitterFrame++;
  if (curatorTileJitters.length === 0 || curatorJitterFrame > 2) {
    curatorJitterFrame = 0;
    curatorTileJitters = [];
    
    let centerCol = (GRID_COLS - 1) / 2;
    let centerRow = (GRID_ROWS - 1) / 2;
    let maxDist = sqrt(centerCol * centerCol + centerRow * centerRow);
    
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        let dist = sqrt((col - centerCol) * (col - centerCol) + (row - centerRow) * (row - centerRow));
        let edgeFactor = dist / maxDist;
        curatorTileJitters.push({
          x: random(-2.5, 2.5) * edgeFactor,
          y: random(-2.5, 2.5) * edgeFactor
        });
      }
    }
  }
  
  // draw each part
  let i = 0;
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      let j = curatorTileJitters[i++];
      image(
        curatorImg,
        curatorX + col * tileDestW + j.x,
        curatorY + row * tileDestH + j.y,
        tileDestW, tileDestH,
        col * tileSrcW, row * tileSrcH,
        tileSrcW, tileSrcH
      );
    }
  }
}
