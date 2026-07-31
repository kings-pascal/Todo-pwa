const todoInput = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");
const taskCount = document.getElementById("task-count");
const themeToggle = document.getElementById("theme-toggle");
const filterButtons = document.querySelectorAll(".filter-btn");
const currentDate = document.getElementById("current-date");

let todos = JSON.parse(localStorage.getItem("todos")) || [];
let currentFilter = "all";

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  todos.push({ id: Date.now(), text, done: false });
  todoInput.value = "";
  saveTodos();
  renderTodos();
}

addBtn.addEventListener("click", addTodo);

todoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

todoList.addEventListener("click", (e) => {
  const li = e.target.closest(".todo-item");
  if (!li) return;
  const id = Number(li.dataset.id);

  if (e.target.matches("input[type='checkbox']")) {
    todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
    saveTodos();
    renderTodos();
  }

  if (e.target.closest(".delete-btn")) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
  }
});

document.getElementById("clear-completed").addEventListener("click", () => {
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
});

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderTodos();
  });
});

themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");

  if (currentTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "light");
    themeToggle.textContent = "🌙";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
  }
});

currentDate.textContent = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric"
});

function renderTodos() {
  let filteredTodos = todos;

  if (currentFilter === "active") {
    filteredTodos = todos.filter(todo => todo.done === false);
  }

  if (currentFilter === "completed") {
    filteredTodos = todos.filter(todo => todo.done === true);
  }

  if (filteredTodos.length === 0) {
    todoList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📝</span>
        Nothing here yet!
      </div>
    `;
  } else {
    todoList.innerHTML = filteredTodos.map(todo => `
      <li class="todo-item ${todo.done ? "completed" : ""}" data-id="${todo.id}">
        <input type="checkbox" ${todo.done ? "checked" : ""}>
        <span>${todo.text}</span>
        <button class="delete-btn">🗑</button>
      </li>
    `).join("");
  }

  const remainingTasks = todos.filter(todo => todo.done === false).length;
  taskCount.textContent = `${remainingTasks} tasks remaining`;
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

renderTodos();