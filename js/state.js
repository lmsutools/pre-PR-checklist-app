import { STORAGE_KEY } from './data.js';

let lastSavedEl = null;
let toastEl = null;

/**
 * State shape:
 * {
 *   // item checks: { [itemId]: boolean }
 *   // per-section meta: { [secId]: { collapsed?: boolean } }
 *   // custom items per section: { [secId]: Array<{id,text,hint,custom:true}> }
 *   customItems: { [secId]: Array },
 *   // per-item overrides and flags (also for defaults)
 *   itemMeta: { [itemId]: { text?: string, hint?: string, deleted?: boolean } },
 *   // per-section order (array of itemIds). Includes defaults and customs.
 *   order: { [secId]: string[] }
 * }
 */
export const state = loadState();

export function initState({ lastSavedRef, toastRef } = {}) {
  lastSavedEl = lastSavedRef || null;
  toastEl = toastRef || null;

  state.customItems ||= {};
  state.itemMeta ||= {};
  state.order ||= {};

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

/** Custom item helpers */
export function addCustomItem(secId, text, hint='') {
  const id = `${secId}-c-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  state.customItems[secId] ||= [];
  state.customItems[secId].push({ id, text, hint, custom:true });
  // push to order
  ensureOrderArray(secId);
  state.order[secId].push(id);
  return id;
}

export function removeCustomItem(secId, itemId) {
  const list = state.customItems[secId] || [];
  const idx = list.findIndex(i => i.id === itemId);
  if (idx >= 0) {
    list.splice(idx, 1);
    delete state[itemId]; // remove any checked state
  }
  removeFromOrder(secId, itemId);
}

/** Default item helpers (soft delete & edit) */
export function softDeleteDefaultItem(secId, itemId) {
  state.itemMeta[itemId] = Object.assign({}, state.itemMeta[itemId], { deleted: true });
  delete state[itemId]; // uncheck
  removeFromOrder(secId, itemId);
}

export function editItem(itemId, { text, hint }) {
  const meta = state.itemMeta[itemId] || {};
  state.itemMeta[itemId] = Object.assign({}, meta, {
    ...(text != null ? { text } : {}),
    ...(hint != null ? { hint } : {}),
  });
}

/** Order helpers */
export function ensureOrderArray(secId) {
  state.order[secId] ||= [];
  return state.order[secId];
}

export function setOrder(secId, nextOrderIds) {
  state.order[secId] = Array.from(nextOrderIds);
}

export function removeFromOrder(secId, itemId) {
  if (!state.order[secId]) return;
  state.order[secId] = state.order[secId].filter(id => id !== itemId);
}
