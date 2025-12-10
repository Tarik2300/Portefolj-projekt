// ===== ENUMS & KONFIG =====

const Status = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    ARCHIVED: "ARCHIVED"
};

const STATUS_FLOW = [Status.TODO, Status.IN_PROGRESS, Status.DONE];

let adminTasks = [];

// ===== API-KALD =====

async function loadAdminTasks() {
    try {
        const response = await fetch("/api/tasks");
        if (!response.ok) {
            throw new Error("Fejl ved hentning af tasks: " + response.status);
        }

        const data = await response.json();
        console.log("ADMIN raw tasks:", data);

        // Mapper TaskResponse -> simpelt admin-objekt
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

// Opret ny task via POST /api/tasks
async function createTaskFromForm(event) {
    event.preventDefault();

    const userSelect = document.getElementById("user-select");
    const titleInput = document.getElementById("task-title");
    const descInput = document.getElementById("task-desc");
    const priorityInput = document.getElementById("task-priority");  // dropdown
    const deadlineInput = document.getElementById("task-deadline");  // date

    const assignedToId = Number(userSelect.value);
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
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

    if (priority) {
        payload.priority = priority;
    }
    if (deadline) {
        payload.deadline = deadline;
    }

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
    } catch (err) {
        console.error("Kunne ikke hente brugere", err);
    }
}

function populateUserSelect(users) {
    const select = document.getElementById("user-select");
    if (!select) return;

    // behold første "Vælg medarbejder..." option
    select.innerHTML = '<option value="">Vælg medarbejder...</option>';

    users.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = u.name;
        select.appendChild(opt);
    });
}


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

// Arkivér task
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

// ===== RENDERING =====

function renderTaskTable() {
    const tbody = document.querySelector("#task-table tbody");
    if (!tbody) {
        console.error("Kunne ikke finde <tbody> for task-table");
        return;
    }

    tbody.innerHTML = "";

    adminTasks.forEach(task => {
        const tr = document.createElement("tr");

        const deadlineText = task.deadline ? task.deadline : "-";

        tr.innerHTML = `
            <td>${task.id}</td>
            <td>${task.assignedToId ?? "-"}</td>
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

    loadUsers();
    loadAdminTasks();
}

document.addEventListener("DOMContentLoaded", setupAdminPage);