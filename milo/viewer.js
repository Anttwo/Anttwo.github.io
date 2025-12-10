// MILo WebGL Viewer - Modular 3D Viewer
// This module can be imported and initialized with different scene parameters

import * as THREE from "three";
import { SplatMesh } from "@sparkjsdev/spark";
import { PLYLoader } from "https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/loaders/PLYLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/controls/OrbitControls.js";

export class MiloViewer {
    constructor(containerId, sceneConfig) {
        this.containerId = containerId;
        this.sceneConfig = sceneConfig;
        
        // Global variables
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentMesh = null;
        this.currentSplat = null;
        this.isShowingMesh = false;
        this.meshLoaded = false;
        this.splatLoaded = false;
        
        // URLs
        this.corsProxy = "https://corsproxy.io/?";
        // this.plyMeshUrl = this.corsProxy + `https://imagine.enpc.fr/~antoine.guedon/milo/${sceneConfig.name}/mesh.ply`;
        // this.splatUrl = this.corsProxy + `https://imagine.enpc.fr/~antoine.guedon/milo/${sceneConfig.name}/gs.ply`;
        this.plyMeshUrl = this.corsProxy + `https://antoineguedon.fr/milo_gallery/${sceneConfig.name}/mesh.ply`;
        this.splatUrl = this.corsProxy + `https://antoineguedon.fr/milo_gallery/${sceneConfig.name}/gs.ply`;
        
        // Transformation parameters
        this.transforms = {
            rotation_x_shift: sceneConfig.rotation_x_shift || 0.0,
            rotation_y_shift: sceneConfig.rotation_y_shift || 0.0,
            rotation_z_shift: sceneConfig.rotation_z_shift || 0.0,
            position_x_shift: sceneConfig.position_x_shift || 0.0,
            position_y_shift: sceneConfig.position_y_shift || 0.0,
            position_z_shift: sceneConfig.position_z_shift || 0.0,
            scale_factor: sceneConfig.scale_factor || 1.0,
            camera_position_z: sceneConfig.camera_position_z || 10.0
        };
    }
    
    // Initialize the viewer
    init() {
        this.initScene();
        this.setupEventListeners();
        this.loadGaussianSplat(); // Start with 3DGS
        this.animate();
        
        console.log(`MILo Viewer initialized for scene: ${this.sceneConfig.name}`);
    }
    
    // Scene setup
    initScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x1a1a1a);
        
        document.getElementById(this.containerId).appendChild(this.renderer.domElement);
        
        // Initialize OrbitControls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;
        
        // Camera position
        this.camera.position.set(0, 0, this.transforms.camera_position_z);
        this.camera.lookAt(0, 0, 0);
    }
    
    // Progress bar helper functions
    showProgress(message, percentage = 0) {
        const loadingElement = document.getElementById('loading');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        loadingElement.style.display = 'block';
        loadingElement.querySelector('div').textContent = message;
        progressBar.style.width = percentage + '%';
        progressText.textContent = Math.round(percentage) + '%';
    }
    
    updateProgress(percentage) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        progressBar.style.width = percentage + '%';
        progressText.textContent = Math.round(percentage) + '%';
    }
    
    hideProgress() {
        document.getElementById('loading').style.display = 'none';
    }
    
    // Helper functions to show/hide cached objects
    showMesh() {
        // Always ensure splat is removed first
        if (this.currentSplat) {
            this.scene.remove(this.currentSplat);
        }
        // Then add mesh if it exists
        if (this.currentMesh) {
            this.scene.add(this.currentMesh);
        }
        this.isShowingMesh = true;
        console.log('Showing mesh, hiding splat');
    }
    
    showSplat() {
        // Always ensure mesh is removed first
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
        }
        // Then add splat if it exists
        if (this.currentSplat) {
            this.scene.add(this.currentSplat);
        }
        this.isShowingMesh = false;
        console.log('Showing splat, hiding mesh');
    }
    
    // Force cleanup - removes both objects from scene
    clearScene() {
        if (this.currentMesh) {
            this.scene.remove(this.currentMesh);
        }
        if (this.currentSplat) {
            this.scene.remove(this.currentSplat);
        }
    }
    
    // PLY mesh loading function
    loadPLYMesh() {
        if (this.meshLoaded) {
            // Mesh already loaded, just show it
            this.showMesh();
            return;
        }
        
        this.showProgress('Generating mesh...', 0);
        
        const loader = new PLYLoader();
        loader.load(
            this.plyMeshUrl,
            (geometry) => {
                // Processing geometry
                this.updateProgress(90);
                
                if (!geometry.attributes.normal) {
                    geometry.computeVertexNormals();
                }
                
                let material;
                if (geometry.attributes.color) {
                    material = new THREE.MeshBasicMaterial({ 
                        vertexColors: true,
                        side: THREE.DoubleSide
                    });
                } else {
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xffffff,
                        side: THREE.DoubleSide
                    });
                }
                
                this.currentMesh = new THREE.Mesh(geometry, material);
                this.currentMesh.rotation.x = this.currentMesh.rotation.x + this.transforms.rotation_x_shift;
                this.currentMesh.rotation.y = this.currentMesh.rotation.y + this.transforms.rotation_y_shift;
                this.currentMesh.rotation.z = this.currentMesh.rotation.z + this.transforms.rotation_z_shift;
                this.currentMesh.position.x = this.currentMesh.position.x + this.transforms.position_x_shift;
                this.currentMesh.position.y = this.currentMesh.position.y + this.transforms.position_y_shift;
                this.currentMesh.position.z = this.currentMesh.position.z + this.transforms.position_z_shift;
                this.currentMesh.scale.multiplyScalar(this.transforms.scale_factor);
                
                this.updateProgress(100);
                
                setTimeout(() => {
                    this.meshLoaded = true;
                    this.clearScene(); // Ensure clean state
                    this.showMesh();
                    this.hideProgress();
                    console.log('Mesh loaded and cached successfully');
                }, 200); // Small delay to show 100% completion
            },
            (progress) => {
                if (progress.lengthComputable) {
                    const percentComplete = (progress.loaded / progress.total) * 85; // Reserve 15% for processing
                    this.updateProgress(percentComplete);
                }
            },
            (error) => {
                console.error('Error generating mesh:', error);
                this.showProgress('Error generating mesh. Check console for details.', 0);
                setTimeout(() => this.hideProgress(), 3000);
            }
        );
    }
    
    // Gaussian Splatting loading function
    loadGaussianSplat() {
        if (this.splatLoaded) {
            // Splat already loaded, just show it
            this.showSplat();
            return;
        }
        
        this.showProgress('Loading Gaussians...', 0);
        
        try {
            // Simulate progress for Gaussian Splat loading (since SplatMesh doesn't provide progress callback)
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 10 + 5; // More consistent progress increments
                if (progress > 80) progress = 80;
                this.updateProgress(progress);
            }, 150);
            
            this.currentSplat = new SplatMesh({ url: this.splatUrl });
            
            // Set a timeout to complete loading after a reasonable time
            setTimeout(() => {
                clearInterval(progressInterval);
                this.updateProgress(90);
                
                // Apply transformations
                this.currentSplat.rotation.x = this.currentSplat.rotation.x + this.transforms.rotation_x_shift;
                this.currentSplat.rotation.y = this.currentSplat.rotation.y + this.transforms.rotation_y_shift;
                this.currentSplat.rotation.z = this.currentSplat.rotation.z + this.transforms.rotation_z_shift;
                this.currentSplat.position.x = this.currentSplat.position.x + this.transforms.position_x_shift;
                this.currentSplat.position.y = this.currentSplat.position.y + this.transforms.position_y_shift;
                this.currentSplat.position.z = this.currentSplat.position.z + this.transforms.position_z_shift;
                this.currentSplat.scale.multiplyScalar(this.transforms.scale_factor);
                
                this.updateProgress(100);
                
                setTimeout(() => {
                    this.splatLoaded = true;
                    this.clearScene(); // Ensure clean state
                    this.showSplat();
                    this.hideProgress();
                    console.log('Gaussian Splat loaded and cached successfully');
                }, 200);
            }, 3000); // Give 3 seconds for the splat to load
            
        } catch (error) {
            console.error('Error loading Gaussian Splat:', error);
            this.showProgress('Error loading Gaussian Splat. Check console for details.', 0);
            setTimeout(() => this.hideProgress(), 3000);
        }
    }
    
    // Toggle between mesh and splat
    toggleViewer() {
        const button = document.getElementById('toggle-button');
        const title = document.getElementById('viewer-title');
        
        // Clear scene first to prevent overlaps
        // this.clearScene();
        
        if (this.isShowingMesh) {
            this.loadGaussianSplat();
            button.textContent = 'Switch to Mesh';
            title.textContent = 'MILo WebGL Viewer - 3DGS';
            // isShowingMesh will be set to false in showSplat()
        } else {
            this.loadPLYMesh();
            button.textContent = 'Switch to Gaussians';
            title.textContent = 'MILo WebGL Viewer - Mesh';
            // isShowingMesh will be set to true in showMesh()
        }
    }
    
    // Animation loop
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    // Handle window resize
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Setup event listeners
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Make toggle function available globally
        window.toggleViewer = () => this.toggleViewer();
    }
}

// Scene configurations
export const SCENE_CONFIGS = {
    shinegrey0: {
        name: "shinegrey0",
        rotation_x_shift: Math.PI * 0.9,
        rotation_y_shift: 0.0,
        rotation_z_shift: 0.0,
        position_x_shift: 0.0,
        position_y_shift: 2.5,
        position_z_shift: 5.0,
        scale_factor: 2,
        camera_position_z: 10.0
    },
    risingfreedom1: {
        name: "risingfreedom1",
        rotation_x_shift: Math.PI * 1.0,
        rotation_y_shift: 0.0,
        rotation_z_shift: 0.0,
        position_x_shift: -0.5,
        position_y_shift: 2.5,
        position_z_shift: 5.0,
        scale_factor: 2,
        camera_position_z: 6.0
    },
    garden: {
        name: "garden",
        rotation_x_shift: Math.PI * 1.0,
        rotation_y_shift: 0.0,
        rotation_z_shift: 0.0,
        position_x_shift: -1.0,
        position_y_shift: 3.5,
        position_z_shift: 5.0,
        scale_factor: 2,
        camera_position_z: 10.0
    },
    bicycle: {
        name: "bicycle",
        rotation_x_shift: Math.PI * 1.1,
        rotation_y_shift: Math.PI * -0.5,
        rotation_z_shift: Math.PI * 0.,
        position_x_shift: 1.0,
        position_y_shift: 1.5,
        position_z_shift: 4.0,
        scale_factor: 2,
        camera_position_z: 8.0
    },
    stump: {
        name: "stump",
        rotation_x_shift: Math.PI * 0.85,
        rotation_y_shift: 0.0,
        rotation_z_shift: 0.0,
        position_x_shift: 0.0,
        position_y_shift: 4.0,
        position_z_shift: 3.0,
        scale_factor: 2,
        camera_position_z: 7.0
    },
    knight: {
        name: "knight",
        rotation_x_shift: Math.PI * 1.0,
        rotation_y_shift: 0.0,
        rotation_z_shift: 0.0,
        position_x_shift: -1.0,
        position_y_shift: 2.5,
        position_z_shift: 3.0,
        scale_factor: 2.0,
        camera_position_z: 5.0
    },
    buzz: {
        name: "buzz",
        rotation_x_shift: Math.PI * 1.1,
        rotation_y_shift: -Math.PI * 0.1,
        rotation_z_shift: Math.PI * 0.05,
        position_x_shift: -1.0,
        position_y_shift: 2.5,
        position_z_shift: 4.0,
        scale_factor: 2.0,
        camera_position_z: 5.0
    },
    ignatius: {
        name: "ignatius",
        rotation_x_shift: Math.PI * 1.05,
        rotation_y_shift: Math.PI * -0.1,
        rotation_z_shift: 0.0,
        position_x_shift: -1.0,
        position_y_shift: 0.5,
        position_z_shift: 3.0,
        scale_factor: 2,
        camera_position_z: 8.0
    },
    kitchen: {
        name: "kitchen",
        rotation_x_shift: Math.PI * 1.02,
        rotation_y_shift: 0.0,
        rotation_z_shift: 0.0,
        position_x_shift: 0.5,
        position_y_shift: 3.0,
        position_z_shift: 2.0,
        scale_factor: 2.,
        camera_position_z: 4.0
    }
    // Add more scenes here as needed
}; 