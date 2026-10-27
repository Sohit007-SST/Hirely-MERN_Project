// Old Avatar API kept for pages not yet redesigned: maps xs/sm/md/lg/xl onto the new ui/Avatar pixel sizes.
// Props: { user: { _id?, name, avatar?: { url } }, size?: 'xs'|'sm'|'md'|'lg'|'xl' = 'md', online?: boolean, decorative?: boolean }
import UiAvatar from './ui/Avatar';

const PX = { xs: 24, sm: 32, md: 40, lg: 56, xl: 104 };

export default function Avatar({ user, size = 'md', online = false, decorative = false }) {
  return <UiAvatar user={user} size={PX[size] || 40} online={online} decorative={decorative} />;
}
