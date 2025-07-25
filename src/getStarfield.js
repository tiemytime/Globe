import * as THREE from "three";

/**
 * Starfield configuration for realistic galaxy appearance
 */
const STARFIELD_CONFIG = {
  RADIUS_MIN: 25,
  RADIUS_MAX: 60,
  // Star type distributions (percentages) - Enhanced for realistic galaxy
  BLUE_WHITE_PERCENTAGE: 0.75,  // 75% blue-white stars (increased)
  RED_PERCENTAGE: 0.22,          // 22% red stars (slightly decreased)
  YELLOW_PERCENTAGE: 0.03,       // 3% yellow stars (rare, like our sun)
  
  // Color definitions for realistic star types
  STAR_COLORS: {
    BLUE_WHITE: { hue: 0.6, saturation: 0.3, lightness: [0.7, 0.95] },
    RED: { hue: 0.0, saturation: 0.8, lightness: [0.4, 0.7] },
    YELLOW: { hue: 0.15, saturation: 0.7, lightness: [0.6, 0.8] }
  },
  
  // Size configuration
  SIZE_BASE: 0.12,
  SIZE_VARIATION: 0.08,
  SIZE_MIN: 0.08,
  SIZE_MAX: 0.2,
  
  // Clustering for realistic galaxy-like distribution
  CLUSTER_PROBABILITY: 0.4,     // Increased clustering for more realistic patterns
  CLUSTER_RADIUS: 8,
  CLUSTER_STARS: 5
};

/**
 * Generate random point on sphere surface with optional clustering
 * @param {number} minRadius - Minimum distance from center
 * @param {number} maxRadius - Maximum distance from center
 * @param {THREE.Vector3} clusterCenter - Optional cluster center for galaxy-like distribution
 * @param {number} clusterRadius - Radius of clustering effect
 * @returns {THREE.Vector3} Position vector
 */
function generateSpherePoint(
  minRadius = STARFIELD_CONFIG.RADIUS_MIN, 
  maxRadius = STARFIELD_CONFIG.RADIUS_MAX,
  clusterCenter = null,
  clusterRadius = STARFIELD_CONFIG.CLUSTER_RADIUS
) {
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  
  let u, v;
  
  if (clusterCenter && Math.random() < 0.7) {
    // Create clustered distribution for galaxy-like appearance
    const clusterInfluence = Math.random() * 0.5; // How much clustering affects position
    u = Math.random();
    v = Math.random();
    
    // Bias towards cluster center
    const clusterU = (clusterCenter.x + 1) / 2; // Normalize to 0-1
    const clusterV = (clusterCenter.y + 1) / 2;
    
    u = u * (1 - clusterInfluence) + clusterU * clusterInfluence;
    v = v * (1 - clusterInfluence) + clusterV * clusterInfluence;
  } else {
    u = Math.random();
    v = Math.random();
  }
  
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
}

/**
 * Generate realistic star color based on stellar classification
 * @param {string} starType - Type of star ('blue_white', 'red', 'yellow')
 * @returns {THREE.Color} Star color
 */
function generateStarColor(starType) {
  const colorDef = STARFIELD_CONFIG.STAR_COLORS[starType.toUpperCase()];
  if (!colorDef) return new THREE.Color(1, 1, 1);
  
  const lightness = colorDef.lightness[0] + 
    Math.random() * (colorDef.lightness[1] - colorDef.lightness[0]);
  
  // Add subtle variation
  const hueVariation = (Math.random() - 0.5) * 0.05;
  const satVariation = (Math.random() - 0.5) * 0.1;
  
  return new THREE.Color().setHSL(
    colorDef.hue + hueVariation,
    Math.max(0, Math.min(1, colorDef.saturation + satVariation)),
    lightness
  );
}

/**
 * Determine star type based on realistic distribution
 * @returns {string} Star type
 */
function getStarType() {
  const rand = Math.random();
  
  if (rand < STARFIELD_CONFIG.BLUE_WHITE_PERCENTAGE) {
    return 'blue_white';
  } else if (rand < STARFIELD_CONFIG.BLUE_WHITE_PERCENTAGE + STARFIELD_CONFIG.RED_PERCENTAGE) {
    return 'red';
  } else {
    return 'yellow';
  }
}

/**
 * Create optimized starfield with realistic galaxy appearance
 * @param {Object} options - Configuration options
 * @param {number} options.numStars - Number of stars to generate
 * @param {THREE.Texture} options.sprite - Star sprite texture
 * @returns {THREE.Points} Optimized starfield points
 */
export default function getStarfield({ numStars = 15000, sprite } = {}) {
  const positions = [];
  const colors = [];
  const sizes = [];

  // Create cluster centers for realistic galaxy distribution
  const clusterCenters = [];
  const numClusters = 6; // Increased clusters for better distribution with more stars
  for (let i = 0; i < numClusters; i++) {
    clusterCenters.push(new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize());
  }

  // Generate stars with realistic distribution
  for (let i = 0; i < numStars; i++) {
    // Determine if this star should be part of a cluster
    const useCluster = Math.random() < STARFIELD_CONFIG.CLUSTER_PROBABILITY;
    const clusterCenter = useCluster ? 
      clusterCenters[Math.floor(Math.random() * clusterCenters.length)] : null;
    
    const position = generateSpherePoint(
      STARFIELD_CONFIG.RADIUS_MIN, 
      STARFIELD_CONFIG.RADIUS_MAX,
      clusterCenter
    );
    
    // Generate realistic star type and color
    const starType = getStarType();
    const color = generateStarColor(starType);
    
    // Generate realistic star size (smaller stars are more common)
    let size = STARFIELD_CONFIG.SIZE_BASE;
    
    // Blue-white stars tend to be larger and brighter
    if (starType === 'blue_white') {
      size = STARFIELD_CONFIG.SIZE_BASE + Math.random() * STARFIELD_CONFIG.SIZE_VARIATION;
    } 
    // Red stars are typically smaller
    else if (starType === 'red') {
      size = STARFIELD_CONFIG.SIZE_MIN + Math.random() * (STARFIELD_CONFIG.SIZE_BASE - STARFIELD_CONFIG.SIZE_MIN);
    }
    // Yellow stars are medium-sized
    else {
      size = STARFIELD_CONFIG.SIZE_BASE * 0.8 + Math.random() * STARFIELD_CONFIG.SIZE_VARIATION * 0.6;
    }
    
    // Ensure size constraints
    size = Math.max(STARFIELD_CONFIG.SIZE_MIN, Math.min(STARFIELD_CONFIG.SIZE_MAX, size));

    // Add to arrays
    positions.push(position.x, position.y, position.z);
    colors.push(color.r, color.g, color.b);
    sizes.push(size);
  }

  // Create optimized geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

  // Create optimized material
  const material = new THREE.PointsMaterial({
    size: STARFIELD_CONFIG.SIZE_BASE,
    vertexColors: true,
    map: sprite,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    alphaTest: 0.01, // Optimize rendering
    blending: THREE.AdditiveBlending // Make stars glow more realistically
  });

  return new THREE.Points(geometry, material);
}
