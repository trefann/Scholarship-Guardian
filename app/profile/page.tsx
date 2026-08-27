import { AppHeader } from '@/app/components/app-header';
import { ProfileForm } from '@/app/components/profile-form';

export default function ProfilePage() {
  return <main><AppHeader step="profile" /><section className="inner-page"><div className="page-heading"><p className="eyebrow">Step 1 of 4</p><h1>Tell us only what matters.</h1><p className="page-lede">These details help Guardian interpret the prototype rules. You can start with Arun Kumar’s synthetic demo profile.</p></div><ProfileForm /></section></main>;
}
