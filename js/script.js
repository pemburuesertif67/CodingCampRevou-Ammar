const STORAGE = {
  tasks: "lifeDashboardTasks",
  links: "lifeDashboardLinks",
  name: "lifeDashboardName",
  theme: "lifeDashboardTheme",
  duration: "lifeDashboardDuration"
};

const $ = (selector) => document.querySelector(selector);

const greetingEl = $("#greeting");
const dateTextEl = $("#dateText");
const clockEl = $("#clock");
const themeBtn = $("#themeBtn");

const nameForm = $("#nameForm");
const nameInput = $("#nameInput");

const timerDisplay = $("#timerDisplay");
const timerStatus = $("#timerStatus");
const startBtn = $("#startBtn");
const stopBtn = $("#stopBtn");
const resetBtn = $("#resetBtn");
const durationForm = $("#durationForm");
const durationInput = $("#durationInput");

const taskForm = $("#taskForm");
const taskInput = $("#taskInput");
const taskList = $("#taskList");
const taskCount = $("#taskCount");
const emptyState = $("#emptyState");
const sortBtn = $("#sortBtn");
const clearDoneBtn = $("#clearDoneBtn");

const linkForm = $("#linkForm");
const linkName = $("#linkName");
const linkUrl = $("#linkUrl");
const linkList = $("#linkList");
const linkEmptyState = $("#linkEmptyState");

let tasks = load(STORAGE.tasks, []);
let links = load(STORAGE.links, []);
let customName = localStorage.getItem(STORAGE.name) || "";
let durationMinutes = Number(localStorage.getItem(STORAGE.duration)) || 25;
let remainingSeconds = durationMinutes * 60;
let timerId = null;

function load(key, fallback) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function updateClock() {
  const now = new Date();

  clockEl.textContent = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  dateTextEl.textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const hour = now.getHours();
  let greeting = "Good evening";

  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  greetingEl.textContent = customName
    ? `${greeting}, ${customName}!`
    : `${greeting}!`;
}

function applyTheme() {
  const dark = localStorage.getItem(STORAGE.theme) === "dark";
  document.body.classList.toggle("dark", dark);
  themeBtn.textContent = dark ? "☀️" : "🌙";
}

themeBtn.addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark");
  localStorage.setItem(STORAGE.theme, dark ? "dark" : "light");
  applyTheme();
});

nameInput.value = customName;

nameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  customName = nameInput.value.trim();
  localStorage.setItem(STORAGE.name, customName);
  updateClock();
});

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(remainingSeconds);
}

function setTimerStatus(text) {
  timerStatus.textContent = text;
}

function startTimer() {
  if (timerId !== null) return;

  if (remainingSeconds <= 0) {
    remainingSeconds = durationMinutes * 60;
  }

  setTimerStatus("Running");

  timerId = setInterval(() => {
    remainingSeconds -= 1;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      clearInterval(timerId);
      timerId = null;
      remainingSeconds = 0;
      setTimerStatus("Complete");
      alert("Focus session complete!");
    }
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  setTimerStatus("Paused");
}

function resetTimer() {
  stopTimer();
  remainingSeconds = durationMinutes * 60;
  updateTimerDisplay();
  setTimerStatus("Ready");
}

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);
resetBtn.addEventListener("click", resetTimer);

durationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const minutes = Number(durationInput.value);

  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 120) {
    alert("Please choose a time between 1 and 120 minutes.");
    return;
  }

  durationMinutes = Math.round(minutes);
  localStorage.setItem(STORAGE.duration, String(durationMinutes));
  resetTimer();
});

function renderTasks() {
  taskList.innerHTML = "";

  const pending = tasks.filter((task) => !task.done).length;
  taskCount.textContent = `${pending} pending`;

  emptyState.hidden = tasks.length !== 0;

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item${task.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Mark ${task.text} as done`);

    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      save(STORAGE.tasks, tasks);
      renderTasks();
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "small-btn";
    editBtn.type = "button";
    editBtn.textContent = "Edit";

    editBtn.addEventListener("click", () => {
      const edited = prompt("Edit task:", task.text);
      if (edited === null) return;

      const newText = edited.trim();
      if (!newText) return;

      const duplicate = tasks.some(
        (item) => item.id !== task.id && item.text.toLowerCase() === newText.toLowerCase()
      );

      if (duplicate) {
        alert("Duplicate tasks are not allowed.");
        return;
      }

      task.text = newText;
      save(STORAGE.tasks, tasks);
      renderTasks();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "small-btn";
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      save(STORAGE.tasks, tasks);
      renderTasks();
    });

    actions.append(editBtn, deleteBtn);
    li.append(checkbox, text, actions);
    taskList.appendChild(li);
  });
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (!text) return;

  const duplicate = tasks.some(
    (task) => task.text.toLowerCase() === text.toLowerCase()
  );

  if (duplicate) {
    alert("This task already exists.");
    return;
  }

  tasks.push({
    id: Date.now(),
    text,
    done: false
  });

  save(STORAGE.tasks, tasks);
  taskInput.value = "";
  renderTasks();
  taskInput.focus();
});

sortBtn.addEventListener("click", () => {
  tasks.sort((a, b) => {
    if (a.done !== b.done) return Number(a.done) - Number(b.done);
    return a.text.localeCompare(b.text);
  });

  save(STORAGE.tasks, tasks);
  renderTasks();
});

clearDoneBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  save(STORAGE.tasks, tasks);
  renderTasks();
});

function normalizeUrl(value) {
  const url = value.trim();
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

function renderLinks() {
  linkList.innerHTML = "";
  linkEmptyState.hidden = links.length !== 0;

  links.forEach((link) => {
    const item = document.createElement("div");
    item.className = "link-item";

    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.name;
    anchor.title = link.url;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-link";
    deleteBtn.type = "button";
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", `Delete ${link.name}`);

    deleteBtn.addEventListener("click", () => {
      links = links.filter((item) => item.id !== link.id);
      save(STORAGE.links, links);
      renderLinks();
    });

    item.append(anchor, deleteBtn);
    linkList.appendChild(item);
  });
}

linkForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = linkName.value.trim();
  const url = normalizeUrl(linkUrl.value);

  if (!name || !url) return;

  try {
    new URL(url);
  } catch {
    alert("Please enter a valid website URL.");
    return;
  }

  const duplicate = links.some(
    (link) => link.url.toLowerCase() === url.toLowerCase()
  );

  if (duplicate) {
    alert("This link already exists.");
    return;
  }

  links.push({
    id: Date.now(),
    name,
    url
  });

  save(STORAGE.links, links);
  linkForm.reset();
  renderLinks();
});

applyTheme();
durationInput.value = durationMinutes;
updateTimerDisplay();
updateClock();
renderTasks();
renderLinks();
setInterval(updateClock, 1000);
