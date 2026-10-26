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

  
});
