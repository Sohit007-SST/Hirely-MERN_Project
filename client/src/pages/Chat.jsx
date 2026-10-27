// Messaging page (/chat, /chat/:conversationId): one big card with the conversation list (360px) and the open thread.
// Under 768px only the list shows; opening a conversation shows its thread full screen with a back arrow.
// The real-time logic lives in components/messaging (useConversations, useThread) and is shared with DockedMessaging.
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import Layout from '../components/shell/Layout';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Skeleton, { SkeletonRow } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { sameId } from '../utils/format';
import useConversations from '../components/messaging/useConversations';
import ConversationList from '../components/messaging/ConversationList';
import Thread from '../components/messaging/Thread';

// Two-pane placeholder while the conversation list loads
function ChatSkeleton() {
  return (
    <div className="msg-card msg-card--loading">
      <div className="msg-list">
        <div className="msg-list__head">
          <Skeleton width={120} height={20} />
        </div>
        <div className="msg-list__scroll">
          <SkeletonRow count={5} label="Loading your conversations" />
        </div>
      </div>
      <div className="msg-thread msg-thread--placeholder" aria-hidden="true">
        <div className="msg-thread__head">
          <Skeleton shape="circle" width={48} height={48} />
          <div className="msg-thread__who">
            <Skeleton width="40%" />
            <Skeleton width="25%" height={12} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { conversations, status, error, reload, applyMessage } = useConversations([conversationId]);
  const active = conversations.find((c) => sameId(c, conversationId)) || null;

  let content;
  if (status === 'loading' && !conversations.length) {
    content = <ChatSkeleton />;
  } else if (status === 'error') {
    content = (
      <div className="msg-single">
        <h1 className="ui-sr-only">Messaging</h1>
        <EmptyState
          icon={MessageSquare}
          title="Couldn't load your conversations"
          text={`${error}.`}
          action={<Button onClick={() => reload()}>Try again</Button>}
        />
      </div>
    );
  } else if (!conversations.length && !conversationId) {
    content = (
      <div className="msg-single">
        <h1 className="ui-sr-only">Messaging</h1>
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          text="Hire a freelancer or message a client from a gig to start chatting."
          action={
            <Button to={user.role === 'client' ? '/dashboard' : '/gigs'}>
              {user.role === 'client' ? 'Go to your gigs' : 'Browse open gigs'}
            </Button>
          }
        />
      </div>
    );
  } else {
    content = (
      <div className={`msg-card${conversationId ? ' msg-card--open' : ''}`}>
        <aside className="msg-card__list" aria-labelledby="msg-list-title">
          <ConversationList
            conversations={conversations}
            status={status}
            meId={user._id}
            role={user.role}
            activeId={conversationId}
            onRefresh={() => reload(true)}
          />
        </aside>
        <section className="msg-card__thread" aria-label="Conversation">
          {conversationId ? (
            <Thread
              key={conversationId}
              conversationId={conversationId}
              conversation={active}
              me={user}
              onSent={applyMessage}
              before={
                <Link className="msg-thread__back" to="/chat" aria-label="Back to conversations">
                  <ArrowLeft size={20} aria-hidden="true" />
                </Link>
              }
              back={
                <Button variant="secondary" to="/chat">
                  Back to conversations
                </Button>
              }
            />
          ) : (
            <div className="msg-thread__state">
              <EmptyState
                compact
                icon={MessageSquare}
                title="Pick a conversation"
                text="Choose a chat on the left to read your messages and reply."
              />
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <Layout variant="full" className="msg-layout">
      {content}
    </Layout>
  );
}
