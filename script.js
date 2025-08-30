 // DOM elements
        const taskInput = document.getElementById('task-input');
        const datetimeInput = document.getElementById('datetime-input');
        const addTaskBtn = document.getElementById('add-task-btn');
        const taskList = document.getElementById('task-list');
        const emptyState = document.getElementById('empty-state');
        const totalTasksElement = document.getElementById('total-tasks');
        const completedTasksElement = document.getElementById('completed-tasks');
        const pendingTasksElement = document.getElementById('pending-tasks');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const currentDateElement = document.getElementById('current-date');
        const editModal = document.getElementById('edit-modal');
        const editTaskInput = document.getElementById('edit-task-input');
        const editDatetimeInput = document.getElementById('edit-datetime-input');
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        const saveEditBtn = document.getElementById('save-edit-btn');

        // Initialize variables
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        let currentFilter = 'all';
        let currentEditId = null;

        // Initialize the app
        function initApp() {
            updateDateDisplay();
            renderTasks();
            setupEventListeners();
        }

        // Update date display
        function updateDateDisplay() {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            currentDateElement.textContent = now.toLocaleDateString('en-US', options);
        }

        // Set up event listeners
        function setupEventListeners() {
            addTaskBtn.addEventListener('click', addTask);
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addTask();
            });
            
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Update active filter button
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    // Set current filter and render tasks
                    currentFilter = button.dataset.filter;
                    renderTasks();
                });
            });
            
            cancelEditBtn.addEventListener('click', closeEditModal);
            saveEditBtn.addEventListener('click', saveEditedTask);
        }

        // Add a new task
        function addTask() {
            const text = taskInput.value.trim();
            const datetime = datetimeInput.value;
            
            if (text === '') {
                alert('Please enter a task!');
                return;
            }
            
            const newTask = {
                id: Date.now(),
                text: text,
                datetime: datetime,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            
            // Clear input fields
            taskInput.value = '';
            datetimeInput.value = '';
            taskInput.focus();
        }

        // Render tasks based on current filter
        function renderTasks() {
            // Filter tasks based on current selection
            let filteredTasks = [];
            
            switch (currentFilter) {
                case 'active':
                    filteredTasks = tasks.filter(task => !task.completed && !isOverdue(task));
                    break;
                case 'completed':
                    filteredTasks = tasks.filter(task => task.completed);
                    break;
                case 'overdue':
                    filteredTasks = tasks.filter(task => isOverdue(task) && !task.completed);
                    break;
                default:
                    filteredTasks = tasks;
            }
            
            // Update task list
            taskList.innerHTML = '';
            
            if (filteredTasks.length === 0) {
                taskList.appendChild(emptyState);
                emptyState.style.display = 'block';
            } else {
                emptyState.style.display = 'none';
                
                filteredTasks.forEach(task => {
                    const taskItem = createTaskElement(task);
                    taskList.appendChild(taskItem);
                });
            }
            
            // Update task statistics
            updateTaskStats();
        }

        // Create task element
        function createTaskElement(task) {
            const li = document.createElement('li');
            li.className = 'task-item';
            if (task.completed) li.classList.add('completed');
            if (isOverdue(task) && !task.completed) li.classList.add('overdue');
            
            // Format date and time if exists
            let datetimeDisplay = '';
            if (task.datetime) {
                const taskDate = new Date(task.datetime);
                const now = new Date();
                const options = { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                };
                
                datetimeDisplay = taskDate.toLocaleDateString('en-US', options);
                
                // Add "Today" or "Tomorrow" if applicable
                if (taskDate.toDateString() === now.toDateString()) {
                    datetimeDisplay = 'Today, ' + taskDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                } else {
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    if (taskDate.toDateString() === tomorrow.toDateString()) {
                        datetimeDisplay = 'Tomorrow, ' + taskDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    }
                }
            }
            
            li.innerHTML = `
                <div class="task-content">
                    <div class="task-info">
                        <div class="task-text">${task.text}</div>
                        ${task.datetime ? `<div class="task-datetime"><i class="far fa-clock"></i> ${datetimeDisplay}</div>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="action-btn complete-btn" data-id="${task.id}">
                            <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                        </button>
                        <button class="action-btn edit-btn" data-id="${task.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${task.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listeners to action buttons
            li.querySelector('.complete-btn').addEventListener('click', () => toggleComplete(task.id));
            li.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task.id));
            li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
            
            return li;
        }

        // Check if task is overdue
        function isOverdue(task) {
            if (!task.datetime || task.completed) return false;
            
            const now = new Date();
            const taskDate = new Date(task.datetime);
            
            return taskDate < now;
        }

        // Toggle task completion status
        function toggleComplete(id) {
            tasks = tasks.map(task => {
                if (task.id === id) {
                    return { ...task, completed: !task.completed };
                }
                return task;
            });
            
            saveTasks();
            renderTasks();
        }

        // Open edit modal
        function openEditModal(id) {
            const task = tasks.find(task => task.id === id);
            if (!task) return;
            
            currentEditId = id;
            editTaskInput.value = task.text;
            editDatetimeInput.value = task.datetime;
            editModal.style.display = 'flex';
        }

        // Close edit modal
        function closeEditModal() {
            editModal.style.display = 'none';
            currentEditId = null;
        }

        // Save edited task
        function saveEditedTask() {
            if (!currentEditId) return;
            
            const text = editTaskInput.value.trim();
            const datetime = editDatetimeInput.value;
            
            if (text === '') {
                alert('Task cannot be empty!');
                return;
            }
            
            tasks = tasks.map(task => {
                if (task.id === currentEditId) {
                    return { ...task, text: text, datetime: datetime };
                }
                return task;
            });
            
            saveTasks();
            renderTasks();
            closeEditModal();
        }

        // Delete task
        function deleteTask(id) {
            if (confirm('Are you sure you want to delete this task?')) {
                tasks = tasks.filter(task => task.id !== id);
                saveTasks();
                renderTasks();
            }
        }

        // Update task statistics
        function updateTaskStats() {
            const total = tasks.length;
            const completed = tasks.filter(task => task.completed).length;
            const pending = total - completed;
            
            totalTasksElement.textContent = total;
            completedTasksElement.textContent = completed;
            pendingTasksElement.textContent = pending;
        }

        // Save tasks to localStorage
        function saveTasks() {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }

        // Initialize the app when page loads
        document.addEventListener('DOMContentLoaded', initApp);