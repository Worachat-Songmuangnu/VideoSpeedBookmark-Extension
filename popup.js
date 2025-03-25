document.addEventListener("DOMContentLoaded", () => {
  // แสดง Bookmarks
  const bookmarksDiv = document.getElementById("bookmarks");
  const bookmarks = JSON.parse(localStorage.getItem("videoBookmarks") || "{}");

  for (const url in bookmarks) {
    const times = bookmarks[url];
    const urlDiv = document.createElement("div");
    urlDiv.innerHTML = `<h3>${url}</h3>`;
    const ul = document.createElement("ul");

    times.forEach((time, index) => {
      const li = document.createElement("li");
      li.textContent = `Timestamp ${index + 1} (${time.toFixed(2)}s)`;
      const playButton = document.createElement("button");
      playButton.textContent = "Play";
      playButton.onclick = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "playTimestamp",
            index,
          });
        });
      };
      li.appendChild(playButton);
      ul.appendChild(li);
    });

    urlDiv.appendChild(ul);
    bookmarksDiv.appendChild(urlDiv);
  }

  // สลับ Dark/Light Mode
  const toggleButton = document.getElementById("toggleTheme");
  let isDark = localStorage.getItem("theme") === "dark";
  document.body.classList.toggle("dark-mode", isDark);

  toggleButton.addEventListener("click", () => {
    isDark = !isDark;
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
});

// รับข้อความจาก popup เพื่อเล่น Time Stamp
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "playTimestamp") {
    const video = document.querySelector("video");
    if (video) {
      const url = window.location.href;
      const bookmarks = JSON.parse(
        localStorage.getItem("videoBookmarks") || "{}"
      );
      const times = bookmarks[url] || [];
      if (times[message.index] !== undefined) {
        video.currentTime = times[message.index];
        video.play();
      }
    }
  }
});
