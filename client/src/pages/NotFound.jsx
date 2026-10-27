import { Home } from 'lucide-react';
import { Layout } from '../components/shell';
import { Button } from '../components/ui';
import NotFoundArt from '../components/rest/NotFoundArt';

export default function NotFound() {
  return (
    <Layout variant="full">
      <section className="rest-404" aria-labelledby="not-found-title">
        <NotFoundArt />
        <h1 id="not-found-title" className="rest-404__title">
          This page doesn't exist
        </h1>
        <p className="rest-404__text">The link may be old or mistyped. Your feed has the newest open gigs.</p>
        <div className="rest-404__actions">
          <Button icon={Home} to="/">
            Go to your feed
          </Button>
          <Button variant="tertiary" to="/gigs">
            Browse gigs
          </Button>
        </div>
      </section>
    </Layout>
  );
}
