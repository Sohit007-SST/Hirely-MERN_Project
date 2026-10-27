// TEMPORARY: removed in redesign Phase 8
// UI preview: every components/ui primitive with its variants, sizes and states, for checking light and dark mode.
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bookmark,
  Briefcase,
  Copy,
  Flag,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Settings,
  Sparkles,
  Trash2,
  Users,
  ChevronDown,
  Bell,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  BudgetBadge,
  Button,
  Card,
  Cover,
  Dropdown,
  EmptyState,
  FilterPills,
  Modal,
  Pagination,
  SeeMore,
  Skeleton,
  SkeletonPage,
  SkeletonPost,
  SkeletonProfile,
  SkeletonRow,
  StarRating,
  StatusPill,
  Tabs,
} from '../components/ui';

const PEOPLE = [
  { _id: '64f0a1', name: 'Priya Sharma' },
  { _id: '64f0b2', name: 'Aman Verma' },
  { _id: '64f0c3', name: 'Neha Iyer' },
  { _id: '64f0d4', name: 'Rahul Mehta' },
  { _id: '64f0e5', name: 'Sara Khan' },
];

const SIZES = [24, 32, 40, 48, 56, 72, 104, 152];
const STATUSES = ['open', 'in-progress', 'completed', 'cancelled', 'pending', 'accepted', 'rejected', 'withdrawn', 'active', 'suspended'];

const LONG_TEXT =
  'We need a responsive landing page for our bakery in Pune. It should load fast on 4G, show our menu with prices, ' +
  'have a contact form that sends to our email, and a map with our location. Design files are ready in Figma.\n\n' +
  'Please share two or three links to similar work. We would like it done within two weeks and are happy to pay a ' +
  'bonus for good SEO basics (meta tags, sitemap, fast images). Hosting is already sorted.';

// A photo for the image-avatar demo, drawn from the theme tokens (so no colours are hard-coded here)
function useDemoPhoto() {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 160, 160);
    g.addColorStop(0, css.getPropertyValue('--cover-2').trim());
    g.addColorStop(1, css.getPropertyValue('--cover-4').trim());
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 160, 160);
    ctx.fillStyle = css.getPropertyValue('--on-cover').trim();
    ctx.beginPath();
    ctx.arc(80, 62, 30, 0, Math.PI * 2);
    ctx.arc(80, 170, 58, 0, Math.PI * 2);
    ctx.fill();
    setUrl(canvas.toDataURL('image/png'));
  }, []);
  return url;
}

function Section({ title, children }) {
  return (
    <Card title={title} className="uip-section">
      <div className="stack" style={{ '--gap': '16px' }}>{children}</div>
    </Card>
  );
}

function Row({ label, children }) {
  return (
    <div className="uip-row">
      {label && <p className="uip-row__label">{label}</p>}
      <div className="row" style={{ '--gap': '12px' }}>{children}</div>
    </div>
  );
}

export default function UiPreview() {
  const photo = useDemoPhoto();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('all');
  const [filter, setFilter] = useState('all');
  const [multi, setMulti] = useState(['web']);
  const [page, setPage] = useState(4);
  const [rating, setRating] = useState(4);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const nameRef = useRef(null);

  const fakeSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setModalOpen(false);
      toast.success('Changes saved');
    }, 1200);
  };

  return (
    <div className="container page uip">
      <header className="uip-head">
        <h1>UI preview</h1>
        <p className="muted">
          Every shared primitive in <code>components/ui</code>. Switch your system to dark mode to see the dark theme. Temporary page,
          removed in Phase 8.
        </p>
      </header>

      <Section title="Button">
        <Row label="Variants (md, 40px)">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="danger">Danger</Button>
        </Row>
        <Row label="Small (32px)">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="secondary">Secondary</Button>
          <Button size="sm" variant="tertiary">Tertiary</Button>
          <Button size="sm" variant="danger">Danger</Button>
        </Row>
        <Row label="With icons">
          <Button icon={Plus}>Post a gig</Button>
          <Button variant="secondary" icon={Sparkles}>Write with Gemini</Button>
          <Button variant="tertiary" icon={Bookmark}>Save</Button>
          <Button variant="danger" icon={Trash2}>Delete</Button>
          <Button variant="secondary" iconRight={ChevronDown} size="sm">Category</Button>
        </Row>
        <Row label="Icon only (aria-label)">
          <Button icon={Pencil} aria-label="Edit" variant="tertiary" />
          <Button icon={MoreHorizontal} aria-label="More actions" variant="tertiary" size="sm" />
          <Button icon={Send} aria-label="Send" />
          <Button icon={Plus} aria-label="Add" variant="secondary" size="sm" />
        </Row>
        <Row label="States">
          <Button loading>Saving</Button>
          <Button loading loadingText="Sending…" variant="secondary">Send</Button>
          <Button loading icon={Send} aria-label="Sending" />
          <Button disabled>Disabled</Button>
          <Button variant="secondary" disabled>Disabled</Button>
        </Row>
        <Row label="As a router Link / block">
          <Button to="/gigs" variant="secondary" icon={Briefcase}>Browse gigs (Link)</Button>
          <Button to="/freelancers" variant="tertiary" icon={Users}>Network (Link)</Button>
        </Row>
        <Button block>Full width (block)</Button>
      </Section>

      <div className="grid grid--2 uip-grid">
        <Card title="Card with action and footer" action={<Button size="sm" variant="tertiary" icon={Pencil} aria-label="Edit card" />} footerTo="/freelancers" footerLabel="Show all freelancers">
          <p>Surface background, 1px border, 8px radius, no heavy shadow. The footer is a full-width link row with a top border.</p>
        </Card>
        <Card>
          <p>A card with no header and no footer: just the body.</p>
        </Card>
      </div>

      <Section title="Avatar">
        <Row label="Sizes 24 / 32 / 40 / 48 / 56 / 72 / 104 / 152 (initials, colour from the id)">
          {SIZES.map((s, i) => (
            <Avatar key={s} user={PEOPLE[i % PEOPLE.length]} size={s} />
          ))}
        </Row>
        <Row label="Image (lazy), online dot, ring">
          <Avatar user={{ _id: 'img', name: 'Photo User', avatar: { url: photo } }} size={72} />
          <Avatar user={PEOPLE[1]} size={48} online />
          <Avatar user={PEOPLE[2]} size={104} online />
          <span className="uip-ring-demo">
            <Avatar user={PEOPLE[3]} size={72} ring />
          </span>
          <Avatar user={{ name: 'Decorative' }} size={32} decorative />
        </Row>
      </Section>

      <Section title="Cover">
        <Row label="Height 56 (mini cards) - a different gradient per user id">
          {PEOPLE.map((p) => (
            <div key={p._id} className="uip-mini">
              <Cover id={p._id} height={56} />
              <Avatar user={p} size={72} ring />
              <strong>{p.name}</strong>
            </div>
          ))}
        </Row>
        <div className="uip-profile">
          <Cover id={PEOPLE[0]._id} height={200} />
          <Avatar user={PEOPLE[0]} size={152} ring online />
        </div>
      </Section>

      <Section title="Modal">
        <Row>
          <Button onClick={() => setModalOpen(true)} icon={Pencil} id="open-modal">Open modal</Button>
        </Row>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Edit intro"
          initialFocusRef={nameRef}
          footer={
            <>
              <Button variant="tertiary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button loading={saving} loadingText="Saving…" onClick={fakeSave}>Save</Button>
            </>
          }
        >
          <form className="form" onSubmit={(e) => e.preventDefault()}>
            <div className="field">
              <label className="label" htmlFor="uip-name">Name</label>
              <input ref={nameRef} id="uip-name" className="input" defaultValue="Priya Sharma" />
            </div>
            <div className="field">
              <label className="label" htmlFor="uip-headline">Headline</label>
              <input id="uip-headline" className="input" defaultValue="Founder at a small bakery" />
            </div>
            <div className="field">
              <label className="label" htmlFor="uip-bio">About</label>
              <textarea id="uip-bio" className="textarea" rows={8} defaultValue={LONG_TEXT} />
            </div>
            <div className="field">
              <label className="label" htmlFor="uip-loc">Location</label>
              <input id="uip-loc" className="input" defaultValue="Pune, India" />
            </div>
          </form>
        </Modal>
      </Section>

      <Section title="Dropdown">
        <Row>
          <Dropdown
            label="Me"
            trigger={
              <button type="button" className="uip-me" id="me-trigger">
                <Avatar user={PEOPLE[0]} size={24} decorative />
                <span>Me</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
            }
            header={
              <div className="row" style={{ '--gap': '8px' }}>
                <Avatar user={PEOPLE[0]} size={56} decorative />
                <div>
                  <strong>Priya Sharma</strong>
                  <p className="muted small">Founder at a small bakery</p>
                </div>
                <Button to="/users/me" size="sm" variant="secondary" block>View profile</Button>
              </div>
            }
            items={[
              { label: 'Edit profile', icon: Settings, to: '/settings' },
              { label: 'Dashboard', icon: Briefcase, to: '/dashboard' },
              { divider: true },
              { label: 'Sign out', icon: LogOut, onClick: () => toast('Signed out (demo)') },
            ]}
          />
          <Dropdown
            align="end"
            label="Post actions"
            trigger={<Button icon={MoreHorizontal} variant="tertiary" aria-label="More actions" id="more-trigger" />}
            items={[
              { label: 'Copy link', icon: Copy, onClick: () => toast.success('Link copied') },
              { label: 'Report', icon: Flag, onClick: () => toast('Reported (placeholder)') },
              { label: 'Disabled item', icon: Pencil, disabled: true },
              { label: 'Delete', icon: Trash2, danger: true, onClick: () => toast.error('Deleted (demo)') },
            ]}
          />
          <Dropdown label="Budget filter" trigger={<Button size="sm" variant="secondary" iconRight={ChevronDown}>Budget</Button>}>
            {({ close }) => (
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast(`Budget ₹${min || 0} – ₹${max || '∞'}`);
                  close();
                }}
              >
                <div className="field">
                  <label className="label" htmlFor="uip-min">Min (₹)</label>
                  <input id="uip-min" className="input" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="uip-max">Max (₹)</label>
                  <input id="uip-max" className="input" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} />
                </div>
                <Button type="submit" size="sm">Show results</Button>
              </form>
            )}
          </Dropdown>
        </Row>
      </Section>

      <Section title="Tabs and FilterPills">
        <Row label="Tabs (role=tablist, arrow keys move)">
          <Tabs
            label="Gig status"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'all', label: 'All', count: 12 },
              { value: 'open', label: 'Taking bids', count: 5 },
              { value: 'progress', label: 'In progress', count: 4 },
              { value: 'done', label: 'Completed', count: 3 },
            ]}
          />
        </Row>
        <Row label="FilterPills, single choice (aria-pressed)">
          <FilterPills
            label="Notification type"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'bids', label: 'Bids' },
              { value: 'messages', label: 'Messages' },
              { value: 'reviews', label: 'Reviews' },
              { value: 'follows', label: 'Follows' },
            ]}
          />
        </Row>
        <Row label="FilterPills, multiple">
          <FilterPills
            label="Categories"
            multiple
            value={multi}
            onChange={setMulti}
            options={[
              { value: 'web', label: 'Web Development' },
              { value: 'design', label: 'Design' },
              { value: 'writing', label: 'Writing' },
            ]}
          />
        </Row>
      </Section>

      <Section title="Badge">
        <Row>
          {[1, 5, 9, 10, 42].map((n) => (
            <span key={n} className="uip-badge-demo">
              <Bell size={24} aria-hidden="true" />
              <Badge count={n} label={`${n} unread notifications`} />
            </span>
          ))}
          <span className="uip-badge-demo">
            <MessageSquare size={24} aria-hidden="true" />
            <Badge count={0} />
          </span>
          <span className="muted small">(0 renders nothing)</span>
        </Row>
      </Section>

      <Section title="BudgetBadge and StatusPill">
        <Row label="BudgetBadge sm / md / lg">
          <BudgetBadge amount={2500} size="sm" />
          <BudgetBadge amount={12000} />
          <BudgetBadge amount={120000} size="lg" />
          <BudgetBadge amount={45000} size="lg" label="Budget" />
        </Row>
        <Row label="StatusPill">
          {STATUSES.map((s) => (
            <StatusPill key={s} status={s} />
          ))}
          <StatusPill status="on-hold" />
        </Row>
      </Section>

      <Section title="StarRating">
        <Row label="Read-only sm / md / lg">
          <StarRating value={4.6} count={23} size="sm" />
          <StarRating value={3.2} count={5} />
          <StarRating value={5} size="lg" />
          <StarRating value={0} count={0} size="sm" />
        </Row>
        <Row label="Input">
          <StarRating value={rating} onChange={setRating} label="Rate this freelancer" />
          <StarRating value={rating} onChange={setRating} size="lg" label="Rate this freelancer (large)" />
        </Row>
      </Section>

      <Section title="SeeMore">
        <SeeMore>{LONG_TEXT}</SeeMore>
        <SeeMore>Short text never shows the button.</SeeMore>
      </Section>

      <div className="grid grid--2 uip-grid">
        <EmptyState
          icon={Briefcase}
          title="No bids yet"
          text="Share your gig to get bids sooner."
          action={<Button size="sm" variant="secondary" icon={Copy}>Copy link</Button>}
        />
        <Card title="Compact empty state (inside a card)">
          <EmptyState compact icon={MessageSquare} title="No messages yet" text="Start a chat from a gig page." />
        </Card>
      </div>

      <Section title="Pagination">
        <Pagination page={page} pages={12} onChange={setPage} />
      </Section>

      <Section title="Toasts (bottom-left)">
        <Row>
          <Button variant="secondary" size="sm" onClick={() => toast.success('Gig posted')}>Success toast</Button>
          <Button variant="secondary" size="sm" onClick={() => toast.error('Could not save. Try again.')}>Error toast</Button>
          <Button variant="secondary" size="sm" onClick={() => toast('Aman placed a bid on your gig')}>Notification toast</Button>
        </Row>
      </Section>

      <Section title="Skeleton">
        <Row label="Blocks">
          <Skeleton width={160} />
          <Skeleton shape="circle" width={48} height={48} />
          <Skeleton shape="pill" width={96} height={32} />
          <Skeleton shape="rect" width={120} height={48} />
        </Row>
        <p className="uip-row__label">SkeletonPost</p>
        <SkeletonPost label="Loading gigs" />
        <p className="uip-row__label">SkeletonRow ×3</p>
        <SkeletonRow count={3} label="Loading list" />
        <p className="uip-row__label">SkeletonProfile</p>
        <SkeletonProfile />
      </Section>

      <Card title="SkeletonPage (what Loader full / the Suspense fallback shows)" padded={false}>
        <SkeletonPage label="Loading page" />
      </Card>
    </div>
  );
}
