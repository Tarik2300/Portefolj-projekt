// ===== ENUMS & KONFIG =====

const Status = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    ARCHIVED: "ARCHIVED"
};

const STATUS_FLOW = [Status.TODO, Status.IN_PROGRESS, Status.DONE];

// global lister
let adminTasks = [];
let users = [];

// sort state
let sortBy = "id";     // "id" | "user" | "priority"
let sortDir = "asc";   // "asc" | "desc"

// filter state
let filterUserId = null;   // number | null
let filterStatus = null;   // string | null

// ===== HENT BRUGERE =====

async function loadUsers() {
    try {
        const response = await fetch("/api/users");
        if (!response.ok) {
            throw new Error("Fejl ved hentning af brugere: " + response.status);
        }

        const data = await response.json();
        console.log("ADMIN users:", data);

        users = data.map(u => ({
            id: u.id,
            name: u.name ?? u.fullName ?? u.username ?? `Bruger ${u.id}`
        }));

        populateUserSelect(users);
        populateFilterUsers(users);

        renderTaskTable();
    } catch (err) {
        console.error("Kunne ikke hente brugere", err);
    }
}

function populateUserSelect(users) {
    const select = document.getElementById("user-select");
    if (!select) return;

    select.innerHTML = '<option value="">Vælg medarbejder...</option>';

    users.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = `${u.name} (ID: ${u.id})`;
        select.appendChild(opt);
    });
}

function populateFilterUsers(users) {
    const select = document.getElementById("filter-user");
    if (!select) return;

    select.innerHTML = '<option value="">Alle</option>';

    users.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = `${u.name} (ID: ${u.id})`;
        select.appendChild(opt);
    });
}

// ===== HENT TASKS =====

async function loadAdminTasks() {
    try {
        const response = await fetch("/api/tasks");
        if (!response.ok) {
            throw new Error("Fejl ved hentning af tasks: " + response.status);
        }

        const data = await response.json();
        console.log("ADMIN raw tasks:", data);

        adminTasks = data.map(t => ({
            id: t.id,
            title: t.title ?? t.name ?? "(ingen titel)",
            description: t.description ?? "",
            status: t.status,
            priority: t.priority ?? null,
            deadline: t.deadline ?? null,
            assignedToId: t.assignedToId ?? t.userId ?? t.assignedTo?.id ?? null
        }));

        renderTaskTable();
    } catch (err) {
        console.error("Fejl i loadAdminTasks:", err);
    }
}

// ===== OPRET TASK =====

async function createTaskFromForm(event) {
    event.preventDefault();

    const userSelect = document.getElementById("user-select");
    const titleInput = document.getElementById("task-title");
    const descInput = document.getElementById("task-desc");
    const priorityInput = document.getElementById("task-priority");
    const deadlineInput = document.getElementById("task-deadline");

    const assignedToId = Number(userSelect.value);
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const priority = priorityInput.value || null;
    const deadline = deadlineInput.value || null;

    if (!assignedToId || !title || !description) {
        alert("Bruger, titel og beskrivelse skal udfyldes.");
        return;
    }

    const payload = { title, description, assignedToId };
    if (priority) payload.priority = priority;
    if (deadline) payload.deadline = deadline;

    try {
        const response = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Fejl ved oprettelse af task");
        }

        await loadAdminTasks();
        event.target.reset();
    } catch (err) {
        console.error(err);
        alert("Kunne ikke oprette task");
    }
}

// ===== OPDATER & ARKIVÉR =====

async function updateTaskStatus(id, newStatus) {
    try {
        const response = await fetch(`/api/tasks/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error();

        const idx = adminTasks.findIndex(t => t.id === id);
        if (idx !== -1) adminTasks[idx].status = newStatus;

        renderTaskTable();
    } catch {
        alert("Kunne ikke opdatere status");
    }
}

async function archiveTask(id) {
    if (!confirm("Er du sikker?")) return;

    try {
        const response = await fetch(`/api/tasks/${id}/archive`, { method: "PATCH" });
        if (!response.ok) throw new Error();

        const idx = adminTasks.findIndex(t => t.id === id);
        if (idx !== -1) adminTasks[idx].status = Status.ARCHIVED;

        renderTaskTable();
    } catch {
        alert("Kunne ikke arkivere task");
    }
}

// ===== SORTERING =====

function getUserLabelForSort(assignedToId) {
    const user = users.find(u => u.id === assignedToId);
    return user ? user.name.toLowerCase() : "";
}

function priorityRank(p) {
    return p === "HIGH" ? 3 : p === "MEDIUM" ? 2 : p === "LOW" ? 1 : 0;
}

function getSortedTasks(tasksArr) {
    const dir = sortDir === "asc" ? 1 : -1;

    return [...tasksArr].sort((a, b) => {
        if (sortBy === "id") return (a.id - b.id) * dir;
        if (sortBy === "user") return getUserLabelForSort(a.assignedToId).localeCompare(getUserLabelForSort(b.assignedToId)) * dir;
        if (sortBy === "priority") return (priorityRank(a.priority) - priorityRank(b.priority)) * dir;
        return 0;
    });
}

// ===== RENDERING =====

function renderTaskTable() {
    const tbody = document.querySelector("#task-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    let filtered = adminTasks;

    if (filterUserId !== null) {
        filtered = filtered.filter(t => t.assignedToId === filterUserId);
    }

    if (filterStatus !== null) {
        filtered = filtered.filter(t => t.status === filterStatus);
    }

    const sortedTasks = getSortedTasks(filtered);

    sortedTasks.forEach(task => {
        const user = users.find(u => u.id === task.assignedToId);
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${task.id}</td>
            <td>${user ? user.name : "-"}</td>
            <td>${task.title}</td>
            <td>${task.description}</td>
            <td>${task.priority ?? "-"}</td>
            <td>${task.deadline ?? "-"}</td>
            <td>
                <select data-task-id="${task.id}" class="status-select">
                    ${STATUS_FLOW.map(st => `<option ${st === task.status ? "selected" : ""}>${st}</option>`).join("")}
                    <option ${task.status === Status.ARCHIVED ? "selected" : ""}>ARCHIVED</option>
                </select>
            </td>
            <td><button class="archive-btn" data-task-id="${task.id}">Arkivér</button></td>
        `;

        tbody.appendChild(tr);
    });

    document.querySelectorAll(".status-select").forEach(s =>
        s.onchange = e => updateTaskStatus(Number(e.target.dataset.taskId), e.target.value)
    );

    document.querySelectorAll(".archive-btn").forEach(b =>
        b.onclick = e => archiveTask(Number(e.target.dataset.taskId))
    );
}

// ===== INIT =====

function setupAdminPage() {
    document.getElementById("create-task-form")?.addEventListener("submit", createTaskFromForm);

    document.getElementById("sort-by")?.addEventListener("change", e => {
        sortBy = e.target.value;
        renderTaskTable();
    });

    document.getElementById("sort-dir")?.addEventListener("click", e => {
        sortDir = sortDir === "asc" ? "desc" : "asc";
        e.target.textContent = sortDir === "asc" ? "Stigende ↑" : "Faldende ↓";
        renderTaskTable();
    });

    document.getElementById("filter-user")?.addEventListener("change", e => {
        filterUserId = e.target.value ? Number(e.target.value) : null;
        renderTaskTable();
    });

    document.getElementById("filter-status")?.addEventListener("change", e => {
        filterStatus = e.target.value || null;
        renderTaskTable();
    });

    loadUsers();
    loadAdminTasks();
}

document.addEventListener("DOMContentLoaded", setupAdminPage);
