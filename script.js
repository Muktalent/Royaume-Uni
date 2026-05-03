// ==========================
// 🌍 LANGUAGE SYSTEM
// ==========================
document.addEventListener("DOMContentLoaded", () => {
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

    es: {
      home: "INICIO",
      why: "POR QUÉ UK",
      uni: "UNIVERSIDADES",
      contact: "CONTACTO",
      login: "Iniciar sesión",
      apply: "Aplicar ahora",
      explore: "Explorar más",

      title: "ESTUDIA EN EL REINO UNIDO",
      heroText:
        "Guiamos a estudiantes del Magreb hacia las mejores universidades del Reino Unido con apoyo completo.",

      students: "Estudiantes",
      visa: "Éxito en visas",
      unis: "Universidades UK",

      whyTitle: "Por qué elegirnos",
      whyPoints:
        "✔ Asesoría personalizada<br>✔ Aplicaciones universitarias<br>✔ Apoyo en visas<br>✔ Ayuda con alojamiento<br>✔ Enfoque Magreb",
      whyText: "Hacemos estudiar en UK simple y accesible.",

      contactTitle: "Inicia tu aplicación",
      send: "Enviar",

      name: "Nombre completo",
      email: "Correo electrónico",
      country: "País",
      message: "Cuéntanos tus planes..."
    },

    ar: {
      home: "الرئيسية",
      why: "لماذا بريطانيا",
      uni: "الجامعات",
      contact: "اتصل",
      login: "تسجيل الدخول",
      apply: "قدّم الآن",
      explore: "اكتشف المزيد",

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
    }
  };

  function applyLanguage(lang) {
    const dict = translations[lang];

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key]) el.innerHTML = dict[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      if (dict[key]) el.placeholder = dict[key];
    });

    const labels = { en: "EN ⌄", es: "ES ⌄", ar: "AR ⌄" };
    langBtn.textContent = labels[lang];

    document.documentElement.lang = lang;
    document.body.dir = lang === "ar" ? "rtl" : "ltr";
  }

  // INIT LANGUAGE
  let savedLang = localStorage.getItem("lang") || "en";
  applyLanguage(savedLang);

  langBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    langBtn.parentElement.classList.toggle("active");
  });

  langMenu.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", () => {
      const lang = item.dataset.lang;
      localStorage.setItem("lang", lang);
      applyLanguage(lang);
      langBtn.parentElement.classList.remove("active");
    });
  });

  document.addEventListener("click", () => {
    langBtn.parentElement.classList.remove("active");
  });

  // ==========================
  // 🎬 VIDEO CAROUSEL (CLEAN)
  // ==========================
const videos = [
  
  "https://res.cloudinary.com/dapuyi9pm/video/upload/v1777823109/VOZM5262_bx2cdr.mp4",
  "https://res.cloudinary.com/dapuyi9pm/video/upload/v1777824266/31de7446-6600-4488-8974-0ff3b7fbd73c_nhonml.mp4"
];

let currentIndex = 0;

const mainVideo = document.getElementById("mainVideo");
const prevBtn = document.getElementById("prevVideo");
const nextBtn = document.getElementById("nextVideo");

function loadVideo(index) {
  mainVideo.pause();
  mainVideo.src = videos[index];
  mainVideo.load();
  mainVideo.play();
}

nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % videos.length;
  loadVideo(currentIndex);
});

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + videos.length) % videos.length;
  loadVideo(currentIndex);
});

// init
loadVideo(currentIndex);
 

  // INIT FIRST VIDEO
  loadVideo(currentIndex);

  const soundBtn = document.getElementById("soundToggle");

soundBtn.addEventListener("click", () => {
  mainVideo.muted = !mainVideo.muted;
  soundBtn.textContent = mainVideo.muted ? "🔇" : "🔊";
});

const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");

menuToggle.addEventListener("click", () => {
  mobileMenu.classList.add("active");
});

// cerrar al hacer click en cualquier link
document.querySelectorAll(".mobile-menu a").forEach(link => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("active");
  });
});

// cerrar al tocar fondo
mobileMenu.addEventListener("click", (e) => {
  if (e.target === mobileMenu) {
    mobileMenu.classList.remove("active");
  }
});
});