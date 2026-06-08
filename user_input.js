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

function setupUserInputUI() {
  createInterfaceSegments();
  createPaletteComponents();
}

function drawUserInputUI(audioState) {
  drawInterface();

  drawTraces();

  checkOverload();

  drawPlacedComponents(audioState);

  drawPaletteComponents();

  drawDraggingComponent();

  if (bgmDropdownOpen) {
    drawBgmDropdown(
      bgmDropdown,
      selectedBgmIndex
    );
  }
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
    component.display();
  }
}

function drawPlacedComponents(audioState) {
  let shakeAmount = 0;

  if (audioState != null) {
    shakeAmount = map(
      audioState.treble,
      0,
      255,
      0,
      4
    );

    shakeAmount += audioState.corruption * 0.4;
  }

  for (let component of placedComponents) {
    drawComponentWithShake(
      component,
      shakeAmount
    );
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

function userInputMousePressed() {
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

      if (typeof switchBGM === "function") {
        switchBGM(clickedOption);
      }

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
        component.type
      );

      return;
    }
  }
}

function userInputMouseReleased() {
  if (draggingComponent != null) {
    if (isInsideWorkspace(mouseX, mouseY)) {
      placedComponents.push(draggingComponent);
    }

    draggingComponent = null;
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

function resizeUserInputUI() {
  createInterfaceSegments();
  createPaletteComponents();
}