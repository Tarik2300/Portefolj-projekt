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

// DnD state
let draggedTaskId = null;

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

// ===== API HELPERS =====

async function updateTaskStatus(taskId, newStatus) {
    const response = await fetch(`/api/tasks/${taskId}/status?userId=${currentUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
        throw new Error("Fejl ved opdatering af task-status: " + response.status);
    }

    return await response.json();
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
        setupDragAndDrop(); // important: (re)bind dropzones
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

    const select = document.createElement("select");
    STATUS_FLOW.forEach(st => {
        const opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st;
        select.appendChild(opt);
    });
    select.value = subtask.status;

    select.onchange = async () => {
        const newStatus = select.value;

        try {
            const response = await fetch(`/api/subtasks/${subtask.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error("Fejl ved opdatering af subtask-status: " + response.status);
            }

            subtask.status = newStatus;
            renderTasks();
            setupDragAndDrop();
        } catch (err) {
            console.error(err);
            alert("Kunne ikke opdatere subtask-status");
            select.value = subtask.status;
        }
    };

    const archiveBtn = document.createElement("button");
    archiveBtn.textContent = "Arkivér";
    archiveBtn.classList.add("subtask-archive-btn");
    archiveBtn.onclick = async () => {
        const confirmed = confirm("Er du sikker på, at du vil arkivere denne subtask?");
        if (!confirmed) return;

    checkbox.onchange = async () => {
        try {
            const response = await fetch(`/api/subtasks/${subtask.id}/archive`, {
                method: "PATCH"
            });

            if (!response.ok) {
                throw new Error("Fejl ved arkivering af subtask: " + response.status);
            }

            subtask.status = Status.ARCHIVED;
            renderTasks();
            setupDragAndDrop();
        } catch (err) {
            console.error(err);
            alert("Kunne ikke arkivere subtask");
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
        const newSubtask = {
            id: Date.now(),
            title: input.value.trim(),
            status: Status.TODO
        };
        task.subtasks.push(newSubtask);
        input.value = "";
        renderTasks();
        setupDragAndDrop();
        const cardAgain = document.querySelector(`[data-task-id="${task.id}"]`);
        if (cardAgain) cardAgain.classList.add("expanded");
    };

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(addBtn);
    details.appendChild(inputWrapper);

    const statusBar = document.createElement("div");
    statusBar.classList.add("task-status-bar");

    const statusText = document.createElement("span");
    statusText.textContent = `Status: "${task.status}"`;

        // 🔧 RETTET HER
        task.subtasks.push({
            id: Date.now(),
            description: input.value.trim(),
            completed: false
        });

        try {
            await updateTaskStatus(task.id, newStatus);
            task.status = newStatus;
            renderTasks();
            setupDragAndDrop();
        } catch (err) {
            console.error(err);
            alert("Kunne ikke opdatere task-status");
            statusSelect.value = task.status;
        }
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

// ===== INIT =svsv

loadTasks();
