// ===== ENUMS & KONFIG =====

const Status = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    ARCHIVED: "ARCHIVED"
};

const STATUS_FLOW = [Status.TODO, Status.IN_PROGRESS, Status.DONE];
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

// global lister
let adminTasks = [];
let users = [];

// sort state
let sortBy = "id";     // "id" | "user" | "priority"
let sortDir = "asc";   // "asc" | "desc"

// edit state
let editingTaskId = null;

// ===== HENT BRUGERE =====

async function loadUsers() {
    try {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error("Fejl ved hentning af brugere: " + response.status);

        const data = await response.json();

        users = data.map(u => ({
            id: u.id,
            name: u.name ?? u.fullName ?? u.username ?? `Bruger ${u.id}`
        }));

        populateUserSelect(users);
        renderTaskTable(); // så bruger-kolonnen viser navn
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

// ===== HENT TASKS =====

async function loadAdminTasks() {
    try {
        const response = await fetch("/api/tasks");
        if (!response.ok) throw new Error("Fejl ved hentning af tasks: " + response.status);

        const data = await response.json();

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

    const assignedToId = Number(userSelect?.value);
    const title = titleInput?.value.trim();
    const description = descInput?.value.trim();
    const priority = priorityInput ? priorityInput.value : null;
    const deadline = deadlineInput && deadlineInput.value ? deadlineInput.value : null;

    if (!assignedToId || !title || !description) {
        alert("Bruger, titel og beskrivelse skal udfyldes.");
        return;
    }

    const payload = { title, description, assignedToId };
    if (priority) payload.priority = priority;
    if (deadline) payload.deadline = deadline; // yyyy-MM-dd

    try {
        const response = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Fejl ved oprettelse af task: " + response.status);

        await loadAdminTasks();
        event.target.reset();
    } catch (err) {
        console.error(err);
        alert("Kunne ikke oprette task. Se console for detaljer.");
    }
}

// ===== PATCH STATUS =====

async function updateTaskStatus(id, newStatus) {
    try {
        const response = await fetch(`/api/tasks/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error("Fejl ved opdatering af status: " + response.status);

        const updated = await response.json();

        const idx = adminTasks.findIndex(t => t.id === id);
        if (idx !== -1) adminTasks[idx].status = updated.status;

        renderTaskTable();
    } catch (err) {
        console.error(err);
        alert("Kunne ikke opdatere status. Se console.");
    }
}

// ===== PUT INLINE EDIT =====

async function updateTaskInline(id, payload) {
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Fejl ved redigering af task: " + response.status);

        editingTaskId = null;
        await loadAdminTasks();
    } catch (err) {
        console.error(err);
        alert("Kunne ikke gemme ændringer. Se console.");
    }
}

// ===== ARCHIVE =====

async function archiveTask(id) {
    if (!confirm("Er du sikker på at du vil arkivere denne task?")) return;

    try {
        const response = await fetch(`/api/tasks/${id}/archive`, { method: "PATCH" });
        if (!response.ok) throw new Error("Fejl ved arkivering af task: " + response.status);

        const archived = await response.json();

        const idx = adminTasks.findIndex(t => t.id === id);
        if (idx !== -1) adminTasks[idx].status = archived.status;

        renderTaskTable();
    } catch (err) {
        console.error(err);
        alert("Kunne ikke arkivere task. Se console.");
    }
}

// ===== SORTERING =====

function getUserLabelForSort(assignedToId) {
    const user = users.find(u => u.id === assignedToId);
    return user ? (user.name || "").toLowerCase() : "";
}

function priorityRank(p) {
    switch (p) {
        case "HIGH": return 3;
        case "MEDIUM": return 2;
        case "LOW": return 1;
        default: return 0;
    }
}

function getSortedTasks(tasksArr) {
    const dir = sortDir === "asc" ? 1 : -1;

    return [...tasksArr].sort((a, b) => {
        if (sortBy === "id") return (a.id - b.id) * dir;

        if (sortBy === "user") {
            const an = getUserLabelForSort(a.assignedToId);
            const bn = getUserLabelForSort(b.assignedToId);
            if (an < bn) return -1 * dir;
            if (an > bn) return 1 * dir;
            return ((a.assignedToId ?? 0) - (b.assignedToId ?? 0)) * dir;
        }

        if (sortBy === "priority") {
            const ap = priorityRank(a.priority);
            const bp = priorityRank(b.priority);
            return (ap - bp) * dir;
        }

        return 0;
    });
}

// ===== RENDERING =====

function renderTaskTable() {
    const tbody = document.querySelector("#task-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const sortedTasks = getSortedTasks(adminTasks);

    sortedTasks.forEach(task => {
        const tr = document.createElement("tr");
        tr.dataset.taskId = task.id;

        const user = users.find(u => u.id === task.assignedToId);
        const userCellText = user
            ? `${user.name} (ID: ${user.id})`
            : (task.assignedToId != null ? `ID: ${task.assignedToId}` : "-");

        const isEditing = task.id === editingTaskId;

        const titleCell = isEditing
            ? `<input class="table-input edit-title" value="${escapeHtml(task.title)}">`
            : escapeHtml(task.title);

        const descCell = isEditing
            ? `<textarea class="table-textarea edit-desc" rows="2">${escapeHtml(task.description)}</textarea>`
            : escapeHtml(task.description);

        const priorityCell = isEditing
            ? `
              <select class="table-select edit-priority">
                <option value="">-</option>
                ${PRIORITIES.map(p => `<option value="${p}" ${task.priority === p ? "selected" : ""}>${p}</option>`).join("")}
              </select>
              `
            : (task.priority ?? "-");

        const deadlineCell = isEditing
            ? `<input type="date" class="table-input edit-deadline" value="${task.deadline ?? ""}">`
            : (task.deadline ?? "-");

        const statusDisabled = isEditing ? "disabled" : "";
        const statusCell = `
            <select data-task-id="${task.id}" class="status-select" ${statusDisabled}>
                ${STATUS_FLOW.map(st =>
            `<option value="${st}" ${task.status === st ? "selected" : ""}>${st}</option>`
        ).join("")}
                <option value="ARCHIVED" ${task.status === Status.ARCHIVED ? "selected" : ""}>ARCHIVED</option>
            </select>
        `;

        const actionsCell = isEditing
            ? `
              <button class="action-btn save-btn" data-task-id="${task.id}">Gem</button>
              <button class="action-btn cancel-btn" data-task-id="${task.id}">Annullér</button>
              `
            : `
              <button class="action-btn edit-btn" data-task-id="${task.id}">Redigér</button>
              <button class="action-btn archive-btn" data-task-id="${task.id}">Arkivér</button>
              `;

        tr.innerHTML = `
            <td>${task.id}</td>
            <td>${escapeHtml(userCellText)}</td>
            <td>${titleCell}</td>
            <td>${descCell}</td>
            <td>${priorityCell}</td>
            <td>${deadlineCell}</td>
            <td>${statusCell}</td>
            <td>${actionsCell}</td>
        `;

        tbody.appendChild(tr);
    });

    // --- status change (PATCH) ---
    document.querySelectorAll(".status-select").forEach(select => {
        select.addEventListener("change", e => {
            const id = Number(e.target.getAttribute("data-task-id"));
            const newStatus = e.target.value;

            if (editingTaskId === id) return;

            if (newStatus === Status.ARCHIVED) {
                archiveTask(id);
            } else {
                updateTaskStatus(id, newStatus);
            }
        });
    });

    // --- edit mode ---
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            const id = Number(e.target.getAttribute("data-task-id"));
            editingTaskId = id;
            renderTaskTable();
        });
    });

    // --- cancel ---
    document.querySelectorAll(".cancel-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            editingTaskId = null;
            renderTaskTable();
        });
    });

    // --- save (PUT) ---
    document.querySelectorAll(".save-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            const id = Number(e.target.getAttribute("data-task-id"));
            const row = document.querySelector(`tr[data-task-id="${id}"]`);
            if (!row) return;

            const title = row.querySelector(".edit-title")?.value.trim();
            const description = row.querySelector(".edit-desc")?.value.trim();
            const priority = row.querySelector(".edit-priority")?.value || null;
            const deadline = row.querySelector(".edit-deadline")?.value || null;

            if (!title || !description) {
                alert("Titel og beskrivelse må ikke være tom.");
                return;
            }

            // Partial update er OK i din UpdateTaskRequest (nullable)
            const payload = { title, description, priority, deadline };
            updateTaskInline(id, payload);
        });
    });

    // --- archive (PATCH) ---
    document.querySelectorAll(".archive-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            const id = Number(e.target.getAttribute("data-task-id"));
            archiveTask(id);
        });
    });
}

// ===== HELPERS =====

function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ===== INIT =====

function setupAdminPage() {
    const form = document.getElementById("create-task-form");
    if (form) form.addEventListener("submit", createTaskFromForm);

    // sort UI
    const sortBySelect = document.getElementById("sort-by");
    const sortDirBtn = document.getElementById("sort-dir");

    if (sortBySelect) {
        sortBySelect.value = sortBy;
        sortBySelect.addEventListener("change", (e) => {
            sortBy = e.target.value;
            renderTaskTable();
        });
    }

    if (sortDirBtn) {
        sortDirBtn.dataset.dir = sortDir;
        sortDirBtn.textContent = (sortDir === "asc") ? "Stigende ↑" : "Faldende ↓";
        sortDirBtn.addEventListener("click", () => {
            sortDir = (sortDir === "asc") ? "desc" : "asc";
            sortDirBtn.dataset.dir = sortDir;
            sortDirBtn.textContent = (sortDir === "asc") ? "Stigende ↑" : "Faldende ↓";
            renderTaskTable();
        });
    }

    loadUsers();
    loadAdminTasks();
}

document.addEventListener("DOMContentLoaded", setupAdminPage);
