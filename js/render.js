import { checklistData as data } from './data.js';
import { state, saveState, addCustomItem, removeCustomItem, showToast } from './state.js';

const sectionsEl = document.getElementById('sections');
const progressBar = document.getElementById('progressBar');
const kpiProgress = document.getElementById('kpiProgress');
const kpiChecked = document.getElementById('kpiChecked');
const compactToggle = document.getElementById('compactToggle');
const hintsToggle = document.getElementById('hintsToggle');

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

    // Add item: hidden until header hover/focus (CSS handles visibility)
    const addBtn = document.createElement('button');
    addBtn.className = 'add-item-btn';
    addBtn.textContent = '+ Add item';
    addBtn.title = 'Add a new item';
    addBtn.addEventListener('click', () => toggleAddRow(card, true));

    // Collapse / Check controls
    const toggleBtn = button('Collapse', 'btn secondary', () => toggleSection(card)); toggleBtn.dataset.role='toggle';
    const markBtn = button('Check Section', 'btn success', () => checkSection(sec.id, true));
    const unmarkBtn = button('Uncheck Section', 'btn ghost', () => checkSection(sec.id, false));

    actions.append(addBtn, markBtn, unmarkBtn, toggleBtn);
    header.append(h3, meta, actions);
    card.append(header);

    // items list
    const list = document.createElement('ul'); list.className = 'items';
    if (state[sec.id]?.collapsed) list.style.display = 'none';

    const mergedItems = getMergedItems(sec.id);

    mergedItems.forEach((item) => {
      const li = document.createElement('li'); li.className='item fade-in'; li.dataset.item = item.id;

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

      // delete button only for custom items; revealed on hover via CSS
      if (item.custom) {
        const delBtn = iconButton('🗑', 'Remove item');
        delBtn.addEventListener('click', (ev) => {
          showConfirmPopover(ev.currentTarget, () => {
            removeCustomItem(sec.id, item.id);
            update();
            li.classList.add('fade-out');
            li.addEventListener('animationend', () => li.remove(), { once:true });
            showToast('Item removed');
          });
        });
        li.append(delBtn);
      }

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
    .flatMap(s => getMergedItems(s.id))
    .map(i => i.id);
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
  const merged = getMergedItems(secId);
  merged.forEach(it => state[it.id] = val);
  update(); render();
}

export function applyToggles() {
  document.querySelectorAll('.item').forEach((li) => {
    li.style.padding = compactToggle.checked ? '8px 10px' : '10px 12px';
    const hint = li.querySelector('.hint');
    if (hint) hint.style.display = hintsToggle.checked ? '' : 'none';
  });
}

/** merge defaults + custom */
function getMergedItems(secId) {
  const def = data.find(s => s.id === secId)?.items || [];
  const cus = state.customItems?.[secId] || [];
  return [...def, ...cus];
}

function sectionCounterText(sec) {
  const merged = getMergedItems(sec.id);
  const total = merged.length;
  const checked = merged.filter(i => state[i.id]).length;
  return `${checked}/${total}`;
}

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

/**
 * Popover confirmation anchored to a button, rendered in <body> with fixed positioning.
 * This prevents clipping by parent containers and ensures maximum z-index.
 */
function showConfirmPopover(anchorBtn, onConfirm) {
  // Remove any existing popovers
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

  // Position: right-aligned to the anchor, below it, clamped to viewport
  const margin = 8;
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

  let left = rect.right - pop.offsetWidth;
  let top = rect.bottom + margin;

  // Clamp horizontally
  if (left < margin) left = margin;
  if (left + pop.offsetWidth > vw - margin) left = vw - pop.offsetWidth - margin;

  // If not enough vertical space below, show above
  if (top + pop.offsetHeight > vh - margin) {
    top = rect.top - pop.offsetHeight - margin;
    if (top < margin) top = margin; // final clamp
  }

  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;

  pop.querySelector('.pop-cancel').addEventListener('click', () => pop.remove());
  pop.querySelector('.pop-ok').addEventListener('click', () => {
    onConfirm?.();
    pop.remove();
  });

  // Close on outside click or Escape
  const onDoc = (e) => {
    if (!pop.contains(e.target)) { cleanup(); }
  };
  const onKey = (e) => {
    if (e.key === 'Escape') cleanup();
  };
  function cleanup(){
    pop.remove();
    document.removeEventListener('mousedown', onDoc);
    document.removeEventListener('keydown', onKey);
  }
  document.addEventListener('mousedown', onDoc);
  document.addEventListener('keydown', onKey);
}
