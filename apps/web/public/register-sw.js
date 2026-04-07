if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' }).catch(function (error) {
      console.error('Service worker registration failed:', error);
    });
  });
}
