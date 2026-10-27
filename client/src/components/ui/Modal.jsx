// Modal: centred dialog (max 744px) with a title + X header, scrollable body and sticky footer.
// Escape and backdrop click close it, Tab stays inside, focus goes back to the opener, and the page can't scroll behind it.
// Props: { open: boolean, onClose: () => void, title: ReactNode, children, footer?: ReactNode (action buttons),
//          initialFocusRef?: ref (element to focus first), closeLabel?: string = 'Close', className? }
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { focusableIn } from './focusable';

// Open modals, newest last: only the top one reacts to Escape / Tab
const stack = [];

function lockScroll() {
  if (stack.length !== 1) return;
  const gap = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  if (gap > 0) document.body.style.paddingRight = `${gap}px`;
}

function unlockScroll() {
  if (stack.length) return;
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

export default function Modal({ open, onClose, title, children, footer, initialFocusRef, closeLabel = 'Close', className = '' }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    const token = {};
    stack.push(token);
    lockScroll();

    // Focus the requested element, else the first field/button in the body or footer, else the X
    const panel = panelRef.current;
    const inside = focusableIn(panel).filter((el) => el !== closeRef.current);
    (initialFocusRef?.current || inside[0] || closeRef.current)?.focus();

    const onKeyDown = (e) => {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusableIn(panel);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      stack.splice(stack.indexOf(token), 1);
      unlockScroll();
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    };
    // initialFocusRef is a ref object, so it never changes between renders
  }, [open]);

  if (!open) return null;

  // Only a press that starts AND ends on the backdrop closes (dragging text out of the dialog doesn't)
  const onBackdropDown = (e) => {
    e.currentTarget.dataset.downOnBackdrop = e.target === e.currentTarget ? '1' : '';
  };
  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget && e.currentTarget.dataset.downOnBackdrop === '1') onClose?.();
  };

  return createPortal(
    <div className="ui-modal" onMouseDown={onBackdropDown} onClick={onBackdropClick}>
      <div
        ref={panelRef}
        className={`ui-modal__panel${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="ui-modal__head">
          <h2 id={titleId} className="ui-modal__title">{title}</h2>
          <button ref={closeRef} type="button" className="ui-modal__close" aria-label={closeLabel} onClick={onClose}>
            <X size={20} aria-hidden="true" focusable="false" />
          </button>
        </header>
        <div className="ui-modal__body">{children}</div>
        {footer && <footer className="ui-modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
