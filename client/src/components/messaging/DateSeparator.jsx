// DateSeparator: the "Today" / "Yesterday" / "12 Oct" line between days in a message thread.
// Props: { date: ISO string of the first message that day }
import { dayLabel } from './chatUtils';

export default function DateSeparator({ date }) {
  return (
    <li className="msg-day">
      <time className="msg-day__label" dateTime={date}>{dayLabel(date)}</time>
    </li>
  );
}
