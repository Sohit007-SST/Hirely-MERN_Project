// PopularCategories: right-rail card listing categories with their number of open gigs, each linking to the filtered Gigs page.
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card, SkeletonRow } from '../ui';
import useCategoryCounts from './useCategoryCounts';

export default function PopularCategories() {
  const { counts, failed } = useCategoryCounts();

  return (
    <Card title="Popular categories" titleAs="h2" className="home-cats">
      {failed ? (
        <p className="home-rail-note">Couldn't load categories right now.</p>
      ) : counts == null ? (
        <SkeletonRow count={3} label="Loading categories" />
      ) : counts.length === 0 ? (
        <p className="home-rail-note">No open gigs yet.</p>
      ) : (
        <ul className="home-cats__list">
          {counts.map(({ category, count }) => (
            <li key={category}>
              <Link to={`/gigs?category=${encodeURIComponent(category)}`} className="home-cats__row">
                <span className="home-cats__name">{category}</span>
                <span className="home-cats__count">
                  {count} open
                  <ChevronRight size={16} aria-hidden="true" focusable="false" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
