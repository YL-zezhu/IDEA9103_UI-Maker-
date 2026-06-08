function createSegmentLine(
  x1,
  y1,
  x2,
  y2,
  segmentLength,
  roughness
) {

  let result = [];

  if (y1 == y2) {

    for (
      let x = x1;
      x < x2;
      x += segmentLength
    ) {

      result.push({
        x1: x + random(-roughness, roughness),
        y1: y1 + random(-roughness, roughness),

        x2: min(x + segmentLength, x2)
          + random(-roughness, roughness),

        y2: y1 + random(-roughness, roughness)
      });

    }

  } else if (x1 == x2) {

    for (
      let y = y1;
      y < y2;
      y += segmentLength
    ) {

      result.push({
        x1: x1 + random(-roughness, roughness),

        y1: y + random(-roughness, roughness),

        x2: x1 + random(-roughness, roughness),

        y2: min(y + segmentLength, y2)
          + random(-roughness, roughness)
      });

    }

  }

  return result;
}



function createSketchRect(
  x,
  y,
  w,
  h,
  segmentLength,
  roughness
) {

  let result = [];

  let top = createSegmentLine(
    x,
    y,
    x + w,
    y,
    segmentLength,
    roughness
  );

  let bottom = createSegmentLine(
    x,
    y + h,
    x + w,
    y + h,
    segmentLength,
    roughness
  );

  let left = createSegmentLine(
    x,
    y,
    x,
    y + h,
    segmentLength,
    roughness
  );

  let right = createSegmentLine(
    x + w,
    y,
    x + w,
    y + h,
    segmentLength,
    roughness
  );

  result = result.concat(top);
  result = result.concat(bottom);
  result = result.concat(left);
  result = result.concat(right);

  return result;
}

function drawSketchCircle(cx, cy, r, roughness) {
  noFill();
  beginShape();

  for (let angle = 0; angle < TWO_PI; angle += 0.25) {
    let offset = noise(angle * 2) * roughness * 2 - roughness;
    let offsetR = r + offset;

    let x = cx + cos(angle) * offsetR;
    let y = cy + sin(angle) * offsetR;

    vertex(x, y);
  }

  endShape(CLOSE);
}

function drawSegments(segments) {

  stroke(30);
  strokeWeight(4);

  for (let seg of segments) {

    line(
      seg.x1,
      seg.y1,
      seg.x2,
      seg.y2
    );

  }

}

function createBgmDropdown(
  x,
  y,
  w,
  rowH,
  options,
  segmentLength,
  roughness
) {
  let dropdown = {
    x: x,
    y: y,
    w: w,
    rowH: rowH,
    h: rowH * options.length,
    options: options,
    outerSegments: [],
    dividerSegments: []
  };

  dropdown.outerSegments = createSketchRect(
    x,
    y,
    w,
    dropdown.h,
    segmentLength,
    roughness
  );

  for (let i = 1; i < options.length; i++) {
    let dividerY = y + rowH * i;

    let divider = createSegmentLine(
      x,
      dividerY,
      x + w,
      dividerY,
      segmentLength,
      roughness
    );

    dropdown.dividerSegments = dropdown.dividerSegments.concat(divider);
  }

  return dropdown;
}


function drawBgmDropdown(dropdown, selectedIndex) {
  noStroke();
  fill(245);
  rect(
    dropdown.x,
    dropdown.y,
    dropdown.w,
    dropdown.h
  );

  stroke(70);
  strokeWeight(3);
  drawSegments(dropdown.outerSegments);

  stroke(70);
  strokeWeight(2);
  drawSegments(dropdown.dividerSegments);

  noStroke();
  fill(70);
  textAlign(LEFT, CENTER);
  textSize(width * 0.012);

  for (let i = 0; i < dropdown.options.length; i++) {
    let optionY = dropdown.y + dropdown.rowH * i + dropdown.rowH / 2;

    let prefix = "";

    if (i == selectedIndex) {
      prefix = "> ";
    }

    text(
      prefix + dropdown.options[i],
      dropdown.x + dropdown.w * 0.08,
      optionY
    );
  }
}


function getBgmOptionIndex(px, py, dropdown) {
  if (
    px > dropdown.x &&
    px < dropdown.x + dropdown.w &&
    py > dropdown.y &&
    py < dropdown.y + dropdown.h
  ) {
    return Math.floor((py - dropdown.y) / dropdown.rowH);
  }

  return -1;
}

class Component {
  constructor(x, y, w, h, type) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.type = type;

    this.segmentLength = width * 0.015;
    this.roughness = 2;

    this.segments = createSketchRect(
      this.x,
      this.y,
      this.w,
      this.h,
      this.segmentLength,
      this.roughness
    );
  }

  display() {

    if (this.type == "image") {

      drawSegments(this.segments);

      noStroke();
      fill(30);

      textAlign(CENTER, CENTER);
      textSize(width * 0.012);

      text(
        "image",
        this.x + this.w / 2,
        this.y + this.h / 2
      );

    }

    else if (this.type == "backgroundImage") {

      drawSegments(this.segments);

      noStroke();
      fill(30);

      textAlign(CENTER, CENTER);
      textSize(width * 0.012);

      text(
        "background image",
        this.x + this.w / 2,
        this.y + this.h / 2
      );

    }

    else if (this.type == "search") {

      drawSegments(this.segments);

      stroke(30);
      strokeWeight(2);

      noFill();

      ellipse(
        this.x + this.h * 0.35,
        this.y + this.h * 0.5,
        this.h * 0.35
      );

      line(
        this.x + this.h * 0.48,
        this.y + this.h * 0.63,

        this.x + this.h * 0.62,
        this.y + this.h * 0.77
      );

    }

    else if (this.type == "title") {

      stroke(2);
      fill(30);

      textAlign(LEFT, CENTER);

      textSize(this.h * 0.7);

      text(
        "TITLE",
        this.x,
        this.y + this.h / 2
      );

    }

    else if (this.type == "text") {

      noStroke();
      fill(30);

      textAlign(LEFT, TOP);

      textSize(this.h * 0.3);

      text(
        'This text is only for testing\nthe function of this\ncomponent.',
        this.x,
        this.y,
      );

    }

    else if (this.type == "card") {
      drawSegments(this.segments);

      // image placeholder inside card
      let imgX = this.x + this.w * 0.1;
      let imgY = this.y + this.h * 0.08;
      let imgW = this.w * 0.6;
      let imgH = this.h * 0.5;

      noFill();
      stroke(30);
      strokeWeight(2);
      rect(imgX, imgY, imgW, imgH);

      // three-dot menu
      noStroke();
      fill(20);

      let dotX = this.x + this.w * 0.88;

      ellipse(
        dotX,
        this.y + this.h * 0.12,
        this.w * 0.03
      );

      ellipse(
        dotX + 1,
        this.y + this.h * 0.16,
        this.w * 0.03
      );

      ellipse(
        dotX,
        this.y + this.h * 0.20,
        this.w * 0.03
      );

      stroke(30);
      strokeWeight(2);

      line(
        this.x + this.w * 0.08,
        this.y + this.h * 0.65,
        this.x + this.w * 0.85,
        this.y + this.h * 0.65
      );
    }
  }
}