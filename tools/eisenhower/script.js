/**
 * Eisenhower Matrix Task Management System
 * A comprehensive task management tool based on the Eisenhower Decision Matrix
 */
class EisenhowerMatrix {
    constructor() {
        this.tasks = new Map();
        this.currentEditingTask = null;
        this.draggedTask = null;
        this.draggedElement = null;
        
        // Storage configuration
        this.storageKey = 'eisenhower-matrix-tasks';
        this.version = '1.0.0';
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        try {
            this.loadFromStorage();
            this.bindEvents();
            this.renderAllQuadrants();
            this.updateAllCounts();
            console.log('Eisenhower Matrix initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Eisenhower Matrix:', error);
            this.showNotification('Failed to initialize application', 'error');
        }
    }

    /**
     * Bind event listeners using event delegation for performance
     */
    bindEvents() {
        // Add task buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.add-task-btn') || e.target.closest('.add-task-btn')) {
                const quadrant = e.target.closest('.add-task-btn').dataset.quadrant;
                this.openAddTaskModal(quadrant);
            }
        });

        // Task checkboxes
        document.addEventListener('click', (e) => {
            if (e.target.matches('.task-checkbox')) {
                const taskId = e.target.closest('.task-item').dataset.taskId;
                this.toggleTaskCompletion(taskId);
            }
        });

        // Task edit clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.task-content') || e.target.closest('.task-content')) {
                const taskItem = e.target.closest('.task-item');
                if (taskItem) {
                    const taskId = taskItem.dataset.taskId;
                    this.openEditTaskModal(taskId);
                }
            }
        });

        // Task delete buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.task-action.delete') || e.target.closest('.task-action.delete')) {
                const taskId = e.target.closest('.task-item').dataset.taskId;
                this.deleteTask(taskId);
            }
        });

        // Modal events
        this.bindModalEvents();

        // Drag and drop events
        this.bindDragEvents();

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * Bind modal-specific events
     */
    bindModalEvents() {
        // Add task modal
        const addModal = document.getElementById('add-task-modal');
        const addModalClose = document.getElementById('modal-close');
        const cancelTask = document.getElementById('cancel-task');
        const saveTask = document.getElementById('save-task');
        const taskInput = document.getElementById('task-input');

        if (addModalClose) {
            addModalClose.addEventListener('click', () => this.closeAllModals());
        }
        
        if (cancelTask) {
            cancelTask.addEventListener('click', () => this.closeAllModals());
        }
        
        if (saveTask) {
            saveTask.addEventListener('click', () => this.saveNewTask());
        }

        if (taskInput) {
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.saveNewTask();
                }
            });
        }

        // Edit task modal
        const editModal = document.getElementById('edit-task-modal');
        const editModalClose = document.getElementById('edit-modal-close');
        const cancelEdit = document.getElementById('cancel-edit');
        const saveEdit = document.getElementById('save-edit');
        const deleteTask = document.getElementById('delete-task');
        const editTaskInput = document.getElementById('edit-task-input');

        if (editModalClose) {
            editModalClose.addEventListener('click', () => this.closeAllModals());
        }
        
        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => this.closeAllModals());
        }
        
        if (saveEdit) {
            saveEdit.addEventListener('click', () => this.saveTaskEdit());
        }
        
        if (deleteTask) {
            deleteTask.addEventListener('click', () => this.deleteCurrentTask());
        }

        if (editTaskInput) {
            editTaskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.saveTaskEdit();
                }
            });
        }

        // Modal backdrop click
        const backdrop = document.getElementById('modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeAllModals());
        }
    }

    /**
     * Bind drag and drop events
     */
    bindDragEvents() {
        // Use event delegation for drag events
        document.addEventListener('dragstart', (e) => {
            if (e.target.matches('.task-item')) {
                this.handleDragStart(e);
            }
        });

        document.addEventListener('dragover', (e) => {
            if (e.target.matches('.task-list') || e.target.closest('.task-list')) {
                this.handleDragOver(e);
            }
        });

        document.addEventListener('drop', (e) => {
            if (e.target.matches('.task-list') || e.target.closest('.task-list')) {
                this.handleDrop(e);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.matches('.task-item')) {
                this.handleDragEnd(e);
            }
        });

        // Touch events for mobile drag-and-drop
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.task-item')) {
                this.handleTouchStart(e);
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (this.draggedTask) {
                this.handleTouchMove(e);
            }
        });

        document.addEventListener('touchend', (e) => {
            if (this.draggedTask) {
                this.handleTouchEnd(e);
            }
        });
    }

    /**
     * Task Management Methods
     */
    createTask(text, notes = '', quadrant = 'neither') {
        const task = {
            id: this.generateId(),
            text: this.sanitizeInput(text),
            notes: this.sanitizeInput(notes),
            quadrant,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.set(task.id, task);
        this.saveToStorage();
        return task;
    }

    updateTask(taskId, updates) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        Object.assign(task, {
            ...updates,
            updatedAt: new Date().toISOString()
        });

        this.tasks.set(taskId, task);
        this.saveToStorage();
        return task;
    }

    deleteTask(taskId) {
        if (!this.tasks.has(taskId)) {
            console.warn(`Task ${taskId} not found for deletion`);
            return false;
        }

        this.tasks.delete(taskId);
        this.saveToStorage();
        
        // Re-render the affected quadrant
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            const quadrant = taskElement.closest('.quadrant').dataset.quadrant;
            this.renderQuadrant(quadrant);
            this.updateCount(quadrant);
        }

        this.showNotification('Task deleted successfully', 'success');
        return true;
    }

    toggleTaskCompletion(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            console.warn(`Task ${taskId} not found for completion toggle`);
            return;
        }

        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        
        this.tasks.set(taskId, task);
        this.saveToStorage();

        // Update UI with animation
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('task-completing');
            setTimeout(() => {
                taskElement.classList.remove('task-completing');
                this.renderQuadrant(task.quadrant);
            }, 300);
        }
    }

    /**
     * Modal Management
     */
    openAddTaskModal(quadrant) {
        const modal = document.getElementById('add-task-modal');
        const backdrop = document.getElementById('modal-backdrop');
        const titleElement = document.getElementById('modal-title');
        const saveButton = document.getElementById('save-task');
        
        if (!modal || !backdrop) return;

        // Set quadrant context
        modal.dataset.quadrant = quadrant;
        
        // Update modal title
        if (titleElement) {
            const quadrantNames = {
                'urgent-important': 'Urgent & Important',
                'important': 'Not Urgent & Important',
                'urgent': 'Urgent & Unimportant',
                'neither': 'Not Urgent & Unimportant'
            };
            titleElement.textContent = `Add Task - ${quadrantNames[quadrant]}`;
        }

        // Clear form
        this.clearAddTaskForm();
        
        // Show modal
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        
        // Focus input
        const taskInput = document.getElementById('task-input');
        if (taskInput) {
            setTimeout(() => taskInput.focus(), 100);
        }
        
        // Update button state
        if (saveButton) {
            saveButton.disabled = false;
        }
    }

    openEditTaskModal(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            console.warn(`Task ${taskId} not found for editing`);
            return;
        }

        const modal = document.getElementById('edit-task-modal');
        const backdrop = document.getElementById('modal-backdrop');
        
        if (!modal || !backdrop) return;

        this.currentEditingTask = taskId;

        // Populate form
        const taskInput = document.getElementById('edit-task-input');
        const notesInput = document.getElementById('edit-task-notes');
        const quadrantSelect = document.getElementById('edit-task-quadrant');

        if (taskInput) taskInput.value = task.text;
        if (notesInput) notesInput.value = task.notes || '';
        if (quadrantSelect) quadrantSelect.value = task.quadrant;

        // Show modal
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        
        // Focus input
        setTimeout(() => {
            if (taskInput) taskInput.focus();
        }, 100);
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        const backdrop = document.getElementById('modal-backdrop');
        
        modals.forEach(modal => modal.classList.add('hidden'));
        if (backdrop) backdrop.classList.add('hidden');
        
        // Reset state
        this.currentEditingTask = null;
        this.clearAddTaskForm();
    }

    saveNewTask() {
        const modal = document.getElementById('add-task-modal');
        const taskInput = document.getElementById('task-input');
        const notesInput = document.getElementById('task-notes');
        
        if (!modal || !taskInput) return;

        const text = taskInput.value.trim();
        const notes = notesInput ? notesInput.value.trim() : '';
        const quadrant = modal.dataset.quadrant;

        if (!this.validateTaskInput(text)) {
            this.showValidationError(taskInput, 'Task description is required');
            return;
        }

        try {
            const task = this.createTask(text, notes, quadrant);
            this.renderQuadrant(quadrant);
            this.updateCount(quadrant);
            this.closeAllModals();
            this.showNotification('Task added successfully', 'success');
        } catch (error) {
            console.error('Failed to save new task:', error);
            this.showNotification('Failed to save task', 'error');
        }
    }

    saveTaskEdit() {
        if (!this.currentEditingTask) return;

        const taskInput = document.getElementById('edit-task-input');
        const notesInput = document.getElementById('edit-task-notes');
        const quadrantSelect = document.getElementById('edit-task-quadrant');
        
        if (!taskInput) return;

        const text = taskInput.value.trim();
        const notes = notesInput ? notesInput.value.trim() : '';
        const newQuadrant = quadrantSelect ? quadrantSelect.value : null;

        if (!this.validateTaskInput(text)) {
            this.showValidationError(taskInput, 'Task description is required');
            return;
        }

        try {
            const task = this.tasks.get(this.currentEditingTask);
            const oldQuadrant = task.quadrant;

            this.updateTask(this.currentEditingTask, {
                text,
                notes,
                quadrant: newQuadrant || oldQuadrant
            });

            // Re-render affected quadrants
            this.renderQuadrant(oldQuadrant);
            this.updateCount(oldQuadrant);
            
            if (newQuadrant && newQuadrant !== oldQuadrant) {
                this.renderQuadrant(newQuadrant);
                this.updateCount(newQuadrant);
            }

            this.closeAllModals();
            this.showNotification('Task updated successfully', 'success');
        } catch (error) {
            console.error('Failed to save task edit:', error);
            this.showNotification('Failed to update task', 'error');
        }
    }

    deleteCurrentTask() {
        if (!this.currentEditingTask) return;
        
        if (confirm('Are you sure you want to delete this task?')) {
            this.deleteTask(this.currentEditingTask);
            this.closeAllModals();
        }
    }

    /**
     * Drag and Drop Handlers
     */
    handleDragStart(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        this.draggedTask = taskItem.dataset.taskId;
        this.draggedElement = taskItem;
        
        taskItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.draggedTask);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const taskList = e.target.closest('.task-list');
        if (taskList) {
            taskList.classList.add('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        
        const taskList = e.target.closest('.task-list');
        const quadrant = taskList ? taskList.dataset.quadrant : null;
        
        if (!quadrant || !this.draggedTask) return;

        const task = this.tasks.get(this.draggedTask);
        if (!task || task.quadrant === quadrant) {
            this.cleanupDrag();
            return;
        }

        // Move task to new quadrant
        const oldQuadrant = task.quadrant;
        this.updateTask(this.draggedTask, { quadrant });

        // Re-render both quadrants
        this.renderQuadrant(oldQuadrant);
        this.renderQuadrant(quadrant);
        this.updateCount(oldQuadrant);
        this.updateCount(quadrant);

        this.showNotification('Task moved successfully', 'success');
        this.cleanupDrag();
    }

    handleDragEnd(e) {
        this.cleanupDrag();
    }

    cleanupDrag() {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
        }
        
        document.querySelectorAll('.task-list').forEach(list => {
            list.classList.remove('drag-over');
        });
        
        this.draggedTask = null;
        this.draggedElement = null;
    }

    /**
     * Touch Events for Mobile Drag and Drop
     */
    handleTouchStart(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem || e.touches.length !== 1) return;

        // Long press detection for drag initiation
        this.touchStartTime = Date.now();
        this.touchTimer = setTimeout(() => {
            this.initiateTouchDrag(taskItem, e.touches[0]);
        }, 500); // 500ms long press
    }

    handleTouchMove(e) {
        if (this.touchTimer) {
            clearTimeout(this.touchTimer);
            this.touchTimer = null;
        }

        if (!this.draggedTask || e.touches.length !== 1) return;

        e.preventDefault();
        const touch = e.touches[0];
        
        // Move the dragged element
        if (this.draggedElement) {
            this.draggedElement.style.position = 'fixed';
            this.draggedElement.style.left = touch.clientX - 50 + 'px';
            this.draggedElement.style.top = touch.clientY - 25 + 'px';
            this.draggedElement.style.zIndex = '1000';
            this.draggedElement.style.transform = 'rotate(5deg) scale(1.1)';
        }

        // Highlight drop zones
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const taskList = elementBelow ? elementBelow.closest('.task-list') : null;
        
        document.querySelectorAll('.task-list').forEach(list => {
            list.classList.remove('drag-over');
        });
        
        if (taskList) {
            taskList.classList.add('drag-over');
        }
    }

    handleTouchEnd(e) {
        if (this.touchTimer) {
            clearTimeout(this.touchTimer);
            this.touchTimer = null;
        }

        if (!this.draggedTask) return;

        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const taskList = elementBelow ? elementBelow.closest('.task-list') : null;
        const quadrant = taskList ? taskList.dataset.quadrant : null;

        if (quadrant && this.draggedTask) {
            const task = this.tasks.get(this.draggedTask);
            if (task && task.quadrant !== quadrant) {
                const oldQuadrant = task.quadrant;
                this.updateTask(this.draggedTask, { quadrant });
                
                this.renderQuadrant(oldQuadrant);
                this.renderQuadrant(quadrant);
                this.updateCount(oldQuadrant);
                this.updateCount(quadrant);
                
                this.showNotification('Task moved successfully', 'success');
            }
        }

        this.cleanupTouchDrag();
    }

    initiateTouchDrag(taskItem, touch) {
        this.draggedTask = taskItem.dataset.taskId;
        this.draggedElement = taskItem;
        taskItem.classList.add('dragging');
        
        // Provide haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    cleanupTouchDrag() {
        if (this.draggedElement) {
            this.draggedElement.style.position = '';
            this.draggedElement.style.left = '';
            this.draggedElement.style.top = '';
            this.draggedElement.style.zIndex = '';
            this.draggedElement.style.transform = '';
            this.draggedElement.classList.remove('dragging');
        }
        
        document.querySelectorAll('.task-list').forEach(list => {
            list.classList.remove('drag-over');
        });
        
        this.draggedTask = null;
        this.draggedElement = null;
    }

    /**
     * Rendering Methods
     */
    renderAllQuadrants() {
        const quadrants = ['urgent-important', 'important', 'urgent', 'neither'];
        quadrants.forEach(quadrant => {
            this.renderQuadrant(quadrant);
        });
    }

    renderQuadrant(quadrant) {
        const taskList = document.querySelector(`.task-list[data-quadrant="${quadrant}"]`);
        if (!taskList) {
            console.warn(`Task list for quadrant ${quadrant} not found`);
            return;
        }

        const tasks = Array.from(this.tasks.values())
            .filter(task => task.quadrant === quadrant)
            .sort((a, b) => {
                // Sort by completion status first, then by creation date
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <p>${this.getEmptyStateMessage(quadrant)}</p>
                </div>
            `;
        } else {
            taskList.innerHTML = tasks.map(task => this.renderTaskItem(task)).join('');
        }
    }

    renderTaskItem(task) {
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" 
                 data-task-id="${task.id}" 
                 draggable="true"
                 role="listitem"
                 tabindex="0"
                 aria-label="${task.text}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     role="checkbox" 
                     aria-checked="${task.completed}"
                     aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}">
                </div>
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    ${task.notes ? `<div class="task-notes">${this.escapeHtml(task.notes)}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="task-action edit" aria-label="Edit task" title="Edit task">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="task-action delete" aria-label="Delete task" title="Delete task">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    updateAllCounts() {
        const quadrants = ['urgent-important', 'important', 'urgent', 'neither'];
        quadrants.forEach(quadrant => {
            this.updateCount(quadrant);
        });
    }

    updateCount(quadrant) {
        const countElement = document.querySelector(`[data-count="${quadrant}"] .count`);
        if (countElement) {
            const count = Array.from(this.tasks.values())
                .filter(task => task.quadrant === quadrant).length;
            countElement.textContent = count;
        }
    }

    /**
     * Storage Management
     */
    saveToStorage() {
        try {
            const data = {
                version: this.version,
                tasks: Object.fromEntries(this.tasks),
                lastModified: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to storage:', error);
            this.showNotification('Failed to save changes', 'error');
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return;

            const data = JSON.parse(stored);
            
            // Handle version migration if needed
            if (data.version !== this.version) {
                console.log('Migrating data from version', data.version, 'to', this.version);
                // Add migration logic here if needed
            }

            if (data.tasks) {
                this.tasks = new Map(Object.entries(data.tasks));
            }
        } catch (error) {
            console.error('Failed to load from storage:', error);
            this.showNotification('Failed to load saved data', 'error');
        }
    }

    /**
     * Utility Methods
     */
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input.trim().slice(0, 500); // Limit length
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    validateTaskInput(text) {
        return typeof text === 'string' && text.trim().length > 0 && text.length <= 200;
    }

    getEmptyStateMessage(quadrant) {
        const messages = {
            'urgent-important': 'Focus on these first',
            'important': 'Schedule these',
            'urgent': 'Delegate these',
            'neither': 'Eliminate these'
        };
        return messages[quadrant] || 'No tasks yet';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--theme);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            max-width: 300px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        // Add type-specific styling
        if (type === 'error') {
            notification.style.borderColor = 'var(--error)';
            notification.style.color = 'var(--error)';
        } else if (type === 'success') {
            notification.style.borderColor = 'var(--success)';
            notification.style.color = 'var(--success)';
        }

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showValidationError(input, message) {
        input.style.borderColor = 'var(--error)';
        input.focus();
        this.showNotification(message, 'error');
        
        // Reset border color after a delay
        setTimeout(() => {
            input.style.borderColor = '';
        }, 3000);
    }

    clearAddTaskForm() {
        const taskInput = document.getElementById('task-input');
        const notesInput = document.getElementById('task-notes');
        
        if (taskInput) {
            taskInput.value = '';
            taskInput.style.borderColor = '';
        }
        if (notesInput) {
            notesInput.value = '';
        }
    }

    /**
     * Public API Methods
     */
    exportData() {
        const data = {
            version: this.version,
            exportedAt: new Date().toISOString(),
            tasks: Object.fromEntries(this.tasks)
        };
        return JSON.stringify(data, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.tasks) {
                this.tasks = new Map(Object.entries(data.tasks));
                this.saveToStorage();
                this.renderAllQuadrants();
                this.updateAllCounts();
                this.showNotification('Data imported successfully', 'success');
                return true;
            }
        } catch (error) {
            console.error('Import failed:', error);
            this.showNotification('Failed to import data', 'error');
        }
        return false;
    }

    getStats() {
        const stats = {
            total: this.tasks.size,
            completed: 0,
            byQuadrant: {
                'urgent-important': 0,
                'important': 0,
                'urgent': 0,
                'neither': 0
            }
        };

        this.tasks.forEach(task => {
            if (task.completed) stats.completed++;
            stats.byQuadrant[task.quadrant]++;
        });

        return stats;
    }

    clearAllTasks() {
        if (confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
            this.tasks.clear();
            this.saveToStorage();
            this.renderAllQuadrants();
            this.updateAllCounts();
            this.showNotification('All tasks cleared', 'success');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.EisenhowerMatrix = new EisenhowerMatrix();
    
    // Expose some methods to global scope for debugging/console access
    window.exportTasks = () => window.EisenhowerMatrix.exportData();
    window.importTasks = (data) => window.EisenhowerMatrix.importData(data);
    window.getTaskStats = () => window.EisenhowerMatrix.getStats();
    window.clearAllTasks = () => window.EisenhowerMatrix.clearAllTasks();
    
    console.log('Eisenhower Matrix loaded. Available console commands:');
    console.log('- exportTasks() - Export all tasks as JSON');
    console.log('- importTasks(jsonString) - Import tasks from JSON');
    console.log('- getTaskStats() - Get task statistics');
    console.log('- clearAllTasks() - Clear all tasks (with confirmation)');
});