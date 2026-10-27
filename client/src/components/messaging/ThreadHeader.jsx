// ThreadHeader: the top of an open conversation - avatar, name (links to the profile), Online/Offline and the gig link.
// Props: { other: participant | null (null while the list is loading), online: boolean, gig?: { _id, title },
//          before?: ReactNode (e.g. the mobile back arrow), actions?: ReactNode (e.g. the docked window's close button),
//          compact?: boolean (docked window: 32px avatar) }
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Skeleton from '../ui/Skeleton';

export default function ThreadHeader({ other, online, gig, before, actions, compact = false }) {
  return (
    <header className={`msg-thread__head${compact ? ' msg-thread__head--compact' : ''}`}>
      {before}
      {other ? (
        <>
          <Avatar user={other} size={compact ? 32 : 48} online={online} decorative />
          <div className="msg-thread__who">
            {other._id ? (
              <Link className="msg-thread__name" to={`/users/${other._id}`}>{other.name}</Link>
            ) : (
              <span className="msg-thread__name">{other.name}</span>
            )}
            <span className="msg-thread__meta">
              <span className={`msg-thread__status${online ? ' is-online' : ''}`}>{online ? 'Online' : 'Offline'}</span>
              {gig && (
                <>
                  <span aria-hidden="true">·</span>
                  <Link className="msg-thread__gig" to={`/gigs/${gig._id}`}>
                    <span className="ui-sr-only">Gig: </span>
                    {gig.title}
                  </Link>
                </>
              )}
            </span>
          </div>
        </>
      ) : (
        <div className="msg-thread__who msg-thread__who--loading" aria-hidden="true">
          <Skeleton width="40%" />
          <Skeleton width="25%" height={12} />
        </div>
      )}
      {actions && <div className="msg-thread__actions">{actions}</div>}
    </header>
  );
}
