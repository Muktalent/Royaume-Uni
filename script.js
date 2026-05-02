// ==========================
// 🌗 DARK MODE TOGGLE LOGIC
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("theme-toggle");

  // Load saved theme
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    toggle.textContent = "☀️";
  }

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");
    toggle.textContent = isDark ? "☀️" : "🌙";

    // Save user preference
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
});


// ==========================
// 📩 CONTACT FORM HANDLER
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("✅ Tu mensaje ha sido enviado correctamente.");
    form.reset();
  });
});

// ==========================
// 🌍 LANGUAGE DROPDOWN MENU
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const langBtn = document.getElementById("lang-btn");
  const langMenu = document.getElementById("lang-menu");

  // Load saved language or default to English
  let currentLang = localStorage.getItem("lang") || "en";
  applyLanguage(currentLang);

  // Toggle dropdown
  langBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    langMenu.parentElement.classList.toggle("active");
  });

  // Change language
  langMenu.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", () => {
      const selectedLang = item.getAttribute("data-lang");
      applyLanguage(selectedLang);
      localStorage.setItem("lang", selectedLang);
      langMenu.parentElement.classList.remove("active");
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", () => {
    langMenu.parentElement.classList.remove("active");
  });
});

function applyLanguage(lang) {
  document.documentElement.lang = lang;
  document.body.dir = lang === "ar" ? "rtl" : "ltr";

  const texts = {
    en: {
      resume: "RESUME",
      intro: "Hi, I’m Samuel — a full-stack engineer connecting design and development.",
      download: "Download CV",
      experience: "Experience",
      portfolio: "PORTFOLIO",
      contact: "CONTACT",
      contactText: "Have a question or proposal? Write me:",
      send: "Send",
      footer: "© 2025 — Mr Samir Senhaji",
    },
    es: {
      resume: "RÉSUMÉ",
      intro: "Hola, soy Samuel, un ingeniero full-stack que conecta diseño y desarrollo.",
      download: "Descargar CV",
      experience: "Experiencia",
      portfolio: "PORTFOLIO",
      contact: "CONTACTO",
      contactText: "¿Tienes una pregunta o propuesta? Escríbeme:",
      send: "Enviar",
      footer: "© 2025 — Mr Samir Senhaji",
    },
    ar: {
      resume: "السيرة الذاتية",
      intro: "مرحباً، أنا صامويل، مهندس برمجيات شامل يدمج بين التصميم والتطوير.",
      download: "تحميل السيرة الذاتية",
      experience: "الخبرة",
      portfolio: "الأعمال",
      contact: "اتصل",
      contactText: "هل لديك سؤال أو اقتراح؟ راسلني:",
      send: "إرسال",
      footer: "© 2025 — السيد سمير السنهـاجي",
    },
  };

  const t = texts[lang];
  document.querySelector(".panel:nth-child(1) h2").textContent = t.resume;
  document.querySelector(".panel:nth-child(1) p").textContent = t.intro;
  document.querySelector(".download-btn").textContent = t.download;
  document.querySelector(".panel:nth-child(1) h3").textContent = t.experience;
  document.querySelector(".panel:nth-child(2) h2").textContent = t.portfolio;
  document.querySelector(".panel:nth-child(3) h2").textContent = t.contact;
  document.querySelector(".panel:nth-child(3) p").textContent = t.contactText;
  document.querySelector(".contact-form button").textContent = t.send;
  document.querySelector("footer").textContent = t.footer;

  // Update visible label
  const labels = { en: "EN ⌄", es: "ES ⌄", ar: "AR ⌄" };
  document.getElementById("lang-btn").textContent = labels[lang];
}

const mainVideo = document.getElementById("mainVideo");
const thumbs = document.querySelectorAll(".thumb");

thumbs.forEach(thumb => {
  thumb.addEventListener("click", () => {
    mainVideo.src = thumb.src;
    mainVideo.play();

    thumbs.forEach(t => t.classList.remove("active"));
    thumb.classList.add("active");
  });
});
// ==========================
// 🎨 LOAD PORTFOLIO PROJECTS DYNAMICALLY
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const portfolioGrid = document.getElementById("portfolio-grid");

  // Load data from projects.json
  fetch("projects.json")
    .then(response => {
      if (!response.ok) throw new Error("Error loading projects.json");
      return response.json();
    })
    .then(projects => {
      portfolioGrid.innerHTML = projects.map(project => `
        <div class="portfolio-item">
          <img src="${project.image}" alt="${project.title}">
          <h4>${project.title}</h4>
          <p>${project.description}</p>
          <a href="${project.link}" class="view-project">View Project</a>
        </div>
      `).join("");
    })
    .catch(err => {
      console.error(err);
      portfolioGrid.innerHTML = "<p>⚠️ Unable to load portfolio.</p>";
    });
});

