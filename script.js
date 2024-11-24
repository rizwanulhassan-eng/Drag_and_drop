const currentUsers = JSON.parse(localStorage.getItem("currentUsers")) || [];
const currentUsername = sessionStorage.getItem("currentUsername");

if (!currentUsername) {
    alert("Log in to access the Kanban board!");
    window.location.href = "login.html"; 
}

if (!currentUsers.includes(currentUsername)) {
    alert("You need to log in to access the Kanban board!");
    window.location.href = "login.html"; 
}

const board = document.getElementById("kanban-board");
const addColumnButton = document.querySelector(".add-column");
const modal = document.getElementById("task-modal");
const taskAssignee = document.getElementById("task-assignee"); 
const saveTaskButton = document.getElementById("save-task");
const logoutButton = document.getElementById("logout-button");

let allUsers = JSON.parse(localStorage.getItem("users")) || [];
let currentTask = null;
let taskAdder = null;


const taskTitleEditor = new Quill("#task-title-editor", {
    theme: "snow",
    placeholder: "Enter task title...",
    modules: {
        toolbar: [
            ["bold", "italic", "underline"], 
            [{ align: "" }, { align: "center" }, { align: "right" }] 
        ]
    }
});

const taskDescriptionEditor = new Quill("#task-description-editor", {
    theme: "snow",
    placeholder: "Enter task description...",
    modules: {
        toolbar: [
            ["bold", "italic", "underline"], 
            [{ align: "" }, { align: "center" }, { align: "right" }] 
        ]
    }
});


let boardData = JSON.parse(localStorage.getItem(`kanban-board-${currentUsername}`)) || [];


function saveBoardData() {
    localStorage.setItem(`kanban-board-${currentUsername}`, JSON.stringify(boardData));
}


function populateDropdown() {
    taskAssignee.innerHTML = `
        <option value="">Unassigned</option>
        ${allUsers
            .map(user => `<option value="${user.username}">${user.username}</option>`)
            .join("")}
    `;
}


function createColumn(columnData, columnIndex) {
    const column = document.createElement("div");
    column.className = "column";
    column.draggable = true;
    column.dataset.index = columnIndex; 
    column.innerHTML = `
        <div class="column-header">
            <input type="text" value="${columnData.title}" class="column-title" />
            <button class="remove-column">X</button>
        </div>
        <button class="add-task">Add Task</button>
        <div class="tasks"></div>
    `;

    column.querySelector(".column-title").addEventListener("input", (e) => {
        columnData.title = e.target.value;
        saveBoardData();
    });

    column.querySelector(".remove-column").addEventListener("click", () => {
        boardData = boardData.filter((_, i) => i !== columnIndex);
        saveBoardData();
        renderBoard();
    });

    column.querySelector(".add-task").addEventListener("click", () => {
        taskAdder = columnData;
        populateDropdown(); 
        taskAssignee.style.display = "block"; 
        modal.classList.add("active");
    });

    const tasksContainer = column.querySelector(".tasks");
    columnData.tasks.forEach((task) => {
        const taskElement = createTask(task, columnData);
        tasksContainer.appendChild(taskElement);
    });

    tasksContainer.addEventListener("dragover", (e) => e.preventDefault());
    tasksContainer.addEventListener("drop", (e) => {
        const taskId = e.dataTransfer.getData("task");
        if (taskId) {
            const task = JSON.parse(taskId);
            columnData.tasks.push(task);
            saveBoardData();
            renderBoard();
        }
    });

    column.addEventListener("dragstart", (e) => {
        if (e.target === column) {
            e.dataTransfer.setData("columnIndex", columnIndex);
        }
    });

    column.addEventListener("dragover", (e) => e.preventDefault());
    column.addEventListener("drop", (e) => {
        const fromIndex = e.dataTransfer.getData("columnIndex");
        if (fromIndex !== "" && fromIndex !== undefined) {
            const toIndex = columnIndex;

            if (fromIndex !== toIndex) {
                [boardData[fromIndex], boardData[toIndex]] = [boardData[toIndex], boardData[fromIndex]];
                saveBoardData();
                renderBoard();
            }
        }
    });

    board.appendChild(column);
}


function createTask(taskData, columnData) {
    const task = document.createElement("div");
    task.className = "task";
    task.draggable = true;

    task.innerHTML = `
    <div class="task-title">${taskData.title}</div>
    <div class="task-description">${taskData.description}</div>
    <div>Assigned to: <span class="task-assignee">${taskData.assignedTo || "Unassigned"}</span></div>
`;

    task.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("task", JSON.stringify(taskData));
        columnData.tasks = columnData.tasks.filter((t) => t !== taskData);
        saveBoardData();
    });

    task.addEventListener("click", () => {
        currentTask = { task: taskData, column: columnData };
        taskTitleEditor.setContents(taskTitleEditor.clipboard.convert(taskData.title));
        taskDescriptionEditor.setContents(taskDescriptionEditor.clipboard.convert(taskData.description));
        populateDropdown(); 
        taskAssignee.style.display = "block"; 
        taskAssignee.value = taskData.assignedTo || "";
        modal.classList.add("active");
    });

    return task;
}

// Render the board
function renderBoard() {
    board.innerHTML = "";
    boardData.forEach((columnData, index) => createColumn(columnData, index));
}

addColumnButton.addEventListener("click", () => {
    let userInput = prompt("Please enter the column name:");
    if (userInput != "") {
        const newColumn = { title: userInput, tasks: [] };
        boardData.push(newColumn);
        saveBoardData();
        renderBoard();
    } else {
        alert("You cancelled the prompt.");
    }
});

saveTaskButton.addEventListener("click", () => {
    const assignee = taskAssignee.value;
    const title = taskTitleEditor.root.innerHTML.trim(); 
    const description = taskDescriptionEditor.root.innerHTML.trim(); 

    if (currentTask) {
        currentTask.task.title = title;
        currentTask.task.description = description;
        currentTask.task.assignedTo = assignee; 
        saveBoardData();
        renderBoard();
        modal.classList.remove("active");
    } else if (taskAdder) {
        const task = {
            title,
            description,
            assignedTo: assignee, 
        };
        taskAdder.tasks.push(task);
        saveBoardData();
        renderBoard();
        modal.classList.remove("active");
    }

    taskTitleEditor.setText(""); 
    taskDescriptionEditor.setText(""); 
    taskAssignee.style.display = "none";
    currentTask = null;
    taskAdder = null;
});

logoutButton.addEventListener("click", () => {
    let currentUsers = JSON.parse(localStorage.getItem("currentUsers")) || [];
    const updatedUsers = currentUsers.filter(user => user !== currentUsername);
    localStorage.setItem("currentUsers", JSON.stringify(updatedUsers));
    sessionStorage.removeItem("currentUsername");
    alert("Logged out successfully!");
    window.location.href = "login.html";
});

renderBoard();
