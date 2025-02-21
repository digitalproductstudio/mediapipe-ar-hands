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

let SCENE : Scene;

const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById("output_canvas") as HTMLCanvasElement;
const canvasCtx = canvasElement.getContext("2d") as CanvasRenderingContext2D;
const gestureOutput = document.getElementById("gesture_output") as HTMLDivElement;
const enableWebcamButton = document.getElementById("webcamButton") as HTMLButtonElement;
const ARLayers = document.querySelector("#ar-layers") as HTMLElement;

// go yeah
init();

async function init () {
  try {
    await hasGetUserMedia();
    await createGestureRecognizer();
    await enableCam();

    SCENE = new Scene(video.videoWidth, video.videoHeight, ARLayers);
    let beerModel = new Model("beer_bottle/scene.gltf",
      new THREE.Vector3(0.02, 0.02, 0.02),  // Scale
      new THREE.Vector3(0, 0, 0),         // Position
      new THREE.Vector3(0, Math.PI / 2, 0) // Rotation
    );
    SCENE.add3DModel(beerModel);
    console.log(beerModel);
    

    predictWebcam()
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
};

async function enableCam() {
  webcamRunning = !webcamRunning;
  enableWebcamButton.innerText = webcamRunning ? "DISABLE PREDICTIONS" : "ENABLE PREDICTIONS";

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
    
    if (results.landmarks.length > 0) {
      const landmarks = results.landmarks[0]; // Eerste gedetecteerde hand
      const palmBase = landmarks[0]; // MCP van de pols

      // Schaal handpositie naar Three.js coördinaten
      const mX = (palmBase.x - 0.5) * 2;
      const mY = -(palmBase.y - 0.5) * 2;
      const mZ = -palmBase.z * 2; // Diepte aanpassen

      // AR.setModelGroupPosition(mX, mY, mZ);
      SCENE.models[0].setPosition(mX, mY, mZ);

      const indexFinger = landmarks[8]; // MCP van de wijsvinger
      const thumb = landmarks[4]; // MCP van de duim

      // x and y between the index finger and thumb
      const x = (indexFinger.x + thumb.x) / 2;
      const y = (indexFinger.y + thumb.y) / 2;

      // Bereken de rotatiehoek correct
      const dx = x - palmBase.x;
      const dy = y - palmBase.y;

      // Mogelijk spiegeling nodig, afhankelijk van coördinaatsysteem
      const angle = - Math.atan2(dy, dx) - Math.PI / 2;

      // AR.setModelGroupRotation(0, 0, angle);
      SCENE.models[0].setRotation(0, 0, angle);

      // Schaal op basis van de grootte van de totale hand
      // const scale = Math.sqrt(dx * dx + dy * dy) * 4;
      // AR.setModelGroupScale(scale, scale, scale);
    }
  }
  
  canvasCtx.restore();    

  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
    // AR.render3DModel();
    SCENE.render();
  }
}
