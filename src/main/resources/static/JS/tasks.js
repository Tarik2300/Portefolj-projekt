// ===== ENUMS &  KONFIG =====

const Status = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    ARCHIVED: "ARCHIVED"
};

const STATUS_FLOW = [Status.TODO, Status.IN_PROGRESS, Status.DONE];

const currentUserId = 1;

let tasks = [];

// ===== HJÆLPERE =====

function formatDeadline(isoDateString) {
    if (!isoDateString) return null;

    const parts = isoDateString.split("-");
    if (parts.length >= 3) {
        const [yyyy, mm, dd] = parts;
        return `${dd}-${mm}-${yyyy}`;
    }
    return isoDateString;
}

function formatPriority(priority) {
    if (!priority) return null;

    switch (priority) {
        case "LOW":
            return "Lav";
        case "MEDIUM":
            return "Mellem";
        case "HIGH":
            return "Høj";
        default:
            return priority;
    }
}

// ===== API-LOAD =====

async function loadTasks() {
    try {
        const response = await fetch(`/api/tasks/my?userId=${currentUserId}`);
        if (!response.ok) {
            throw new Error("Fejl ved hentning af tasks: " + response.status);
        }

        const data = await response.json();

        tasks = data.map(t => ({
            id: t.id,
            title: t.title ?? "(ingen titel)",
            description: t.description ?? "",
            status: t.status,
            priority: t.priority ?? null,
            deadline: t.deadline ?? null,
            assignedToId: t.assignedToId,
            subtasks: (t.subtasks ?? []).map(st => ({
                id: st.id,
                description: st.description,
                completed: st.completed
            }))
        }));

        renderTasks();
    } catch (err) {
        console.error("Fejl i loadTasks:", err);
    }
}

// ===== HELPERS TIL RENDER =====

function createSubtaskRow(task, subtask) {
    const row = document.createElement("div");
    row.classList.add("subtask-row");

    const label = document.createElement("label");
    label.textContent = subtask.description;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = subtask.completed;

    checkbox.onchange = async () => {
        try {
            const response = await fetch(
                `/api/subtasks/${subtask.id}/status?userId=${currentUserId}&completed=${checkbox.checked}`,
                { method: "PATCH" }
            );

            if (!response.ok) throw new Error();
            subtask.completed = checkbox.checked;
        } catch {
            checkbox.checked = !checkbox.checked;
            alert("Fejl ved opdatering af subtask");
        }
    };

    row.appendChild(checkbox);
    row.appendChild(label);
    return row;
}

// ===== Opret ét task-kort =====

function createTaskCard(task) {
    const card = document.createElement("div");
    card.classList.add("task-card");

    const header = document.createElement("div");
    header.classList.add("task-header");

    const titleEl = document.createElement("div");
    titleEl.textContent = task.title;

    header.appendChild(titleEl);
    card.appendChild(header);

    const details = document.createElement("div");
    details.classList.add("task-details");

    const subtaskContainer = document.createElement("div");
    task.subtasks.forEach(st =>
        subtaskContainer.appendChild(createSubtaskRow(task, st))
    );
    details.appendChild(subtaskContainer);

    const input = document.createElement("input");
    input.placeholder = "Ny subtask...";

    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.onclick = () => {
        if (!input.value.trim()) return;

        // 🔧 RETTET HER
        task.subtasks.push({
            id: Date.now(),
            description: input.value.trim(),
            completed: false
        });

        input.value = "";
        renderTasks();
    };

    details.appendChild(input);
    details.appendChild(addBtn);
    card.appendChild(details);

    return card;
}

// ===== RENDER =====

function renderTasks() {
    const todoCol = document.getElementById("todo-column");
    const inprogressCol = document.getElementById("inprogress-column");
    const doneCol = document.getElementById("done-column");

    todoCol.innerHTML = "";
    inprogressCol.innerHTML = "";
    doneCol.innerHTML = "";

    tasks
        .filter(t => t.status !== Status.ARCHIVED)
        .forEach(task => {
            const card = createTaskCard(task);
            if (task.status === Status.TODO) todoCol.appendChild(card);
            else if (task.status === Status.IN_PROGRESS) inprogressCol.appendChild(card);
            else doneCol.appendChild(card);
        });
}

// ===== INIT =

loadTasks();