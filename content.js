// ฟังก์ชันหาแท็ก <video> บนหน้าเว็บ
function getVideo() {
  const videos = document.querySelectorAll("video");
  if (videos.length > 0) return videos[0]; // ใช้ video แรก (ปรับปรุงได้ถ้ามีหลาย video)
  return null;
}

// ปรับความเร็ววิดีโอ
function adjustSpeed(video, increment) {
  let speed = video.playbackRate + increment;
  speed = Math.max(0.25, Math.min(4.0, speed));
  video.playbackRate = speed;
  return speed;
}

// บันทึก Time Stamp
function saveTimestamp() {
  const video = getVideo();
  if (!video) return;

  const time = video.currentTime;
  let timestamps = JSON.parse(localStorage.getItem("timestamps") || "[]");
  timestamps.push(time);
  localStorage.setItem("timestamps", JSON.stringify(timestamps));
  console.log("Timestamp saved:", time);
}

// เล่นจาก Time Stamp
function playFromTimestamp(index) {
  const video = getVideo();
  if (!video) return;

  const timestamps = JSON.parse(localStorage.getItem("timestamps") || "[]");
  if (timestamps[index] !== undefined) {
    video.current英語Time = timestamps[index];
    setTimeout(() => {
      video.play();
    }, 100); // เพิ่ม delay 100ms เพื่อความเสถียร
    console.log(`Playing Timestamp ${index + 1}: ${timestamps[index]}`);
  } else {
    console.log(`No timestamp at index ${index}`);
  }
}

// ฟังก์ชันจัดการคีย์บอร์ด
document.addEventListener(
  "keydown",
  (event) => {
    const video = getVideo();
    if (!video) return;

    if (event.key === "b") {
      saveTimestamp();
    } else if (event.key === "x" && event.getModifierState("Z")) {
      event.preventDefault(); // ป้องกันการทับซ้อนกับคีย์ของเว็บ
      playFromTimestamp(0);
    } else if (event.key === "c" && event.getModifierState("Z")) {
      event.preventDefault(); // ป้องกันการทับซ้อนกับคีย์ของเว็บ
      playFromTimestamp(1);
    } else if (event.key === "v" && event.getModifierState("Z")) {
      event.preventDefault(); // ป้องกันการทับซ้อนกับคีย์ของเว็บ
      playFromTimestamp(2);
    } else if (event.key === "d") {
      const newSpeed = adjustSpeed(video, 0.25);
      console.log(`Speed increased to ${newSpeed}x`);
    } else if (event.key === "a") {
      const newSpeed = adjustSpeed(video, -0.25);
      console.log(`Speed decreased to ${newSpeed}x`);
    } else if (event.key === "s") {
      if (video.paused) {
        video.play();
        console.log("Video played");
      } else {
        video.pause();
        console.log("Video paused");
      }
    } else if (event.key === "e") {
      video.currentTime += 10;
      console.log("Advanced 10 seconds");
    } else if (event.key === "q") {
      video.currentTime -= 10;
      console.log("Rewound 10 seconds");
    }
  },
  { capture: true }
); // จับคีย์ก่อนหน้าเว็บ

// รับข้อความจาก Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "playTimestamp") {
    playFromTimestamp(message.index);
    sendResponse({ success: true });
  }
  return true; // Async response
});
