// ===== Firebase config (same as admin.js) =====
const contactFirebaseConfig = {
  apiKey: "AIzaSyBDr0UidrRWbWuNMBd9E0_InWoGirRm2wo",
  authDomain: "vexroa-f6741.firebaseapp.com",
  projectId: "vexroa-f6741",
  storageBucket: "vexroa-f6741.firebasestorage.app",
  messagingSenderId: "552018171778",
  appId: "1:552018171778:web:2e5ef704eb9a44434fe19b",
};

// Firebase init (agar pehle se init nahi hua)
if (!firebase.apps.length) {
  firebase.initializeApp(contactFirebaseConfig);
}
const contactDb = firebase.firestore();

// ===== Contact form handling =====
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const nameInput = document.getElementById("contactName");
  const emailInput = document.getElementById("contactEmail");
  const messageInput = document.getElementById("contactMessage");
  const statusEl = document.getElementById("contactStatus");

  function setStatus(text, type) {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    if (type === "error") {
      statusEl.style.color = "#f97373";
    } else if (type === "success") {
      statusEl.style.color = "#22c55e";
    } else {
      statusEl.style.color = "#9ca3af";
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !email || !message) {
      setStatus("Please fill in all fields.", "error");
      return;
    }

    try {
      setStatus("Sending...", "normal");

      await contactDb.collection("contactMessages").add({
        name,
        email,
        message,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      setStatus("Thank you! Your message has been sent.", "success");
      form.reset();

      setTimeout(() => setStatus("", "normal"), 4000);
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("Something went wrong. Please try again.", "error");
    }
  });
});
