'use client';

/**
 * Root error boundary — the last line of defence if even the root layout throws.
 * It replaces the whole document, so it ships its own <html>/<body> and uses
 * inline styles (the app stylesheet may not have loaded). Data stays local and
 * safe; the button does a full reload to recover.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: 24,
          textAlign: 'center',
          background: 'radial-gradient(900px 500px at 70% -10%, #0B3D79, #061B3A 60%, #03101F)',
          color: '#EAF1FB',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1 }}>PB</div>
        <h1 style={{ margin: 0, fontSize: 24, letterSpacing: 1, textTransform: 'uppercase' }}>
          Open Pickleball needs a quick reset
        </h1>
        <p style={{ margin: 0, maxWidth: 460, color: '#AFC0D8', fontSize: 14, lineHeight: 1.5 }}>
          The app hit an unexpected error. Your data is stored only on this device and is safe —
          reload to get back on the court.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: 8,
            background: '#FFD626',
            color: '#06182F',
            border: 'none',
            borderRadius: 8,
            padding: '12px 22px',
            fontWeight: 700,
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: 1,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
        <p style={{ margin: 0, fontSize: 11, color: '#7E93B4' }}>Nothing was sent anywhere · 100% local</p>
      </body>
    </html>
  );
}
