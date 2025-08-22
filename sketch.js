let video;
let previousFrame;
let motionAmount = 0;
let zoomAmount = 1.05;
let displaceColors;

let displaceColorsSrc = `
precision highp float;

uniform sampler2D tex0;
uniform float zoomAmount;

varying vec2 vTexCoord;

vec2 zoom(vec2 coord, float amount) {
  vec2 relativeToCenter = coord - 0.5;
  relativeToCenter /= amount;
  return relativeToCenter + 0.5;
}

void main() {
  float zG = zoomAmount;
  float zB = zoomAmount * 1.2;

  gl_FragColor = vec4(
    texture2D(tex0, vTexCoord).r,
    texture2D(tex0, zoom(vTexCoord, zG)).g,
    texture2D(tex0, zoom(vTexCoord, zB)).b,
    texture2D(tex0, vTexCoord).a
  );
}
`;

function setup() {
  createCanvas(1920, 1080, WEBGL);

  // Try loading a video file first
  video = createVideo(['https://upload.wikimedia.org/wikipedia/commons/d/d2/DiagonalCrosswalkYongeDundas.webm'], onVideoLoaded, onVideoError);
  video.size(1920, 1080);
  video.hide();
  video.volume(0);
  video.loop();

  displaceColors = createFilterShader(displaceColorsSrc);

  previousFrame = createImage(1920, 1080);
}

function onVideoLoaded() {
  console.log("Video file loaded successfully.");
}

function onVideoError(err) {
  console.warn("Could not load video file, falling back to webcam...", err);

  // Use webcam as fallback
  video = createCapture(VIDEO);
  video.size(1920, 1080);
  video.hide();
}

function draw() {
  background(51);

  // Motion detection
  video.loadPixels();
  previousFrame.loadPixels();

  let totalMotion = 0;
  let count = 0;

  if (video.pixels.length > 0 && previousFrame.pixels.length > 0) {
    for (let i = 0; i < video.pixels.length; i += 4) {
      let r1 = video.pixels[i];
      let g1 = video.pixels[i + 1];
      let b1 = video.pixels[i + 2];

      let r2 = previousFrame.pixels[i];
      let g2 = previousFrame.pixels[i + 1];
      let b2 = previousFrame.pixels[i + 2];

      let diff = dist(r1, g1, b1, r2, g2, b2);
      totalMotion += diff;
      count++;
    }

    motionAmount = totalMotion / count;
  }

  motionAmount = lerp(motionAmount, 0, 0.05);
  zoomAmount = lerp(zoomAmount, map(motionAmount, 0, 30, 1.02, 1.25, true), 0.2);

  displaceColors.setUniform('zoomAmount', zoomAmount);

  // Draw video or webcam
  image(video, -width / 2, -height / 2, width, height);
  filter(displaceColors);
  filter(INVERT);

  // Save current frame
  previousFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);
}
