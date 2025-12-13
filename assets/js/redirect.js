class Redirect {
  constructor() {}

  async init() {
    const theme = localStorage.getItem("layout") || "nexa";
    await this.applyTemplate(`${(window.location, origin)}/blogs/${theme}.html`);
  }

  async fallBack() {
    fetch(`${window.location.origin}/404.html`)
      .then((response) => {
        if (!response.ok) throw new Error("Page not found");
        return response.text();
      })
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        doc.documentElement.querySelectorAll("head script").forEach((s) => s.remove());
        const root404 = doc.documentElement.querySelector("[data-error-page]");
        if (root404) root404.style.display = "flex";
        html = doc.documentElement.outerHTML;
        document.open();
        document.write(html);
        document.close();
      })
      .catch((error) => {
        console.error("Error loading theme:", error);
        document.body.innerHTML = "<h1>Page not found</h1>";
      });
  }

  async applyTemplate(templateFile) {
    

    fetch(templateFile)
      .then((response) => {
        if (!response.ok) this.fallBack();
        return response.text();
      })
      .then((html) => {
        const parser = new DOMParser();
        const layout = parser.parseFromString(html, "text/html");
        const layoutTarget = layout.querySelector("[data-main-content]");
        const currentContent = document.querySelector("[data-layout-content]");
        if (!layoutTarget && !currentContent) throw new Error("Cannot find page");
        layoutTarget.innerHTML = currentContent.innerHTML;
        if (layout?.body) {
          layout.body.style.opacity = "0";
        }
        html = layout.documentElement.outerHTML;
        document.open();
        document.write(html);
        document.close();
        setTimeout(() => {
          if (document?.body) {
            document.body.removeAttribute("style");
          }
        }, 1000);
      })
      .catch((error) => {
        this.fallBack();
      });
  }
}

function initRedirect() {
  if (window.App?.modules?.redirect) {
    window.App.modules.redirect.cleanup?.();
  }
  const redirectModule = new Redirect();
  window.App.register("redirect", redirectModule, "initRedirect");
  redirectModule.init();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRedirect);
} else {
  initRedirect();
}

export { Redirect, initRedirect };
