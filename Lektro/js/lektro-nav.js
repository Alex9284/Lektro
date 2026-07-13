// ===== LEKTRO NAV =====
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var nav = document.getElementById("lekNav");
    var toggle = document.getElementById("lekNavToggle");
    var links = document.getElementById("lekNavLinks");
    var backdrop = document.getElementById("lekNavBackdrop");
    var dropdown = document.querySelector(".lek-nav__dropdown");
    var dropdownBtn = document.getElementById("lekDropdownBtn");

    if (!nav) return;

    // Fondo con blur al hacer scroll
    var onScroll = function () {
      if (window.scrollY > 12) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Menú mobile
    function openMenu() {
      links.classList.add("is-open");
      toggle.classList.add("is-active");
      if (backdrop) backdrop.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    }
    function closeMenu() {
      links.classList.remove("is-open");
      toggle.classList.remove("is-active");
      if (backdrop) backdrop.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (dropdown) dropdown.classList.remove("is-open");
      if (dropdownBtn) dropdownBtn.setAttribute("aria-expanded", "false");
    }
    if (toggle) {
      toggle.addEventListener("click", function () {
        links.classList.contains("is-open") ? closeMenu() : openMenu();
      });
    }
    if (backdrop) backdrop.addEventListener("click", closeMenu);

    // Dropdown Productos (click en mobile, hover en desktop vía CSS)
    if (dropdownBtn) {
      dropdownBtn.addEventListener("click", function (e) {
        e.preventDefault();
        var isOpen = dropdown.classList.toggle("is-open");
        dropdownBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    // Cerrar menú mobile al elegir un link (que no sea el dropdown)
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });

    // Cerrar al hacer click afuera (desktop dropdown)
    document.addEventListener("click", function (e) {
      if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove("is-open");
        if (dropdownBtn) dropdownBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Cerrar con Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    // Si se agranda la ventana, resetear estado mobile
    window.addEventListener("resize", function () {
      if (window.innerWidth > 991) closeMenu();
    });
  });
})();
