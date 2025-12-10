const Status = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    ARCHIVED: "ARCHIVED"
};

// midlertidig "fælles" liste – i virkeligheden vil backend levere den
let tasks = [
    {
        id: 1,
        title: "Udarbejde rapport",
        description: "Afleveres tirsdag",
        status: Status.TODO,
        userId: 1,
        subtasks: []
    },
    {
        id: 2,
        title: "Implementere login",
        description: "Bruger + roller",
        status: Status.IN_PROGRESS,
        userId: 2,
        subtasks: []
    }
];

function renderTaskTable() {
    const tbody = document.querySelector("#task-table tbody");
    tbody.innerHTML = "";

    tasks.forEach(task => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${task.id}</td>
            <td>${task.userId}</td>
            <td>${task.title}</td>
            <td>
                <select data-task-id="${task.id}" class="status-select">
                    <option value="TODO"${task.status === Status.TODO ? " selected" : ""}>TODO</option>
                    <option value="IN_PROGRESS"${task.status === Status.IN_PROGRESS ? " selected" : ""}>IN_PROGRESS</option>
                    <option value="DONE"${task.status === Status.DONE ? " selected" : ""}>DONE</option>
                    <option value="ARCHIVED"${task.status === Status.ARCHIVED ? " selected" : ""}>ARCHIVED</option>
                </select>
            </td>
            <td>
                <button class="action-btn archive-btn" data-task-id="${task.id}">Arkivér</button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // hæft events efter vi har indsat rækker
    document.querySelectorAll(".status-select").forEach(select => {
        select.addEventListener("change", e => {
            const id = Number(e.target.getAttribute("data-task-id"));
            const task = tasks.find(t => t.id === id);
            task.status = e.target.value;
            // senere: PUT /api/tasks/{id}
        });
    });

    document.querySelectorAll(".archive-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            const id = Number(e.target.getAttribute("data-task-id"));
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.status = Status.ARCHIVED;
                renderTaskTable();
                // senere: PUT /api/tasks/{id}/archive
            }
        });
    });
}

function setupCreateForm() {
    const form = document.getElementById("create-task-form");

    form.addEventListener("submit", e => {
        e.preventDefault();

        const userId = Number(document.getElementById("user-select").value);
        const title = document.getElementById("task-title").value.trim();
        const desc = document.getElementById("task-desc").value.trim();
        const status = document.getElementById("task-status").value;

        if (!title || !desc) return;

        const newTask = {
            id: Date.now(),   // midlertidig ID
            title,
            description: desc,
            status,
            userId,
            subtasks: []
        };

        tasks.push(newTask);
        renderTaskTable();

        form.reset();

        // senere: POST /api/tasks
    });
}

setupCreateForm();
renderTaskTable();
