// js/main.js
import { initState } from './state.js';
import { render, update } from './render.js';
import { initControls } from './controls.js';
import { initFilter } from './filter.js';
import { initIO } from './io.js';

window.addEventListener('DOMContentLoaded', () => {
  const lastSavedRef = document.getElementById('lastSaved');
  const toastRef = document.getElementById('toast');

  initState({ lastSavedRef, toastRef });
  render();
  initControls();
  initFilter();
  initIO();

  window.addEventListener('pr-checklist-imported', () => {
    update();
    render();
  });
});
