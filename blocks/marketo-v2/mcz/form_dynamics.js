// Form Dynamics (Module Version)
// Updated 20250617

export function isSafariBrowser() {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('safari') && !userAgent.includes('chrome');
}

export function initFormDynamics(marketoFormSetup) {
  if (isSafariBrowser()) {
    if (typeof marketoFormSetup === 'function') {
      // Optionally call: marketoFormSetup('stage1');
    }
  }
}
