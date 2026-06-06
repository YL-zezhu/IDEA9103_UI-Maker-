let cards = [];

let refreshCount = 0;
let traces = [];

let refreshX, refreshY, refreshW, refreshH;

let flyingCardIndex = -1;
let systemOverloaded = false;

let draggingCard = false;

let trashX, trashY, trashW, trashH;

let panelX, panelY, panelW, panelH;
let workspaceX, workspaceY, workspaceW, workspaceH;
let cardTemplateX, cardTemplateY, cardTemplateW, cardTemplateH;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  drawInterface();

  drawTraces();
// if there are more than 20 cards, enter overloaded state
if (cards.length > 10 && !systemOverloaded) {
  systemOverloaded = true;

  flyingCardIndex = floor(random(cards.length));

  cards[flyingCardIndex].vx = random(-5, 5);
  cards[flyingCardIndex].vy = random(-5, 5);
}

// draw and update placed cards
for (let i = 0; i < cards.length; i++) {
  let card = cards[i];

  // one random card starts flying when overloaded
  if (systemOverloaded && i === flyingCardIndex) {
    card.x += card.vx;
    card.y += card.vy;

    // bounce inside the whole canvas
    if (card.x < 0 || card.x + card.w > width) {
      card.vx *= -1;
    }

    if (card.y < 0 || card.y + card.h > height) {
      card.vy *= -1;
    }
  }

  drawCard(card.x, card.y, card.w, card.h);
  }

  // draw card following mouse while dragging
  if (draggingCard) {
    drawCard(mouseX - cardTemplateW / 2, mouseY - cardTemplateH / 2, cardTemplateW, cardTemplateH);
  }
}

function drawInterface() {
  background(245);

  // responsive layout values
  let margin = width * 0.03;
  let titleH = height * 0.08;

  panelX = margin;
  panelY = margin + titleH + 20;
  panelW = width * 0.22;
  panelH = height - panelY - margin;

  workspaceX = panelX + panelW + margin;
  workspaceY = panelY;
  workspaceW = width - workspaceX - margin;
  workspaceH = panelH;

  cardTemplateX = panelX + panelW * 0.12;
  cardTemplateY = panelY + 60;
  cardTemplateW = panelW * 0.7;
  cardTemplateH = 50;

  // title bar
  fill(255);
  stroke(30);
  rect(margin, margin, width - margin * 2, titleH, 10);

  noStroke();
  fill(30);
  textSize(22);
  textAlign(CENTER, CENTER);
  text("UI Maker...?", width / 2, margin + titleH / 2);

  // component panel
  stroke(30);
  fill(255);
  rect(panelX, panelY, panelW, panelH, 10);

  noStroke();
  fill(30);
  textSize(16);
  textAlign(LEFT, CENTER);
  text("Components", panelX + 20, panelY + 30);

  // workspace
  stroke(30);
  fill(252);
  rect(workspaceX, workspaceY, workspaceW, workspaceH, 10);

  noStroke();
  fill(30);
  textSize(16);
  text("Workspace", workspaceX + 20, workspaceY + 30);

  // component example in panel
  drawCard(cardTemplateX, cardTemplateY, cardTemplateW, cardTemplateH);

  // refresh button
  refreshW = panelW * 0.7;
  refreshH = 50;

  refreshX = panelX + panelW * 0.12;
  refreshY = panelY + panelH - 150;

  fill(220, 235, 255);
  stroke(40);
  rect(refreshX, refreshY, refreshW, refreshH, 8);

  noStroke();
  fill(30);
  textAlign(CENTER, CENTER);
  text("Refresh", refreshX + refreshW / 2, refreshY + refreshH / 2);

  // trash can button
  trashW = panelW * 0.7;
  trashH = 50;

  trashX = panelX + panelW * 0.12;
  trashY = panelY + panelH - 80;

  fill(255, 220, 220);
  stroke(40);
  rect(trashX, trashY, trashW, trashH, 8);

  noStroke();
  fill(30);
  textAlign(CENTER, CENTER);
  text("Trash Can", trashX + trashW / 2, trashY + trashH / 2);
}

function drawCard(x, y, w, h) {
  fill(240);
  stroke(40);
  rect(x, y, w, h, 8);

  noStroke();
  fill(30);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Card", x + w / 2, y + h / 2);
}

function mousePressed() {
  // click refresh button
  if (
    mouseX > refreshX &&
    mouseX < refreshX + refreshW &&
    mouseY > refreshY &&
    mouseY < refreshY + refreshH
  ) {
    fakeRefresh();
    return;
  }

  // click trash can
  if (
    mouseX > trashX &&
    mouseX < trashX + trashW &&
    mouseY > trashY &&
    mouseY < trashY + trashH
  ) {
  cards = [];
  systemOverloaded = false;
  flyingCardIndex = -1;
  return;
  }
  // if mouse is on the card template
  if (
    mouseX > cardTemplateX &&
    mouseX < cardTemplateX + cardTemplateW &&
    mouseY > cardTemplateY &&
    mouseY < cardTemplateY + cardTemplateH
  ) {
    draggingCard = true;
  }
}

function mouseReleased() {
  if (draggingCard) {
    let newX = mouseX - cardTemplateW / 2;
    let newY = mouseY - cardTemplateH / 2;

    // only place card if released inside workspace
    if (
      mouseX > workspaceX &&
      mouseX < workspaceX + workspaceW &&
      mouseY > workspaceY &&
      mouseY < workspaceY + workspaceH
    ) {
      cards.push({
        x: newX,
        y: newY,
        w: cardTemplateW,
        h: cardTemplateH
      });
    }

    draggingCard = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function fakeRefresh() {
  refreshCount++;

  // from the second refresh, old cards leave traces
  if (refreshCount >= 2) {
    for (let card of cards) {
      traces.push({
        x: card.x,
        y: card.y,
        w: card.w,
        h: card.h
      });
    }
  }

  // clear current cards
  cards = [];

  // reset overload state if you have it
  systemOverloaded = false;
  flyingCardIndex = -1;
}

function drawTraces() {
  for (let trace of traces) {
    noFill();
    stroke(80, 80, 80, 45);
    rect(trace.x, trace.y, trace.w, trace.h, 8);

    noStroke();
    fill(80, 80, 80, 35);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("Card", trace.x + trace.w / 2, trace.y + trace.h / 2);
  }
}