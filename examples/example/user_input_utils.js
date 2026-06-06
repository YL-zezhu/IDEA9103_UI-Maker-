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



function createSegmentRect(
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



function drawCardComponent(
  x,
  y,
  w,
  h,
  segments,
  label,
  labelX,
  labelY
) {

  drawSegments(segments);

  noStroke();
  fill(30);

  textSize(width * 0.015);

  textAlign(CENTER, CENTER);

  text(
    label,
    labelX,
    labelY
  );

}