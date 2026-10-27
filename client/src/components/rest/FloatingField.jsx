// FloatingField: a text input whose label sits inside the box and floats up when you type or focus.
// Password fields get a "Show" / "Hide" text toggle inside the box. Errors show in red under the field.
// Props: { id: string, label: string, error?: string, hint?: string, revealable?: boolean (show/hide toggle),
//          type?: string = 'text', ...rest (name, value, onChange, autoComplete, ... go on the <input>) }
import { forwardRef, useState } from 'react';

const FloatingField = forwardRef(function FloatingField(
  { id, label, error, hint, revealable = false, type = 'text', className = '', ...rest },
  ref
) {
  const [shown, setShown] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={`rest-field${error ? ' has-error' : ''}${className ? ` ${className}` : ''}`}>
      <div className={`rest-float${revealable ? ' rest-float--reveal' : ''}`}>
        {/* placeholder=" " lets CSS tell an empty box (:placeholder-shown) from a filled one */}
        <input
          ref={ref}
          id={id}
          className="rest-float__input"
          type={revealable && shown ? 'text' : type}
          placeholder=" "
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...rest}
        />
        <label className="rest-float__label" htmlFor={id}>
          {label}
        </label>
        {revealable && (
          <button
            type="button"
            className="rest-float__toggle"
            onClick={() => setShown((s) => !s)}
            aria-controls={id}
            aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          >
            {shown ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error ? (
        <p className="rest-field__error" id={errorId}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="rest-field__hint" id={hintId}>
            {hint}
          </p>
        )
      )}
    </div>
  );
});

export default FloatingField;
