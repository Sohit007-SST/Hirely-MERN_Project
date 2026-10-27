// Thread: one open conversation - header, the message log (date separators + grouped messages, "Load older messages"),
// the typing dots and the composer. Used full-size on the Messaging page and compact in the docked chat window.
// Props: { conversationId, conversation (list item, or null while the list loads), me (logged-in user),
//          onSent: (chatMessage) => void (updates the conversation list), compact?: boolean,
//          before?: ReactNode (header start, e.g. back arrow), actions?: ReactNode (header end, e.g. close),
//          back?: ReactNode (action shown on the "not found" / "not yours" states) }
import { useMemo } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import { useSocket } from '../../context/SocketContext';
import { sameId } from '../../utils/format';
import { firstName, groupMessages, otherParticipant } from './chatUtils';
import useThread from './useThread';
import ThreadHeader from './ThreadHeader';
import ThreadError from './ThreadError';
import DateSeparator from './DateSeparator';
import MessageGroup from './MessageGroup';
import TypingDots from './TypingDots';
import Composer from './Composer';

// Message-shaped placeholders while the history loads
function ThreadSkeleton() {
  return (
    <div className="msg-log__skeleton" role="status" aria-busy="true">
      <span className="ui-sr-only">Loading messages…</span>
      {['60%', '45%', '70%'].map((w, i) => (
        <div key={w} className="msg-group">
          <Skeleton shape="circle" width={40} height={40} />
          <div className="msg-group__body">
            <Skeleton width={i === 1 ? '30%' : '22%'} />
            <Skeleton width={w} />
            {i !== 1 && <Skeleton width="35%" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Thread({ conversationId, conversation, me, onSent, compact = false, before, actions, back }) {
  const { isOnline } = useSocket();
  const { messages, hasMore, status, error, retry, loadingOlder, loadOlder, otherTyping, scrollRef, sendMessage } =
    useThread(conversationId, me);
  const items = useMemo(() => groupMessages(messages), [messages]);

  const other = conversation ? otherParticipant(conversation, me._id) : null;
  const online = other?._id ? isOnline(other._id) : false;
  const otherFirst = other ? firstName(other.name) : '';

  const send = async (text) => {
    const chatMessage = await sendMessage(text);
    onSent(chatMessage);
  };

  const older = async () => {
    try {
      await loadOlder();
    } catch (err) {
      toast.error(`Couldn't load older messages. ${err.message}`);
    }
  };

  if (status === 'error') {
    return (
      <div className={`msg-thread${compact ? ' msg-thread--compact' : ''}`}>
        {actions && (
          <header className="msg-thread__head msg-thread__head--compact">
            <span className="msg-thread__who" />
            <div className="msg-thread__actions">{actions}</div>
          </header>
        )}
        <ThreadError error={error} onRetry={retry} back={back} />
      </div>
    );
  }

  return (
    <div className={`msg-thread${compact ? ' msg-thread--compact' : ''}`}>
      <ThreadHeader other={other} online={online} gig={conversation?.gig} before={before} actions={actions} compact={compact} />

      {status === 'loading' ? (
        <div className="msg-log">
          <ThreadSkeleton />
        </div>
      ) : (
        <div className="msg-log" ref={scrollRef} role="log" aria-label={other ? `Messages with ${other.name}` : 'Messages'} tabIndex={0}>
          {hasMore ? (
            <div className="msg-log__older">
              <Button variant="secondary" size="sm" onClick={older} loading={loadingOlder} loadingText="Loading older messages…">
                Load older messages
              </Button>
            </div>
          ) : (
            messages.length > 0 && (
              <p className="msg-log__start">
                This is the start of your conversation
                {conversation?.gig ? ` about "${conversation.gig.title}"` : ''}.
              </p>
            )
          )}

          {messages.length === 0 ? (
            <p className="msg-log__empty">No messages yet. Say hello{otherFirst ? ` to ${otherFirst}` : ''}.</p>
          ) : (
            <ol className="msg-log__list">
              {items.map((item) => {
                if (item.type === 'day') return <DateSeparator key={item.key} date={item.date} />;
                const mine = sameId(item.sender, me._id);
                // My groups use my current profile; theirs use the conversation's copy (falls back to the message)
                const sender = mine ? me : sameId(other, item.sender) ? other : item.sender;
                return <MessageGroup key={item.key} sender={sender} mine={mine} messages={item.messages} />;
              })}
            </ol>
          )}
        </div>
      )}

      <TypingDots name={otherFirst} active={otherTyping && online} />

      <Composer
        conversationId={conversationId}
        recipientName={other?.name}
        disabled={status !== 'ready'}
        onSend={send}
      />
    </div>
  );
}
