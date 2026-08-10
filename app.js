/* ── DATA ────────────────────────────────── */
let data = JSON.parse(localStorage.getItem("planit-data")) || {
  day:   [],
  week:  [],
  month: []
};
let history = JSON.parse(localStorage.getItem("planit-history")) || [];

function save() {
  localStorage.setItem("planit-data",    JSON.stringify(data));
  localStorage.setItem("planit-history", JSON.stringify(history));
}

/* ── CONSTANTS ───────────────────────────── */
const DAYS_IN_MONTH = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
const TODAY         = new Date().toISOString().split("T")[0];

/* ── GREETING ────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 0  && h < 12) return "Good morning ☀️";
  if (h >= 12 && h < 17) return "Good afternoon 🌤";
  if (h >= 17 && h < 21) return "Good evening 🌆";
  return "Good night 🌙";
}

function getMotivation() {
  const h = new Date().getHours();
  if (h >= 0  && h < 12) return "Let's make today count.";
  if (h >= 12 && h < 17) return "Keep pushing, you're doing great.";
  if (h >= 17 && h < 21) return "How's your day going?";
  return "Rest well, tomorrow is a new day.";
}

/* ── NAVIGATION ──────────────────────────── */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page-" + id).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.nav === id);
  });
}

/* ── BOTTOM NAV ──────────────────────────── */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const nav = btn.dataset.nav;
    if (nav === "history") {
      archiveAll();
      renderHistory();
      showPage("history");
    } else {
      archiveAll();
      renderDashboard();
      showPage("home");
    }
  });
});

/* ── BACK BUTTONS ────────────────────────── */
document.querySelectorAll(".back-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    archiveAll();
    renderDashboard();
    showPage("home");
  });
});

/* ── DASHBOARD CARDS ─────────────────────── */
document.querySelectorAll(".glass-card").forEach(card => {
  card.addEventListener("click", () => {
    const period = card.dataset.period;
    cascadeToDay();
    renderPeriodPage(period);
    showPage(period);
  });
});

/* ── THEME ───────────────────────────────── */
function applyThemeIcon() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const icon   = isDark ? "☀️" : "🌙";
  document.querySelectorAll(".theme-btn").forEach(b => b.textContent = icon);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  document.documentElement.setAttribute("data-theme", current === "dark" ? "light" : "dark");
  applyThemeIcon();
}

document.querySelectorAll(".theme-btn").forEach(b => b.addEventListener("click", toggleTheme));

/* ── CASCADE: MONTH → WEEK → DAY ────────── */
function cascadeToDay() {
  // Week tasks → push to day if not already there today
  data.week.forEach(task => {
    if (task.daysTarget <= 0) return;
    const alreadyInDay = data.day.some(d => d.cascadeId === task.id && d.cascadeDate === TODAY);
    if (!alreadyInDay && task.daysCompleted < task.daysTarget) {
      data.day.push({
        id:          Math.floor(Date.now() + Math.random() * 1000),
        text:        task.text,
        hours:       0,
        minutes:     0,
        done:        false,
        createdAt:   TODAY,
        cascadeId:   task.id,
        cascadeDate: TODAY,
        cascadeFrom: "week"
      });
    }
  });

  // Month tasks → push to week if not already there
  data.month.forEach(task => {
    if (task.daysTarget <= 0) return;
    const alreadyInWeek = data.week.some(w => w.cascadeId === task.id);
    if (!alreadyInWeek && task.daysCompleted < task.daysTarget) {
      data.week.push({
        id:           Math.floor(Date.now() + Math.random() * 1000),
        text:         task.text,
        daysTarget:   Math.min(task.daysTarget - task.daysCompleted, 7),
        daysCompleted: 0,
        done:         false,
        createdAt:    TODAY,
        cascadeId:    task.id,
        cascadeFrom:  "month"
      });
    }
  });

  save();
}

/* ── COMPLETE CASCADE CHAIN ──────────────── */
function onDayTaskCompleted(dayTask) {
  if (!dayTask.cascadeId) return;

  // Update week task progress
  const weekTask = data.week.find(w => w.id === dayTask.cascadeId);
  if (weekTask) {
    weekTask.daysCompleted = (weekTask.daysCompleted || 0) + 1;
    if (weekTask.daysCompleted >= weekTask.daysTarget) weekTask.done = true;

    // Update month task progress if week task came from month
    if (weekTask.cascadeId) {
      const monthTask = data.month.find(m => m.id === weekTask.cascadeId);
      if (monthTask) {
        monthTask.daysCompleted = (monthTask.daysCompleted || 0) + 1;
        if (monthTask.daysCompleted >= monthTask.daysTarget) monthTask.done = true;
      }
    }
  }
  save();
}

/* ── RENDER DASHBOARD ────────────────────── */
function renderDashboard() {
  document.getElementById("greeting").textContent  = getGreeting();
  document.getElementById("home-date").textContent = getMotivation();

  // DAY
  const dayMins  = data.day.reduce((s, t) => s + (t.hours || 0) * 60 + (t.minutes || 0), 0);
  const dayPct   = Math.min((dayMins / (24 * 60)) * 100, 100).toFixed(1);
  document.getElementById("day-stats").textContent    = `${data.day.length} task${data.day.length !== 1 ? "s" : ""} · ${fmtTime(dayMins)}`;
  document.getElementById("day-bar").style.width      = dayPct + "%";
  document.getElementById("day-bar-label").textContent = `${fmtTime(dayMins)} of 24h`;

  // WEEK
  const weekDaysUsed = data.week.reduce((s, t) => s + (t.daysTarget || 0), 0);
  const weekPct      = Math.min((weekDaysUsed / 7) * 100, 100).toFixed(1);
  document.getElementById("week-stats").textContent    = `${data.week.length} task${data.week.length !== 1 ? "s" : ""}`;
  document.getElementById("week-bar").style.width      = weekPct + "%";
  document.getElementById("week-bar-label").textContent = `${weekDaysUsed} of 7 days`;

  // MONTH
  const monthDaysUsed = data.month.reduce((s, t) => s + (t.daysTarget || 0), 0);
  const monthPct      = Math.min((monthDaysUsed / DAYS_IN_MONTH) * 100, 100).toFixed(1);
  document.getElementById("month-stats").textContent    = `${data.month.length} task${data.month.length !== 1 ? "s" : ""}`;
  document.getElementById("month-bar").style.width      = monthPct + "%";
  document.getElementById("month-bar-label").textContent = `${monthDaysUsed} of ${DAYS_IN_MONTH} days`;
}

/* ── RENDER PERIOD PAGE ──────────────────── */
function renderPeriodPage(period) {
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (period === "day") {
    document.getElementById("day-page-date").textContent = dateStr;
    const totalMins = data.day.reduce((s, t) => s + (t.hours || 0) * 60 + (t.minutes || 0), 0);
    const pct       = Math.min((totalMins / (24 * 60)) * 100, 100).toFixed(1);
    document.getElementById("day-used").textContent  = fmtTime(totalMins) + " planned";
    document.getElementById("day-fill").style.width  = pct + "%";
    document.getElementById("day-pct").textContent   = `${pct}% of your day planned`;
    renderList("day-list", data.day, period);
  }

  if (period === "week") {
    document.getElementById("week-page-date").textContent = dateStr;
    const daysUsed = data.week.reduce((s, t) => s + (t.daysTarget || 0), 0);
    const pct      = Math.min((daysUsed / 7) * 100, 100).toFixed(1);
    document.getElementById("week-used").textContent  = `${daysUsed} days planned`;
    document.getElementById("week-fill").style.width  = pct + "%";
    document.getElementById("week-pct").textContent   = `${pct}% of your week planned`;
    renderList("week-list", data.week, period);
  }

  if (period === "month") {
    document.getElementById("month-page-date").textContent = dateStr;
    document.getElementById("month-max-label").textContent = `of ${DAYS_IN_MONTH} days`;
    const daysUsed = data.month.reduce((s, t) => s + (t.daysTarget || 0), 0);
    const pct      = Math.min((daysUsed / DAYS_IN_MONTH) * 100, 100).toFixed(1);
    document.getElementById("month-used").textContent  = `${daysUsed} days planned`;
    document.getElementById("month-fill").style.width  = pct + "%";
    document.getElementById("month-pct").textContent   = `${pct}% of your month planned`;
    renderList("month-list", data.month, period);
  }
}

/* ── RENDER LIST ─────────────────────────── */
function renderList(listId, items, period) {
  const ul = document.getElementById(listId);

  if (items.length === 0) {
    ul.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📝</span>
        <p class="empty-text">No tasks yet. Add one above!</p>
      </div>`;
    return;
  }

  const active    = items.filter(t => !t.done);
  const completed = items.filter(t => t.done);

  ul.innerHTML = [...active, ...completed].map(task => {
    const meta = period === "day"
      ? `⏱ ${task.hours || 0}h ${task.minutes || 0}m`
      : period === "week"
        ? `📅 ${task.daysCompleted || 0} / ${task.daysTarget} days done`
        : `📅 ${task.daysCompleted || 0} / ${task.daysTarget} days done`;

    const cascadeTag = task.cascadeFrom
      ? `<span class="task-cascaded">↓ from ${task.cascadeFrom}</span>`
      : "";

    return `
      <li class="task-item ${task.done ? "completed" : ""}" data-id="${task.id}" data-period="${period}">
        <input type="checkbox" ${task.done ? "checked" : ""}>
        <div class="task-info">
          <p class="task-name">${task.text}</p>
          <p class="task-meta">${meta}</p>
          ${cascadeTag}
        </div>
        <button class="task-delete">🗑</button>
      </li>`;
  }).join("");
}

/* ── ADD TASK HANDLERS ───────────────────── */
function setupAddBtn(period) {
  const btn       = document.getElementById(`${period}-add-btn`);
  const textInput = document.getElementById(`${period}-task-input`);

  btn.addEventListener("click", () => addTask(period));
  textInput.addEventListener("keydown", e => { if (e.key === "Enter") addTask(period); });
}

function addTask(period) {
  const textInput = document.getElementById(`${period}-task-input`);
  const text      = textInput.value.trim();
  if (!text) return;

  if (period === "day") {
    const hours   = parseInt(document.getElementById("day-hours").value)   || 0;
    const minutes = parseInt(document.getElementById("day-minutes").value) || 0;
    if (hours === 0 && minutes === 0) return;
    data.day.push({ id: Date.now(), text, hours, minutes, done: false, createdAt: TODAY });
    document.getElementById("day-hours").value   = "";
    document.getElementById("day-minutes").value = "";
  }

  if (period === "week") {
    const days = parseInt(document.getElementById("week-days").value) || 0;
    if (days === 0) return;
    data.week.push({ id: Date.now(), text, daysTarget: days, daysCompleted: 0, done: false, createdAt: TODAY });
    document.getElementById("week-days").value = "";
  }

  if (period === "month") {
    const days = parseInt(document.getElementById("month-days").value) || 0;
    if (days === 0) return;
    data.month.push({ id: Date.now(), text, daysTarget: days, daysCompleted: 0, done: false, createdAt: TODAY });
    document.getElementById("month-days").value = "";
  }

  textInput.value = "";
  save();
  renderPeriodPage(period);
}

setupAddBtn("day");
setupAddBtn("week");
setupAddBtn("month");

/* ── TASK LIST EVENTS (delegation) ──────── */
["day", "week", "month"].forEach(period => {
  document.getElementById(`${period}-list`).addEventListener("click", e => {
    const li = e.target.closest(".task-item");
    if (!li) return;
    const id = Number(li.dataset.id);

    if (e.target.matches("input[type='checkbox']")) {
      const task = data[period].find(t => t.id === id);
      if (!task) return;
      task.done = !task.done;
      if (task.done && period === "day") onDayTaskCompleted(task);
      save();
      renderPeriodPage(period);
    }

    if (e.target.closest(".task-delete")) {
      data[period] = data[period].filter(t => t.id !== id);
      save();
      renderPeriodPage(period);
    }
  });
});

/* ── ARCHIVE COMPLETED → HISTORY ─────────── */
function archiveAll() {
  ["day", "week", "month"].forEach(period => {
    const completed = data[period].filter(t => t.done);
    if (!completed.length) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    completed.forEach(t => {
      history.push({
        id:          t.id,
        text:        t.text,
        period,
        hours:       t.hours       || 0,
        minutes:     t.minutes     || 0,
        daysTarget:  t.daysTarget  || 0,
        daysCompleted: t.daysCompleted || 0,
        completedAt: TODAY,
        expiresAt:   expiresAt.toISOString().split("T")[0]
      });
    });

    data[period] = data[period].filter(t => !t.done);
  });
  save();
}

/* ── CLEANUP EXPIRED ─────────────────────── */
function cleanupHistory() {
  history = history.filter(h => h.expiresAt >= TODAY);
  save();
}

/* ── RENDER HISTORY ──────────────────────── */
function renderHistory() {
  cleanupHistory();
  const container = document.getElementById("history-list");

  if (!history.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📋</span>
        <p class="empty-text">No history yet. Complete some tasks!</p>
      </div>`;
    return;
  }

  const grouped = {};
  [...history].reverse().forEach(item => {
    if (!grouped[item.completedAt]) grouped[item.completedAt] = [];
    grouped[item.completedAt].push(item);
  });

  container.innerHTML = Object.entries(grouped).map(([date, items]) => `
    <div class="history-group">
      <p class="history-date-label">${fmtDateLabel(date)} · ${items.length} completed</p>
      ${items.map(item => {
        const daysLeft = getDaysLeft(item.expiresAt);
        const warn     = daysLeft <= 5
          ? `<span class="expiry-warn">⚠ deletes in ${daysLeft}d</span>` : "";
        const timeMeta = item.period === "day"
          ? `⏱ ${item.hours}h ${item.minutes}m`
          : `📅 ${item.daysCompleted}/${item.daysTarget} days`;
        return `
          <div class="history-item" data-id="${item.id}">
            <div class="history-info">
              <p class="history-name">${item.text}</p>
              <div class="history-meta">
                <span class="period-badge badge-${item.period}">${item.period}</span>
                <span class="history-time">${timeMeta}</span>
                ${warn}
              </div>
            </div>
            <button class="history-delete">🗑</button>
          </div>`;
      }).join("")}
    </div>`
  ).join("");
}

/* ── HISTORY DELETE ──────────────────────── */
document.getElementById("history-list").addEventListener("click", e => {
  if (e.target.closest(".history-delete")) {
    const id = Number(e.target.closest(".history-item").dataset.id);
    history  = history.filter(h => h.id !== id);
    save();
    renderHistory();
  }
});

/* ── HELPERS ─────────────────────────────── */
function fmtTime(totalMins) {
  return `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
}

function fmtDateLabel(dateStr) {
  const date      = new Date(dateStr + "T00:00:00");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === TODAY) return "Today";
  if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function getDaysLeft(expiresAt) {
  return Math.ceil((new Date(expiresAt) - new Date(TODAY)) / (1000 * 60 * 60 * 24));
}

/* ── SERVICE WORKER ──────────────────────── */
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");

/* ── INIT ────────────────────────────────── */
cleanupHistory();
cascadeToDay();
renderDashboard();
showPage("home");
