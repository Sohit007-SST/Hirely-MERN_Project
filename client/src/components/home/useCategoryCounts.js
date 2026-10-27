// useCategoryCounts: open-gig counts per category, counted on the client from one GET /gigs?limit=50 call.
// Returns { counts: Array<{ category, count }> | null (loading), failed: boolean }, busiest first, empty categories left out.
import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function useCategoryCounts() {
  const [counts, setCounts] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get('/gigs', { params: { limit: 50 }, signal: controller.signal })
      .then(({ data }) => {
        const tally = {};
        data.gigs.forEach((g) => {
          tally[g.category] = (tally[g.category] || 0) + 1;
        });
        setCounts(
          Object.entries(tally)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  return { counts, failed };
}
