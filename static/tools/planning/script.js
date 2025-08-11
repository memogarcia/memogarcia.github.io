// North Star Canvas - Planning Tool
// Pure HTML/CSS/JS implementation

class PlanningApp {
    constructor() {
        this.northStars = [];
        
        this.tasks = [];
        
        this.people = [];
        
        this.assignments = [];
        
        this.view = { x: 0, y: 0, scale: 1 };
        this.dragging = null;
        this.dragStartPos = null;
        this.dragOffset = null;
        
        // Constants - will be updated based on screen size
        this.updateConstants();
        
        // Add resize listener
        window.addEventListener('resize', () => {
            this.updateConstants();
            this.render();
        });
        
        this.init();
    }
    
    updateConstants() {
        const width = window.innerWidth;
        
        if (width <= 320) {
            this.NS_HEADER = 56;
            this.NS_PAD_X = 10;
            this.NS_PAD_Y = 8;
            this.TASK_W = 180;
            this.TASK_H = 72;
            this.MIN_NS_W = 200;
            this.MIN_NS_H = this.NS_HEADER + 100;
        } else if (width <= 480) {
            this.NS_HEADER = 56;
            this.NS_PAD_X = 12;
            this.NS_PAD_Y = 10;
            this.TASK_W = 200;
            this.TASK_H = 80;
            this.MIN_NS_W = 240;
            this.MIN_NS_H = this.NS_HEADER + 120;
        } else if (width <= 640) {
            this.NS_HEADER = 56;
            this.NS_PAD_X = 14;
            this.NS_PAD_Y = 11;
            this.TASK_W = 220;
            this.TASK_H = 88;
            this.MIN_NS_W = 280;
            this.MIN_NS_H = this.NS_HEADER + 130;
        } else {
            this.NS_HEADER = 56;
            this.NS_PAD_X = 16;
            this.NS_PAD_Y = 12;
            this.TASK_W = 260;
            this.TASK_H = 96;
            this.MIN_NS_W = 320;
            this.MIN_NS_H = this.NS_HEADER + 140;
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
        
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.view.scale = Math.min(2.2, this.view.scale * 1.12);
            this.updateWorldTransform();
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
            this.view.scale = Math.max(0.35, this.view.scale / 1.12);
            this.updateWorldTransform();
        });
        
        document.getElementById('add-north-star').addEventListener('click', () => {
            this.showDialog('New North Star', 'e.g., NPS 60+', (title) => {
                this.addNorthStar(title);
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
        this.renderNorthStars();
        this.renderTasks();
        this.renderConnections();
        this.updateUnalignedCount();
        this.updateWorldTransform();
    }
    
    renderPeople() {
        const container = document.getElementById('people-list');
        container.innerHTML = '';
        
        this.people.forEach(person => {
            const personDiv = document.createElement('div');
            personDiv.className = 'person-card';
            personDiv.innerHTML = `
                <div class="person-header" draggable="true" data-type="person" data-person-id="${person.id}">
                    <i data-lucide="user"></i>
                    <span class="person-name">${person.name}</span>
                    <span class="activity-count">${person.activities.length}</span>
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
    }
    
    renderNorthStars() {
        const world = document.getElementById('world');
        
        // Remove existing north stars
        world.querySelectorAll('.north-star').forEach(el => el.remove());
        
        this.northStars.forEach(ns => {
            const nsDiv = document.createElement('div');
            nsDiv.className = 'north-star';
            nsDiv.dataset.nsId = ns.id;
            nsDiv.style.transform = `translate(${ns.x}px, ${ns.y}px)`;
            nsDiv.style.width = `${ns.w}px`;
            nsDiv.style.height = `${ns.h}px`;
            
            const nsTasks = this.tasks.filter(t => t.northStarId === ns.id);
            const assignedPeopleIds = new Set(
                this.assignments
                    .filter(a => nsTasks.some(t => t.id === a.taskId))
                    .map(a => a.personId)
            );
            
            nsDiv.innerHTML = `
                <div class="north-star-header" data-drag-type="north-star">
                    <i data-lucide="star"></i>
                    <div class="north-star-title">${ns.title}</div>
                    <div class="north-star-badges">
                        <span class="badge">Tasks: ${nsTasks.length}</span>
                        <span class="badge">People: ${assignedPeopleIds.size}</span>
                    </div>
                </div>
                <div class="north-star-content" data-ns-content="${ns.id}" style="height: ${ns.h - this.NS_HEADER}px; padding: ${this.NS_PAD_Y}px ${this.NS_PAD_X}px;">
                    <div class="resize-handle" data-drag-type="resize" data-ns-id="${ns.id}"></div>
                </div>
            `;
            
            world.appendChild(nsDiv);
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
            
            taskDiv.className = `task ${task.northStarId ? 'aligned' : 'unaligned'}`;
            taskDiv.dataset.taskId = task.id;
            taskDiv.dataset.dragType = 'task';
            taskDiv.style.transform = `translate(${absPos.x}px, ${absPos.y}px)`;
            
            taskDiv.innerHTML = `
                <div class="task-header">
                    <i data-lucide="target"></i>
                    <span>Task</span>
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
                ${!task.northStarId ? '<div class="unaligned-status">Unaligned</div>' : ''}
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
        
        this.tasks.filter(t => t.northStarId).forEach(task => {
            const ns = this.findById(this.northStars, task.northStarId);
            if (!ns) return;
            
            const x1 = ns.x + this.NS_PAD_X + (task.ix || 0) + this.TASK_W / 2;
            const y1 = ns.y + this.NS_HEADER + this.NS_PAD_Y + (task.iy || 0) + this.TASK_H / 2;
            const x2 = ns.x + ns.w / 2;
            const y2 = ns.y + this.NS_HEADER / 2;
            
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
        const count = this.tasks.filter(t => !t.northStarId).length;
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
        if (!task.northStarId) {
            return { x: task.x, y: task.y };
        }
        
        const ns = this.findById(this.northStars, task.northStarId);
        if (!ns) return { x: task.x, y: task.y };
        
        return {
            x: ns.x + this.NS_PAD_X + (task.ix || 0),
            y: ns.y + this.NS_HEADER + this.NS_PAD_Y + (task.iy || 0)
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
            
            if (dragType === 'north-star') {
                this.startDragNorthStar(e, target);
            } else if (dragType === 'resize') {
                this.startResizeNorthStar(e, target);
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
        } else if (this.dragging.type === 'north-star') {
            this.moveNorthStar(this.dragging.id, this.dragging.startPos.x + dx, this.dragging.startPos.y + dy);
        } else if (this.dragging.type === 'resize') {
            this.resizeNorthStar(this.dragging.id, dx, dy);
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
    
    startDragNorthStar(e, element) {
        const nsId = element.closest('.north-star').dataset.nsId;
        const ns = this.findById(this.northStars, nsId);
        
        this.dragging = {
            type: 'north-star',
            id: nsId,
            startPos: { x: ns.x, y: ns.y }
        };
        this.dragStartPos = { x: e.clientX, y: e.clientY };
        
        element.closest('.north-star').classList.add('dragging');
    }
    
    startResizeNorthStar(e, element) {
        const nsId = element.dataset.nsId;
        const ns = this.findById(this.northStars, nsId);
        
        this.dragging = {
            type: 'resize',
            id: nsId,
            startSize: { w: ns.w, h: ns.h }
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
            startPos: task.northStarId ? 
                { ix: task.ix || 0, iy: task.iy || 0 } : 
                { x: task.x, y: task.y }
        };
        this.dragStartPos = { x: e.clientX, y: e.clientY };
        
        element.classList.add('dragging');
    }
    
    moveNorthStar(nsId, x, y) {
        const ns = this.findById(this.northStars, nsId);
        if (!ns) return;
        
        ns.x = x;
        ns.y = y;
        
        const element = document.querySelector(`[data-ns-id="${nsId}"]`);
        if (element) {
            element.closest('.north-star').style.transform = `translate(${x}px, ${y}px)`;
        }
        
        // Update task positions and connections
        this.renderTasks();
        this.renderConnections();
    }
    
    resizeNorthStar(nsId, dx, dy) {
        const ns = this.findById(this.northStars, nsId);
        if (!ns) return;
        
        const newW = this.clamp(this.dragging.startSize.w + dx, this.MIN_NS_W, 4000);
        const newH = this.clamp(this.dragging.startSize.h + dy, this.MIN_NS_H, 4000);
        
        ns.w = newW;
        ns.h = newH;
        
        // Clamp tasks within new bounds
        const maxX = Math.max(0, newW - this.NS_PAD_X * 2 - this.TASK_W);
        const maxY = Math.max(0, newH - this.NS_HEADER - this.NS_PAD_Y * 2 - this.TASK_H);
        
        this.tasks.forEach(task => {
            if (task.northStarId === nsId) {
                task.ix = this.clamp(task.ix || 0, 0, maxX);
                task.iy = this.clamp(task.iy || 0, 0, maxY);
            }
        });
        
        this.renderNorthStars();
        this.renderTasks();
        this.renderConnections();
    }
    
    moveTask(taskId, dx, dy) {
        const task = this.findById(this.tasks, taskId);
        if (!task) return;
        
        if (task.northStarId) {
            const ns = this.findById(this.northStars, task.northStarId);
            if (!ns) return;
            
            const maxX = Math.max(0, ns.w - this.NS_PAD_X * 2 - this.TASK_W);
            const maxY = Math.max(0, ns.h - this.NS_HEADER - this.NS_PAD_Y * 2 - this.TASK_H);
            
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
        
        // Check if dropped on a North Star
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const nsContent = elements.find(el => el.dataset.nsContent);
        
        if (nsContent && (!task.northStarId || task.northStarId !== nsContent.dataset.nsContent)) {
            // Align task to North Star
            const nsId = nsContent.dataset.nsContent;
            const ns = this.findById(this.northStars, nsId);
            const absPos = this.getTaskAbsolutePosition(task);
            
            const relX = absPos.x - (ns.x + this.NS_PAD_X);
            const relY = absPos.y - (ns.y + this.NS_HEADER + this.NS_PAD_Y);
            
            const maxX = Math.max(0, ns.w - this.NS_PAD_X * 2 - this.TASK_W);
            const maxY = Math.max(0, ns.h - this.NS_HEADER - this.NS_PAD_Y * 2 - this.TASK_H);
            
            task.northStarId = nsId;
            task.ix = this.clamp(relX, 0, maxX);
            task.iy = this.clamp(relY, 0, maxY);
            delete task.x;
            delete task.y;
            
        } else if (!nsContent && task.northStarId) {
            // Unalign task
            const absPos = this.getTaskAbsolutePosition(task);
            task.x = absPos.x;
            task.y = absPos.y;
            delete task.northStarId;
            delete task.ix;
            delete task.iy;
        }
        
        // Remove dragging class
        document.querySelector(`[data-task-id="${taskId}"]`)?.classList.remove('dragging');
        
        this.render();
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
        } catch (error) {
            console.error('Error handling drop:', error);
        }
    }
    
    // CRUD operations
    addNorthStar(title) {
        const ns = {
            id: this.generateId('ns'),
            title: title,
            x: 200 + Math.random() * 400,
            y: 80 + Math.random() * 120,
            w: 420,
            h: 320
        };
        
        this.northStars.push(ns);
        this.render();
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
    }
    
    addPerson(name) {
        const person = {
            id: this.generateId('p'),
            name: name,
            activities: []
        };
        
        this.people.push(person);
        this.render();
    }
    
    addActivity(personId, text) {
        const person = this.findById(this.people, personId);
        if (!person) return;
        
        person.activities.push({
            id: this.generateId('a'),
            text: text
        });
        
        this.renderPeople();
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