// =====================================================================
// corruption.js —— 柏林噪声腐化特效模块（完整版）
// 负责人：[柏林噪声同学]
//
// 阶段三：红点在每个组件的「边线」上生成，由小逐渐长大，直到吞掉组件。
// 阶段四：停止生点，从被染过的组件上长出菌丝藤蔓、铺满画布。
// 两个阶段的活跃特效分开，不混在一起；阶段三的红点会留到阶段四当底色。
//
// 架构最小：一张持久透明层、只读共享状态、对外只暴露 drawCorruption()。
//
// 用法（主文件 sketch.js 那边）：
//   1) index.html 里加： <script src="corruption.js"></script>
//   2) 主文件 draw() 里，画完组件之后加一行： drawCorruption();
//
// 本文件「只读」下面两个东西，不要在这里 let/const 它们（由主文件声明）：
//   placedComponents : 数组，每个组件有 x, y, w, h（组件放下后不再移动）
//   timeState        : { currentStage(1~4), corruption(0~1) }
//                      corruption 在阶段三是 0→0.5，阶段四是 0.5→1
//
// 想调效果，改下面带 ★ 的参数即可，架构不用动。
// =====================================================================


// 一张和画布一样大的「持久透明图层」：所有红点和藤蔓都画在它上面、
// 永不擦除。组件被删掉后，已经长出来的痕迹会自然留着（=不可逆残影）。
let corruptionLayer = null;

// 还在生长的藤蔓「笔尖」列表。
let tendrilTips = [];


// ── 颜色：想换配色只改这几行 ★ ──
function dotBleed(a)      { return color(178, 16, 16, a); }   // 红点外晕（很淡）
function dotBody(a)       { return color(178, 16, 16, a); }   // 红点主体
function dotCore(a)       { return color(220, 60, 40, a); }   // 红点高亮核
function tendrilStroke(a) { return color(150, 10, 10, a); }   // 藤蔓主脉
function tendrilGlow(a)   { return color(210, 45, 10, a); }   // 藤蔓暗火微光


// ── 每帧入口：主文件 draw() 里调这一个函数就够 ──
function drawCorruption() {

  // 第一次调用时按画布大小建透明图层。千万不要 background()，要保持透明。
  if (corruptionLayer === null) {
    corruptionLayer = createGraphics(width, height);
  }

  // 阶段三：只长红点（围绕边线，由小到大）
  if (timeState.currentStage === 3) {
    growDiffusion();
  }
  // 阶段四：只长菌丝藤蔓（红点停止生成，但已经画下的留着）
  if (timeState.currentStage >= 4) {
    growTendrils();
  }

  // 把持久图层贴到主画布最上层
  image(corruptionLayer, 0, 0);
}


// ── 红点扩散（阶段三）：在组件边线上生成，半径随阶段进度由小长到大 ──
function growDiffusion() {
  let g = corruptionLayer;

  // 阶段三进度 0→1（corruption 在阶段三是 0→0.5）
  let prog = constrain(timeState.corruption / 0.5, 0, 1);

  // 每帧生成的点数：阶段三一开始就有，越往后越多（越大越快盖满）★
  let spawnCount = 1 + floor(prog * 2);

  g.noStroke();

  for (let c of placedComponents) {

    // 这个组件的「目标半径」：随阶段三进度，从 3px 长到能吞掉组件。
    // maxR 越大，红点最终越能盖住/超出组件 ★
    let maxR  = min(c.w, c.h) * 0.6;
    let growR = lerp(3, maxR, prog);

    for (let i = 0; i < spawnCount; i++) {

      // 在组件「边线」上随机取一点（围绕边框生成）
      let p = randomBorderPoint(c);

      // 半径由 Perlin 噪声调制（每颗大小有机变化），整体随进度变大 ★
      let n = noise(p.x * 0.02, p.y * 0.02, frameCount * 0.003);
      let r = growR * (0.2 + n * 2.2);

      // 三层发光圆。注意：不裁剪，所以会自然一半在内一半在外、稍微溢出。
      g.fill(dotBleed(8));
      g.circle(p.x, p.y, r * 2.6);
      g.fill(dotBody(38));
      g.circle(p.x, p.y, r * 2);
      g.fill(dotCore(70));
      g.circle(p.x, p.y, r * 0.6);
    }
  }
}


// 在组件矩形的「边线」上随机取一点，带一点内外抖动（不至于排成直线）
function randomBorderPoint(c) {
  let side   = floor(random(4));   // 0上 1右 2下 3左
  let jitter = random(-6, 6);      // 轻微内外偏移 ★
  if (side === 0) return { x: random(c.x, c.x + c.w), y: c.y + jitter };
  if (side === 1) return { x: c.x + c.w + jitter,     y: random(c.y, c.y + c.h) };
  if (side === 2) return { x: random(c.x, c.x + c.w), y: c.y + c.h + jitter };
  return            { x: c.x + jitter,                y: random(c.y, c.y + c.h) };
}


// ── 藤蔓（阶段四）：从组件里生出笔尖，柏林噪声转向，分叉、画主脉+暗火 ──
function growTendrils() {
  let g = corruptionLayer;

  // 阶段四进度 0→1（corruption 在阶段四是 0.5→1）
  let prog = constrain((timeState.corruption - 0.5) / 0.5, 0, 1);

  // 1) 生成新笔尖：阶段四一开始就有，越往后越频繁；总数封顶防卡
  let spawnCount = 1 + floor(prog * 3);              // ★
  for (let i = 0; i < spawnCount; i++) {
    if (tendrilTips.length >= 500) break;            // 上限 500，别调太高 ★
    if (placedComponents.length === 0) break;
    let c = random(placedComponents);                // 随机挑一个组件起步
    spawnTip(random(c.x, c.x + c.w), random(c.y, c.y + c.h), random(TWO_PI));
  }

  // 2) 每个笔尖走一步、画一段（倒着遍历，方便删掉死掉的）
  for (let i = tendrilTips.length - 1; i >= 0; i--) {
    let t = tendrilTips[i];

    // 柏林噪声平滑转向
    let n = noise(t.x * 0.005, t.y * 0.005, t.seed);
    t.angle += (n - 0.5) * 0.8;                       // 转弯幅度 ★

    // 偶尔来个急折，更有生物感
    if (random() < 0.02) {                            // 急折概率 ★
      t.angle += (random() - 0.5) * PI * 0.5;
    }

    // 走一步
    let nx = t.x + cos(t.angle) * 2.5;                // 步长 ★
    let ny = t.y + sin(t.angle) * 2.5;

    // 透明度随寿命变淡
    let a = map(t.life, 0, t.maxLife, 0, 150);

    // 主脉
    g.stroke(tendrilStroke(a));
    g.strokeWeight(t.weight);
    g.line(t.x, t.y, nx, ny);

    // 叠一层更亮、更细的暗火微光
    g.stroke(tendrilGlow(a * 0.4));
    g.strokeWeight(t.weight * 0.35);
    g.line(t.x, t.y, nx, ny);

    // 分叉：小概率生出一根支线（菌丝感）。概率随阶段四进度增加。
    if (random() < (0.012 + prog * 0.02) && tendrilTips.length < 500) {  // 分叉概率 ★
      spawnTip(nx, ny, t.angle + (random() - 0.5) * PI * 0.55);
    }

    // 更新
    t.x = nx;
    t.y = ny;
    t.life--;

    // 出界或寿命到了就删（已画的线留在图层上）
    let out = nx < -20 || ny < -20 || nx > width + 20 || ny > height + 20;
    if (t.life <= 0 || out) {
      tendrilTips.splice(i, 1);
    }
  }
}


// 生成一个藤蔓笔尖
function spawnTip(x, y, angle) {
  let maxLife = random(120, 260);                     // 寿命范围 ★
  tendrilTips.push({
    x: x,
    y: y,
    angle: angle,
    life: maxLife,
    maxLife: maxLife,
    weight: random(0.6, 1.8),                         // 线粗范围 ★
    seed: random(1000),                               // 各自的噪声种子
  });
}


// 可选：窗口大小变了，主文件 windowResized() 里调一下（会清掉已有痕迹）。
function resizeCorruption() {
  corruptionLayer = createGraphics(width, height);
}
