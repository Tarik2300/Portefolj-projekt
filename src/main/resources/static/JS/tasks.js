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
        console.log("RAW API data:", data);

        tasks = data.map(t => ({
            id: t.id,
            title: t.title ?? t.name ?? "(ingen titel)",
            description: t.description ?? "",
            status: t.status,
            priority: t.priority ?? null,
            deadline: t.deadline ?? null,
            assignedToId: t.assignedToId ?? t.userId ?? t.assignedTo?.id ?? null,
            subtasks: (t.subtasks ?? t.subTasks ?? []).map(st => ({
                id: st.id,
                title: st.title ?? st.name ?? "",
                status: st.status
            }))
        }));

        console.log("Mapped tasks:", tasks);
        renderTasks();
    } catch (err) {
        console.error("Fejl i loadTasks:", err);
    }
}

// ===== HELPERS TIL RENDER =====

function createSubtaskRow(task, subtask) {
    const row = document.createElement("div");
    row.classList.add("subtask-row");

    const label = document.createElement("span");
    label.textContent = subtask.title;

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
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(`/api/subtasks/${subtask.id}/archive`, {
                method: "PATCH"
            });

            if (!response.ok) {
                throw new Error("Fejl ved arkivering af subtask: " + response.status);
            }

            subtask.status = Status.ARCHIVED;
            renderTasks();
        } catch (err) {
            console.error(err);
            alert("Kunne ikke arkivere subtask");
        }
    };

    row.appendChild(label);
    row.appendChild(select);
    row.appendChild(archiveBtn);
    return row;
}

// ===== Opret ét task-kort =====

function createTaskCard(task) {
    const card = document.createElement("div");
    card.classList.add("task-card");
    card.dataset.taskId = task.id;

    // ----- HEADER -----
    const header = document.createElement("div");
    header.classList.add("task-header");

    const titleEl = document.createElement("div");
    titleEl.classList.add("task-title");
    titleEl.textContent = task.title;

    const descEl = document.createElement("div");
    descEl.classList.add("task-desc");
    descEl.textContent = task.description;

    const formattedDeadline = formatDeadline(task.deadline);
    let deadlineEl = null;
    if (formattedDeadline) {
        deadlineEl = document.createElement("div");
        deadlineEl.classList.add("task-deadline");
        deadlineEl.textContent = `Deadline: ${formattedDeadline}`;
    }

    const formattedPriority = formatPriority(task.priority);
    let priorityEl = null;
    if (formattedPriority) {
        priorityEl = document.createElement("div");
        priorityEl.classList.add("task-priority");
        priorityEl.textContent = `Prioritet: ${formattedPriority}`;
    }

    const statusBadge = document.createElement("span");
    statusBadge.classList.add("task-status-badge");
    statusBadge.textContent = task.status;

    header.appendChild(titleEl);
    header.appendChild(descEl);
    if (deadlineEl) header.appendChild(deadlineEl);
    if (priorityEl) header.appendChild(priorityEl);
    header.appendChild(statusBadge);

    header.addEventListener("click", () => {
        card.classList.toggle("expanded");
    });

    card.appendChild(header);

    // ----- DETAILS -----
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

    task.subtasks
        .filter(st => st.status !== Status.ARCHIVED)
        .forEach(st => subtaskContainer.appendChild(createSubtaskRow(task, st)));

    details.appendChild(subtaskContainer);

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
        const newSubtask = {
            id: Date.now(), // midlertidigt ID – backend vil lave rigtigt ID senere
            title: input.value.trim(),
            status: Status.TODO
        };
        task.subtasks.push(newSubtask);
        input.value = "";
        // TODO: POST /api/tasks/{taskId}/subtasks
        renderTasks();
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
            const response = await fetch(`/api/tasks/${task.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error("Fejl ved opdatering af task-status: " + response.status);
            }

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

    // knap til at arkivere HELE opgaven
    const archiveTaskBtn = document.createElement("button");
    archiveTaskBtn.textContent = "Arkivér opgave";
    archiveTaskBtn.classList.add("subtask-archive-btn"); // genbrug stil
    archiveTaskBtn.onclick = () => archiveTask(task);

    card.appendChild(archiveTaskBtn);

    return card;
}

// ===== RENDER HELE BOARD'ET =====

function renderTasks() {
    const todoCol = document.getElementById("todo-column");
    const inprogressCol = document.getElementById("inprogress-column");
    const doneCol = document.getElementById("done-column");

    if (!todoCol || !inprogressCol || !doneCol) {
        console.error("Kolonner ikke fundet i DOM'en");
        return;
    }

    todoCol.innerHTML = "";
    inprogressCol.innerHTML = "";
    doneCol.innerHTML = "";

    tasks
        .filter(t => t.status !== Status.ARCHIVED)
        .forEach(task => {
            const card = createTaskCard(task);
            switch (task.status) {
                case Status.TODO:
                    todoCol.appendChild(card);
                    break;
                case Status.IN_PROGRESS:
                    inprogressCol.appendChild(card);
                    break;
                case Status.DONE:
                    doneCol.appendChild(card);
                    break;
                default:
                    todoCol.appendChild(card);
                    break;
            }
        });
}

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
        task.status = archived.status; // ARCHIVED

        renderTasks(); // Fjerner kortet fra boardet
    } catch (err) {
        console.error("Kunne ikke arkivere:", err);
        alert("Der opstod en fejl – se console");
    }
}


// ===== INIT =====

loadTasks();
