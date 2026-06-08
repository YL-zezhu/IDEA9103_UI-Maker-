let song = [];
let fft;
let corruption = 1;
let smoothBass = 0, smoothMid = 0, smoothTreble = 0;

let testComp = { x: 250, y: 200, w: 600, h: 80, text: "I AM A VERY LONG TESTING TEXT" };

let playButton;
let currentSongIndex = 0;
let songSettings = [
  { bassMin: 200, midMin: 30, trebleMin: 0, bassMax: 255, midMax: 80, trebleMax: 255, bassRange: 1, midRange: 0.4, trebleRange: 6 , smoothB: 0.8, smoothM: 0.6, smoothT: 0.2},
  { bassMin: 150, midMin: 110, trebleMin: 25, bassMax: 255, midMax: 170, trebleMax: 60, bassRange: 1, midRange: 0.4, trebleRange: 6 , smoothB: 0.8, smoothM: 0.6, smoothT: 1},
  { bassMin: 150, midMin: 75, trebleMin: 50, bassMax: 240, midMax: 170, trebleMax: 150, bassRange: 1, midRange: 0.4, trebleRange: 6 , smoothB: 0.8, smoothM: 0.6, smoothT: 1},
  { bassMin: 210, midMin: 120, trebleMin: 100, bassMax: 255, midMax: 230, trebleMax: 160, bassRange: 1, midRange: 0.4, trebleRange: 6 , smoothB: 0.8, smoothM: 0.6, smoothT: 1},
];

let currentSettings = songSettings[0];

function preload() {
  song[0] = loadSound("Assets/songs/Brian Eno - Music for Airports.mp3");
  song[1] = loadSound("Assets/songs/The Caretaker - We don't have many days.mp3");
  song[2] = loadSound("Assets/songs/塞壬唱片-MSR,Elvin Shen - Visage.mp3");
  song[3] = loadSound("Assets/songs/Victor Borba - Bury the Light.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  fft = new p5.FFT(0.8, 1024);
  fft.setInput(song[0]);

  playButton = createButton('Play');
  playButton.position(20, 20);
  playButton.mousePressed(bgmPlay);


  // testing buttons
  let btn1 = createButton('song 1');
  btn1.position(80, 20);
  btn1.mousePressed(() => switchBGM(0));
  
  let btn2 = createButton('song 2');
  btn2.position(130, 20);
  btn2.mousePressed(() => switchBGM(1));
  
  let btn3 = createButton('song 3');
  btn3.position(180, 20);
  btn3.mousePressed(() => switchBGM(2));

  let btn4 = createButton('bonus');
  btn4.position(230, 20);
  btn4.mousePressed(() => switchBGM(3));
}

function bgmPlay() {
  if (!song[currentSongIndex].isPlaying()) {
    song[currentSongIndex].loop();
    playButton.html('Pause');
  } else {
    song[currentSongIndex].pause();
    playButton.html('Play');
  }
}

function draw() {
  background(0);

  fft.analyze();
  let bass = fft.getEnergy(60, 150);
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");

  smoothBass = lerp(smoothBass, bass, currentSettings.smoothB);
  smoothMid = lerp(smoothMid, mid, currentSettings.smoothM);
  smoothTreble = lerp(smoothTreble, treble, currentSettings.smoothT);

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

function switchBGM(index) {
  // pause before switching
  if (song[currentSongIndex] && song[currentSongIndex].isPlaying()) {
    song[currentSongIndex].stop();
  }
  
  currentSongIndex = index;            // change index
  fft.setInput(song[index]);           // analysize new song
  song[index].loop();                  // play new song
  currentSettings = songSettings[index];   // change new song settings
  
  playButton.html('Pause');
}
