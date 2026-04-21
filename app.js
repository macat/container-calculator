// ============================================================
// Container Calculator — app.js
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
  rooms = getDefaultRooms();
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
    <div class="item-row">
      <span class="item-name">${esc(it.name)}</span>
      ${it.qty > 1 ? `<span class="item-qty">×${it.qty}</span>` : ''}
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

// Handle Enter key in modals
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
const SCALE = 0.01; // inches to Three.js units

function initThree() {
  const el = document.getElementById('three-container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f0f23);

  camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 100);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(el.clientWidth, el.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.addEventListener('change', () => renderer.render(scene, camera));

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 8, 5);
  scene.add(dirLight);

  // Ground grid
  const grid = new THREE.GridHelper(10, 20, 0x2a2a4a, 0x1a1a3e);
  grid.position.y = -0.01;
  scene.add(grid);

  containerGroup = new THREE.Group();
  itemsGroup = new THREE.Group();
  scene.add(containerGroup);
  scene.add(itemsGroup);

  resetCamera();
  animate();
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
  // Clear old
  while (containerGroup.children.length) containerGroup.remove(containerGroup.children[0]);
  while (itemsGroup.children.length) itemsGroup.remove(itemsGroup.children[0]);

  const cont = CONTAINERS[containerSize];
  const cL = cont.lengthIn * SCALE;
  const cW = cont.widthIn * SCALE;
  const cH = cont.heightIn * SCALE;

  // Draw container wireframe
  const boxGeo = new THREE.BoxGeometry(cL, cH, cW);
  const edges = new THREE.EdgesGeometry(boxGeo);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x4a4a7a, linewidth: 2 });
  const wireframe = new THREE.LineSegments(edges, lineMat);
  wireframe.position.set(cL / 2, cH / 2, 0);
  containerGroup.add(wireframe);

  // Semi-transparent floor
  const floorGeo = new THREE.PlaneGeometry(cL, cW);
  const floorMat = new THREE.MeshBasicMaterial({ color: 0x1a1a3e, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cL / 2, 0.001, 0);
  containerGroup.add(floor);

  // Semi-transparent back wall
  const backGeo = new THREE.PlaneGeometry(cW, cH);
  const backMat = new THREE.MeshBasicMaterial({ color: 0x1a1a3e, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
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
      mesh.position.set(p.x * SCALE + il / 2, p.y * SCALE + ih / 2, p.z * SCALE);
      itemsGroup.add(mesh);
    } else {
      const mat = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: 0.85,
        shininess: 30,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x * SCALE + il / 2, p.y * SCALE + ih / 2, p.z * SCALE);
      itemsGroup.add(mesh);

      // Add edges
      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
      const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeMesh.position.copy(mesh.position);
      itemsGroup.add(edgeMesh);
    }
  });

  resetCamera();
}

// ============================================================
// BIN PACKING — Simple shelf-based algorithm
// ============================================================
function binPack(cont) {
  const cL = cont.lengthIn;
  const cW = cont.widthIn;
  const cH = cont.heightIn;

  // Flatten all items (expand qty) and sort by volume descending
  const allItems = [];
  rooms.forEach((room, ri) => {
    const color = ROOM_COLORS[ri % ROOM_COLORS.length];
    room.items.forEach(item => {
      for (let q = 0; q < item.qty; q++) {
        // Orient: longest dim along container length, tallest up
        const dims = [item.l, item.w, item.h].sort((a, b) => b - a);
        allItems.push({
          name: item.name,
          l: dims[0], // longest → along container length
          w: dims[1], // middle → along container width
          h: dims[2], // shortest → height (or vice versa if helps)
          color: color,
          volume: dims[0] * dims[1] * dims[2],
        });
      }
    });
  });

  // Sort largest first
  allItems.sort((a, b) => b.volume - a.volume);

  // Simple 3D shelf packing
  const placed = [];
  // Track occupied space with a height map grid
  // Divide floor into cells of 1 inch resolution (too heavy) — use a simpler approach
  // We'll use a layer/shelf approach:
  
  // Each "shelf" has a y-base, and we pack items left-to-right, front-to-back
  const shelves = []; // { yBase, maxH, rows: [{ zBase, maxW, items }] }

  for (const item of allItems) {
    let wasPlaced = false;

    // Try to fit in existing shelves
    for (const shelf of shelves) {
      if (shelf.yBase + item.h > cH) continue; // won't fit vertically in this shelf

      // Try existing rows in this shelf
      for (const row of shelf.rows) {
        if (row.zBase + item.w > cW / 2 + cW / 2) continue; // check width (centered on z=0)
        const nextX = row.nextX;
        if (nextX + item.l <= cL) {
          // Place here
          placed.push({
            x: nextX,
            y: shelf.yBase,
            z: row.zBase - cW / 2,
            l: item.l, w: item.w, h: item.h,
            color: item.color,
          });
          row.nextX = nextX + item.l;
          shelf.maxH = Math.max(shelf.maxH, item.h);
          row.maxW = Math.max(row.maxW, item.w);
          wasPlaced = true;
          break;
        }
      }
      if (wasPlaced) break;

      // Try new row in this shelf
      const newZBase = shelf.rows.length === 0 ? 0 : shelf.rows.reduce((m, r) => Math.max(m, r.zBase + r.maxW), 0);
      if (newZBase + item.w <= cW && item.l <= cL) {
        const row = { zBase: newZBase, maxW: item.w, nextX: item.l };
        shelf.rows.push(row);
        placed.push({
          x: 0,
          y: shelf.yBase,
          z: newZBase - cW / 2,
          l: item.l, w: item.w, h: item.h,
          color: item.color,
        });
        shelf.maxH = Math.max(shelf.maxH, item.h);
        wasPlaced = true;
        break;
      }
    }

    if (!wasPlaced) {
      // New shelf
      const newYBase = shelves.length === 0 ? 0 : shelves.reduce((m, s) => Math.max(m, s.yBase + s.maxH), 0);
      if (newYBase + item.h <= cH && item.l <= cL && item.w <= cW) {
        const shelf = { yBase: newYBase, maxH: item.h, rows: [{ zBase: 0, maxW: item.w, nextX: item.l }] };
        shelves.push(shelf);
        placed.push({
          x: 0,
          y: newYBase,
          z: 0 - cW / 2,
          l: item.l, w: item.w, h: item.h,
          color: item.color,
        });
      }
      // If it doesn't fit at all, skip (overflow)
    }
  }

  return placed;
}

// ============================================================
// INIT ON LOAD
// ============================================================
window.addEventListener('DOMContentLoaded', init);
