// Status enum på frontend – matcher backend
const Status = {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
    ARCHIVED: "ARCHIVED"
};

// midlertidigt: antag at den loggede bruger har id = 1
const currentUserId = 1;

// TESTDATA – struktur som backend senere skal returnere
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
        subtasks: []
    }
];

// -------- Rendering --------

function createSubtaskRow(task, subtask) {
    const row = document.createElement("div");
    row.classList.add("subtask-row");
    row.textContent = subtask.title;

    const btn = document.createElement("button");
    btn.textContent = "Arkivér";
    btn.classList.add("subtask-archive-btn");
    btn.onclick = () => archiveSubtask(task, subtask);

    row.appendChild(btn);
    return row;
}

function createTaskCard(task) {
    const card = document.createElement("div");
    card.classList.add("task-card");

    const titleEl = document.createElement("div");
    titleEl.classList.add("task-title");
    titleEl.textContent = task.title;

    const descEl = document.createElement("div");
    descEl.classList.add("task-desc");
    descEl.textContent = task.description;

    card.appendChild(titleEl);
    card.appendChild(descEl);

    // subtasks liste
    const subtaskContainer = document.createElement("div");
    subtaskContainer.classList.add("subtask-container");

    task.subtasks
        .filter(st => st.status !== Status.ARCHIVED)
        .forEach(st => {
            subtaskContainer.appendChild(createSubtaskRow(task, st));
        });

    card.appendChild(subtaskContainer);

    // input + knap til ny subtask
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
        if (input.value.trim() === "") return;
        addSubtask(task, input.value.trim());
        input.value = "";
    };

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(addBtn);
    card.appendChild(inputWrapper);

    return card;
}

function renderTasks() {
    const todoCol = document.getElementById("todo-column");
    const inprogressCol = document.getElementById("inprogress-column");
    const doneCol = document.getElementById("done-column");

    todoCol.innerHTML = "";
    inprogressCol.innerHTML = "";
    doneCol.innerHTML = "";

    // kun tasks til den aktuelle bruger og ikke ARCHIVED
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

// -------- Actions --------

function addSubtask(task, title) {
    const newId = Date.now(); // midlertidig ID
    task.subtasks.push({
        id: newId,
        title: title,
        status: Status.TODO
    });

    // senere: POST /api/tasks/{taskId}/subtasks
    renderTasks();
}

function archiveSubtask(task, subtask) {
    subtask.status = Status.ARCHIVED;
    // senere: PUT /api/subtasks/{id}/archive
    renderTasks();
}

// initial rendering
renderTasks();
