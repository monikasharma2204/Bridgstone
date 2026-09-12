import SociallyApproved from '../components/SociallyApproved/SociallyApproved';

export default function HomePage() {
  return (
    <div className="page">
      <header className="page__nav">
        <span className="page__brand">
          <span className="page__brand-dot" aria-hidden="true" />
          socially.approved
        </span>
        <span className="page__nav-note">Video carousel</span>
      </header>

      <main>
        <SociallyApproved />
      </main>

      <footer className="page__footer">
       
      </footer>
    </div>
  );
}
