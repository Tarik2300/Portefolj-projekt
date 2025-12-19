// ===== ENUMS & KONFIG =====

const Status = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    ARCHIVED: "ARCHIVED"
};

const STATUS_FLOW = [Status.TODO, Status.IN_PROGRESS, Status.DONE];
const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

// login
const currentUserId = Number(sessionStorage.getItem("userId"));
const currentUserRole = sessionStorage.getItem("userRole");

// global lister
let adminTasks = [];
let users = [];

// sort state
let sortBy = "id";     // "id" | "user" | "priority"
let sortDir = "asc";   // "asc" | "desc"

// filter state
let filterUserId = null;   // number | null
let filterStatus = null;   // string | null

// edit state (hvilke rows er i edit mode)
const editingRows = new Set(); // taskId
const draftById = new Map();   // taskId -> draft object

// ===== HELPERS =====

function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getUserName(userId) {
    const u = users.find(x => x.id === userId);
    return u ? u.name : "-";
}

function priorityRank(p) {
    return p === "HIGH" ? 3 : p === "MEDIUM" ? 2 : p === "LOW" ? 1 : 0;
}

function getSortedTasks(tasksArr) {
    const dir = sortDir === "asc" ? 1 : -1;

    return [...tasksArr].sort((a, b) => {
        if (sortBy === "id") return (a.id - b.id) * dir;
        if (sortBy === "user") return getUserName(a.assignedToId).toLowerCase()
            .localeCompare(getUserName(b.assignedToId).toLowerCase()) * dir;
        if (sortBy === "priority") return (priorityRank(a.priority) - priorityRank(b.priority)) * dir;
        return 0;
    });
}

function normalizeTask(t) {
    return {
        id: t.id,
        title: t.title ?? t.name ?? "(ingen titel)",
        description: t.description ?? "",
        status: t.status,
        priority: t.priority ?? null,
        deadline: t.deadline ?? null,
        assignedToId: t.assignedToId ?? t.userId ?? t.assignedTo?.id ?? null
    };
}

// ===== API =====

async function loadUsers() {
    try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Fejl ved hentning af brugere: " + res.status);

        const data = await res.json();
        users = (data ?? []).map(u => ({
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

async function loadAdminTasks() {
    try {
        const res = await fetch("/api/tasks");
        if (!res.ok) throw new Error("Fejl ved hentning af tasks: " + res.status);

        const data = await res.json();
        adminTasks = (data ?? []).map(normalizeTask);

        renderTaskTable();
    } catch (err) {
        console.error("Fejl i loadAdminTasks:", err);
    }
}

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
        const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Fejl ved oprettelse af task");

        await loadAdminTasks();
        event.target.reset();
    } catch (err) {
        console.error(err);
        alert("Kunne ikke oprette task");
    }
}

async function updateTaskPut(id, payload) {
    // Hvis din backend også kræver userId her, behold query-param.
    const url = currentUserId ? `/api/tasks/${id}?userId=${currentUserId}` : `/api/tasks/${id}`;

    const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Kunne ikke gemme ændringer (" + res.status + ")");

    // Hvis din controller returnerer TaskResponse, så opdater lokalt:
    const updated = await res.json();
    return normalizeTask(updated);
}

async function updateTaskStatus(id, newStatus) {
    const res = await fetch(`/api/tasks/${id}/status?userId=${currentUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
    });

    if (!res.ok) throw new Error("Kunne ikke opdatere status (" + res.status + ")");
    const updated = await res.json();
    return normalizeTask(updated);
}

async function archiveTask(id) {
    if (!confirm("Er du sikker?")) return;

    const res = await fetch(`/api/tasks/${id}/archive?userId=${currentUserId}`, {
        method: "PATCH"
    });

    if (!res.ok) {
        alert("Kunne ikke arkivere task");
        return;
    }

    // hvis backend returnerer opdateret task:
    const updated = await res.json();
    const normalized = normalizeTask(updated);

    const idx = adminTasks.findIndex(t => t.id === id);
    if (idx !== -1) adminTasks[idx] = normalized;

    // Hvis den er archived, kan du evt fjerne den fra listen:
    // adminTasks = adminTasks.filter(t => t.status !== Status.ARCHIVED);

    renderTaskTable();
}

// ===== UI: dropdown population =====

function populateUserSelect(usersArr) {
    const select = document.getElementById("user-select");
    if (!select) return;

    select.innerHTML = '<option value="">Vælg medarbejder...</option>';
    usersArr.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = `${u.name} (ID: ${u.id})`;
        select.appendChild(opt);
    });
}

function populateFilterUsers(usersArr) {
    const select = document.getElementById("filter-user");
    if (!select) return;

    select.innerHTML = '<option value="">Alle</option>';
    usersArr.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = `${u.name} (ID: ${u.id})`;
        select.appendChild(opt);
    });
}

// ===== RENDERING =====

function renderTaskTable() {
    const tbody = document.querySelector("#task-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    let filtered = adminTasks;

    if (filterUserId !== null) filtered = filtered.filter(t => t.assignedToId === filterUserId);
    if (filterStatus !== null) filtered = filtered.filter(t => t.status === filterStatus);

    const sorted = getSortedTasks(filtered);

    sorted.forEach(task => {
        const isEditing = editingRows.has(task.id);
        const draft = draftById.get(task.id) ?? task;

        const tr = document.createElement("tr");

        tr.innerHTML = `
      <td>${task.id}</td>

      <td>
        ${
            isEditing
                ? `<select class="inline-user" data-task-id="${task.id}">
                 ${users.map(u => `<option value="${u.id}" ${Number(draft.assignedToId) === u.id ? "selected" : ""}>${escapeHtml(u.name)} (ID: ${u.id})</option>`).join("")}
               </select>`
                : `${escapeHtml(getUserName(task.assignedToId))} (ID: ${task.assignedToId ?? "-"})`
        }
      </td>

      <td>
        ${
            isEditing
                ? `<input class="inline-title" data-task-id="${task.id}" value="${escapeHtml(draft.title)}" />`
                : `${escapeHtml(task.title)}`
        }
      </td>

      <td>
        ${
            isEditing
                ? `<textarea class="inline-desc" data-task-id="${task.id}">${escapeHtml(draft.description)}</textarea>`
                : `${escapeHtml(task.description)}`
        }
      </td>

      <td>
        ${
            isEditing
                ? `<select class="inline-priority" data-task-id="${task.id}">
                <option value="">-</option>
                ${PRIORITIES.map(p => `<option value="${p}" ${draft.priority === p ? "selected" : ""}>${p}</option>`).join("")}
              </select>`
                : `${task.priority ?? "-"}`
        }
      </td>

      <td>
        ${
            isEditing
                ? `<input type="date" class="inline-deadline" data-task-id="${task.id}" value="${draft.deadline ?? ""}" />`
                : `${task.deadline ?? "-"}`
        }
      </td>

      <td>
        ${
            // Status vil du typisk gerne kunne ændre uden at gå i “edit mode”
            // men hvis du vil, kan du flytte den ind i edit-mode også.
            `<select class="status-select" data-task-id="${task.id}">
             ${STATUS_FLOW.map(st => `<option value="${st}" ${st === task.status ? "selected" : ""}>${st}</option>`).join("")}
           </select>`
        }
      </td>

      <td>
        ${
            isEditing
                ? `<button class="save-btn" data-task-id="${task.id}">Gem</button>
               <button class="cancel-btn" data-task-id="${task.id}">Annuller</button>`
                : `<button class="edit-btn" data-task-id="${task.id}">Redigér</button>`
        }
        <button class="archive-btn" data-task-id="${task.id}">Arkivér</button>
      </td>
    `;

        tbody.appendChild(tr);
    });

    // status ændres “live”
    document.querySelectorAll(".status-select").forEach(sel => {
        sel.onchange = async (e) => {
            const id = Number(e.target.dataset.taskId);
            const newStatus = e.target.value;

            try {
                const updated = await updateTaskStatus(id, newStatus);
                const idx = adminTasks.findIndex(t => t.id === id);
                if (idx !== -1) adminTasks[idx] = updated;

                // status skifter kan påvirke filter, så rerender
                renderTaskTable();
            } catch (err) {
                console.error(err);
                alert("Kunne ikke opdatere status");
                renderTaskTable(); // reset select til original
            }
        };
    });

    // redigér
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.onclick = (e) => {
            const id = Number(e.target.dataset.taskId);
            const original = adminTasks.find(t => t.id === id);
            if (!original) return;

            editingRows.add(id);
            // lav draft kopi
            draftById.set(id, { ...original });
            renderTaskTable();
        };
    });

    // annuller
    document.querySelectorAll(".cancel-btn").forEach(btn => {
        btn.onclick = (e) => {
            const id = Number(e.target.dataset.taskId);
            editingRows.delete(id);
            draftById.delete(id);
            renderTaskTable();
        };
    });

    // gem
    document.querySelectorAll(".save-btn").forEach(btn => {
        btn.onclick = async (e) => {
            const id = Number(e.target.dataset.taskId);
            const row = e.target.closest("tr");
            if (!row) return;

            const assignedToId = Number(row.querySelector(".inline-user")?.value) || null;
            const title = row.querySelector(".inline-title")?.value?.trim() ?? "";
            const description = row.querySelector(".inline-desc")?.value?.trim() ?? "";
            const priority = row.querySelector(".inline-priority")?.value || null;
            const deadline = row.querySelector(".inline-deadline")?.value || null;

            if (!assignedToId || !title || !description) {
                alert("Bruger, titel og beskrivelse skal udfyldes.");
                return;
            }

            const payload = { assignedToId, title, description, priority, deadline };

            try {
                const updated = await updateTaskPut(id, payload);
                const idx = adminTasks.findIndex(t => t.id === id);
                if (idx !== -1) adminTasks[idx] = updated;

                editingRows.delete(id);
                draftById.delete(id);
                renderTaskTable();
            } catch (err) {
                console.error(err);
                alert("Kunne ikke gemme ændringer");
            }
        };
    });

    // arkivér
    document.querySelectorAll(".archive-btn").forEach(btn => {
        btn.onclick = (e) => archiveTask(Number(e.target.dataset.taskId));
    });
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
