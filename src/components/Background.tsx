export default function Background() {
  return (
    <>
      <div className="bg-fx" aria-hidden="true">
        <div className="bg-grid" />
        <div className="bg-glow bg-glow-a" />
        <div className="bg-glow bg-glow-b" />
      </div>
      <div className="bg-noise" aria-hidden="true" />
    </>
  );
}
