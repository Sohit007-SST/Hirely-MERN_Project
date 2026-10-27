// HourlyRateCard: small right-rail card with a freelancer's hourly rate (money is shown in amber).
// Props: { profile, isMe: boolean, onEdit: () => void }
import { Card, Button } from '../ui';
import { formatINR } from '../../utils/format';
import EditPencil from './EditPencil';

export default function HourlyRateCard({ profile, isMe, onEdit }) {
  if (profile.role !== 'freelancer') return null;
  const rate = profile.hourlyRate > 0 ? profile.hourlyRate : 0;

  return (
    <Card title="Hourly rate" action={isMe && <EditPencil label="Edit hourly rate" onClick={onEdit} />}>
      {rate ? (
        <p className="people-rate">
          <strong className="people-rate__value">{formatINR(rate)}</strong>
          <span className="people-rate__unit">/hr</span>
        </p>
      ) : isMe ? (
        <div className="people-empty-line">
          <p>Add a rate so clients know what to expect.</p>
          <Button size="sm" variant="secondary" onClick={onEdit}>Add a rate</Button>
        </div>
      ) : (
        <p className="people-muted">Rate not set yet.</p>
      )}
    </Card>
  );
}
