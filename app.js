const todoInput = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");
const taskCount = document.getElementById("task-count");
const themeToggle = document.getElementById("theme-toggle");
const filterButtons = document.querySelectorAll(".filter-btn");
const currentDate = document.getElementById("current-date");

let todos = [];
let currentFilter = "all";      


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