// Infamous Freight — Book It Extension (Background Service Worker)

const API_BASE = 'https://api.infamousfreight.com';

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'bookLoad') {
    bookLoad(request.loadData).then(sendResponse);
    return true; // Async response
  }

  if (request.action === 'getApiKey') {
    chrome.storage.sync.get(['infamousApiKey', 'infamousCarrierId'], sendResponse);
    return true;
  }

  if (request.action === 'saveApiKey') {
    chrome.storage.sync.set({
      infamousApiKey: request.apiKey,
      infamousCarrierId: request.carrierId,
    }, () => sendResponse({ success: true }));
    return true;
  }

  if (request.action === 'checkAuth') {
    chrome.storage.sync.get(['infamousApiKey'], (result) => {
      sendResponse({ isLoggedIn: !!result.infamousApiKey });
    });
    return true;
  }
});

async function bookLoad(loadData) {
  try {
    const { infamousApiKey, infamousCarrierId } = await chrome.storage.sync.get([
      'infamousApiKey',
      'infamousCarrierId',
    ]);

    if (!infamousApiKey) {
      return { success: false, error: 'Not logged in. Open the extension popup to connect your account.' };
    }

    const response = await fetch(`${API_BASE}/loads/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${infamousApiKey}`,
      },
      body: JSON.stringify({
        ...loadData,
        carrierId: infamousCarrierId,
        source: 'browser_extension',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to book load' };
    }

    const result = await response.json();
    return { success: true, loadId: result.loadId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Show notification when load is successfully booked
function showBookingNotification(loadRef) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Load Booked!',
    message: `Load ${loadRef} has been added to your Infamous Freight dispatch board.`,
    priority: 2,
  });
}

// Listen for successful bookings from content script
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'bookingSuccess' && request.loadRef) {
    showBookingNotification(request.loadRef);
  }
});
