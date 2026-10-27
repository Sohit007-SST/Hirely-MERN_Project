// Dropdown: a trigger button that opens an anchored menu (a list of items) or a small panel of any content.
// Click outside / Escape close it, the trigger reports aria-expanded, arrow keys move through menu items.
// Props: { trigger: ReactElement (usually a <Button>; gets onClick, aria-expanded, aria-haspopup, aria-controls),
//          items?: Array<{ label, icon?: LucideIcon, onClick?, to?, href?, danger?: boolean, disabled?: boolean } | { divider: true }>,
//          header?: ReactNode (shown above the items, e.g. the "Me" mini profile),
//          children?: ReactNode | ({ close }) => ReactNode (free content instead of items),
//          align?: 'start'|'end' = 'start', label?: string (accessible name of the menu), className? }
import { cloneElement, useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { focusableIn } from './focusable';

export default function Dropdown({ trigger, items, header, children, align = 'start', label, className = '' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const focusFirst = useRef(false);
  const menuId = useId();
  const isMenu = Array.isArray(items);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Click outside closes (without stealing focus from whatever was clicked)
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    // Escape while focus is somewhere else on the page (inside the dropdown, onRootKeyDown handles it)
    const onKey = (e) => {
      if (e.key === 'Escape' && !rootRef.current?.contains(document.activeElement)) close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  // On open, move focus into the menu (first item, or the first field of a content panel)
  useEffect(() => {
    if (!open || !focusFirst.current) return;
    focusFirst.current = false;
    const first = isMenu ? menuItems(menuRef.current)[0] : focusableIn(menuRef.current)[0];
    first?.focus();
  }, [open, isMenu]);

  const toggle = (e) => {
    trigger.props.onClick?.(e);
    focusFirst.current = true;
    setOpen((o) => !o);
  };

  const onTriggerKeyDown = (e) => {
    trigger.props.onKeyDown?.(e);
    if (isMenu && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      focusFirst.current = true;
      setOpen(true);
    }
  };

  // Escape inside the dropdown: close it and stop the key reaching a Modal underneath
  const onRootKeyDown = (e) => {
    if (open && e.key === 'Escape') {
      e.nativeEvent.stopPropagation();
      close();
    }
  };

  const onMenuKeyDown = (e) => {
    if (!isMenu) return;
    const list = menuItems(menuRef.current);
    const at = list.indexOf(document.activeElement);
    let next = null;
    if (e.key === 'ArrowDown') next = list[(at + 1) % list.length];
    else if (e.key === 'ArrowUp') next = list[(at - 1 + list.length) % list.length];
    else if (e.key === 'Home') next = list[0];
    else if (e.key === 'End') next = list[list.length - 1];
    else if (e.key === 'Tab') setOpen(false);
    if (next) {
      e.preventDefault();
      next.focus();
    }
  };

  const triggerEl = cloneElement(trigger, {
    ref: (node) => {
      triggerRef.current = node;
      const { ref } = trigger;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    onClick: toggle,
    onKeyDown: onTriggerKeyDown,
    'aria-expanded': open,
    'aria-haspopup': isMenu ? 'menu' : 'dialog',
    'aria-controls': open ? menuId : undefined,
  });

  return (
    <div ref={rootRef} className={`ui-dropdown${className ? ` ${className}` : ''}`} onKeyDown={onRootKeyDown}>
      {triggerEl}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          className={`ui-dropdown__menu ui-dropdown__menu--${align}`}
          role={isMenu ? 'menu' : 'dialog'}
          aria-label={label}
          onKeyDown={onMenuKeyDown}
        >
          {header && <div className="ui-dropdown__header">{header}</div>}
          {isMenu
            ? items.map((item, i) =>
                item.divider ? (
                  <div key={`d${i}`} className="ui-dropdown__divider" role="separator" />
                ) : (
                  <MenuItem key={item.label} item={item} onDone={() => close()} />
                )
              )
            : typeof children === 'function'
              ? children({ close })
              : children}
        </div>
      )}
    </div>
  );
}

function menuItems(menu) {
  return menu ? [...menu.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')] : [];
}

function MenuItem({ item, onDone }) {
  const { label, icon: Icon, onClick, to, href, danger, disabled } = item;
  const props = {
    role: 'menuitem',
    tabIndex: -1,
    className: `ui-dropdown__item${danger ? ' ui-dropdown__item--danger' : ''}`,
    'aria-disabled': disabled || undefined,
    onClick: (e) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
      onDone();
    },
  };
  const body = (
    <>
      {Icon && <Icon size={18} aria-hidden="true" focusable="false" />}
      <span>{label}</span>
    </>
  );
  if (to) return <Link to={to} {...props}>{body}</Link>;
  if (href) return <a href={href} {...props}>{body}</a>;
  return <button type="button" {...props}>{body}</button>;
}
