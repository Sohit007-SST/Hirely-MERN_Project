// RoleCard: one large selectable card in the Join page's role choice ("I want to hire" / "I want to work").
// It is a real radio button (keyboard arrows move between cards); selected = teal border, soft teal background, Check icon.
// Props: { name: string, value: string, checked: boolean, onChange: (value) => void, icon: LucideIcon, title: string, text: string }
import { Check } from 'lucide-react';

export default function RoleCard({ name, value, checked, onChange, icon: Icon, title, text }) {
  return (
    <label className="rest-role">
      <input
        className="rest-role__input"
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />
      <span className="rest-role__card">
        <span className="rest-role__icon" aria-hidden="true">
          <Icon size={24} focusable="false" />
        </span>
        <span className="rest-role__title">{title}</span>
        <span className="rest-role__text">{text}</span>
        <span className="rest-role__check" aria-hidden="true">
          <Check size={16} strokeWidth={3} focusable="false" />
        </span>
      </span>
    </label>
  );
}
