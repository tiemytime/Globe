import * as THREE from "three";

/**
 * Starfield configuration
 */
const STARFIELD_CONFIG = {
  RADIUS_MIN: 25,
  RADIUS_MAX: 50,
  HUE_VARIATION: 0.1,
  SATURATION: 0.6,
  LIGHTNESS_MIN: 0.4,
  LIGHTNESS_MAX: 0.9,
  SIZE_BASE: 0.15,
  SIZE_VARIATION: 0.1
};

/**
 * Generate random point on sphere surface
 * @param {number} minRadius - Minimum distance from center
 * @param {number} maxRadius - Maximum distance from center
 * @returns {THREE.Vector3} Position vector
 */
function generateSpherePoint(minRadius = STARFIELD_CONFIG.RADIUS_MIN, maxRadius = STARFIELD_CONFIG.RADIUS_MAX) {
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
}

/**
 * Create optimized starfield
 * @param {Object} options - Configuration options
 * @param {number} options.numStars - Number of stars to generate
 * @param {THREE.Texture} options.sprite - Star sprite texture
 * @returns {THREE.Points} Optimized starfield points
 */
export default function getStarfield({ numStars = 500, sprite } = {}) {
  const positions = [];
  const colors = [];
  const sizes = [];

  // Generate stars efficiently
  for (let i = 0; i < numStars; i++) {
    const position = generateSpherePoint();
    
    // Create varied star colors
    const baseHue = 0.6; // Blue base
    const hue = baseHue + (Math.random() - 0.5) * STARFIELD_CONFIG.HUE_VARIATION;
    const lightness = STARFIELD_CONFIG.LIGHTNESS_MIN + 
      Math.random() * (STARFIELD_CONFIG.LIGHTNESS_MAX - STARFIELD_CONFIG.LIGHTNESS_MIN);
    
    const color = new THREE.Color().setHSL(hue, STARFIELD_CONFIG.SATURATION, lightness);
    
    // Variable star sizes
    const size = STARFIELD_CONFIG.SIZE_BASE + Math.random() * STARFIELD_CONFIG.SIZE_VARIATION;

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
    opacity: 0.8,
    sizeAttenuation: true,
    alphaTest: 0.01 // Optimize rendering
  });

  return new THREE.Points(geometry, material);
}
