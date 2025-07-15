class SolarSystem {
  constructor() {
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.clock = new THREE.Clock();
      
      // Animation state
      this.isPaused = false;
      this.isLightTheme = false;
      
      // Planet data with realistic relative sizes and distances
      this.planetData = {
          mercury: { 
              name: 'Mercury', 
              size: 0.38, 
              distance: 8, 
              speed: 4.15, 
              color: 0x8c7853,
              info: 'Closest planet to the Sun. Extremely hot during day, freezing at night.'
          },
          venus: { 
              name: 'Venus', 
              size: 0.95, 
              distance: 12, 
              speed: 1.62, 
              color: 0xffc649,
              info: 'Hottest planet due to greenhouse effect. Rotates backwards.'
          },
          earth: { 
              name: 'Earth', 
              size: 1.0, 
              distance: 16, 
              speed: 1.0, 
              color: 0x6b93d6,
              info: 'Our home planet. Only known planet with life.'
          },
          mars: { 
              name: 'Mars', 
              size: 0.53, 
              distance: 20, 
              speed: 0.53, 
              color: 0xc1440e,
              info: 'The Red Planet. Has the largest volcano in the solar system.'
          },
          jupiter: { 
              name: 'Jupiter', 
              size: 2.5, 
              distance: 28, 
              speed: 0.084, 
              color: 0xd8ca9d,
              info: 'Largest planet. Great Red Spot is a storm larger than Earth.'
          },
          saturn: { 
              name: 'Saturn', 
              size: 2.1, 
              distance: 36, 
              speed: 0.034, 
              color: 0xfad5a5,
              info: 'Famous for its beautiful ring system. Less dense than water.'
          },
          uranus: { 
              name: 'Uranus', 
              size: 1.6, 
              distance: 44, 
              speed: 0.012, 
              color: 0x4fd0e7,
              info: 'Ice giant that rotates on its side. Has faint rings.'
          },
          neptune: { 
              name: 'Neptune', 
              size: 1.5, 
              distance: 52, 
              speed: 0.006, 
              color: 0x4b70dd,
              info: 'Windiest planet with speeds up to 2,100 km/h.'
          }
      };
      
      this.planets = {};
      this.planetMeshes = {};
      this.speedMultipliers = {};
      
      this.init();
      this.createStars();
      this.createSun();
      this.createPlanets();
      this.createControls();
      this.setupEventListeners();
      this.animate();
  }
  
  init() {
      // Renderer setup
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      document.getElementById('canvas-container').appendChild(this.renderer.domElement);
      
      // Camera position
      this.camera.position.set(0, 30, 60);
      this.camera.lookAt(0, 0, 0);
      
      // Initialize speed multipliers
      Object.keys(this.planetData).forEach(key => {
          this.speedMultipliers[key] = 1.0;
      });
  }
  
  createStars() {
      const starGeometry = new THREE.BufferGeometry();
      const starCount = 5000;
      const positions = new Float32Array(starCount * 3);
      
      for (let i = 0; i < starCount * 3; i++) {
          positions[i] = (Math.random() - 0.5) * 2000;
      }
      
      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const starMaterial = new THREE.PointsMaterial({ 
          color: 0xffffff, 
          size: 2,
          transparent: true,
          opacity: 0.8
      });
      
      const stars = new THREE.Points(starGeometry, starMaterial);
      this.scene.add(stars);
  }
  
  createSun() {
      const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
      const sunMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xfdb813,
          emissive: 0xfdb813,
          emissiveIntensity: 0.3
      });
      
      this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
      this.scene.add(this.sun);
      
      // Sun light
      const sunLight = new THREE.PointLight(0xffffff, 2, 200);
      sunLight.position.set(0, 0, 0);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      this.scene.add(sunLight);
      
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
      this.scene.add(ambientLight);
  }
  
  createPlanets() {
      Object.keys(this.planetData).forEach(key => {
          const data = this.planetData[key];
          
          // Planet geometry and material
          const planetGeometry = new THREE.SphereGeometry(data.size, 32, 32);
          const planetMaterial = new THREE.MeshLambertMaterial({ 
              color: data.color,
              transparent: true,
              opacity: 0.9
          });
          
          const planet = new THREE.Mesh(planetGeometry, planetMaterial);
          planet.position.x = data.distance;
          planet.castShadow = true;
          planet.receiveShadow = true;
          planet.userData = { name: data.name, info: data.info };
          
          // Create orbit line
          const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 64);
          const orbitMaterial = new THREE.MeshBasicMaterial({ 
              color: 0x444444, 
              transparent: true, 
              opacity: 0.3,
              side: THREE.DoubleSide
          });
          const orbitRing = new THREE.Mesh(orbitGeometry, orbitMaterial);
          orbitRing.rotation.x = Math.PI / 2;
          
          // Group for orbital motion
          const planetGroup = new THREE.Group();
          planetGroup.add(planet);
          
          this.scene.add(planetGroup);
          this.scene.add(orbitRing);
          
          this.planets[key] = planetGroup;
          this.planetMeshes[key] = planet;
      });
  }
  
  createControls() {
      const controlsContainer = document.getElementById('planetControls');
      
      Object.keys(this.planetData).forEach(key => {
          const data = this.planetData[key];
          
          const controlDiv = document.createElement('div');
          controlDiv.className = 'planet-control';
          
          const nameDiv = document.createElement('div');
          nameDiv.className = 'planet-name';
          nameDiv.textContent = data.name;
          
          const speedDiv = document.createElement('div');
          speedDiv.className = 'speed-control';
          
          const slider = document.createElement('input');
          slider.type = 'range';
          slider.min = '0';
          slider.max = '3';
          slider.step = '0.1';
          slider.value = '1';
          slider.className = 'speed-slider';
          
          const valueDisplay = document.createElement('span');
          valueDisplay.className = 'speed-value';
          valueDisplay.textContent = '1.0x';
          
          slider.addEventListener('input', (e) => {
              const value = parseFloat(e.target.value);
              this.speedMultipliers[key] = value;
              valueDisplay.textContent = value.toFixed(1) + 'x';
          });
          
          speedDiv.appendChild(slider);
          speedDiv.appendChild(valueDisplay);
          
          controlDiv.appendChild(nameDiv);
          controlDiv.appendChild(speedDiv);
          
          controlsContainer.appendChild(controlDiv);
      });
  }
  
  setupEventListeners() {
      // Pause/Resume button
      document.getElementById('pauseBtn').addEventListener('click', () => {
          this.isPaused = !this.isPaused;
          const btn = document.getElementById('pauseBtn');
          if (this.isPaused) {
              btn.textContent = '▶️ Resume';
              btn.classList.add('paused');
          } else {
              btn.textContent = '⏸️ Pause';
              btn.classList.remove('paused');
          }
      });
      
      // Panel toggle
      document.getElementById('toggleBtn').addEventListener('click', () => {
          const panel = document.getElementById('controlPanel');
          const btn = document.getElementById('toggleBtn');
          panel.classList.toggle('collapsed');
          btn.textContent = panel.classList.contains('collapsed') ? '▶' : '◀';
      });
      
      // Theme toggle
      document.getElementById('themeToggle').addEventListener('click', () => {
          this.isLightTheme = !this.isLightTheme;
          const btn = document.getElementById('themeToggle');
          if (this.isLightTheme) {
              document.body.classList.add('light-theme');
              btn.textContent = '🌙 Dark';
          } else {
              document.body.classList.remove('light-theme');
              btn.textContent = '☀️ Light';
          }
      });
      
      // Mouse interactions for planet info
      this.renderer.domElement.addEventListener('mousemove', (event) => {
          this.onMouseMove(event);
      });
      
      this.renderer.domElement.addEventListener('click', (event) => {
          this.onMouseClick(event);
      });
      
      // Window resize
      window.addEventListener('resize', () => {
          this.camera.aspect = window.innerWidth / window.innerHeight;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(window.innerWidth, window.innerHeight);
      });
  }
  
  onMouseMove(event) {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);
      
      const intersects = raycaster.intersectObjects(Object.values(this.planetMeshes));
      
      if (intersects.length > 0) {
          const planet = intersects[0].object;
          this.showPlanetInfo(planet.userData.name, planet.userData.info);
          document.body.style.cursor = 'pointer';
      } else {
          this.hidePlanetInfo();
          document.body.style.cursor = 'default';
      }
  }
  
  onMouseClick(event) {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);
      
      const intersects = raycaster.intersectObjects(Object.values(this.planetMeshes));
      
      if (intersects.length > 0) {
          const planet = intersects[0].object;
          this.focusOnPlanet(planet);
      }
  }
  
  showPlanetInfo(name, info) {
      const infoPanel = document.getElementById('infoPanel');
      const infoTitle = document.getElementById('infoTitle');
      const infoContent = document.getElementById('infoContent');
      
      infoTitle.textContent = name;
      infoContent.textContent = info;
      infoPanel.style.display = 'block';
  }
  
  hidePlanetInfo() {
      const infoPanel = document.getElementById('infoPanel');
      infoPanel.style.display = 'none';
  }
  
  focusOnPlanet(planet) {
      const planetPosition = planet.getWorldPosition(new THREE.Vector3());
      const targetPosition = new THREE.Vector3(
          planetPosition.x + 10,
          planetPosition.y + 10,
          planetPosition.z + 10
      );
      
      // Smooth camera transition
      this.animateCamera(this.camera.position, targetPosition, planetPosition);
  }
  
  animateCamera(startPos, endPos, lookAtPos) {
      const startTime = Date.now();
      const duration = 1000;
      
      const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function
          const easeInOut = progress < 0.5 
              ? 2 * progress * progress 
              : -1 + (4 - 2 * progress) * progress;
          
          this.camera.position.lerpVectors(startPos, endPos, easeInOut);
          this.camera.lookAt(lookAtPos);
          
          if (progress < 1) {
              requestAnimationFrame(animate);
          }
      };
      
      animate();
  }
  
  animate() {
      requestAnimationFrame(() => this.animate());
      
      if (!this.isPaused) {
          const deltaTime = this.clock.getDelta();
          
          // Rotate sun
          this.sun.rotation.y += deltaTime * 0.5;
          
          // Animate planets
          Object.keys(this.planets).forEach(key => {
              const planet = this.planets[key];
              const data = this.planetData[key];
              const speed = data.speed * this.speedMultipliers[key];
              
              // Orbital motion
              planet.rotation.y += deltaTime * speed * 0.1;
              
              // Planet self-rotation
              const planetMesh = this.planetMeshes[key];
              planetMesh.rotation.y += deltaTime * 2;
          });
      }
      
      this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the solar system when the page loads
window.addEventListener('load', () => {
  new SolarSystem();
});