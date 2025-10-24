const form  = document.getElementById("add-form");
const input = document.getElementById("text");
const list  = document.getElementById("list");
const empty = document.getElementById("empty");

// create a task
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
  await loadTasks(); // refresh UI
});

// fetch & render tasks
async function loadTasks() {
  const res = await fetch("/tasks");
  if (!res.ok) {
    console.error("Failed to load tasks");
    return;
  }

  const data = await res.json();

  list.innerHTML = "";

  if (!data.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  data.forEach((task) => {
    const li = document.createElement("li");

    // label
    const label = document.createElement("span");
    label.className = "task-label"
    label.textContent = task.text;
    if (task.done) label.classList.add("done");
    li.appendChild(label);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    // mark done & undo button
    const doneBtn = document.createElement("button");
    doneBtn.className = "icon-btn";
    doneBtn.setAttribute("aria-label", task.done ? "Undo" : "Mark done");
    doneBtn.innerHTML = task.done
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 14l-4-4 4-4"/><path d="M20 20a8 8 0 0 0-8-8H5"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg>`;
    doneBtn.addEventListener("click", async () => {
        const res = await fetch(`/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ done: !task.done })
        })
        if(res.ok) {
            await loadTasks();
        } else {
            console.error("Failed to update 'done'");
        }
    });
    actions.appendChild(doneBtn);

    // edit button
    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
  editBtn.setAttribute("aria-label", "Edit task");
  editBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
  </svg>`;

    editBtn.addEventListener("click", () => {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.value = task.text;

      li.replaceChild(inp, label);
      inp.focus();

      inp.addEventListener("keydown", async (e) => {
        if (e.key !== "Enter") return;
        const newText = inp.value.trim();
        if (!newText) return;

        const up = await fetch(`/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newText })
        });

        if (up.ok) {
          await loadTasks();
        } else {
          console.error("Failed to update task");
        }
      });
    });
    actions.appendChild(editBtn);

    // delete button
    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn danger";
    delBtn.setAttribute("aria-label", "Delete task");
  delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M3 6h18"/><path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/>
    <path d="M10 10v8M14 10v8"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
  </svg>`;
    delBtn.addEventListener("click", async () => {
      const del = await fetch(`/tasks/${task.id}`, { method: "DELETE" });
      if (del.ok) {
        await loadTasks();
      } else {
        console.error("Failed to delete");
      }
    });
    actions.appendChild(delBtn);

    li.appendChild(actions);

    list.appendChild(li);
  });
}

// initial load
loadTasks();