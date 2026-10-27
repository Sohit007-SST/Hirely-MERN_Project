import { useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/shell/Layout';
import { Button } from '../components/ui';
import { EditIntroForm } from '../components/people';

const FORM_ID = 'settings-intro-form';

// /settings: the Edit intro form as a page that looks like the modal (header with X, sections, sticky footer)
export default function Settings() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const onSavingChange = useCallback((value) => setSaving(value), []);
  const profileLink = `/users/${user._id}`;

  return (
    <Layout className="people-settings">
      <section className="ui-card people-sheet" aria-labelledby="settings-title">
        <header className="people-sheet__head">
          <div>
            <h1 id="settings-title" className="people-sheet__title">Edit intro</h1>
            <p className="people-sheet__sub">
              Change how you appear to {user.role === 'freelancer' ? 'clients' : 'freelancers'}. Signed in as <strong>{user.email}</strong>.
            </p>
          </div>
          <Button variant="tertiary" icon={X} to={profileLink} aria-label="Close and go to your profile" title="Close" />
        </header>

        <div className="people-sheet__body">
          <EditIntroForm id={FORM_ID} onSavingChange={onSavingChange} />
        </div>

        <footer className="people-sheet__foot">
          <Button variant="tertiary" to={profileLink}>View your profile</Button>
          <Button type="submit" form={FORM_ID} loading={saving} loadingText="Saving…">Save changes</Button>
        </footer>
      </section>
    </Layout>
  );
}
