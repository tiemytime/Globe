import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import getStarfield from "./src/getStarfield.js";

/**
 * Configuration object for easy customization
 */
const CONFIG = {
  CAMERA: {
    fov: 45,
    near: 0.1,
    far: 1000,
    position: [0, 0, 3.5]
  },
  GLOBE: {
    radius: 1,
    detail: 80, // Reduced for better performance
    wireframeDetail: 8,
    rotationSpeed: 0.002
  },
  RENDERER: {
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  },
  LIGHTING: {
    ambientIntensity: 0.4,
    hemisphereIntensity: 2.5
  },
  STARS: {
    count: 10000, // Significantly increased for realistic galaxy density
    size: 0.15
  }
};

/**
 * Globe3D - Clean and optimized 3D globe implementation
 */
class Globe3D {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.globeGroup = null;
    this.animationId = null;
    
    this.init();
  }

  /**
   * Initialize the 3D scene
   */
  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createControls();
    this.loadTextures();
    this.createGlobe();
    this.createLighting();
    this.createStarfield();
    this.setupEventListeners();
    this.animate();
  }

  /**
   * Create Three.js scene
   */
  createScene() {
    this.scene = new THREE.Scene();
  }

  /**
   * Create and configure camera
   */
  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.CAMERA.fov,
      window.innerWidth / window.innerHeight,
      CONFIG.CAMERA.near,
      CONFIG.CAMERA.far
    );
    this.camera.position.set(...CONFIG.CAMERA.position);
  }

  /**
   * Create optimized renderer
   */
  createRenderer() {
    this.renderer = new THREE.WebGLRenderer(CONFIG.RENDERER);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio
    document.body.appendChild(this.renderer.domElement);
  }

  /**
   * Create orbit controls
   */
  createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 10;
    this.controls.minDistance = 2;
  }

  /**
   * Load textures efficiently
   */
  loadTextures() {
    const textureLoader = new THREE.TextureLoader();
    
    // Load only essential textures for better performance
    this.textures = {
      starSprite: textureLoader.load("./src/circle.png"),
      earthColor: textureLoader.load("./src/00_earthmap1k.jpg"), // Realistic Earth texture
      earthAlpha: textureLoader.load("./src/02_earthspec1k.jpg")
    };

    // Optimize texture settings
    Object.values(this.textures).forEach(texture => {
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    });
  }

  /**
   * Create globe without bumps for smooth performance
   */
  createGlobe() {
    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    this.createWireframe();
    this.createSmoothSurface();
  }

  /**
   * Create wireframe structure
   */
  createWireframe() {
    const geometry = new THREE.IcosahedronGeometry(CONFIG.GLOBE.radius, CONFIG.GLOBE.wireframeDetail);
    const material = new THREE.MeshBasicMaterial({
      color: 0x202020,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    
    const wireframe = new THREE.Mesh(geometry, material);
    this.globeGroup.add(wireframe);
  }

  /**
   * Create smooth surface without elevation mapping
   */
  createSmoothSurface() {
    const geometry = new THREE.IcosahedronGeometry(CONFIG.GLOBE.radius, CONFIG.GLOBE.detail);
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        size: { value: 4.0 },
        colorTexture: { value: this.textures.earthColor },
        alphaTexture: { value: this.textures.earthAlpha }
      },
      vertexShader: this.getOptimizedVertexShader(),
      fragmentShader: this.getOptimizedFragmentShader(),
      transparent: true
    });

    const points = new THREE.Points(geometry, material);
    this.globeGroup.add(points);
  }

  /**
   * Optimized vertex shader without elevation mapping
   */
  getOptimizedVertexShader() {
    return `
      uniform float size;
      varying vec2 vUv;
      varying float vVisible;

      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vec3 vNormal = normalMatrix * normal;
        
        // Simple visibility calculation for back-face culling
        vVisible = step(0.0, dot(-normalize(mvPosition.xyz), normalize(vNormal)));
        
        gl_PointSize = size;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
  }

  /**
   * Optimized fragment shader
   */
  getOptimizedFragmentShader() {
    return `
      uniform sampler2D colorTexture;
      uniform sampler2D alphaTexture;
      varying vec2 vUv;
      varying float vVisible;

      void main() {
        // Discard back-facing points
        if (vVisible < 0.5) discard;
        
        float alpha = 1.0 - texture2D(alphaTexture, vUv).r;
        vec3 color = texture2D(colorTexture, vUv).rgb;
        
        gl_FragColor = vec4(color, alpha);
      }
    `;
  }

  /**
   * Create efficient lighting setup
   */
  createLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, CONFIG.LIGHTING.ambientIntensity);
    this.scene.add(ambientLight);

    // Hemisphere light for realistic lighting
    const hemisphereLight = new THREE.HemisphereLight(
      0xffffff, 
      0x080820, 
      CONFIG.LIGHTING.hemisphereIntensity
    );
    this.scene.add(hemisphereLight);
  }

  /**
   * Create optimized starfield
   */
  createStarfield() {
    const stars = getStarfield({
      numStars: CONFIG.STARS.count,
      sprite: this.textures.starSprite
    });
    this.scene.add(stars);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    
    // Add visibility change listener to pause/resume animation
    document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Handle visibility change for performance
   */
  onVisibilityChange() {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  }

  /**
   * Pause animation
   */
  pause() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Resume animation
   */
  resume() {
    if (!this.animationId) {
      this.animate();
    }
  }

  /**
   * Main animation loop
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Smooth globe rotation
    if (this.globeGroup) {
      this.globeGroup.rotation.y += CONFIG.GLOBE.rotationSpeed;
    }
    
    // Update controls
    this.controls.update();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Cleanup method for proper disposal
   */
  dispose() {
    this.pause();
    
    // Dispose geometries and materials
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    // Dispose textures
    Object.values(this.textures).forEach(texture => texture.dispose());
    
    // Dispose renderer
    this.renderer.dispose();
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    document.removeEventListener('visibilitychange', this.onVisibilityChange.bind(this));
  }
}

// Initialize the globe
const globe = new Globe3D();

// Export for external use
window.Globe3D = Globe3D;