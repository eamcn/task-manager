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
    label.textContent = task.text;
    if (task.done) label.classList.add("done");
    li.appendChild(label);

    // mark done & undo button
    const doneBtn = document.createElement("button");
    doneBtn.textContent = task.done ? "Undo" : "Mark done";
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
    li.append(doneBtn);

    // edit button
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
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
    li.appendChild(editBtn);

    // delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", async () => {
      const del = await fetch(`/tasks/${task.id}`, { method: "DELETE" });
      if (del.ok) {
        await loadTasks();
      } else {
        console.error("Failed to delete");
      }
    });
    li.appendChild(delBtn);

    list.appendChild(li);
  });
}

// initial load
loadTasks();