// HomeFeed: the logged-in home page - profile mini-card + quick links on the left, the start box and gig feed in the middle,
// suggestions, categories and the footer on the right (three-column Layout).
import Layout from '../shell/Layout';
import FreelancersToFollow from './FreelancersToFollow';
import GigFeed from './GigFeed';
import HomeFooter from './HomeFooter';
import PopularCategories from './PopularCategories';
import ProfileMiniCard from './ProfileMiniCard';
import QuickLinks from './QuickLinks';
import StartPostBox from './StartPostBox';

export default function HomeFeed({ user }) {
  return (
    <Layout
      variant="three"
      className="home-layout"
      left={
        <>
          <ProfileMiniCard user={user} />
          <QuickLinks role={user.role} />
        </>
      }
      right={
        <>
          <FreelancersToFollow />
          <PopularCategories />
          <HomeFooter />
        </>
      }
    >
      <h1 className="ui-sr-only">Your feed</h1>
      <StartPostBox user={user} />
      <GigFeed canPost={user.role === 'client'} />
    </Layout>
  );
}
