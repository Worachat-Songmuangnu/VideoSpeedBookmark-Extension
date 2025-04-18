document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    speedTab: document.getElementById("speedTab"),
    bookmarkTab: document.getElementById("bookmarkTab"),
    speedPanel: document.getElementById("speedPanel"),
    bookmarkPanel: document.getElementById("bookmarkPanel"),
    bookmarksDiv: document.getElementById("bookmarks"),
    noBookmarksMessage: document.getElementById("noBookmarksMessage"),
    optionsBtn: document.getElementById("optionsBtn"),
    toggleTheme: document.getElementById("toggleTheme"),
    errorMessage: document.getElementById("errorMessage"),
    clearBookmarksBtn: document.getElementById("clearBookmarksBtn"),
  };

  elements.speedTab.addEventListener("click", () => switchTab("speed"));
  elements.bookmarkTab.addEventListener("click", () => switchTab("bookmark"));
  elements.optionsBtn.addEventListener("click", () =>
    chrome.runtime.openOptionsPage()
  );
  elements.toggleTheme.addEventListener("click", toggleTheme);
  elements.clearBookmarksBtn.addEventListener("click", clearBookmarks);

  function formatVideoTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  }

  function switchTab(tab) {
    const isSpeed = tab === "speed";
    elements.speedTab.classList.toggle("active", isSpeed);
    elements.bookmarkTab.classList.toggle("active", !isSpeed);
    elements.speedPanel.style.display = isSpeed ? "block" : "none";
    elements.bookmarkPanel.style.display = isSpeed ? "none" : "block";
    if (!isSpeed) updateBookmarks();
  }

  function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = "block";
    setTimeout(() => (elements.errorMessage.style.display = "none"), 3000);
  }

  function updateBookmarks() {
    chrome.storage.sync.get(["bookmarks"], (result) => {
      if (chrome.runtime.lastError) {
        showError("Failed to load bookmarks.");
        return;
      }

      const bookmarks = result.bookmarks || {};
      elements.bookmarksDiv.innerHTML = "";
      elements.noBookmarksMessage.style.display = "none";

      if (Object.keys(bookmarks).length === 0) {
        elements.noBookmarksMessage.textContent = "No bookmarks saved.";
        elements.noBookmarksMessage.style.display = "block";
        return;
      }

      for (const url in bookmarks) {
        const site = bookmarks[url];
        const siteContainer = document.createElement("div");
        siteContainer.className = "site-container";

        const siteTitle = document.createElement("h3");
        siteTitle.textContent = site.title || url;
        siteContainer.appendChild(siteTitle);

        const ul = document.createElement("ul");
        site.timestamps.forEach((time, index) => {
          const li = document.createElement("li");
          li.className = "timestamp-item";
          li.textContent = formatVideoTime(time);

          li.appendChild(
            createButton("Run", "run-button", () => playTimestamp(url, index))
          );
          li.appendChild(
            createButton("Delete", "delete-button", () =>
              deleteTimestamp(url, index)
            )
          );
          ul.appendChild(li);
        });
        siteContainer.appendChild(ul);
        elements.bookmarksDiv.appendChild(siteContainer);
      }
    });
  }

  function createButton(text, className, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = className;
    button.addEventListener("click", onClick);
    return button;
  }

  function playTimestamp(url, index) {
    chrome.tabs.query({ url: url }, (tabs) => {
      if (tabs.length > 0) {
        // หน้าเว็บเปิดอยู่ ส่งคำสั่งไป Content Script
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "playTimestamp", url, index },
          (response) => {
            if (chrome.runtime.lastError || !response?.success) {
              showError(response?.message || "Failed to play timestamp.");
            }
          }
        );
      } else {
        // หน้าเว็บไม่เปิด สร้างแท็บใหม่และรัน Timestamp
        chrome.tabs.create({ url, active: true }, (newTab) => {
          const tabId = newTab.id;
          const loadListener = (tabIdUpdated, info) => {
            if (tabIdUpdated === tabId && info.status === "complete") {
              chrome.tabs.onUpdated.removeListener(loadListener);
              chrome.tabs.sendMessage(
                tabId,
                { action: "playTimestamp", url, index },
                (response) => {
                  if (chrome.runtime.lastError || !response?.success) {
                    showError(response?.message || "Failed to play timestamp.");
                  }
                }
              );
            }
          };
          chrome.tabs.onUpdated.addListener(loadListener);
        });
      }
    });
  }

  function deleteTimestamp(url, index) {
    chrome.storage.sync.get(["bookmarks"], (result) => {
      if (chrome.runtime.lastError)
        return showError("Failed to load bookmarks.");

      const bookmarks = result.bookmarks || {};
      const site = bookmarks[url];
      if (!site || !site.timestamps || site.timestamps[index] === undefined) {
        showError("Timestamp not found.");
        return;
      }

      site.timestamps.splice(index, 1);
      if (site.timestamps.length === 0) {
        delete bookmarks[url];
      } else {
        bookmarks[url] = site;
      }

      chrome.storage.sync.set({ bookmarks }, () => {
        if (chrome.runtime.lastError) {
          showError("Failed to delete timestamp.");
        } else {
          console.log(`Deleted timestamp at index ${index} for ${url}`);
          updateBookmarks();
        }
      });
    });
  }

  function clearBookmarks() {
    if (!confirm("Are you sure you want to clear all bookmarks?")) return;
    chrome.storage.sync.set({ bookmarks: {} }, () => {
      if (chrome.runtime.lastError) {
        showError("Failed to clear bookmarks.");
      } else {
        showError("All bookmarks cleared.");
        updateBookmarks();
      }
    });
  }

  function toggleTheme() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  document.body.classList.toggle("dark-mode", savedTheme === "dark");
  updateBookmarks();

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "error") showError(message.message);
  });
});
