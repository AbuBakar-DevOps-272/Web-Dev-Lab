// DOM elements
        const taskInput = document.getElementById('taskInput');
        const taskDate = document.getElementById('taskDate');
        const taskTime = document.getElementById('taskTime');
        const scheduleToggle = document.getElementById('scheduleToggle');
        const addBtn = document.getElementById('addBtn');
        const tasksList = document.getElementById('tasksList');
        const totalTasksSpan = document.getElementById('totalTasks');
        const completedTasksSpan = document.getElementById('completedTasks');
        const overdueTasksSpan = document.getElementById('overdueTasks');
        const filterButtons = document.querySelectorAll('.filter-btn');
        const quickTimeButtons = document.querySelectorAll('.quick-time-btn');

        // Set default date to today and time to next hour
        const today = new Date();
        const nextHour = new Date(today.getTime() + 60 * 60 * 1000);
        
        taskDate.valueAsDate = today;
        taskTime.value = `${nextHour.getHours().toString().padStart(2, '0')}:${nextHour.getMinutes().toString().padStart(2, '0')}`;
        
        // Initialize tasks array from localStorage or empty array
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        let currentFilter = 'all';

        // Load tasks on page start
        document.addEventListener('DOMContentLoaded', () => {
            renderTasks();
            updateStats();
        });

        // Toggle schedule inputs visibility
        scheduleToggle.addEventListener('change', () => {
            const datetimeInputs = document.querySelector('.datetime-inputs');
            if (scheduleToggle.checked) {
                datetimeInputs.style.display = 'flex';
            } else {
                datetimeInputs.style.display = 'none';
            }
        });

        // Quick time buttons functionality
        quickTimeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const hours = parseInt(button.getAttribute('data-hours'));
                const newDate = new Date();
                newDate.setTime(newDate.getTime() + hours * 60 * 60 * 1000);
                
                // Update date and time inputs
                taskDate.valueAsDate = newDate;
                taskTime.value = `${newDate.getHours().toString().padStart(2, '0')}:${newDate.getMinutes().toString().padStart(2, '0')}`;
                
                // Ensure scheduling is enabled
                scheduleToggle.checked = true;
                document.querySelector('.datetime-inputs').style.display = 'flex';
            });
        });

        // Add task function
        function addTask() {
            const text = taskInput.value.trim();
            
            if (text === '') {
                taskInput.focus();
                return;
            }
            
            let dueDate = null;
            if (scheduleToggle.checked) {
                const dateValue = taskDate.value;
                const timeValue = taskTime.value;
                
                if (dateValue && timeValue) {
                    dueDate = new Date(`${dateValue}T${timeValue}`).toISOString();
                }
            }
            
            const task = {
                id: Date.now(),
                text: text,
                completed: false,
                dueDate: dueDate,
                createdAt: new Date().toISOString()
            };
            
            tasks.push(task);
            saveTasks();
            renderTasks();
            updateStats();
            
            // Clear input and focus
            taskInput.value = '';
            taskInput.focus();
            
            // Reset to default date and time
            const nextHour = new Date(today.getTime() + 60 * 60 * 1000);
            taskDate.valueAsDate = today;
            taskTime.value = `${nextHour.getHours().toString().padStart(2, '0')}:${nextHour.getMinutes().toString().padStart(2, '0')}`;
        }

        // Delete task function
        function deleteTask(id) {
            // Find task element for animation
            const taskElement = document.querySelector(`[data-id="${id}"]`);
            
            if (taskElement) {
                taskElement.classList.add('fade-out');
                
                // Remove from DOM after animation
                setTimeout(() => {
                    tasks = tasks.filter(task => task.id !== id);
                    saveTasks();
                    renderTasks();
                    updateStats();
                }, 300);
            }
        }

        // Toggle task completion
        function toggleComplete(id) {
            tasks = tasks.map(task => {
                if (task.id === id) {
                    return { ...task, completed: !task.completed };
                }
                return task;
            });
            
            saveTasks();
            updateStats();
            
            // Update the specific task element
            const taskText = document.querySelector(`[data-id="${id}"] .task-text`);
            if (taskText) {
                taskText.classList.toggle('completed');
            }
        }

        // Edit task function
        function editTask(id) {
            const task = tasks.find(task => task.id === id);
            if (!task) return;
            
            const taskElement = document.querySelector(`[data-id="${id}"]`);
            const taskContent = taskElement.querySelector('.task-content');
            const taskActions = taskElement.querySelector('.task-actions');
            
            // Create edit input
            const editInput = document.createElement('input');
            editInput.type = 'text';
            editInput.className = 'edit-input';
            editInput.value = task.text;
            
            // Create datetime inputs if task has due date
            let editDateInput, editTimeInput;
            const editDateTimeDiv = document.createElement('div');
            editDateTimeDiv.className = 'edit-datetime';
            
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                editDateInput = document.createElement('input');
                editDateInput.type = 'date';
                editDateInput.className = 'edit-date';
                editDateInput.valueAsDate = dueDate;
                
                editTimeInput = document.createElement('input');
                editTimeInput.type = 'time';
                editTimeInput.className = 'edit-time';
                editTimeInput.value = `${dueDate.getHours().toString().padStart(2, '0')}:${dueDate.getMinutes().toString().padStart(2, '0')}`;
                
                editDateTimeDiv.appendChild(editDateInput);
                editDateTimeDiv.appendChild(editTimeInput);
            }
            
            // Create save and cancel buttons
            const saveBtn = document.createElement('button');
            saveBtn.className = 'save-btn';
            saveBtn.textContent = 'Save';
            
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'cancel-btn';
            cancelBtn.textContent = 'Cancel';
            
            // Replace task content with inputs
            taskContent.innerHTML = '';
            taskContent.appendChild(editInput);
            if (task.dueDate) {
                taskContent.appendChild(editDateTimeDiv);
            }
            
            // Replace actions with save/cancel buttons
            taskActions.innerHTML = '';
            taskActions.appendChild(saveBtn);
            taskActions.appendChild(cancelBtn);
            
            // Focus and select text in input
            editInput.focus();
            editInput.select();
            
            // Save on Enter key
            editInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    saveEdit(id, editInput.value, editDateInput, editTimeInput);
                } else if (e.key === 'Escape') {
                    cancelEdit(id);
                }
            });
            
            // Save button click
            saveBtn.addEventListener('click', () => {
                saveEdit(id, editInput.value, editDateInput, editTimeInput);
            });
            
            // Cancel button click
            cancelBtn.addEventListener('click', () => {
                cancelEdit(id);
            });
        }

        // Save edited task
        function saveEdit(id, newText, dateInput, timeInput) {
            const trimmedText = newText.trim();
            
            if (trimmedText === '') {
                cancelEdit(id);
                return;
            }
            
            let dueDate = null;
            if (dateInput && timeInput && dateInput.value && timeInput.value) {
                dueDate = new Date(`${dateInput.value}T${timeInput.value}`).toISOString();
            }
            
            tasks = tasks.map(task => {
                if (task.id === id) {
                    return { ...task, text: trimmedText, dueDate: dueDate };
                }
                return task;
            });
            
            saveTasks();
            renderTasks();
        }

        // Cancel edit
        function cancelEdit(id) {
            renderTasks();
        }

        // Format date for display
        function formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            const timeDiff = taskDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysDiff === 0) {
                return `Today at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            } else if (daysDiff === 1) {
                return `Tomorrow at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            } else if (daysDiff === -1) {
                return `Yesterday at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            } else if (daysDiff < 0) {
                return `${Math.abs(daysDiff)} days ago at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            } else {
                return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            }
        }

        // Check if a task is overdue
        function isOverdue(task) {
            if (!task.dueDate || task.completed) return false;
            return new Date(task.dueDate) < new Date();
        }

        // Filter tasks based on current filter
        function filterTasks() {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            switch(currentFilter) {
                case 'today':
                    return tasks.filter(task => {
                        if (!task.dueDate) return false;
                        const taskDate = new Date(task.dueDate);
                        return taskDate >= today && taskDate < tomorrow;
                    });
                case 'upcoming':
                    return tasks.filter(task => {
                        if (!task.dueDate) return false;
                        const taskDate = new Date(task.dueDate);
                        return taskDate >= now;
                    });
                case 'overdue':
                    return tasks.filter(task => isOverdue(task));
                default:
                    return tasks;
            }
        }

        // Render all tasks
        function renderTasks() {
            // Clear tasks list
            tasksList.innerHTML = '';
            
            const filteredTasks = filterTasks();
            
            if (filteredTasks.length === 0) {
                // Show empty state
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                
                let message = 'No tasks yet. Add a task to get started!';
                if (currentFilter !== 'all') {
                    message = `No ${currentFilter} tasks.`;
                }
                
                emptyState.innerHTML = `
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 12H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 16H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 12H9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 16H9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p>${message}</p>
                `;
                tasksList.appendChild(emptyState);
                return;
            }
            
            // Create and append each task
            filteredTasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = 'task-item';
                taskElement.setAttribute('data-id', task.id);
                
                const overdue = isOverdue(task);
                
                taskElement.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                        ${task.dueDate ? `
                            <div class="task-datetime ${overdue ? 'overdue' : ''}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 8V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M16 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M8 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                ${formatDate(task.dueDate)}
                            </div>
                        ` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" title="Edit task">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="delete-btn" title="Delete task">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                `;
                
                tasksList.appendChild(taskElement);
                
                // Add event listeners
                const checkbox = taskElement.querySelector('.task-checkbox');
                const editBtn = taskElement.querySelector('.edit-btn');
                const deleteBtn = taskElement.querySelector('.delete-btn');
                
                checkbox.addEventListener('change', () => toggleComplete(task.id));
                editBtn.addEventListener('click', () => editTask(task.id));
                deleteBtn.addEventListener('click', () => deleteTask(task.id));
            });
        }

        // Update statistics
        function updateStats() {
            const total = tasks.length;
            const completed = tasks.filter(task => task.completed).length;
            const overdue = tasks.filter(task => isOverdue(task)).length;
            
            totalTasksSpan.textContent = `Total: ${total}`;
            completedTasksSpan.textContent = `Completed: ${completed}`;
            overdueTasksSpan.textContent = `Overdue: ${overdue}`;
        }

        // Save tasks to localStorage
        function saveTasks() {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }

        // Event listeners for filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update current filter and re-render
                currentFilter = button.getAttribute('data-filter');
                renderTasks();
            });
        });

        // Event listeners for adding tasks
        addBtn.addEventListener('click', addTask);
        
        taskInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                addTask();
            }
        });