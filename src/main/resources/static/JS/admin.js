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

        // render tabellen igen, så "Bruger"-kolonnen kan vise navn + ID
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

    const assignedToId = Number(userSelect?.value);
    const title = titleInput?.value.trim();
    const description = descInput?.value.trim();
    const priority = priorityInput ? priorityInput.value : null;
    const deadline = deadlineInput && deadlineInput.value ? deadlineInput.value : null;

    if (!assignedToId || !title || !description) {
        alert("Bruger, titel og beskrivelse skal udfyldes.");
        return;
    }

    const payload = {
        title: title,
        description: description,
        assignedToId: assignedToId
    };

    if (priority) payload.priority = priority;
    if (deadline) payload.deadline = deadline; // yyyy-MM-dd → LocalDate

    try {
        const response = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Fejl ved oprettelse af task: " + response.status);
        }

        const created = await response.json();
        console.log("Oprettet task:", created);

        await loadAdminTasks();
        event.target.reset();
    } catch (err) {
        console.error(err);
        alert("Kunne ikke oprette task. Se console for detaljer.");
    }
}

// ===== OPDATER & ARKIVÉR TASKS =====

async function updateTaskStatus(id, newStatus) {
    try {
        const response = await fetch(`/api/tasks/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error("Fejl ved opdatering af status: " + response.status);
        }

        const updated = await response.json();
        console.log("Opdateret task:", updated);

        const idx = adminTasks.findIndex(t => t.id === id);
        if (idx !== -1) {
            adminTasks[idx].status = updated.status;
        }

        renderTaskTable();
    } catch (err) {
        console.error(err);
        alert("Kunne ikke opdatere status. Se console.");
    }
}

async function archiveTask(id) {
    if (!confirm("Er du sikker på at du vil arkivere denne task?")) {
        return;
    }

    try {
        const response = await fetch(`/api/tasks/${id}/archive`, {
            method: "PATCH"
        });

        if (!response.ok) {
            throw new Error("Fejl ved arkivering af task: " + response.status);
        }

        const archived = await response.json();
        console.log("Arkiveret task:", archived);

        const idx = adminTasks.findIndex(t => t.id === id);
        if (idx !== -1) {
            adminTasks[idx].status = archived.status;
        }

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
        if (sortBy === "id") {
            return (a.id - b.id) * dir;
        }

        if (sortBy === "user") {
            const an = getUserLabelForSort(a.assignedToId);
            const bn = getUserLabelForSort(b.assignedToId);

            if (an < bn) return -1 * dir;
            if (an > bn) return 1 * dir;

            // fallback: sortér på ID hvis navne er ens/ukendt
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
    if (!tbody) {
        console.error("Kunne ikke finde <tbody> for task-table");
        return;
    }

    tbody.innerHTML = "";

    const sortedTasks = getSortedTasks(adminTasks);

    sortedTasks.forEach(task => {
        const tr = document.createElement("tr");

        const user = users.find(u => u.id === task.assignedToId);
        const userCellText = user
            ? `${user.name} (ID: ${user.id})`
            : (task.assignedToId != null ? `ID: ${task.assignedToId}` : "-");

        const deadlineText = task.deadline ? task.deadline : "-";

        tr.innerHTML = `
            <td>${task.id}</td>
            <td>${userCellText}</td>
            <td>${task.title}</td>
            <td>${task.description}</td>
            <td>${task.priority ?? "-"}</td>
            <td>${deadlineText}</td>
            <td>
                <select data-task-id="${task.id}" class="status-select">
                    ${STATUS_FLOW.map(st =>
            `<option value="${st}" ${task.status === st ? "selected" : ""}>${st}</option>`
        ).join("")}
                    <option value="ARCHIVED" ${task.status === Status.ARCHIVED ? "selected" : ""}>ARCHIVED</option>
                </select>
            </td>
            <td>
                <button class="action-btn archive-btn" data-task-id="${task.id}">Arkivér</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // events til status-selects
    document.querySelectorAll(".status-select").forEach(select => {
        select.addEventListener("change", e => {
            const id = Number(e.target.getAttribute("data-task-id"));
            const newStatus = e.target.value;
            if (newStatus === Status.ARCHIVED) {
                archiveTask(id);
            } else {
                updateTaskStatus(id, newStatus);
            }
        });
    });

    // events til arkivér-knapper
    document.querySelectorAll(".archive-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            const id = Number(e.target.getAttribute("data-task-id"));
            archiveTask(id);
        });
    });
}

// ===== INIT =====

function setupAdminPage() {
    const form = document.getElementById("create-task-form");
    if (form) {
        form.addEventListener("submit", createTaskFromForm);
    }

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
