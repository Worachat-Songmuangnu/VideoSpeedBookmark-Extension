document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded");

  const bookmarksDiv = document.getElementById("bookmarks");

  function updateBookmarks() {
    console.log("Updating bookmarks...");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found.");
        return;
      }

      const currentTab = tabs[0];
      const currentUrl = currentTab.url;
      console.log("Current tab URL:", currentUrl);

      chrome.storage.sync.get(["bookmarks"], (result) => {
        const bookmarks = result.bookmarks || {};
        console.log("Fetched bookmarks:", bookmarks);

        bookmarksDiv.innerHTML = "";

        const siteNames = Object.keys(bookmarks);
        if (siteNames.length === 0) {
          bookmarksDiv.innerHTML = "<p>No timestamps saved yet.</p>";
        } else {
          siteNames.forEach((site) => {
            const siteContainer = document.createElement("div");
            siteContainer.style.marginBottom = "10px";

            const siteTitle = document.createElement("h3");
            siteTitle.textContent = site;
            siteContainer.appendChild(siteTitle);

            const timestamps = bookmarks[site] || [];
            const ul = document.createElement("ul");

            timestamps.forEach((time, index) => {
              const li = document.createElement("li");
              li.textContent = `Timestamp ${index + 1} (${time.toFixed(2)}s)`;

              const runButton = document.createElement("button");
              runButton.textContent = "Run";
              runButton.style.marginLeft = "10px";
              runButton.onclick = () => {
                console.log(
                  `Playing timestamp ${index} at ${time}s from ${site}`
                );

                if (currentUrl !== site) {
                  console.log(`Navigating to ${site}`);
                  chrome.tabs.create({ url: site }, (newTab) => {
                    console.log("New tab opened:", newTab);
                    setTimeout(() => {
                      chrome.tabs.sendMessage(newTab.id, {
                        action: "playTimestamp",
                        time,
                      });
                    }, 2000);
                  });
                } else {
                  console.log(
                    "Sending playTimestamp message to content script"
                  );
                  chrome.tabs.sendMessage(currentTab.id, {
                    action: "playTimestamp",
                    time,
                  });
                }
              };

              const deleteButton = document.createElement("button");
              deleteButton.textContent = "Delete";
              deleteButton.style.marginLeft = "10px";
              deleteButton.onclick = () => {
                console.log(`Deleting timestamp ${index} from ${site}`);
                timestamps.splice(index, 1);
                if (timestamps.length === 0) {
                  delete bookmarks[site];
                } else {
                  bookmarks[site] = timestamps;
                }
                chrome.storage.sync.set({ bookmarks }, updateBookmarks);
              };

              li.appendChild(runButton);
              li.appendChild(deleteButton);
              ul.appendChild(li);
            });

            siteContainer.appendChild(ul);
            bookmarksDiv.appendChild(siteContainer);
          });
        }
      });
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
