document.addEventListener("DOMContentLoaded", () => {
  const speedStep = document.getElementById("speedStep");
  const maxTimestamps = document.getElementById("maxTimestamps");
  const darkMode = document.getElementById("darkMode");
  const confirmationMessage = document.getElementById("confirmationMessage");

  chrome.storage.sync.get(
    { speedStep: "0.1", maxTimestamps: 10 },
    ({ speedStep: savedStep, maxTimestamps: savedMax }) => {
      speedStep.value = savedStep;
      maxTimestamps.value = savedMax;
    }
  );

  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  document.body.classList.toggle("dark-mode", savedTheme === "dark");
  darkMode.checked = savedTheme === "dark";

  document.getElementById("saveOptions").addEventListener("click", () => {
    const step = parseFloat(speedStep.value);
    const max = parseInt(maxTimestamps.value);
    if (max < 1 || max > 50) {
      showConfirmation("Max Timestamps must be 1-50.", false);
      return;
    }

    chrome.storage.sync.set({ speedStep: step, maxTimestamps: max }, () => {
      if (chrome.runtime.lastError) {
        showConfirmation("Failed to save.", false);
      } else {
        showConfirmation("Settings saved successfully!", true);
      }
    });

    const isDark = darkMode.checked;
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.body.classList.toggle("dark-mode", isDark);
  });

  document.getElementById("resetOptions").addEventListener("click", () => {
    speedStep.value = "0.1";
    maxTimestamps.value = 10;
    darkMode.checked = false;

    chrome.storage.sync.set({ speedStep: 0.1, maxTimestamps: 10 }, () => {
      if (chrome.runtime.lastError) {
        showConfirmation("Failed to reset.", false);
      } else {
        showConfirmation("Settings reset successfully!", true);
      }
    });

    localStorage.setItem("theme", "light");
    document.body.classList.remove("dark-mode");
  });

  function showConfirmation(message, isSuccess) {
    confirmationMessage.textContent = message;
    confirmationMessage.style.display = "block";
    confirmationMessage.style.color = isSuccess ? "#d32f2f" : "#d32f2f";
    confirmationMessage.style.background = isSuccess ? "#ffebee" : "#ffebee";
    setTimeout(() => {
      confirmationMessage.style.display = "none";
    }, 3000);
  }
});
