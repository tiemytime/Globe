# Smooth Globe 3D

A high-performance, production-ready 3D globe visualization built with Three.js. Features optimized rendering, smooth surface without elevation bumps, and easy integration capabilities.

## ✨ Features

- 🌍 **Smooth Globe Surface** - No elevation bumps for optimal performance
- ⚡ **High Performance** - Optimized for low-end devices and mobile
- 🎯 **Production Ready** - Clean, maintainable, and well-documented code
- 🔧 **Easy Integration** - Simple API for embedding in any project
- 📱 **Responsive** - Works seamlessly across all devices
- 🌟 **Starfield Background** - Beautiful star field with optimized rendering
- 🎮 **Interactive Controls** - Smooth orbit controls with damping

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd globe

# Start development server
npm run serve
# or
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

## 📦 Installation

### Standalone Usage
Simply include the files in your project and open `index.html` in a browser.

### As Module
```javascript
import Globe3D from './index.js';

// Create a new globe instance
const globe = new Globe3D();

// Access the globe instance globally
window.myGlobe = globe;
```

## ⚙️ Configuration

Easy customization through the `CONFIG` object:

```javascript
const CONFIG = {
  CAMERA: {
    fov: 45,                    // Field of view
    position: [0, 0, 3.5]      // Initial camera position
  },
  GLOBE: {
    radius: 1,                  // Globe radius
    detail: 80,                 // Surface detail level
    rotationSpeed: 0.002        // Rotation speed
  },
  STARS: {
    count: 3000,               // Number of stars
    size: 0.15                 // Star size
  },
  LIGHTING: {
    ambientIntensity: 0.4,     // Ambient light
    hemisphereIntensity: 2.5   // Hemisphere light
  }
};
```

## 🎯 Performance Features

### Optimizations Applied
- ✅ **No Elevation Mapping** - Smooth surface for better performance
- ✅ **Reduced Polygon Count** - Optimized geometry detail
- ✅ **Efficient Shaders** - Minimal fragment/vertex shader operations
- ✅ **Texture Optimization** - Disabled mipmaps, optimized filters
- ✅ **Capped Pixel Ratio** - Limited to 2x for performance
- ✅ **Animation Pausing** - Pauses when tab is not visible
- ✅ **Memory Management** - Proper cleanup and disposal methods

### Performance Metrics
- **Mobile Friendly** - 60fps on modern mobile devices
- **Low Memory** - Minimal texture and geometry usage
- **Fast Loading** - Optimized asset loading
- **Smooth Interaction** - Responsive orbit controls

## 🛠️ API Reference

### Globe3D Class

#### Constructor
```javascript
const globe = new Globe3D();
```

#### Methods
```javascript
// Control animation
globe.pause();                 // Pause animation
globe.resume();                // Resume animation

// Cleanup
globe.dispose();               // Clean up resources
```

#### Configuration Access
```javascript
// Modify settings before initialization
CONFIG.GLOBE.rotationSpeed = 0.001;
CONFIG.STARS.count = 5000;
```

## 📁 Project Structure

```
globe/
├── index.html              # Entry point
├── index.js                # Main Globe3D class
├── package.json            # Project configuration
├── .gitignore              # Git ignore rules
├── README.md               # This file
└── src/
    ├── getStarfield.js     # Starfield generation
    ├── circle.png          # Star sprite
    ├── 00_earthmap1k.jpg   # Earth color texture
    └── 02_earthspec1k.jpg  # Earth alpha texture
```

## 🔧 Integration Examples

### Basic Integration
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; background: black; }
    </style>
</head>
<body>
    <script type="module" src="index.js"></script>
</body>
</html>
```

### Custom Container
```javascript
// Initialize with custom container
const container = document.getElementById('globe-container');
const globe = new Globe3D();
globe.renderer.domElement.style.width = '100%';
globe.renderer.domElement.style.height = '100%';
container.appendChild(globe.renderer.domElement);
```

### React Integration
```jsx
import { useEffect, useRef } from 'react';

function GlobeComponent() {
  const containerRef = useRef();
  const globeRef = useRef();

  useEffect(() => {
    // Initialize globe
    globeRef.current = new Globe3D();
    containerRef.current.appendChild(globeRef.current.renderer.domElement);

    return () => {
      // Cleanup
      globeRef.current?.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
}
```

## 🎨 Customization

### Adding Custom Textures
```javascript
// In loadTextures method
this.textures = {
  starSprite: textureLoader.load("./src/circle.png"),
  earthColor: textureLoader.load("./path/to/custom-earth.jpg"),
  earthAlpha: textureLoader.load("./path/to/custom-alpha.jpg")
};
```

### Modifying Colors
```javascript
// Ambient light color
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);

// Hemisphere light colors
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x080820, 2.5);
```

### Custom Markers (Future Enhancement Ready)
The smooth surface design makes it easy to add markers:

```javascript
// Example marker addition
addMarker(lat, lon, color = 0xffff00) {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.02),
    new THREE.MeshBasicMaterial({ color })
  );
  
  // Convert lat/lon to 3D position
  const position = this.latLonToVector3(lat, lon, 1.01);
  marker.position.copy(position);
  
  this.globeGroup.add(marker);
}
```

## 📈 Browser Support

- **Modern Browsers** - Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile Browsers** - iOS Safari 12+, Chrome Mobile 60+
- **WebGL Required** - WebGL 1.0 support needed

## 🔄 Version History

### v2.0.0 (Current)
- ✅ Removed elevation bumps for smooth surface
- ✅ Production-level code structure
- ✅ Performance optimizations
- ✅ Easy integration API
- ✅ Comprehensive documentation

### v1.0.0 (Previous)
- Basic globe with elevation mapping
- Simple starfield
- Basic orbit controls

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) - 3D graphics library
- [Three.js Community](https://discourse.threejs.org/) - Support and examples
- Earth texture maps from NASA
