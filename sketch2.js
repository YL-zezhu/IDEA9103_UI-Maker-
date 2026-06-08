let song = [];
let fft;

let corruption = 1;
let smoothBass = 0;
let smoothMid = 0;
let smoothTreble = 0;

let playButton;
let currentSongIndex = 0;

let songSettings = [
  {
    bassMin: 200,
    midMin: 30,
    trebleMin: 0,
    bassMax: 255,
    midMax: 80,
    trebleMax: 255,
    bassRange: 1,
    midRange: 0.4,
    trebleRange: 6,
    smoothB: 0.8,
    smoothM: 0.6,
    smoothT: 0.2
  },
  {
    bassMin: 150,
    midMin: 110,
    trebleMin: 25,
    bassMax: 255,
    midMax: 170,
    trebleMax: 60,
    bassRange: 1,
    midRange: 0.4,
    trebleRange: 6,
    smoothB: 0.8,
    smoothM: 0.6,
    smoothT: 1
  },
  {
    bassMin: 150,
    midMin: 75,
    trebleMin: 50,
    bassMax: 240,
    midMax: 170,
    trebleMax: 150,
    bassRange: 1,
    midRange: 0.4,
    trebleRange: 6,
    smoothB: 0.8,
    smoothM: 0.6,
    smoothT: 1
  },
  {
    bassMin: 210,
    midMin: 120,
    trebleMin: 100,
    bassMax: 255,
    midMax: 230,
    trebleMax: 160,
    bassRange: 1,
    midRange: 0.4,
    trebleRange: 6,
    smoothB: 0.8,
    smoothM: 0.6,
    smoothT: 1
  }
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

  playButton = createButton("Play");
  playButton.position(20, 20);
  playButton.mousePressed(bgmPlay);

  setupUserInputUI();
}

function draw() {
  background(245);

  let audioState = updateAudioState();

  drawUserInputUI(audioState);

  drawAudioDebug(audioState);
}

function updateAudioState() {
  fft.analyze();

  let bass = fft.getEnergy(60, 150);
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");

  smoothBass = lerp(smoothBass, bass, currentSettings.smoothB);
  smoothMid = lerp(smoothMid, mid, currentSettings.smoothM);
  smoothTreble = lerp(smoothTreble, treble, currentSettings.smoothT);

  corruption = map(
    smoothTreble,
    currentSettings.trebleMin,
    currentSettings.trebleMax,
    0,
    currentSettings.trebleRange
  );

  corruption = constrain(corruption, 0, currentSettings.trebleRange);

  return {
    bass: smoothBass,
    mid: smoothMid,
    treble: smoothTreble,
    corruption: corruption
  };
}

function drawAudioDebug(audioState) {
  noStroke();
  fill(80);
  textAlign(LEFT, TOP);
  textSize(13);

  text(
    "bass: " + audioState.bass.toFixed(0) +
    "   mid: " + audioState.mid.toFixed(0) +
    "   treble: " + audioState.treble.toFixed(0) +
    "   corruption: " + audioState.corruption.toFixed(2),
    20,
    55
  );

  textAlign(CENTER, CENTER);
}

function bgmPlay() {
  if (!song[currentSongIndex].isPlaying()) {
    song[currentSongIndex].loop();
    playButton.html("Pause");
  } else {
    song[currentSongIndex].pause();
    playButton.html("Play");
  }
}

function switchBGM(index) {
  if (song[currentSongIndex] && song[currentSongIndex].isPlaying()) {
    song[currentSongIndex].stop();
  }

  currentSongIndex = index;
  fft.setInput(song[index]);
  song[index].loop();

  currentSettings = songSettings[index];

  playButton.html("Pause");
}

function mousePressed() {
  userInputMousePressed();
}

function mouseReleased() {
  userInputMouseReleased();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeUserInputUI();

  if (playButton) {
    playButton.position(20, 20);
  }
}