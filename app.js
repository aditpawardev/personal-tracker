const STORAGE_KEY = "preptrack-progress-v1";
const THEME_KEY = "preptrack-theme";

const state = {
  data: null,
  sectionId: "aptitude",
  filter: "all",
  search: "",
  progress: loadProgress()
};

const els = {
  sectionNav: document.querySelector("#sectionNav"),
  topicsList: document.querySelector("#topicsList"),
  pageTitle: document.querySelector("#pageTitle"),
  searchInput: document.querySelector("#searchInput"),
  filterTabs: document.querySelector("#filterTabs"),
  overallPercent: document.querySelector("#overallPercent"),
  sectionPercent: document.querySelector("#sectionPercent"),
  completedCount: document.querySelector("#completedCount"),
  totalCount: document.querySelector("#totalCount"),
  progressRing: document.querySelector("#progressRing"),
  completeSectionButton: document.querySelector("#completeSectionButton"),
  resetButton: document.querySelector("#resetButton"),
  resetDialog: document.querySelector("#resetDialog"),
  themeButton: document.querySelector("#themeButton"),
  topThemeButton: document.querySelector("#topThemeButton"),
  menuButton: document.querySelector("#menuButton"),
  sidebar: document.querySelector("#sidebar"),
  sidebarBackdrop: document.querySelector("#sidebarBackdrop"),
  toast: document.querySelector("#toast")
};

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  const saved = document.querySelector("#savedState");
  saved.classList.add("flash");
  window.clearTimeout(saveProgress.timer);
  saveProgress.timer = window.setTimeout(() => saved.classList.remove("flash"), 1000);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function topicStats(topic) {
  const completed = topic.subtopics.filter(subtopic => state.progress[subtopic.id]).length;
  return {
    completed,
    total: topic.subtopics.length,
    percent: topic.subtopics.length ? Math.round(completed / topic.subtopics.length * 100) : 0
  };
}

function sectionStats(section) {
  let completed = 0;
  let total = 0;
  section.topics.forEach(topic => {
    const stats = topicStats(topic);
    completed += stats.completed;
    total += stats.total;
  });
  return { completed, total, percent: total ? Math.round(completed / total * 100) : 0 };
}

function overallStats() {
  let completed = 0;
  let total = 0;
  state.data.sections.forEach(section => {
    const stats = sectionStats(section);
    completed += stats.completed;
    total += stats.total;
  });
  return { completed, total, percent: total ? Math.round(completed / total * 100) : 0 };
}

function renderNavigation() {
  els.sectionNav.innerHTML = state.data.sections.map(section => {
    const stats = sectionStats(section);
    return `
      <button class="section-link ${section.id === state.sectionId ? "active" : ""}" type="button" data-section="${escapeHtml(section.id)}">
        <span class="nav-progress">${stats.percent}%</span>
        <span class="nav-label">${escapeHtml(section.name)}</span>
      </button>
    `;
  }).join("");
}

function matchesFilter(topic) {
  const stats = topicStats(topic);
  if (state.filter === "completed") return stats.completed === stats.total;
  if (state.filter === "in-progress") return stats.completed > 0 && stats.completed < stats.total;
  return true;
}

function matchesSearch(topic) {
  if (!state.search) return true;
  const query = state.search.toLowerCase();
  return topic.name.toLowerCase().includes(query)
    || topic.subtopics.some(subtopic => subtopic.name.toLowerCase().includes(query));
}

function renderTopics() {
  const section = state.data.sections.find(item => item.id === state.sectionId);
  if (!section) return;

  const groups = new Map(section.groups.map(group => [group.id, group]));
  let shownGroupIds = new Set();
  const visibleTopics = section.topics.filter(topic => matchesFilter(topic) && matchesSearch(topic));

  if (!visibleTopics.length) {
    els.topicsList.innerHTML = `<div class="empty-state">No topics match your current filters.</div>`;
    return;
  }

  els.topicsList.innerHTML = visibleTopics.map(topic => {
    const stats = topicStats(topic);
    const topicIndex = section.topics.findIndex(item => item.id === topic.id) + 1;
    let groupMarkup = "";

    if (topic.groupId && !shownGroupIds.has(topic.groupId) && (!state.search && state.filter === "all")) {
      const group = groups.get(topic.groupId);
      if (group) {
        const labels = group.sourceLabels.map(label => `<span class="source-label">${escapeHtml(label)}</span>`).join("");
        const notes = group.notes.map(note => `<div class="topic-note">${escapeHtml(note.text)}</div>`).join("");
        groupMarkup = `<div class="topic-note"><strong>${escapeHtml(group.name)}</strong>${labels}${notes}</div>`;
        shownGroupIds.add(topic.groupId);
      }
    }

    const labels = topic.sourceLabels.map(label => `<span class="source-label">${escapeHtml(label)}</span>`).join("");
    const notes = topic.notes.map(note => `<div class="topic-note">${escapeHtml(note.text)}</div>`).join("");
    const subtopics = topic.subtopics.map(subtopic => `
      <label class="subtopic">
        <input type="checkbox" data-subtopic-id="${escapeHtml(subtopic.id)}" ${state.progress[subtopic.id] ? "checked" : ""}>
        <span class="check-box"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span>
        <span class="subtopic-name">${escapeHtml(subtopic.name)}</span>
      </label>
    `).join("");

    return `${groupMarkup}
      <article class="topic-card ${stats.completed === stats.total ? "open" : ""}" data-topic-id="${escapeHtml(topic.id)}">
        <button class="topic-header" type="button" aria-expanded="${stats.completed === stats.total ? "true" : "false"}">
          <span class="topic-number">${String(topicIndex).padStart(2, "0")}</span>
          <span class="topic-heading">
            <h2>${escapeHtml(topic.name)}${labels}</h2>
            <span class="topic-meta">${stats.completed} of ${stats.total} complete</span>
          </span>
          <span class="topic-progress" aria-label="${stats.percent}% complete"><span style="width:${stats.percent}%"></span></span>
          <svg class="topic-chevron" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg>
        </button>
        <div class="topic-body">
          ${notes}
          <div class="subtopics">${subtopics}</div>
        </div>
      </article>`;
  }).join("");
}

function renderStats() {
  const overall = overallStats();
  const section = state.data.sections.find(item => item.id === state.sectionId);
  const sectionStatsValue = sectionStats(section);
  els.overallPercent.textContent = `${overall.percent}%`;
  els.sectionPercent.textContent = `${sectionStatsValue.percent}%`;
  els.completedCount.textContent = overall.completed;
  els.totalCount.textContent = overall.total;
  els.progressRing.style.setProperty("--progress", overall.percent);
}

function render() {
  const section = state.data.sections.find(item => item.id === state.sectionId);
  els.pageTitle.textContent = section.name;
  renderNavigation();
  renderStats();
  renderTopics();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 1800);
}

els.sectionNav.addEventListener("click", event => {
  const button = event.target.closest("[data-section]");
  if (!button) return;
  state.sectionId = button.dataset.section;
  closeMobileNav();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

els.filterTabs.addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  els.filterTabs.querySelectorAll(".filter-tab").forEach(tab => tab.classList.toggle("active", tab === button));
  renderTopics();
});

els.searchInput.addEventListener("input", event => {
  state.search = event.target.value.trim();
  renderTopics();
});

els.topicsList.addEventListener("click", event => {
  const header = event.target.closest(".topic-header");
  if (!header) return;
  const card = header.closest(".topic-card");
  card.classList.toggle("open");
  header.setAttribute("aria-expanded", card.classList.contains("open"));
});

els.topicsList.addEventListener("change", event => {
  const checkbox = event.target.closest("[data-subtopic-id]");
  if (!checkbox) return;
  state.progress[checkbox.dataset.subtopicId] = checkbox.checked;
  saveProgress();
  render();
});

els.completeSectionButton.addEventListener("click", () => {
  const section = state.data.sections.find(item => item.id === state.sectionId);
  const allComplete = section.topics.every(topic => topicStats(topic).completed === topic.subtopics.length);
  section.topics.forEach(topic => {
    topic.subtopics.forEach(subtopic => {
      state.progress[subtopic.id] = !allComplete;
    });
  });
  saveProgress();
  render();
  showToast(allComplete ? "Section marked incomplete" : "Section completed");
});

els.resetButton.addEventListener("click", () => els.resetDialog.showModal());
els.resetDialog.addEventListener("close", () => {
  if (els.resetDialog.returnValue !== "confirm") return;
  state.progress = {};
  saveProgress();
  render();
  showToast("All progress reset");
});

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
}

els.themeButton.addEventListener("click", toggleTheme);
els.topThemeButton.addEventListener("click", toggleTheme);

function closeMobileNav() {
  els.sidebar.classList.remove("open");
  els.sidebarBackdrop.classList.remove("open");
}

els.menuButton.addEventListener("click", () => {
  els.sidebar.classList.toggle("open");
  els.sidebarBackdrop.classList.toggle("open");
});
els.sidebarBackdrop.addEventListener("click", closeMobileNav);

document.addEventListener("keydown", event => {
  if (event.key === "/" && document.activeElement !== els.searchInput) {
    event.preventDefault();
    els.searchInput.focus();
  }
  if (event.key === "Escape") closeMobileNav();
});

const savedTheme = localStorage.getItem(THEME_KEY);
setTheme(savedTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

fetch("./assets/syllabus.json")
  .then(response => {
    if (!response.ok) throw new Error(`Unable to load syllabus (${response.status})`);
    return response.json();
  })
  .then(data => {
    state.data = data;
    render();
  })
  .catch(error => {
    els.topicsList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}<br>Run a local server before opening the tracker.</div>`;
  });
