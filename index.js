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
    this.goldenCore = null;
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
    this.createGoldenCore();
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
   * Enhanced fragment shader with golden center glow and dark continents
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
        
        // Create golden glow from center
        vec2 center = vec2(0.5, 0.5);
        float distanceFromCenter = length(vUv - center);
        
        // Golden glow that spreads from center to edges
        float goldenGlow = 1.0 - smoothstep(0.0, 0.7, distanceFromCenter);
        goldenGlow = pow(goldenGlow, 2.0);
        
        // Golden yellow color
        vec3 goldenColor = vec3(1.0, 0.8, 0.3);
        
        // Make continents dark with white highlights
        // Use the green channel to detect land vs water
        float landMask = color.g;
        
        // Create dark continent base color
        vec3 darkContinentColor = vec3(0.15, 0.18, 0.22); // Dark blue-gray
        
        // Edge detection for continent borders
        vec2 texelSize = vec2(1.0) / vec2(1024.0); // Assuming 1k texture
        
        // Sample neighboring pixels for edge detection
        float landLeft = texture2D(colorTexture, vUv + vec2(-texelSize.x, 0.0)).g;
        float landRight = texture2D(colorTexture, vUv + vec2(texelSize.x, 0.0)).g;
        float landUp = texture2D(colorTexture, vUv + vec2(0.0, -texelSize.y)).g;
        float landDown = texture2D(colorTexture, vUv + vec2(0.0, texelSize.y)).g;
        
        // Calculate edge intensity
        float edgeIntensity = abs(landMask - landLeft) + abs(landMask - landRight) + 
                             abs(landMask - landUp) + abs(landMask - landDown);
        edgeIntensity = smoothstep(0.1, 0.3, edgeIntensity);
        
        // White border highlight
        vec3 borderHighlight = vec3(0.8, 0.85, 0.9) * edgeIntensity;
        
        // Mix dark continent color with border highlights
        vec3 continentColor = darkContinentColor + borderHighlight;
        
        // Use landMask to determine if we're on land or water
        color = mix(color * 0.3, continentColor, step(0.5, landMask)); // Darken oceans
        
        // Mix the golden glow with the modified earth texture
        color = mix(color, goldenColor, goldenGlow * 0.4);
        
        // Add additional inner glow for more intensity
        float innerGlow = 1.0 - smoothstep(0.0, 0.4, distanceFromCenter);
        innerGlow = pow(innerGlow, 3.0);
        color += goldenColor * innerGlow * 0.6;
        
        // Fade edges to blend with dark background
        float edgeFade = smoothstep(0.6, 1.0, distanceFromCenter);
        alpha *= (1.0 - edgeFade * 0.7);
        
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
   * Create golden core glow inside Earth
   */
  createGoldenCore() {
    // Create inner sphere for the golden core
    const coreGeometry = new THREE.SphereGeometry(CONFIG.GLOBE.radius * 0.85, 32, 32);
    
    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          // Distance from center
          float distanceFromCenter = length(vPosition);
          
          // Create radial golden glow
          float glow = 1.0 - smoothstep(0.0, 1.0, distanceFromCenter);
          glow = pow(glow, 1.5);
          
          // Pulsing effect
          float pulse = 0.8 + 0.2 * sin(time * 2.0);
          
          // Golden color with varying intensity
          vec3 goldenColor = vec3(1.0, 0.8, 0.2);
          
          // View angle for rim lighting
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float rim = 1.0 - max(0.0, dot(vNormal, viewDirection));
          rim = pow(rim, 2.0);
          
          float alpha = glow * pulse * 0.6 + rim * 0.3;
          
          gl_FragColor = vec4(goldenColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.globeGroup.add(core);
    
    // Store reference for animation
    this.goldenCore = core;
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
    
    // Update golden core animation
    if (this.goldenCore) {
      this.goldenCore.material.uniforms.time.value = Date.now() * 0.001;
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