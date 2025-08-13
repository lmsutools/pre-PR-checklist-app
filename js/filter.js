// js/filter.js
import { state } from './state.js';

export function initFilter() {
  const searchInput = document.getElementById('search');

  function applyFilter(q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    document.querySelectorAll('.card').forEach(card => {
      let visibleInSection = 0;
      card.querySelectorAll('.item').forEach(item => {
        const txt = item.innerText.toLowerCase();
        const ok = terms.every(t => txt.includes(t));
        item.style.display = ok ? '' : 'none';
        if (ok) visibleInSection++;
      });
      const list = card.querySelector('.items');
      card.style.display = visibleInSection ? '' : 'none';
      if (visibleInSection && list.style.display === 'none') {
        list.style.display = '';
        const secId = card.dataset.section;
        state[secId] = Object.assign({}, state[secId], { collapsed: false });
      }
    });
  }

  searchInput.addEventListener('input', (e) => applyFilter(e.target.value));

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
  });
}
