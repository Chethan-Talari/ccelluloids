(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = {
    categories: [],
    projects: [],
    activeCategory: "all",
    activeStoryProject: null,
  };
  let closeLightbox = () => {};

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

  const cleanUrlMap = {
    "/index.html": "/",
    "/gallery.html": "/gallery/",
    "/category.html": "/category/",
    "/about.html": "/about/",
    "/hireme.html": "/hireme/",
    "/thankyou.html": "/thankyou/",
  };

  const toRootUrl = (value) => {
    const url = String(value || "");
    if (!url || /^(?:https?:|mailto:|tel:|data:|blob:|#|\/)/.test(url)) {
      return url;
    }
    return `/${url.replace(/^\.?\//, "")}`;
  };

  const normalizeInternalPath = (value) => {
    let pathname = value;
    try {
      pathname = new URL(value, window.location.origin).pathname;
    } catch {
      pathname = String(value || "");
    }

    return cleanUrlMap[pathname] || pathname.replace(/\/index\.html$/, "/");
  };

  const initCleanUrlRedirect = () => {
    const target = cleanUrlMap[window.location.pathname];
    if (!target) {
      return false;
    }

    window.location.replace(`${target}${window.location.search}${window.location.hash}`);
    return true;
  };

  const initLoader = () => {
    const loader = document.getElementById("loader");
    if (!loader) {
      return;
    }

    window.addEventListener("load", () => {
      document.body.classList.add("loaded");
      window.setTimeout(() => loader.remove(), 180);
    });
  };

  const initActiveNav = () => {
    const path = normalizeInternalPath(window.location.pathname);
    document.querySelectorAll(".dock-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) {
        return;
      }
      if (normalizeInternalPath(href) === path) {
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

  const initUniversalBack = () => {
    const button = document.querySelector(".universal-back");
    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      const lightbox = document.getElementById("lightbox");
      const story = document.getElementById("projectStory");

      if (lightbox?.classList.contains("open")) {
        closeLightbox();
        return;
      }

      if (story?.classList.contains("open")) {
        closeProjectStory();
        return;
      }

      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      window.location.href = button.dataset.fallback || "/";
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

  const applyGalleryCardMasonryLayout = (root = document) => {
    const grids = root?.matches?.(".category-masonry, .project-card-grid")
      ? [root]
      : [...(root || document).querySelectorAll(".category-masonry, .project-card-grid")];

    grids.forEach((grid) => {
      const gridStyles = window.getComputedStyle(grid);
      const rowHeight = parseFloat(gridStyles.getPropertyValue("grid-auto-rows")) || 8;
      const gap = parseFloat(gridStyles.getPropertyValue("gap")) || 16;
      const items = [...grid.children].filter((item) => item.matches(".category-card, .project-card"));

      items.forEach((item) => {
        const tile = item.matches(".project-card") ? item.querySelector(".project-card-trigger") : item;
        if (!tile) {
          return;
        }

        const update = () => {
          const height = tile.getBoundingClientRect().height;
          if (!height) {
            return;
          }

          const span = Math.max(12, Math.ceil((height + gap) / (rowHeight + gap)));
          item.style.setProperty("--card-span", String(span));
        };

        update();

        const image = tile.querySelector("img");
        if (image && !image.complete) {
          image.addEventListener("load", () => requestAnimationFrame(update), { once: true });
        }
      });
    });
  };

  const applyProjectCardOrientations = (root = document) => {
    root.querySelectorAll(".project-card").forEach((card) => {
      const image = card.querySelector("img");
      if (!image) {
        return;
      }

      const update = () => {
        const isLandscape = image.naturalWidth > image.naturalHeight;
        card.classList.toggle("is-landscape", isLandscape);
        card.classList.toggle("is-portrait", !isLandscape);
        requestAnimationFrame(() => applyGalleryCardMasonryLayout(root));
      };

      if (image.complete) {
        update();
      } else {
        image.addEventListener("load", update, { once: true });
      }
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

  const getCategorySummary = (slug) => {
    const normalized = String(slug || "").toLowerCase();
    const copy = {
      all: "A complete view across commercial, documentary, event, fashion, and future street work.",
      commercial: "Campaign imagery built for brands, launches, and product-led visual systems.",
      commercials: "Campaign imagery built for brands, launches, and product-led visual systems.",
      product: "Clean, tactile frames shaped for catalog, e-commerce, and branded storytelling.",
      fashion: "Editorial portraits and model-focused visuals with styling, mood, and direction.",
      events: "Atmosphere-led coverage that captures stage, crowd, movement, and brand presence.",
      documentary: "Human-centered storytelling built around lived moments, place, and observation.",
      documentaries: "Human-centered storytelling built around lived moments, place, and observation.",
      street: "Unscripted city frames collected through rhythm, contrast, and visual instinct.",
    };

    return copy[normalized] || "Project-driven work grouped by format, mood, and client need.";
  };

  const getCategoryCards = () => {
    const counts = state.projects.reduce((map, project) => {
      const key = String(project.category || "").toLowerCase();
      map[key] = (map[key] || 0) + 1;
      return map;
    }, {});

    return [
      ...state.categories.map((category) => {
        const categoryKey = String(category.slug || "").toLowerCase();
        const firstProject = state.projects.find((project) => String(project.category || "").toLowerCase() === categoryKey);
        return {
          slug: category.slug,
          title: category.title || slugToTitle(category.slug),
          chip: category.chip || "Category",
          cover: toRootUrl(firstProject?.cover || "photo2.jpg"),
          count: counts[categoryKey] || 0,
        };
      }),
      {
        slug: "all",
        title: "View All",
        chip: `${state.projects.length} Projects`,
        cover: toRootUrl(state.projects[0]?.cover || "photo2.jpg"),
        count: state.projects.length,
      },
    ];
  };

  const getCategoryFromUrl = () => {
    const value = new URLSearchParams(window.location.search).get("category") || "all";
    return value.toLowerCase();
  };

  const renderGalleryIndex = () => {
    const categoryMasonry = document.getElementById("categoryMasonry");
    if (!categoryMasonry) {
      return;
    }

    categoryMasonry.innerHTML = getCategoryCards()
      .map(
        (category) => `
          <a class="category-card reveal" href="/category/?category=${encodeURIComponent(category.slug)}" aria-label="View ${escapeHtml(category.title)} category">
            <span class="gallery-panel-media">
              <img src="${escapeHtml(category.cover)}" alt="${escapeHtml(category.title)} category preview" loading="lazy" decoding="async" />
              <span class="gallery-panel-shade" aria-hidden="true"></span>
            </span>
            <span class="gallery-panel-copy">
              <span class="gallery-panel-topline">
                <em>${escapeHtml(category.chip)}</em>
                <span>${escapeHtml(String(category.count).padStart(2, "0"))} Projects</span>
              </span>
              <span class="gallery-panel-rule" aria-hidden="true"></span>
              <strong>${escapeHtml(category.title)}</strong>
              <small>${escapeHtml(getCategorySummary(category.slug))}</small>
            </span>
          </a>
        `
      )
      .join("");

    revealItems([...categoryMasonry.querySelectorAll(".reveal")]);
    requestAnimationFrame(() => applyGalleryCardMasonryLayout(categoryMasonry));
    initCardTilt(categoryMasonry);
  };

  const renderCategoryProjects = () => {
    const projectGrid = document.getElementById("projectCardGrid");
    const title = document.getElementById("projectListTitle");
    const eyebrow = document.getElementById("categoryEyebrow");
    if (!projectGrid || !title) {
      return;
    }

    state.activeCategory = getCategoryFromUrl();
    const selectedCategory = state.categories.find((item) => String(item.slug || "").toLowerCase() === state.activeCategory);
    const isAll = state.activeCategory === "all";
    const heading = isAll ? "View All" : (selectedCategory?.title || slugToTitle(state.activeCategory));

    if (eyebrow) {
      eyebrow.textContent = isAll ? "All Categories" : "Category";
    }
    title.textContent = heading;
    document.title = `${heading} | C Celluloids`;

    const visibleProjects = state.projects.filter(
      (project) => state.activeCategory === "all" || String(project.category || "").toLowerCase() === state.activeCategory
    );

    projectGrid.innerHTML = visibleProjects.length
      ? visibleProjects
          .map((project) => `
            <article class="project-card reveal" data-project-id="${escapeHtml(project.id)}">
              <button class="project-card-trigger" type="button" aria-label="Open ${escapeHtml(project.title)} project">
                <span class="gallery-panel-media">
                  <img src="${escapeHtml(toRootUrl(project.cover))}" alt="${escapeHtml(project.title)} cover image" loading="lazy" decoding="async" fetchpriority="low" />
                  <span class="gallery-panel-shade" aria-hidden="true"></span>
                </span>
                <span class="gallery-panel-copy">
                  <span class="gallery-panel-topline">
                    <em>${escapeHtml(project.client || project.brand_model || project.chip || slugToTitle(project.category))}</em>
                    <span>${escapeHtml(project.date || "")}</span>
                  </span>
                  <span class="gallery-panel-rule" aria-hidden="true"></span>
                  <strong>${escapeHtml(project.title)}</strong>
                  <small>${escapeHtml(project.description || project.project || "")}</small>
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
      ...projectGrid.querySelectorAll(".reveal"),
    ]);
    applyProjectCardOrientations(projectGrid);
    requestAnimationFrame(() => applyGalleryCardMasonryLayout(projectGrid));
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
        const orientationClass = item.type === "video"
          ? "media-landscape"
          : "media-image";
        if (item.type === "video") {
          return `
            <button class="gallery-media ${orientationClass}" type="button" data-type="video" data-src="${escapeHtml(toRootUrl(item.src))}" data-title="${escapeHtml(project.title)}" data-desc="${escapeHtml(project.description || "")}">
              <video src="${escapeHtml(toRootUrl(item.src))}" muted playsinline preload="metadata" aria-label="${escapeHtml(label)}"></video>
            </button>
          `;
        }

        return `
          <button class="gallery-media ${orientationClass}" type="button" data-type="image" data-src="${escapeHtml(toRootUrl(item.src))}" data-title="${escapeHtml(project.title)}" data-desc="${escapeHtml(project.description || "")}">
            <img src="${escapeHtml(toRootUrl(item.src))}" alt="${escapeHtml(label)}" loading="lazy" decoding="async" fetchpriority="low" />
          </button>
        `;
      })
      .join("");
  };

  const applyStoryMasonryLayout = () => {
    const masonry = document.querySelector(".story-masonry");
    if (!masonry) {
      return;
    }

    const masonryStyles = window.getComputedStyle(masonry);
    const rowHeight = parseFloat(masonryStyles.getPropertyValue("grid-auto-rows")) || 12;
    const gap = parseFloat(masonryStyles.getPropertyValue("gap")) || 16;
    const columns = masonryStyles.gridTemplateColumns.split(" ").length || 3;
    const columnWidth = (masonry.clientWidth - gap * (columns - 1)) / columns;

    masonry.querySelectorAll(".gallery-media").forEach((item) => {
      const media = item.querySelector("img, video");
      if (!media) {
        return;
      }

      const setShape = (width, height) => {
        if (!width || !height) {
          return;
        }

        const ratio = width / height;
        let shape = "square";

        if (ratio >= 1.22) {
          shape = "landscape";
        } else if (ratio <= 0.84) {
          shape = "portrait";
        }

        const renderedHeight = columnWidth / ratio;
        const span = Math.max(12, Math.round((renderedHeight + gap) / (rowHeight + gap)));

        item.style.setProperty("--media-span", String(span));
        item.style.setProperty("--media-height", `${renderedHeight}px`);
        item.style.setProperty("--media-ratio", `${width} / ${height}`);
        item.dataset.shape = shape;
      };

      if (media.tagName === "VIDEO") {
        const applyVideo = () => setShape(media.videoWidth || 16, media.videoHeight || 9);
        if (media.readyState >= 1) {
          applyVideo();
        } else {
          media.addEventListener("loadedmetadata", applyVideo, { once: true });
        }
        return;
      }

      const applyImage = () => setShape(media.naturalWidth, media.naturalHeight);
      if (media.complete && media.naturalWidth) {
        applyImage();
      } else {
        media.addEventListener("load", applyImage, { once: true });
      }
    });
  };

  const updateStoryProgress = () => {
    const story = document.getElementById("projectStory");
    if (!story) {
      return;
    }

    story.style.setProperty("--story-progress", "1");
    story.style.setProperty("--story-ui", "1");
    story.style.setProperty("--story-title-ui", "1");
    story.style.setProperty("--story-info-ui", "1");
    story.classList.add("ui-visible");
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
    cover.src = toRootUrl(project.cover);
    cover.alt = `${project.title} cover image`;
    stickyTitle.textContent = project.title;
    title.textContent = project.title;
    galleryTitle.textContent = project.title;
    description.textContent = project.description || "";

    meta.innerHTML = getProjectDetailLines(project)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");

    renderStoryMedia(project);
    applyStoryMasonryLayout();

    story.classList.add("open");
    story.setAttribute("aria-hidden", "false");
    document.body.classList.add("story-open");
    scrollWrap.scrollTop = 0;
    updateStoryProgress();
    requestAnimationFrame(() => applyStoryMasonryLayout());
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
    if (!story || !scrollWrap) {
      return;
    }

    scrollWrap.addEventListener("scroll", updateStoryProgress, { passive: true });
    window.addEventListener("resize", () => {
      updateStoryProgress();
      applyGalleryCardMasonryLayout();
      applyStoryMasonryLayout();
    });
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
    closeLightbox = close;

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
    if (categoryMasonry) {
      categoryMasonry.innerHTML = `
        <div class="gallery-empty reveal visible">
          <p>${escapeHtml(message)}</p>
        </div>
      `;
    }
    if (projectGrid) {
      projectGrid.innerHTML = `
        <div class="gallery-empty reveal visible">
          <p>Create folders in assets/projects and run the sync script to populate this gallery.</p>
        </div>
      `;
    }
    if (title) {
      title.textContent = "No Projects Yet";
    }
  };

  const renderFeaturedProjects = (projects) => {
    const grid = document.getElementById("featuredProjectsGrid");
    if (!grid) {
      return;
    }

    const featuredProjects = projects.filter((project) => project.featured === true).slice(0, 3);
    if (!featuredProjects.length) {
      return;
    }

    grid.innerHTML = featuredProjects
      .map((project) => `
        <article class="work-card project-teaser reveal">
          <a href="/category/?category=${encodeURIComponent(project.category || "all")}" class="teaser-media">
            <img src="${escapeHtml(toRootUrl(project.cover))}" alt="${escapeHtml(project.title)} cover image" loading="lazy" decoding="async" />
            <span class="teaser-corners" aria-hidden="true"></span>
          </a>
          <div class="teaser-meta">
            <h3>${escapeHtml(project.title)}</h3>
            <span class="tag-pill">${escapeHtml(project.category || project.chip || "Project")}</span>
          </div>
        </article>
      `)
      .join("");

    revealItems([...grid.querySelectorAll(".reveal")]);
  };

  const initFeaturedProjects = async () => {
    const grid = document.getElementById("featuredProjectsGrid");
    if (!grid) {
      return;
    }

    try {
      const response = await fetch("/assets/projects/projects.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load projects.json (${response.status})`);
      }

      const payload = await response.json();
      const projects = (Array.isArray(payload.projects) ? payload.projects : []).map((project) => ({
        ...project,
        title: project.title || slugToTitle(project.id?.split("/").pop() || ""),
      }));
      renderFeaturedProjects(projects);
    } catch (error) {
      console.error(error);
    }
  };

  const initTrustedLogoGrid = () => {
    document.querySelectorAll(".logo-grid[data-staggered]").forEach((grid) => {
      if (grid.dataset.enhanced === "true") {
        return;
      }

      const logos = [...grid.querySelectorAll("img")].map((img) => img.cloneNode(true));
      grid.innerHTML = "";

      let cursor = 0;
      let rowIndex = 0;
      while (cursor < logos.length) {
        const count = rowIndex % 2 === 0 ? 4 : 3;
        const row = document.createElement("div");
        row.className = "logo-row";
        row.dataset.count = String(count);

        logos.slice(cursor, cursor + count).forEach((img) => {
          const item = document.createElement("div");
          item.className = "logo-item";
          item.appendChild(img);
          row.appendChild(item);
        });

        grid.appendChild(row);
        cursor += count;
        rowIndex += 1;
      }

      grid.dataset.enhanced = "true";
    });
  };

  const initGalleryData = async () => {
    const isGalleryIndex = document.body.classList.contains("page-gallery");
    const isCategoryPage = document.body.classList.contains("page-category");
    if (!isGalleryIndex && !isCategoryPage) {
      return;
    }

    try {
      const response = await fetch("/assets/projects/projects.json", { cache: "no-store" });
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

      if (isGalleryIndex) {
        renderGalleryIndex();
      } else {
        renderCategoryProjects();
      }
    } catch (error) {
      renderGalleryEmptyState("Gallery data is not available yet.");
      console.error(error);
    }
  };

  ready(() => {
    if (initCleanUrlRedirect()) {
      return;
    }
    initLoader();
    initActiveNav();
    initUniversalBack();
    initScrollTop();
    initReveal();
    initCardTilt();
    initProjectStory();
    initLightbox();
    initTrustedLogoGrid();
    initFeaturedProjects();
    initGalleryData();
  });
})();
