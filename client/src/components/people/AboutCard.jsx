// AboutCard: the profile's "About" section - the bio clamped to 3 lines with "…see more".
// Props: { profile, isMe: boolean, onEdit: () => void }
import { Card, SeeMore, Button } from '../ui';
import EditPencil from './EditPencil';

export default function AboutCard({ profile, isMe, onEdit }) {
  const firstName = profile.name.split(' ')[0];

  return (
    <Card title="About" action={isMe && <EditPencil label="Edit about" onClick={onEdit} />}>
      {profile.bio ? (
        <SeeMore className="people-about">{profile.bio}</SeeMore>
      ) : isMe ? (
        <div className="people-empty-line">
          <p>You haven't written a bio yet. Add one so people know what you do.</p>
          <Button size="sm" variant="secondary" onClick={onEdit}>Add a bio</Button>
        </div>
      ) : (
        <p className="people-muted">{firstName} hasn't written a bio yet.</p>
      )}
    </Card>
  );
}
