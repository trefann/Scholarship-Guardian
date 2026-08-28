'use client';

import { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/lib/app-state';
import type { StudentProfile } from '@/app/lib/types';

export function ProfileForm() {
  const { profile, setProfile, resetToDemo } = useAppState();
  const router = useRouter();

  function update<K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) {
    setProfile({ ...profile, [key]: value });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    router.push('/matches');
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <div className="demo-banner">
        <span className="demo-avatar" aria-hidden="true">AK</span>
        <div><strong>Arun Kumar demo profile</strong><p>All values are synthetic and can be edited.</p></div>
        <button className="text-button" type="button" onClick={resetToDemo}>Reset demo journey</button>
      </div>

      <fieldset>
        <legend>About you</legend>
        <p className="field-intro">We only ask for information used by the three prototype scholarship rules.</p>
        <div className="form-grid">
          <label><span>Full name</span><input value={profile.name} onChange={(e) => update('name', e.target.value)} required /></label>
          <label><span>State</span><select value={profile.state} onChange={(e) => update('state', e.target.value)}><option>Tamil Nadu</option><option>Karnataka</option><option>Kerala</option><option>Other</option></select></label>
          <label><span>Native state</span><select value={profile.native_state} onChange={(e) => update('native_state', e.target.value)}><option>Tamil Nadu</option><option>Karnataka</option><option>Kerala</option><option>Other</option></select></label>
          <label><span>Category</span><select value={profile.category} onChange={(e) => update('category', e.target.value)}><option>OBC</option><option>EBC</option><option>DNT</option><option>BC</option><option>MBC</option><option>General</option></select></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Your study</legend>
        <div className="form-grid">
          <label><span>Course</span><input value={profile.course} onChange={(e) => update('course', e.target.value)} required /></label>
          <label><span>Study level</span><select value={profile.study_level} onChange={(e) => update('study_level', e.target.value)}><option>UG</option><option>PG</option></select></label>
          <label><span>Current year</span><input type="number" min="1" max="8" value={profile.year} onChange={(e) => update('year', Number(e.target.value))} /></label>
          <label><span>Institution</span><input value={profile.institution} onChange={(e) => update('institution', e.target.value)} required /></label>
          <label><span>Institution type</span><select value={profile.institution_type} onChange={(e) => update('institution_type', e.target.value)}><option>IIT</option><option>IIM</option><option>IIIT</option><option>NIT</option><option>CENTRAL_UNIVERSITY</option><option>OTHER</option></select></label>
          <label><span>Family income (₹ / year)</span><input type="number" min="0" step="1000" value={profile.annual_family_income} onChange={(e) => update('annual_family_income', Number(e.target.value))} /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Course and benefit details</legend>
        <div className="choice-grid">
          <BooleanField label="Regular full-time course" value={profile.regular_course} onChange={(value) => update('regular_course', value)} />
          <BooleanField label="Diploma student" value={profile.is_diploma_student} onChange={(value) => update('is_diploma_student', value)} />
          <BooleanField label="Drop after Class XII" value={profile.post_class12_drop} onChange={(value) => update('post_class12_drop', value)} />
          <BooleanField label="Other scholarship / fee reimbursement" value={profile.receives_other_scholarship_or_fee_reimbursement} onChange={(value) => update('receives_other_scholarship_or_fee_reimbursement', value)} />
        </div>
      </fieldset>

      <div className="form-submit"><p>Your details are assessed against prototype reference rules; this is not a guarantee of eligibility.</p><button className="button button-primary" type="submit">See scholarship matches <span aria-hidden="true">→</span></button></div>
    </form>
  );
}

function BooleanField({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <label><span>{label}</span><select value={value ? 'yes' : 'no'} onChange={(e) => onChange(e.target.value === 'yes')}><option value="yes">Yes</option><option value="no">No</option></select></label>;
}
