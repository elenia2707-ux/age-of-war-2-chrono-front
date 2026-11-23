/**
 * Ultra-reliable iOS Safari / Standalone PWA button tap binder.
 *
 * On real iPhones, tiny fingertip movement (1-10px) or top-edge gesture contention
 * can cause WebKit to drop synthetic `click` events. Handling taps directly on
 * `pointerup` (with pointer capture and a forgiving hit margin) plus a deduplicated
 * `click` fallback guarantees 1-tap activation on touch, mouse, and keyboard without
 * ever double-firing.
 */
let globalGhostClickGuardUntil = 0;

export function bindButtonTap(
  btn: HTMLButtonElement,
  onTap: () => void,
  options?: { cancelOnSwipe?: boolean; hitPadding?: number },
): void {
  const pad = options?.hitPadding ?? 16;
  let downPointerId: number | null = null;
  let downX = 0;
  let downY = 0;
  let suppressClickUntil = 0;

  btn.addEventListener('pointerdown', (ev) => {
    if (btn.disabled) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    downPointerId = ev.pointerId;
    downX = ev.clientX;
    downY = ev.clientY;
    try {
      btn.setPointerCapture(ev.pointerId);
    } catch {
      // Ignore for synthetic events without an active pointer
    }
  });

  btn.addEventListener('pointerup', (ev) => {
    if (downPointerId === null || ev.pointerId !== downPointerId) return;
    downPointerId = null;
    if (btn.disabled) return;

    const moved = Math.hypot(ev.clientX - downX, ev.clientY - downY);
    if (options?.cancelOnSwipe && moved > 24) return;

    const rect = btn.getBoundingClientRect();
    const inside =
      ev.clientX >= rect.left - pad &&
      ev.clientX <= rect.right + pad &&
      ev.clientY >= rect.top - pad &&
      ev.clientY <= rect.bottom + pad;
    if (!inside) return;

    const now = performance.now();
    suppressClickUntil = now + 450;
    globalGhostClickGuardUntil = now + 360;
    ev.stopPropagation();
    onTap();
  });

  btn.addEventListener('pointercancel', () => {
    downPointerId = null;
  });

  // Fallback for keyboard activation, screen readers, or synthetic element.click()
  btn.addEventListener('click', (ev) => {
    if (btn.disabled) return;
    const now = performance.now();
    if (now < suppressClickUntil) return;
    if (ev.isTrusted && ev.detail > 0 && now < globalGhostClickGuardUntil) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    onTap();
  });
}
