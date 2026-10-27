// QaCard: the gig's public questions and answers, styled like a comments thread - a composer row
// (avatar + rounded input + "Post" pill that appears while typing), then grey bubbles with name, "Client" tag and time.
// The author, the gig owner and admins can delete a comment (confirmed in a Modal).
// Props: { gig, user, isOwner, onChange(comments) }
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageCircle } from 'lucide-react';
import api from '../../api/axios';
import { Avatar, Button, Card } from '../ui';
import { sameId, timeAgo } from '../../utils/format';
import ConfirmDialog from './ConfirmDialog';

function QaComment({ comment, isClient, canDelete, onDelete }) {
  const author = comment.user;
  return (
    <li className="gigs-qa__item">
      <Avatar user={author || { name: 'Deleted user' }} size={40} decorative />
      <div className="gigs-qa__main">
        <div className="gigs-qa__bubble">
          <div className="gigs-qa__meta">
            {author ? (
              <Link className="gigs-qa__name" to={`/users/${author._id}`}>{author.name}</Link>
            ) : (
              <span className="gigs-qa__name">Deleted user</span>
            )}
            {isClient && <span className="gigs-tag">Client</span>}
            <span className="gigs-qa__time">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="gigs-qa__text">{comment.text}</p>
        </div>
        {canDelete && (
          <button type="button" className="gigs-qa__delete" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

export default function QaCard({ gig, user, isOwner, onChange }) {
  const location = useLocation();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const comments = gig.comments || [];
  const typing = text.trim().length > 0;

  // Session 11: public Q&A comments
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!typing) {
      setError('Write your question first');
      return;
    }
    setSending(true);
    setError('');
    try {
      const { data } = await api.post(`/gigs/${gig._id}/comments`, { text: text.trim() });
      onChange(data.comments);
      setText('');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      const { data } = await api.delete(`/gigs/${gig._id}/comments/${toDelete}`);
      onChange(data.comments);
      toast.success('Comment deleted');
      setToDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const canDelete = (c) => Boolean(user && (user.role === 'admin' || isOwner || sameId(c.user, user)));

  return (
    <Card id="qa" className="gigs-anchor gigs-qa" title={`Questions and answers (${comments.length})`}>
      {user ? (
        <form className="gigs-qa__composer" onSubmit={onSubmit} noValidate>
          <Avatar user={user} size={40} decorative />
          <div className="gigs-qa__field">
            <label className="ui-sr-only" htmlFor="qa-text">{isOwner ? 'Add a comment' : 'Ask a question'}</label>
            <textarea
              id="qa-text"
              className="gigs-qa__input"
              rows={1}
              maxLength={500}
              placeholder={isOwner ? 'Answer a question or add details for everyone' : 'Ask about scope, files or timing'}
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'qa-error' : undefined}
            />
            {error && <p className="gigs-error" id="qa-error">{error}</p>}
            {typing && (
              <div className="gigs-qa__post">
                <span className="counter">{text.length} / 500</span>
                <Button type="submit" size="sm" loading={sending} loadingText="Posting…">Post</Button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className="gigs-note">
          <Link className="gigs-link" to="/login" state={{ from: location }}>Log in to ask a question</Link>
        </p>
      )}

      {comments.length === 0 ? (
        <p className="gigs-qa__empty">
          <MessageCircle size={18} aria-hidden="true" focusable="false" />
          No questions yet.{' '}
          {isOwner ? 'Questions from freelancers show up here.' : user ? 'Ask the client anything about scope, files or timing.' : ''}
        </p>
      ) : (
        <ul className="gigs-qa__list">
          {comments.map((c) => (
            <QaComment
              key={c._id}
              comment={c}
              isClient={sameId(c.user, gig.client)}
              canDelete={canDelete(c)}
              onDelete={() => setToDelete(c._id)}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete this comment?"
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
        loadingText="Deleting…"
      >
        <p>The comment is removed for everyone. This can't be undone.</p>
      </ConfirmDialog>
    </Card>
  );
}
