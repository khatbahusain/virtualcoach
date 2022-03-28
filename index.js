let detector;
let detectorConfig;
let poses;
let video;
let skeleton = true;
let model;
let reps = 0;
let stage = null;
let highlightBack = false;


async function loadModel() {
  model = undefined;
  model = await tf.loadLayersModel("modelclassification/model.json");
  console.log("model classification loaded");

}
loadModel();


async function init() {
  detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER };
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
  edges = {
    '5,7': 'm',
    '7,9': 'm',
    '6,8': 'c',
    '8,10': 'c',
    '5,6': 'y',
    '5,11': 'm',
    '6,12': 'c',
    '11,12': 'y',
    '11,13': 'm',
    '13,15': 'm',
    '12,14': 'c',
    '14,16': 'c'
  };
  await getPoses();
}

async function videoReady() {
  console.log('video ready');
}

async function setup() {
 
  createCanvas(640, 480);
  video = createCapture(VIDEO, videoReady);
  video.size(640, 480);
  video.hide()
  await init();
}

async function getPoses() {
  poses = await detector.estimatePoses(video.elt);
  setTimeout(getPoses, 0);
  //console.log(poses);

}



function draw() {
  background(220);
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, video.width, video.height);

  // Draw keypoints and skeleton
  drawKeypoints();
  if (skeleton) {
    drawSkeleton();
  }

  // Write text
  fill(255);
  strokeWeight(2);
  stroke(51);
  translate(width, 0);
  scale(-1, 1);
  textSize(40);


  if (poses && poses.length > 0) {
    //console.log(poses[0].keypoints);
    var A = {x:poses[0].keypoints[10].x, y:poses[0].keypoints[10].y};
    var B = {x:poses[0].keypoints[8].x, y:poses[0].keypoints[8].y};
    var C = {x:poses[0].keypoints[6].x, y:poses[0].keypoints[6].y};

    var AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
    var BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
    var AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
    
    let result = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB)) * 180 / Math.PI;
    //console.log(poses);

    if (result > 160 && poses[0].keypoints[6].score > 0.5 && poses[0].keypoints[8].score > 0.5 && poses[0].keypoints[10].score > 0.5) {
      stage = "down";
    }

    if (stage == "down" && result < 30 && poses[0].keypoints[6].score > 0.5 && poses[0].keypoints[8].score > 0.5 && poses[0].keypoints[10].score > 0.5) {
      reps= reps+1;
      stage = "up";
    }
  

    let pushupString = `Repetition: ${reps}`;
    text(pushupString, 100, 90);
  }
  else {
    text('Loading movenet model \nplease wait ...', 50, 90);
  }
}

function drawKeypoints() {
  var count = 0;
  if (poses && poses.length > 0) {
    for (let kp of poses[0].keypoints) {
      const { x, y, score } = kp;
      if (score > 0.3) {
        count = count + 1;
        fill(100, 255, 50);
        stroke(0);
        strokeWeight(4);
        circle(x, y, 4);
      }
    }
  }
}

// Draws lines between the keypoints

function drawSkeleton() {

  confidence_threshold = 0.5;

  if (poses && poses.length > 0) {
    for (const [key, value] of Object.entries(edges)) {
      const p = key.split(",");
      const p1 = p[0];
      const p2 = p[1];

      const y1 = poses[0].keypoints[p1].y;
      const x1 = poses[0].keypoints[p1].x;
      const c1 = poses[0].keypoints[p1].score;
      const y2 = poses[0].keypoints[p2].y;
      const x2 = poses[0].keypoints[p2].x;
      const c2 = poses[0].keypoints[p2].score;

      if ((c1 > confidence_threshold) && (c2 > confidence_threshold)) {
        if ((highlightBack == true) && ((p[1] == 11) || ((p[0] == 6) && (p[1] == 12)) || (p[1] == 13) || (p[0] == 12))) {
          strokeWeight(3);
          stroke(255, 0, 0);
          line(x1, y1, x2, y2);
        }
        else {
          strokeWeight(2);
          stroke('rgb(0, 255, 0)');
          line(x1, y1, x2, y2);
        }
      }
    }
  }
}
