class CommonUtilities {
  constructor() {
    this.mobileMenuToggle = null;
    this.siteNav = null;
    this.scrollRevealObserver = null;
    this.scrollTimeout = null;
    this.scrollHandler = null;
    this.headerScrollHandler = null;
    this.mobileMenuClickHandler = null;
    this.documentClickHandler = null;
  }

  init() {
    this.setup();
  }

  setup() {
    this.setupMobileMenu();
    this.initScrollReveal();
    this.setupHeaderScroll();
  }

  createElement(tag, className, content) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content) {
      if (typeof content === "string") {
        el.textContent = content;
      } else {
        el.appendChild(content);
      }
    }
    return el;
  }

  debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        clearTimeout(timeout);
        func(...args);
      }, wait);
    };
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  smoothScroll(target) {
    const itemHash = target.includes("#") ? "#" + target.split("#")[1] : null;
    if (!itemHash) return;

    const el = document.querySelector(itemHash);
    if (el) {
      const headerOffset = 80;
      const elementPosition = el?.offsetTop || el?.offsetParent?.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }

  // setupMobileMenu() {
  //   this.mobileMenuToggle = document.querySelector("[mobile-menu-toggle]");
  //   this.siteNav = document.querySelector("[data-nav]");

  //   if (!this.mobileMenuToggle || !this.siteNav) return;

  //   this.mobileMenuClickHandler = () => {
  //     this.siteNav.classList.toggle("active");
  //   };

  //   this.documentClickHandler = (e) => {
  //     if (!this.mobileMenuToggle.contains(e.target) && !this.siteNav.contains(e.target)) {
  //       this.siteNav.classList.remove("active");
  //     }
  //   };

  //   this.mobileMenuToggle.addEventListener("click", this.mobileMenuClickHandler);
  //   document.addEventListener("click", this.documentClickHandler);
  // }

  setupMobileMenu() {
    this.mobileMenuToggle = document.querySelector("[mobile-menu-toggle]");
    this.siteNav = document.querySelector("[data-nav]");

    // Check if mobile menu toggle doesn't exist, create mobile sidebar controls
    if (!this.mobileMenuToggle) {
      this.createMobileSidebarControls();
      return;
    }

    if (!this.siteNav) return;

    this.mobileMenuClickHandler = () => {
      this.siteNav.classList.toggle("active");
    };

    this.documentClickHandler = (e) => {
      if (!this.mobileMenuToggle.contains(e.target) && !this.siteNav.contains(e.target)) {
        this.siteNav.classList.remove("active");
      }
    };

    this.mobileMenuToggle.addEventListener("click", this.mobileMenuClickHandler);
    document.addEventListener("click", this.documentClickHandler);
  }

  createMobileSidebarControls() {
    // Check if controls already exist
    if (document.querySelector(".mobile-sidebar-controls")) return;

    // Create header element
    const header = this.createElement("div", "mobile-sidebar-controls");

    // Create left sidebar button
    const leftBtn = this.createElement("button", "mobile-sidebar-btn", "👤︎ℹ︎");
    // Create right sidebar button
    const rightBtn = this.createElement("button", "mobile-sidebar-btn", "≣");

    // Append buttons to header
    header.appendChild(leftBtn);
    header.appendChild(rightBtn);

    // Create overlay backdrop
    const overlay = this.createElement("div");
    overlay.className = "sidebar-overlay";

    // Insert header and overlay at the beginning of body
    document.body.insertBefore(header, document.body.firstChild);
    document.body.insertBefore(overlay, document.body.firstChild);
  // Move network dropdown from nav-container to status-bar on mobile
  this.moveNetworkDropdownToStatusBar();

    // Get sidebar elements
    const leftSidebar = document.querySelector(".left-sidebar-card");
    const rightSidebar = document.querySelector(".right-sidebar-card");

    if (!leftSidebar || !rightSidebar) return;

    // Store references
    this.leftSidebarBtn = leftBtn;
    this.rightSidebarBtn = rightBtn;
    this.leftSidebar = leftSidebar;
    this.rightSidebar = rightSidebar;
    this.sidebarOverlay = overlay;

    // Setup event listeners
    this.setupSidebarToggleListeners();
  }

  setupSidebarToggleListeners() {
    // Left sidebar toggle
    this.leftSidebarBtn.addEventListener("click", () => {
      const isActive = this.leftSidebar.classList.contains("active");

      // Close right sidebar if open
      this.rightSidebar.classList.remove("active");
      this.rightSidebarBtn.classList.remove("active");

      // Toggle left sidebar
      this.leftSidebar.classList.toggle("active");
      this.leftSidebarBtn.classList.toggle("active");

      // Toggle overlay
      if (!isActive) {
        this.sidebarOverlay.classList.add("active");
      } else {
        this.sidebarOverlay.classList.remove("active");
      }
    });

    // Right sidebar toggle
    this.rightSidebarBtn.addEventListener("click", () => {
      const isActive = this.rightSidebar.classList.contains("active");

      // Close left sidebar if open
      this.leftSidebar.classList.remove("active");
      this.leftSidebarBtn.classList.remove("active");

      // Toggle right sidebar
      this.rightSidebar.classList.toggle("active");
      this.rightSidebarBtn.classList.toggle("active");

      // Toggle overlay
      if (!isActive) {
        this.sidebarOverlay.classList.add("active");
      } else {
        this.sidebarOverlay.classList.remove("active");
      }
    });

    // Close sidebars when clicking overlay
    this.sidebarOverlay.addEventListener("click", () => {
      this.leftSidebar.classList.remove("active");
      this.rightSidebar.classList.remove("active");
      this.leftSidebarBtn.classList.remove("active");
      this.rightSidebarBtn.classList.remove("active");
      this.sidebarOverlay.classList.remove("active");
    });

    // Close sidebars on ESC key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.leftSidebar.classList.remove("active");
        this.rightSidebar.classList.remove("active");
        this.leftSidebarBtn.classList.remove("active");
        this.rightSidebarBtn.classList.remove("active");
        this.sidebarOverlay.classList.remove("active");
      }
    });
  }

  moveNetworkDropdownToStatusBar() {
    if (window.innerWidth > 768) return;

    // Find network submenu item in nav-container
    const navContainer = document.querySelector(".nav-container");
    const networkSubmenu = navContainer?.querySelector("[data-submenu-item]");

    if (!networkSubmenu) return;

    // Find status bar
    const statusBar = document.querySelector(".page-container");
    if (!statusBar) return;

    // Move the entire submenu item to status bar right section
    //const statusBarRight = statusBar.querySelector(".status-bar-right");
    //if (statusBarRight) {
      // Clone or move the element
      statusBar.appendChild(networkSubmenu);
    //}
  }

  initScrollReveal() {
    const revealElements = document.querySelectorAll(".reveal");
    if (revealElements.length === 0) return;

    let lastScrollTop = 0;
    const isMobile = window.innerWidth <= 768;

    const config = {
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      rootMargin: isMobile ? "0px 0px -50px 0px" : "-80px 0px 0px 0px",
    };

    const revealedMap = new Map();

    const getElementIndex = (element) => {
      return Array.from(revealElements).indexOf(element);
    };

    const resetAllAnimations = () => {
      revealElements.forEach((el) => el.classList.remove("visible"));
      revealedMap.clear();
    };

    const showFirstElement = () => {
      if (revealElements.length > 0) {
        requestAnimationFrame(() => {
          revealElements[0].classList.add("visible");
          revealedMap.set(revealElements[0], 0);
        });
      }
    };

    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const topThreshold = isMobile ? 10 : 50;

      if (currentScrollTop < topThreshold && lastScrollTop >= topThreshold) {
        resetAllAnimations();
        showFirstElement();
      }

      lastScrollTop = currentScrollTop;
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        const elementIndex = getElementIndex(entry.target);

        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealedMap.set(entry.target, elementIndex);

          revealedMap.forEach((index, element) => {
            if (Math.abs(index - elementIndex) > 1) {
              element.classList.remove("visible");
              revealedMap.delete(element);
            }
          });
        }
      });
    };

    this.scrollRevealObserver = new IntersectionObserver(observerCallback, config);
    revealElements.forEach((element) => this.scrollRevealObserver.observe(element));

    const initialScroll = window.pageYOffset || document.documentElement.scrollTop;
    if (initialScroll < (isMobile ? 10 : 50)) {
      showFirstElement();
    }

    this.scrollHandler = () => {
      if (this.scrollTimeout) {
        window.cancelAnimationFrame(this.scrollTimeout);
      }
      this.scrollTimeout = window.requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", this.scrollHandler, { passive: true });
  }

  setupHeaderScroll() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    let lastScroll = 0;

    this.headerScrollHandler = () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll <= 0) {
        header.classList.remove("scroll-up");
        return;
      }

      if (currentScroll > lastScroll && !header.classList.contains("scroll-down")) {
        header.classList.remove("scroll-up");
        header.classList.add("scroll-down");
      } else if (currentScroll < lastScroll && header.classList.contains("scroll-down")) {
        header.classList.remove("scroll-down");
        header.classList.add("scroll-up");
      }

      lastScroll = currentScroll;
    };

    window.addEventListener("scroll", this.headerScrollHandler);
  }

  cleanup() {
    // Remove mobile menu listeners
    if (this.mobileMenuToggle && this.mobileMenuClickHandler) {
      this.mobileMenuToggle.removeEventListener("click", this.mobileMenuClickHandler);
    }
    if (this.documentClickHandler) {
      document.removeEventListener("click", this.documentClickHandler);
    }
    const mobileControls = document.querySelector(".mobile-sidebar-controls");
    const overlay = document.querySelector(".sidebar-overlay");
    if (mobileControls) mobileControls.remove();
    if (overlay) overlay.remove();
    // Disconnect scroll reveal observer
    if (this.scrollRevealObserver) {
      this.scrollRevealObserver.disconnect();
    }

    // Remove scroll handlers
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
    }
    if (this.headerScrollHandler) {
      window.removeEventListener("scroll", this.headerScrollHandler);
    }

    // Cancel animation frame
    if (this.scrollTimeout) {
      window.cancelAnimationFrame(this.scrollTimeout);
    }

    // Clear references
    this.mobileMenuToggle = null;
    this.siteNav = null;
    this.scrollRevealObserver = null;
    this.scrollTimeout = null;
  }
}

function initCommon() {
  if (window.App?.modules?.util) {
    window.App.modules.util.cleanup?.();
  }
  const utilModule = new CommonUtilities();
  window.App.register("util", utilModule, "initCommon");
  utilModule.init();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCommon);
} else {
  initCommon();
}

export { CommonUtilities, initCommon };
