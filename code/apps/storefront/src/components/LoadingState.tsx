export function LoadingState({ label }: { label: string }) {
  return (
    <div className="state-panel">
      <span className="spinner" aria-hidden="true" />
      <p className="state-panel__detail">{label}</p>
    </div>
  );
}
