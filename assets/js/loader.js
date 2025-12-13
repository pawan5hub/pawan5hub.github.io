class LoaderManager {
  constructor(loaderSelector = "[data-app-loader]") {
    this.activeRequests = 0;
    this.isLoaderOn = false;
    this.loader = null;
    this.loaderSelector = loaderSelector;
    this.originalFetch = null;
    this.trackedResources = new Set();
    this.mutationObservers = [];
  }

  init() {
    this.loader = document.querySelector(this.loaderSelector);

    if (!this.loader) {
      console.warn("⚠︎ Loader element not found:", this.loaderSelector);
      return;
    }

    // Only show loader if page is still loading
    if (document.readyState === "loading") {
      this.show();
      const loadHandler = () => {

        this.reset();
      };
      window.addEventListener("load", loadHandler, { once: true });
    }

    this.interceptFetch();
    this.interceptImages();
    this.interceptCSS();
    this.interceptScripts();
  }

  show() {
    if (this.loader && !this.isLoaderOn) {
      this.loader.style.display = "flex";
      this.isLoaderOn = true;

    }
  }

  hide() {
    if (this.loader && this.isLoaderOn && this.activeRequests === 0) {
      this.loader.style.display = "none";
      this.isLoaderOn = false;

    }
  }

  increment() {
    this.activeRequests++;
    this.show();

  }

  decrement() {
    this.activeRequests--;
    if (this.activeRequests < 0) {
      console.warn("⚠︎ Active requests went negative, resetting to 0");
      this.activeRequests = 0;
    }

    this.hide();
  }

  interceptFetch() {
    this.originalFetch = window.fetch;
    const self = this;

    window.fetch = function (...args) {
      const url = args[0];

      // Skip if it's from loadJSON (already tracked via APIClient)
      if (typeof url === "string" && window.APP_BASEURL && url.includes(window.APP_BASEURL)) {
        return self.originalFetch.apply(this, args);
      }

      self.increment();


      return self.originalFetch
        .apply(this, args)
        .then((response) => {

          self.decrement();
          return response;
        })
        .catch((error) => {
          console.error("❌ External fetch failed:", url, error);
          self.decrement();
          throw error;
        });
    };
  }

  interceptImages() {
    const self = this;

    // ONLY track dynamically added images
    const originalSetAttribute = HTMLImageElement.prototype.setAttribute;
    HTMLImageElement.prototype.setAttribute = function (name, value) {
      if (name === "src" && value && !self.trackedResources.has(value)) {
        self.trackedResources.add(value);
        self.increment();


        this.addEventListener(
          "load",
          () => {

            self.decrement();
          },
          { once: true }
        );

        this.addEventListener(
          "error",
          () => {
            console.error("❌ Image failed:", value);
            self.decrement();
          },
          { once: true }
        );
      }

      return originalSetAttribute.call(this, name, value);
    };
  }

  interceptCSS() {
    const self = this;

    // ONLY track dynamically added stylesheets
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === "LINK" && (node.rel === "stylesheet" || (node.rel === "preload" && node.as === "style"))) {
            const href = node.href;

            if (!self.trackedResources.has(href)) {
              self.trackedResources.add(href);
              self.increment();


              node.addEventListener(
                "load",
                () => {

                  self.decrement();
                },
                { once: true }
              );

              node.addEventListener(
                "error",
                () => {
                  console.error("❌ CSS failed:", href);
                  self.decrement();
                },
                { once: true }
              );
            }
          }
        });
      });
    });

    observer.observe(document.head, { childList: true, subtree: true });
    this.mutationObservers.push(observer);
  }

  interceptScripts() {
    const self = this;

    // ONLY track dynamically added scripts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === "SCRIPT" && node.src) {
            const src = node.src;

            if (!self.trackedResources.has(src)) {
              self.trackedResources.add(src);
              self.increment();


              node.addEventListener(
                "load",
                () => {

                  self.decrement();
                },
                { once: true }
              );

              node.addEventListener(
                "error",
                () => {
                  console.error("❌ Script failed:", src);
                  self.decrement();
                },
                { once: true }
              );
            }
          }
        });
      });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    this.mutationObservers.push(observer);
  }

  reset() {

    this.activeRequests = 0;
    this.trackedResources.clear();
    this.hide();
  }

  cleanup() {
    // Restore original fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }

    // Disconnect all observers
    this.mutationObservers.forEach((observer) => observer.disconnect());
    this.mutationObservers = [];

    // Reset state
    this.reset();
    this.loader = null;
  }
}

class APIClient {
  constructor(baseURL = "", loaderManager = null) {
    this.cachedData = new Map();
    this.pendingRequests = new Map();
    this.baseURL = baseURL || window.APP_BASEURL || "";
    this.loaderManager = loaderManager;
  }

  async loadJSON(url, header = null) {
    const fullURL = url.includes("http") ? url : `${this.baseURL}${url}`;

    if (this.cachedData.has(fullURL)) {

      return this.cachedData.get(fullURL);
    }

    if (this.pendingRequests.has(fullURL)) {

      return this.pendingRequests.get(fullURL);
    }

    if (this.loaderManager) {
      this.loaderManager.increment();
    }

    const requestPromise = (async () => {
      try {

        const response = header ? await fetch(fullURL, header) : await fetch(fullURL);

        if (!response.ok) {
          throw new Error(`Failed to load ${fullURL}: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();


        this.cachedData.set(fullURL, data);
        return data;
      } catch (error) {
        console.error("❌ Error loading JSON:", error);
        throw error;
      } finally {
        this.pendingRequests.delete(fullURL);

        if (this.loaderManager) {
          this.loaderManager.decrement();
        }
      }
    })();

    this.pendingRequests.set(fullURL, requestPromise);
    return requestPromise;
  }

  async loadText(url, header = null) {
    const fullURL = url.includes("http") ? url : `${this.baseURL}${url}`;

    if (this.loaderManager) {
      this.loaderManager.increment();
    }

    try {
      const response = header ? await fetch(fullURL, header) : await fetch(fullURL);

      if (!response.ok) {
        throw new Error(`Failed to load ${fullURL}: ${response.status}`);
      }

      const text = await response.text();

      if (this.loaderManager) {
        this.loaderManager.decrement();
      }

      return text;
    } catch (error) {
      console.error("❌ Error loading text:", error);

      if (this.loaderManager) {
        this.loaderManager.decrement();
      }

      return null;
    }
  }

  async post(url, data, header = null) {
    const fullURL = url.includes("http") ? url : `${this.baseURL}${url}`;

    if (this.loaderManager) {
      this.loaderManager.increment();
    }

    try {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(header || {}),
        },
        body: JSON.stringify(data),
      };

      const response = await fetch(fullURL, options);

      if (!response.ok) {
        throw new Error(`POST failed ${fullURL}: ${response.status}`);
      }

      const result = await response.json();

      if (this.loaderManager) {
        this.loaderManager.decrement();
      }

      return result;
    } catch (error) {
      console.error("❌ Error posting data:", error);

      if (this.loaderManager) {
        this.loaderManager.decrement();
      }

      return null;
    }
  }

  clearCache(url = null) {
    if (url) {
      const fullURL = url.includes("http") ? url : `${this.baseURL}${url}`;
      this.cachedData.delete(fullURL);
    } else {
      this.cachedData.clear();
    }
  }

  getCacheSize() {
    return this.cachedData.size;
  }

  cleanup() {
    this.cachedData.clear();
    this.pendingRequests.clear();
  }
}

function initLoader(loaderSelector = "[data-app-loader]") {
  if (window.App?.modules?.loader) {
    window.App.modules.loader.cleanup?.();
  }
  const loaderModule = new LoaderManager(loaderSelector);
  if (window.App?.modules?.apiClient) {
    window.App.modules.apiClient.cleanup?.();
  }
  const apiClient = new APIClient(window.APP_BASEURL || "", loaderModule);
  window.App.register("layout", loaderModule);
  window.App.register("apiClient", apiClient, 'initLoader');
  loaderModule.init();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLoader);
} else {
  initLoader();
}

export { LoaderManager, APIClient, initLoader };
