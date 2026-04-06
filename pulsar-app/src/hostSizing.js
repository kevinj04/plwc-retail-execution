/**
 * Notify the Pulsar/FSL host that the app should refresh iframe sizing.
 *
 * @param {string} height
 */
export function notifyHostSize(height = '*') {
  if (!window.parent || window.parent === window || typeof window.parent.postMessage !== 'function') {
    return;
  }

  window.parent.postMessage({
    type: 'refresh',
    height
  }, '*');
}

/**
 * Install automatic host resize notifications for an app root.
 *
 * @param {HTMLElement | null} root
 * @returns {() => void}
 */
export function installHostSizing(root) {
  notifyHostSize('*');

  if (!root || typeof ResizeObserver === 'undefined') {
    return () => {};
  }

  const observer = new ResizeObserver(() => {
    notifyHostSize('*');
  });

  observer.observe(root);

  return () => {
    observer.disconnect();
  };
}
