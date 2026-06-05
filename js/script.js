document.addEventListener("DOMContentLoaded", () => {
  // ==========================
  // HELPERS
  // ==========================
  const safeStorage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        return;
      }
    }
  };

  // ==========================
  // 🌍 LANGUAGE SYSTEM
  // ==========================
  const langBtn = document.getElementById("lang-btn");
  const langMenu = document.getElementById("lang-menu");

  const translations = {
    en: {
      home: "HOME",
      why: "WHY UK",
      uni: "UNIVERSITIES",
      contact: "CONTACT",
      login: "Log in",
      apply: "Apply Now",
      explore: "Explore more",
      assessment: "Free Assessment",
      title: "STUDY IN THE UK",
      heroText:
        "We guide students from the Maghreb into top UK universities with full support: admissions, visas, accommodation and career pathways.",
      students: "Students placed",
      visa: "Visa success",
      unis: "UK universities",
      whyTitle: "Why choose us",
      whyPoints:
        "✔ Personalized guidance<br>✔ University applications<br>✔ Visa support<br>✔ Accommodation help<br>✔ Maghreb student focus",
      whyText: "We make studying in the UK simple and accessible.",
      contactTitle: "Start your application",
      send: "Send",
      name: "Full name",
      email: "Email address",
      country: "Country",
      message: "Tell us about your plans..."
    },

    ar: {
      home: "الرئيسية",
      why: "لماذا بريطانيا",
      uni: "الجامعات",
      contact: "اتصل",
      login: "تسجيل الدخول",
      apply: "قدّم الآن",
      explore: "اكتشف المزيد",
      assessment: "تقييم مجاني",
      title: "ادرس في المملكة المتحدة",
      heroText:
        "نوجه الطلاب من المغرب العربي إلى أفضل الجامعات البريطانية مع دعم كامل.",
      students: "طالب تم قبوله",
      visa: "نجاح التأشيرات",
      unis: "جامعات بريطانية",
      whyTitle: "لماذا نحن",
      whyPoints:
        "✔ إرشاد شخصي<br>✔ تقديم للجامعات<br>✔ دعم التأشيرات<br>✔ مساعدة السكن<br>✔ تركيز على طلاب المغرب العربي",
      whyText: "نجعل الدراسة في بريطانيا سهلة وميسرة.",
      contactTitle: "ابدأ طلبك",
      send: "إرسال",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      country: "الدولة",
      message: "أخبرنا عن خططك..."
    },

    fr: {
      home: "ACCUEIL",
      why: "POURQUOI LE ROYAUME-UNI",
      uni: "UNIVERSITÉS",
      contact: "CONTACT",
      login: "Connexion",
      apply: "Postuler maintenant",
      explore: "Explorer",
      assessment: "Évaluation gratuite",
      title: "ÉTUDIER AU ROYAUME-UNI",
      heroText:
        "Nous accompagnons les étudiants du Maghreb vers les meilleures universités britanniques avec un support complet.",
      students: "Étudiants placés",
      visa: "Taux de visa réussi",
      unis: "Universités UK",
      whyTitle: "Pourquoi nous choisir",
      whyPoints:
        "✔ Accompagnement personnalisé<br>✔ Candidatures universitaires<br>✔ Support visa<br>✔ Aide logement<br>✔ Focus Maghreb",
      whyText: "Nous rendons les études au Royaume-Uni simples et accessibles.",
      contactTitle: "Commencez votre candidature",
      send: "Envoyer",
      name: "Nom complet",
      email: "Email",
      country: "Pays",
      message: "Parlez-nous de votre projet..."
    }
  };

  function applyLanguage(lang) {
    const dict = translations[lang];
    if (!dict) return;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key]) el.innerHTML = dict[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      if (dict[key]) el.placeholder = dict[key];
    });

    const labels = { en: "EN ⌄", fr: "FR ⌄", ar: "AR ⌄" };
    if (langBtn) langBtn.textContent = labels[lang] || "FR ⌄";

    document.documentElement.lang = lang;
    document.body.dir = lang === "ar" ? "rtl" : "ltr";
  }

  const savedLang = safeStorage.get("lang") || "fr";
  applyLanguage(savedLang);

  if (langBtn && langMenu) {
    langBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      langBtn.parentElement.classList.toggle("active");
    });

    langMenu.querySelectorAll("li").forEach((item) => {
      item.addEventListener("click", () => {
        const lang = item.dataset.lang;
        safeStorage.set("lang", lang);
        applyLanguage(lang);
        langBtn.parentElement.classList.remove("active");
      });
    });

    document.addEventListener("click", () => {
      langBtn.parentElement.classList.remove("active");
    });
  }

  // ==========================
  // 📱 MOBILE MENU
  // ==========================
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");

  function openMobileMenu() {
    document.body.classList.add("menu-open");
    if (mobileMenuToggle) mobileMenuToggle.setAttribute("aria-expanded", "true");
    if (mobileMenu) mobileMenu.setAttribute("aria-hidden", "false");
  }

  function closeMobileMenu() {
    document.body.classList.remove("menu-open");
    if (mobileMenuToggle) mobileMenuToggle.setAttribute("aria-expanded", "false");
    if (mobileMenu) mobileMenu.setAttribute("aria-hidden", "true");
  }

  if (mobileMenuToggle && mobileMenu && mobileMenuOverlay) {
    mobileMenuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = document.body.classList.contains("menu-open");
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    mobileMenuOverlay.addEventListener("click", closeMobileMenu);

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) closeMobileMenu();
    });
  }

  // ==========================
  // 🎬 MEDIA WALL SYSTEM
  // ==========================
  const videos = [
    "https://res.cloudinary.com/dapuyi9pm/video/upload/v1777823109/VOZM5262_bx2cdr.mp4",
    "https://res.cloudinary.com/dapuyi9pm/video/upload/v1777824266/31de7446-6600-4488-8974-0ff3b7fbd73c_nhonml.mp4",
    "https://res.cloudinary.com/dapuyi9pm/video/upload/v1777823109/VOZM5262_bx2cdr.mp4"
  ];

  const mainVideo = document.getElementById("mainVideo");
  const soundBtn = document.getElementById("soundToggle");
  const items = document.querySelectorAll(".media-item");

  let currentIndex = 0;

  function safePlay(videoEl) {
    if (!videoEl) return;
    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  }

  function loadVideo(index) {
    currentIndex = index;

    if (!mainVideo || !items.length) return;

    mainVideo.src = videos[index];
    mainVideo.muted = true;
    mainVideo.loop = true;
    mainVideo.playsInline = true;
    safePlay(mainVideo);

    items.forEach((item, i) => {
      item.classList.toggle("active", i === index);

      const thumbVideo = item.querySelector("video");
      if (thumbVideo) {
        thumbVideo.src = videos[i];
        thumbVideo.muted = true;
        thumbVideo.loop = true;
        thumbVideo.playsInline = true;
        safePlay(thumbVideo);
      }
    });

    if (soundBtn) {
      soundBtn.textContent = "🔇";
    }
  }

  if (items.length && mainVideo) {
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const index = parseInt(item.dataset.video, 10);
        if (Number.isNaN(index)) return;

        loadVideo(index);

        if (mainVideo && soundBtn) {
          mainVideo.muted = false;
          soundBtn.textContent = "🔊";
          safePlay(mainVideo);
        }
      });
    });

    loadVideo(0);
  }

  if (soundBtn && mainVideo) {
    soundBtn.addEventListener("click", () => {
      mainVideo.muted = !mainVideo.muted;
      soundBtn.textContent = mainVideo.muted ? "🔇" : "🔊";
      safePlay(mainVideo);
    });
  }
});