export default function DashboardLoading() {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        minHeight:      '60vh',
        width:          '100%',
      }}
    >
      {/* Self-animating SVG — animation is embedded in the file, no extra CSS needed */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/spinner.svg" alt="Loading…" width={56} height={56} />
    </div>
  );
}
