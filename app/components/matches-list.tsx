'use client';

import Link from 'next/link';
import source from '@/app/data/scholarships.json';
import { useAppState } from '@/app/lib/app-state';
import { evaluateScholarship, fieldLabel, formatValue } from '@/app/lib/rules-engine';
import type { MatchEvaluation, MatchLevel, ScholarshipDataset } from '@/app/lib/types';
import { StatusBadge } from './status-badge';

const dataset = source as ScholarshipDataset;
const groups: { level: MatchLevel; title: string; description: string }[] = [
  { level: 'strong_match', title: 'Strong match', description: 'Published core rules are supported by the information provided.' },
  { level: 'possible_match', title: 'Possible match', description: 'No known blocker, but an important item still needs confirmation.' },
  { level: 'not_currently_matching', title: 'Not currently matching', description: 'At least one published core condition does not currently match.' },
];

export function MatchesList() {
  const { profile } = useAppState();
  const evaluations = dataset.schemes.map((scheme) => evaluateScholarship(profile, scheme));

  return (
    <>
      <div className="matches-summary">
        <div><span className="demo-avatar" aria-hidden="true">AK</span><div><p>Based on your information</p><strong>{profile.name}</strong><span>{profile.course} · {profile.institution} · ₹{profile.annual_family_income.toLocaleString('en-IN')} family income</span></div></div>
        <Link className="text-button" href="/profile">Edit profile</Link>
      </div>
      <div className="match-groups">
        {groups.map((group) => {
          const items = evaluations.filter((item) => item.level === group.level);
          if (!items.length) return null;
          return <section className="match-group" key={group.level}><div className="group-heading"><div><h2>{group.title}</h2><p>{group.description}</p></div><span>{items.length}</span></div><div className="scheme-list">{items.map((item) => <ScholarshipCard key={item.scholarship.id} evaluation={item} />)}</div></section>;
        })}
      </div>
      <p className="dataset-note"><strong>Prototype research dataset v{dataset.dataset_version}.</strong> Rules, dates, institution lists, and current-cycle requirements must be re-verified against official sources before public use.</p>
    </>
  );
}

function ScholarshipCard({ evaluation }: { evaluation: MatchEvaluation }) {
  const { scholarship, results } = evaluation;
  const highlights = results.filter((result) => result.status !== 'UNKNOWN').slice(0, 4);
  const unknownCount = results.filter((result) => result.status === 'UNKNOWN').length;
  return (
    <article className="scheme-card">
      <div className="scheme-main">
        <div className="scheme-meta"><span>{scholarship.authority}</span>{scholarship.mvp_priority === 'HERO' && <span className="hero-scheme">Featured journey</span>}</div>
        <h3>{scholarship.name}</h3>
        <p>{scholarship.target_profile}</p>
        <Link className="button button-secondary" href={`/scholarship/${scholarship.id}`}>Why this may match <span aria-hidden="true">→</span></Link>
      </div>
      <div className="rule-snapshot" aria-label="Rule assessment summary">
        <p className="rule-snapshot-title">Why you’re seeing this</p>
        <ul>{highlights.map(({ rule, status, provenance, actualValue }) => <li key={rule.id}><StatusBadge status={status} /><span className="rule-label"><strong>{formatValue(actualValue, rule.field)}</strong><small>{fieldLabel(rule.field)}</small>{provenance.basis === 'DEMO_INFERENCE' && <small className="provenance-tag">Demo inference · not verified</small>}</span></li>)}</ul>
        {unknownCount > 0 && <p className="unknown-note">+ {unknownCount} authority-dependent or unknown item{unknownCount > 1 ? 's' : ''}</p>}
      </div>
    </article>
  );
}
