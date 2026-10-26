import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PriceTag from '../components/PriceTag';
import { plural, timeAgo } from '../utils/format';

const STEPS = [
  { title: 'Post the work', text: 'The client describes the gig, sets a budget in rupees and adds the skills it needs.' },
  { title: 'Compare bids', text: 'Freelancers send a price, a delivery time and a short plan. The client reads them side by side.' },
  { title: 'Hire and chat', text: 'The client hires one bid. The others are closed and a private chat opens for the two of you.' },
  { title: 'Review', text: 'When the work is done the gig is marked complete and both sides rate each other.' },
];

// Buttons change with who is looking at the page
function HeroActions({ user }) {
  if (!user) {
    return (
      <>
        <Link className="btn btn--primary btn--lg" to="/register?role=client">Post a gig</Link>
        <Link className="btn btn--secondary btn--lg" to="/register?role=freelancer">Find work</Link>
      </>
    );
  }
  if (user.role === 'client') {
    return (
      <>
        <Link className="btn btn--primary btn--lg" to="/gigs/new">Post a gig</Link>
        <Link className="btn btn--secondary btn--lg" to="/dashboard">See your gigs</Link>
      </>
    );
  }
  if (user.role === 'admin') {
    return (
      <>
        <Link className="btn btn--primary btn--lg" to="/admin">Open the admin panel</Link>
        <Link className="btn btn--secondary btn--lg" to="/gigs">Browse gigs</Link>
      </>
    );
  }
  return (
    <>
      <Link className="btn btn--primary btn--lg" to="/gigs">Browse open gigs</Link>
      <Link className="btn btn--secondary btn--lg" to="/dashboard">See your bids</Link>
    </>
  );
}

function BoardSkeleton() {
  return [0, 1, 2, 3].map((i) => (
    <li key={i} className="board__row board__row--skeleton" aria-hidden="true">
      <span className="skeleton skeleton--text" />
      <span className="skeleton skeleton--tag" />
    </li>
  ));
}

export default function Home() {
  const { user } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  // Session 9: the live board is just GET /gigs with a small limit
  const load = useCallback((signal) => {
    setStatus('loading');
    api
      .get('/gigs', { params: { limit: 4, sort: 'newest' }, signal })
      .then(({ data }) => {
        setGigs(data.gigs || []);
        setStatus('ready');
      })
      .catch((err) => {
        if (signal?.aborted) return;
        setError(err.message);
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <div className="home">
      <section className="hero container">
        <div className="hero__copy">
          <p className="eyebrow">A freelance mini-marketplace</p>
          <h1 className="hero__title">
            Post the work. <span className="hero__mark">Pick the right bid.</span>
          </h1>
          <p className="lead hero__intro">
            Clients post a gig with a budget. Freelancers send a price and a plan. You compare
            the bids, hire one, and chat in private until the job is done.
          </p>
          <div className="hero__actions">
            <HeroActions user={user} />
          </div>
          {user && (
            <p className="hero__hello muted">
              Logged in as <strong>{user.name}</strong> ({user.role}).
            </p>
          )}
        </div>

        <section className="card board" aria-labelledby="board-title">
          <header className="board__head">
            <h2 id="board-title" className="board__title">
              <span className="live-dot" aria-hidden="true" /> Open right now
            </h2>
            <Link className="link small" to="/gigs">See all gigs</Link>
          </header>

          {status === 'error' ? (
            <div className="board__state" role="alert">
              <p><strong>Couldn't load gigs.</strong> {error}</p>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => load()}>
                Try again
              </button>
            </div>
          ) : status === 'ready' && gigs.length === 0 ? (
            <div className="board__state">
              <p><strong>No open gigs yet.</strong> New gigs show up here as soon as they're posted.</p>
              {(!user || user.role === 'client') && (
                <Link className="btn btn--primary btn--sm" to={user ? '/gigs/new' : '/register?role=client'}>
                  Post the first gig
                </Link>
              )}
            </div>
          ) : (
            <ul className="board__list" aria-busy={status === 'loading'}>
              {status === 'loading' ? (
                <BoardSkeleton />
              ) : (
                gigs.map((gig, i) => (
                  // --i staggers the slide-in (the app's only animation)
                  <li key={gig._id} className="board__row" style={{ '--i': i }}>
                    <div className="board__info">
                      <span className="eyebrow">{gig.category}</span>
                      <Link className="board__link stretched-link" to={`/gigs/${gig._id}`}>
                        {gig.title}
                      </Link>
                      <span className="board__meta">
                        {plural(gig.bidsCount, 'bid')} · posted {timeAgo(gig.createdAt)}
                      </span>
                    </div>
                    <PriceTag amount={gig.budget} size="md" />
                  </li>
                ))
              )}
            </ul>
          )}
        </section>
      </section>

      <section className="section container" aria-labelledby="steps-title">
        <h2 id="steps-title" className="section-title">How a gig moves</h2>
        <ol className="steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className="step card">
              <span className="step__num" aria-hidden="true">{i + 1}</span>
              <h3 className="step__title">{step.title}</h3>
              <p className="step__text">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
