// Button: the one pill button for the whole app (primary / secondary / tertiary / danger, sm or md, optional icon and loading spinner).
// Props: { variant?: 'primary'|'secondary'|'tertiary'|'danger' = 'primary', size?: 'sm'|'md' = 'md',
//          icon?: LucideIcon | ReactElement, iconRight?: LucideIcon | ReactElement, loading?: boolean, loadingText?: string,
//          block?: boolean, to?: string (renders a router <Link>), href?: string (renders <a>), as?: Component,
//          type?: 'button'|'submit' = 'button', disabled?, className?, children?, ...rest (aria-label required when icon-only) }
import { forwardRef, isValidElement } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

function renderIcon(icon, size) {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  const Icon = icon;
  return <Icon size={size} aria-hidden="true" focusable="false" />;
}

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    loading = false,
    loadingText,
    block = false,
    to,
    href,
    as,
    type = 'button',
    disabled = false,
    className = '',
    children,
    onClick,
    ...rest
  },
  ref
) {
  const iconSize = size === 'sm' ? 16 : 18;
  const iconOnly = !children && !loadingText && (icon || loading);
  const inactive = disabled || loading;
  const classes = [
    'ui-btn',
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    iconOnly && 'ui-btn--icon-only',
    block && 'ui-btn--block',
    loading && 'is-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading ? (
        <Loader2 className="ui-btn__spinner" size={iconSize} aria-hidden="true" focusable="false" />
      ) : (
        renderIcon(icon, iconSize)
      )}
      {loading && loadingText ? loadingText : children}
      {!loading && renderIcon(iconRight, iconSize)}
    </>
  );

  // Links can't be :disabled, so block the click and say so to screen readers
  const linkClick = (e) => {
    if (inactive) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };
  const linkProps = { ref, className: classes, 'aria-disabled': inactive || undefined, 'aria-busy': loading || undefined, onClick: linkClick, ...rest };

  if (to != null) return <Link to={to} {...linkProps}>{content}</Link>;
  if (href != null) return <a href={href} {...linkProps}>{content}</a>;

  const Component = as || 'button';
  const buttonProps = Component === 'button' ? { type, disabled: inactive } : { 'aria-disabled': inactive || undefined };
  return (
    <Component ref={ref} className={classes} aria-busy={loading || undefined} onClick={onClick} {...buttonProps} {...rest}>
      {content}
    </Component>
  );
});

export default Button;
