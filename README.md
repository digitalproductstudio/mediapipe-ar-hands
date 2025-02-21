# AR on Hands Project

This project demonstrates the use of augmented reality (AR) on hand tracking using MediaPipe and Three.js. The project uses the MediaPipe Hands model to detect hand landmarks and then renders a 3D model on top of the hand using Three.js. The 3D model is adjusted based on the detected hand movements, allowing for interactive AR experiences.

## Features

- Hand tracking using MediaPipe's Gesture Recognizer.
- Rendering of 3D models on detected hand landmarks using Three.js.
- Real-time webcam input for hand gesture recognition.
- Dynamic adjustment of 3D model position and rotation based on hand movements.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/digitalproductstudio/mediapipe-ar-hands
    ```
2. Navigate to the project directory:
    ```sh
    cd ar-on-hands
    ```
3. Install the dependencies:
    ```sh
    npm install
    ```

## Usage

1. Start the development server:
    ```sh
    npm start
    ```
2. Open your browser and navigate to `http://localhost:5173`.

## How It Works

1. **Hand Tracking**: The project uses MediaPipe's Gesture Recognizer to detect hand landmarks from the webcam feed.
2. **3D Rendering**: Three.js is used to render a 3D model on top of the detected hand landmarks.
3. **Real-time Updates**: The position and rotation of the 3D model are dynamically updated based on the hand's movements.

## Code Overview

- `main.ts`: The main TypeScript file that initializes the hand tracking and 3D rendering.
- `utils.ts`: Utility functions used in the project.
- `main.css`: Styling for the project.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.