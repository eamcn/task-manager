const form  = document.getElementById("add-form");
const input = document.getElementById("text");
const list  = document.getElementById("list");
const empty = document.getElementById("empty");

// Create a task
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  const res = await fetch("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    console.error("Failed to add task");
    return;
  }

  input.value = "";
  await loadTasks();
});

// Fetch & render tasks
async function loadTasks() {
  const res = await fetch("/tasks");
  if (!res.ok) {
    console.error("Failed to load tasks");
    return;
  }

  const data = await res.json();

  list.innerHTML = "";

  if (data.length === 0) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  data.forEach((task) => {
    const li = document.createElement("li");

    // text
    const label = document.createElement("span");
    label.textContent = task.text;         
    li.appendChild(label);

    // delete button
    const btn = document.createElement("button");
    btn.textContent = "Delete";
    btn.addEventListener("click", async () => {
      const del = await fetch(`/tasks/${task.id}`, { method: "DELETE" });
      if (del.ok) loadTasks();
      else console.error("Failed to delete");
    });
    li.appendChild(btn);

    list.appendChild(li);
  });
}

// initial load
loadTasks();