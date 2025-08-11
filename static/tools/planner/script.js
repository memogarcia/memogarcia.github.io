// North Star Canvas - Planning Tool
// Pure HTML/CSS/JS implementation

class PlanningApp {
    constructor() {
        this.epics = [];
        
        this.tasks = [];
        
        this.people = [];
        
        this.assignments = [];
        this.dependencies = []; // Array of {fromTaskId, toTaskId, type} objects
        
        this.view = { x: 0, y: 0, scale: 1 };
        this.dragging = null;
        this.dragStartPos = null;
        this.dragOffset = null;
        this.dependencyMode = false; // Flag for dependency drawing mode
        this.dependencyStart = null; // Starting task for dependency line
        
        // Constants - will be updated based on screen size
        this.updateConstants();
        
        // Add resize listener
        window.addEventListener('resize', () => {
            this.updateConstants();
            this.render();
        });
        
        this.init();
        this.loadFromStorage();
        this.setupSidebarToggle();
    }
    
    setupSidebarToggle() {
        // Load sidebar state - on mobile, default to collapsed for more canvas space
        const isMobile = window.innerWidth <= 480;
        const defaultCollapsed = isMobile ? 'true' : 'false';
        const sidebarCollapsed = localStorage.getItem('sidebar-collapsed') ?? defaultCollapsed === 'true';
        const sidebar = document.getElementById('people-palette');
        
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
        }
        
        // Setup toggle button
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
        });
    }
    
    setupMobileOptimizations() {
        const isMobile = window.innerWidth <= 768;
        const isTouchDevice = 'ontouchstart' in window;
        
        if (isMobile || isTouchDevice) {
            // Prevent zoom on double tap
            let lastTouchEnd = 0;
            document.addEventListener('touchend', function (event) {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    event.preventDefault();
                }
                lastTouchEnd = now;
            }, false);
            
            // Improve scrolling on mobile
            document.body.style.webkitOverflowScrolling = 'touch';
            
            // Add touch feedback with better performance
            const addTouchFeedback = (element) => {
                let touchTimeout;
                
                element.addEventListener('touchstart', function(e) {
                    // Clear any existing timeout
                    if (touchTimeout) clearTimeout(touchTimeout);
                    
                    this.style.transform = 'scale(0.97)';
                    this.style.transition = 'transform 0.1s ease-out';
                    
                    // Add a subtle shadow for depth
                    if (this.classList.contains('btn')) {
                        this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                    }
                }, { passive: true });
                
                const resetTransform = function() {
                    this.style.transform = '';
                    this.style.transition = '';
                    this.style.boxShadow = '';
                };
                
                element.addEventListener('touchend', resetTransform, { passive: true });
                element.addEventListener('touchcancel', resetTransform, { passive: true });
                
                // Reset after delay to handle edge cases
                element.addEventListener('touchstart', () => {
                    touchTimeout = setTimeout(() => {
                        resetTransform.call(element);
                    }, 200);
                }, { passive: true });
            };
            
            // Apply touch feedback to interactive elements
            const touchElements = document.querySelectorAll('.btn, .task, .north-star, .person-header, .activity, .sidebar-toggle');
            touchElements.forEach(addTouchFeedback);
            
            // Enhanced mobile canvas interactions
            const canvas = document.getElementById('canvas');
            let touchStartTime = 0;
            let touchStartPos = { x: 0, y: 0 };
            
            canvas.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                if (e.touches.length === 1) {
                    touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                }
            }, { passive: true });
            
            // Improve touch scrolling for sidebar
            const sidebar = document.getElementById('people-palette');
            if (sidebar) {
                sidebar.style.webkitOverflowScrolling = 'touch';
            }
            
            // Auto-collapse sidebar on very small screens
            if (window.innerWidth <= 480) {
                const sidebarElement = document.getElementById('people-palette');
                if (sidebarElement && !sidebarElement.classList.contains('collapsed')) {
                    sidebarElement.classList.add('collapsed');
                    localStorage.setItem('sidebar-collapsed', 'true');
                }
            }
            
            // Add haptic feedback for supported devices
            this.addHapticFeedback();
        }
    }
    
    addHapticFeedback() {
        // Add subtle haptic feedback for touch interactions
        if ('vibrate' in navigator) {
            const addHaptic = (element, intensity = 10) => {
                element.addEventListener('touchstart', () => {
                    navigator.vibrate(intensity);
                }, { passive: true });
            };
            
            // Light haptic for buttons
            document.querySelectorAll('.btn').forEach(btn => addHaptic(btn, 5));
            
            // Medium haptic for draggable items
            document.querySelectorAll('.task, .north-star').forEach(item => addHaptic(item, 10));
            
            // Strong haptic for delete actions
            document.querySelectorAll('.task-delete-btn, .person-delete-btn, .ns-delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    navigator.vibrate([20, 50, 20]);
                });
            });
        }
    }
    
    // Persistence methods
    saveToStorage() {
        const data = {
            epics: this.epics,
            tasks: this.tasks,
            people: this.people,
            assignments: this.assignments,
            dependencies: this.dependencies,
            view: this.view
        };
        localStorage.setItem('planner-data', JSON.stringify(data));
    }
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('planner-data');
            if (stored) {
                const data = JSON.parse(stored);
                this.epics = data.epics || data.northStars || []; // Support legacy data
                this.tasks = data.tasks || [];
                this.people = data.people || [];
                this.assignments = data.assignments || [];
                this.dependencies = data.dependencies || [];
                this.view = data.view || { x: 0, y: 0, scale: 1 };
                this.render();
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
    }
    
    exportData() {
        const data = {
            epics: this.epics,
            tasks: this.tasks,
            people: this.people,
            assignments: this.assignments,
            dependencies: this.dependencies,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planner-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate the data structure
                if (data && typeof data === 'object') {
                    this.epics = data.epics || data.northStars || []; // Support legacy data
                    this.tasks = data.tasks || [];
                    this.people = data.people || [];
                    this.assignments = data.assignments || [];
                    this.dependencies = data.dependencies || [];
                    
                    // Reset view to default
                    this.view = { x: 0, y: 0, scale: 1 };
                    
                    this.render();
                    this.saveToStorage();
                    
                    alert('Plan imported successfully!');
                } else {
                    alert('Invalid file format. Please select a valid plan export file.');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Error importing file. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }
    
    updateConstants() {
        const width = window.innerWidth;
        
        if (width <= 320) {
            this.EPIC_HEADER = 56;
            this.EPIC_PAD_X = 10;
            this.EPIC_PAD_Y = 8;
            this.TASK_W = 180;
            this.TASK_H = 72;
            this.MIN_EPIC_W = 200;
            this.MIN_EPIC_H = this.EPIC_HEADER + 100;
        } else if (width <= 480) {
            this.EPIC_HEADER = 56;
            this.EPIC_PAD_X = 12;
            this.EPIC_PAD_Y = 10;
            this.TASK_W = 200;
            this.TASK_H = 80;
            this.MIN_EPIC_W = 240;
            this.MIN_EPIC_H = this.EPIC_HEADER + 120;
        } else if (width <= 640) {
            this.EPIC_HEADER = 56;
            this.EPIC_PAD_X = 14;
            this.EPIC_PAD_Y = 11;
            this.TASK_W = 220;
            this.TASK_H = 88;
            this.MIN_EPIC_W = 280;
            this.MIN_EPIC_H = this.EPIC_HEADER + 130;
        } else {
            this.EPIC_HEADER = 56;
            this.EPIC_PAD_X = 16;
            this.EPIC_PAD_Y = 12;
            this.TASK_W = 260;
            this.TASK_H = 96;
            this.MIN_EPIC_W = 320;
            this.MIN_EPIC_H = this.EPIC_HEADER + 140;
        }
    }
    
    init() {
        this.setupEventListeners();
        this.render();
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    setupEventListeners() {
        // Control buttons
        document.getElementById('reset-view').addEventListener('click', () => {
            this.view = { x: 0, y: 0, scale: 1 };
            this.updateWorldTransform();
        });
        
        // Mobile-specific improvements
        this.setupMobileOptimizations();
        
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.view.scale = Math.min(2.2, this.view.scale * 1.12);
            this.updateWorldTransform();
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
            this.view.scale = Math.max(0.35, this.view.scale / 1.12);
            this.updateWorldTransform();
        });
        
        document.getElementById('add-epic').addEventListener('click', () => {
            this.showDialog('New Epic', 'e.g., User Authentication', (title) => {
                this.addEpic(title);
            });
        });
        
        document.getElementById('add-task').addEventListener('click', () => {
            this.showDialog('New Task', 'Short title', (title) => {
                this.addTask(title);
            });
        });
        
        document.getElementById('add-person').addEventListener('click', () => {
            this.showDialog('New Person', 'Name', (name) => {
                this.addPerson(name);
            });
        });
        
        document.getElementById('dependency-mode').addEventListener('click', () => {
            this.toggleDependencyMode();
        });
        
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('import-data').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        document.getElementById('file-input').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importData(e.target.files[0]);
                e.target.value = ''; // Clear the input
            }
        });
        
        // Canvas events
        const canvas = document.getElementById('canvas');
        canvas.addEventListener('wheel', this.handleWheel.bind(this));
        canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));
        
        // Dialog events
        document.getElementById('dialog-cancel').addEventListener('click', this.hideDialog.bind(this));
        document.getElementById('dialog-confirm').addEventListener('click', this.confirmDialog.bind(this));
        document.getElementById('dialog-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.confirmDialog();
            }
        });
        
        // Drag and drop
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
    }
    
    generateId(prefix) {
        return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
    }
    
    findById(array, id) {
        return array.find(item => item.id === id);
    }
    
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    // Rendering
    render() {
        this.renderPeople();
        this.renderEpics();
        this.renderTasks();
        this.renderConnections();
        this.renderDependencies();
        this.updateUnalignedCount();
        this.updateWorldTransform();
    }
    
    toggleDependencyMode() {
        this.dependencyMode = !this.dependencyMode;
        this.dependencyStart = null;
        
        const button = document.getElementById('dependency-mode');
        if (this.dependencyMode) {
            button.classList.add('btn-active');
            button.title = 'Exit Dependency Mode (click tasks to connect them)';
            document.body.style.cursor = 'crosshair';
        } else {
            button.classList.remove('btn-active');
            button.title = 'Draw Dependencies';
            document.body.style.cursor = '';
            // Remove any hover states
            document.querySelectorAll('.task').forEach(task => {
                task.classList.remove('dependency-hover');
            });
        }
    }
    
    renderDependencies() {
        const svg = document.getElementById('connections');
        
        // Remove existing dependency lines
        svg.querySelectorAll('.dependency-line').forEach(line => line.remove());
        
        this.dependencies.forEach(dep => {
            const fromTask = this.findById(this.tasks, dep.fromTaskId);
            const toTask = this.findById(this.tasks, dep.toTaskId);
            
            if (!fromTask || !toTask) return;
            
            const fromPos = this.getTaskAbsolutePosition(fromTask);
            const toPos = this.getTaskAbsolutePosition(toTask);
            
            // Calculate connection points (from right edge to left edge)
            const x1 = fromPos.x + this.TASK_W;
            const y1 = fromPos.y + this.TASK_H / 2;
            const x2 = toPos.x;
            const y2 = toPos.y + this.TASK_H / 2;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // Create curved path for better visual
            const midX = (x1 + x2) / 2;
            const pathData = `M ${x1} ${y1} Q ${midX + 20} ${y1} ${midX} ${(y1 + y2) / 2} Q ${midX - 20} ${y2} ${x2} ${y2}`;
            
            line.setAttribute('d', pathData);
            line.setAttribute('class', 'dependency-line');
            line.setAttribute('data-from', dep.fromTaskId);
            line.setAttribute('data-to', dep.toTaskId);
            
            svg.appendChild(line);
        });
    }
    
    renderPeople() {
        const container = document.getElementById('people-list');
        container.innerHTML = '';
        
        this.people.forEach(person => {
            const personDiv = document.createElement('div');
            personDiv.className = 'person-card';
            personDiv.setAttribute('data-person-name', person.name);
            personDiv.setAttribute('title', person.name); // Fallback tooltip
            personDiv.innerHTML = `
                <div class="person-header" draggable="true" data-type="person" data-person-id="${person.id}">
                    <i data-lucide="user"></i>
                    <span class="person-name">${person.name}</span>
                    <span class="activity-count">${person.activities.length}</span>
                    <button class="person-delete-btn" onclick="app.deletePerson('${person.id}')" title="Delete Person">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="activities-list">
                    ${person.activities.map(activity => `
                        <div class="activity-item">
                            <div class="activity" draggable="true" data-type="activity" data-person-id="${person.id}" data-activity-id="${activity.id}">
                                <span class="activity-text">${activity.text}</span>
                            </div>
                            <button class="remove-btn" onclick="app.removeActivity('${person.id}', '${activity.id}')">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="add-activity">
                    <input type="text" placeholder="Add activity..." data-person-id="${person.id}" onkeydown="if(event.key==='Enter') app.addActivityFromInput(this)">
                    <button class="btn btn-primary" onclick="app.addActivityFromInput(this.previousElementSibling)">Add</button>
                </div>
            `;
            container.appendChild(personDiv);
        });
        
        // Re-initialize icons for the new content
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Setup touch tooltips for collapsed sidebar
        this.setupTouchTooltips();
    }
    
    setupTouchTooltips() {
        // Add click/touch tooltip functionality for mobile devices
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouchDevice) {
            document.querySelectorAll('.person-card').forEach(card => {
                let tooltipTimeout;
                
                const showTooltip = () => {
                    // Add a temporary class to show tooltip
                    card.classList.add('show-tooltip');
                    clearTimeout(tooltipTimeout);
                    
                    // Hide tooltip after 2 seconds
                    tooltipTimeout = setTimeout(() => {
                        card.classList.remove('show-tooltip');
                    }, 2000);
                };
                
                card.addEventListener('touchstart', showTooltip, { passive: true });
                card.addEventListener('click', (e) => {
                    const sidebar = document.getElementById('people-palette');
                    if (sidebar && sidebar.classList.contains('collapsed')) {
                        e.preventDefault();
                        showTooltip();
                    }
                });
            });
        }
    }
    
    renderEpics() {
        const world = document.getElementById('world');
        
        // Remove existing epics
        world.querySelectorAll('.epic').forEach(el => el.remove());
        
        this.epics.forEach(epic => {
            const epicDiv = document.createElement('div');
            epicDiv.className = 'epic';
            epicDiv.dataset.epicId = epic.id;
            epicDiv.style.transform = `translate(${epic.x}px, ${epic.y}px)`;
            epicDiv.style.width = `${epic.w}px`;
            epicDiv.style.height = `${epic.h}px`;
            
            const epicTasks = this.tasks.filter(t => t.epicId === epic.id);
            const assignedPeopleIds = new Set(
                this.assignments
                    .filter(a => epicTasks.some(t => t.id === a.taskId))
                    .map(a => a.personId)
            );
            
            epicDiv.innerHTML = `
                <div class="epic-header" data-drag-type="epic">
                    <i data-lucide="star"></i>
                    <div class="epic-title">${epic.title}</div>
                    <div class="epic-badges">
                        <span class="badge">Tasks: ${epicTasks.length}</span>
                        <span class="badge">People: ${assignedPeopleIds.size}</span>
                    </div>
                    <button class="epic-delete-btn" onclick="app.deleteEpic('${epic.id}')" title="Delete Epic">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="epic-content" data-epic-content="${epic.id}" style="height: ${epic.h - this.EPIC_HEADER}px; padding: ${this.EPIC_PAD_Y}px ${this.EPIC_PAD_X}px;">
                    <div class="resize-handle" data-drag-type="resize" data-epic-id="${epic.id}"></div>
                </div>
            `;
            
            world.appendChild(epicDiv);
        });
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    renderTasks() {
        const world = document.getElementById('world');
        
        // Remove existing tasks
        world.querySelectorAll('.task').forEach(el => el.remove());
        
        this.tasks.forEach(task => {
            const taskDiv = document.createElement('div');
            const absPos = this.getTaskAbsolutePosition(task);
            const taskAssignments = this.assignments.filter(a => a.taskId === task.id);
            
            taskDiv.className = `task ${task.epicId ? 'aligned' : 'unaligned'}`;
            taskDiv.dataset.taskId = task.id;
            taskDiv.dataset.dragType = 'task';
            taskDiv.style.transform = `translate(${absPos.x}px, ${absPos.y}px)`;
            
            taskDiv.innerHTML = `
                <div class="task-header">
                    <i data-lucide="target"></i>
                    <span>Task</span>
                    <button class="task-delete-btn" onclick="app.deleteTask('${task.id}')" title="Delete Task">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="task-title" title="${task.title}">${task.title}</div>
                <div class="task-assignments">
                    ${taskAssignments.length === 0 ? 
                        '<span class="assignment-badge no-assignments">No people yet</span>' :
                        taskAssignments.map(assignment => {
                            const person = this.findById(this.people, assignment.personId);
                            const activity = assignment.activityId ? 
                                person?.activities.find(a => a.id === assignment.activityId) : null;
                            return `<span class="assignment-badge">
                                ${person?.name || ''}${activity ? ` — ${activity.text}` : ''}
                            </span>`;
                        }).join('')
                    }
                </div>
                ${!task.epicId ? '<div class="unaligned-status">Unaligned</div>' : ''}
            `;
            
            // Add drop event listeners
            taskDiv.addEventListener('dragover', (e) => e.preventDefault());
            taskDiv.addEventListener('drop', (e) => this.handleTaskDrop(e, task.id));
            
            world.appendChild(taskDiv);
        });
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    renderConnections() {
        const svg = document.getElementById('connections');
        svg.innerHTML = '';
        
        this.tasks.filter(t => t.epicId).forEach(task => {
            const epic = this.findById(this.epics, task.epicId);
            if (!epic) return;
            
            const x1 = epic.x + this.EPIC_PAD_X + (task.ix || 0) + this.TASK_W / 2;
            const y1 = epic.y + this.EPIC_HEADER + this.EPIC_PAD_Y + (task.iy || 0) + this.TASK_H / 2;
            const x2 = epic.x + epic.w / 2;
            const y2 = epic.y + this.EPIC_HEADER / 2;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#cbd5e1');
            line.setAttribute('stroke-width', '1');
            
            svg.appendChild(line);
        });
    }
    
    updateUnalignedCount() {
        const count = this.tasks.filter(t => !t.epicId).length;
        document.getElementById('unaligned-count').textContent = count;
    }
    
    updateWorldTransform() {
        const world = document.getElementById('world');
        world.style.transform = `translate(${this.view.x}px, ${this.view.y}px) scale(${this.view.scale})`;
        
        // Update grid background
        const canvas = document.getElementById('canvas');
        canvas.style.backgroundSize = `${20 * this.view.scale}px ${20 * this.view.scale}px`;
    }
    
    getTaskAbsolutePosition(task) {
        if (!task.epicId) {
            return { x: task.x, y: task.y };
        }
        
        const epic = this.findById(this.epics, task.epicId);
        if (!epic) return { x: task.x, y: task.y };
        
        return {
            x: epic.x + this.EPIC_PAD_X + (task.ix || 0),
            y: epic.y + this.EPIC_HEADER + this.EPIC_PAD_Y + (task.iy || 0)
        };
    }
    
    // Event handlers
    handleWheel(e) {
        if (!(e.metaKey || e.ctrlKey)) return;
        
        e.preventDefault();
        const direction = e.deltaY > 0 ? -1 : 1;
        const factor = 1 + direction * 0.12;
        this.view.scale = this.clamp(this.view.scale * factor, 0.35, 2.2);
        this.updateWorldTransform();
    }
    
    handleCanvasMouseDown(e) {
        if (!(e.shiftKey || e.metaKey || e.ctrlKey || e.button === 1)) {
            const target = e.target.closest('[data-drag-type]');
            if (!target) return;
            
            const dragType = target.dataset.dragType;
            
            if (dragType === 'epic') {
                this.startDragEpic(e, target);
            } else if (dragType === 'resize') {
                this.startResizeEpic(e, target);
            } else if (dragType === 'task') {
                this.startDragTask(e, target);
            }
        } else {
            // Pan canvas
            this.dragging = { type: 'canvas' };
            this.dragStartPos = { x: e.clientX, y: e.clientY };
        }
    }
    
    handleCanvasMouseMove(e) {
        if (!this.dragging) return;
        
        const dx = e.clientX - this.dragStartPos.x;
        const dy = e.clientY - this.dragStartPos.y;
        
        if (this.dragging.type === 'canvas') {
            this.view.x += dx;
            this.view.y += dy;
            this.updateWorldTransform();
            this.dragStartPos = { x: e.clientX, y: e.clientY };
        } else if (this.dragging.type === 'epic') {
            this.moveEpic(this.dragging.id, this.dragging.startPos.x + dx, this.dragging.startPos.y + dy);
        } else if (this.dragging.type === 'resize') {
            this.resizeEpic(this.dragging.id, dx, dy);
        } else if (this.dragging.type === 'task') {
            this.moveTask(this.dragging.id, dx, dy);
        }
    }
    
    handleCanvasMouseUp(e) {
        if (this.dragging?.type === 'task') {
            this.handleTaskDragEnd(e);
        }
        
        this.dragging = null;
        this.dragStartPos = null;
        this.dragOffset = null;
    }
    
    startDragEpic(e, element) {
        const epicId = element.closest('.epic').dataset.epicId;
        const epic = this.findById(this.epics, epicId);
        
        this.dragging = {
            type: 'epic',
            id: epicId,
            startPos: { x: epic.x, y: epic.y }
        };
        this.dragStartPos = { x: e.clientX, y: e.clientY };
        
        element.closest('.epic').classList.add('dragging');
    }
    
    startResizeEpic(e, element) {
        const epicId = element.dataset.epicId;
        const epic = this.findById(this.epics, epicId);
        
        this.dragging = {
            type: 'resize',
            id: epicId,
            startSize: { w: epic.w, h: epic.h }
        };
        this.dragStartPos = { x: e.clientX, y: e.clientY };
        
        e.stopPropagation();
    }
    
    startDragTask(e, element) {
        const taskId = element.dataset.taskId;
        const task = this.findById(this.tasks, taskId);
        
        this.dragging = {
            type: 'task',
            id: taskId,
            startPos: task.epicId ? 
                { ix: task.ix || 0, iy: task.iy || 0 } : 
                { x: task.x, y: task.y }
        };
        this.dragStartPos = { x: e.clientX, y: e.clientY };
        
        element.classList.add('dragging');
    }
    
    moveEpic(epicId, x, y) {
        const epic = this.findById(this.epics, epicId);
        if (!epic) return;
        
        epic.x = x;
        epic.y = y;
        
        const element = document.querySelector(`[data-epic-id="${epicId}"]`);
        if (element) {
            element.closest('.epic').style.transform = `translate(${x}px, ${y}px)`;
        }
        
        // Update task positions and connections
        this.renderTasks();
        this.renderConnections();
    }
    
    resizeEpic(epicId, dx, dy) {
        const epic = this.findById(this.epics, epicId);
        if (!epic) return;
        
        const newW = this.clamp(this.dragging.startSize.w + dx, this.MIN_EPIC_W, 4000);
        const newH = this.clamp(this.dragging.startSize.h + dy, this.MIN_EPIC_H, 4000);
        
        epic.w = newW;
        epic.h = newH;
        
        // Clamp tasks within new bounds
        const maxX = Math.max(0, newW - this.EPIC_PAD_X * 2 - this.TASK_W);
        const maxY = Math.max(0, newH - this.EPIC_HEADER - this.EPIC_PAD_Y * 2 - this.TASK_H);
        
        this.tasks.forEach(task => {
            if (task.epicId === epicId) {
                task.ix = this.clamp(task.ix || 0, 0, maxX);
                task.iy = this.clamp(task.iy || 0, 0, maxY);
            }
        });
        
        this.renderEpics();
        this.renderTasks();
        this.renderConnections();
    }
    
    moveTask(taskId, dx, dy) {
        const task = this.findById(this.tasks, taskId);
        if (!task) return;
        
        if (task.epicId) {
            const epic = this.findById(this.epics, task.epicId);
            if (!epic) return;
            
            const maxX = Math.max(0, epic.w - this.EPIC_PAD_X * 2 - this.TASK_W);
            const maxY = Math.max(0, epic.h - this.EPIC_HEADER - this.EPIC_PAD_Y * 2 - this.TASK_H);
            
            task.ix = this.clamp(this.dragging.startPos.ix + dx / this.view.scale, 0, maxX);
            task.iy = this.clamp(this.dragging.startPos.iy + dy / this.view.scale, 0, maxY);
        } else {
            task.x = this.dragging.startPos.x + dx / this.view.scale;
            task.y = this.dragging.startPos.y + dy / this.view.scale;
        }
        
        const absPos = this.getTaskAbsolutePosition(task);
        const element = document.querySelector(`[data-task-id="${taskId}"]`);
        if (element) {
            element.style.transform = `translate(${absPos.x}px, ${absPos.y}px)`;
        }
        
        this.renderConnections();
    }
    
    handleTaskDragEnd(e) {
        const taskId = this.dragging.id;
        const task = this.findById(this.tasks, taskId);
        
        // Check if dropped on an Epic
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const epicContent = elements.find(el => el.dataset.epicContent);
        
        if (epicContent && (!task.epicId || task.epicId !== epicContent.dataset.epicContent)) {
            // Align task to Epic
            const epicId = epicContent.dataset.epicContent;
            const epic = this.findById(this.epics, epicId);
            const absPos = this.getTaskAbsolutePosition(task);
            
            const relX = absPos.x - (epic.x + this.EPIC_PAD_X);
            const relY = absPos.y - (epic.y + this.EPIC_HEADER + this.EPIC_PAD_Y);
            
            const maxX = Math.max(0, epic.w - this.EPIC_PAD_X * 2 - this.TASK_W);
            const maxY = Math.max(0, epic.h - this.EPIC_HEADER - this.EPIC_PAD_Y * 2 - this.TASK_H);
            
            task.epicId = epicId;
            task.ix = this.clamp(relX, 0, maxX);
            task.iy = this.clamp(relY, 0, maxY);
            delete task.x;
            delete task.y;
            
        } else if (!epicContent && task.epicId) {
            // Unalign task
            const absPos = this.getTaskAbsolutePosition(task);
            task.x = absPos.x;
            task.y = absPos.y;
            delete task.epicId;
            delete task.ix;
            delete task.iy;
        }
        
        // Remove dragging class
        document.querySelector(`[data-task-id="${taskId}"]`)?.classList.remove('dragging');
        
        this.render();
        this.saveToStorage();
    }
    
    handleDragStart(e) {
        const type = e.target.dataset.type;
        if (type === 'person') {
            e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'person',
                personId: e.target.dataset.personId
            }));
        } else if (type === 'activity') {
            e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'activity',
                personId: e.target.dataset.personId,
                activityId: e.target.dataset.activityId
            }));
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
    }
    
    handleDrop(e) {
        e.preventDefault();
    }
    
    handleTaskDrop(e, taskId) {
        e.preventDefault();
        
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            
            if (data.type === 'person') {
                // Assign person to task
                const existing = this.assignments.find(a => 
                    a.taskId === taskId && a.personId === data.personId && !a.activityId
                );
                
                if (!existing) {
                    this.assignments.push({
                        id: this.generateId('as'),
                        taskId: taskId,
                        personId: data.personId
                    });
                }
                
            } else if (data.type === 'activity') {
                // Assign activity to task
                const existing = this.assignments.find(a => 
                    a.taskId === taskId && 
                    a.personId === data.personId && 
                    a.activityId === data.activityId
                );
                
                if (!existing) {
                    this.assignments.push({
                        id: this.generateId('as'),
                        taskId: taskId,
                        personId: data.personId,
                        activityId: data.activityId
                    });
                }
            }
            
            this.renderTasks();
            this.renderNorthStars();
            this.saveToStorage();
        } catch (error) {
            console.error('Error handling drop:', error);
        }
    }
    
    // CRUD operations
    addEpic(title) {
        const epic = {
            id: this.generateId('epic'),
            title: title,
            x: 200 + Math.random() * 400,
            y: 80 + Math.random() * 120,
            w: 420,
            h: 320
        };
        
        this.epics.push(epic);
        this.render();
        this.saveToStorage();
    }
    
    addTask(title) {
        const task = {
            id: this.generateId('t'),
            title: title,
            x: 260 + Math.random() * 520,
            y: 320 + Math.random() * 240
        };
        
        this.tasks.push(task);
        this.render();
        this.saveToStorage();
    }
    
    addPerson(name) {
        const person = {
            id: this.generateId('p'),
            name: name,
            activities: []
        };
        
        this.people.push(person);
        this.render();
        this.saveToStorage();
    }
    
    addActivity(personId, text) {
        const person = this.findById(this.people, personId);
        if (!person) return;
        
        person.activities.push({
            id: this.generateId('a'),
            text: text
        });
        
        this.renderPeople();
        this.saveToStorage();
    }
    
    addActivityFromInput(input) {
        const text = input.value.trim();
        if (!text) return;
        
        const personId = input.dataset.personId;
        this.addActivity(personId, text);
        input.value = '';
    }
    
    removeActivity(personId, activityId) {
        const person = this.findById(this.people, personId);
        if (!person) return;
        
        person.activities = person.activities.filter(a => a.id !== activityId);
        this.assignments = this.assignments.filter(a => a.activityId !== activityId);
        
        this.render();
        this.saveToStorage();
    }
    
    deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.assignments = this.assignments.filter(a => a.taskId !== taskId);
        
        this.render();
        this.saveToStorage();
    }
    
    deletePerson(personId) {
        const person = this.findById(this.people, personId);
        if (!person) return;
        
        if (!confirm(`Are you sure you want to delete ${person.name}? This will remove all their activities and assignments.`)) return;
        
        this.people = this.people.filter(p => p.id !== personId);
        this.assignments = this.assignments.filter(a => a.personId !== personId);
        
        this.render();
        this.saveToStorage();
    }
    
    deleteEpic(epicId) {
        const epic = this.findById(this.epics, epicId);
        if (!epic) return;
        
        const alignedTasks = this.tasks.filter(t => t.epicId === epicId);
        const confirmMessage = alignedTasks.length > 0 ? 
            `Are you sure you want to delete "${epic.title}"? This will unalign ${alignedTasks.length} task(s).` :
            `Are you sure you want to delete "${epic.title}"?`;
            
        if (!confirm(confirmMessage)) return;
        
        // Unalign tasks
        this.tasks.forEach(task => {
            if (task.epicId === epicId) {
                const absPos = this.getTaskAbsolutePosition(task);
                task.x = absPos.x;
                task.y = absPos.y;
                delete task.epicId;
                delete task.ix;
                delete task.iy;
            }
        });
        
        this.epics = this.epics.filter(e => e.id !== epicId);
        
        this.render();
        this.saveToStorage();
    }
    
    // Dialog handling
    showDialog(title, placeholder, callback) {
        const overlay = document.getElementById('dialog-overlay');
        const titleEl = document.getElementById('dialog-title');
        const input = document.getElementById('dialog-input');
        
        titleEl.textContent = title;
        input.placeholder = placeholder;
        input.value = '';
        
        this.currentDialogCallback = callback;
        
        overlay.classList.remove('hidden');
        input.focus();
    }
    
    hideDialog() {
        document.getElementById('dialog-overlay').classList.add('hidden');
        this.currentDialogCallback = null;
    }
    
    confirmDialog() {
        const input = document.getElementById('dialog-input');
        const value = input.value.trim();
        
        if (!value) return;
        
        if (this.currentDialogCallback) {
            this.currentDialogCallback(value);
        }
        
        this.hideDialog();
    }
}

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PlanningApp();
});