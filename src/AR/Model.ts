import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class Model {
    private loader: GLTFLoader;
    private model: THREE.Object3D | null = null;

    constructor(
        private modelPath: string,
        private scale: THREE.Vector3,
        private position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
        private rotation: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
        private hand : string = "Right"
    ) {
        this.loader = new GLTFLoader();
    }

    public loadModel(callback: (model: THREE.Object3D) => void) {
        this.loader.load(this.modelPath, (gltf) => {
            this.model = gltf.scene as THREE.Object3D;
            this.model.scale.copy(this.scale);
            this.model.position.copy(this.position);
            this.model.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
            callback(this.model);
        });
    }

    public setPosition(x: number, y: number, z: number) {
        if (this.model) this.model.position.set(x, y, z);
    }

    public setRotation(x: number, y: number, z: number) {
        if (this.model) this.model.rotation.set(x, y, z);
    }

    public setScale(x: number, y: number, z: number) {
        if (this.model) this.model.scale.set(x, y, z);
    }

    public getModel(): THREE.Object3D | null {
        return this.model;
    }

    public showModel() {
        if (this.model) this.model.visible = true;
    }

    public hideModel() {
        if (this.model) this.model.visible = false;
    }

    public getHand() {
        return this.hand;
    }
}