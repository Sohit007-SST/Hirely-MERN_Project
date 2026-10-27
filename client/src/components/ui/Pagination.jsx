// Pagination: Previous / page numbers / Next as round pill buttons, e.g. "1 … 4 5 6 … 12". Renders nothing for a single page.
// Props: { page: number, pages: number, onChange: (nextPage) => void }
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 1 … 4 5 6 … 12
function pageList(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
}

export default function Pagination({ page = 1, pages = 1, onChange }) {
  if (!pages || pages <= 1) return null;

  return (
    <nav className="ui-pagination" aria-label="Pagination">
      <button type="button" className="ui-pagination__btn ui-pagination__step" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft size={16} aria-hidden="true" focusable="false" />
        <span>Previous</span>
      </button>
      {pageList(page, pages).map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="ui-pagination__gap" aria-hidden="true">…</span>
        ) : (
          <button
            key={p}
            type="button"
            className="ui-pagination__btn ui-pagination__num"
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => p !== page && onChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button type="button" className="ui-pagination__btn ui-pagination__step" onClick={() => onChange(page + 1)} disabled={page >= pages}>
        <span>Next</span>
        <ChevronRight size={16} aria-hidden="true" focusable="false" />
      </button>
    </nav>
  );
}
