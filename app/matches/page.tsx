import { AppHeader } from '@/app/components/app-header';
import { MatchesList } from '@/app/components/matches-list';

export default function MatchesPage() {
  return <main><AppHeader step="matches" /><section className="inner-page"><div className="page-heading matches-heading"><p className="eyebrow">Step 2 of 4</p><h1>These schemes may fit your situation.</h1><p className="page-lede">Each result shows why it appears for you, using your information and prototype reference rules—not guaranteed eligibility or selection.</p></div><MatchesList /></section></main>;
}
