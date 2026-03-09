(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
      return;
    }
    fn();
  };

  const initLoader = () => {
    const loader = document.getElementById("loader");
    if (!loader) {
      return;
    }
    window.addEventListener("load", () => {
      document.body.classList.add("loaded");
      setTimeout(() => loader.remove(), 700);
    });
  };

  const initActiveNav = () => {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".site-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) {
        return;
      }
      if (href === path || (path === "" && href === "index.html")) {
        link.setAttribute("aria-current", "page");
      }
    });
  };

  const initMenu = () => {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".site-nav");
    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }));

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  };

  const initScrollTop = () => {
    const button = document.querySelector(".scroll-top");
    if (!button) {
      return;
    }

    const onScroll = () => button.classList.toggle("show", window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    button.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const initReveal = () => {
    const nodes = [...document.querySelectorAll(".reveal")];
    if (!nodes.length) {
      return;
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -40px 0px" });

    nodes.forEach((el) => observer.observe(el));
  };

  const initParallax = () => {
    if (reduceMotion) {
      return;
    }
    const targets = [...document.querySelectorAll("[data-parallax]")];
    if (!targets.length) {
      return;
    }

    targets.forEach((target) => target.classList.add("is-parallax"));

    let raf = 0;
    const update = () => {
      targets.forEach((target) => {
        const speed = Number(target.dataset.speed || 0.15);
        const rect = target.getBoundingClientRect();
        const offset = (window.innerHeight - rect.top) * speed;
        target.style.transform = `translate3d(0, ${Math.max(-24, Math.min(24, offset - 24)).toFixed(1)}px, 0)`;
      });
      raf = 0;
    };

    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  };

  const initTilt = () => {
    if (reduceMotion) {
      return;
    }

    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-2px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)";
      });
    });
  };

  const initFilterableGallery = () => {
    const filterButtons = [...document.querySelectorAll(".filter-btn")];
    const cards = [...document.querySelectorAll(".gallery-card")];
    if (!filterButtons.length || !cards.length) {
      return;
    }

    const setFilter = (filter) => {
      filterButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.filter === filter));
      cards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        card.hidden = !match;
      });
    };

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => setFilter(btn.dataset.filter));
    });

    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const pref = filterButtons.find((btn) => btn.dataset.filter === hash || btn.id === hash);
      if (pref) {
        setFilter(pref.dataset.filter);
      }
    }
  };

  const initLightbox = () => {
    const lightbox = document.getElementById("lightbox");
    const stage = lightbox?.querySelector(".lightbox-stage");
    const title = lightbox?.querySelector(".lightbox-meta h3");
    const desc = lightbox?.querySelector(".lightbox-meta p");
    const close = lightbox?.querySelector(".lightbox-close");
    const prev = lightbox?.querySelector(".lightbox-prev");
    const next = lightbox?.querySelector(".lightbox-next");
    const triggers = [...document.querySelectorAll(".gallery-trigger")];

    if (!lightbox || !stage || !title || !desc || !close || !prev || !next || !triggers.length) {
      return;
    }

    let index = 0;

    const render = () => {
      const current = triggers[index];
      const type = current.dataset.type;
      const src = current.dataset.src;
      stage.innerHTML = "";

      if (type === "video") {
        const video = document.createElement("video");
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.preload = "metadata";
        video.src = src;
        stage.appendChild(video);
      } else {
        const image = document.createElement("img");
        image.src = src;
        image.alt = current.querySelector("img")?.alt || "Gallery preview";
        stage.appendChild(image);
      }

      title.textContent = current.dataset.title || "Project";
      desc.textContent = current.dataset.desc || "";
    };

    const open = (newIndex) => {
      index = newIndex;
      render();
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      stage.innerHTML = "";
      document.body.style.overflow = "";
    };

    const move = (step) => {
      index = (index + step + triggers.length) % triggers.length;
      render();
    };

    triggers.forEach((trigger, triggerIndex) => {
      trigger.addEventListener("click", () => open(triggerIndex));
    });

    close.addEventListener("click", closeModal);
    prev.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!lightbox.classList.contains("open")) {
        return;
      }
      if (event.key === "Escape") {
        closeModal();
      }
      if (event.key === "ArrowRight") {
        move(1);
      }
      if (event.key === "ArrowLeft") {
        move(-1);
      }
    });
  };

  const initMediaRespect = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = Boolean(connection?.saveData);
    const slow = /2g|slow-2g/i.test(connection?.effectiveType || "");
    if (!saveData && !slow) {
      return;
    }

    document.querySelectorAll("video[autoplay]").forEach((video) => {
      video.autoplay = false;
      video.removeAttribute("autoplay");
      video.pause();
    });
  };

  ready(() => {
    initLoader();
    initActiveNav();
    initMenu();
    initScrollTop();
    initReveal();
    initParallax();
    initTilt();
    initFilterableGallery();
    initLightbox();
    initMediaRespect();
  });
})();
