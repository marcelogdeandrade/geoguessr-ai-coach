// GeoGuessr AI Coach - Background Service Worker

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Enable side panel on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
