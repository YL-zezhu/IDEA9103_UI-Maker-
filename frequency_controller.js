
const glitchChars = ['#', '@', '%', '&', '/', '\\', '*', '?', '!', '░', '▓', '█'];

function glitchComponent(component) {

  // bass
  let bass = map(smoothBass, 125, 255, 0, 1);
  let dongcidaci = bass * bass * bass * bass;
  let shake = dongcidaci * 10 * corruption;
  let x_offset = random(-shake, shake);
  let y_offset = random(-shake, shake);

  // shaking effect
  let x = component.x + x_offset;   
  let y = component.y + y_offset;


  // testing component
  push();
  noFill();
  stroke(90, 90, 110);
  strokeWeight(8);
  rect(x, y, component.w, component.h);
  pop();

  // mid
  let mid = map(smoothMid, 75, 255, 0, 0.4);

  push();
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
    let displayText = "";
    if (random() < glitchLevel) {
      displayText += random(glitchChars);
    } else {
      displayText = letter;
    }

    if (random() < redLevel) {
      fill(220, 40, 40);
    } else {
      fill(210, 210, 225);
  }

    text(displayText, charX, y + component.h / 2);
  
    charX += textWidth(displayText);

  }

  pop();

  
  // treble
  let treble = map(smoothTreble, 0, 255, 0, 1);
  let xiajibashan = treble * treble;
}
