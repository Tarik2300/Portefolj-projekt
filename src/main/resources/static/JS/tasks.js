// Status enum – samme som i backend
const Status = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    ARCHIVED: "ARCHIVED"
};

// midlertidig “logget ind” bruger
const currentUserId = 1;

// TESTDATA (kan senere skiftes til data fra backend)
let tasks = [
    {
        id: 1,
        title: "Udarbejde rapport",
        description: "Afleveres tirsdag",
        status: Status.TODO,
        userId: 1,
        subtasks: [
            { id: 11, title: "Indsamle data", status: Status.DONE },
            { id: 12, title: "Skrive konklusion", status: Status.IN_PROGRESS },
            { id: 13, title: "Gammelt afsnit", status: Status.ARCHIVED }
        ]
    },
    {
        id: 2,
        title: "Implementere login",
        description: "Bruger + roller",
        status: Status.IN_PROGRESS,
        userId: 1,
        subtasks: [
            { id: 21, title: "Sætte endpoints op", status: Status.TODO }
        ]
    }
];

// ---------- HELPERS TIL RENDER ----------

function createSubtaskRow(task, subtask) {
    const row = document.createElement("div");
    row.classList.add("subtask-row");

    const label = document.createElement("span");
    label.textContent = subtask.title;

    // dropdown til subtask-status
    const select = document.createElement("select");
    [Status.TODO, Status.IN_PROGRESS, Status.DONE].forEach(st => {
        const opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st;
        select.appendChild(opt);
    });
    select.value = subtask.status;
    select.onchange = () => {
        subtask.status = select.value;
        //PUT /api/subtasks/{id}
        renderTasks();
    };

    const archiveBtn = document.createElement("button");
    archiveBtn.textContent = "Arkivér";
    archiveBtn.classList.add("subtask-archive-btn");
    archiveBtn.onclick = () => {
        subtask.status = Status.ARCHIVED;
        //PUT /api/subtasks/{id}/archive
        renderTasks();
    };

    row.appendChild(label);
    row.appendChild(select);
    row.appendChild(archiveBtn);
    return row;
}

// --------- Opret ét task-kort ---------

function createTaskCard(task) {
    const card = document.createElement("div");
    card.classList.add("task-card");

    // ----- HEADER -----
    const header = document.createElement("div");
    header.classList.add("task-header");

    const titleEl = document.createElement("div");
    titleEl.classList.add("task-title");
    titleEl.textContent = task.title;

    const descEl = document.createElement("div");
    descEl.classList.add("task-desc");
    descEl.textContent = task.description;

    const statusBadge = document.createElement("span");
    statusBadge.classList.add("task-status-badge");
    statusBadge.textContent = task.status;

    header.appendChild(titleEl);
    header.appendChild(descEl);
    header.appendChild(statusBadge);

    header.addEventListener("click", () => {
        card.classList.toggle("expanded");
    });

    card.appendChild(header);

    // ----- DETAILS -----
    const details = document.createElement("div");
    details.classList.add("task-details");

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
        task.subtasks.push({
            id: Date.now(),
            title: input.value.trim(),
            status: Status.TODO
        });
        input.value = "";
        //POST /api/tasks/{taskId}/subtasks
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
    [Status.TODO, Status.IN_PROGRESS, Status.DONE].forEach(st => {
        const opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st;
        statusSelect.appendChild(opt);
    });
    statusSelect.value = task.status;

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Gem";
    saveBtn.classList.add("task-status-save-btn");
    saveBtn.onclick = () => {
        task.status = statusSelect.value;
        //PUT /api/tasks/{id}
        renderTasks();
    };

    statusBar.appendChild(statusText);
    statusBar.appendChild(statusSelect);
    statusBar.appendChild(saveBtn);
    details.appendChild(statusBar);

    card.appendChild(details);

    // så vi kan finde kortet igen efter re-render hvis du vil
    card.dataset.taskId = task.id;

    return card;
}

// --------- RENDER ---------

function renderTasks() {
    const todoCol = document.getElementById("todo-column");
    const inprogressCol = document.getElementById("inprogress-column");
    const doneCol = document.getElementById("done-column");

    todoCol.innerHTML = "";
    inprogressCol.innerHTML = "";
    doneCol.innerHTML = "";

    tasks
        .filter(t => t.userId === currentUserId && t.status !== Status.ARCHIVED)
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
            }
        });
}

renderTasks();
