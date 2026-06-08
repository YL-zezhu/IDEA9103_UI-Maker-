
const glitchChars = ['#', '@', '%', '&', '/', '\\', '*', '?', '!', '░', '▓', '█'];


function glitchComponent(component) {
  // levels of effects
  // bass
  let bass = constrain(map(smoothBass, currentSettings.bassMin, currentSettings.bassMax, 0, currentSettings.bassRange), 0, currentSettings.bassRange);
  let dongcidaci = bass * bass * bass * bass;
  let bassShake = dongcidaci * 10 * corruption;
  let bass_x_offset = random(-bassShake, bassShake);
  let bass_y_offset = random(-bassShake, bassShake);
  
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

function glitchTextOnly(component, bass_x_offset, bass_y_offset, mid, treble){
  let x = component.x + bass_x_offset;
  let y = component.y + bass_y_offset;

  // mid and treble (text)
  textAlign(LEFT, CENTER);
  textSize(20);
  noStroke();

  let jiligulu = mid * mid;
  let glitchLevel = jiligulu * corruption;
  let redLevel = jiligulu * corruption;

  let totalWidth = textWidth(component.text);
  let startX = x + component.w / 2 - totalWidth / 2;
  let charX = startX;    

  for (let letter of component.text) {
    let displayChar;
    if (random() < glitchLevel) {     // decide glitch or not
      displayChar = random(glitchChars);
    } else {
      displayChar = letter;
    }

    let isRed = random() < redLevel;
  
    let text_offset = treble * 0.5 * corruption;
  
    push();
    // red (left)
    fill(isRed ? 255 : 180, 0, 0, 160);
    text(displayChar, charX - text_offset, y + component.h / 2);
  
    // blue (right)
    fill(0, 60, 220, 160);
    text(displayChar, charX + text_offset, y + component.h / 2);
  
    // original text (middle)
    if (isRed) {
      fill(220, 40, 40);
    } else {
      fill(210, 210, 225);
    }
    text(displayChar, charX, y + component.h / 2);
    pop();
  
    charX += textWidth(displayChar);
  }

}

function glitchFramedComponent(component, bass_x_offset, bass_y_offset, mid, treble){
  // shaking effect
  let x = component.x + bass_x_offset;   
  let y = component.y + bass_y_offset;


  // testing component
  push();
  noFill();
  stroke(90, 90, 110);
  strokeWeight(8);
  rect(x, y, component.w, component.h);
  pop();


  // treble (frame)
  let woxiale = treble * treble;

  let treble_offset = woxiale * corruption;

  push();
  rectMode(CORNER);
  blendMode(ADD); //effect point

  // red (left)
  noStroke();
  fill(120, 0, 0);
  rect(x - treble_offset, y, component.w, component.h);
  // green (middle)
  fill(0, 120, 0);
  rect(x, y, component.w, component.h);
  // blue (right)
  fill(0, 0, 120);
  rect(x + treble_offset, y, component.w, component.h);

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