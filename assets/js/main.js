// =======================
//  FIREBASE PUBLIC INIT
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyBDr0UidrRWbWuNMBd9E0_InWoGirRm2wo",
  authDomain: "vexroa-f6741.firebaseapp.com",
  projectId: "vexroa-f6741",
  storageBucket: "vexroa-f6741.appspot.com",
  messagingSenderId: "552018171778",
  appId: "1:552018171778:web:2e5ef704eb9a44434fe19b",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// =======================
//  BASIC HELPERS
// =======================
function setCurrentYear() {
  const spans = document.querySelectorAll("#yearSpan");
  const year = new Date().getFullYear();
  spans.forEach((s) => (s.textContent = year));
}

function getPage() {
  return document.body.dataset.page || "";
}

// =======================
//  THEME (LIGHT / DARK)
// =======================
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("vexroa-theme", theme);

  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
    btn.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  }
}

function initTheme() {
  const stored = localStorage.getItem("vexroa-theme");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const theme = stored || (prefersDark ? "dark" : "light");
  applyTheme(theme);

  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const current =
        document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }
}

// =======================
//  NAV / MOBILE MENU
// =======================
window.toggleMenu = function () {
  const menu = document.getElementById("mobileMenu");
  if (!menu) return;
  menu.classList.toggle("open");
};

document.addEventListener("click", (e) => {
  if (e.target.closest(".mobile-menu a")) {
    const menu = document.getElementById("mobileMenu");
    if (menu) menu.classList.remove("open");
  }
});

// =======================
//  HERO SLIDER (optional)
// =======================
function initHeroSlider() {
  const slides = document.querySelectorAll(".hero-slide");
  const dotsContainer = document.getElementById("heroDots");
  if (!slides.length || !dotsContainer) return;

  let current = 0;

  function setActive(i) {
    slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
    const dots = document.querySelectorAll(".hero-dot");
    dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
  }

  dotsContainer.innerHTML = "";
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hero-dot";
    dot.addEventListener("click", () => {
      current = i;
      setActive(i);
    });
    dotsContainer.appendChild(dot);
  });

  setActive(0);

  setInterval(() => {
    current = (current + 1) % slides.length;
    setActive(current);
  }, 7000);
}

// =======================
//  SCROLL REVEAL
// =======================
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  els.forEach((el) => obs.observe(el));
}

// =======================
//  STATS COUNTER
// =======================
function initCounters() {
  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return;

  const animate = (el) => {
    const target = Number(el.dataset.counter || "0");
    let start = 0;
    const duration = 1800;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));

    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        start = target;
        clearInterval(timer);
      }
      el.textContent = start.toLocaleString();
    }, 16);
  };

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  counters.forEach((el) => obs.observe(el));
}

// =======================
//  TESTIMONIAL SLIDER
// =======================
function initTestimonials() {
  const slider = document.querySelector(".testimonial-slider");
  if (!slider) return;

  const slides = slider.querySelectorAll(".testimonial-slide");
  const prev = slider.querySelector(".testimonial-nav.prev");
  const next = slider.querySelector(".testimonial-nav.next");

  if (!slides.length) return;
  let current = 0;

  function setActive(i) {
    slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
  }

  function go(dir) {
    if (dir === "next") {
      current = (current + 1) % slides.length;
    } else {
      current = (current - 1 + slides.length) % slides.length;
    }
    setActive(current);
  }

  if (prev) prev.addEventListener("click", () => go("prev"));
  if (next) next.addEventListener("click", () => go("next"));

  setActive(0);
  setInterval(() => go("next"), 9000);
}

// =======================
//  BLOG LIST (blog.html)
// =======================
function getFirstImageFromContent(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  const img = div.querySelector("img");
  return img ? img.src : "";
}

async function loadBlogList() {
  const list = document.getElementById("blogList");
  if (!list) return;

  list.innerHTML = '<p class="muted-text">Loading posts...</p>';

  try {
    const snap = await db
      .collection("posts")
      .orderBy("createdAt", "desc")
      .get();

    if (snap.empty) {
      list.innerHTML = '<p class="muted-text">No posts yet.</p>';
      return;
    }

    list.innerHTML = "";
    snap.forEach((doc) => {
      const data = doc.data();
      const created = data.createdAt?.toDate
        ? data.createdAt.toDate().toLocaleDateString()
        : "";
      const tag = data.tag || "General";
      const imgSrc = getFirstImageFromContent(data.content || "");

      const card = document.createElement("article");
      card.className = "blog-card";
      card.innerHTML = `
        ${
          imgSrc
            ? `<div class="blog-card-image-wrap">
                 <img src="${imgSrc}" alt="${data.title || ""}">
               </div>`
            : ""
        }
        <span class="blog-tag">${tag}</span>
        <h2 class="blog-card-title">${data.title || ""}</h2>
        <p class="blog-meta">${created}</p>
        <p class="blog-excerpt">${data.excerpt || ""}</p>
        <a href="post.html?id=${doc.id}" class="blog-readmore">Read more →</a>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    console.error("Blog load error:", err);
    list.innerHTML = '<p class="error-text">Failed to load posts.</p>';
  }
}

// =======================
//  SINGLE POST (post.html)
// =======================
async function loadSinglePost() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const tagEl = document.getElementById("postTag");
  const titleEl = document.getElementById("postTitle");
  const metaEl = document.getElementById("postMeta");
  const contentEl = document.getElementById("postContent");

  if (!id || !titleEl || !contentEl) return;

  try {
    const doc = await db.collection("posts").doc(id).get();
    if (!doc.exists) {
      titleEl.textContent = "Post not found";
      contentEl.textContent = "";
      return;
    }

    const data = doc.data();
    const created = data.createdAt?.toDate
      ? data.createdAt.toDate().toLocaleString()
      : "";

    if (tagEl) tagEl.textContent = data.tag || "General";
    titleEl.textContent = data.title || "";
    if (metaEl) metaEl.textContent = created;

    // ⭐ Full HTML support -> images, headings, etc.
    contentEl.innerHTML = data.content || "";
  } catch (err) {
    console.error("Post load error:", err);
    titleEl.textContent = "Error";
    if (contentEl) contentEl.textContent = err.message;
  }
}

// =======================
//  INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  initTheme();
  initHeroSlider();
  initReveal();
  initCounters();
  initTestimonials();

  const page = getPage();
  if (page === "blog") {
    loadBlogList();
  } else if (page === "post") {
    loadSinglePost();
  }
});

// BLOG SEARCH FILTER
document.addEventListener("DOMContentLoaded", function () {
  const blogSearchInput = document.getElementById("blogSearchInput");
  const blogList = document.getElementById("blogList");

  if (!blogSearchInput || !blogList) return;

  blogSearchInput.addEventListener("input", function () {
    const q = this.value.toLowerCase();
    
    Array.from(blogList.querySelectorAll(".blog-card")).forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? "" : "none";
    });
  });
});

card.innerHTML = `
  ${imgSrc ? `<div class="blog-card-image-wrap">
               <img src="${imgSrc}" alt="${data.title || ""}">
             </div>` : ""}
  <div class="blog-card-inner">
    <span class="blog-tag">${tag}</span>
    <h2 class="blog-card-title">${data.title || ""}</h2>
    <p class="blog-meta">${created}</p>
    <p class="blog-excerpt">${data.excerpt || ""}</p>
    <a href="post.html?id=${doc.id}" class="blog-readmore">Read more →</a>
  </div>
`;
