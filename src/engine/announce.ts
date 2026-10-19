// Polite live region for strand and mode changes. The element is persisted across navigations.

let clearTimer = 0;

export function announce(message: string): void {
  const el = document.getElementById('live');
  if (!el) return;
  // Clearing first makes screen readers re-announce identical consecutive messages.
  el.textContent = '';
  window.clearTimeout(clearTimer);
  requestAnimationFrame(() => {
    el.textContent = message;
    clearTimer = window.setTimeout(() => (el.textContent = ''), 4000);
  });
}
