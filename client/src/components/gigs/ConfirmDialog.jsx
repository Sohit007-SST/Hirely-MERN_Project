// ConfirmDialog: a small yes/no Modal (Cancel + one action button) used for every confirmation on the gigs pages.
// Props: { open, onClose, onConfirm, title, children (the explanation), confirmLabel, confirmVariant='primary'|'danger',
//          loading?: boolean, loadingText?: string }
import { Button, Modal } from '../ui';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel,
  confirmVariant = 'primary',
  loading = false,
  loadingText,
}) {
  // While the request runs, closing would hide its result, so the dialog stays put
  const close = () => {
    if (!loading) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      className="gigs-confirm"
      footer={
        <>
          <Button variant="tertiary" onClick={close} disabled={loading}>Cancel</Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading} loadingText={loadingText}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="gigs-confirm__body">{children}</div>
    </Modal>
  );
}
