// ─────────────────────────────────────────────────────────────
//  Valentine's Quest — game.js  (ES6 Module, no build step)
// ─────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/* ══════════════════════════════════════════════════════════════
   1.  STATE MANAGEMENT
   ══════════════════════════════════════════════════════════════ */
const SAVE_KEY = 'valquest_save';

// The phrase whose letters the player collects across all stages
// "WILL YOU BE MY" → 11 letter positions (spaces are cosmetic gaps)
const PHRASE = 'WILL YOU BE MY';
// Build array: each entry is { char, wordBreakAfter } for rendering
const PHRASE_CHARS = [];
for (let i = 0; i < PHRASE.length; i++) {
  if (PHRASE[i] === ' ') continue;           // skip spaces; we mark gaps on the previous char
  PHRASE_CHARS.push({ char: PHRASE[i], gap: PHRASE[i + 1] === ' ' });
}
// Total letter slots = 11  (W I L L | Y O U | B E | M Y)

// Which letter-indices each stage reveals
const STAGE_LETTERS = {
  1: [0, 6, 2, 9, 4, 5],   // Driving  →  W I L L Y O  (6)
  2: [1, 7],                // Puzzle   →  U B          (2)
  3: [8],                   // Painting →  E            (1)
  4: [3, 10],               // Quiz     →  M Y          (2)
};

const gameState = loadState() || {
  currentStage: 0,
  revealedIndices: [],      // which PHRASE_CHARS indices are revealed
};
// Guard against stale saves that lack the new field
if (!Array.isArray(gameState.revealedIndices)) {
  gameState.revealedIndices = [];
}

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
}

/* ══════════════════════════════════════════════════════════════
   1b. GLOBAL LETTER TRACKER
   ══════════════════════════════════════════════════════════════ */
const trackerEl = document.getElementById('letter-tracker');

// Build the tracker DOM once
PHRASE_CHARS.forEach((entry, i) => {
  const span = document.createElement('span');
  span.className = 'lt-char';
  span.dataset.idx = i;
  span.textContent = '_';
  trackerEl.appendChild(span);
  // Add a gap spacer after word boundaries
  if (entry.gap) {
    const spacer = document.createElement('span');
    spacer.className = 'lt-char lt-space';
    trackerEl.appendChild(spacer);
  }
});

function revealLetters(indices) {
  indices.forEach(idx => {
    if (gameState.revealedIndices.includes(idx)) return;
    gameState.revealedIndices.push(idx);
  });
  saveState();
  renderTracker(true);
}

function renderTracker(animate = false) {
  PHRASE_CHARS.forEach((entry, i) => {
    const span = trackerEl.querySelector(`.lt-char[data-idx="${i}"]`);
    if (!span) return;
    const isRevealed = gameState.revealedIndices.includes(i);
    if (isRevealed) {
      const wasHidden = !span.classList.contains('revealed');
      span.textContent = entry.char;
      span.classList.add('revealed');
      if (animate && wasHidden) {
        span.classList.remove('pop');
        // force reflow for re-triggering animation
        void span.offsetWidth;
        span.classList.add('pop');
      }
    } else {
      span.textContent = '_';
      span.classList.remove('revealed', 'pop');
    }
  });
}

// Initial render from saved state
renderTracker();

/* ══════════════════════════════════════════════════════════════
   2.  STAGE MANAGER
   ══════════════════════════════════════════════════════════════ */
const stages = document.querySelectorAll('.stage');

function goToStage(n) {
  gameState.currentStage = n;
  saveState();
  stages.forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`stage-${n}`);
  if (target) target.classList.add('active');

  // Show tracker once the game has started (past intro), hide on final stage
  if (n >= 1 && n < 6) trackerEl.style.display = 'flex';
  if (n === 6) trackerEl.style.display = 'none';

  // Stage-specific init hooks
  if (n === 1) initDriving();
  if (n === 2) initPuzzle();
  if (n === 3) initPainting();
  if (n === 5) initProposal();
  if (n === 6) initPhotoMatrix();
}

/* ══════════════════════════════════════════════════════════════
   2b. GLOBAL RESET
   ══════════════════════════════════════════════════════════════ */
document.getElementById('btn-reset').addEventListener('click', () => {
  if (confirm('Reset all progress and start over?')) {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
});

/* ══════════════════════════════════════════════════════════════
   3.  STAGE 0 — INTRO
   ══════════════════════════════════════════════════════════════ */
// Floating hearts background
(function spawnHearts() {
  const container = document.getElementById('hearts-bg');
  if (!container) return;
  const symbols = ['♥', '♡', '❤', '💕'];
  for (let i = 0; i < 30; i++) {
    const span = document.createElement('span');
    span.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    span.style.left = `${Math.random() * 100}%`;
    span.style.animationDuration = `${6 + Math.random() * 10}s`;
    span.style.animationDelay   = `${Math.random() * 8}s`;
    span.style.fontSize = `${1 + Math.random() * 1.6}rem`;
    container.appendChild(span);
  }
})();

document.getElementById('btn-start').addEventListener('click', () => goToStage(1));

/* ══════════════════════════════════════════════════════════════
   4.  STAGE 1 — DRIVING GAME (Three.js) (6 letters)
   Hiking trip
   Boat
   Disneyland
   Six Flags
   My house
   Blake garden
   ══════════════════════════════════════════════════════════════ */
let drivingInitialised = false;

function initDriving() {
  if (drivingInitialised) return;
  drivingInitialised = true;

  const container = document.getElementById('stage-1');

  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x87ceeb); // sky blue
  container.insertBefore(renderer.domElement, container.firstChild);

  // ── Scene ──
  const scene  = new THREE.Scene();
  scene.fog = new THREE.Fog(0x87ceeb, 80, 180);

  // ── Camera ──
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

  // ── Lights ──
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  // ── Ground ──
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ── Road (decorative strip) ──
  const roadGeo = new THREE.PlaneGeometry(8, 200);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.y  = 0.01;
  scene.add(road);

  // ── Player (Car) ──
  const carGroup = new THREE.Group();

  // ── Box car (original procedural model) ──
  const boxCarGroup = new THREE.Group();
  // Body
  const bodyGeo = new THREE.BoxGeometry(2, 0.8, 3.5);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x000802 });
  boxCarGroup.add(new THREE.Mesh(bodyGeo, bodyMat));
  // Cabin
  const cabinGeo = new THREE.BoxGeometry(1.6, 0.7, 1.8);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.y = 0.7;
  cabin.position.z = -0.2;
  boxCarGroup.add(cabin);

  // ── VW Emblem (Back Bumper) — loaded from GLB model ──
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('volkswagen_logo-v1.glb', (gltf) => {
    const emblem = gltf.scene;
    // Scale & position to fit the back bumper
    emblem.scale.set(0.1, 0.1, 0.1);
    emblem.position.set(0, 0, 1.75);
    // Rotate to face outward from the back of the car
    emblem.rotation.y = 0;
    emblem.rotation.x = Math.PI / 4;
    boxCarGroup.add(emblem);
  });

  carGroup.add(boxCarGroup);

  // ── Volks GLB car (full 3D model, DRACO-compressed) ──
  const volksCarGroup = new THREE.Group();
  volksCarGroup.visible = false; // hidden by default

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');

  const volksLoader = new GLTFLoader();
  volksLoader.setDRACOLoader(dracoLoader);

  let volksLoaded = false;
  volksLoader.load('volks.glb', (gltf) => {
    const volksModel = gltf.scene;
    // Auto-fit: compute bounding box and normalise to roughly match box-car size
    const box = new THREE.Box3().setFromObject(volksModel);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const desiredSize = 6; // roughly same length as box car
    const scaleFactor = desiredSize / maxDim;
    volksModel.scale.setScalar(scaleFactor);

    // Re-centre so the model sits at the group origin
    const centre = box.getCenter(new THREE.Vector3());
    volksModel.rotation.y = Math.PI;
    volksModel.position.set(
      -centre.x * scaleFactor,
      (-centre.y * scaleFactor) + 0.5,
      -centre.z * scaleFactor,
    );

    volksCarGroup.add(volksModel);
    volksLoaded = true;
  });

  carGroup.add(volksCarGroup);

  // ── Car model toggle (P key) ──
  let usingVolksModel = false;

  carGroup.position.y = 0.5;
  scene.add(carGroup);

  // ── Collectibles — one photo portal per driving letter ──
  const drivingIndices = STAGE_LETTERS[1];           // [0,1,2,3,4,5]
  const collectibles   = [];
  const collected      = new Set();
  const PORTAL_RADIUS  = 2.5;

  // Photo for each portal (ordered by collectible index)
  const PORTAL_IMAGES = [
    'places/forest.webp',   // Hiking trip
    'places/boat.webp',     // Boat
    'places/disney.webp',   // Disneyland
    'places/six.webp',      // Six Flags
    'places/home.webp',     // My house
    'places/blake.webp',    // Blake garden
  ];

  const textureLoader = new THREE.TextureLoader();

  // Create floating 3D letter labels
  const makeLabel = (text) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 64;
    const c = canvas.getContext('2d');
    c.fillStyle = '#fff';
    c.font = 'bold 48px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, 64, 32);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(2, 1, 1);
    return sprite;
  };

  drivingIndices.forEach((phraseIdx, i) => {
    const portalGroup = new THREE.Group();

    // Load photo texture
    const photoTex = textureLoader.load(PORTAL_IMAGES[i]);
    photoTex.colorSpace = THREE.SRGBColorSpace;

    // Circular photo plane — the "window" into the memory
    const circleGeo = new THREE.CircleGeometry(PORTAL_RADIUS, 64);
    const circleMat = new THREE.MeshBasicMaterial({
      map: photoTex,
      side: THREE.DoubleSide,
    });
    portalGroup.add(new THREE.Mesh(circleGeo, circleMat));

    // Inner glowing ring
    const ringGeo = new THREE.TorusGeometry(PORTAL_RADIUS, 0.13, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xff4d6d,
      emissive: 0xff4d6d,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.9,
    });
    portalGroup.add(new THREE.Mesh(ringGeo, ringMat));

    // Outer soft-glow ring
    const outerRingGeo = new THREE.TorusGeometry(PORTAL_RADIUS + 0.25, 0.4, 16, 64);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0xffd60a,
      emissive: 0xffd60a,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.2,
    });
    portalGroup.add(new THREE.Mesh(outerRingGeo, outerRingMat));

    // Small point-light for ambient glow on ground
    const portalLight = new THREE.PointLight(0xff4d6d, 1.5, 12);
    portalLight.position.set(0, 0, 0.5);
    portalGroup.add(portalLight);

    // Position — centre above ground
    portalGroup.position.set(
      (Math.random() - 0.5) * 60,
      PORTAL_RADIUS + 0.5,
      -10 - Math.random() * 70,
    );

    portalGroup.userData.index      = i;
    portalGroup.userData.phraseIdx  = phraseIdx;
    portalGroup.userData.ringMat    = ringMat;
    portalGroup.userData.outerRingMat = outerRingMat;

    // Floating letter above portal
    const label = makeLabel(PHRASE_CHARS[phraseIdx].char);
    label.position.y = PORTAL_RADIUS + 1.2;
    portalGroup.add(label);

    scene.add(portalGroup);
    collectibles.push(portalGroup);
  });

  // ── Controls ──
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;

    // Toggle car model with P key
    if ((e.key === 'p' || e.key === 'P') && volksLoaded) {
      usingVolksModel = !usingVolksModel;
      boxCarGroup.visible   = !usingVolksModel;
      volksCarGroup.visible =  usingVolksModel;
    }
  });
  window.addEventListener('keyup',   e => { keys[e.key] = false; });

  const speed    = 0.23;
  const rotSpeed = 0.03;

  // ── Animate ──
  function animate() {
    requestAnimationFrame(animate);

    // Movement
    if (keys['ArrowUp']    || keys['w']) carGroup.translateZ(-speed);
    if (keys['ArrowDown']  || keys['s']) carGroup.translateZ(speed);
    if (keys['ArrowLeft']  || keys['a']) carGroup.rotation.y += rotSpeed;
    if (keys['ArrowRight'] || keys['d']) carGroup.rotation.y -= rotSpeed;

    // Portal animation + collision check
    collectibles.forEach(s => {
      if (collected.has(s.userData.index)) return;

      // Gentle vertical bob
      s.position.y = PORTAL_RADIUS + 0.5 + Math.sin(Date.now() * 0.002 + s.userData.index) * 0.3;

      // Billboard — rotate on Y to always face the camera
      const angle = Math.atan2(
        camera.position.x - s.position.x,
        camera.position.z - s.position.z,
      );
      s.rotation.y = angle;

      // Pulse the ring glow
      const pulse = 0.7 + Math.sin(Date.now() * 0.004 + s.userData.index * 1.5) * 0.3;
      s.userData.ringMat.emissiveIntensity = 1.5 + pulse;
      s.userData.outerRingMat.opacity = 0.15 + pulse * 0.15;

      // XZ-only distance check (drive into the portal)
      const dx = carGroup.position.x - s.position.x;
      const dz = carGroup.position.z - s.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 3.5) {
        collected.add(s.userData.index);
        scene.remove(s);
        revealLetters([s.userData.phraseIdx]);

        if (collected.size === drivingIndices.length) {
          document.getElementById('driving-success').classList.add('show');
        }
      }
    });

    // Camera follow
    const ideal = new THREE.Vector3(0, 5, 10);
    ideal.applyQuaternion(carGroup.quaternion);
    ideal.add(carGroup.position);
    camera.position.lerp(ideal, 0.08);
    camera.lookAt(carGroup.position);

    renderer.render(scene, camera);
  }
  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Next button
  document.getElementById('btn-driving-next').addEventListener('click', () => goToStage(2));
}

/* ══════════════════════════════════════════════════════════════
   5.  STAGE 2 — JIGSAW PUZZLE (using Headbreaker)
   ══════════════════════════════════════════════════════════════ */
let puzzleInitialised = false;

function initPuzzle() {
  if (puzzleInitialised) return;
  puzzleInitialised = true;

  // Create a canvas element for the puzzle
  const canvas = new headbreaker.Canvas('puzzle-canvas', {
    width: 600,
    height: 450,
    pieceSize: 100,
    proximity: 20,
    borderFill: 10,
    strokeWidth: 2,
    lineSoftness: 0.18,
    outline: new headbreaker.outline.Rounded(),
    preventOffstageDrag: true,
    fixed: true, // Disable canvas dragging - only pieces can be moved
    painter: new headbreaker.painters.Konva()
  });

  // Generate puzzle with custom colors representing memories/love
  canvas.autogenerate({
    horizontalPiecesCount: 3,
    verticalPiecesCount: 2,
    metadata: [
      { color: '#ffffff' }, 
      { color: '#ffffff' }, 
      { color: '#ffffff' }, 
      { color: '#ffffff' }, 
      { color: '#ffffff' }, 
      { color: '#ffffff' }, 
    ]
  });

  canvas.registerKeyboardGestures();

  // Shuffle the pieces
  canvas.shuffle(0.7);

  // Draw the puzzle
  canvas.draw();

  // Listen for puzzle completion using onValid callback
  canvas.attachSolvedValidator();
  canvas.onValid(() => {
    console.log('puzzle is solved!');

    // Populate the back face with the stage-2 letters
    const flipLettersEl = document.getElementById('flip-letters');
    STAGE_LETTERS[2].forEach(idx => {
      const span = document.createElement('span');
      span.className = 'flip-letter';
      span.textContent = PHRASE_CHARS[idx].char;
      flipLettersEl.appendChild(span);
    });

    // Short pause, then flip the puzzle over
    setTimeout(() => {
      const wrapper = document.getElementById('puzzle-canvas-wrapper');
      wrapper.classList.add('flipped');

      // After the flip animation finishes (~1s), reveal letters in tracker & show next button
      wrapper.addEventListener('transitionend', () => {
        revealLetters(STAGE_LETTERS[2]);  // U, B
        setTimeout(() => {
          document.getElementById('puzzle-success').classList.add('show');
        }, 600);
      }, { once: true });
    }, 500);
  });

  document.getElementById('btn-puzzle-next').addEventListener('click', () => goToStage(3));
}

/* ══════════════════════════════════════════════════════════════
   6.  STAGE 3 — SCRATCH-TO-REVEAL  (random photo)
   ══════════════════════════════════════════════════════════════ */
let paintInitialised = false;

// Image pairs: { sketch, photo, width, height }
const SCRATCH_IMAGES = [
  { sketch: 'scratch/1605.png',  photo: 'scratch/IMG_1605.JPG',  w: 1024, h: 768  },
  { sketch: 'scratch/2115.png',  photo: 'scratch/IMG_2115.JPG',  w: 1168, h: 880  },
  { sketch: 'scratch/9882.png',  photo: 'scratch/IMG_9882.JPG',  w: 1024, h: 768  },
];

function initPainting() {
  if (paintInitialised) return;
  paintInitialised = true;

  // ── Pick a random image ──
  const chosen = SCRATCH_IMAGES[Math.floor(Math.random() * SCRATCH_IMAGES.length)];

  const photoEl   = document.getElementById('scratch-photo');
  const canvas    = document.getElementById('scratch-canvas');
  const ctx       = canvas.getContext('2d');
  const progressFill = document.getElementById('scratch-progress-fill');
  const nextBtn   = document.getElementById('btn-scratch-next');

  const REVEAL_THRESHOLD = 0.55;  // 55% scratched → auto-complete
  let scratchDone = false;

  // ── Load both images ──
  const sketchImg = new Image();
  const photoImg  = new Image();
  let sketchLoaded = false;
  let photoLoaded  = false;

  function onBothLoaded() {
    if (!sketchLoaded || !photoLoaded) return;

    // Set canvas to the native resolution of the sketch image
    canvas.width  = sketchImg.naturalWidth;
    canvas.height = sketchImg.naturalHeight;

    // Draw the sketch on the canvas (this is what gets scratched away)
    ctx.drawImage(sketchImg, 0, 0, canvas.width, canvas.height);
  }

  sketchImg.onload = () => { sketchLoaded = true; onBothLoaded(); };
  photoImg.onload  = () => { photoLoaded  = true; onBothLoaded(); };

  sketchImg.src = chosen.sketch;
  photoImg.src  = chosen.photo;

  // Set the photo <img> source (visible beneath the canvas)
  photoEl.src = chosen.photo;

  // ── Scratch logic ──
  let scratching = false;
  const BRUSH_RADIUS = 30;  // relative to canvas native coords

  function getScratchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }

  function scratch(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function checkProgress() {
    if (scratchDone) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparent = 0;
    const total = pixels.length / 4;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }
    const pct = transparent / total;
    progressFill.style.width = `${Math.min(pct / REVEAL_THRESHOLD * 100, 100)}%`;

    if (pct >= REVEAL_THRESHOLD) {
      scratchDone = true;
      // Fade out remaining sketch
      canvas.style.transition = 'opacity .8s ease';
      canvas.style.opacity = '0';
      progressFill.style.width = '100%';
      // Reveal letters & show next button
      setTimeout(() => {
        revealLetters(STAGE_LETTERS[3]);  // E
        nextBtn.style.display = '';
      }, 900);
    }
  }

  // Throttle progress checks
  let checkCounter = 0;
  function maybeScratchAndCheck(e) {
    const { x, y } = getScratchPos(e);
    scratch(x, y);
    checkCounter++;
    if (checkCounter % 8 === 0) checkProgress();
  }

  canvas.addEventListener('pointerdown', e => {
    scratching = true;
    const { x, y } = getScratchPos(e);
    scratch(x, y);
  });
  canvas.addEventListener('pointermove', e => {
    if (scratching) maybeScratchAndCheck(e);
  });
  canvas.addEventListener('pointerup',   () => { scratching = false; checkProgress(); });
  canvas.addEventListener('pointerleave', () => { scratching = false; });

  // Next button → advance stage
  nextBtn.addEventListener('click', () => goToStage(4));

}

/* ══════════════════════════════════════════════════════════════
   7.  STAGE 4 — QUIZ  +  MAGIC CONCH SHELL
   ══════════════════════════════════════════════════════════════ */

// ── Q2 Infinity Slider ──
const q2Slider     = document.getElementById('q2');
const q2Value      = document.getElementById('q2-value');
const q2PlusLabel  = document.querySelector('#q2-slider-wrap .slider-label:last-child');

q2Slider.addEventListener('input', () => {
  const v = Number(q2Slider.value);
  const max = Number(q2Slider.max);
  if (v >= max) {
    q2Value.textContent = '+∞';
    q2Value.classList.add('infinity');
    q2Slider.classList.add('maxed');
    q2PlusLabel.classList.add('glow');
  } else if (v <= 0) {
    q2Value.textContent = '−∞';
    q2Value.classList.remove('infinity');
    q2Slider.classList.remove('maxed');
    q2PlusLabel.classList.remove('glow');
  } else {
    q2Value.textContent = v;
    q2Value.classList.remove('infinity');
    q2Slider.classList.remove('maxed');
    q2PlusLabel.classList.remove('glow');
  }
});
// Set initial display
q2Value.textContent = q2Slider.value;

// ── Magic Conch Shell (drag to pull) ──
let conchPulled = false;
const conchDraggable = document.getElementById('conch-draggable');
const conchString    = document.getElementById('conch-string');
const conchAnswer    = document.getElementById('conch-answer');
const conchHint      = document.querySelector('.conch-hint');

const STRING_REST    = 30;   // resting string width (px)
const PULL_THRESHOLD = 140;  // how far right (px) to trigger the answer

let dragging = false;
let dragStartX = 0;
let dragOffset = 0;          // how far the conch has moved right

conchDraggable.addEventListener('pointerdown', (e) => {
  if (conchPulled) return;
  dragging = true;
  dragStartX = e.clientX;
  conchDraggable.setPointerCapture(e.pointerId);
  // Remove any snap-back transitions while actively dragging
  conchDraggable.classList.remove('snap-back');
  conchString.classList.remove('snap-back');
  e.preventDefault();
});

window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  dragOffset = Math.max(0, e.clientX - dragStartX);   // only allow dragging right
  conchDraggable.style.transform = `translateX(${dragOffset}px)`;
  conchString.style.width = `${STRING_REST + dragOffset}px`;
});

window.addEventListener('pointerup', () => {
  if (!dragging) return;
  dragging = false;

  if (dragOffset >= PULL_THRESHOLD && !conchPulled) {
    // ── Successful pull! ──
    conchPulled = true;

    // Snap back with animation
    conchDraggable.classList.add('snap-back');
    conchString.classList.add('snap-back');
    conchDraggable.style.transform = 'translateX(0)';
    conchString.style.width = `${STRING_REST}px`;

    // Shake & show answer after snap-back
    setTimeout(() => {
      conchDraggable.classList.add('speaking');
      conchHint.classList.add('hidden');
      setTimeout(() => {
        conchAnswer.classList.add('show');

        // Check quiz answers & auto-submit after 3 seconds
        const a1 = document.getElementById('q1').value.trim().toLowerCase();
        const a2 = Number(document.getElementById('q2').value);

        if (a1 === 'yes' && a2 >= Number(document.getElementById('q2').max)) {
          setTimeout(() => {
            revealLetters(STAGE_LETTERS[4]);  // M, Y
            goToStage(5);
          }, 3000);
        } else {
          setTimeout(() => {
            const err = document.getElementById('quiz-error');
            err.classList.add('show');
            // Allow re-pulling after wrong answers
            conchPulled = false;
            conchDraggable.classList.remove('speaking', 'snap-back');
            conchString.classList.remove('snap-back');
            conchAnswer.classList.remove('show');
            setTimeout(() => err.classList.remove('show'), 2500);
          }, 3000);
        }
      }, 350);
    }, 420);
  } else if (!conchPulled) {
    // ── Didn't pull far enough — snap back ──
    conchDraggable.classList.add('snap-back');
    conchString.classList.add('snap-back');
    conchDraggable.style.transform = 'translateX(0)';
    conchString.style.width = `${STRING_REST}px`;
    dragOffset = 0;
  }
});

// Prevent Enter key from reloading — no submit button, conch handles it
document.getElementById('quiz-form').addEventListener('submit', e => e.preventDefault());

/* ══════════════════════════════════════════════════════════════
   8.  STAGE 5 — PROPOSAL
   ══════════════════════════════════════════════════════════════ */
let proposalInitialised = false;

function initProposal() {
  if (proposalInitialised) return;
  proposalInitialised = true;

  const stage5          = document.getElementById('stage-5');
  const phraseContainer = document.getElementById('proposal-phrase');
  const spinnerEl       = document.getElementById('word-spinner');
  const spinnerTrack    = document.getElementById('word-spinner-track');
  const btnYes          = document.getElementById('btn-yes');

  // ── Word list for the spinner (final word is always the target) ──
  const SPIN_WORDS = [
    'WIFE?', 'FIANCÉE?', 'SOULMATE?', 'POOKIE?', 'BETTER HALF?', 'PARTNER?'
  ];
  const FINAL_WORD = 'VALENTINE?';
  const WORD_HEIGHT = 60;            // matches CSS #word-spinner height
  const SPIN_CYCLES = 4;             // how many times to loop the list before landing

  // Build the track: repeat the word list several times, then end on FINAL_WORD
  const allWords = [];
  for (let c = 0; c < SPIN_CYCLES; c++) allWords.push(...SPIN_WORDS);
  allWords.push(FINAL_WORD);

  allWords.forEach((word, i) => {
    const div = document.createElement('div');
    div.className = 'spin-word' + (i === allWords.length - 1 ? ' final' : '');
    div.textContent = word;
    spinnerTrack.appendChild(div);
  });

  // ── Build landing slots in #proposal-phrase ──
  const landingSlots = [];
  PHRASE_CHARS.forEach((entry, i) => {
    const span = document.createElement('span');
    span.className = 'phrase-letter';
    span.textContent = entry.char;
    phraseContainer.appendChild(span);
    landingSlots.push(span);

    if (entry.gap) {
      const spacer = document.createElement('span');
      spacer.className = 'phrase-space';
      phraseContainer.appendChild(spacer);
    }
  });

  // ── Animate letters from tracker to centre ──
  requestAnimationFrame(() => {
    const trackerChars = trackerEl.querySelectorAll('.lt-char[data-idx]');
    const flyingEls = [];

    trackerChars.forEach((srcSpan) => {
      const idx = Number(srcSpan.dataset.idx);
      const srcRect  = srcSpan.getBoundingClientRect();
      const destRect = landingSlots[idx].getBoundingClientRect();

      const fly = document.createElement('span');
      fly.className = 'flying-letter';
      fly.textContent = PHRASE_CHARS[idx].char;

      fly.style.left     = `${srcRect.left}px`;
      fly.style.top      = `${srcRect.top}px`;
      fly.style.width    = `${srcRect.width}px`;
      fly.style.height   = `${srcRect.height}px`;
      fly.style.fontSize = '1rem';

      document.body.appendChild(fly);
      flyingEls.push({ el: fly, idx, destRect });
    });

    // Hide the tracker bar
    trackerEl.style.opacity = '0';
    trackerEl.style.transition = 'opacity .3s';

    // Fly letters to their landing positions
    requestAnimationFrame(() => {
      flyingEls.forEach(({ el, idx, destRect }, i) => {
        el.style.transitionDelay = `${i * 0.07}s`;
        el.style.left     = `${destRect.left}px`;
        el.style.top      = `${destRect.top}px`;
        el.style.width    = `${destRect.width}px`;
        el.style.height   = `${destRect.height}px`;
        el.style.fontSize = '2.4rem';
      });

      const totalDuration = (flyingEls.length * 70) + 1000;
      setTimeout(() => {
        // Show landed letters, clean up clones
        landingSlots.forEach(s => s.classList.add('landed'));
        flyingEls.forEach(({ el }) => el.remove());

        // Start the word spinner
        spinnerEl.classList.add('visible');
        requestAnimationFrame(() => {
          const targetOffset = -(allWords.length - 1) * WORD_HEIGHT;
          spinnerTrack.style.transform = `translateY(${targetOffset}px)`;
        });
      }, totalDuration);
    });
  });

  // ── "YES" button follows cursor ──
  btnYes.style.left = `${window.innerWidth / 2}px`;
  btnYes.style.top  = `${window.innerHeight / 2 + 80}px`;

  stage5.addEventListener('mousemove', (e) => {
    btnYes.style.left = `${e.clientX}px`;
    btnYes.style.top  = `${e.clientY}px`;
  });

  let yesClickedOnce = false;

  btnYes.addEventListener('click', () => {
    // Always launch confetti on every click
    launchConfetti();

    // Only start the transition timer on the FIRST click
    if (!yesClickedOnce) {
      yesClickedOnce = true;
      const fadeOverlay = document.getElementById('fade-overlay');

      setTimeout(() => {
        // Fade to black
        fadeOverlay.style.opacity = '1';
        fadeOverlay.style.pointerEvents = 'auto';

        // After the 2s fade finishes, switch to photo matrix
        setTimeout(() => {
          goToStage(6);
          initPhotoMatrix();
          // Fade back out to reveal photos
          fadeOverlay.style.opacity = '0';
          fadeOverlay.style.pointerEvents = 'none';
        }, 2000);
      }, 4000);
    }
  });
}

/* ══════════════════════════════════════════════════════════════
   9.  STAGE 6 — PHOTO MATRIX
   ══════════════════════════════════════════════════════════════ */
async function initPhotoMatrix() {
  const container = document.getElementById('photo-matrix');
  container.innerHTML = '';

  // Fetch image list from manifest (regenerate with:
  //   ls -1 images/ | python3 -c "import sys,json; print(json.dumps(sorted(l.strip() for l in sys.stdin if l.strip()),indent=2))" > images/manifest.json
  // )
  let images;
  try {
    const res = await fetch('images/manifest.json');
    const filenames = await res.json();
    images = filenames.map(f => `images/${f}`);
  } catch {
    console.warn('Could not load images/manifest.json');
    return;
  }

  const COLUMN_COUNT = 5;

  for (let col = 0; col < COLUMN_COUNT; col++) {
    const colDiv = document.createElement('div');
    colDiv.className = 'photo-column';

    const track = document.createElement('div');
    track.className = 'photo-track';

    // Alternate direction: even columns scroll up, odd scroll down
    if (col % 2 === 1) track.classList.add('down');

    // Shuffle a copy for this column
    const shuffled = [...images].sort(() => Math.random() - 0.5);

    // Pick a subset so columns aren't all the same length — use 8-10 images
    const pick = shuffled.slice(0, 8 + Math.floor(Math.random() * 3));

    // Duplicate for seamless infinite loop
    const displayList = [...pick, ...pick];

    displayList.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.loading = 'lazy';
      track.appendChild(img);
    });

    // Randomise speed (15–30s) and stagger start
    const duration = 15 + Math.random() * 15;
    track.style.animationDuration = `${duration}s`;
    track.style.animationDelay = `-${Math.random() * duration}s`;

    colDiv.appendChild(track);
    container.appendChild(colDiv);
  }
}

/* ══════════════════════════════════════════════════════════════
   10. CONFETTI
   ══════════════════════════════════════════════════════════════ */
function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#e63946', '#ff4d6d', '#ffd60a', '#06d6a0', '#457b9d', '#f4a261', '#fff'];

  for (let i = 0; i < 120; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left            = `${Math.random() * 100}%`;
    piece.style.background      = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width           = `${6 + Math.random() * 8}px`;
    piece.style.height          = `${6 + Math.random() * 8}px`;
    piece.style.borderRadius    = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration = `${1.5 + Math.random() * 2.5}s`;
    piece.style.animationDelay    = `${Math.random() * 1.2}s`;
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 5000);
}

/* ══════════════════════════════════════════════════════════════
   11. BOOT — RESUME SAVED PROGRESS
   ══════════════════════════════════════════════════════════════ */
if (gameState.currentStage > 0) {
  goToStage(gameState.currentStage);
}
