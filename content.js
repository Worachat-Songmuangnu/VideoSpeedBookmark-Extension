// === Utility Functions ===
function getVideo() {
  const videos = document.querySelectorAll("video");
  return videos.length > 0 ? videos[0] : null;
}

// === Speed Control Feature ===
function adjustSpeed(video, increment) {
  let speed = video.playbackRate + increment;
  speed = Math.max(0.25, Math.min(4.0, speed));
  video.playbackRate = speed;
  const label =
    video.parentNode.querySelector(".speedlabel") ||
    document.createElement("div");
  label.className = "speedlabel";
  label.textContent = `${speed.toFixed(2)}x`;
  video.parentNode.appendChild(label);
}

function createSpeedUI(video) {
  const container = video.parentNode;
  let speedLabel = container.querySelector(".speedlabel");

  if (!speedLabel) {
    speedLabel = document.createElement("div");
    speedLabel.className = "speedlabel";
    container.appendChild(speedLabel);
  }

  speedLabel.textContent = `${video.playbackRate.toFixed(2)}x`;
  speedLabel.style.display = "block";

  video.onratechange = () => {
    speedLabel.textContent = `${video.playbackRate.toFixed(2)}x`;
  };
}

// === Bookmark Feature ===
function saveTimestamp(currentUrl) {
  const video = getVideo();
  if (!video) return;

  const time = video.currentTime;
  chrome.storage.sync.get(["bookmarks"], (result) => {
    let bookmarks = result.bookmarks || {};
    if (!bookmarks[currentUrl]) bookmarks[currentUrl] = [];
    bookmarks[currentUrl].push(time);
    chrome.storage.sync.set({ bookmarks }, () => {
      console.log("Timestamp saved:", time, "for URL:", currentUrl);
    });
  });
}

function playFromTimestamp(currentUrl, index) {
  const video = getVideo();
  if (!video) return;

  chrome.storage.sync.get(["bookmarks"], (result) => {
    const bookmarks = result.bookmarks || {};
    const timestamps = bookmarks[currentUrl] || [];
    if (timestamps[index] !== undefined) {
      video.currentTime = timestamps[index];
      setTimeout(() => video.play(), 100);
      console.log(`Playing Timestamp ${index + 1}: ${timestamps[index]}s`);
    }
  });
}

// === Keyboard Shortcuts ===
document.addEventListener(
  "keydown",
  (event) => {
    const video = getVideo();
    if (!video) return;

    chrome.runtime.sendMessage({ action: "getCurrentTabUrl" }, (response) => {
      if (!response || !response.url) return;
      const currentUrl = response.url;

      switch (event.key) {
        case "d":
          adjustSpeed(video, 0.1);
          break;
        case "a":
          adjustSpeed(video, -0.1);
          break;
        case "s":
          video.playbackRate = 1;
          break;
        case "b":
          saveTimestamp(currentUrl);
          break;
        case "1":
          playFromTimestamp(currentUrl, 0);
          break;
        case "2":
          playFromTimestamp(currentUrl, 1);
          break;
        case "3":
          playFromTimestamp(currentUrl, 2);
          break;
        case "e":
          video.currentTime += 10;
          break;
        case "q":
          video.currentTime -= 10;
          break;
      }
    });
  },
  { capture: true }
);

// === Handle Messages from Popup ===
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  if (message.action === "playTimestamp") {
    const video = getVideo();
    if (!video) {
      console.error("No video found.");
      sendResponse({ success: false });
      return;
    }
    chrome.runtime.sendMessage({ action: "getCurrentTabUrl" }, (response) => {
      if (!response || !response.url) {
        console.error("Failed to get current URL.");
        sendResponse({ success: false });
        return;
      }
      playFromTimestamp(response.url, message.index);
      sendResponse({ success: true });
    });
    return true;
  }
});

// === Initialize Speed UI for existing videos ===
document.querySelectorAll("video").forEach(createSpeedUI);

// === Observe for new video elements ===
const observer = new MutationObserver((mutations) => {
  mutations.forEach((m) =>
    m.addedNodes.forEach((n) => {
      if (n.tagName === "VIDEO") createSpeedUI(n);
    })
  );
});
observer.observe(document.documentElement, { childList: true, subtree: true });
