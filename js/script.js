document.addEventListener("DOMContentLoaded", () => {
  // ==========================
  // MOBILE MENU
  // ==========================
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
  const mobileMenuLinks = document.querySelectorAll("#mobileMenu a");

  function setMenuState(isOpen) {
    document.body.classList.toggle("menu-open", isOpen);

    if (mobileMenuToggle) {
      mobileMenuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      mobileMenuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    }

    if (mobileMenu) {
      mobileMenu.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }

    if (mobileMenuOverlay) {
      mobileMenuOverlay.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }
  }

  function closeMobileMenu() {
    setMenuState(false);
  }

  function toggleMobileMenu() {
    const isOpen = document.body.classList.contains("menu-open");
    setMenuState(!isOpen);
  }

  if (mobileMenuToggle && mobileMenu && mobileMenuOverlay) {
    setMenuState(false);

    mobileMenuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMobileMenu();
    });

    mobileMenuOverlay.addEventListener("click", closeMobileMenu);

    mobileMenuLinks.forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeMobileMenu();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        closeMobileMenu();
      }
    });

    window.addEventListener("pageshow", closeMobileMenu);
  }

  // ==========================
  // MEDIA WALL SYSTEM
  // ==========================
  const videos = [
    "https://res.cloudinary.com/dapuyi9pm/video/upload/v1777823109/VOZM5262_bx2cdr.mp4",
    "https://res.cloudinary.com/dapuyi9pm/video/upload/v1777824266/31de7446-6600-4488-8974-0ff3b7fbd73c_nhonml.mp4",
    "https://res.cloudinary.com/dapuyi9pm/video/upload/v1777823109/VOZM5262_bx2cdr.mp4"
  ];

  const mainVideo = document.getElementById("mainVideo");
  const soundBtn = document.getElementById("soundToggle");
  const items = document.querySelectorAll(".media-item");

  function safePlay(videoEl) {
    if (!videoEl) return;

    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  }

  function loadVideo(index) {
    if (!mainVideo || !items.length || !videos[index]) return;

    mainVideo.src = videos[index];
    mainVideo.muted = true;
    mainVideo.loop = true;
    mainVideo.playsInline = true;
    safePlay(mainVideo);

    items.forEach((item, i) => {
      item.classList.toggle("active", i === index);

      const thumbVideo = item.querySelector("video");
      if (thumbVideo && videos[i]) {
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

        if (soundBtn) {
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

const mobileSocialFab = document.querySelector(".mobile-social-fab");
const mobileSocialToggle = document.getElementById("mobileSocialToggle");
const mobileSocialPanel = document.getElementById("mobileSocialPanel");

if (mobileSocialFab && mobileSocialToggle && mobileSocialPanel) {
  function closeMobileSocial() {
    mobileSocialFab.classList.remove("active");
    mobileSocialToggle.setAttribute("aria-expanded", "false");
    mobileSocialPanel.setAttribute("aria-hidden", "true");
  }

  function toggleMobileSocial() {
    const isOpen = mobileSocialFab.classList.contains("active");
    mobileSocialFab.classList.toggle("active", !isOpen);
    mobileSocialToggle.setAttribute("aria-expanded", !isOpen ? "true" : "false");
    mobileSocialPanel.setAttribute("aria-hidden", !isOpen ? "false" : "true");
  }

  mobileSocialToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMobileSocial();
  });

  document.addEventListener("click", (e) => {
    if (!mobileSocialFab.contains(e.target)) {
      closeMobileSocial();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMobileSocial();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMobileSocial();
    }
  });
}