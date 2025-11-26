// =======================
//  FIREBASE ADMIN INIT
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyBDr0UidrRWbWuNMBd9E0_InWoGirRm2wo",
  authDomain: "vexroa-f6741.firebaseapp.com",
  projectId: "vexroa-f6741",
  storageBucket: "vexroa-f6741.appspot.com" ,
  messagingSenderId: "552018171778",
  appId: "1:552018171778:web:2e5ef704eb9a44434fe19b",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const storage = firebase.storage();

// Simple local admin auth
const ADMIN_EMAIL = "admin@vexroa.in"; // change if you want
const ADMIN_PASSWORD = "admin123";    // change if you want
const ADMIN_KEY = "vexroa-admin-logged-in";

function isLoggedIn() {
  return localStorage.getItem(ADMIN_KEY) === "1";
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}

function doLogout() {
  localStorage.removeItem(ADMIN_KEY);
  window.location.href = "login.html";
}

// =======================
//  LOGIN PAGE
// =======================
function initLoginPage() {
  const form = document.getElementById("loginForm");
  const errorEl = document.getElementById("loginError");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_KEY, "1");
      if (errorEl) errorEl.textContent = "";
      window.location.href = "dashboard.html";
    } else {
      if (errorEl) errorEl.textContent = "Invalid email or password.";
    }
  });
}

// =======================
//  DASHBOARD PAGE
// =======================
function initDashboardPage() {
  requireAuth();

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", doLogout);

  const tbody = document.getElementById("postsTableBody");
  const emptyMessage = document.getElementById("emptyMessage");
  if (!tbody) return;

  if (emptyMessage) emptyMessage.textContent = "Loading posts...";

  db.collection("posts")
    .orderBy("createdAt", "desc")
    .get()
    .then((snap) => {
      if (snap.empty) {
        if (emptyMessage) emptyMessage.textContent = "No posts yet.";
        return;
      }
      if (emptyMessage) emptyMessage.textContent = "";
      tbody.innerHTML = "";

      snap.forEach((doc) => {
        const data = doc.data();
        const tr = document.createElement("tr");

        const titleTd = document.createElement("td");
        titleTd.textContent = data.title || "(Untitled)";

        const dateTd = document.createElement("td");
        dateTd.textContent = data.createdAt?.toDate
          ? data.createdAt.toDate().toLocaleString()
          : "";

        const actionsTd = document.createElement("td");

        const viewLink = document.createElement("a");
        viewLink.href = "../post.html?id=" + encodeURIComponent(doc.id);
        viewLink.textContent = "View";
        viewLink.target = "_blank";
        viewLink.className = "table-link";

        const editLink = document.createElement("a");
editLink.href = "new-post.html?id=" + encodeURIComponent(doc.id);
editLink.textContent = "Edit";
editLink.className = "table-link";
editLink.style.marginLeft = "12px";

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "table-btn-delete";
        deleteBtn.addEventListener("click", () => {
          if (confirm("Delete this post?")) {
            db.collection("posts")
              .doc(doc.id)
              .delete()
              .then(() => {
                tr.remove();
              })
              .catch((err) => {
                alert("Failed to delete: " + err.message);
              });
          }
        });

        actionsTd.appendChild(viewLink);
        actionsTd.appendChild(editLink);
        actionsTd.appendChild(deleteBtn);

        tr.appendChild(titleTd);
        tr.appendChild(dateTd);
        tr.appendChild(actionsTd);
        tbody.appendChild(tr);
      });
    })
    .catch((err) => {
      console.error("Dashboard load error:", err);
      if (emptyMessage) emptyMessage.textContent = "Failed to load posts.";
    });
}

// =======================
//  NEW POST PAGE
// =======================
function initNewPostPage() {
  requireAuth();

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", doLogout);

  const form = document.getElementById("newPostForm");
  const statusEl = document.getElementById("saveStatus");
  const saveBtn = document.getElementById("saveBtn");

  if (!form) return;

  // get optional ?id=docId (edit mode)
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id"); // null if creating new

  // helper to set status
  function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.style.color = isError ? "crimson" : "#2b8a3e";
  }

  // If editId exists -> load doc and populate form
  if (editId) {
    setStatus("Loading post for edit...");
    if (saveBtn) saveBtn.textContent = "Update Post";
    db.collection("posts")
      .doc(editId)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          setStatus("Post not found.", true);
          return;
        }
        const data = doc.data();
        document.getElementById("postTitle").value = data.title || "";
        document.getElementById("postExcerpt").value = data.excerpt || "";
        document.getElementById("postTag").value = data.tag || "";
        // wait for tinyMCE to be ready
        const trySetEditor = () => {
          const editor = window.tinymce && tinymce.get("postContent");
          if (editor) {
            editor.setContent(data.content || "");
            setStatus("");
          } else {
            // try again shortly
            setTimeout(trySetEditor, 150);
          }
        };
        trySetEditor();
      })
      .catch((err) => {
        console.error("Load for edit failed:", err);
        setStatus("Failed to load post: " + err.message, true);
      });
  }

  // Submit handler (create or update based on editId)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setStatus("");
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = editId ? "Updating..." : "Publishing...";
    }

    const title = document.getElementById("postTitle").value.trim();
    const excerpt = document.getElementById("postExcerpt").value.trim();
    const tag = document.getElementById("postTag").value.trim();
    const editor = window.tinymce && tinymce.get("postContent");
    const content = editor ? editor.getContent() : "";

    if (!title || !excerpt || !content) {
      setStatus("Title, excerpt and content are required.", true);
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = editId ? "Update Post" : "Publish Post";
      }
      return;
    }

    const payload = {
      title,
      excerpt,
      tag: tag || "General",
      content,
    };

    // If editing -> update doc, don't overwrite createdAt
    const actionPromise = editId
      ? db.collection("posts").doc(editId).update({
          ...payload,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
      : db
          .collection("posts")
          .add({
            ...payload,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });

    actionPromise
      .then(() => {
        if (editId) {
          setStatus("Post updated successfully.");
          // after short delay go back to dashboard
          setTimeout(() => (window.location.href = "dashboard.html"), 900);
        } else {
          setStatus("Post published successfully!");
          form.reset();
          if (editor) editor.setContent("");
        }
      })
      .catch((err) => {
        console.error("Save/Update error:", err);
        setStatus("Failed: " + err.message, true);
      })
      .finally(() => {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = editId ? "Update Post" : "Publish Post";
        }
      });
  });
}


// =======================
//  INIT BY PAGE
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page || "";
  if (page === "admin-login") {
    initLoginPage();
  } else if (page === "admin-dashboard") {
    initDashboardPage();
  } else if (page === "admin-new-post") {
    initNewPostPage();
  }
});

// --- Dashboard search filter (only DOM filter, data fetch ko nahi chhedta) ---
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("postSearchInput");
  const tableBody = document.getElementById("postsTableBody");

  if (!searchInput || !tableBody) return;

  searchInput.addEventListener("input", function () {
    const q = this.value.toLowerCase().trim();

    Array.from(tableBody.querySelectorAll("tr")).forEach(function (row) {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? "" : "none";
    });
  });
});

// Publish / Update handler (admin.js)
document.addEventListener("DOMContentLoaded", () => {
  const publishBtn = document.getElementById("publishBtn") || document.getElementById("savePostBtn") || null;
  const titleInput = document.getElementById("postTitle");
  const excerptInput = document.getElementById("postExcerpt");
  const tagInput = document.getElementById("postTagInput") || document.getElementById("postTag");

  // helper to read id from query string
  function getPostIdFromUrl() {
    const p = new URLSearchParams(window.location.search);
    return p.get("id");
  }

  async function savePost() {
    const title = titleInput ? titleInput.value.trim() : "";
    const excerpt = excerptInput ? excerptInput.value.trim() : "";
    const tag = tagInput ? tagInput.value.trim() : "";
    const content = (tinymce.get("postContent") || { getContent: () => "" }).getContent();

    if (!title) return alert("Title required");

    const payload = {
      title,
      excerpt,
      tag,
      content,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const id = getPostIdFromUrl();

    try {
      if (id) {
        // update existing
        await db.collection("posts").doc(id).update(payload);
        alert("Post updated");
      } else {
        // create new
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection("posts").add(payload);
        alert("Post published");
      }
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Save post error:", err);
      alert("Save failed: " + err.message);
    }
  }

  // hook to button (if you have a Save/Publish button)
  const saveBtn = document.getElementById("publishBtn") || document.getElementById("updateBtn") || document.querySelector(".btn-publish");
  if (saveBtn) {
    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      savePost();
    });
  }
});
