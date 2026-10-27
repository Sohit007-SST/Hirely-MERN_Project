// MyBidCard: a freelancer's own bid on this gig (amount, days, proposal, status) with Withdraw while it is pending.
// Props: { bid, gigStatus, onWithdraw: () => void }
import { Undo2 } from 'lucide-react';
import { Button, Card, SeeMore, StatusPill } from '../ui';
import { formatINR, plural, timeAgo } from '../../utils/format';

const NOTES = {
  pending: 'The client can see your bid. You can withdraw it while it is pending.',
  accepted: "You're hired. Use the chat to agree on the next steps with the client.",
  rejected: 'The client hired another freelancer for this gig.',
};

export default function MyBidCard({ bid, gigStatus, onWithdraw }) {
  const canWithdraw = bid.status === 'pending' && gigStatus === 'open';
  return (
    <Card title="Your bid" action={<StatusPill status={bid.status} />} className="gigs-mybid">
      <p className="gigs-bid__terms">
        <span className="gigs-bid__amount">{formatINR(bid.amount)}</span>
        <span>in {plural(bid.deliveryDays, 'day')}</span>
        <span className="gigs-muted">· sent {timeAgo(bid.updatedAt || bid.createdAt)}</span>
      </p>
      <SeeMore className="gigs-bid__proposal">{bid.proposal}</SeeMore>
      <p className="gigs-note">{NOTES[bid.status]}</p>
      {canWithdraw && (
        <div className="gigs-card-actions">
          <Button variant="danger" size="sm" icon={Undo2} onClick={onWithdraw}>Withdraw bid</Button>
        </div>
      )}
    </Card>
  );
}
