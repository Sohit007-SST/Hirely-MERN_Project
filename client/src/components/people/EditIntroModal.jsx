// EditIntroModal: the profile Pencil opens this Modal with the same EditIntroForm as /settings; it closes after a save.
// Props: { open: boolean, onClose: () => void, onSaved?: (user) => void (also called after a new photo is uploaded) }
import { useCallback, useRef, useState } from 'react';
import { Button, Modal } from '../ui';
import EditIntroForm from './EditIntroForm';

const FORM_ID = 'edit-intro-modal-form';

export default function EditIntroModal({ open, onClose, onSaved }) {
  const nameRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const onSavingChange = useCallback((value) => setSaving(value), []);

  const handleSaved = (user) => {
    onSaved?.(user);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit intro"
      initialFocusRef={nameRef}
      className="people-intro-modal"
      footer={
        <>
          <Button variant="tertiary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form={FORM_ID} loading={saving} loadingText="Saving…">Save</Button>
        </>
      }
    >
      {open && (
        <EditIntroForm
          id={FORM_ID}
          firstFieldRef={nameRef}
          headingAs="h3"
          onSaved={handleSaved}
          onSavingChange={onSavingChange}
          onPhotoUploaded={onSaved}
        />
      )}
    </Modal>
  );
}
