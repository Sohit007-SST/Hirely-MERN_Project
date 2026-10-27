// AvatarUploader: circular photo preview with a Camera overlay button, an "Upload photo" pill and the 2 MB hint.
// Flow (Session 8): choose → local preview (object URL, revoked on change/unmount) → upload as FormData field "avatar".
// Props: { onUploaded?: (user) => void (called with the updated user after a successful upload) }
import { useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, Info, Upload } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Button } from '../ui';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // same 2 MB limit as the server's multer config

export default function AvatarUploader({ onUploaded }) {
  const { user, setUser } = useAuth();
  const inputRef = useRef(null);
  const hintId = useId();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [notConfigured, setNotConfigured] = useState('');
  const [uploading, setUploading] = useState(false);

  // Local preview URL for the chosen file, released when it changes or the form closes
  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const reset = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const choose = () => inputRef.current?.click();

  const onChoose = (e) => {
    const chosen = e.target.files?.[0];
    setError('');
    setNotConfigured('');
    if (!chosen) return;
    if (!chosen.type.startsWith('image/')) {
      setError("That file isn't an image. Choose a JPG, PNG or WebP photo.");
      reset();
      return;
    }
    if (chosen.size > MAX_AVATAR_BYTES) {
      setError(`That photo is ${(chosen.size / 1024 / 1024).toFixed(1)} MB. Choose one that's 2 MB or smaller.`);
      reset();
      return;
    }
    setFile(chosen);
  };

  const onUpload = async () => {
    if (!file) return;
    const body = new FormData();
    body.append('avatar', file);
    setUploading(true);
    setError('');
    setNotConfigured('');
    try {
      const { data } = await api.put('/users/me/avatar', body);
      setUser(data.user);
      onUploaded?.(data.user);
      reset();
      toast.success('Profile photo updated');
    } catch (err) {
      // 503: Cloudinary keys missing on the server - drop the preview, nothing can be uploaded
      if (err.status === 503) {
        setNotConfigured(err.message);
        reset();
      } else {
        setError(err.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const shown = preview ? { ...user, avatar: { url: preview } } : user;

  return (
    <div className="people-photo">
      <div className="people-photo__frame">
        <Avatar user={shown} size={104} />
        <button
          type="button"
          className="people-photo__camera"
          onClick={choose}
          aria-label="Choose a profile photo"
          aria-describedby={hintId}
          disabled={uploading}
        >
          <Camera size={16} aria-hidden="true" focusable="false" />
        </button>
      </div>

      <div className="people-photo__side">
        <p className="people-hint" id={hintId}>
          {file ? `Preview of ${file.name}. Upload it to replace your current photo.` : 'JPG, PNG or WebP, up to 2 MB.'}
        </p>

        <input
          ref={inputRef}
          className="ui-sr-only"
          type="file"
          tabIndex={-1}
          aria-label="Profile photo file"
          accept="image/*"
          onChange={onChoose}
        />

        <div className="people-photo__actions">
          {file ? (
            <>
              <Button size="sm" icon={Upload} onClick={onUpload} loading={uploading} loadingText="Uploading…">
                Upload photo
              </Button>
              <Button size="sm" variant="tertiary" onClick={reset} disabled={uploading}>
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" icon={Camera} onClick={choose}>
              Upload photo
            </Button>
          )}
        </div>

        {error && <p className="people-error" role="alert">{error}</p>}
        {notConfigured && (
          <div className="people-notice" role="alert">
            <Info size={16} aria-hidden="true" focusable="false" />
            <p>
              <strong>Photo uploads are turned off on this server.</strong> {notConfigured}, then restart the API and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
