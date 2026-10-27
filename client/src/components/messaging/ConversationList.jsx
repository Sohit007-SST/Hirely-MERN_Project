// ConversationList: the left side of Messaging - header ("Messaging", "…" menu, compose), a search that filters
// conversations on the client, the Focused / Unread pills and the conversation rows.
// Props: { conversations, status: 'loading'|'ready', meId, role?: user role (picks where "compose" goes), activeId?,
//          onRefresh: () => void, onSelect?: (conversation) => void (docked bar; rows become buttons, otherwise links),
//          showHeader?: boolean = true (the docked bar has its own header) }
import { useMemo, useState } from 'react';
import { MoreHorizontal, RefreshCw, Search, SquarePen, Users } from 'lucide-react';
import Button from '../ui/Button';
import Dropdown from '../ui/Dropdown';
import FilterPills from '../ui/FilterPills';
import { SkeletonRow } from '../ui/Skeleton';
import { useSocket } from '../../context/SocketContext';
import { sameId } from '../../utils/format';
import { otherParticipant } from './chatUtils';
import ConversationRow from './ConversationRow';

// Name, gig title or last message contains the search text
function matches(conversation, meId, q) {
  if (!q) return true;
  const other = otherParticipant(conversation, meId);
  return [other.name, conversation.gig?.title, conversation.lastMessage?.text]
    .some((field) => field && field.toLowerCase().includes(q));
}

export default function ConversationList({
  conversations,
  status,
  meId,
  role,
  activeId,
  onRefresh,
  onSelect,
  showHeader = true,
}) {
  const { isOnline } = useSocket();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('focused'); // focused | unread

  const unreadChats = conversations.filter((c) => c.unreadCount > 0).length;
  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      conversations.filter(
        (c) =>
          matches(c, meId, q) &&
          // The open conversation stays in "Unread" after it is read, so it doesn't vanish under the reader
          (filter === 'focused' || c.unreadCount > 0 || sameId(c, activeId))
      ),
    [conversations, meId, q, filter, activeId]
  );

  const composeTo = role === 'client' ? '/freelancers' : '/gigs';
  const emptyText = q
    ? `No conversations match "${query.trim()}".`
    : filter === 'unread'
      ? "No unread messages. You're all caught up."
      : 'No conversations yet. Hire a freelancer or message a client from a gig to start chatting.';

  return (
    <div className="msg-list">
      {showHeader && (
        <div className="msg-list__head">
          <h1 className="msg-list__title" id="msg-list-title">Messaging</h1>
          <div className="msg-list__actions">
            <Dropdown
              align="end"
              label="Messaging options"
              trigger={<Button variant="tertiary" size="sm" icon={MoreHorizontal} aria-label="Messaging options" />}
              items={[
                { label: 'Refresh conversations', icon: RefreshCw, onClick: () => onRefresh() },
                { label: 'Find people to message', icon: Users, to: '/freelancers' },
              ]}
            />
            <Button
              variant="tertiary"
              size="sm"
              icon={SquarePen}
              to={composeTo}
              aria-label={role === 'client' ? 'New message: find a freelancer' : 'New message: find a gig to ask about'}
              title="New message"
            />
          </div>
        </div>
      )}

      <div className="msg-list__tools">
        <div className="msg-search">
          <Search className="msg-search__icon" size={16} aria-hidden="true" />
          <label className="ui-sr-only" htmlFor={showHeader ? 'msg-search-page' : 'msg-search-dock'}>
            Search messages
          </label>
          <input
            id={showHeader ? 'msg-search-page' : 'msg-search-dock'}
            className="msg-search__input"
            type="search"
            placeholder="Search messages"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <FilterPills
          label="Show conversations"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'focused', label: 'Focused' },
            { value: 'unread', label: 'Unread', count: unreadChats || undefined },
          ]}
        />
      </div>

      {status === 'loading' ? (
        <div className="msg-list__scroll">
          <SkeletonRow count={5} label="Loading your conversations" />
        </div>
      ) : shown.length ? (
        <ul className="msg-list__scroll msg-list__rows" aria-label="Conversations">
          {shown.map((c) => {
            const other = otherParticipant(c, meId);
            return (
              <ConversationRow
                key={c._id}
                conversation={c}
                meId={meId}
                active={sameId(c, activeId)}
                online={Boolean(other._id) && isOnline(other._id)}
                to={onSelect ? undefined : `/chat/${c._id}`}
                onSelect={onSelect}
                size={onSelect ? 48 : 56}
              />
            );
          })}
        </ul>
      ) : (
        <p className="msg-list__empty">{emptyText}</p>
      )}
    </div>
  );
}
