// TypingDots: three bouncing dots and "<name> is typing" under the thread (the dots stay still under reduced motion).
// Props: { name: string (first name of the other person), active: boolean }
export default function TypingDots({ name, active }) {
  return (
    <div className="msg-typing" aria-live="polite">
      {active && (
        <>
          <span className="msg-typing__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>{name} is typing</span>
        </>
      )}
    </div>
  );
}
