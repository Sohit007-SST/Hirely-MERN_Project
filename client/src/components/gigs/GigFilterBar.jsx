// GigFilterBar: the full-width filter bar under the nav on /gigs - keyword search, Category / Budget / Sort pill dropdowns,
// an "All filters" pill (a Modal with every filter at once) and Reset. It only reports changes; the page keeps them in the URL.
// Props: { draft: { q, minBudget, maxBudget } (typed values, debounced by the page), onDraft(name, value),
//          category, sort, onCategory(value), onSort(value), rangeError, hasFilters, onReset(),
//          onApplyAll({ q, category, minBudget, maxBudget, sort }) }
import { forwardRef, useState } from 'react';
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { Button, Dropdown, Modal } from '../ui';
import { CATEGORIES, formatINR } from '../../utils/format';

export const SORTS = [
  ['newest', 'Newest first'],
  ['oldest', 'Oldest first'],
  ['budget-high', 'Highest budget'],
  ['budget-low', 'Lowest budget'],
  ['popular', 'Most bids'],
];

// Budgets are whole rupees: keep digits only
export const digits = (value) => value.replace(/\D/g, '').slice(0, 9);

// Keeps menu labels lined up whether or not they carry the check mark
function Blank() {
  return <span className="gigs-menu-blank" aria-hidden="true" />;
}

// A pill-shaped dropdown trigger; filled teal while its filter is set
const FilterPill = forwardRef(function FilterPill({ active, children, ...rest }, ref) {
  return (
    <button ref={ref} type="button" className={`gigs-filter-pill${active ? ' is-active' : ''}`} {...rest}>
      {children}
      <ChevronDown size={16} aria-hidden="true" focusable="false" />
    </button>
  );
});

function budgetLabel(min, max) {
  if (min && max) return `${formatINR(min)} – ${formatINR(max)}`;
  if (min) return `From ${formatINR(min)}`;
  if (max) return `Up to ${formatINR(max)}`;
  return 'Budget';
}

// Min / max inputs, used in the Budget dropdown and in the All filters modal
// showError=false: the caller renders the message itself (with id `${idPrefix}-range-error`)
function BudgetInputs({ idPrefix, min, max, onChange, error, showError = true }) {
  const described = error ? `${idPrefix}-range-error` : undefined;
  return (
    <fieldset className="gigs-budget">
      <legend className="label">Budget (₹)</legend>
      <div className="gigs-budget__row">
        <label className="ui-sr-only" htmlFor={`${idPrefix}-min`}>Minimum budget in rupees</label>
        <input
          id={`${idPrefix}-min`}
          className="input"
          inputMode="numeric"
          placeholder="Min"
          value={min}
          onChange={(e) => onChange('minBudget', digits(e.target.value))}
          aria-invalid={Boolean(error)}
          aria-describedby={described}
        />
        <span aria-hidden="true">–</span>
        <label className="ui-sr-only" htmlFor={`${idPrefix}-max`}>Maximum budget in rupees</label>
        <input
          id={`${idPrefix}-max`}
          className="input"
          inputMode="numeric"
          placeholder="Max"
          value={max}
          onChange={(e) => onChange('maxBudget', digits(e.target.value))}
          aria-invalid={Boolean(error)}
          aria-describedby={described}
        />
      </div>
      {error && showError && <p className="gigs-error" id={`${idPrefix}-range-error`}>{error}</p>}
    </fieldset>
  );
}

// "All filters": edit everything in one place, applied together with "Show results"
function AllFiltersModal({ open, onClose, initial, onApply }) {
  const [values, setValues] = useState(initial);
  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));
  const rangeError =
    values.minBudget && values.maxBudget && Number(values.minBudget) > Number(values.maxBudget)
      ? 'The minimum is higher than the maximum.'
      : '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="All filters"
      className="gigs-allfilters"
      footer={
        <>
          <Button
            variant="tertiary"
            onClick={() => setValues({ q: '', category: '', minBudget: '', maxBudget: '', sort: 'newest' })}
          >
            Clear all
          </Button>
          <Button onClick={() => onApply(values)} disabled={Boolean(rangeError)}>Show results</Button>
        </>
      }
    >
      <div className="gigs-form-stack">
        <div className="gigs-field">
          <label className="label" htmlFor="af-q">Keywords</label>
          <input id="af-q" className="input" type="search" maxLength={100} value={values.q} onChange={(e) => set('q', e.target.value)} />
        </div>
        <div className="gigs-field">
          <label className="label" htmlFor="af-category">Category</label>
          <select id="af-category" className="select" value={values.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <BudgetInputs idPrefix="af" min={values.minBudget} max={values.maxBudget} onChange={set} error={rangeError} />
        <div className="gigs-field">
          <label className="label" htmlFor="af-sort">Sort by</label>
          <select id="af-sort" className="select" value={values.sort} onChange={(e) => set('sort', e.target.value)}>
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}

export default function GigFilterBar({
  draft,
  onDraft,
  category,
  sort,
  onCategory,
  onSort,
  rangeError,
  hasFilters,
  onReset,
  onApplyAll,
}) {
  const [allOpen, setAllOpen] = useState(false);
  const sortLabel = (SORTS.find(([v]) => v === sort) || SORTS[0])[1];
  const budgetSet = Boolean(draft.minBudget || draft.maxBudget);

  const categoryItems = [{ value: '', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))].map(
    ({ value, label }) => ({ label, icon: value === category ? Check : Blank, onClick: () => onCategory(value) })
  );
  const sortItems = SORTS.map(([value, label]) => ({ label, icon: value === sort ? Check : Blank, onClick: () => onSort(value) }));

  return (
    <div className="gigs-filterbar">
      <form className="gigs-filterbar__inner" role="search" aria-label="Filter gigs" onSubmit={(e) => e.preventDefault()}>
        <div className="gigs-filterbar__search">
          <Search className="gigs-filterbar__search-icon" size={16} aria-hidden="true" focusable="false" />
          <label className="ui-sr-only" htmlFor="gig-search">Search gigs by keyword</label>
          <input
            id="gig-search"
            className="gigs-filterbar__input"
            type="search"
            placeholder="Keywords, e.g. React or logo"
            value={draft.q}
            onChange={(e) => onDraft('q', e.target.value)}
            maxLength={100}
            autoComplete="off"
          />
        </div>

        <div className="gigs-filterbar__pills">
          <Dropdown
            label="Category"
            items={categoryItems}
            trigger={<FilterPill active={Boolean(category)} aria-label={`Category: ${category || 'all'}`}>{category || 'Category'}</FilterPill>}
          />

          <Dropdown
            label="Budget"
            className="gigs-budget-dd"
            trigger={
              <FilterPill active={budgetSet} aria-label={`Budget: ${budgetSet ? budgetLabel(draft.minBudget, draft.maxBudget) : 'any'}`}>
                {budgetLabel(draft.minBudget, draft.maxBudget)}
              </FilterPill>
            }
          >
            <div className="gigs-budget-panel">
              <BudgetInputs idPrefix="gig" min={draft.minBudget} max={draft.maxBudget} onChange={onDraft} error={rangeError} showError={false} />
            </div>
          </Dropdown>

          <Dropdown
            label="Sort by"
            align="end"
            items={sortItems}
            trigger={<FilterPill active={sort !== 'newest'} aria-label={`Sort: ${sortLabel}`}>Sort: {sortLabel}</FilterPill>}
          />

          <button type="button" className="gigs-filter-pill" onClick={() => setAllOpen(true)}>
            <SlidersHorizontal size={16} aria-hidden="true" focusable="false" />
            All filters
          </button>

          {hasFilters && (
            <Button variant="tertiary" size="sm" icon={RotateCcw} onClick={onReset}>Reset</Button>
          )}
        </div>
      </form>
      {/* Under the bar, so the warning stays visible after the budget dropdown closes */}
      {rangeError && <p className="gigs-filterbar__error" id="gig-range-error" role="status">{rangeError}</p>}

      {allOpen && (
        <AllFiltersModal
          open
          onClose={() => setAllOpen(false)}
          initial={{ ...draft, category, sort }}
          onApply={(values) => {
            setAllOpen(false);
            onApplyAll(values);
          }}
        />
      )}
    </div>
  );
}
