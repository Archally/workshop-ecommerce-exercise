import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="state-panel">
      <span className="state-panel__icon">{'\u{1F9ED}'}</span>
      <h3>Nothing here</h3>
      <p className="state-panel__detail">This page does not exist.</p>
      <Link to="/" className="button button--primary">
        Back to the shop
      </Link>
    </div>
  );
}
