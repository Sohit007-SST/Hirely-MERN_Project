// SkillsCard: the profile's "Skills" section - one skill per row with a divider between rows.
// Props: { profile, isMe: boolean, onEdit: () => void }
import { Card, Button } from '../ui';
import EditPencil from './EditPencil';

export default function SkillsCard({ profile, isMe, onEdit }) {
  const skills = profile.skills || [];
  const isFreelancer = profile.role === 'freelancer';
  if (!skills.length && !isFreelancer) return null; // only freelancers can add skills

  return (
    <Card title="Skills" padded={false} action={isMe && <EditPencil label="Edit skills" onClick={onEdit} />}>
      {skills.length > 0 ? (
        <ul className="people-skills">
          {skills.map((s) => (
            <li key={s} className="people-skills__row">{s}</li>
          ))}
        </ul>
      ) : isMe ? (
        <div className="people-empty-line people-pad">
          <p>Add your skills so clients can find you.</p>
          <Button size="sm" variant="secondary" onClick={onEdit}>Add skills</Button>
        </div>
      ) : (
        <p className="people-muted people-pad">No skills listed.</p>
      )}
    </Card>
  );
}
