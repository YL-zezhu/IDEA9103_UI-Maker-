
const glitchChars = ['#', '@', '%', '&', '/', '\\', '*', '?', '!', '░', '▓', '█'];


function glitchComponent(component) {
  // levels of effects
  // bass
  let bass = constrain(map(smoothBass, currentSettings.bassMin, currentSettings.bassMax, 0, currentSettings.bassRange), 0, currentSettings.bassRange);
  let dongcidaci = bass * bass * bass * bass;
  let bassShake = dongcidaci * 10 * corruption;
  let bass_x_offset = component.shakeX || 0;
  let bass_y_offset = component.shakeY || 0;
  
  // treble & mid
  let treble = constrain(map(smoothTreble, currentSettings.trebleMin, currentSettings.trebleMax, 0, currentSettings.trebleRange), 0, currentSettings.trebleRange);
  let mid = constrain(map(smoothMid, currentSettings.midMin, currentSettings.midMax, 0, currentSettings.midRange), 0, currentSettings.midRange);
  
  // type dividing
  if (component.type === "title" || component.type === "text") {
    // text component
    glitchTextOnly(component, bass_x_offset, bass_y_offset, mid, treble);
  } else {
    // frame component
    glitchFramedComponent(component, bass_x_offset, bass_y_offset, mid, treble);
  }
}

// text glitch effect
function glitchTextOnly(component, bass_x_offset, bass_y_offset, mid, treble){
  let x = component.x + bass_x_offset;
  let y = component.y + bass_y_offset;

  let textContent = component.textContent;
  if (!textContent) return;
  
  push();

  // mid and treble (text)
  textAlign(LEFT, TOP);
  textSize(component.textSizeValue);
  noStroke();

   if (component.type === "title") {
    textStyle(BOLD);
  } else {
    textStyle(NORMAL);
  }

  let jiligulu = mid * mid;
  let glitchLevel = jiligulu * corruption;
  let redLevel = jiligulu * corruption;

  let lineHeight = component.textSizeValue * 1.2;
  let charX = x;
  let lineY = y;

  for (let letter of component.textContent) {
    if (letter === '\n') {
      lineY += lineHeight;
      charX = x;
      continue;
    }

    let displayChar;
    if (random() < glitchLevel) {     // decide glitch or not
      displayChar = random(glitchChars);
    } else {
      displayChar = letter;
    }

    let isRed = random() < redLevel;
  
    let text_offset = treble * 0.5 * corruption;
  
    push();

    // draw only when offset is large enough
    if (text_offset > 0.3) {
      // red (left)
      fill(isRed ? 255 : 180, 0, 0, 160);
      text(displayChar, charX - text_offset, lineY);
  
      // blue (right)
      fill(0, 60, 220, 160);
      text(displayChar, charX + text_offset, lineY);
    }
  
    // original text (middle)
    if (isRed) {
      fill(220, 40, 40);
    } else {
      fill(30);
    }
    text(displayChar, charX, lineY);
    pop();
  
    charX += textWidth(displayChar);
  }
  pop();

}

// frame glitch effect
function glitchFramedComponent(component, bass_x_offset, bass_y_offset, mid, treble){
  // shaking effect
  let x = component.x + bass_x_offset;   
  let y = component.y + bass_y_offset;


  // treble (frame)
  let woxiale = treble * treble;

  let treble_offset = woxiale * corruption;

  drawGlitchAura(component.segments, treble_offset, bass_x_offset, bass_y_offset);
}

function drawGlitchAura(segments, treble_offset, bass_x_offset, bass_y_offset) {
  // skip when free
  if (treble_offset < 0.5 && abs(bass_x_offset) < 0.5 && abs(bass_y_offset) < 0.5) return;
  
  push();
  strokeWeight(4);
  
  // red (left)
  stroke(220, 40, 40, 180);
  for (let seg of segments) {
    line(
      seg.x1 + bass_x_offset - treble_offset, seg.y1 + bass_y_offset,
      seg.x2 + bass_x_offset - treble_offset, seg.y2 + bass_y_offset
    );
  }
  
  // blue (right)
  stroke(40, 80, 220, 180);
  for (let seg of segments) {
    line(
      seg.x1 - bass_x_offset + treble_offset, seg.y1 - bass_y_offset,
      seg.x2 - bass_x_offset + treble_offset, seg.y2 - bass_y_offset
    );
  }
  pop();
}

/*
function glitchComponent(component) {

  // bass
  let bass = constrain(map(smoothBass, currentSettings.bassMin, currentSettings.bassMax, 0, currentSettings.bassRange), 0, currentSettings.bassRange);
  let dongcidaci = bass * bass * bass * bass;
  let bassShake = dongcidaci * 10 * corruption;
  let bass_x_offset = random(-bassShake, bassShake);
  let bass_y_offset = random(-bassShake, bassShake);
*/
  

  
  /*
    for (let letter of component.text) {
    let displayText = "";
    if (random() < glitchLevel) {     // decide glitch or not
      displayText += random(glitchChars);
    } else {
      displayText = letter;
    }

    if (random() < redLevel) {      // decide red or not
      fill(220, 40, 40);
    } else {
      fill(210, 210, 225);
  }

    text(displayText, charX, y + component.h / 2);
  
    charX += textWidth(displayText);

  }

  pop();


  
  */