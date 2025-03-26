let cachedUrl = null;

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

  let wrapper = video.parentNode.querySelector(".vsb-wrapper");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "vsb-wrapper";
    video.parentNode.appendChild(wrapper);
  }

  let label =
    wrapper.querySelector(".speedlabel") || document.createElement("div");
  label.className = "speedlabel";
  label.textContent = `${speed.toFixed(2)}x`;
  wrapper.appendChild(label);
}

function createSpeedUI(video) {
  const wrapper = document.createElement("div");
  wrapper.className = "vsb-wrapper";
  video.parentNode.appendChild(wrapper);

  const speedLabel = document.createElement("div");
  speedLabel.className = "speedlabel";
  speedLabel.textContent = `${video.playbackRate.toFixed(2)}x`;
  wrapper.appendChild(speedLabel);

  video.onratechange = () => {
    speedLabel.textContent = `${video.playbackRate.toFixed(2)}x`;
  };
}

// === Bookmark Feature ===
function saveTimestamp(url, title) {
  const video = getVideo();
  if (!video) {
    chrome.runtime.sendMessage({ action: "error", message: "No video found." });
    return;
  }

  const time = video.currentTime;
  chrome.storage.sync.get(["bookmarks"], (result) => {
    if (chrome.runtime.lastError) return;
    let bookmarks = result.bookmarks || {};
    const bookmarkTitle = title || document.title || url || "Untitled";
    bookmarks[url] = bookmarks[url] || { title: bookmarkTitle, timestamps: [] };
    bookmarks[url].timestamps.push(time);
    chrome.storage.sync.set({ bookmarks }, () => {
      if (chrome.runtime.lastError) {
        chrome.runtime.sendMessage({
          action: "error",
          message: "Failed to save timestamp.",
        });
      } else {
        console.log(
          "Timestamp saved:",
          time,
          "for:",
          url,
          "title:",
          bookmarkTitle
        );
      }
    });
  });
}

function playFromTimestamp(url, index) {
  const video = getVideo();
  if (!video) {
    chrome.runtime.sendMessage({ action: "error", message: "No video found." });
    return;
  }

  chrome.storage.sync.get(["bookmarks"], (result) => {
    if (chrome.runtime.lastError) return;
    const bookmarks = result.bookmarks || {};
    const site = bookmarks[url];
    if (!site || !site.timestamps || site.timestamps[index] === undefined) {
      chrome.runtime.sendMessage({
        action: "error",
        message: `No timestamp at position ${index + 1}.`,
      });
      return;
    }

    video.currentTime = site.timestamps[index];
    setTimeout(() => video.play(), 100);
    console.log(
      `Playing Timestamp ${index + 1}: ${site.timestamps[index]}s for ${url}`
    );
  });
}

// === Handle Key Events ===
function handleKeyEvent(event, url, title) {
  const video = getVideo();
  if (!video) return;

  switch (event.key) {
    case "d":
      adjustSpeed(video, 0.1);
      break;
    case "a":
      adjustSpeed(video, -0.1);
      break;
    case "s":
      video.playbackRate = 1;
      adjustSpeed(video, 0);
      break;
    case "b":
      saveTimestamp(url, title);
      break;
    case "1":
      playFromTimestamp(url, 0);
      break;
    case "2":
      playFromTimestamp(url, 1);
      break;
    case "3":
      playFromTimestamp(url, 2);
      break;
    case "e":
      video.currentTime += 10;
      break;
    case "q":
      video.currentTime -= 10;
      break;
  }
}

// === Handle Messages from Popup ===
if (chrome.runtime && chrome.runtime.id) {
  document.addEventListener(
    "keydown",
    (event) => {
      try {
        const video = getVideo();
        if (!video) return;

        if (!cachedUrl) {
          chrome.runtime.sendMessage(
            { action: "getCurrentTabUrl" },
            (response) => {
              if (chrome.runtime.lastError) return;
              if (response?.url) {
                cachedUrl = response.url;
                handleKeyEvent(event, cachedUrl, response.title);
              } else {
                chrome.runtime.sendMessage({
                  action: "error",
                  message: "Failed to get tab URL.",
                });
              }
            }
          );
        } else {
          handleKeyEvent(event, cachedUrl);
        }
      } catch (e) {
        if (e.message.includes("Extension context invalidated")) {
          console.log(
            "Extension context invalidated. Please reload the page or extension."
          );
        } else {
          console.error("Error in keydown listener:", e);
        }
      }
    },
    { capture: true }
  );

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "playTimestamp") {
      const video = getVideo();
      if (!video) {
        sendResponse({ success: false, message: "No video found." });
        return true;
      }
      // ใช้ URL จาก message แทนการดึงใหม่ เพื่อให้ sync กับ Popup
      playFromTimestamp(message.url, message.index);
      sendResponse({ success: true });
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
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
} else {
  console.log("Extension context not available on load.");
}
