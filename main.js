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
      setTimeout(() => loader.remove(), 650);
    });
  };

  const initActiveNav = () => {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".site-nav a, .dock-nav a").forEach((link) => {
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
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

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
    const items = [...document.querySelectorAll(".reveal")];
    if (!items.length) {
      return;
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -50px 0px" });

    items.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 6, 5) * 40}ms`;
      observer.observe(item);
    });
  };

  const initFilterGallery = () => {
    const filters = [...document.querySelectorAll(".category-card")];
    const projects = [...document.querySelectorAll(".project-card")];
    const title = document.getElementById("projectListTitle");
    const section = document.getElementById("projectsSection");
    if (!filters.length || !projects.length) {
      return;
    }

    const labelMap = {
      all: "All Projects",
      commercial: "Commercial Projects",
      product: "Product Projects",
      fashion: "Fashion Projects",
      events: "Event Projects",
      documentary: "Documentary Projects",
      street: "Street Projects",
    };

    const setFilter = (category) => {
      section?.classList.remove("is-collapsed");

      filters.forEach((button) => {
        button.classList.toggle("active", (button.dataset.category || "all") === category);
      });

      projects.forEach((project) => {
        const match = category === "all" || project.dataset.category === category;
        project.hidden = !match;
      });

      if (title) {
        title.textContent = labelMap[category] || "Projects";
      }
    };

    projects.forEach((project) => {
      project.hidden = true;
    });
    if (title) {
      title.textContent = "Select A Category";
    }

    filters.forEach((button) => {
      button.addEventListener("click", () => {
        setFilter(button.dataset.category || "all");
        document.getElementById("projectsSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const initCardTilt = () => {
    if (!window.matchMedia("(pointer: fine)").matches || reduceMotion) {
      return;
    }

    const cards = [...document.querySelectorAll(".project-card-trigger, .category-card")];
    cards.forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  };

  const initProjectStory = () => {
    const story = document.getElementById("projectStory");
    const scrollWrap = story?.querySelector(".project-story-scroll");
    const heroSection = story?.querySelector(".project-story-hero");
    const cover = story?.querySelector(".story-cover");
    const stickyTitle = story?.querySelector(".story-sticky-title");
    const title = story?.querySelector(".story-title");
    const meta = story?.querySelector(".story-meta");
    const description = story?.querySelector(".story-description");
    const galleryTitle = story?.querySelector(".story-gallery-title");
    const masonry = story?.querySelector(".story-masonry");
    const backButton = story?.querySelector(".story-back");
    const entries = [...document.querySelectorAll(".project-card")];

    if (
      !story ||
      !scrollWrap ||
      !heroSection ||
      !cover ||
      !stickyTitle ||
      !title ||
      !meta ||
      !description ||
      !galleryTitle ||
      !masonry ||
      !backButton ||
      !entries.length
    ) {
      return;
    }

    const updateProgress = () => {
      const heroTop = heroSection.offsetTop;
      const heroRange = Math.max(1, heroSection.offsetHeight - (window.innerHeight - 72));
      const inHero = Math.max(0, Math.min(heroRange, scrollWrap.scrollTop - heroTop));
      const revealRange = heroRange * 0.58;
      const progress = Math.max(0, Math.min(1, inHero / Math.max(1, revealRange)));
      const titleUi = Math.max(0, Math.min(1, (progress - 0.05) / 0.2));
      const infoUi = Math.max(0, Math.min(1, (progress - 0.22) / 0.28));
      const baseUi = Math.max(0, Math.min(1, (progress - 0.04) / 0.2));
      story.style.setProperty("--story-progress", progress.toFixed(3));
      story.style.setProperty("--story-ui", baseUi.toFixed(3));
      story.style.setProperty("--story-title-ui", titleUi.toFixed(3));
      story.style.setProperty("--story-info-ui", infoUi.toFixed(3));
      story.classList.toggle("ui-visible", baseUi > 0.03);
    };

    const openStory = (entry) => {
      const data = entry.querySelector(".project-data");
      if (!data) {
        return;
      }

      const coverImage = data.querySelector(".project-cover-src");
      const projectTitle = data.querySelector(".project-title-src")?.textContent?.trim() || "Project";
      const detailLines = [...data.querySelectorAll("p:not(.project-description-src)")].map((item) => item.textContent.trim());
      const descText = data.querySelector(".project-description-src")?.textContent?.trim() || "Project highlights and visual direction.";
      const mediaItems = [...data.querySelectorAll(".project-media-list .gallery-media")];

      cover.src = coverImage?.src || "";
      cover.alt = coverImage?.alt || `${projectTitle} cover`;
      stickyTitle.textContent = projectTitle;
      title.textContent = projectTitle;
      galleryTitle.textContent = projectTitle;
      description.textContent = descText;

      meta.innerHTML = "";
      detailLines.forEach((line) => {
        const detail = document.createElement("p");
        detail.textContent = line;
        meta.appendChild(detail);
      });

      masonry.innerHTML = "";
      mediaItems.forEach((item) => {
        masonry.appendChild(item.cloneNode(true));
      });

      story.classList.add("open");
      story.setAttribute("aria-hidden", "false");
      document.body.classList.add("story-open");
      scrollWrap.scrollTop = 0;
      story.style.setProperty("--story-ui", "0");
      story.style.setProperty("--story-title-ui", "0");
      story.style.setProperty("--story-info-ui", "0");
      story.classList.remove("ui-visible");
      updateProgress();
    };

    const closeStory = () => {
      story.classList.remove("open");
      story.setAttribute("aria-hidden", "true");
      document.body.classList.remove("story-open");
      story.style.setProperty("--story-progress", "0");
      story.style.setProperty("--story-ui", "0");
      story.style.setProperty("--story-title-ui", "0");
      story.style.setProperty("--story-info-ui", "0");
      story.classList.remove("ui-visible");
    };

    entries.forEach((entry) => {
      const trigger = entry.querySelector(".project-card-trigger");
      if (trigger) {
        trigger.addEventListener("click", () => openStory(entry));
      }
    });

    backButton.addEventListener("click", closeStory);
    scrollWrap.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && story.classList.contains("open")) {
        closeStory();
      }
    });
  };

  const initLightbox = () => {
    const modal = document.getElementById("lightbox");
    const stage = modal?.querySelector(".lightbox-stage");
    const title = modal?.querySelector(".lightbox-meta h3");
    const desc = modal?.querySelector(".lightbox-meta p");
    const closeButton = modal?.querySelector(".lightbox-close");
    const prevButton = modal?.querySelector(".lightbox-prev");
    const nextButton = modal?.querySelector(".lightbox-next");
    if (!modal || !stage || !title || !desc || !closeButton || !prevButton || !nextButton) {
      return;
    }

    let items = [];
    let index = 0;

    const render = () => {
      const item = items[index];
      const type = item.dataset.type || "image";
      const src = item.dataset.src;
      stage.innerHTML = "";

      if (type === "video") {
        const video = document.createElement("video");
        video.src = src;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.preload = "metadata";
        stage.appendChild(video);
      } else {
        const image = document.createElement("img");
        image.src = src;
        image.alt = item.querySelector("img")?.alt || "Gallery preview";
        stage.appendChild(image);
      }

      title.textContent = item.dataset.title || "Project";
      desc.textContent = item.dataset.desc || "";
    };

    const open = (newIndex, newItems) => {
      items = newItems;
      if (!items.length) {
        return;
      }
      index = newIndex;
      render();
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };

    const close = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      stage.innerHTML = "";
      document.body.style.overflow = "";
    };

    const move = (step) => {
      index = (index + step + items.length) % items.length;
      render();
    };

    document.addEventListener("click", (event) => {
      const media = event.target.closest(".gallery-media");
      if (!media) {
        return;
      }

      const scope = media.closest(".project-story") || document;
      const scopeItems = [...scope.querySelectorAll(".gallery-media")];
      const scopeIndex = scopeItems.indexOf(media);
      if (scopeIndex === -1) {
        return;
      }
      open(scopeIndex, scopeItems);
    });

    closeButton.addEventListener("click", close);
    prevButton.addEventListener("click", () => move(-1));
    nextButton.addEventListener("click", () => move(1));

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!modal.classList.contains("open")) {
        return;
      }
      if (event.key === "Escape") {
        close();
      }
      if (event.key === "ArrowLeft") {
        move(-1);
      }
      if (event.key === "ArrowRight") {
        move(1);
      }
    });
  };

  ready(() => {
    initLoader();
    initActiveNav();
    initMenu();
    initScrollTop();
    initReveal();
    initFilterGallery();
    initCardTilt();
    initProjectStory();
    initLightbox();
  });
})();
