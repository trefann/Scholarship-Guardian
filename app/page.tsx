import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Scholarship Guardian home">
          <span className="brand-mark" aria-hidden="true">G</span>
          <span>Scholarship Guardian</span>
        </Link>
        <span className="demo-chip">Demo data · prototype</span>
      </header>

      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">Prepare with clarity</p>
          <h1>Scholarships are complicated. Your next step shouldn’t be.</h1>
          <p className="hero-lede">
            Understand what you may qualify for, which evidence matters, and what
            to fix before you continue to the official application.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/profile">
              Check my scholarships <span aria-hidden="true">→</span>
            </Link>
            <p>No sign-in needed for this prototype.</p>
          </div>
        </div>

        <aside className="xray-preview" aria-label="Application X-Ray preview">
          <div className="preview-topline">
            <div>
              <p className="eyebrow">Application X-Ray</p>
              <h2>See what a verifier might see.</h2>
            </div>
            <span className="xray-icon" aria-hidden="true">✦</span>
          </div>
          <div className="preview-summary" aria-label="Example check summary">
            <div><strong>3</strong><span>Supported</span></div>
            <div><strong>2</strong><span>Need attention</span></div>
            <div><strong>1</strong><span>Unknown</span></div>
          </div>
          <ul className="preview-checks">
            <li><span className="status-dot pass" aria-hidden="true">✓</span>Income requirement</li>
            <li><span className="status-dot attention" aria-hidden="true">!</span>Name consistency</li>
            <li><span className="status-dot unknown" aria-hidden="true">?</span>Final selection</li>
          </ul>
          <p className="preview-note">Example only. Final decisions are made by the relevant authority.</p>
        </aside>
      </section>

      <section className="trust-strip" aria-label="How Scholarship Guardian helps">
        <div className="shell trust-grid">
          <article><span>01</span><h2>Understand</h2><p>See why a scholarship appears to match your situation.</p></article>
          <article><span>02</span><h2>Prepare</h2><p>Connect every important rule to the evidence it needs.</p></article>
          <article><span>03</span><h2>Check</h2><p>Catch preventable gaps while preserving what remains unknown.</p></article>
        </div>
      </section>

      <footer className="site-footer shell">
        <p>Scholarship Guardian is a preparation prototype, not a government portal or eligibility guarantee.</p>
      </footer>
    </main>
  );
}
