'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/lib/app-state';

export function AppHeader({ step, scholarshipId }: { step?: 'profile' | 'matches' | 'prepare' | 'xray'; scholarshipId?: string }) {
  const router = useRouter();
  const { resetToDemo } = useAppState();
  const steps = [
    { id: 'profile', label: 'Your profile', href: '/profile' },
    { id: 'matches', label: 'Matches', href: '/matches' },
    { id: 'prepare', label: 'Prepare', href: scholarshipId ? `/preparation/${scholarshipId}` : undefined },
    { id: 'xray', label: 'X-Ray', href: scholarshipId ? `/xray/${scholarshipId}` : undefined },
  ];
  const activeIndex = step ? steps.findIndex((item) => item.id === step) : -1;

  function resetJourney() {
    resetToDemo();
    router.push('/profile');
  }

  return (
    <>
      <header className="site-header app-header">
        <Link className="brand" href="/" aria-label="Scholarship Guardian home"><span className="brand-mark" aria-hidden="true">G</span><span>Scholarship Guardian</span></Link>
        <div className="header-actions"><span className="demo-chip">Demo data · synthetic</span>{step && <button className="text-button demo-reset" type="button" onClick={resetJourney}>Reset demo journey</button>}</div>
      </header>
      {step && <nav className="journey" aria-label="Application preparation progress"><ol>{steps.map((item, index) => {
        const content = <><span className="journey-index" aria-hidden="true">{index + 1}</span><span className="journey-label">{item.label}</span></>;
        return <li className={index <= activeIndex ? 'is-active' : ''} aria-current={index === activeIndex ? 'step' : undefined} key={item.id}>{item.href && index < activeIndex ? <Link href={item.href}>{content}</Link> : content}</li>;
      })}</ol></nav>}
    </>
  );
}
