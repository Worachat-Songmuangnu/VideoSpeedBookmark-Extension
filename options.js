document.addEventListener("DOMContentLoaded", () => {
  const speedStep = document.getElementById("speedStep");
  const maxTimestamps = document.getElementById("maxTimestamps");

  chrome.storage.sync.get(
    ["speedStep", "maxTimestamps"],
    ({ speedStep: savedStep = "0.1", maxTimestamps: savedMax = 10 }) => {
      speedStep.value = savedStep;
      maxTimestamps.value = savedMax;
    }
  );

  document.getElementById("saveOptions").addEventListener("click", () => {
    const step = parseFloat(speedStep.value);
    const max = parseInt(maxTimestamps.value);
    if (max < 1 || max > 50) return alert("Max Timestamps must be 1-50.");
    chrome.storage.sync.set({ speedStep: step, maxTimestamps: max }, () => {
      alert(chrome.runtime.lastError ? "Failed to save." : "Settings saved!");
    });
  });
});
