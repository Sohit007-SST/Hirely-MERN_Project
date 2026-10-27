import { useAuth } from '../context/AuthContext';
import Layout from '../components/shell/Layout';
import { SkeletonPage } from '../components/ui';
import HomeFeed from '../components/home/HomeFeed';
import LandingHero from '../components/home/LandingHero';
import NewestGigs from '../components/home/NewestGigs';

// "/" - the feed when logged in, the landing page (sign in + newest gigs) when logged out
export default function Home() {
  const { user, loading } = useAuth();

  // A saved token is still being checked: don't flash the landing page
  if (loading) {
    return (
      <Layout>
        <SkeletonPage label="Loading your feed" />
      </Layout>
    );
  }

  if (user) return <HomeFeed user={user} />;

  return (
    <Layout className="home-landing">
      <LandingHero />
      <NewestGigs />
    </Layout>
  );
}
