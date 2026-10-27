import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SearchX } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/shell/Layout';
import { Button, Card, EmptyState, Skeleton, SkeletonRow } from '../components/ui';
import { formatINR, plural, sameId } from '../utils/format';
import GigTopCard, { GigTopCardSkeleton } from '../components/gigs/GigTopCard';
import GigDeleteDialog from '../components/gigs/GigDeleteDialog';
import ConfirmDialog from '../components/gigs/ConfirmDialog';
import BidsCard from '../components/gigs/BidsCard';
import MyBidCard from '../components/gigs/MyBidCard';
import BidFormCard from '../components/gigs/BidFormCard';
import BidCallout from '../components/gigs/BidCallout';
import ReviewCard from '../components/gigs/ReviewCard';
import QaCard from '../components/gigs/QaCard';
import ClientCard from '../components/gigs/ClientCard';
import HiredCard from '../components/gigs/HiredCard';
import MoreGigsCard from '../components/gigs/MoreGigsCard';
import useGigSave from '../components/gigs/useGigSave';
import useHashScroll, { scrollToSection } from '../components/gigs/useHashScroll';
import { gigPermissions } from '../components/gigs/gigHelpers';

// Right rail while the gig loads
function RailSkeleton() {
  return (
    <div className="ui-card gigs-rail-skel" role="status" aria-busy="true">
      <span className="ui-sr-only">Loading…</span>
      <Skeleton shape="rect" height={56} width="100%" />
      <div className="gigs-skel-stack gigs-pad">
        <Skeleton shape="circle" width={72} height={72} />
        <Skeleton width="60%" />
        <Skeleton width="80%" height={12} />
      </div>
    </div>
  );
}

export default function GigDetails() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [gig, setGig] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [bids, setBids] = useState([]);
  const [bidsStatus, setBidsStatus] = useState('idle'); // idle | loading | ready | error
  const [bidsKey, setBidsKey] = useState(0);
  const [mine, setMine] = useState({ status: 'idle', reviewed: false, review: null });
  const [busy, setBusy] = useState(''); // complete | hire | chat | withdraw
  const [confirm, setConfirm] = useState(null); // { kind: 'delete'|'complete'|'hire'|'withdraw', bid? }

  // Session 9: the gig detail page - GET /gigs/:id
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    api
      .get(`/gigs/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        setGig(data.gig);
        setStatus('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err.message);
        // A malformed id comes back as 400/404: both mean "no such gig"
        setStatus(err.status === 404 || err.status === 400 ? 'notfound' : 'error');
      });
    return () => controller.abort();
  }, [id, reloadKey]);

  const gigId = gig?._id;
  const role = user?.role;
  const { isOwner, isAdmin } = gigPermissions(gig, user);
  const isFreelancer = role === 'freelancer';
  const isHired = Boolean(user && sameId(gig?.assignedFreelancer, user));
  const canSeeBids = Boolean(user && gig && (isOwner || isAdmin || isFreelancer));
  const { saved, saveCount, saving, toggleSave } = useGigSave(gig, setGig, user);

  // Owner/admin get every bid; a freelancer gets only their own
  useEffect(() => {
    if (!canSeeBids) {
      setBids([]);
      setBidsStatus('idle');
      return undefined;
    }
    const controller = new AbortController();
    setBidsStatus('loading');
    api
      .get(`/gigs/${gigId}/bids`, { signal: controller.signal })
      .then(({ data }) => {
        setBids(data.bids || []);
        setBidsStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setBidsStatus('error');
      });
    return () => controller.abort();
  }, [canSeeBids, gigId, user?._id, bidsKey]);

  // After completion: has the client / hired freelancer already reviewed?
  const canReview = gig?.status === 'completed' && (isOwner || isHired);
  useEffect(() => {
    if (!canReview) return undefined;
    let active = true;
    setMine({ status: 'loading', reviewed: false, review: null });
    api
      .get(`/reviews/gig/${gigId}/mine`)
      .then(({ data }) => {
        if (active) setMine({ status: 'ready', reviewed: data.reviewed, review: data.review });
      })
      .catch(() => {
        if (active) setMine({ status: 'ready', reviewed: false, review: null });
      });
    return () => {
      active = false;
    };
  }, [canReview, gigId]);

  // #qa / #bid / #bids from the Home feed: scroll once the sections are in place
  const sectionsReady = status === 'ready' && !authLoading && bidsStatus !== 'loading' && (!canSeeBids || bidsStatus !== 'idle');
  useHashScroll(sectionsReady);

  const markComplete = async () => {
    setBusy('complete');
    try {
      const { data } = await api.patch(`/gigs/${gigId}/complete`);
      setGig((g) => ({ ...g, status: data.gig.status }));
      setConfirm(null);
      toast.success('Gig marked complete. Leave a review below');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  // Hire: accept the bid, then open the private chat the server created (Sessions 12-13)
  const hire = async (bid) => {
    const name = bid.freelancer?.name || 'this freelancer';
    setBusy('hire');
    try {
      const { data } = await api.patch(`/bids/${bid._id}/accept`);
      toast.success(`You hired ${name}. Say hello in the chat`);
      navigate(`/chat/${data.conversationId}`);
    } catch (err) {
      toast.error(err.message);
      setBusy('');
      setConfirm(null);
      setBidsKey((k) => k + 1);
    }
  };

  // POST /chat/conversations finds or creates the chat, linked to this gig
  const openChat = useCallback(
    async (userId) => {
      setBusy('chat');
      try {
        const { data } = await api.post('/chat/conversations', { userId, gigId });
        navigate(`/chat/${data.conversation._id}`);
      } catch (err) {
        toast.error(err.message);
        setBusy('');
      }
    },
    [gigId, navigate]
  );

  const withdraw = async (bid) => {
    setBusy('withdraw');
    try {
      const { data } = await api.patch(`/bids/${bid._id}/withdraw`);
      setBids([{ ...bid, ...data.bid, freelancer: bid.freelancer }]);
      setGig((g) => ({ ...g, bidsCount: Math.max(0, (g.bidsCount || 0) - 1) }));
      setConfirm(null);
      toast.success('Bid withdrawn');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const onBidPlaced = (bid) => {
    setBids([bid]);
    setGig((g) => ({ ...g, bidsCount: (g.bidsCount || 0) + 1 }));
  };

  if (status === 'loading') {
    return (
      <Layout variant="two-right" right={<RailSkeleton />} className="gigs-details">
        <GigTopCardSkeleton />
        <Card title="About the gig"><SkeletonRow count={1} label="Loading description" /></Card>
      </Layout>
    );
  }

  if (status === 'notfound' || status === 'error') {
    const missing = status === 'notfound';
    return (
      <Layout variant="full" className="gigs-details">
        <div className="ui-card">
          <EmptyState
            icon={SearchX}
            title={missing ? "This gig doesn't exist or was removed" : "Couldn't load this gig"}
            text={
              missing
                ? 'The client may have deleted it, or the link is wrong. Browse the open gigs instead.'
                : `${error}. Check your connection and try again.`
            }
            action={
              missing ? (
                <Button to="/gigs">Browse gigs</Button>
              ) : (
                <Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
              )
            }
          />
        </div>
      </Layout>
    );
  }

  const client = gig.client || {};
  const myBid = isFreelancer && bidsStatus === 'ready' ? bids[0] : null;
  const activeBid = myBid && myBid.status !== 'withdrawn' ? myBid : null;

  // The bid block under the description: depends on who is looking
  let bidSection = null;
  if (authLoading) {
    bidSection = null;
  } else if (!user) {
    bidSection = gig.status === 'open' && <BidCallout kind="guest" />;
  } else if (isOwner || isAdmin) {
    bidSection = (
      <BidsCard
        bids={bids}
        status={bidsStatus === 'idle' ? 'loading' : bidsStatus}
        canHire={isOwner && gig.status === 'open'}
        busy={Boolean(busy)}
        onHire={(bid) => setConfirm({ kind: 'hire', bid })}
        onMessage={openChat}
        onRetry={() => setBidsKey((k) => k + 1)}
      />
    );
  } else if (isFreelancer) {
    if (bidsStatus === 'loading' || bidsStatus === 'idle') {
      bidSection = (
        <Card id="bid" className="gigs-anchor" title="Your bid">
          <SkeletonRow count={1} label="Checking your bid" />
        </Card>
      );
    } else if (bidsStatus === 'error') {
      bidSection = (
        <Card id="bid" className="gigs-anchor">
          <div className="gigs-alert gigs-alert--error" role="alert">
            Couldn't check whether you've bid on this gig.
            <Button variant="tertiary" size="sm" onClick={() => setBidsKey((k) => k + 1)}>Try again</Button>
          </div>
        </Card>
      );
    } else if (activeBid) {
      bidSection = (
        <div id="bid" className="gigs-anchor">
          <MyBidCard bid={activeBid} gigStatus={gig.status} onWithdraw={() => setConfirm({ kind: 'withdraw', bid: activeBid })} />
        </div>
      );
    } else if (gig.status === 'open') {
      bidSection = (
        <div id="bid" className="gigs-anchor">
          <BidFormCard key={myBid?._id || 'new'} gig={gig} previous={myBid} onPlaced={onBidPlaced} />
        </div>
      );
    } else {
      bidSection = <BidCallout kind="closed" />;
    }
  } else if (role === 'client') {
    bidSection = <BidCallout kind="client" />;
  }

  // Confirm dialog text for the action being confirmed
  const hireBid = confirm?.kind === 'hire' ? confirm.bid : null;
  const otherPending = hireBid ? bids.filter((b) => b.status === 'pending' && b._id !== hireBid._id).length : 0;

  const rail = (
    <>
      <ClientCard
        client={client}
        isOwner={isOwner}
        user={user}
        authLoading={authLoading}
        busy={busy === 'chat'}
        onMessage={() => openChat(client._id)}
      />
      {gig.assignedFreelancer && <HiredCard freelancer={gig.assignedFreelancer} />}
      <MoreGigsCard gigId={gigId} category={gig.category} />
    </>
  );

  return (
    <Layout variant="two-right" right={rail} className="gigs-details">
      <GigTopCard
        gig={gig}
        user={user}
        authLoading={authLoading}
        saved={saved}
        saveCount={saveCount}
        saving={saving}
        onToggleSave={toggleSave}
        onDelete={() => setConfirm({ kind: 'delete' })}
        onComplete={() => setConfirm({ kind: 'complete' })}
        completing={busy === 'complete'}
        onPlaceBid={() => scrollToSection('bid', 'input, textarea, button')}
        bidLabel={activeBid ? 'View your bid' : 'Place bid'}
      />

      <Card title="About the gig" className="gigs-about">
        <p className="gigs-about__text">{gig.description}</p>
      </Card>

      {canReview && (
        <ReviewCard
          gigId={gigId}
          reviewee={isOwner ? gig.assignedFreelancer : client}
          mine={mine}
          onReviewed={(review) => setMine({ status: 'ready', reviewed: true, review })}
        />
      )}

      {bidSection}

      <QaCard gig={gig} user={user} isOwner={isOwner} onChange={(comments) => setGig((g) => ({ ...g, comments }))} />

      <GigDeleteDialog
        gig={gig}
        open={confirm?.kind === 'delete'}
        onClose={() => setConfirm(null)}
        onDeleted={() => navigate(isOwner ? '/dashboard' : '/gigs', { replace: true })}
      />

      <ConfirmDialog
        open={confirm?.kind === 'complete'}
        onClose={() => setConfirm(null)}
        onConfirm={markComplete}
        title="Mark this gig as complete?"
        confirmLabel="Mark complete"
        loading={busy === 'complete'}
        loadingText="Saving…"
      >
        <p>You and {gig.assignedFreelancer?.name || 'the freelancer'} can then review each other.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(hireBid)}
        onClose={() => setConfirm(null)}
        onConfirm={() => hire(hireBid)}
        title={`Hire ${hireBid?.freelancer?.name || 'this freelancer'}?`}
        confirmLabel={`Hire for ${formatINR(hireBid?.amount)}`}
        loading={busy === 'hire'}
        loadingText="Hiring…"
      >
        <p>
          You'll hire {hireBid?.freelancer?.name || 'this freelancer'} for <strong>{formatINR(hireBid?.amount)}</strong>
          {hireBid ? `, delivered in ${plural(hireBid.deliveryDays, 'day')}` : ''}. The gig moves to in progress and a chat opens.
        </p>
        {otherPending > 0 && <p>{plural(otherPending, 'other pending bid')} will be rejected.</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.kind === 'withdraw'}
        onClose={() => setConfirm(null)}
        onConfirm={() => withdraw(confirm.bid)}
        title="Withdraw your bid?"
        confirmLabel="Withdraw bid"
        confirmVariant="danger"
        loading={busy === 'withdraw'}
        loadingText="Withdrawing…"
      >
        <p>The client won't see it any more. You can bid again while the gig is open.</p>
      </ConfirmDialog>
    </Layout>
  );
}
