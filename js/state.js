// js/state.js
import { STORAGE_KEY } from './data.js';

let lastSavedEl = null;
let toastEl = null;

/**
 * State shape:
 * {
 *   // item checks
 *   "1a": true,
 *   ...
 *   // per-section meta
 *   "sec1": { collapsed: false, edit: false },
 *   ...
 *   // custom items by section
 *   customItems: {
 *     "sec1": [ { id, text, hint, custom:true }, ... ],
 *     ...
 *   }
 * }
 */
export const state = loadState();

export function initState({ lastSavedRef, toastRef } = {}) {
  lastSavedEl = lastSavedRef || null;
  toastEl = toastRef || null;

  // normalize containers
  state.customItems ||= {};
  if (lastSavedEl) {
    const hasData = !!localStorage.getItem(STORAGE_KEY);
    lastSavedEl.textContent = hasData ? ('Loaded ' + new Date().toLocaleString()) : 'Not saved yet';
  }
}

export function saveState(obj = state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  if (lastSavedEl) lastSavedEl.textContent = 'Saved ' + new Date().toLocaleString();
  showToast('Saved');
}

export function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

export function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove('show'), 1400);
}

/** Helpers for custom items */
export function addCustomItem(secId, text, hint='') {
  const id = `${secId}-c-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  state.customItems[secId] ||= [];
  state.customItems[secId].push({ id, text, hint, custom:true });
  return id;
}

export function removeCustomItem(secId, itemId) {
  const list = state.customItems[secId] || [];
  const idx = list.findIndex(i => i.id === itemId);
  if (idx >= 0) {
    list.splice(idx, 1);
    delete state[itemId]; // also remove any check mark
  }
}
