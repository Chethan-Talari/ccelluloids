(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = {
    categories: [],
    projects: [],
    activeCategory: "all",
    activeStoryProject: null,
  };

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
      return;
    }
    fn();
  };

  const slugToTitle = (value) =>
    String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (match) => match.toUpperCase())
      .trim();

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const initLoader = () => {
    const loader = document.getElementById("loader");
    if (!loader) {
      return;
    }

    window.addEventListener("load", () => {
      document.body.classList.add("loaded");
      window.setTimeout(() => loader.remove(), 650);
    });
  };

  const initActiveNav = () => {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".dock-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) {
        return;
      }
      if (href === path || (path === "" && href === "index.html")) {
        link.setAttribute("aria-current", "page");
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

  const revealItems = (items) => {
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
    }, { threshold: 0.14, rootMargin: "0px 0px -60px 0px" });

    items.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 6, 5) * 40}ms`;
      observer.observe(item);
    });
  };

  const initReveal = () => {
    revealItems([...document.querySelectorAll(".reveal")]);
  };

  const initCardTilt = (root = document) => {
    if (!window.matchMedia("(pointer: fine)").matches || reduceMotion) {
      return;
    }

    root.querySelectorAll(".project-card-trigger, .category-card, .cta-stack-card").forEach((card) => {
      if (card.dataset.tiltBound === "true") {
        return;
      }
      card.dataset.tiltBound = "true";

      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg) translateY(-4px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  };

  const getProjectDetailLines = (project) => {
    const lines = [];
    if (project.client && project.client !== "-") {
      lines.push(`Client: ${project.client}`);
    }
    if (project.project && project.project !== "-") {
      lines.push(`Project: ${project.project}`);
    }
    if (project.brand_model && project.brand_model !== "-") {
      lines.push(`Brand/Model: ${project.brand_model}`);
    }
    if (project.agency && project.agency !== "-") {
      lines.push(`Agency: ${project.agency}`);
    }
    return lines;
  };

  const renderGalleryCards = () => {
    const categoryMasonry = document.getElementById("categoryMasonry");
    const projectGrid = document.getElementById("projectCardGrid");
    const section = document.getElementById("projectsSection");
    const title = document.getElementById("projectListTitle");
    if (!categoryMasonry || !projectGrid || !section || !title) {
      return;
    }

    const counts = state.projects.reduce((map, project) => {
      map[project.category] = (map[project.category] || 0) + 1;
      return map;
    }, {});

    const categoryCards = [
      {
        slug: "all",
        title: "View All",
        chip: `${state.projects.length} Projects`,
        cover: state.projects[0]?.cover || "photo2.jpg",
        count: state.projects.length,
      },
      ...state.categories.map((category) => {
        const firstProject = state.projects.find((project) => project.category === category.slug);
        return {
          slug: category.slug,
          title: category.title || slugToTitle(category.slug),
          chip: category.chip || "Category",
          cover: firstProject?.cover || "photo2.jpg",
          count: counts[category.slug] || 0,
        };
      }),
    ];

    categoryMasonry.innerHTML = categoryCards
      .map(
        (category) => `
          <button class="category-card reveal${category.slug === state.activeCategory ? " active" : ""}" type="button" data-category="${escapeHtml(category.slug)}">
            <span class="card-frame">
              <img src="${escapeHtml(category.cover)}" alt="${escapeHtml(category.title)} category preview" loading="lazy" decoding="async" />
              <span class="card-corners" aria-hidden="true"></span>
              <span class="card-hover" aria-hidden="true"><i>+</i></span>
            </span>
            <span class="card-meta">
              <strong>${escapeHtml(category.title)}</strong>
              <em>${escapeHtml(String(category.count).padStart(2, "0"))} projects</em>
              <span class="card-chip">${escapeHtml(category.chip)}</span>
            </span>
          </button>
        `
      )
      .join("");

    const visibleProjects = state.projects.filter(
      (project) => state.activeCategory === "all" || project.category === state.activeCategory
    );

    projectGrid.innerHTML = visibleProjects.length
      ? visibleProjects
          .map((project) => `
            <article class="project-card reveal" data-project-id="${escapeHtml(project.id)}">
              <button class="project-card-trigger" type="button" aria-label="Open ${escapeHtml(project.title)} project">
                <span class="card-frame">
                  <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.title)} cover image" loading="lazy" decoding="async" />
                  <span class="card-corners" aria-hidden="true"></span>
                  <span class="card-hover" aria-hidden="true"><i>+</i></span>
                </span>
                <span class="card-meta">
                  <strong>${escapeHtml(project.title)}</strong>
                  <em>${escapeHtml(project.date || "")}</em>
                  <span class="card-chip">${escapeHtml(project.chip || slugToTitle(project.category))}</span>
                </span>
              </button>
            </article>
          `)
          .join("")
      : `
        <div class="gallery-empty reveal">
          <p>No projects found in this category yet.</p>
        </div>
      `;

    title.textContent =
      state.activeCategory === "all"
        ? "All Projects"
        : `${state.categories.find((item) => item.slug === state.activeCategory)?.title || slugToTitle(state.activeCategory)} Projects`;

    section.classList.toggle("is-collapsed", !visibleProjects.length && !state.projects.length);

    categoryMasonry.querySelectorAll(".category-card").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeCategory = button.dataset.category || "all";
        renderGalleryCards();
        document.getElementById("projectsSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    projectGrid.querySelectorAll(".project-card-trigger").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const projectId = trigger.closest(".project-card")?.dataset.projectId;
        const project = state.projects.find((item) => item.id === projectId);
        if (project) {
          openProjectStory(project);
        }
      });
    });

    revealItems([
      ...categoryMasonry.querySelectorAll(".reveal"),
      ...projectGrid.querySelectorAll(".reveal"),
    ]);
    initCardTilt(categoryMasonry);
    initCardTilt(projectGrid);
  };

  const renderStoryMedia = (project) => {
    const masonry = document.querySelector(".story-masonry");
    if (!masonry) {
      return;
    }

    masonry.innerHTML = (project.media || [])
      .map((item, index) => {
        const label = `${project.title} ${index + 1}`;
        if (item.type === "video") {
          return `
            <button class="gallery-media" type="button" data-type="video" data-src="${escapeHtml(item.src)}" data-title="${escapeHtml(project.title)}" data-desc="${escapeHtml(project.description || "")}">
              <video src="${escapeHtml(item.src)}" muted playsinline preload="metadata" aria-label="${escapeHtml(label)}"></video>
            </button>
          `;
        }

        return `
          <button class="gallery-media" type="button" data-type="image" data-src="${escapeHtml(item.src)}" data-title="${escapeHtml(project.title)}" data-desc="${escapeHtml(project.description || "")}">
            <img src="${escapeHtml(item.src)}" alt="${escapeHtml(label)}" loading="lazy" decoding="async" />
          </button>
        `;
      })
      .join("");
  };

  const updateStoryProgress = () => {
    const story = document.getElementById("projectStory");
    const scrollWrap = story?.querySelector(".project-story-scroll");
    const heroSection = story?.querySelector(".project-story-hero");
    if (!story || !scrollWrap || !heroSection) {
      return;
    }

    const heroTop = heroSection.offsetTop;
    const heroRange = Math.max(1, heroSection.offsetHeight - (window.innerHeight - 72));
    const inHero = Math.max(0, Math.min(heroRange, scrollWrap.scrollTop - heroTop));
    const revealRange = heroRange * 0.6;
    const progress = Math.max(0, Math.min(1, inHero / Math.max(1, revealRange)));
    const titleUi = Math.max(0, Math.min(1, (progress - 0.08) / 0.18));
    const infoUi = Math.max(0, Math.min(1, (progress - 0.25) / 0.22));
    const baseUi = Math.max(0, Math.min(1, (progress - 0.05) / 0.18));

    story.style.setProperty("--story-progress", progress.toFixed(3));
    story.style.setProperty("--story-ui", baseUi.toFixed(3));
    story.style.setProperty("--story-title-ui", titleUi.toFixed(3));
    story.style.setProperty("--story-info-ui", infoUi.toFixed(3));
    story.classList.toggle("ui-visible", baseUi > 0.03);
  };

  const openProjectStory = (project) => {
    const story = document.getElementById("projectStory");
    const scrollWrap = story?.querySelector(".project-story-scroll");
    const cover = story?.querySelector(".story-cover");
    const stickyTitle = story?.querySelector(".story-sticky-title");
    const title = story?.querySelector(".story-title");
    const meta = story?.querySelector(".story-meta");
    const description = story?.querySelector(".story-description");
    const galleryTitle = story?.querySelector(".story-gallery-title");
    if (!story || !scrollWrap || !cover || !stickyTitle || !title || !meta || !description || !galleryTitle) {
      return;
    }

    state.activeStoryProject = project;
    cover.src = project.cover;
    cover.alt = `${project.title} cover image`;
    stickyTitle.textContent = project.title;
    title.textContent = project.title;
    galleryTitle.textContent = project.title;
    description.textContent = project.description || "";

    meta.innerHTML = getProjectDetailLines(project)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");

    renderStoryMedia(project);

    story.classList.add("open");
    story.setAttribute("aria-hidden", "false");
    document.body.classList.add("story-open");
    scrollWrap.scrollTop = 0;
    story.style.setProperty("--story-progress", "0");
    story.style.setProperty("--story-ui", "0");
    story.style.setProperty("--story-title-ui", "0");
    story.style.setProperty("--story-info-ui", "0");
    story.classList.remove("ui-visible");
    updateStoryProgress();
  };

  const closeProjectStory = () => {
    const story = document.getElementById("projectStory");
    if (!story) {
      return;
    }
    story.classList.remove("open");
    story.setAttribute("aria-hidden", "true");
    document.body.classList.remove("story-open");
    state.activeStoryProject = null;
  };

  const initProjectStory = () => {
    const story = document.getElementById("projectStory");
    const scrollWrap = story?.querySelector(".project-story-scroll");
    const backButton = story?.querySelector(".story-back");
    if (!story || !scrollWrap || !backButton) {
      return;
    }

    backButton.addEventListener("click", closeProjectStory);
    scrollWrap.addEventListener("scroll", updateStoryProgress, { passive: true });
    window.addEventListener("resize", updateStoryProgress);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && story.classList.contains("open")) {
        closeProjectStory();
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
      if (!item) {
        return;
      }

      stage.innerHTML = "";
      if ((item.dataset.type || "image") === "video") {
        const video = document.createElement("video");
        video.src = item.dataset.src || "";
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.preload = "metadata";
        stage.appendChild(video);
      } else {
        const image = document.createElement("img");
        image.src = item.dataset.src || "";
        image.alt = item.querySelector("img")?.alt || "Gallery preview";
        stage.appendChild(image);
      }

      title.textContent = item.dataset.title || "";
      desc.textContent = item.dataset.desc || "";
    };

    const open = (newIndex, newItems) => {
      items = newItems;
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
      if (scopeIndex !== -1) {
        open(scopeIndex, scopeItems);
      }
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

  const renderGalleryEmptyState = (message) => {
    const categoryMasonry = document.getElementById("categoryMasonry");
    const projectGrid = document.getElementById("projectCardGrid");
    const title = document.getElementById("projectListTitle");
    if (!categoryMasonry || !projectGrid || !title) {
      return;
    }

    categoryMasonry.innerHTML = `
      <div class="gallery-empty reveal visible">
        <p>${escapeHtml(message)}</p>
      </div>
    `;
    projectGrid.innerHTML = `
      <div class="gallery-empty reveal visible">
        <p>Create folders in assets/projects and run the sync script to populate this gallery.</p>
      </div>
    `;
    title.textContent = "No Projects Yet";
  };

  const initGalleryData = async () => {
    if (!document.body.classList.contains("page-gallery")) {
      return;
    }

    try {
      const response = await fetch("assets/projects/projects.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load projects.json (${response.status})`);
      }

      const payload = await response.json();
      state.categories = Array.isArray(payload.categories) ? payload.categories : [];
      state.projects = (Array.isArray(payload.projects) ? payload.projects : []).map((project) => ({
        ...project,
        title: project.title || slugToTitle(project.id?.split("/").pop() || ""),
        media: Array.isArray(project.media) ? project.media : [],
      }));

      if (!state.projects.length) {
        renderGalleryEmptyState("No synced projects found.");
        return;
      }

      renderGalleryCards();
    } catch (error) {
      renderGalleryEmptyState("Gallery data is not available yet.");
      console.error(error);
    }
  };

  ready(() => {
    initLoader();
    initActiveNav();
    initScrollTop();
    initReveal();
    initCardTilt();
    initProjectStory();
    initLightbox();
    initGalleryData();
  });
})();
