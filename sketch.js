let song = [];
let fft;
let corruption = 1;
let smoothBass = 0, smoothMid = 0, smoothTreble = 0;

let testComp = { x: 250, y: 200, w: 600, h: 80, text: "I AM A VERY LONG TESTING TEXT" };

let playButton;

function preload() {
  song[0] = loadSound("Assets/songs/sample10.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  fft = new p5.FFT(0.8, 1024);
  fft.setInput(song[0]);

  playButton = createButton('Play');
  playButton.position(20, 20);
  playButton.mousePressed(bgmPlay());
}

function bgmPlay() {
  if (!song[0].isPlaying()) {
    song[0].play();
    playButton.html('Pause');
  } else {
    song[0].pause();
    playButton.html('Play');
  }
}

function draw() {
  background(0);

  fft.analyze();
  let bass = fft.getEnergy(60, 150);
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");

  smoothBass = lerp(smoothBass, bass, 0.8);
  smoothMid = lerp(smoothMid, mid, 0.6);
  smoothTreble = lerp(smoothTreble, treble, 0.2);

  glitchComponent(testComp);

  fill(120);
  textAlign(LEFT, TOP);
  textSize(13);
  text(
    "bass: " + smoothBass.toFixed(0) +
    "   mid: " + smoothMid.toFixed(0) +
    "   treble: " + smoothTreble.toFixed(0) +
    "     corruption: " + corruption,
    20, 60
  );
  textAlign(CENTER, CENTER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
