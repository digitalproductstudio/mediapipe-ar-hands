import {
    GestureRecognizer,
    DrawingUtils,
    GestureRecognizerResult,
  } from "@mediapipe/tasks-vision";

export const displayLandmarks = (canvasCtx, results: GestureRecognizerResult) => {
  let drawingUtils = new DrawingUtils(canvasCtx);
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
};

export const displayGestureResults = (outputDOM : HTMLDivElement, results: GestureRecognizerResult) => {
  const gestureOutput = outputDOM;
  if (results?.gestures && results.gestures.length > 0) {
    gestureOutput.style.display = "block";
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