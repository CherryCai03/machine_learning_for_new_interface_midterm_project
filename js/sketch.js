// Oct 26 2019
// Cherry

/*
This is based on the example code of ml5.js
https://ml5js.org/
*/

/*
PartId  PartName
-1      (no body part)
0       leftFace
1       rightFace
2       rightUpperLegFront
3       rightLowerLegBack
4       rightUpperLegBack
5       leftLowerLegFront
6       leftUpperLegFront
7       leftUpperLegBack
8       leftLowerLegBack
9       rightFeet
10      rightLowerLegFront
11      leftFeet
12      torsoFront
13      torsoBack
14      rightUpperArmFront
15      rightUpperArmBack
16      rightLowerArmBack
17      leftLowerArmFront
18      leftUpperArmFront
19      leftUpperArmBack
20      leftLowerArmBack
21      rightHand
22      rightLowerArmFront
23      leftHand
*/

let bodypix;
let cam;
let video;
let segmentation;
let img;
let posXs = [];
let minX  = 0;
let leaves = [];
let faces = [];
let scaling = 2;


console.log('ml5 version:', ml5.version);

const options = {
  "outputStride": 8, // 8, 16, or 32, default is 16
  "segmentationThreshold": 0.3 // 0 - 1, defaults to 0.5
}

function setup() {
  createCanvas(640, 480);
  background(255);

  // load up your video
  video = createCapture(VIDEO);
  video.size(width/scaling, height/scaling);
  video.hide();
  img = createImage(width/scaling, height/scaling);
  bodypix = ml5.bodyPix(video, modelReady);
}

function draw() {
  background(255, 50);
  image(img, 0, 0, width, height );

  //draw leaf
  for (let i=0; i<leaves.length; i++) {
    let l = leaves[i];
    l.display();
    l.move();
    if (minX * scaling > width/3 * 2) {
      l.fall();
    } else if(minX * scaling < width/3 * 1){
      l.update();
    }
    while (leaves.length > 200) {
      leaves.splice(0, 1);
    }
  }
  //draw face
  for (let i=0; i<faces.length; i++) {
    let f = faces[i];
    f.display();
    f.move();
    if (minX * scaling > width/3 * 2) {
      f.update();
    }else if(minX * scaling < width/3 * 1){
      f.fall();
    }
  }
  while (faces.length > 200) {
    faces.splice(0, 1);
  }
}

class Face {
  constructor(x,y) {
    this.x = x;
    this.y = y;
    this.R = random(0,100);
    this.G = random(150,255);
    this.B = 0;
    this.r = random(5, 10);
  }
  changeColor(r, g, b) {
    this.R = r;
    this.G = g;
    this.B = b;
  }
  fall(){
    this.y += random(5,10);
  }
  move(){
    this.y += random(-2, 2);
    this.x += random(-2, 2);
  }
  update(){
    noStroke();
    fill(this.R,this.G,this.B, 100);
    rect(this.x, this.y, this.r  * scaling, this.r * scaling);
  }
  display(){
    //stroke(0);
    noStroke();
    fill(this.R,this.G,this.B, 50);
    rect(this.x, this.y, this.r * scaling * random(0.1,0.5), this.r * scaling) * random(0.1,0.5);
  }
}

class Leaf {
  constructor(x,y) {
    this.x = x;
    this.y = y;
    this.R = random(0,100);
    this.G = random(150,255);
    this.B = 0;
    this.r = random(5, 10);
  }
  changeColor(r, g, b) {
    this.R = r;
    this.G = g;
    this.B = b;
  }
  fall(){
    this.y += random(5,10);
  }
  move(){
    this.y += random(-2, 2);
    this.x += random(-2, 2);
  }
  update(){
    noStroke();
    fill(this.R,this.G,this.B, 100);
    ellipse(this.x, this.y, this.r * random(0.2, 1), this.r * random(0.2, 1)* scaling);
  }
  display(){
    //stroke(0);
    noStroke();
    fill(this.R,this.G,this.B, 50);
    ellipse(this.x, this.y, this.r*random(0.1, 0.8), this.r * random(0.1, 0.8)* scaling);
  }
}

function modelReady() {
  console.log('ready!')
  bodypix.segmentWithParts(gotResults, options)
}

function gotResults(err, result) {
  if (err) {
    console.log(err)
    return
  }
  segmentation = result;

  // display the image
  if (segmentation !== undefined) {
    let w = segmentation.raw.width;
    let h = segmentation.raw.height;
    let data = segmentation.raw.data;

    img.loadPixels();
    video.loadPixels();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let index = x + y * w;
        let colorIndex = (x + y * w) * 4; // RGBA

        if ( data[index] == 0 ) {
          let gridSize = 3;
          let mappedX = map(x, 0, w, 0, width);
          let mappedY = map(y, 0, h, 0, height);
          if ( (x % gridSize) == 0 && (y % gridSize) == 0 ) {
            if (random(1) < 0.05) {
              leaves.push( new Leaf(mappedX,mappedY) );
            }
          }
          if (posXs.length < 80) {
            posXs.push(x);
          } else {
            posXs.splice(0, 1);
            posXs.push(x);
          }
        }
        else if (data[index] == 1) {
          let gridSize = 3;
          let mappedX = map(x, 0, w, 0, width);
          let mappedY = map(y, 0, h, 0, height);
          if ( (x % gridSize) == 0 && (y % gridSize) == 0 ) {
            if (random(1) < 0.05) {
              let face = new Face(mappedX,mappedY);
              r = video.pixels[colorIndex + 0];
              g = video.pixels[colorIndex + 1];
              b = video.pixels[colorIndex + 2];
              face.changeColor(r,g,b);
              faces.push( face );
            }
          }
        }
        if ( data[index] == 12 && x > Math.min(...posXs) ) {
          let gridSize = 3;
          let mappedX = map(x, 0, w, 0, width);
          let mappedY = map(y, 0, h, 0, height);
          if ( (x % gridSize) == 0 && (y % gridSize) == 0 ) {
            if (random(1) < 0.05) {
              leaves.push( new Leaf(mappedX,mappedY) );
            }
          }
        } else if ( data[index] == 12 && x < Math.min(...posXs) ) {
          let gridSize = 3;
          let mappedX = map(x, 0, w, 0, width);
          let mappedY = map(y, 0, h, 0, height);
          if ( (x % gridSize) == 0 && (y % gridSize) == 0 ) {
            if (random(1) < 0.05) {
              let face = new Face(mappedX,mappedY);
              r = video.pixels[colorIndex + 0];
              g = video.pixels[colorIndex + 1];
              b = video.pixels[colorIndex + 2];
              face.changeColor(r,g,b);
              faces.push( face );
            }
          }
        }
        if (data[index] != 1  && data[index] != 0 && data[index] != 12) {
          img.pixels[colorIndex + 0] = 255;
          img.pixels[colorIndex + 1] = 255;
          img.pixels[colorIndex + 2] = 255;
          img.pixels[colorIndex + 3] = 0;
        }
      }
      img.updatePixels();
    }
    minX = Math.min(...posXs);
  }
  bodypix.segmentWithParts(gotResults, options);
}
