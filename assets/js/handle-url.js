import { Observable } from "./observable.js";
const handleURLEvent = new Observable();

class HandleUrl {
  constructor() {
    this.decodedParams = {};
    this.init();
  }

  decodeBase64Url(token) {
    try {
      let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }
      const decoded = atob(base64);
      const params = {};
      decoded.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
      return params;
    } catch (error) {
      console.error("Failed to decode base64:", error);
      return {};
    }
  }

  isBase64Url(str) {
    return /^[A-Za-z0-9\-_]+$/.test(str) && str.length > 20;
  }

  init() {
    this.handleURLParams();
    window.addEventListener("hashchange", () => this.handleURLParams());
  }

  handleURLParams() {
    const { params, isHashURL, pathPart } = this.parseURL();
    if (!params) {
      return;
    } else if (params.has("b")) {
      const b64Token = params.get("b");
      if (this.isBase64Url(b64Token)) {
        this.decodedParams = this.decodeBase64Url(b64Token);
      }
    }
    let modified = false;
    if (this.decodedParams.has("t") || params.has("t")) {
      handleURLEvent.next({ key: "theme", newValue: (this.decodedParams || params).get("t"), oldValue: localStorage.getItem("theme") });
    }
    if (this.decodedParams.has("s")) {
      handleURLEvent.next({ key: "sysTheme", newValue: (this.decodedParams || params).get("s"), oldValue: localStorage.getItem("sysTheme") });
    }
    if (this.decodedParams.has("l")) {
      handleURLEvent.next({ key: "layout", newValue: (this.decodedParams || params).get("l"), oldValue: localStorage.getItem("layout") });
    }
    if (modified) {
      this.cleanURL(params, isHashURL, pathPart);
    }
  }

  parseURL() {
    const hash = window.location.hash;
    if (hash && hash.includes("?")) {
      const [hashPath, queryString] = hash.split("?");
      return {
        params: new URLSearchParams(queryString),
        isHashURL: true,
        pathPart: hashPath,
      };
    }
    if (window.location.search) {
      return {
        params: new URLSearchParams(window.location.search),
        isHashURL: false,
        pathPart: window.location.pathname,
      };
    }
    return { params: null, isHashURL: false, pathPart: null };
  }

  cleanURL(params, isHashURL, pathPart) {
    const remaining = params.toString();
    if (isHashURL) {
      const newHash = remaining ? `${pathPart}?${remaining}` : pathPart;
      window.history.replaceState(null, "", newHash);
    } else {
      const newURL = remaining ? `${pathPart}?${remaining}${window.location.hash}` : `${pathPart}${window.location.hash}`;
      window.history.replaceState(null, "", newURL);
    }
  }

  cleanup() {
    if (this.hashChangeHandler) {
      window.removeEventListener("hashchange", this.hashChangeHandler);
      this.hashChangeHandler = null;
    }
    this.decodedParams = {};
  }
}

function initHandleUrl() {
  if (window.App?.modules?.handleUrl) {
    window.App.modules.handleUrl.cleanup?.();
  }
  const handledModule = new HandleUrl();
  window.App.register("handleUrl", handledModule, "initHandleUrl");
  handledModule.init();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHandleUrl);
} else {
  initHandleUrl();
}

export { HandleUrl, initHandleUrl, handleURLEvent };
