document.addEventListener("DOMContentLoaded", () => {
  const bookmarksDiv = document.getElementById("bookmarks");
  const noBookmarksMessage = document.getElementById("noBookmarksMessage");

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

        const timestamps = bookmarks[currentUrl] || []; // Show only current URL
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
            playTimestamp(currentUrl, index, currentUrl); // Use index

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
    // Change time to index
    if (currentUrl !== site) {
      chrome.tabs.create({ url: site }, (newTab) => {
        const checkTabLoaded = setInterval(() => {
          chrome.tabs.get(newTab.id, (tab) => {
            if (tab.status === "complete") {
              clearInterval(checkTabLoaded);
              sendPlayMessage(newTab.id, index); // Send index instead of time
            }
          });
        }, 500);
      });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          sendPlayMessage(tabs[0].id, index); // Send index instead of time
        }
      });
    }
  }

  function sendPlayMessage(tabId, index) {
    // Change time to index
    chrome.tabs.sendMessage(
      tabId,
      { action: "playTimestamp", index }, // Send index instead of time
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
