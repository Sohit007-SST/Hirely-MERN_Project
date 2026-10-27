// GigDetailPane: the right-hand pane on /gigs (desktop) - the selected gig's top card and description, without leaving the list.
// Props: { gigId, user, authLoading, onDeleted(gigId) }
import { useEffect, useState } from 'react';
import { ArrowRight, MessageCircle, SearchX } from 'lucide-react';
import api from '../../api/axios';
import { Button, Card, EmptyState, SeeMore, Skeleton } from '../ui';
import { plural } from '../../utils/format';
import GigTopCard, { GigTopCardSkeleton } from './GigTopCard';
import GigDeleteDialog from './GigDeleteDialog';
import useGigSave from './useGigSave';

export default function GigDetailPane({ gigId, user, authLoading, onDeleted }) {
  const [gig, setGig] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [reloadKey, setReloadKey] = useState(0);
  const [askDelete, setAskDelete] = useState(false);
  const { saved, saveCount, saving, toggleSave } = useGigSave(gig, setGig, user);

  // GET /gigs/:id for the full gig (client headline, comments count…)
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    api
      .get(`/gigs/${gigId}`, { signal: controller.signal })
      .then(({ data }) => {
        setGig(data.gig);
        setStatus('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setStatus(err.status === 404 || err.status === 400 ? 'notfound' : 'error');
      });
    return () => controller.abort();
  }, [gigId, reloadKey]);

  if (status === 'loading') {
    return (
      <div className="gigs-pane" aria-busy="true">
        <GigTopCardSkeleton />
        <div className="ui-card gigs-pad gigs-skel-stack">
          <Skeleton width="100%" />
          <Skeleton width="90%" />
          <Skeleton width="60%" />
        </div>
      </div>
    );
  }

  if (status !== 'ready') {
    const missing = status === 'notfound';
    return (
      <div className="gigs-pane">
        <div className="ui-card">
          <EmptyState
            compact
            icon={SearchX}
            titleAs="h2"
            title={missing ? 'This gig was removed' : "Couldn't load this gig"}
            text={missing ? 'Pick another gig from the list.' : 'Check your connection and try again.'}
            action={missing ? null : <Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>}
          />
        </div>
      </div>
    );
  }

  const questions = gig.comments?.length || 0;

  return (
    <div className="gigs-pane" aria-label="Selected gig" role="region">
      <GigTopCard
        gig={gig}
        user={user}
        authLoading={authLoading}
        titleAs="h2"
        titleLink
        saved={saved}
        saveCount={saveCount}
        saving={saving}
        onToggleSave={toggleSave}
        onDelete={() => setAskDelete(true)}
      />
      <Card title="About the gig" titleAs="h3" className="gigs-about">
        <SeeMore lines={8} className="gigs-about__text">{gig.description}</SeeMore>
        <div className="gigs-pane__links">
          <Button variant="secondary" size="sm" to={`/gigs/${gig._id}`} iconRight={ArrowRight}>Open gig page</Button>
          <Button variant="tertiary" size="sm" to={`/gigs/${gig._id}#qa`} icon={MessageCircle}>
            {questions ? plural(questions, 'question') : 'Ask a question'}
          </Button>
        </div>
      </Card>
      <GigDeleteDialog
        gig={gig}
        open={askDelete}
        onClose={() => setAskDelete(false)}
        onDeleted={() => {
          setAskDelete(false);
          onDeleted(gig._id);
        }}
      />
    </div>
  );
}
