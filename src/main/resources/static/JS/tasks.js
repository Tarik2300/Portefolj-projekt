// ===== ENUMS & KONFIG =====

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
let dndInitialized = false;

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

        // Bind DnD events kun én gang (undgår stacked listeners/alerts)
        if (!dndInitialized) {
            setupDragAndDrop();
            dndInitialized = true;
        }
    } catch (err) {
        console.error("Fejl i loadTasks:", err);
    }
}

// ===== HELPERS TIL RENDER =====

function createSubtaskRow(task, subtask) {
    const row = document.createElement("div");
    row.classList.add("subtask-row");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!subtask.completed;

    const label = document.createElement("label");
    label.textContent = subtask.description;

    checkbox.onchange = async () => {
        try {
            const response = await fetch(
                `/api/subtasks/${subtask.id}/status?userId=${currentUserId}&completed=${checkbox.checked}`,
                { method: "PATCH" }
            );

            if (!response.ok) throw new Error("Kunne ikke opdatere subtask");

            subtask.completed = checkbox.checked;
        } catch (err) {
            console.error(err);
            checkbox.checked = !checkbox.checked; // rollback
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

    // DnD: gør kortet draggable
    card.draggable = true;
    card.addEventListener("dragstart", () => {
        draggedTaskId = task.id;
    });

    const header = document.createElement("div");
    header.classList.add("task-header");

    const titleEl = document.createElement("div");
    titleEl.classList.add("task-title");
    titleEl.textContent = task.title;

    const descEl = document.createElement("div");
    descEl.classList.add("task-desc");
    descEl.textContent = task.description;

    const formattedDeadline = formatDeadline(task.deadline);
    if (formattedDeadline) {
        const deadlineEl = document.createElement("div");
        deadlineEl.classList.add("task-deadline");
        deadlineEl.textContent = `Deadline: ${formattedDeadline}`;
        header.appendChild(deadlineEl);
    }

    const formattedPriority = formatPriority(task.priority);
    if (formattedPriority) {
        const priorityEl = document.createElement("div");
        priorityEl.classList.add("task-priority");
        priorityEl.textContent = `Prioritet: ${formattedPriority}`;
        header.appendChild(priorityEl);
    }

    const statusBadge = document.createElement("span");
    statusBadge.classList.add("task-status-badge");
    statusBadge.textContent = task.status;

    header.appendChild(titleEl);
    header.appendChild(descEl);
    header.appendChild(statusBadge);

    card.appendChild(header);

    const details = document.createElement("div");
    details.classList.add("task-details");

    // subtasks
    const subtaskContainer = document.createElement("div");
    subtaskContainer.classList.add("subtask-container");

    const subHeader = document.createElement("div");
    subHeader.textContent = "Subtasks:";
    subHeader.style.fontWeight = "bold";
    subHeader.style.marginBottom = "4px";
    subtaskContainer.appendChild(subHeader);

    task.subtasks.forEach(st => subtaskContainer.appendChild(createSubtaskRow(task, st)));
    details.appendChild(subtaskContainer);

    // ny subtask input (frontend-only indtil POST endpoint)
    const inputWrapper = document.createElement("div");
    inputWrapper.classList.add("subtask-input-wrapper");

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Ny subtask...";
    input.classList.add("subtask-input");

    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.classList.add("subtask-add-btn");
    addBtn.onclick = () => {
        if (!input.value.trim()) return;

        task.subtasks.push({
            id: Date.now(),
            description: input.value.trim(),
            completed: false
        });

        input.value = "";
        renderTasks();
    };

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(addBtn);
    details.appendChild(inputWrapper);

    // task status select + gem
    const statusBar = document.createElement("div");
    statusBar.classList.add("task-status-bar");

    const statusText = document.createElement("span");
    statusText.textContent = `Status: "${task.status}"`;

    const statusSelect = document.createElement("select");
    STATUS_FLOW.forEach(st => {
        const opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st;
        statusSelect.appendChild(opt);
    });
    statusSelect.value = task.status;

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Gem";
    saveBtn.classList.add("task-status-save-btn");
    saveBtn.onclick = async () => {
        const newStatus = statusSelect.value;

        try {
            await updateTaskStatus(task.id, newStatus);
            task.status = newStatus;
            renderTasks();
        } catch (err) {
            console.error(err);
            alert("Kunne ikke opdatere task-status");
            statusSelect.value = task.status;
        }
    };

    statusBar.appendChild(statusText);
    statusBar.appendChild(statusSelect);
    statusBar.appendChild(saveBtn);
    details.appendChild(statusBar);

    card.appendChild(details);

    // arkivér task
    const archiveTaskBtn = document.createElement("button");
    archiveTaskBtn.textContent = "Arkivér opgave";
    archiveTaskBtn.classList.add("subtask-archive-btn");
    archiveTaskBtn.onclick = () => archiveTask(task);

    card.appendChild(archiveTaskBtn);

    // Toggle expanded class for showing details
    card.addEventListener("click", () => {
        card.classList.toggle("expanded");
    });

    return card;
}

// ===== RENDER =====

function renderTasks() {
    const todoCol = document.getElementById("todo-column");
    const inprogressCol = document.getElementById("inprogress-column");
    const doneCol = document.getElementById("done-column");

    if (!todoCol || !inprogressCol || !doneCol) return;

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

// ===== DnD SETUP =====

function setupDragAndDrop() {
    const colMap = [
        { el: document.getElementById("todo-column"), status: Status.TODO },
        { el: document.getElementById("inprogress-column"), status: Status.IN_PROGRESS },
        { el: document.getElementById("done-column"), status: Status.DONE }
    ];

    colMap.forEach(({ el, status }) => {
        if (!el) return;

        el.addEventListener("dragover", (e) => e.preventDefault());

        el.addEventListener("drop", async (e) => {
            e.preventDefault();
            if (!draggedTaskId) return;

            const task = tasks.find(t => t.id === draggedTaskId);
            draggedTaskId = null;
            if (!task) return;

            if (task.status === status) return;

            const oldStatus = task.status;

            try {
                await updateTaskStatus(task.id, status);
                task.status = status;
                renderTasks();
            } catch (err) {
                console.error(err);
                task.status = oldStatus;
                alert("Kunne ikke flytte task (status blev ikke gemt)");
            }
        });
    });
}

// ===== ARKIVÉR TASK =====

async function archiveTask(task) {
    if (!confirm("Er du sikker på at du vil arkivere denne opgave?")) return;

    try {
        const response = await fetch(`/api/tasks/${task.id}/archive?userId=${currentUserId}`, {
            method: "PATCH"
        });

        if (!response.ok) {
            alert("Fejl ved arkivering af opgave");
            return;
        }

        const archived = await response.json();
        task.status = archived.status;

        renderTasks();
    } catch (err) {
        console.error("Kunne ikke arkivere:", err);
        alert("Der opstod en fejl – se console");
    }
}

// ===== INIT =====

loadTasks();
