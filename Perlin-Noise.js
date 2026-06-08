
let corruptionLayer = null;


let tendrilTips = [];



function dotBleed(a)      { return color(178, 16, 16, a); }   
function dotBody(a)       { return color(178, 16, 16, a); }   
function dotCore(a)       { return color(220, 60, 40, a); }   
function tendrilStroke(a) { return color(150, 10, 10, a); }   
function tendrilGlow(a)   { return color(210, 45, 10, a); }   



function drawCorruption(){


  if (corruptionLayer === null) {
    corruptionLayer = createGraphics(width, height);
  }

  if (timeState.currentStage === 3) {
    growDiffusion();

  if (timeState.currentStage >= 4) {
    growTendrils();
  }

  image(corruptionLayer, 0, 0);
}}


function growDiffusion() {
  let g = corruptionLayer;

  let prog = constrain(timeState.corruption / 0.5, 0, 1);

  let spawnCount = 1 + floor(prog * 2);

  g.noStroke();

  for (let c of placedComponents) {

    let maxR  = min(c.w, c.h) * 0.6;
    let growR = lerp(3, maxR, prog);

    for (let i = 0; i < spawnCount; i++) {

      let p = randomBorderPoint(c);

      let n = noise(p.x * 0.02, p.y * 0.02, frameCount * 0.003);
      let r = growR * (0.35 + n * 1.0);

      g.fill(dotBleed(8));
      g.circle(p.x, p.y, r * 2.6);
      g.fill(dotBody(38));
      g.circle(p.x, p.y, r * 2);
      g.fill(dotCore(70));
      g.circle(p.x, p.y, r * 0.6);
    }
  }
}


function randomBorderPoint(c) {
  let side   = floor(random(4));   
  let jitter = random(-6, 6);      
  if (side === 0) return { x: random(c.x, c.x + c.w), y: c.y + jitter };
  if (side === 1) return { x: c.x + c.w + jitter,     y: random(c.y, c.y + c.h) };
  if (side === 2) return { x: random(c.x, c.x + c.w), y: c.y + c.h + jitter };
  return            { x: c.x + jitter,                y: random(c.y, c.y + c.h) };
}


function growTendrils() {
  let g = corruptionLayer;

  let prog = constrain((timeState.corruption - 0.5) / 0.5, 0, 1);

  let spawnCount = 1 + floor(prog * 3);              // ★
  for (let i = 0; i < spawnCount; i++) {
    if (tendrilTips.length >= 500) break;            // 上限 500，别调太高 ★
    if (placedComponents.length === 0) break;
    let c = random(placedComponents);                // 随机挑一个组件起步
    spawnTip(random(c.x, c.x + c.w), random(c.y, c.y + c.h), random(TWO_PI));
  }

  for (let i = tendrilTips.length - 1; i >= 0; i--) {
    let t = tendrilTips[i];

    let n = noise(t.x * 0.005, t.y * 0.005, t.seed);
    t.angle += (n - 0.5) * 0.8;                       // 转弯幅度 ★

    if (random() < 0.02) {                            // 急折概率 ★
      t.angle += (random() - 0.5) * PI * 0.5;
    }

    let nx = t.x + cos(t.angle) * 2.5;                // 步长 ★
    let ny = t.y + sin(t.angle) * 2.5;

    let a = map(t.life, 0, t.maxLife, 0, 150);

    g.stroke(tendrilStroke(a));
    g.strokeWeight(t.weight);
    g.line(t.x, t.y, nx, ny);

    g.stroke(tendrilGlow(a * 0.4));
    g.strokeWeight(t.weight * 0.35);
    g.line(t.x, t.y, nx, ny);

    if (random() < (0.012 + prog * 0.02) && tendrilTips.length < 500) {  // 分叉概率 ★
      spawnTip(nx, ny, t.angle + (random() - 0.5) * PI * 0.55);
    }

    t.x = nx;
    t.y = ny;
    t.life--;

    let out = nx < -20 || ny < -20 || nx > width + 20 || ny > height + 20;
    if (t.life <= 0 || out) {
      tendrilTips.splice(i, 1);
    }
  }
}


function spawnTip(x, y, angle) {
  let maxLife = random(120, 260);                     
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
}
