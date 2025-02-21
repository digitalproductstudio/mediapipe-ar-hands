// import css
import "./main.css";

import {
  FilesetResolver,
  GestureRecognizer,
  GestureRecognizerResult,
} from "@mediapipe/tasks-vision";
import { hasGetUserMedia } from "./lib/utils";
import { displayGestureResults, displayLandmarks } from "./lib/display";
import { Scene } from "./AR/Scene";
import { Model } from "./AR/Model";
import * as THREE from "three";

declare type RunningMode = "IMAGE" | "VIDEO";
let runningMode: RunningMode = "VIDEO";
let gestureRecognizer: GestureRecognizer | undefined;
let webcamRunning: boolean = false;
let lastVideoTime = -1;
let results: GestureRecognizerResult | undefined = undefined;

let SCENE: Scene;

const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById(
  "output_canvas"
) as HTMLCanvasElement;
const canvasCtx = canvasElement.getContext("2d") as CanvasRenderingContext2D;
const gestureOutput = document.getElementById(
  "gesture_output"
) as HTMLDivElement;
const enableWebcamButton = document.getElementById(
  "webcamButton"
) as HTMLButtonElement;
const ARLayers = document.querySelector("#ar-layers") as HTMLElement;

// go yeah
init();

async function init() {
  try {
    await hasGetUserMedia();
    await createGestureRecognizer();
    await enableCam();

    SCENE = new Scene(video.videoWidth, video.videoHeight, ARLayers);

    let beerModel = new Model(
      "beer_bottle/scene.gltf",
      new THREE.Vector3(0.02, 0.02, 0.02), // Scale
      new THREE.Vector3(0, 0, 0), // Position
      new THREE.Vector3(0, Math.PI / 2, 0), // Rotation
      "Left"
    );
    let chicken = new Model(
      "birbs/scene.gltf",
      new THREE.Vector3(0.005, 0.005, 0.005), // Scale
      new THREE.Vector3(0, 0, 0), // Position
      new THREE.Vector3(0, Math.PI / 2, 0), // Rotation
      "Right"
    );

    SCENE.add3DModel(beerModel);
    SCENE.add3DModel(chicken);

    predictWebcam();
  } catch (e) {
    console.error(e);
  }
}

async function createGestureRecognizer() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU",
    },
    runningMode: runningMode,
    numHands: 2,
  });
}

async function enableCam() {
  webcamRunning = !webcamRunning;
  enableWebcamButton.innerText = webcamRunning
    ? "DISABLE PREDICTIONS"
    : "ENABLE PREDICTIONS";

  if (webcamRunning) {
    const constraints = {
      video: true,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 60 },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (video) {
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          video.addEventListener("loadeddata", () => {
            // Set canvas dimensions to match video resolution
            canvasElement.width = video.videoWidth;
            canvasElement.height = video.videoHeight;
            resolve();
          });
        });
      }
    } catch (error) {
      console.error("Error accessing webcam: ", error);
    }
  } else {
    video.srcObject = null;
  }
}

async function predictWebcam() {
  if (!video) return;

  const nowInMs = Date.now();
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    results = gestureRecognizer?.recognizeForVideo(video, nowInMs);
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Ensure the canvas and video elements maintain the same aspect ratio
  canvasElement.style.height = `${video.videoHeight}px`;
  video.style.height = `${video.videoHeight}px`;
  canvasElement.style.width = `${video.videoWidth}px`;
  video.style.width = `${video.videoWidth}px`;

  if (results) {
    displayLandmarks(canvasCtx, results);
    displayGestureResults(gestureOutput, results);

    results?.landmarks.forEach((landmarks, index) => {
      const hand = results.handedness[index][0]?.displayName;
      const model = SCENE.models.find((model) => model.getHand() === hand);

      if (model) {
        model.showModel();
        map3DModel(landmarks, model);
      }
    });

    SCENE.models.forEach((model) => {
      const handIndex = results?.handedness.findIndex(
        (handedness) => handedness[0].displayName === model.getHand()
      );
      if (handIndex === -1) {
        model.hideModel();
      }
    });
  }

  canvasCtx.restore();

  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
    // AR.render3DModel();
    SCENE.render();
  }
}

async function map3DModel(landmarks, model) {
  const palmBase = landmarks[0]; // MCP of the wrist

  // Scale hand position to Three.js coordinates
  let mX = (palmBase.x - 0.5) * 2;
  let mY = -(palmBase.y - 0.5) * 2;
  let mZ = -palmBase.z * 2; // Adjust depth

  // // original position
  // const modelOriPos = model.getModel()?.position;
  // if (modelOriPos) {
  //   mX += modelOriPos.x;
  //   mY += modelOriPos.y;
  //   mZ += modelOriPos.z;
  // }

  model.setPosition(mX, mY, mZ);

  const indexFinger = landmarks[8]; // MCP of the index finger
  const thumb = landmarks[4]; // MCP of the thumb

  // Calculate the midpoint between the index finger and thumb
  const midX = (indexFinger.x + thumb.x) / 2;
  const midY = (indexFinger.y + thumb.y) / 2;

  // Calculate the rotation angle correctly
  const dx = midX - palmBase.x;
  const dy = midY - palmBase.y;

  // Possible mirroring needed, depending on the coordinate system
  const angle = -Math.atan2(dy, dx) - Math.PI / 2;

  model.setRotation(0, 0, angle);

  // Schaal op basis van de grootte van de totale hand
  const scale = Math.sqrt(dx * dx + dy * dy) * 0.1;
  model.setScale(scale, scale, scale);

  // AR.setModelGroupScale(scale, scale, scale);
}
