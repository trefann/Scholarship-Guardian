import Link from 'next/link';

export function AppHeader({ step }: { step?: 'profile' | 'matches' | 'prepare' | 'xray' }) {
  const steps = [{ id: 'profile', label: 'Your profile' }, { id: 'matches', label: 'Matches' }, { id: 'prepare', label: 'Prepare' }, { id: 'xray', label: 'X-Ray' }];
  const activeIndex = step ? steps.findIndex((item) => item.id === step) : -1;
  return (
    <>
      <header className="site-header app-header">
        <Link className="brand" href="/" aria-label="Scholarship Guardian home"><span className="brand-mark" aria-hidden="true">G</span><span>Scholarship Guardian</span></Link>
        <span className="demo-chip">Demo data · synthetic</span>
      </header>
      {step && <nav className="journey" aria-label="Application preparation progress"><ol>{steps.map((item, index) => <li className={index <= activeIndex ? 'is-active' : ''} aria-current={index === activeIndex ? 'step' : undefined} key={item.id}><span>{index + 1}</span>{item.label}</li>)}</ol></nav>}
    </>
  );
}
