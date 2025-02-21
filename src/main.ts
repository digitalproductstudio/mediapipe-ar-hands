// import css
import "./main.css";

import {
  FilesetResolver,
  GestureRecognizer,
  DrawingUtils,
  GestureRecognizerResult,
} from "@mediapipe/tasks-vision";
import * as THREE from "three";
import { hasGetUserMedia } from "./utils";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

declare type RunningMode = "IMAGE" | "VIDEO";
let runningMode: RunningMode = "VIDEO";
let gestureRecognizer: GestureRecognizer | undefined;
let enableWebcamButton: HTMLButtonElement;
let webcamRunning: boolean = false;
let lastVideoTime = -1;
let results: GestureRecognizerResult | undefined = undefined;
let drawingUtils: DrawingUtils;

const demosSection = document.getElementById("demos");
const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById("output_canvas") as HTMLCanvasElement;
const canvasCtx = canvasElement.getContext("2d") as CanvasRenderingContext2D;
const gestureOutput = document.getElementById("gesture_output") as HTMLDivElement;

const videoHeight = "100%";
const videoWidth = "100%";

const createGestureRecognizer = async () => {
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
  demosSection?.classList.remove("invisible");
  enableCam();
};
createGestureRecognizer();


if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton") as HTMLButtonElement;
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

function enableCam() {
  webcamRunning = !webcamRunning;
  enableWebcamButton.innerText = webcamRunning ? "DISABLE PREDICTIONS" : "ENABLE PREDICTIONS";

  if (webcamRunning) {
    const constraints = {
      video: true,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 60 },
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      if (video) {
        video.srcObject = stream;
        video.addEventListener("loadeddata", () => {
          // Set canvas dimensions to match video resolution
          canvasElement.width = video.videoWidth;
          canvasElement.height = video.videoHeight
          // set w a h on window width;
          // canvasElement.width = window.innerWidth;
          // canvasElement.height = window.innerHeight;

          add3DModel();
          predictWebcam()
        });
      }
    });
  }
}

// // Scene setup
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// const renderer = new THREE.WebGLRenderer({ alpha: true });
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// // Lichtbron
// const light = new THREE.DirectionalLight(0xffffff, 1);
// light.position.set(0, 2, 5);
// scene.add(light);

// // 3D model laden
// const loader = new GLTFLoader();
// let handModel;

// loader.load("./beer_bottle/scene.gltf", (gltf) => {
//   handModel = gltf.scene;
//   handModel.scale.set(0.1, 0.1, 0.1);
//   scene.add(handModel);
// });

// // Camera positie instellen
// camera.position.z = 2;

let scene : THREE.Scene;
let camera : THREE.PerspectiveCamera;
let renderer : THREE.WebGLRenderer;
let loader : GLTFLoader;
let modelGroup : THREE.Group;
let handModel : THREE.Object3D;

function add3DModel() {

  scene = new THREE.Scene();

  const w = video.videoWidth;
  const h = video.videoHeight;
  // Scene setup
  camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ alpha: true });
  modelGroup = new THREE.Group();

  renderer.setSize(w, h);

  
  document.querySelector("#ar-layers")?.appendChild(renderer.domElement);
  // set id for the renderer
  renderer.domElement.id = "layer-3D";

  // Lichtbron
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 2, 5);
  scene.add(light);

  // 3D model laden
  scene.add(modelGroup);

  loader = new GLTFLoader();

  loader.load("./beer_bottle/scene.gltf", (gltf) => {
    handModel = gltf.scene;
    handModel.scale.set(0.02, 0.02, 0.02);
      // Verplaats het model binnen de groep (bijv. omhoog op de Y-as)
    //handModel.position.set(5, -2.5, 5); // Pas deze waarde aan!

    modelGroup.add(handModel); // Voeg het model toe aan de groep
  });

  // Camera positie instellen
  camera.position.z = 2;
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
  drawingUtils = new DrawingUtils(canvasCtx);
  // Ensure the canvas and video elements maintain the same aspect ratio
  canvasElement.style.height = `${video.videoHeight}px`;
  video.style.height = `${video.videoHeight}px`;
  canvasElement.style.width = `${video.videoWidth}px`;
  video.style.width = `${video.videoWidth}px`;

  if (results) {
    displayHandLandmarks(results);
    displayGestureResuls(results);

    
    if (results.landmarks.length > 0 && handModel) {
      const landmarks = results.landmarks[0]; // Eerste gedetecteerde hand
      const palmBase = landmarks[0]; // MCP van de pols

      // Schaal handpositie naar Three.js coördinaten
      modelGroup.position.x = (palmBase.x - 0.5) * 2;
      modelGroup.position.y = -(palmBase.y - 0.5) * 2;
      modelGroup.position.z = -palmBase.z * 2; // Diepte aanpassen

      const indexFinger = landmarks[8]; // MCP van de wijsvinger
      const thumb = landmarks[4]; // MCP van de duim

      // x and y between the index finger and thumb
      const x = (indexFinger.x + thumb.x) / 2;
      const y = (indexFinger.y + thumb.y) / 2;

      // Bereken de rotatiehoek correct
      const dx = x - palmBase.x;
      const dy = y - palmBase.y;

      // Mogelijk spiegeling nodig, afhankelijk van coördinaatsysteem
      const angle = Math.atan2(dy, dx);

      // Pas de rotatie toe in Three.js
      modelGroup.rotation.z = -angle - Math.PI / 2;

      // Schaal op basis van de grootte van de totale hand
      // const scale = Math.sqrt(dx * dx + dy * dy) * 4;
      // modelGroup.scale.set(scale, scale, scale);
    }
  }
  
  canvasCtx.restore();    

  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
  renderer.render(scene, camera);
}

const displayHandLandmarks = (results: GestureRecognizerResult) => {
  if (results?.landmarks) {
    results.landmarks.forEach((landmarks, index) => {
      drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
        color: index === 0 ? "#00FF00" : "#0000FF",
        lineWidth: 5,
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: index === 0 ? "#FF0000" : "#FFFF00",
        lineWidth: 2,
      });
    });
  }
}

const displayGestureResuls = (results: GestureRecognizerResult) => {
  if (results?.gestures && results.gestures.length > 0) {
    gestureOutput.style.display = "block";
      gestureOutput.style.width = videoWidth;
      let gestureText = "";
      results.gestures.forEach((gesture, i) => {
        const categoryName = gesture[0].categoryName;
        const categoryScore = (gesture[0].score * 100).toFixed(2);
        const handedness = results?.handedness[i][0].displayName;
        gestureText += `Hand ${i + 1} - GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}\n\n`;
      });
      gestureOutput.innerText = gestureText;
    } else {
      gestureOutput.style.display = "none";
    }
};