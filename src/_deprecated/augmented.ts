import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

class AugmentedReality {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private loader: GLTFLoader;
    private modelGroup: THREE.Group;
    private handModel: THREE.Object3D;

    constructor(width: number, height: number, wrapper: HTMLElement) {
        this.scene = new THREE.Scene();
        this.loader = new GLTFLoader();
        this.modelGroup = new THREE.Group();

        const w = width;
        const h = height;

        // Scene setup
        this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true });

        this.renderer.setSize(w, h);
        wrapper.appendChild(this.renderer.domElement);

        // Set id for the renderer
        this.renderer.domElement.id = "layer-3D";

        // Light source
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 2, 5); 
        this.scene.add(light);
    }

    public add3DModel(modelPath : string) {
        // Add 3D model to the scene
        this.scene.add(this.modelGroup);

        this.loader.load(modelPath, (gltf) => {
            this.handModel = gltf.scene;
            this.handModel.scale.set(0.02, 0.02, 0.02);
            this.modelGroup.add(this.handModel);
        });

        // Set camera position
        this.camera.position.z = 2;
    }

    public setModelGroupPosition(x: number, y: number, z: number) {
        this.modelGroup.position.set(x, y, z);
    }

    // set rotation of the model
    public setModelGroupRotation(x: number, y: number, z: number) {
        this.modelGroup.rotation.set(x, y, z);
    }

    // set scale of the model
    public setModelGroupScale(x: number, y: number, z: number) {
        this.modelGroup.scale.set(x, y, z);
    }

    public render3DModel() {
        this.renderer.render(this.scene, this.camera);
    }
}

export default AugmentedReality;