// LandingHero: the top of the logged-out home page - big headline, sign-in card and "hire or work" paths on the left,
// the original stacked-cards illustration on the right.
import { Briefcase, Search } from 'lucide-react';
import { Button } from '../ui';
import LandingIllustration from './LandingIllustration';
import SignInCard from './SignInCard';

export default function LandingHero() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__copy">
        <h1 id="home-hero-title" className="home-hero__title">Find work. Hire talent. Get it done.</h1>
        <p className="home-hero__lead">
          Clients post a gig with a budget. Freelancers send a price and a plan. Compare the bids, hire one and chat until
          the job is done.
        </p>
        <SignInCard />
        <div className="home-hero__paths">
          <span className="home-hero__paths-label">Not a member yet?</span>
          <Button variant="tertiary" size="sm" icon={Briefcase} to="/register?role=client">Post a gig</Button>
          <Button variant="tertiary" size="sm" icon={Search} to="/register?role=freelancer">Find work</Button>
        </div>
      </div>
      <LandingIllustration />
    </section>
  );
}
