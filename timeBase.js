const STAGE2_BLUR_MIN_GAP  = 1200; 
const STAGE2_BLUR_MAX_GAP  = 3500; 
const STAGE2_BLUR_DURATION = 500; 
const STAGE2_BLUR_AMOUNT   = 6; 

const STAGE2_SHAKE_MIN_GAP  = 1000; 
const STAGE2_SHAKE_MAX_GAP  = 3000;
const STAGE2_SHAKE_DURATION = 350; 
const STAGE2_SHAKE_AMOUNT   = 14; 


let blurNextTime = 0;     
let blurTarget   = null; 
let blurStart    = 0;     
let shakeNextTime = 0;
let shakeTarget   = null;
let shakeStart    = 0;

function updateStage2Glitches() {
  for (let c of placedComponents) {
    c._blur   = 0;
    c._shakeX = 0;
    c._shakeY = 0;
  }

  if (timeState.currentStage !== 2) return;
  if (placedComponents.length === 0) return;

  let now = millis(); 

  if (blurTarget === null && now >= blurNextTime) {
    blurTarget = random(placedComponents); 
    blurStart  = now;
  }
  if (blurTarget !== null) {
    let p = (now - blurStart) / STAGE2_BLUR_DURATION; 
    if (p >= 1) {
      blurTarget   = null;                            
      blurNextTime = now + random(STAGE2_BLUR_MIN_GAP, STAGE2_BLUR_MAX_GAP); 
    } else {
      let strength = sin(p * PI);            
      blurTarget._blur = STAGE2_BLUR_AMOUNT * strength;
    }
  }

  if (shakeTarget === null && now >= shakeNextTime) {
    shakeTarget = random(placedComponents);
    shakeStart  = now;
  }
  if (shakeTarget !== null) {
    let p = (now - shakeStart) / STAGE2_SHAKE_DURATION;
    if (p >= 1) {
      shakeTarget   = null;
      shakeNextTime = now + random(STAGE2_SHAKE_MIN_GAP, STAGE2_SHAKE_MAX_GAP);
    } else {
      let cx = shakeTarget.x + shakeTarget.w / 2;
      let cy = shakeTarget.y + shakeTarget.h / 2;
      let dx = mouseX - cx;
      let dy = mouseY - cy;
      let len = sqrt(dx * dx + dy * dy);
      if (len > 0.001) { dx /= len; dy /= len; } else { dx = 0; dy = 0; }
      
      let wobble = sin(p * PI * 3) * (1 - p);
      let amount = STAGE2_SHAKE_AMOUNT * wobble;
      shakeTarget._shakeX = dx * amount;
      shakeTarget._shakeY = dy * amount;
    }
  }
}