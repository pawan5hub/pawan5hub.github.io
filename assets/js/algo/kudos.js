import { HideComponent } from "../hide-component.js";

class Kudos extends HideComponent {
  constructor() {
    super({ currentPath: "/kudos" });
  }

  async init() {
    await this.loadAchievements();
  }

  async loadAchievements() {
    const data = await window.App.modules.apiClient.loadJSON("/data/achievements.json");
    if (!data) return;
    const container = document.querySelector("[data-achievements]");

    if (container) {
      container.innerHTML = "";
      data.forEach((achievement, index, list) => {
        const animationClass = index === 0 ? "fade-left" : index === list.length - 1 ? "fade-right" : "zoom";
        const card = window.App.modules.util.createElement("div", `achievement-item glass-card ${animationClass}`);
        const icon = window.App.modules.util.createElement("span", "achievement-icon", achievement.icon);
        const title = window.App.modules.util.createElement("h3", "achievement-title", achievement.title);
        const description = window.App.modules.util.createElement("p", "achievement-description", achievement.description);

        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(description);
        container.appendChild(card);
      });
    }
    this.manageDOM();
  }

  cleanup() {
    const container = document.querySelector("[data-achievements]");
    if (container) container.innerHTML = "";
  }
}

function initKudos() {
  if (window.App?.modules?.kudos) {
    window.App.modules.kudos.cleanup?.();
  }
  const kudosModule = new Kudos();
  window.App.register("kudos", kudosModule, 'initKudos');
  kudosModule.init();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initKudos);
} else {
  initKudos();
}

export { Kudos, initKudos };
