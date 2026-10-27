// Old Loader API kept for pages not yet redesigned: the spinner is gone, it now shows skeletons.
// Props: { full?: boolean (a whole-page skeleton), label?: string = 'Loading' }
import { SkeletonPage, SkeletonRow } from './ui/Skeleton';

export default function Loader({ full = false, label = 'Loading' }) {
  return full ? <SkeletonPage label={label} /> : <SkeletonRow count={3} label={label} />;
}
