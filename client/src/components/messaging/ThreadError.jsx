// ThreadError: what an open conversation shows when its messages can't load - a bad or old link (400/404),
// someone else's conversation (403), or any other error with "Try again".
// Props: { error: { status?, message }, onRetry: () => void, back?: ReactNode (a "Back to conversations" action) }
import { MessageSquare } from 'lucide-react';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

export default function ThreadError({ error, onRetry, back }) {
  let props;
  if (error.status === 404 || error.status === 400) {
    props = {
      title: "We couldn't find this conversation",
      text: 'The link may be old or mistyped. Pick a conversation from your list instead.',
      action: back,
    };
  } else if (error.status === 403) {
    props = {
      title: "This conversation isn't yours",
      text: 'Only the two people in a chat can read it. Pick one of your own conversations.',
      action: back,
    };
  } else {
    props = {
      title: "Couldn't load messages",
      text: `${error.message}.`,
      action: (
        <>
          <Button onClick={onRetry}>Try again</Button>
          {back}
        </>
      ),
    };
  }
  return (
    <div className="msg-thread__state">
      <EmptyState compact icon={MessageSquare} {...props} />
    </div>
  );
}
