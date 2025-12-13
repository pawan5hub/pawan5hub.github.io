(function () {
  "use strict";

  function getInitFunctionName(filename) {
    const nameWithoutExt = filename.replace(".js", "");
    const camelCase = nameWithoutExt
      .split(/[-_]/)
      .map((word, index) => {
        if (index === 0) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join("");

    return "init" + camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  window.App = {
    modules: {},
    initializedModules: new Set(),
    register(name, module, moduleInitializer = "") {
      if (this.modules[name]) {
        console.warn(`Module ${name} already exists, replacing...`);
        // Cleanup old module if it exists
        if (this.modules[name].cleanup) {
          this.modules[name].cleanup();
        }
      }
      this.modules[name] = module;
      if (moduleInitializer != "") this.initializedModules.add(moduleInitializer);
      console.log(`✓ Module registered: ${name}`);
    },

    get(name) {
      if (!this.modules[name]) {
        console.warn(`Module ${name} not found`);
      }
      return this.modules[name];
    },

    clear() {
      this.reset();
      this.modules = {};
    },

    reset() {
      Object.keys(this.modules).forEach((name) => {
        if (this.modules[name].cleanup) {
          this.modules[name].cleanup();
          console.log(`X ${ name } clean up`);
        }
      });
      this.modules = {};
      this.initializedModules.clear();
      console.log("✓ All modules reset");
    },

    async initModuleFile() {
      const moduleScripts = document.querySelectorAll('script[type="module"]');
      const results = { initialized: 0, skipped: 0, failed: 0 };
      for (const script of moduleScripts) {
        if (!script.src) continue;

        try {
          const url = new URL(script.src, window.location.href);
          const pathname = url.pathname;
          const filename = pathname.substring(pathname.lastIndexOf("/") + 1);

          console.log(`\n📦︎ Processing: ${filename}`);

          // Add cache busting
          //url.searchParams.set("t", Date.now());

          // Import module
          const module = await import(url.toString());

          // Get all actual exports (excluding Symbol properties)
          const exports = Object.keys(module);
          console.log(`   Exports found: ${exports.join(", ")}`);

          // Generate expected init function name
          const initFunctionName = getInitFunctionName(filename);
          console.log(`   Looking for: ${initFunctionName}`);
          if (this.initializedModules.has(initFunctionName)) {
            console.log(`   ⏭️ Already initialized (global tracker) ${initFunctionName}`);
            results.skipped++;
            continue;
          }
          // Try to get the init function
          const initFunction = module[initFunctionName];

          if (initFunction) {
            if (typeof initFunction === "function") {
              console.log(`   ✅ Calling ${initFunctionName}()`);
              await initFunction();
              this.initializedModules.add(initFunctionName);
              results.initialized++;
            } else {
              console.error(`   ❌ ${initFunctionName} exists but is not a function (type: ${typeof initFunction})`);
              results.failed++;
            }
          } else {
            console.error(`   ❌ ${initFunctionName} No init function found`);
            results.failed++;
          }
        } catch (error) {
          console.error(`❌ Error loading ${script.src}:`, error);
          results.failed++;
        }
      }
      console.log(`✅ Initialized: ${results.initialized}`);
      console.log(`⏭️ Skipped: ${results.skipped}`);
      console.log(`❌ Failed: ${results.failed}`);
    },
  };
})();
