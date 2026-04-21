// ============================================================
// Container Calculator — app.js (v2 — with fixes)
// ============================================================

// --- Constants ---
const CONTAINERS = {
  20: { label: '20ft', lengthIn: 232, widthIn: 92, heightIn: 94 },
  40: { label: '40ft', lengthIn: 473, widthIn: 92, heightIn: 94 },
};

const ROOM_COLORS = [
  '#e94560', '#4ade80', '#60a5fa', '#fbbf24',
  '#a78bfa', '#fb923c', '#34d399', '#f472b6',
  '#38bdf8', '#facc15', '#c084fc', '#fb7185',
];

const PRESETS = {
  'wardrobe-box': { name: 'Wardrobe Box', l: 24, w: 21, h: 46 },
  'book-box':     { name: 'Book Box',     l: 18, w: 18, h: 16 },
  'medium-box':   { name: 'Medium Box',   l: 18, w: 18, h: 24 },
  'small-box':    { name: 'Small Box',    l: 16, w: 12, h: 12 },
  'artwork-box':  { name: 'Artwork Box',  l: 40, w: 6,  h: 30 },
};

// --- State ---
let containerSize = 20;
let rooms = [];
let nextRoomId = 1;
let nextItemId = 1;
let addItemTargetRoomId = null;
let wireframeMode = false;

// --- Hover / highlight state ---
let highlightedItemId = null;   // item id currently hovered in list
let hoveredMeshItemId = null;   // item id currently hovered in 3D
let packedMeshes = [];          // array of { mesh, edgeMesh, itemId, roomId, color }
let raycaster, mouse;

// --- Three.js globals ---
let scene, camera, renderer, controls;
let containerGroup, itemsGroup;

// ============================================================
// DATA: Pre-populated inventory
// ============================================================
function getDefaultRooms() {
  return [
    {
      id: nextRoomId++, name: 'Living Room / Dining', collapsed: true,
      items: [
        { id: nextItemId++, name: 'L-shaped Sectional Sofa', l: 100, w: 80, h: 35, qty: 1 },
        { id: nextItemId++, name: 'Leather Accent Chair',    l: 30,  w: 30, h: 35, qty: 1 },
        { id: nextItemId++, name: 'Round Coffee Table',      l: 36,  w: 36, h: 18, qty: 1 },
        { id: nextItemId++, name: 'Dining Table',            l: 60,  w: 35, h: 30, qty: 1 },
        { id: nextItemId++, name: 'Eames DSR Chair',         l: 18,  w: 20, h: 32, qty: 6 },
        { id: nextItemId++, name: '78" TV Crate',            l: 75,  w: 8,  h: 45, qty: 1 },
        { id: nextItemId++, name: 'Wood Bookshelf (Reseda)', l: 40,  w: 15, h: 72, qty: 1 },
        { id: nextItemId++, name: 'Vitsoe Shelving (disasm)',l: 48,  w: 12, h: 6,  qty: 1 },
        { id: nextItemId++, name: 'Digital Piano (Roland)',  l: 55,  w: 16, h: 35, qty: 1 },
        { id: nextItemId++, name: 'Piano Bench',             l: 30,  w: 14, h: 20, qty: 1 },
        { id: nextItemId++, name: 'Sonos Sub',               l: 14,  w: 14, h: 15, qty: 1 },
        { id: nextItemId++, name: 'Robot Vacuum',            l: 14,  w: 14, h: 5,  qty: 1 },
      ]
    },
    {
      id: nextRoomId++, name: "Kids' Room", collapsed: true,
      items: [
        { id: nextItemId++, name: 'Twin Bed Frame',           l: 75, w: 40, h: 12, qty: 2 },
        { id: nextItemId++, name: 'Twin Mattress',            l: 75, w: 38, h: 10, qty: 2 },
        { id: nextItemId++, name: 'Daybed',                   l: 75, w: 30, h: 14, qty: 1 },
        { id: nextItemId++, name: 'Vitsoe Shelving (disasm)', l: 48, w: 12, h: 6,  qty: 1 },
        { id: nextItemId++, name: 'Desk',                     l: 40, w: 20, h: 30, qty: 1 },
        { id: nextItemId++, name: 'IKEA ALEX Drawer Unit',    l: 14, w: 19, h: 28, qty: 1 },
        { id: nextItemId++, name: 'Desk Chair',               l: 20, w: 20, h: 32, qty: 1 },
      ]
    },
    {
      id: nextRoomId++, name: "Parents' Bedroom", collapsed: true,
      items: [
        { id: nextItemId++, name: 'King Bed Frame',   l: 82, w: 76, h: 12, qty: 1 },
        { id: nextItemId++, name: 'King Mattress',    l: 80, w: 76, h: 12, qty: 1 },
        { id: nextItemId++, name: 'Nightstand',       l: 15, w: 15, h: 20, qty: 1 },
        { id: nextItemId++, name: 'Table Lamp Box',   l: 12, w: 12, h: 18, qty: 1 },
        { id: nextItemId++, name: 'Area Rug (rolled)',l: 60, w: 12, h: 12, qty: 1 },
      ]
    },
    {
      id: nextRoomId++, name: 'Office / Guest Room', collapsed: true,
      items: [
        { id: nextItemId++, name: 'Vitsoe + Drawers (disasm)', l: 60, w: 16, h: 8,  qty: 1 },
        { id: nextItemId++, name: 'Large Desk',                l: 60, w: 30, h: 30, qty: 1 },
        { id: nextItemId++, name: 'Ultrawide Monitor Box',     l: 40, w: 12, h: 24, qty: 1 },
        { id: nextItemId++, name: 'Canon PRO Printer',         l: 28, w: 20, h: 12, qty: 1 },
        { id: nextItemId++, name: 'Printer Cart',              l: 24, w: 18, h: 30, qty: 1 },
        { id: nextItemId++, name: 'Turntable Box',             l: 20, w: 16, h: 8,  qty: 1 },
        { id: nextItemId++, name: 'Amplifier Box',             l: 18, w: 14, h: 8,  qty: 1 },
        { id: nextItemId++, name: 'Floor Lamp Box',            l: 60, w: 8,  h: 8,  qty: 1 },
        { id: nextItemId++, name: 'Equipment Case',            l: 24, w: 18, h: 10, qty: 1 },
      ]
    },
    {
      id: nextRoomId++, name: 'Boxes — Wardrobes', collapsed: true,
      items: [
        { id: nextItemId++, name: 'Wardrobe Box (Kids)',    l: 24, w: 21, h: 46, qty: 3 },
        { id: nextItemId++, name: 'Wardrobe Box (Parents)', l: 24, w: 21, h: 46, qty: 3 },
        { id: nextItemId++, name: 'Wardrobe Box (Hallway)', l: 24, w: 21, h: 46, qty: 3 },
      ]
    },
    {
      id: nextRoomId++, name: 'Boxes — Contents', collapsed: true,
      items: [
        { id: nextItemId++, name: 'Book Box',    l: 18, w: 18, h: 16, qty: 6 },
        { id: nextItemId++, name: 'Vinyl Record Box', l: 18, w: 18, h: 16, qty: 5 },
        { id: nextItemId++, name: 'Medium Box (Kitchen)',  l: 18, w: 18, h: 24, qty: 5 },
        { id: nextItemId++, name: 'Medium Box (Hallway Cabinets)', l: 18, w: 18, h: 24, qty: 6 },
        { id: nextItemId++, name: 'Medium Box (Misc)',  l: 18, w: 18, h: 24, qty: 5 },
        { id: nextItemId++, name: 'Small Box (Bathroom)', l: 16, w: 12, h: 12, qty: 2 },
        { id: nextItemId++, name: 'Artwork Box', l: 40, w: 6, h: 30, qty: 2 },
      ]
    },
  ];
}

// ============================================================
// INIT
// ============================================================
function init() {
  if (!loadFromHash()) {
    rooms = getDefaultRooms();
  }
  initThree();
  renderAll();
  window.addEventListener('resize', onResize);
}

// ============================================================
// UI RENDERING
// ============================================================
function renderAll() {
  renderRooms();
  updateStats();
  render3D();
}

function renderRooms() {
  const container = document.getElementById('rooms-container');
  container.innerHTML = '';
  rooms.forEach((room, ri) => {
    const color = ROOM_COLORS[ri % ROOM_COLORS.length];
    const vol = roomVolumeCuFt(room);
    const totalItems = room.items.reduce((s, it) => s + it.qty, 0);

    const card = document.createElement('div');
    card.className = 'room-card';
    card.innerHTML = `
      <div class="room-header" onclick="toggleRoom(${room.id})">
        <div class="room-color-dot" style="background:${color}"></div>
        <span class="room-name">${esc(room.name)}</span>
        <span class="room-volume">${totalItems} items · ${vol} cu ft</span>
        <div class="room-actions">
          <button class="btn-icon" onclick="event.stopPropagation(); openAddItem(${room.id})" title="Add item">+</button>
          <button class="btn-icon delete" onclick="event.stopPropagation(); removeRoom(${room.id})" title="Remove room">✕</button>
        </div>
        <span class="room-chevron ${room.collapsed ? '' : 'open'}">▶</span>
      </div>
      <div class="room-items ${room.collapsed ? '' : 'open'}">
        ${room.items.map(it => itemRowHTML(it, room.id)).join('')}
        <button class="btn-add-item" onclick="openAddItem(${room.id})">+ Add item</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function itemRowHTML(it, roomId) {
  const vol = ((it.l * it.w * it.h * it.qty) / 1728).toFixed(1);
  return `
    <div class="item-row" data-item-id="${it.id}"
         onmouseenter="highlightItem(${it.id})"
         onmouseleave="unhighlightItem()">
      <span class="item-name">${esc(it.name)}</span>
      <div class="qty-controls">
        <button class="qty-btn" onclick="event.stopPropagation(); changeQty(${roomId}, ${it.id}, -1)" title="Decrease">−</button>
        <span class="item-qty-value">${it.qty}</span>
        <button class="qty-btn" onclick="event.stopPropagation(); changeQty(${roomId}, ${it.id}, 1)" title="Increase">+</button>
      </div>
      <span class="item-dims">${it.l}×${it.w}×${it.h}"</span>
      <span class="item-vol">${vol} ft³</span>
      <button class="btn-remove-item" onclick="removeItem(${roomId}, ${it.id})" title="Remove">✕</button>
    </div>
  `;
}

function updateStats() {
  const cont = CONTAINERS[containerSize];
  const totalVol = cont.lengthIn * cont.widthIn * cont.heightIn / 1728;
  const usedVol = totalUsedCuFt();
  const remaining = Math.max(0, totalVol - usedVol);
  const pct = Math.min(100, (usedVol / totalVol) * 100);

  document.getElementById('stat-used').textContent = `${usedVol.toFixed(0)} cu ft`;
  document.getElementById('stat-remaining').textContent = `${remaining.toFixed(0)} cu ft`;
  document.getElementById('stat-items').textContent = totalItemCount();

  const bar = document.getElementById('fill-bar');
  bar.style.width = pct + '%';
  bar.className = 'fill-bar' + (pct > 90 ? ' danger' : pct > 70 ? ' warning' : '');
  document.getElementById('fill-label').textContent = pct.toFixed(1) + '%';
}

// ============================================================
// ROOM / ITEM LOGIC
// ============================================================
function toggleRoom(id) {
  const room = rooms.find(r => r.id === id);
  if (room) { room.collapsed = !room.collapsed; renderRooms(); }
}

function addRoomPrompt() {
  document.getElementById('input-room-name').value = '';
  document.getElementById('modal-add-room').style.display = 'flex';
  setTimeout(() => document.getElementById('input-room-name').focus(), 50);
}

function confirmAddRoom() {
  const name = document.getElementById('input-room-name').value.trim();
  if (!name) return;
  rooms.push({ id: nextRoomId++, name, collapsed: false, items: [] });
  closeModal('modal-add-room');
  renderAll();
}

function removeRoom(id) {
  rooms = rooms.filter(r => r.id !== id);
  renderAll();
}

function openAddItem(roomId) {
  addItemTargetRoomId = roomId;
  document.getElementById('input-item-name').value = '';
  document.getElementById('input-item-l').value = 18;
  document.getElementById('input-item-w').value = 18;
  document.getElementById('input-item-h').value = 24;
  document.getElementById('input-item-qty').value = 1;
  document.getElementById('modal-add-item').style.display = 'flex';
  setTimeout(() => document.getElementById('input-item-name').focus(), 50);
}

function confirmAddItem() {
  const name = document.getElementById('input-item-name').value.trim();
  const l = parseInt(document.getElementById('input-item-l').value) || 18;
  const w = parseInt(document.getElementById('input-item-w').value) || 18;
  const h = parseInt(document.getElementById('input-item-h').value) || 24;
  const qty = parseInt(document.getElementById('input-item-qty').value) || 1;
  if (!name) return;

  const room = rooms.find(r => r.id === addItemTargetRoomId);
  if (room) {
    room.items.push({ id: nextItemId++, name, l, w, h, qty });
    room.collapsed = false;
  }
  closeModal('modal-add-item');
  renderAll();
}

function removeItem(roomId, itemId) {
  const room = rooms.find(r => r.id === roomId);
  if (room) {
    room.items = room.items.filter(it => it.id !== itemId);
    renderAll();
  }
}

function changeQty(roomId, itemId, delta) {
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;
  const item = room.items.find(it => it.id === itemId);
  if (!item) return;
  item.qty = Math.max(0, item.qty + delta);
  if (item.qty === 0) {
    room.items = room.items.filter(it => it.id !== itemId);
  }
  renderAll();
}

function applyPreset(key) {
  const p = PRESETS[key];
  if (!p) return;
  document.getElementById('input-item-name').value = p.name;
  document.getElementById('input-item-l').value = p.l;
  document.getElementById('input-item-w').value = p.w;
  document.getElementById('input-item-h').value = p.h;
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (document.getElementById('modal-add-room').style.display === 'flex') confirmAddRoom();
    else if (document.getElementById('modal-add-item').style.display === 'flex') confirmAddItem();
  }
  if (e.key === 'Escape') {
    closeModal('modal-add-room');
    closeModal('modal-add-item');
  }
});

// ============================================================
// HOVER / HIGHLIGHT
// ============================================================
function highlightItem(itemId) {
  highlightedItemId = itemId;
  applyHighlights();
}

function unhighlightItem() {
  highlightedItemId = null;
  applyHighlights();
}

function applyHighlights() {
  const activeId = highlightedItemId || hoveredMeshItemId;

  // Highlight 3D meshes
  packedMeshes.forEach(pm => {
    if (!pm.mesh || !pm.mesh.material) return;
    if (activeId && pm.itemId === activeId) {
      pm.mesh.material.emissive = new THREE.Color(0xffffff);
      pm.mesh.material.emissiveIntensity = 0.35;
      pm.mesh.material.opacity = 1.0;
      if (pm.edgeMesh && pm.edgeMesh.material) {
        pm.edgeMesh.material.color = new THREE.Color(0xffffff);
        pm.edgeMesh.material.opacity = 1.0;
      }
    } else if (activeId && pm.itemId !== activeId) {
      pm.mesh.material.emissive = new THREE.Color(0x000000);
      pm.mesh.material.emissiveIntensity = 0;
      pm.mesh.material.opacity = 0.25;
      if (pm.edgeMesh && pm.edgeMesh.material) {
        pm.edgeMesh.material.color = new THREE.Color(0x000000);
        pm.edgeMesh.material.opacity = 0.1;
      }
    } else {
      pm.mesh.material.emissive = new THREE.Color(0x000000);
      pm.mesh.material.emissiveIntensity = 0;
      pm.mesh.material.opacity = 0.85;
      if (pm.edgeMesh && pm.edgeMesh.material) {
        pm.edgeMesh.material.color = new THREE.Color(0x000000);
        pm.edgeMesh.material.opacity = 0.3;
      }
    }
  });

  // Highlight list rows
  document.querySelectorAll('.item-row').forEach(row => {
    const rid = parseInt(row.dataset.itemId);
    if (activeId && rid === activeId) {
      row.classList.add('highlighted');
    } else {
      row.classList.remove('highlighted');
    }
  });
}

// ============================================================
// CALCULATIONS
// ============================================================
function roomVolumeCuFt(room) {
  return room.items.reduce((s, it) => s + (it.l * it.w * it.h * it.qty) / 1728, 0).toFixed(0);
}

function totalUsedCuFt() {
  return rooms.reduce((s, r) => s + r.items.reduce((s2, it) => s2 + (it.l * it.w * it.h * it.qty) / 1728, 0), 0);
}

function totalItemCount() {
  return rooms.reduce((s, r) => s + r.items.reduce((s2, it) => s2 + it.qty, 0), 0);
}

function setContainer(size) {
  containerSize = size;
  document.getElementById('btn-20ft').classList.toggle('active', size === 20);
  document.getElementById('btn-40ft').classList.toggle('active', size === 40);
  renderAll();
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ============================================================
// THREE.JS — 3D Visualization
// ============================================================
const SCALE = 0.01;

function initThree() {
  const el = document.getElementById('three-container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f0f23);

  camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 100);

  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(el.clientWidth, el.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 8, 5);
  scene.add(dirLight);

  containerGroup = new THREE.Group();
  itemsGroup = new THREE.Group();
  scene.add(containerGroup);
  scene.add(itemsGroup);

  // Raycaster for hover
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  renderer.domElement.addEventListener('mousemove', onMouseMove3D);
  renderer.domElement.addEventListener('mouseleave', () => {
    hoveredMeshItemId = null;
    applyHighlights();
  });

  resetCamera();
  animate();
}

function onMouseMove3D(event) {
  const el = renderer.domElement;
  const rect = el.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const meshes = packedMeshes.filter(pm => pm.mesh).map(pm => pm.mesh);
  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;
    const pm = packedMeshes.find(p => p.mesh === hitMesh);
    if (pm && pm.itemId !== hoveredMeshItemId) {
      hoveredMeshItemId = pm.itemId;
      applyHighlights();
    }
  } else if (hoveredMeshItemId !== null) {
    hoveredMeshItemId = null;
    applyHighlights();
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onResize() {
  const el = document.getElementById('three-container');
  camera.aspect = el.clientWidth / el.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(el.clientWidth, el.clientHeight);
}

function resetCamera() {
  const cont = CONTAINERS[containerSize];
  const cLen = cont.lengthIn * SCALE;
  const cWid = cont.widthIn * SCALE;
  const cHei = cont.heightIn * SCALE;

  camera.position.set(cLen * 0.8, cHei * 1.5, cWid * 2.5);
  camera.lookAt(cLen / 2, cHei / 3, 0);
  controls.target.set(cLen / 2, cHei / 3, 0);
  controls.update();
}

function toggleWireframe() {
  wireframeMode = !wireframeMode;
  render3D();
}

// ============================================================
// 3D RENDERING
// ============================================================
function render3D() {
  while (containerGroup.children.length) containerGroup.remove(containerGroup.children[0]);
  while (itemsGroup.children.length) itemsGroup.remove(itemsGroup.children[0]);
  packedMeshes = [];

  const cont = CONTAINERS[containerSize];
  const cL = cont.lengthIn * SCALE;
  const cW = cont.widthIn * SCALE;
  const cH = cont.heightIn * SCALE;

  // === CONTAINER FRAME — Strong, visible ===
  // Draw thick container edges using cylinders for each edge
  const edgeColor = 0x7eb8da;
  const edgeRadius = 0.008;

  // Helper to draw a thick edge between two points
  function drawEdge(x1, y1, z1, x2, y2, z2) {
    const dir = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(edgeRadius, edgeRadius, len, 6);
    const mat = new THREE.MeshBasicMaterial({ color: edgeColor });
    const mesh = new THREE.Mesh(geo, mat);
    const mid = new THREE.Vector3((x1+x2)/2, (y1+y2)/2, (z1+z2)/2);
    mesh.position.copy(mid);
    dir.normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    mesh.setRotationFromQuaternion(quat);
    containerGroup.add(mesh);
  }

  // Bottom edges
  const hw = cW / 2;
  drawEdge(0, 0, -hw,  cL, 0, -hw);
  drawEdge(0, 0, hw,   cL, 0, hw);
  drawEdge(0, 0, -hw,  0,  0, hw);
  drawEdge(cL, 0, -hw, cL, 0, hw);
  // Top edges
  drawEdge(0, cH, -hw,  cL, cH, -hw);
  drawEdge(0, cH, hw,   cL, cH, hw);
  drawEdge(0, cH, -hw,  0,  cH, hw);
  drawEdge(cL, cH, -hw, cL, cH, hw);
  // Vertical edges
  drawEdge(0, 0, -hw,   0, cH, -hw);
  drawEdge(cL, 0, -hw,  cL, cH, -hw);
  drawEdge(0, 0, hw,    0, cH, hw);
  drawEdge(cL, 0, hw,   cL, cH, hw);

  // Corner posts — small spheres
  const cornerGeo = new THREE.SphereGeometry(edgeRadius * 1.5, 8, 8);
  const cornerMat = new THREE.MeshBasicMaterial({ color: edgeColor });
  [[0,0,-hw],[cL,0,-hw],[0,0,hw],[cL,0,hw],
   [0,cH,-hw],[cL,cH,-hw],[0,cH,hw],[cL,cH,hw]].forEach(p => {
    const s = new THREE.Mesh(cornerGeo, cornerMat);
    s.position.set(p[0], p[1], p[2]);
    containerGroup.add(s);
  });

  // Floor grid inside container
  const gridStep = 12 * SCALE; // 12 inch grid
  const gridMat = new THREE.LineBasicMaterial({ color: 0x2a3a5a, transparent: true, opacity: 0.4 });
  // Lines along length
  for (let z = -hw; z <= hw + 0.001; z += gridStep) {
    const points = [new THREE.Vector3(0, 0.001, z), new THREE.Vector3(cL, 0.001, z)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    containerGroup.add(new THREE.Line(geo, gridMat));
  }
  // Lines along width
  for (let x = 0; x <= cL + 0.001; x += gridStep) {
    const points = [new THREE.Vector3(x, 0.001, -hw), new THREE.Vector3(x, 0.001, hw)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    containerGroup.add(new THREE.Line(geo, gridMat));
  }

  // Semi-transparent floor
  const floorGeo = new THREE.PlaneGeometry(cL, cW);
  const floorMat = new THREE.MeshBasicMaterial({ color: 0x1a2040, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cL / 2, 0.0005, 0);
  containerGroup.add(floor);

  // Semi-transparent back wall
  const backGeo = new THREE.PlaneGeometry(cW, cH);
  const backMat = new THREE.MeshBasicMaterial({ color: 0x1a1a3e, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
  const backWall = new THREE.Mesh(backGeo, backMat);
  backWall.rotation.y = Math.PI / 2;
  backWall.position.set(0, cH / 2, 0);
  containerGroup.add(backWall);

  // Pack items
  const packed = binPack(cont);
  packed.forEach(p => {
    const il = p.l * SCALE;
    const iw = p.w * SCALE;
    const ih = p.h * SCALE;
    const color = new THREE.Color(p.color);
    const geo = new THREE.BoxGeometry(il, ih, iw);

    if (wireframeMode) {
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: color });
      const mesh = new THREE.LineSegments(edgeGeo, edgeMat);
      mesh.position.set(p.x * SCALE + il / 2, p.y * SCALE + ih / 2, p.z * SCALE + iw / 2 - cW / 2);
      itemsGroup.add(mesh);
      packedMeshes.push({ mesh, edgeMesh: null, itemId: p.itemId, roomId: p.roomId, color: p.color });
    } else {
      const mat = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.85,
        shininess: 30,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x * SCALE + il / 2, p.y * SCALE + ih / 2, p.z * SCALE + iw / 2 - cW / 2);
      itemsGroup.add(mesh);

      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
      const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeMesh.position.copy(mesh.position);
      itemsGroup.add(edgeMesh);

      packedMeshes.push({ mesh, edgeMesh, itemId: p.itemId, roomId: p.roomId, color: p.color });
    }
  });

  // Show overflow warning
  const overflowEl = document.getElementById('overflow-warning');
  if (packed.length < totalItemCount()) {
    const missed = totalItemCount() - packed.length;
    if (overflowEl) {
      overflowEl.textContent = `⚠️ ${missed} item${missed > 1 ? 's' : ''} couldn't fit in the container!`;
      overflowEl.style.display = 'block';
    }
  } else {
    if (overflowEl) overflowEl.style.display = 'none';
  }

  resetCamera();
}

// ============================================================
// BIN PACKING — Improved guillotine-style 3D packing
// ============================================================
function binPack(cont) {
  const cL = cont.lengthIn;
  const cW = cont.widthIn;
  const cH = cont.heightIn;

  // Flatten all items (expand qty) with metadata
  const allItems = [];
  rooms.forEach((room, ri) => {
    const color = ROOM_COLORS[ri % ROOM_COLORS.length];
    room.items.forEach(item => {
      for (let q = 0; q < item.qty; q++) {
        // Try orientations: we want to pack with largest face on the bottom
        // Sort dims to get consistent orientations
        const dims = [item.l, item.w, item.h].sort((a, b) => b - a);
        allItems.push({
          name: item.name,
          itemId: item.id,
          roomId: room.id,
          // Orient: longest along container length, second longest along width, shortest as height
          // But for tall things (like wardrobe boxes), keep height tall
          l: dims[0],
          w: dims[1],
          h: dims[2],
          color: color,
          volume: dims[0] * dims[1] * dims[2],
          maxDim: dims[0],
        });
      }
    });
  });

  // Sort by volume descending, then by max dimension descending
  allItems.sort((a, b) => {
    if (b.volume !== a.volume) return b.volume - a.volume;
    return b.maxDim - a.maxDim;
  });

  // Free space rectangles (guillotine approach)
  // Each space: { x, y, z, l (along length), w (along width), h (along height) }
  let freeSpaces = [{ x: 0, y: 0, z: 0, l: cL, w: cW, h: cH }];

  const placed = [];

  for (const item of allItems) {
    // Try all 6 orientations
    const orientations = getOrientations(item.l, item.w, item.h);
    let bestSpace = null;
    let bestOri = null;
    let bestScore = Infinity;

    for (const ori of orientations) {
      for (const space of freeSpaces) {
        if (ori.l <= space.l && ori.w <= space.w && ori.h <= space.h) {
          // Score: prefer lower y (bottom), then smaller x (back), then smaller z
          const score = space.y * 10000 + space.x * 100 + space.z;
          if (score < bestScore) {
            bestScore = score;
            bestSpace = space;
            bestOri = ori;
          }
        }
      }
    }

    if (bestSpace && bestOri) {
      placed.push({
        x: bestSpace.x,
        y: bestSpace.y,
        z: bestSpace.z,
        l: bestOri.l,
        w: bestOri.w,
        h: bestOri.h,
        color: item.color,
        name: item.name,
        itemId: item.itemId,
        roomId: item.roomId,
      });

      // Remove this free space and split into up to 3 new spaces
      freeSpaces = freeSpaces.filter(s => s !== bestSpace);

      // Space to the right (along length)
      const rightL = bestSpace.l - bestOri.l;
      if (rightL > 0) {
        freeSpaces.push({
          x: bestSpace.x + bestOri.l,
          y: bestSpace.y,
          z: bestSpace.z,
          l: rightL,
          w: bestSpace.w,
          h: bestSpace.h,
        });
      }

      // Space in front (along width)
      const frontW = bestSpace.w - bestOri.w;
      if (frontW > 0) {
        freeSpaces.push({
          x: bestSpace.x,
          y: bestSpace.y,
          z: bestSpace.z + bestOri.w,
          l: bestOri.l,
          w: frontW,
          h: bestSpace.h,
        });
      }

      // Space above (along height)
      const aboveH = bestSpace.h - bestOri.h;
      if (aboveH > 0) {
        freeSpaces.push({
          x: bestSpace.x,
          y: bestSpace.y + bestOri.h,
          z: bestSpace.z,
          l: bestOri.l,
          w: bestOri.w,
          h: aboveH,
        });
      }

      // Sort free spaces: prefer bottom first, then back, then left
      freeSpaces.sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        if (a.x !== b.x) return a.x - b.x;
        return a.z - b.z;
      });
    }
    // If no space found, item is skipped (overflow)
  }

  return placed;
}

function getOrientations(l, w, h) {
  // Return all 6 unique orientations (l along length, w along width, h as height)
  const perms = [
    { l, w, h },
    { l, w: h, h: w },
    { l: w, w: l, h },
    { l: w, w: h, h: l },
    { l: h, w: l, h: w },
    { l: h, w, h: l },
  ];
  // Deduplicate
  const seen = new Set();
  return perms.filter(p => {
    const key = `${p.l},${p.w},${p.h}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================
// SHARE / SAVE
// ============================================================
function getState() {
  return {
    v: 1,
    containerSize,
    rooms: rooms.map(r => ({
      name: r.name,
      items: r.items.map(it => ({
        name: it.name, l: it.l, w: it.w, h: it.h, qty: it.qty
      }))
    }))
  };
}

function setState(state) {
  if (!state || !state.rooms) return false;
  containerSize = state.containerSize || 20;
  document.getElementById('btn-20ft').classList.toggle('active', containerSize === 20);
  document.getElementById('btn-40ft').classList.toggle('active', containerSize === 40);

  nextRoomId = 1;
  nextItemId = 1;
  rooms = state.rooms.map(r => ({
    id: nextRoomId++,
    name: r.name,
    collapsed: true,
    items: (r.items || []).map(it => ({
      id: nextItemId++,
      name: it.name, l: it.l, w: it.w, h: it.h, qty: it.qty
    }))
  }));
  return true;
}

function loadFromHash() {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return false;
  try {
    const compressed = hash.substring(1);
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) return false;
    const state = JSON.parse(json);
    if (setState(state)) {
      document.getElementById('shared-banner').style.display = 'block';
      return true;
    }
  } catch (e) {
    console.warn('Failed to load state from URL:', e);
  }
  return false;
}

function shareLayout() {
  const state = getState();
  const json = JSON.stringify(state);
  const compressed = LZString.compressToEncodedURIComponent(json);
  const url = window.location.origin + window.location.pathname + '#' + compressed;
  history.replaceState(null, '', '#' + compressed);

  navigator.clipboard.writeText(url).then(() => {
    showToast('🔗 Link copied! Share this URL with your shipping company');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('🔗 Link copied! Share this URL with your shipping company');
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

function dismissBanner() {
  document.getElementById('shared-banner').style.display = 'none';
}

// ============================================================
// EXPORT PDF
// ============================================================
async function exportPDF() {
  showToast('📄 Generating PDF…');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Container Calculator', margin, y + 7);
  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Generated ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin, y);
  y += 10;

  const cont = CONTAINERS[containerSize];
  const totalVol = (cont.lengthIn * cont.widthIn * cont.heightIn / 1728).toFixed(0);
  const usedVol = totalUsedCuFt().toFixed(0);
  const pct = ((usedVol / totalVol) * 100).toFixed(1);
  const itemCount = totalItemCount();

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${cont.label} Container`, margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Used: ${usedVol} cu ft / ${totalVol} cu ft (${pct}%)    |    Items: ${itemCount}`, margin, y);
  y += 4;

  doc.setDrawColor(180);
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(margin, y, contentW, 5, 1, 1, 'FD');
  const fillW = Math.min(contentW, contentW * parseFloat(pct) / 100);
  const barR = pct > 90 ? 220 : pct > 70 ? 200 : 60;
  const barG = pct > 90 ? 60 : pct > 70 ? 170 : 180;
  const barB = pct > 90 ? 60 : pct > 70 ? 40 : 80;
  doc.setFillColor(barR, barG, barB);
  doc.roundedRect(margin, y, fillW, 5, 1, 1, 'F');
  y += 10;

  try {
    const canvas = renderer.domElement;
    const imgData = canvas.toDataURL('image/png');
    const imgW = contentW;
    const imgH = imgW * (canvas.height / canvas.width);
    if (y + imgH > 280) { doc.addPage(); y = margin; }
    doc.addImage(imgData, 'PNG', margin, y, imgW, imgH);
    y += imgH + 6;
  } catch (e) {
    console.warn('Could not capture 3D view:', e);
  }

  rooms.forEach((room, ri) => {
    const roomVol = roomVolumeCuFt(room);
    const roomItemCount = room.items.reduce((s, it) => s + it.qty, 0);
    if (y > 260) { doc.addPage(); y = margin; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    const color = ROOM_COLORS[ri % ROOM_COLORS.length];
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    doc.setFillColor(r, g, b);
    doc.circle(margin + 2, y - 1.2, 1.8, 'F');
    doc.text(`  ${room.name}`, margin + 2, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`${roomItemCount} items · ${roomVol} cu ft`, margin + doc.getTextWidth(`  ${room.name}  `) + 4, y);
    y += 5;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text('Item', margin + 2, y);
    doc.text('Qty', margin + 100, y);
    doc.text('Dimensions', margin + 115, y);
    doc.text('Vol (ft³)', margin + 150, y);
    y += 1;
    doc.setDrawColor(200);
    doc.line(margin, y, margin + contentW, y);
    y += 3;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40);
    room.items.forEach(it => {
      if (y > 280) { doc.addPage(); y = margin; }
      const vol = ((it.l * it.w * it.h * it.qty) / 1728).toFixed(1);
      doc.setFontSize(8);
      doc.text(it.name, margin + 2, y, { maxWidth: 95 });
      doc.text(String(it.qty), margin + 102, y);
      doc.text(`${it.l}×${it.w}×${it.h}"`, margin + 115, y);
      doc.text(vol, margin + 155, y);
      y += 4;
    });
    y += 4;
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(`Container Calculator — Page ${i}/${pageCount}`, margin, 290);
  }

  doc.save(`container-${cont.label}-${new Date().toISOString().slice(0,10)}.pdf`);
  showToast('📄 PDF downloaded!');
}

// ============================================================
// INIT ON LOAD
// ============================================================
window.addEventListener('DOMContentLoaded', init);
