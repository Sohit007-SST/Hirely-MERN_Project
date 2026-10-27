// Composer: the message box under a thread - an auto-growing textarea (up to 5 lines) and a bottom bar with the Send pill.
// Enter sends, Shift+Enter adds a new line. It also tells the other person when I'm typing.
// Props: { conversationId, recipientName?: string, disabled?: boolean,
//          onSend: (text) => Promise (resolve = sent; reject = failed, the text is given back) }
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { useSocket } from '../../context/SocketContext';

const TYPING_IDLE_MS = 1500;
const MAX_LENGTH = 2000;

export default function Composer({ conversationId, recipientName, disabled = false, onSend }) {
  const { socket } = useSocket();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const typingRef = useRef(false);
  const idleTimer = useRef(null);
  const id = useId();

  const stopTyping = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (typingRef.current && socket) socket.emit('typing:stop', { conversationId });
    typingRef.current = false;
  }, [socket, conversationId]);

  // Tell the other side we stopped if we leave mid-sentence
  useEffect(() => stopTyping, [stopTyping]);

  // Grow the box with its content; CSS caps it at 5 lines and scrolls after that
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [text]);

  const onType = (e) => {
    const value = e.target.value;
    setText(value);
    if (!socket) return;
    if (!value.trim()) {
      stopTyping();
      return;
    }
    // Session 13: one "start" per burst of typing, "stop" after 1.5 s without a keystroke
    if (!typingRef.current) {
      typingRef.current = true;
      socket.emit('typing:start', { conversationId });
    }
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  const send = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending || disabled) return;
    stopTyping();
    setSending(true);
    setText('');
    try {
      await onSend(body);
    } catch (err) {
      setText((current) => current || body); // give the text back so nothing is lost
      toast.error(`Message not sent. ${err.message}`);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    // Enter sends, Shift+Enter adds a new line (and never send mid-composition, e.g. Hindi IME)
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <form className="msg-composer" onSubmit={send}>
      <label className="ui-sr-only" htmlFor={`${id}-input`}>
        {recipientName ? `Message ${recipientName}` : 'Message'}
      </label>
      <textarea
        id={`${id}-input`}
        ref={inputRef}
        className="msg-composer__input"
        rows={1}
        value={text}
        onChange={onType}
        onKeyDown={onKeyDown}
        placeholder="Write a message…"
        maxLength={MAX_LENGTH}
        aria-describedby={`${id}-hint`}
        disabled={disabled}
      />
      <div className="msg-composer__bar">
        <p className="msg-composer__hint" id={`${id}-hint`}>
          Enter to send, Shift+Enter for a new line
        </p>
        <Button
          type="submit"
          size="sm"
          icon={Send}
          loading={sending}
          loadingText="Sending…"
          disabled={!text.trim() || disabled}
        >
          Send
        </Button>
      </div>
    </form>
  );
}
