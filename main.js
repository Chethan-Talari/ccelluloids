(() => {
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
      return;
    }
    fn();
  }

  function markPageReady() {
    requestAnimationFrame(() => {
      document.body.classList.add("page-ready");
    });
  }

  function initLoaders() {
    const preloader = document.getElementById("preloader");
    const loader = document.getElementById("loader");

    window.addEventListener("load", () => {
      if (preloader) {
        document.body.classList.add("loaded");
        setTimeout(() => {
          preloader.style.display = "none";
        }, 550);
      }

      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => {
          loader.style.display = "none";
        }, 550);
      }
    });
  }

  function initActiveNav() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".nav-links a").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) {
        return;
      }

      if (href === currentPath) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function initPageTransitions() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) {
        return;
      }

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || link.hasAttribute("download")) {
        return;
      }

      if (link.target && link.target !== "_self") {
        return;
      }

      const targetUrl = new URL(link.href, window.location.href);
      if (targetUrl.origin !== window.location.origin) {
        return;
      }

      const samePath = targetUrl.pathname === window.location.pathname;
      if (samePath && targetUrl.hash) {
        return;
      }

      event.preventDefault();
      document.body.classList.add("page-leaving");
      setTimeout(() => {
        window.location.href = targetUrl.href;
      }, 240);
    });
  }

  function initRevealAnimations() {
    const revealTargets = document.querySelectorAll(
      "section, .gallery-grid, .project-table, .news-box, .polaroid-row, .responsive-iframe, .contact-info, .client-logos"
    );

    revealTargets.forEach((el) => {
      if (!el.classList.contains("hero-static") && !el.classList.contains("thank-you-section")) {
        el.classList.add("reveal-on-scroll");
      }
    });

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
      );

      document.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));
      return;
    }

    document.querySelectorAll(".reveal-on-scroll").forEach((el) => el.classList.add("is-visible"));
  }

  function initMediaOptimization() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = Boolean(connection && connection.saveData);
    const slowNetwork = Boolean(connection && /(^2g$)|(^slow-2g$)/i.test(connection.effectiveType || ""));
    if (!saveData && !slowNetwork) {
      return;
    }

    document.querySelectorAll("video[autoplay]").forEach((video) => {
      video.autoplay = false;
      video.removeAttribute("autoplay");
      if (!video.hasAttribute("controls")) {
        video.setAttribute("controls", "");
      }
      video.preload = "none";
      try {
        video.pause();
      } catch {
        // Ignore autoplay pause errors.
      }
    });
  }

  function initCursor() {
    const cursor = document.querySelector(".custom-cursor");
    if (!cursor || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    document.addEventListener("mousemove", (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    });

    document.addEventListener("click", () => {
      cursor.classList.add("ripple");
      setTimeout(() => cursor.classList.remove("ripple"), 500);
    });

    document.addEventListener("mouseover", (event) => {
      if (event.target.closest("a, button, .btn")) {
        cursor.classList.add("hover");
      }
    });

    document.addEventListener("mouseout", (event) => {
      if (event.target.closest("a, button, .btn")) {
        cursor.classList.remove("hover");
      }
    });
  }

  function initScrollTop() {
    const scrollBtn = document.querySelector(".scroll-top");
    if (!scrollBtn) {
      return;
    }

    const toggleButton = () => {
      scrollBtn.classList.toggle("show", window.scrollY > 300);
    };

    scrollBtn.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", toggleButton);
    toggleButton();
  }

  function initBurgerNav() {
    const burger = document.querySelector(".burger");
    const nav = document.querySelector(".nav-links");
    if (!burger || !nav) {
      return;
    }

    const closeNav = () => {
      nav.classList.remove("active");
      burger.classList.remove("toggle");
      burger.setAttribute("aria-expanded", "false");
    };

    burger.setAttribute("role", "button");
    burger.setAttribute("tabindex", "0");
    burger.setAttribute("aria-label", "Toggle navigation");
    burger.setAttribute("aria-expanded", "false");

    const toggleNav = () => {
      const isOpen = nav.classList.toggle("active");
      burger.classList.toggle("toggle", isOpen);
      burger.setAttribute("aria-expanded", String(isOpen));
    };

    burger.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleNav();
    });

    burger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleNav();
      }
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target) && !burger.contains(event.target)) {
        closeNav();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeNav();
      }
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });
  }

  function initSpark() {
    if (!document.body.classList.contains("home")) {
      return;
    }

    document.addEventListener("click", (event) => {
      if (event.target.closest("a, button, input, textarea, video, iframe")) {
        return;
      }

      const spark = document.createElement("div");
      spark.className = "spark";
      spark.style.left = `${event.pageX - 10}px`;
      spark.style.top = `${event.pageY - 10}px`;
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 500);
    });
  }

  function initGalleryLightbox() {
    const modal = document.getElementById("lightboxModal");
    if (!modal) {
      return;
    }

    const modalContent = modal.querySelector(".lightbox-content");
    const closeBtn = modal.querySelector(".lightbox-close");
    const items = document.querySelectorAll(".gallery-item");
    let previouslyFocused = null;

    const closeModal = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      modalContent.innerHTML = "";
      document.body.style.overflow = "";
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    };

    const openModal = (item) => {
      previouslyFocused = document.activeElement;
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
      modalContent.innerHTML = "";
      document.body.style.overflow = "hidden";

      if (item.tagName === "IMG") {
        const img = document.createElement("img");
        img.src = item.src;
        img.alt = item.alt || "Gallery image";
        modalContent.appendChild(img);
      } else if (item.tagName === "VIDEO") {
        const video = document.createElement("video");
        video.src = item.src;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.preload = "metadata";
        modalContent.appendChild(video);
      }

      closeBtn.focus();
    };

    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    closeBtn.setAttribute("aria-label", "Close gallery preview");
    closeBtn.setAttribute("role", "button");

    items.forEach((item) => {
      item.addEventListener("click", () => openModal(item));
    });

    closeBtn.addEventListener("click", closeModal);
    closeBtn.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        closeModal();
      }
    });
    modal.addEventListener("click", (event) => {
      if (
        event.target.classList.contains("lightbox-modal") ||
        event.target.classList.contains("lightbox-backdrop")
      ) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("show")) {
        closeModal();
      }
    });
  }

  onReady(() => {
    markPageReady();
    initLoaders();
    initActiveNav();
    initPageTransitions();
    initRevealAnimations();
    initMediaOptimization();
    initCursor();
    initScrollTop();
    initBurgerNav();
    initSpark();
    initGalleryLightbox();
  });
})();


