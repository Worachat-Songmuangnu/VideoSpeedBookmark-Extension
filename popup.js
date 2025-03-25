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
  };

  elements.speedTab.addEventListener("click", () => switchTab("speed"));
  elements.bookmarkTab.addEventListener("click", () => switchTab("bookmark"));
  elements.optionsBtn.addEventListener("click", () =>
    chrome.runtime.openOptionsPage()
  );
  elements.toggleTheme.addEventListener("click", toggleTheme);

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

  function updateBookmarks() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found.");
        bookmarksDiv.innerHTML =
          "<p class='error-message'>No active tab found.</p>";
        return;
      }

      const currentTab = tabs[0];
      const currentUrl = currentTab.url;

      chrome.storage.sync.get(["bookmarks"], (result) => {
        const bookmarks = result.bookmarks || {};
        bookmarksDiv.innerHTML = "";
        noBookmarksMessage.style.display = "none";

        const timestamps = bookmarks[currentUrl] || [];
        if (timestamps.length === 0) {
          noBookmarksMessage.style.display = "block";
          return;
        }

        const ul = document.createElement("ul");
        timestamps.forEach((time, index) => {
          const li = document.createElement("li");
          li.className = "timestamp-item";
          li.textContent = `Timestamp ${index + 1} (${time.toFixed(2)}s)`;

          const runButton = document.createElement("button");
          runButton.textContent = "Run";
          runButton.className = "run-button";
          runButton.onclick = () =>
            playTimestamp(currentUrl, index, currentUrl);

          const deleteButton = document.createElement("button");
          deleteButton.textContent = "Delete";
          deleteButton.className = "delete-button";
          deleteButton.onclick = () => deleteTimestamp(currentUrl, index);

          li.appendChild(runButton);
          li.appendChild(deleteButton);
          ul.appendChild(li);
        });
        bookmarksDiv.appendChild(ul);
      });
    });
  }

  function playTimestamp(site, index, currentUrl) {
    if (currentUrl !== site) {
      chrome.tabs.create({ url: site }, (newTab) => {
        const checkTabLoaded = setInterval(() => {
          chrome.tabs.get(newTab.id, (tab) => {
            if (tab.status === "complete") {
              clearInterval(checkTabLoaded);
              sendPlayMessage(newTab.id, index);
            }
          });
        }, 500);
      });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          sendPlayMessage(tabs[0].id, index);
        }
      });
    }
  }

  function sendPlayMessage(tabId, index) {
    chrome.tabs.sendMessage(
      tabId,
      { action: "playTimestamp", index },
      (response) => {
        if (chrome.runtime.lastError) {
          alert("Error: Video not found or page not fully loaded.");
        }
      }
    );
  }
  function deleteTimestamp(site, index) {
    chrome.storage.sync.get(["bookmarks"], (result) => {
      const bookmarks = result.bookmarks || {};
      const timestamps = bookmarks[site] || [];
      timestamps.splice(index, 1);

      if (timestamps.length === 0) {
        delete bookmarks[site];
      } else {
        bookmarks[site] = timestamps;
      }

      chrome.storage.sync.set({ bookmarks }, updateBookmarks);
    });
  }

  updateBookmarks();

  const toggleButton = document.getElementById("toggleTheme");
  let isDark = localStorage.getItem("theme") === "dark";
  document.body.classList.toggle("dark-mode", isDark);

  toggleButton.addEventListener("click", () => {
    isDark = !isDark;
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
});
