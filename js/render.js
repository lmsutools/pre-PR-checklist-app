import { checklistData as data } from './data.js';
import {
  state, saveState, addCustomItem, removeCustomItem, showToast,
  softDeleteDefaultItem, editItem, ensureOrderArray, setOrder
} from './state.js';

const sectionsEl = document.getElementById('sections');
const progressBar = document.getElementById('progressBar');
const kpiProgress = document.getElementById('kpiProgress');
const kpiChecked = document.getElementById('kpiChecked');
const compactToggle = document.getElementById('compactToggle');
const hintsToggle = document.getElementById('hintsToggle');

// --- Drag state (per interaction) ---
let dragInfo = { draggingId: null, secId: null };

export function render() {
  sectionsEl.innerHTML = '';
  data.forEach((sec) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.section = sec.id;

    const header = document.createElement('header');
    const h3 = document.createElement('h3'); h3.textContent = sec.title;

    const meta = document.createElement('div'); meta.className = 'meta';
    const counter = document.createElement('span'); counter.className='counter'; counter.textContent = sectionCounterText(sec);
    meta.append(counter);

    const actions = document.createElement('div'); actions.className='section-actions';

    const addBtn = document.createElement('button');
    addBtn.className = 'add-item-btn';
    addBtn.textContent = '+ Add item';
    addBtn.title = 'Add a new item';
    addBtn.addEventListener('click', () => toggleAddRow(card, true));

    const toggleBtn = button('Collapse', 'btn secondary', () => toggleSection(card)); toggleBtn.dataset.role='toggle';
    const markBtn = button('Check Section', 'btn success', () => checkSection(sec.id, true));
    const unmarkBtn = button('Uncheck Section', 'btn ghost', () => checkSection(sec.id, false));

    actions.append(addBtn, markBtn, unmarkBtn, toggleBtn);
    header.append(h3, meta, actions);
    card.append(header);

    const list = document.createElement('ul'); list.className = 'items';
    if (state[sec.id]?.collapsed) list.style.display = 'none';

    const orderedItems = getOrderedEffectiveItems(sec);

    orderedItems.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'item fade-in';
      li.dataset.item = item.id;
      li.dataset.section = sec.id;
      li.draggable = true;

      // Drag handlers
      li.addEventListener('dragstart', onDragStart);
      li.addEventListener('dragover', onDragOver);
      li.addEventListener('dragleave', onDragLeave);
      li.addEventListener('drop', onDrop);
      li.addEventListener('dragend', onDragEnd);

      const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!state[item.id];
      cb.addEventListener('change', () => { state[item.id] = cb.checked; update(); });

      const row = document.createElement('div'); row.className = 'row';
      const label = document.createElement('label'); label.textContent = item.text;
      row.append(label);
      if (item.hint) {
        const hint = document.createElement('div'); hint.className='hint'; hint.textContent = item.hint;
        row.append(hint);
      }

      li.append(cb, row);

      // Icon group (edit + delete) appears on hover
      const iconGroup = document.createElement('div');
      iconGroup.className = 'icon-group';

      // Edit icon (for both default & custom)
      const editBtn = iconButton('✏️', 'Edit item');
      editBtn.addEventListener('click', () => enterInlineEdit(li, item));
      iconGroup.append(editBtn);

      // Delete icon (for both; custom deletes record, default = soft delete)
      const delBtn = iconButton('🗑', 'Remove item');
      delBtn.addEventListener('click', (ev) => {
        showConfirmPopover(ev.currentTarget, () => {
          if (item.custom) {
            removeCustomItem(sec.id, item.id);
          } else {
            softDeleteDefaultItem(sec.id, item.id);
          }
          update();
          li.classList.add('fade-out');
          li.addEventListener('animationend', () => li.remove(), { once:true });
          showToast('Item removed');
        });
      });
      iconGroup.append(delBtn);

      li.append(iconGroup);
      list.append(li);
    });

    // Add-row (inline editor)
    const addRow = document.createElement('div');
    addRow.className = 'add-row';
    addRow.innerHTML = `
      <input class="text-input" type="text" placeholder="New item text…" />
      <input class="hint-input" type="text" placeholder="Optional hint…" />
      <div class="actions">
        <button class="btn success add-confirm">Add</button>
        <button class="btn ghost add-cancel">Cancel</button>
      </div>
    `;
    addRow.querySelector('.add-confirm').addEventListener('click', () => commitAdd(sec.id, addRow));
    addRow.querySelector('.add-cancel').addEventListener('click', () => toggleAddRow(card, false));
    addRow.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commitAdd(sec.id, addRow);
      if (e.key === 'Escape') toggleAddRow(card, false);
    });

    card.append(list, addRow);
    sectionsEl.append(card);

    // Ensure order array is initialized for this section
    ensureOrderInitialized(sec);
  });

  applyToggles();
  updateProgress();
}

export function update() {
  saveState(state);
  document.querySelectorAll('.card').forEach((card) => {
    const sec = data.find(d => d.id === card.dataset.section);
    const counter = card.querySelector('.counter');
    if (counter) counter.textContent = sectionCounterText(sec);
  });
  updateProgress();
}

export function updateProgress() {
  const allIds = data
    .flatMap(s => getEffectiveItems(s).map(i => i.id));
  const total = allIds.length;
  const done = allIds.filter(id => state[id]).length;
  const pct = total ? Math.round(done / total * 100) : 0;

  progressBar.style.setProperty('--pct', pct);
  progressBar.style.width = pct + '%';
  document.querySelector('.progress').style.setProperty('--pct', pct);
  kpiProgress.textContent = pct + '%';
  kpiChecked.textContent = `${done}/${total}`;
}

export function toggleSection(card) {
  const secId = card.dataset.section;
  const list = card.querySelector('.items');
  const collapsed = list.style.display === 'none';
  list.style.display = collapsed ? '' : 'none';
  state[secId] = Object.assign({}, state[secId], { collapsed: !collapsed });
  update();
}

export function checkSection(secId, val) {
  getEffectiveItemsById(secId).forEach(id => state[id] = val);
  update(); render();
}

export function applyToggles() {
  document.querySelectorAll('.item').forEach((li) => {
    li.style.padding = compactToggle.checked ? '8px 10px' : '10px 12px';
    const hint = li.querySelector('.hint');
    if (hint) hint.style.display = hintsToggle.checked ? '' : 'none';
  });
}

/* ---------- Data composition helpers ---------- */
function getBaseItems(sec) {
  // defaults + custom (raw)
  const def = sec.items.map(i => ({ ...i, custom: false }));
  const cus = (state.customItems?.[sec.id] || []).map(i => ({ ...i, custom: true }));
  return [...def, ...cus];
}

function applyOverrides(items) {
  return items
    .map(it => {
      const meta = state.itemMeta?.[it.id];
      if (!meta) return it;
      if (meta.deleted) return { ...it, deleted: true };
      return {
        ...it,
        ...(meta.text != null ? { text: meta.text } : {}),
        ...(meta.hint != null ? { hint: meta.hint } : {}),
      };
    })
    .filter(it => !it.deleted);
}

function ensureOrderInitialized(sec) {
  const items = applyOverrides(getBaseItems(sec));
  const ids = items.map(i => i.id);
  const ord = ensureOrderArray(sec.id);

  // bring order in sync: keep existing order where valid, then append new ids
  const clean = ord.filter(id => ids.includes(id));
  const missing = ids.filter(id => !clean.includes(id));
  const next = [...clean, ...missing];
  if (JSON.stringify(next) !== JSON.stringify(ord)) {
    setOrder(sec.id, next);
    saveState();
  }
}

function getOrderedEffectiveItems(sec) {
  const items = applyOverrides(getBaseItems(sec));
  ensureOrderInitialized(sec);
  const ord = state.order[sec.id] || [];
  const byId = new Map(items.map(i => [i.id, i]));
  // keep only items present; respect order; append any stray new ones
  const ordered = ord.map(id => byId.get(id)).filter(Boolean);
  const missing = items.filter(i => !ord.includes(i.id));
  return [...ordered, ...missing];
}

function getEffectiveItems(sec) {
  return applyOverrides(getBaseItems(sec));
}

function getEffectiveItemsById(secId) {
  const sec = data.find(s => s.id === secId);
  return getEffectiveItems(sec).map(i => i.id);
}

function sectionCounterText(sec) {
  const items = getEffectiveItems(sec);
  const total = items.length;
  const checked = items.filter(i => state[i.id]).length;
  return `${checked}/${total}`;
}

/* ---------- UI button helpers ---------- */
function button(text, cls, onClick) {
  const b = document.createElement('button');
  b.className = 'btn ' + (cls || '');
  b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
}

function iconButton(text, title) {
  const b = document.createElement('button');
  b.className = 'icon-btn';
  b.textContent = text;
  b.title = title;
  return b;
}

/* ---------- Add / Edit ---------- */
function toggleAddRow(card, show) {
  const row = card.querySelector('.add-row');
  if (!row) return;
  row.classList.toggle('active', !!show);
  if (show) {
    const input = row.querySelector('.text-input');
    input.value = ''; row.querySelector('.hint-input').value = '';
    setTimeout(() => input.focus(), 0);
  }
}

function commitAdd(secId, addRow) {
  const text = addRow.querySelector('.text-input').value.trim();
  const hint = addRow.querySelector('.hint-input').value.trim();
  if (!text) return;
  const id = addCustomItem(secId, text, hint);
  saveState();
  render();
  showToast('Item added');
}

function enterInlineEdit(li, item) {
  // Build inline editor inside the row
  const row = li.querySelector('.row');
  if (!row) return;

  const prev = { text: item.text || '', hint: item.hint || '' };
  row.innerHTML = `
    <input class="edit-text-input" type="text" value="${escapeHtml(prev.text)}" />
    <input class="edit-hint-input" type="text" value="${escapeHtml(prev.hint)}" placeholder="Optional hint…" />
    <div class="actions">
      <button class="btn success edit-save">Save</button>
      <button class="btn ghost edit-cancel">Cancel</button>
    </div>
  `;

  const textEl = row.querySelector('.edit-text-input');
  const hintEl = row.querySelector('.edit-hint-input');
  setTimeout(() => textEl.focus(), 0);

  const cancel = () => {
    // restore original view
    row.innerHTML = '';
    const label = document.createElement('label'); label.textContent = prev.text;
    row.append(label);
    if (prev.hint) {
      const hint = document.createElement('div'); hint.className='hint'; hint.textContent = prev.hint;
      row.append(hint);
    }
  };

  row.querySelector('.edit-save').addEventListener('click', () => {
    const newText = textEl.value.trim();
    const newHint = hintEl.value.trim();
    if (!newText) { cancel(); return; }
    if (item.custom) {
      // mutate the custom item object itself in state.customItems
      const arr = (state.customItems[item.id.split('-c-')[0]] || []); // not reliable for sec; better to search
    }
    // For both default & custom, use itemMeta to persist edits
    editItem(item.id, { text: newText, hint: newHint });
    saveState();
    render();
    showToast('Item updated');
  });

  row.querySelector('.edit-cancel').addEventListener('click', cancel);
  row.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cancel();
    if (e.key === 'Enter') row.querySelector('.edit-save').click();
  });
}

/* ---------- Confirm popover (fixed to body) ---------- */
function showConfirmPopover(anchorBtn, onConfirm) {
  document.querySelectorAll('.popover').forEach(p => p.remove());
  const rect = anchorBtn.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.className = 'popover fade-in';
  pop.innerHTML = `
    <div>❓ Remove this item?</div>
    <div class="actions">
      <button class="btn ghost pop-cancel">Cancel</button>
      <button class="btn danger pop-ok">Remove</button>
    </div>
  `;
  document.body.appendChild(pop);
  pop.classList.add('show');

  const margin = 8;
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

  let left = rect.right - pop.offsetWidth;
  let top = rect.bottom + margin;
  if (left < margin) left = margin;
  if (left + pop.offsetWidth > vw - margin) left = vw - pop.offsetWidth - margin;
  if (top + pop.offsetHeight > vh - margin) {
    top = rect.top - pop.offsetHeight - margin;
    if (top < margin) top = margin;
  }
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;

  pop.querySelector('.pop-cancel').addEventListener('click', () => cleanup());
  pop.querySelector('.pop-ok').addEventListener('click', () => { onConfirm?.(); cleanup(); });

  const onDoc = (e) => { if (!pop.contains(e.target)) cleanup(); };
  const onKey = (e) => { if (e.key === 'Escape') cleanup(); };
  function cleanup() {
    pop.remove();
    document.removeEventListener('mousedown', onDoc);
    document.removeEventListener('keydown', onKey);
  }
  document.addEventListener('mousedown', onDoc);
  document.addEventListener('keydown', onKey);
}

/* ---------- Drag & Drop ---------- */
function onDragStart(e) {
  const li = e.currentTarget;
  dragInfo.draggingId = li.dataset.item;
  dragInfo.secId = li.dataset.section;
  li.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(e) {
  e.preventDefault(); // allow drop
  const li = e.currentTarget;
  if (li.dataset.section !== dragInfo.secId) return;

  const { clientY } = e;
  const rect = li.getBoundingClientRect();
  const before = clientY < rect.top + rect.height / 2;
  li.classList.toggle('drop-before', before);
  li.classList.toggle('drop-after', !before);
}

function onDragLeave(e) {
  const li = e.currentTarget;
  li.classList.remove('drop-before', 'drop-after');
}

function onDrop(e) {
  e.preventDefault();
  const li = e.currentTarget;
  if (li.dataset.section !== dragInfo.secId) return;

  const overId = li.dataset.item;
  const secId = li.dataset.section;
  const rect = li.getBoundingClientRect();
  const before = e.clientY < rect.top + rect.height / 2;

  const currOrder = (state.order[secId] || []).slice();
  const fromIdx = currOrder.indexOf(dragInfo.draggingId);
  const toIdx = currOrder.indexOf(overId);
  if (fromIdx === -1 || toIdx === -1) return;

  currOrder.splice(fromIdx, 1);
  const insertIdx = before ? currOrder.indexOf(overId) : currOrder.indexOf(overId) + 1;
  currOrder.splice(insertIdx, 0, dragInfo.draggingId);

  setOrder(secId, currOrder);
  saveState();
  render();
}

function onDragEnd(e) {
  document.querySelectorAll('.item').forEach(el => el.classList.remove('dragging', 'drop-before', 'drop-after'));
  dragInfo.draggingId = null;
  dragInfo.secId = null;
}

/* ---------- Utils ---------- */
function escapeHtml(str) {
  return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
