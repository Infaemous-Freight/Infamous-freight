export default function Head() {
  return (
    <>
      <meta name="theme-color" content="#0b0f19" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="mobile-web-app-capable" content="yes" />
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/apple-icon" />
      <link rel="mask-icon" href="/mask-icon.svg" color="#0b0f19" />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').catch(function (error) {
                  if ('${process.env.NODE_ENV}' !== 'production') {
                    console.error('Service worker registration failed:', error);
                  }
                });
              });
            }
          `,
        }}
      />
    </>
  );
}
