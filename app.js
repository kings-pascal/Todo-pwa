// ============================================
// SELECTORS - grab all elements we need
// ============================================
const todoInput     = document.getElementById("todo-input");
const addBtn        = document.getElementById("add-btn");
const todoList      = document.getElementById("todo-list");
const taskCount     = document.getElementById("task-count");
const themeToggle   = document.getElementById("theme-toggle");
const filterButtons = document.querySelectorAll(".filter-btn");
const currentDate   = document.getElementById("current-date");
const clearCompleted = document.getElementById("clear-completed");

// ============================================
// STATE - the data that drives the app
// ============================================
// We load from localStorage first so todos survive page refresh
// If nothing is saved yet, start with an empty array
let todos = JSON.parse(localStorage.getItem("todos")) || [];
let currentFilter = "all";

// ============================================
// LOCALSTORAGE - saving data in the browser
// ============================================
// localStorage is like a mini database in the browser
// It stores everything as strings, so:
// - JSON.stringify() converts JS array → string (to save)
// - JSON.parse()     converts string → JS array (to load)
// Data persists even after closing the browser

function saveToStorage() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// ============================================
// DATE - show today's date under the title
// ============================================
currentDate.textContent = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric"
});

// ============================================
// RENDER - redraws the todo list on screen
// ============================================
// This is the core of the app. Every time data changes
// we call renderTodos() and it rebuilds the UI from scratch
// This pattern (data → render → UI) is how React works too

function renderTodos() {
  // 1. filter the array based on current tab
  const filteredTodos = currentFilter === "all"
    ? todos
    : todos.filter(todo =>
        currentFilter === "active" ? !todo.done : todo.done
      );

  // 2. if nothing to show, display empty state
  if (filteredTodos.length === 0) {
    todoList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📝</span>
        Nothing here yet!
      </div>
    `;
  } else {
    // 3. map each todo object into an HTML string
    // join("") turns the array of strings into one big string
    todoList.innerHTML = filteredTodos.map(todo => `
      <li class="todo-item ${todo.done ? "completed" : ""}" data-id="${todo.id}">
        <input type="checkbox" ${todo.done ? "checked" : ""}>
        <span>${todo.text}</span>
        <button class="delete-btn" aria-label="Delete todo">🗑</button>
      </li>
    `).join("");
  }

  // 4. update the task count - only count todos not done
  const remaining = todos.filter(t => !t.done).length;
  taskCount.textContent = `${remaining} task${remaining !== 1 ? "s" : ""} remaining`;
}

// ============================================
// ADD TODO
// ============================================
function addTodo() {
  const text = todoInput.value.trim(); // trim removes extra spaces
  if (!text) return;                   // do nothing if input is empty

  const newTodo = {
    id: Date.now(), // Date.now() gives a unique number like 1714500000000
    text,           // shorthand for text: text (ES6)
    done: false
  };

  todos.push(newTodo);
  saveToStorage();   // save after every change
  renderTodos();

  todoInput.value = ""; // clear input
  todoInput.focus();    // keep cursor in input for fast adding
}

// add button click
addBtn.addEventListener("click", addTodo);

// pressing Enter also adds todo
todoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

// ============================================
// DELETE & COMPLETE - using event delegation
// ============================================
// We add ONE listener to the parent <ul> instead of
// one listener per todo item. When any child is clicked,
// the event bubbles up to the ul and we handle it here.
// This works even for todos added dynamically later.

todoList.addEventListener("click", (e) => {
  // .closest() walks up the DOM tree to find the nearest .todo-item
  // this works whether you click the checkbox, span, or button
  const item = e.target.closest(".todo-item");
  if (!item) return; // clicked outside a todo item

  const id = Number(item.dataset.id); // get id from data-id attribute

  // if delete button was clicked
  if (e.target.classList.contains("delete-btn") ||
      e.target.closest(".delete-btn")) {
    todos = todos.filter(t => t.id !== id); // remove from array
    saveToStorage();
    renderTodos();
    return;
  }

  // if checkbox or anywhere else on item was clicked → toggle done
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done; // flip true→false or false→true
    saveToStorage();
    renderTodos();
  }
});

// ============================================
// FILTER BUTTONS
// ============================================
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter; // "all", "active", or "completed"

    // remove active class from all buttons then add to clicked one
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    renderTodos();
  });
});

// ============================================
// CLEAR COMPLETED
// ============================================
clearCompleted.addEventListener("click", () => {
  todos = todos.filter(t => !t.done); // keep only unfinished todos
  saveToStorage();
  renderTodos();
});

// ============================================
// DARK MODE TOGGLE
// ============================================
themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  themeToggle.textContent = next === "dark" ? "☀️" : "🌙";
  // save theme preference so it persists on refresh
  localStorage.setItem("theme", next);
});

// ============================================
// INIT - runs when page loads
// ============================================
// restore saved theme
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);
themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";

// render todos from localStorage on first load
renderTodos();

// ============================================
// REGISTER SERVICE WORKER
// ============================================
// "serviceWorker" in navigator checks if the browser supports it
// We register sw.js so the browser knows about our service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
    .then(() => console.log("Service worker registered"))
    .catch(err => console.log("SW registration failed:", err));
}
