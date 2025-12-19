// ===== ENUMS & KONFIG =====

const Status = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    ARCHIVED: "ARCHIVED"
};

const STATUS_FLOW = [Status.TODO, Status.IN_PROGRESS, Status.DONE];

// subtask dropdown værdier
const SubtaskStatus = {
    TODO: "TODO",
    DONE: "DONE"
};

const currentUserId = Number(sessionStorage.getItem("userId"));
if (!currentUserId) window.location.href = "/login";

// ===== STATE =====

let tasks = [];
let draggedTaskId = null;
let dndInitialized = false;

// ===== FETCH HELPER =====

async function apiFetch(url, options = {}) {
    return fetch(url, {
        credentials: "include",
        ...options
    });
}

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
        case "LOW": return "Lav";
        case "MEDIUM": return "Mellem";
        case "HIGH": return "Høj";
        default: return priority;
    }
}

// ===== API =====

async function updateTaskStatus(taskId, newStatus) {
    const res = await apiFetch(`/api/tasks/${taskId}/status?userId=${currentUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
    });

    if (!res.ok) throw new Error("Fejl ved opdatering af task-status: " + res.status);
    return await res.json();
}

async function archiveTask(task) {
    if (!confirm("Er du sikker på at du vil arkivere denne opgave?")) return;

    const res = await apiFetch(`/api/tasks/${task.id}/archive?userId=${currentUserId}`, {
        method: "PATCH"
    });

    if (!res.ok) {
        alert("Fejl ved arkivering af opgave");
        return;
    }

    const archived = await res.json();
    task.status = archived.status;
    renderTasks();
}

// --- Subtasks: hent pr. task (løser “kun 1 subtask” problemet) ---
async function loadSubtasksForTask(taskId) {
    const res = await apiFetch(`/api/tasks/${taskId}/subtasks?userId=${currentUserId}`);
    if (!res.ok) throw new Error(`Kunne ikke hente subtasks for task ${taskId}: ${res.status}`);

    const data = await res.json();
    return (data ?? []).map(st => ({
        id: st.id,
        description: st.description ?? "",
        completed: !!st.completed
    }));
}

// --- Subtasks: opret ---
async function createSubtask(taskId, description) {
    const res = await apiFetch(`/api/tasks/${taskId}/subtasks?userId=${currentUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description })
    });

    if (!res.ok) throw new Error("Kunne ikke oprette subtask: " + res.status);
    return await res.json(); // forventer {id, description, completed}
}

// --- Subtasks: opdater completed (robust) ---
// Prøver først dit gamle endpoint med query-param.
// Hvis backend i virkeligheden forventer body eller andet endpoint, prøver den variant B.
async function setSubtaskCompleted(subtaskId, completed) {
    // A) din nuværende stil (query param)
    let res = await apiFetch(
        `/api/subtasks/${subtaskId}/status?userId=${currentUserId}&completed=${completed}`,
        { method: "PATCH" }
    );

    if (res.ok) return true;

    // B) fallback: JSON body (typisk Spring)
    res = await apiFetch(`/api/subtasks/${subtaskId}?userId=${currentUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed })
    });

    if (!res.ok) throw new Error("Kunne ikke opdatere subtask: " + res.status);
    return true;
}

// ===== LOAD TASKS =====

async function loadTasks() {
    try {
        const res = await apiFetch(`/api/tasks/my?userId=${currentUserId}`);
        if (!res.ok) throw new Error("Fejl ved hentning af tasks: " + res.status);

        const data = await res.json();

        tasks = (data ?? []).map(t => ({
            id: t.id,
            title: t.title ?? "(ingen titel)",
            description: t.description ?? "",
            status: t.status,
            priority: t.priority ?? null,
            deadline: t.deadline ?? null,
            assignedToId: t.assignedToId,
            subtasks: [] // vi loader dem separat lige efter
        }));

        // 🔥 Vigtigt: hent subtasks pr. task, så du får ALLE med (ikke kun 1)
        await Promise.all(tasks.map(async (task) => {
            try {
                task.subtasks = await loadSubtasksForTask(task.id);
            } catch (e) {
                console.warn(e);
                task.subtasks = [];
            }
        }));

        renderTasks();

        if (!dndInitialized) {
            setupDragAndDrop();
            dndInitialized = true;
        }
    } catch (err) {
        console.error("Fejl i loadTasks:", err);
        alert("Kunne ikke hente tasks – se console");
    }
}

// ===== SUBTASK UI (dropdown TODO/DONE) =====

function createSubtaskRow(task, subtask) {
    const row = document.createElement("div");
    row.classList.add("subtask-row");

    const left = document.createElement("div");
    left.classList.add("subtask-left");
    left.addEventListener("click", (e) => e.stopPropagation());

    const text = document.createElement("span");
    text.classList.add("subtask-label");
    text.textContent = subtask.description;

    const select = document.createElement("select");
    select.classList.add("subtask-status-select");
    select.addEventListener("click", (e) => e.stopPropagation());

    const optTodo = document.createElement("option");
    optTodo.value = SubtaskStatus.TODO;
    optTodo.textContent = "TODO";

    const optDone = document.createElement("option");
    optDone.value = SubtaskStatus.DONE;
    optDone.textContent = "DONE";

    select.appendChild(optTodo);
    select.appendChild(optDone);

    // map boolean <-> dropdown
    select.value = subtask.completed ? SubtaskStatus.DONE : SubtaskStatus.TODO;

    select.onchange = async () => {
        const oldCompleted = subtask.completed;
        const newCompleted = select.value === SubtaskStatus.DONE;

        // optimistic
        subtask.completed = newCompleted;

        try {
            await setSubtaskCompleted(subtask.id, newCompleted);
        } catch (err) {
            console.error(err);
            // rollback
            subtask.completed = oldCompleted;
            select.value = oldCompleted ? SubtaskStatus.DONE : SubtaskStatus.TODO;
            alert("Fejl ved opdatering af subtask");
        }
    };

    left.appendChild(text);
    row.appendChild(left);
    row.appendChild(select);

    return row;
}

function createAddSubtaskUI(task) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("subtask-input-wrapper");
    wrapper.addEventListener("click", (e) => e.stopPropagation());

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Ny subtask...";
    input.classList.add("subtask-input");
    input.addEventListener("click", (e) => e.stopPropagation());

    const btn = document.createElement("button");
    btn.textContent = "+";
    btn.classList.add("subtask-add-btn");
    btn.addEventListener("click", (e) => e.stopPropagation());

    const add = async () => {
        const text = input.value.trim();
        if (!text) return;

        btn.disabled = true;
        try {
            const created = await createSubtask(task.id, text);

            task.subtasks.push({
                id: created.id,
                description: created.description ?? text,
                completed: !!created.completed
            });

            input.value = "";
            renderTasks();
        } catch (err) {
            console.error(err);
            alert("Kunne ikke oprette subtask (mangler POST/route?)");
        } finally {
            btn.disabled = false;
        }
    };

    input.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") add();
    });

    btn.onclick = add;

    wrapper.appendChild(input);
    wrapper.appendChild(btn);
    return wrapper;
}

// ===== TASK CARD =====

function createTaskCard(task) {
    const card = document.createElement("div");
    card.classList.add("task-card");

    // DnD
    card.draggable = true;
    card.addEventListener("dragstart", () => { draggedTaskId = task.id; });

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
    subHeader.classList.add("subtask-header");
    subHeader.textContent = "Subtasks:";
    subtaskContainer.appendChild(subHeader);

    task.subtasks.forEach(st => subtaskContainer.appendChild(createSubtaskRow(task, st)));
    subtaskContainer.appendChild(createAddSubtaskUI(task));

    details.appendChild(subtaskContainer);

    // status bar
    const statusBar = document.createElement("div");
    statusBar.classList.add("task-status-bar");

    const statusText = document.createElement("span");
    statusText.textContent = `Status: "${task.status}"`;

    const statusSelect = document.createElement("select");
    statusSelect.addEventListener("click", (e) => e.stopPropagation());

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
    saveBtn.addEventListener("click", (e) => e.stopPropagation());

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

    // archive
    const archiveBtn = document.createElement("button");
    archiveBtn.textContent = "Arkivér opgave";
    archiveBtn.classList.add("subtask-archive-btn");
    archiveBtn.addEventListener("click", (e) => e.stopPropagation());
    archiveBtn.onclick = () => archiveTask(task);
    details.appendChild(archiveBtn);

    card.appendChild(details);

    // expand/collapse (ikke når man klikker inputs)
    card.addEventListener("click", (e) => {
        const isInteractive =
            e.target.closest("button") ||
            e.target.closest("input") ||
            e.target.closest("select") ||
            e.target.closest("textarea") ||
            e.target.closest("label");

        if (isInteractive) return;
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

// ===== DnD =====

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

// ===== START =====

loadTasks();
