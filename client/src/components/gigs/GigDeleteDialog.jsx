// GigDeleteDialog: the "Delete this gig?" Modal; it calls DELETE /gigs/:id itself and reports back with onDeleted.
// Props: { gig, open, onClose, onDeleted: () => void }
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import ConfirmDialog from './ConfirmDialog';

export default function GigDeleteDialog({ gig, open, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/gigs/${gig._id}`);
      toast.success('Gig deleted');
      setDeleting(false);
      onDeleted();
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={remove}
      title="Delete this gig?"
      confirmLabel="Delete gig"
      confirmVariant="danger"
      loading={deleting}
      loadingText="Deleting…"
    >
      <p>
        <strong>{gig?.title}</strong> will be removed with its bids and questions. This can't be undone.
      </p>
    </ConfirmDialog>
  );
}
