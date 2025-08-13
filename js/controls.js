// js/controls.js
import { checklistData as data } from './data.js';
import { state } from './state.js';
import { render, update, applyToggles } from './render.js';

export function initControls() {
  const clearAllBtn = document.getElementById('clearAll');
  const checkAllBtn = document.getElementById('checkAll');
  const expandAllBtn = document.getElementById('expandAll');
  const collapseAllBtn = document.getElementById('collapseAll');
  const compactToggle = document.getElementById('compactToggle');
  const hintsToggle = document.getElementById('hintsToggle');

  clearAllBtn.addEventListener('click', () => {
    if (!confirm('Clear all checks?')) return;
    // remove only check states, keep structure/custom items
    Object.keys(state).forEach(k => { if (/^\w/.test(k) && !k.startsWith('sec') && k !== 'customItems') delete state[k]; });
    // also uncheck all known ids
    data.flatMap(s => s.items.map(i => i.id)).forEach(id => delete state[id]);
    // also uncheck all custom ones
    Object.values(state.customItems || {}).flat().forEach(i => delete state[i.id]);
    update(); render();
  });

  checkAllBtn.addEventListener('click', () => {
    // mark all defaults + customs
    const defaultIds = data.flatMap(s => s.items.map(i => i.id));
    defaultIds.forEach(id => state[id] = true);
    Object.values(state.customItems || {}).flat().forEach(i => state[i.id] = true);
    update(); render();
  });

  expandAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.card').forEach(card => {
      const secId = card.dataset.section;
      const list = card.querySelector('.items');
      list.style.display = '';
      state[secId] = Object.assign({}, state[secId], { collapsed: false });
    });
    update();
  });

  collapseAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.card').forEach(card => {
      const secId = card.dataset.section;
      const list = card.querySelector('.items');
      list.style.display = 'none';
      state[secId] = Object.assign({}, state[secId], { collapsed: true });
    });
    update();
  });

  compactToggle.addEventListener('change', () => applyToggles());
  hintsToggle.addEventListener('change', () => applyToggles());
}
