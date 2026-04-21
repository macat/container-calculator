// ============================================================
// Container Calculator — app.js (v3 — LAFF packing + inline edit)
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
let highlightedItemId = null;
let hoveredMeshItemId = null;
let packedMeshes = [];
let raycaster, mouse;

// --- Three.js globals ---
let scene, camera, renderer, controls;
let containerGroup, itemsGroup;

// ============================================================
// DATA: Generic example inventory
// ============================================================
function getDefaultRooms() {
  return [
    {
      id: nextRoomId++, name: 'Living Room', collapsed: false,
      items: [
        { id: nextItemId++, name: 'Sofa',            l: 80, w: 35, h: 30, qty: 1 },
        { id: nextItemId++, name: 'Coffee Table',    l: 48, w: 24, h: 18, qty: 1 },
        { id: nextItemId++, name: 'Bookshelf',       l: 36, w: 12, h: 72, qty: 1 },
        { id: nextItemId++, name: 'TV (crated)',     l: 65, w: 6,  h: 38, qty: 1 },
        { id: nextItemId++, name: 'Floor Lamp Box',  l: 12, w: 12, h: 60, qty: 1 },
        { id: nextItemId++, name: 'Accent Chair',    l: 30, w: 28, h: 32, qty: 2 },
      ]
    },
    {
      id: nextRoomId++, name: 'Bedroom', collapsed: true,
      items: [
        { id: nextItemId++, name: 'Bed Frame',   l: 80, w: 60, h: 14, qty: 1 },
        { id: nextItemId++, name: 'Mattress',    l: 80, w: 60, h: 10, qty: 1 },
        { id: nextItemId++, name: 'Dresser',     l: 60, w: 18, h: 32, qty: 1 },
        { id: nextItemId++, name: 'Nightstand',  l: 20, w: 16, h: 24, qty: 2 },
      ]
    },
    {
      id: nextRoomId++, name: 'Office', collapsed: true,
      items: [
        { id: nextItemId++, name: 'Desk',            l: 60, w: 30, h: 30, qty: 1 },
        { id: nextItemId++, name: 'Office Chair',    l: 24, w: 24, h: 36, qty: 1 },
        { id: nextItemId++, name: 'Monitor Box',     l: 28, w: 8,  h: 18, qty: 1 },
        { id: nextItemId++, name: 'Filing Cabinet',  l: 15, w: 24, h: 28, qty: 1 },
      ]
    },
    {
      id: nextRoomId++, name: 'Boxes', collapsed: true,
      items: [
        { id: nextItemId++, name: 'Medium Box',   l: 18, w: 18, h: 24, qty: 10 },
        { id: nextItemId++, name: 'Book Box',     l: 18, w: 18, h: 16, qty: 5 },
        { id: nextItemId++, name: 'Wardrobe Box', l: 24, w: 21, h: 46, qty: 2 },
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
    <div class="item-row" data-item-id="${it.id}" data-room-id="${roomId}"
         onmouseenter="highlightItem(${it.id})"
         onmouseleave="unhighlightItem()">
      <span class="item-name editable" onclick="startEditName(event, ${roomId}, ${it.id})"
            title="Click to edit name">${esc(it.name)}</span>
      <div class="qty-controls">
        <button class="qty-btn" onclick="event.stopPropagation(); changeQty(${roomId}, ${it.id}, -1)" title="Decrease">−</button>
        <span class="item-qty-value">${it.qty}</span>
        <button class="qty-btn" onclick="event.stopPropagation(); changeQty(${roomId}, ${it.id}, 1)" title="Increase">+</button>
      </div>
      <span class="item-dims editable" onclick="startEditDims(event, ${roomId}, ${it.id})"
            title="Click to edit dimensions">${it.l}×${it.w}×${it.h}"</span>
      <span class="item-vol">${vol} ft³</span>
      <button class="btn-remove-item" onclick="removeItem(${roomId}, ${it.id})" title="Remove">✕</button>
    </div>
  `;
}

// ============================================================
// INLINE EDITING
// ============================================================
function startEditName(event, roomId, itemId) {
  event.stopPropagation();
  const span = event.currentTarget;
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;
  const item = room.items.find(it => it.id === itemId);
  if (!item) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'inline-edit-input';
  input.value = item.name;
  input.style.width = Math.max(80, span.offsetWidth + 20) + 'px';

  let committed = false;
  function commit() {
    if (committed) return;
    committed = true;
    const val = input.value.trim();
    if (val && val !== item.name) {
      item.name = val;
      renderAll();
    } else {
      span.style.display = '';
      input.remove();
    }
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { committed = true; span.style.display = ''; input.remove(); }
  });
  input.addEventListener('blur', commit);

  span.style.display = 'none';
  span.parentNode.insertBefore(input, span);
  input.focus();
  input.select();
}

function startEditDims(event, roomId, itemId) {
  event.stopPropagation();
  const span = event.currentTarget;
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;
  const item = room.items.find(it => it.id === itemId);
  if (!item) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'inline-dims-edit';

  const fields = ['l', 'w', 'h'].map(dim => {
    const inp = document.createElement('input');
    inp.type = 'number';
    inp.className = 'inline-dim-input';
    inp.min = 1;
    inp.value = item[dim];
    inp.dataset.dim = dim;
    return inp;
  });

  let committed = false;
  function commit() {
    if (committed) return;
    committed = true;
    let changed = false;
    fields.forEach(inp => {
      const dim = inp.dataset.dim;
      const val = parseInt(inp.value);
      if (val && val > 0 && val !== item[dim]) {
        item[dim] = val;
        changed = true;
      }
    });
    if (changed) {
      renderAll();
    } else {
      span.style.display = '';
      wrapper.remove();
    }
  }

  fields.forEach((inp, i) => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { committed = true; span.style.display = ''; wrapper.remove(); }
      if (e.key === 'Tab' && !e.shiftKey && i < fields.length - 1) {
        e.preventDefault();
        fields[i + 1].focus();
        fields[i + 1].select();
      }
    });
    inp.addEventListener('blur', () => {
      setTimeout(() => {
        if (!wrapper.contains(document.activeElement)) commit();
      }, 50);
    });
    wrapper.appendChild(inp);
    if (i < 2) {
      const sep = document.createElement('span');
      sep.className = 'inline-dim-sep';
      sep.textContent = '×';
      wrapper.appendChild(sep);
    }
  });

  span.style.display = 'none';
  span.parentNode.insertBefore(wrapper, span);
  fields[0].focus();
  fields[0].select();
}

// ============================================================
// STATS
// ============================================================
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
// BIN PACKING — Maximal Rectangles with Best Area Fit
// ============================================================
// Maintains a list of overlapping "maximal free spaces" (3D boxes).
// For each item (sorted largest-first), find the best-fit space,
// then split all overlapping spaces and prune subsets.
// This avoids the fragmentation problems of guillotine cutting.
// ============================================================

function binPack(cont) {
  const CL = cont.lengthIn;   // x-axis (length)
  const CW = cont.widthIn;    // z-axis (depth/width)
  const CH = cont.heightIn;   // y-axis (height)

  // Flatten all items with metadata
  const allItems = [];
  rooms.forEach((room, ri) => {
    const color = ROOM_COLORS[ri % ROOM_COLORS.length];
    room.items.forEach(item => {
      for (let q = 0; q < item.qty; q++) {
        allItems.push({
          name: item.name,
          itemId: item.id,
          roomId: room.id,
          origL: item.l,
          origW: item.w,
          origH: item.h,
          color: color,
          volume: item.l * item.w * item.h,
        });
      }
    });
  });

  // Sort by volume descending, then by largest single dimension
  allItems.sort((a, b) => {
    if (b.volume !== a.volume) return b.volume - a.volume;
    const aMax = Math.max(a.origL, a.origW, a.origH);
    const bMax = Math.max(b.origL, b.origW, b.origH);
    return bMax - aMax;
  });

  // Free spaces: each is {x, y, z, l, w, h}
  // l = extent along x (container length), w = extent along z (depth), h = extent along y (height)
  let freeSpaces = [{ x: 0, y: 0, z: 0, l: CL, w: CW, h: CH }];

  const placed = [];

  for (const item of allItems) {
    const orientations = getUniqueOrientations(item.origL, item.origW, item.origH);

    let bestFit = null;
    let bestScore = Infinity;

    for (const ori of orientations) {
      for (let si = 0; si < freeSpaces.length; si++) {
        const sp = freeSpaces[si];
        if (ori.l <= sp.l && ori.w <= sp.w && ori.h <= sp.h) {
          // Score: strongly prefer bottom (low y), then tighter fit, then back corner
          const leftover = (sp.l - ori.l) * (sp.w - ori.w);
          const score = sp.y * 1000000 + leftover * 10 + sp.x * 0.1 + sp.z * 0.01;
          if (score < bestScore) {
            bestScore = score;
            bestFit = { space: sp, ori };
          }
        }
      }
    }

    if (!bestFit) continue; // overflow

    const { space, ori } = bestFit;
    const px = space.x;
    const py = space.y;
    const pz = space.z;

    placed.push({
      x: px, y: py, z: pz,
      l: ori.l, w: ori.w, h: ori.h,
      color: item.color,
      name: item.name,
      itemId: item.itemId,
      roomId: item.roomId,
    });

    // Split all free spaces that intersect the placed box
    const box = { x: px, y: py, z: pz, l: ori.l, w: ori.w, h: ori.h };
    freeSpaces = splitFreeSpaces(freeSpaces, box);
    freeSpaces = removeSubsets(freeSpaces);
  }

  return placed;
}

// Split free spaces that overlap with the placed box into non-overlapping sub-spaces
function splitFreeSpaces(spaces, box) {
  const bx2 = box.x + box.l;
  const by2 = box.y + box.h;
  const bz2 = box.z + box.w;
  const result = [];

  for (const sp of spaces) {
    const sx2 = sp.x + sp.l;
    const sy2 = sp.y + sp.h;
    const sz2 = sp.z + sp.w;

    // No overlap — keep as-is
    if (box.x >= sx2 || bx2 <= sp.x ||
        box.y >= sy2 || by2 <= sp.y ||
        box.z >= sz2 || bz2 <= sp.z) {
      result.push(sp);
      continue;
    }

    // Overlap — split into up to 6 maximal sub-spaces
    if (sp.x < box.x)
      result.push({ x: sp.x, y: sp.y, z: sp.z, l: box.x - sp.x, w: sp.w, h: sp.h });
    if (sx2 > bx2)
      result.push({ x: bx2, y: sp.y, z: sp.z, l: sx2 - bx2, w: sp.w, h: sp.h });
    if (sp.z < box.z)
      result.push({ x: sp.x, y: sp.y, z: sp.z, l: sp.l, w: box.z - sp.z, h: sp.h });
    if (sz2 > bz2)
      result.push({ x: sp.x, y: sp.y, z: bz2, l: sp.l, w: sz2 - bz2, h: sp.h });
    if (sp.y < box.y)
      result.push({ x: sp.x, y: sp.y, z: sp.z, l: sp.l, w: sp.w, h: box.y - sp.y });
    if (sy2 > by2)
      result.push({ x: sp.x, y: by2, z: sp.z, l: sp.l, w: sp.w, h: sy2 - by2 });
  }

  return result;
}

// Remove free spaces fully contained within another
function removeSubsets(spaces) {
  const filtered = spaces.filter(s => s.l >= 1 && s.w >= 1 && s.h >= 1);
  const keep = new Array(filtered.length).fill(true);

  for (let i = 0; i < filtered.length; i++) {
    if (!keep[i]) continue;
    for (let j = 0; j < filtered.length; j++) {
      if (i === j || !keep[j]) continue;
      if (filtered[j].x >= filtered[i].x &&
          filtered[j].y >= filtered[i].y &&
          filtered[j].z >= filtered[i].z &&
          filtered[j].x + filtered[j].l <= filtered[i].x + filtered[i].l &&
          filtered[j].y + filtered[j].h <= filtered[i].y + filtered[i].h &&
          filtered[j].z + filtered[j].w <= filtered[i].z + filtered[i].w) {
        keep[j] = false;
      }
    }
  }

  return filtered.filter((_, i) => keep[i]);
}

// Get all unique orientations (rotations) for an item
function getUniqueOrientations(l, w, h) {
  const perms = [
    { l, w, h },
    { l, w: h, h: w },
    { l: w, w: l, h },
    { l: w, w: h, h: l },
    { l: h, w: l, h: w },
    { l: h, w, h: l },
  ];
  const seen = new Set();
  return perms.filter(p => {
    const key = `${p.l},${p.w},${p.h}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 8, 5);
  scene.add(dirLight);

  containerGroup = new THREE.Group();
  itemsGroup = new THREE.Group();
  scene.add(containerGroup);
  scene.add(itemsGroup);

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

  // Container frame
  const edgeColor = 0x7eb8da;
  const edgeRadius = 0.008;

  function drawEdge(x1, y1, z1, x2, y2, z2) {
    const dir = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(edgeRadius, edgeRadius, len, 6);
    const mat = new THREE.MeshBasicMaterial({ color: edgeColor });
    const mesh = new THREE.Mesh(geo, mat);
    const mid = new THREE.Vector3((x1+x2)/2, (y1+y2)/2, (z1+z2)/2);
    mesh.position.copy(mid);
    dir.normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
    mesh.setRotationFromQuaternion(quat);
    containerGroup.add(mesh);
  }

  const hw = cW / 2;
  drawEdge(0,0,-hw, cL,0,-hw); drawEdge(0,0,hw, cL,0,hw);
  drawEdge(0,0,-hw, 0,0,hw);   drawEdge(cL,0,-hw, cL,0,hw);
  drawEdge(0,cH,-hw, cL,cH,-hw); drawEdge(0,cH,hw, cL,cH,hw);
  drawEdge(0,cH,-hw, 0,cH,hw);   drawEdge(cL,cH,-hw, cL,cH,hw);
  drawEdge(0,0,-hw, 0,cH,-hw);   drawEdge(cL,0,-hw, cL,cH,-hw);
  drawEdge(0,0,hw, 0,cH,hw);     drawEdge(cL,0,hw, cL,cH,hw);

  // Corner spheres
  const cornerGeo = new THREE.SphereGeometry(edgeRadius * 1.5, 8, 8);
  const cornerMat = new THREE.MeshBasicMaterial({ color: edgeColor });
  [[0,0,-hw],[cL,0,-hw],[0,0,hw],[cL,0,hw],
   [0,cH,-hw],[cL,cH,-hw],[0,cH,hw],[cL,cH,hw]].forEach(p => {
    const s = new THREE.Mesh(cornerGeo, cornerMat);
    s.position.set(p[0], p[1], p[2]);
    containerGroup.add(s);
  });

  // Floor grid
  const gridStep = 12 * SCALE;
  const gridMat = new THREE.LineBasicMaterial({ color: 0x2a3a5a, transparent: true, opacity: 0.4 });
  for (let z = -hw; z <= hw + 0.001; z += gridStep) {
    const pts = [new THREE.Vector3(0, 0.001, z), new THREE.Vector3(cL, 0.001, z)];
    containerGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }
  for (let x = 0; x <= cL + 0.001; x += gridStep) {
    const pts = [new THREE.Vector3(x, 0.001, -hw), new THREE.Vector3(x, 0.001, hw)];
    containerGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }

  // Floor plane
  const floorGeo = new THREE.PlaneGeometry(cL, cW);
  const floorMat = new THREE.MeshBasicMaterial({ color: 0x1a2040, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cL / 2, 0.0005, 0);
  containerGroup.add(floor);

  // Back wall
  const backGeo = new THREE.PlaneGeometry(cW, cH);
  const backMat = new THREE.MeshBasicMaterial({ color: 0x1a1a3e, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
  const backWall = new THREE.Mesh(backGeo, backMat);
  backWall.rotation.y = Math.PI / 2;
  backWall.position.set(0, cH / 2, 0);
  containerGroup.add(backWall);

  // Pack and render items
  const packed = binPack(cont);
  packed.forEach(p => {
    const il = p.l * SCALE;
    const iw = p.w * SCALE;
    const ih = p.h * SCALE;
    const color = new THREE.Color(p.color);
    const geo = new THREE.BoxGeometry(il, ih, iw);

    if (wireframeMode) {
      const edgeMat = new THREE.LineBasicMaterial({ color });
      const mesh = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      mesh.position.set(p.x * SCALE + il/2, p.y * SCALE + ih/2, p.z * SCALE + iw/2 - cW/2);
      itemsGroup.add(mesh);
      packedMeshes.push({ mesh, edgeMesh: null, itemId: p.itemId, roomId: p.roomId, color: p.color });
    } else {
      const mat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.85, shininess: 30 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x * SCALE + il/2, p.y * SCALE + ih/2, p.z * SCALE + iw/2 - cW/2);
      itemsGroup.add(mesh);

      const edgeMat2 = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
      const edgeMesh = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat2);
      edgeMesh.position.copy(mesh.position);
      itemsGroup.add(edgeMesh);

      packedMeshes.push({ mesh, edgeMesh, itemId: p.itemId, roomId: p.roomId, color: p.color });
    }
  });

  // Overflow warning
  const totalItems = totalItemCount();
  const overflowEl = document.getElementById('overflow-warning');
  if (packed.length < totalItems) {
    const missed = totalItems - packed.length;
    const packedVol = packed.reduce((s, p) => s + (p.l * p.w * p.h / 1728), 0);
    const overflowVol = totalUsedCuFt() - packedVol;
    overflowEl.innerHTML = `⚠️ OVERFLOW — ${missed} item${missed > 1 ? 's' : ''} couldn't fit! (~${overflowVol.toFixed(0)} cu ft excess)`;
    overflowEl.style.display = 'block';
  } else {
    overflowEl.style.display = 'none';
  }

  resetCamera();
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
    showToast('🔗 Link copied! Share this URL to show your container layout');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('🔗 Link copied! Share this URL to show your container layout');
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
