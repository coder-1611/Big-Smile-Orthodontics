/* ============================================
   Hero 3D — Three.js Tooth Scene
   ============================================ */

// Only load on desktop with WebGL support
const isMobile = window.innerWidth < 768 || navigator.maxTouchPoints > 1;
const canvas = document.getElementById('hero3d');
const fallbackImg = document.querySelector('.hero__image--fallback');

function showFallback() {
  if (canvas) canvas.style.display = 'none';
  if (fallbackImg) fallbackImg.style.display = 'block';
}

if (isMobile || !canvas) {
  showFallback();
} else {
  // Try to load Three.js
  import('three').then(async (THREE) => {
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

    // Check WebGL
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!gl) throw new Error('No WebGL');
    } catch (e) {
      showFallback();
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });

    const size = Math.min(canvas.parentElement.offsetWidth, 500);
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(3, 5, 4);
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x48CAE4, 0.5);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x0077B6, 0.3);
    fillLight.position.set(0, -3, 2);
    scene.add(fillLight);

    // Create a stylized tooth geometry (since we don't have a .glb model)
    // Use a combination of shapes to create a tooth-like form
    const toothGroup = new THREE.Group();

    // Main tooth body - rounded box shape
    const bodyGeometry = new THREE.CapsuleGeometry(0.6, 0.8, 16, 32);
    const toothMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xF5F5F0,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.5,
      transmission: 0.1,
      thickness: 0.5,
      ior: 1.5
    });
    const body = new THREE.Mesh(bodyGeometry, toothMaterial);
    body.scale.set(1, 1.1, 0.85);
    toothGroup.add(body);

    // Root prongs
    const rootGeometry = new THREE.ConeGeometry(0.2, 0.7, 12);
    const rootMaterial = toothMaterial.clone();
    rootMaterial.color.set(0xEEEEE6);

    const root1 = new THREE.Mesh(rootGeometry, rootMaterial);
    root1.position.set(-0.2, -1.1, 0);
    root1.rotation.z = 0.15;
    toothGroup.add(root1);

    const root2 = new THREE.Mesh(rootGeometry, rootMaterial);
    root2.position.set(0.2, -1.1, 0);
    root2.rotation.z = -0.15;
    toothGroup.add(root2);

    // Subtle sparkle particles around the tooth
    const particleCount = 30;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.5 + Math.random() * 1;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x48CAE4,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    toothGroup.add(particles);

    scene.add(toothGroup);
    toothGroup.rotation.x = 0.2;

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', function (e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Visibility check — pause when not visible
    let isVisible = true;
    const heroSection = document.getElementById('hero');

    if (heroSection) {
      const visibilityObserver = new IntersectionObserver(
        function (entries) {
          isVisible = entries[0].isIntersecting;
        },
        { threshold: 0.1 }
      );
      visibilityObserver.observe(heroSection);
    }

    // Animation loop
    const clock = new THREE.Clock();
    let animFrameId;

    function animate() {
      animFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const time = clock.getElapsedTime();

      // Slow rotation
      toothGroup.rotation.y = time * 0.3;

      // Gentle bobbing
      toothGroup.position.y = Math.sin(time * 0.8) * 0.08;

      // Mouse tilt
      toothGroup.rotation.x = 0.2 + mouseY * 0.15;
      toothGroup.rotation.z = mouseX * 0.1;

      // Particle rotation
      particles.rotation.y = time * 0.15;

      renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    function onResize() {
      if (window.innerWidth < 768) {
        showFallback();
        cancelAnimationFrame(animFrameId);
        return;
      }

      const newSize = Math.min(canvas.parentElement.offsetWidth, 500);
      renderer.setSize(newSize, newSize);
    }

    window.addEventListener('resize', onResize);

  }).catch(function () {
    showFallback();
  });
}
