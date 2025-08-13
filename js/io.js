// js/io.js
import { state, showToast } from './state.js';

export function initIO() {
  const exportBtn = document.getElementById('exportJson');
  const importInput = document.getElementById('importJson');
  const printBtn = document.getElementById('printPage');

  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pr-checklist-state.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  importInput.addEventListener('change', async (ev) => {
    const file = ev.target.files[0]; if (!file) return;
    const text = await file.text();
    try {
      const obj = JSON.parse(text);
      // merge shallowly (respect customItems shape)
      Object.assign(state, obj);
      state.customItems ||= {};
      showToast('Imported');
      window.dispatchEvent(new CustomEvent('pr-checklist-imported'));
    } catch {
      alert('Invalid JSON file');
    }
    ev.target.value = '';
  });

  printBtn.addEventListener('click', () => window.print());
}
