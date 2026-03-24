import { getKnownUserFieldIds } from '../modules/pp.js';
import { buildFormState } from './buildFormState.js';
import { renderSkeleton } from './renderSkeleton.js';
import { renderForm } from './renderForm.js';
import { applyInteractivity } from './applyInteractivity.js';

let currentState = null;
let stateListeners = [];
let eventLog = [];
let containerRef = null;
let formStateRef = null;
let running = false;

function emitEvent(name, payload) {
  const entry = { t: Date.now(), name, payload };
  eventLog.push(entry);
  stateListeners.forEach((fn) => {
    try {
      fn({ type: 'event', entry });
    } catch (e) {
      // ignore
    }
  });
}

function notifyState() {
  if (currentState) {
    stateListeners.forEach((fn) => {
      try {
        fn(currentState);
      } catch (e) {
        // ignore
      }
    });
  }
}

/**
 * @param {object} config - RenderConfig
 * @param {{ delayMs?: number, container: HTMLElement, locale: string }} options
 */
export async function run(config, options = {}) {
  const { delayMs = 0, container, locale = 'en' } = options || {};
  if (!container) return;
  if (running) return;
  running = true;
  try {
    containerRef = container;
    container.textContent = '';

    currentState = { phase: 'skeleton', config, locale };
    notifyState();
    emitEvent('config_received', { formId: config?.formId, locale });

    const skeletonResult = renderSkeleton(config, container);
    emitEvent('skeleton_rendered', skeletonResult);

    if (delayMs > 0) {
      currentState = { ...currentState, phase: 'loading' };
      notifyState();
      await new Promise((r) => setTimeout(r, delayMs));
    }

    const knownUserFieldIds = config?.features?.progressiveProfiling
      ? getKnownUserFieldIds(config?.formId || 'demo-2277')
      : [];
    const { state: formState, effectiveSteps } = buildFormState(config, {
      knownUserFieldIds,
      locale,
    });
    formStateRef = formState;

    if (knownUserFieldIds.length) {
      emitEvent('pp_applied', { ppHiddenFieldIds: [...knownUserFieldIds] });
    }
    emitEvent('form_state_initialized', { effectiveSteps: effectiveSteps.length });

    const skeletonWrapper = container.querySelector('.form-demo-skeleton-wrapper');
    if (skeletonWrapper) skeletonWrapper.remove();

    container.querySelectorAll('.form-demo-form-wrapper').forEach((w) => w.remove());
    renderForm(formState, container);
    emitEvent('form_rendered', {});

    const api = {
      getState: () => formStateRef,
      setState: (partial) => {
        if (!formStateRef) return;
        formStateRef = { ...formStateRef, ...partial };
        currentState = { ...currentState, formState: formStateRef };
        notifyState();
      },
      reRenderForm: () => {
        if (!containerRef || !formStateRef) return;
        const wrapper = containerRef.querySelector('.form-demo-form-wrapper');
        if (wrapper) wrapper.remove();
        renderForm(formStateRef, containerRef);
        applyInteractivity(containerRef, api);
      },
      emitEvent,
    };

    currentState = { phase: 'ready', config, locale, formState: formStateRef };
    notifyState();

    applyInteractivity(container, api);
  } finally {
    running = false;
  }
}

export function getStateSnapshot() {
  return currentState
    ? {
        ...currentState,
        eventLogCount: eventLog.length,
      }
    : null;
}

export function onStateChange(fn) {
  if (typeof fn === 'function') stateListeners.push(fn);
}

export function onEvent(fn) {
  if (typeof fn === 'function') {
    stateListeners.push((update) => {
      if (update?.type === 'event' && update.entry) fn(update.entry);
    });
  }
}

export function getEventLog() {
  return [...eventLog];
}

export function clearEventLog() {
  eventLog = [];
}

export function reset() {
  currentState = null;
  formStateRef = null;
  eventLog = [];
  containerRef = null;
}
