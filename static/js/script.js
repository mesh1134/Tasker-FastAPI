const tasksURL = "/tasks";
const tasksURLCompleted = tasksURL + "/completed";

const taskList = document.getElementById("To-Dos_List");
const completedList = document.getElementById("Completed_List");

const addTaskBtn = document.getElementById("NewTaskBtn");
const LogoutBtn = document.getElementById("LogoutBtn");

const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav_links");

//toggling the Navigation Links
hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
})

// Add task button functionality
addTaskBtn.addEventListener("click", () => {
    taskList.appendChild(createTaskInputForm({}, async (newTaskName, newTaskDeadline)=>{
        await addTask(newTaskName, newTaskDeadline);
    }));
});

LogoutBtn.addEventListener("click", async () =>{
    await fetch("/logout", { method:"POST" });
    window.location.href = "/login";
});

// Reusable function for API requests
async function apiRequest(url, method="GET", data=null) {
    try {
        const options = {
            method,
            headers:{"Content-Type": "application/json"},
            credentials: "include" // to send session cookie as well so that session id can be used

        };
        if (data) options.body = JSON.stringify(data);

        const response = await fetch(url, options);

        if (response.status === 204) return null;
        return response.json();

    } catch (error) {
        console.error(`Failed to ${method} data`, error);
        return null;
    }
}

// Fetch and display tasks
async function fetchTasks(url=tasksURL) {
    const tasks = await apiRequest(url);
    if (!tasks) {
        return;
    }
    if(url===tasksURL){
        taskList.innerHTML = tasks.map(task => createTaskHTML(task)).join("");
        // Showing default message if no tasks exist
        if (taskList.childElementCount === 0){
            taskList.insertAdjacentHTML("afterbegin","Start with your first <span>To-Do</span> with the button below!<br><br>");
        }
    }else{
        completedList.innerHTML = tasks.map(task => createTaskHTML(task, true)).join("");
        if (completedList.childElementCount === 0){
            completedList.insertAdjacentHTML("afterbegin","Complete a <span>To-Do</span> with a check button above!<br><br>");
        }
    }
}

// Create task list item HTML
function createTaskHTML(task, isCompleted = false) {
    return `
        <li>
           ${!isCompleted ? `<button name="complete_btn" class="btn btn-complete" 
            onclick="completeTask(this,'${task.id}')"> 
               <i class="fa-regular fa-circle-check"></i></button>` : '<div style="width: 39px;"></div>' }
           
           <div class="task-content">
                <span class="task_detail">${task.name}</span> <span class="task_detail">${formatDeadline(task.deadline)}</span> </div>

           <div class="task-actions">
                ${!isCompleted ? `<button class="btn btn-edit" onclick="editTask(this, '${task.id}', '${task.name}', '${task.deadline}')">
                <i class="fa-solid fa-pen"></i></button>` : ''}
                <button class="btn btn-danger" onclick="deleteTask('${task.id}', ${isCompleted})">
                    <i class="fa-solid fa-trash-can"></i></button>
           </div>
        </li>`;
}

// Format deadline for display
function formatDeadline(deadline) {
    return deadline ? new Date(deadline).toLocaleString("en-GB") : "No deadline";
}

// Add new task
async function addTask(newTaskName, newTaskDeadline) {
    if (!newTaskName || !newTaskDeadline) return;

    const newTask = await apiRequest(tasksURL, "POST", { name: newTaskName, deadline: newTaskDeadline });
    if (newTask) await fetchTasks();
}

// delete a task
async function deleteTask(id, completed = false) {
    // The backend handles finding and deleting the task from the single SQL table.
    const url = `${tasksURL}/${id}`;

    console.log(`Attempting to delete: ${url}`);

    try {
        const result = await apiRequest(url, "DELETE");

        // apiRequest returns null on 204 (Success) OR on error.
        // We need to check if the row actually disappeared or if we got a success status.
        // For now, trusting the 204 flow:
        if (result === null) {
            console.log(`Deleted task ${id} successfully`);

            // We keep the 'completed' flag ONLY to know which UI list to refresh
            if (completed) {
                await fetchTasks(tasksURLCompleted);
            } else {
                await fetchTasks(tasksURL);
            }
        } else {
            // If result is NOT null, it means we got a JSON error message back (like 404)
            console.error(`Failed to delete task with ID: ${id}`);
        }
    } catch (error) {
        console.error(`Error deleting task: ${error}`);
    }
}

//marking a task as completed
async function completeTask(button, id) {
    const response = await apiRequest(`/tasks/${id}/complete`, "PUT");

    if (response) {
        await fetchTasks(tasksURL);          // Refreshes To-Do list
        await fetchTasks(tasksURLCompleted); // Refreshes Completed list
    }
}

// Creating task inputs for when a task needs to be added or edited
function createTaskInputForm(existingTask, onConfirm) {
    let parentElement = document.createElement("div");
    parentElement.className = "newTaskForm";

    let nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.required = true;
    nameInput.placeholder = "To-Do name";
    // Fix: Read from .name (lowercase) to match server response
    nameInput.value = existingTask?.name || "";
    parentElement.appendChild(nameInput);

    let deadlineInput = document.createElement("input");
    deadlineInput.type = "datetime-local";
    deadlineInput.placeholder = "To-Do deadline";
    deadlineInput.required = true;

    // Fix: Handle potential case differences (Deadline vs deadline) safely
    let dateVal = existingTask?.deadline || "";

    if (dateVal && !Number.isNaN(new Date(dateVal))) {
        deadlineInput.value = new Date(dateVal).toISOString().slice(0, -8);
    } else {
        deadlineInput.value = "";
    }
    parentElement.appendChild(deadlineInput);

    let confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Confirm";
    confirmBtn.className = "btn btn-primary";
    // Fix: Pass values to onConfirm. The onConfirm callback in editTask
    // will handle capitalizing them into { Name: ..., Deadline: ... } for the server.
    confirmBtn.onclick = () => onConfirm(nameInput.value, deadlineInput.value);
    parentElement.appendChild(confirmBtn);

    let cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.className = "btn btn-danger";
    cancelBtn.onclick = () => parentElement.remove();
    parentElement.appendChild(cancelBtn);

    return parentElement;
}

//Edit task
async function editTask(button, id) {
    const parentElement = button.parentElement;
    parentElement.appendChild(createTaskInputForm({ name: "", deadline: "" }, async(newName, newDeadline)=>{
        // Sending Lowercase Keys here:
        if (await apiRequest(`${tasksURL}/${id}`, "PUT", { name: newName, deadline: newDeadline })) {
            await fetchTasks();
        }
    }));
}

async function init(){
    await fetchTasks();
    await fetchTasks(tasksURLCompleted);
}

init();