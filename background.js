chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getCurrentTabUrl") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        sendResponse({ url: null, title: null, error: "No active tab." });
      } else {
        sendResponse({ url: tabs[0].url, title: tabs[0].title });
      }
    });
    return true;
  }
});
