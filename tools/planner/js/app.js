// North Star Canvas - Planning Tool
// Pure HTML/CSS/JS implementation

import { persistence } from './persistence.js';

export class PlanningApp {
    constructor() {
        this.northStars = []; // Array of strategic objectives
        
        this.epics = [];
        
        this.tasks = [];
        
        this.people = [];
        
        this.assignments = [];
        this.dependencies = []; // Array of {from, to, type} objects
        
        this.view = { x: 0, y: 0, scale: 1 };
        this.dragging = null;
        this.dragStartPos = null;
        this.dragOffset = null;
        this.dependencyCreationMode = true; // Enable dependency creation via ports by default
        this.dependencyStart = null; // Starting task for dependency line
        this.hoveredTask = null; // Currently hovered task for dependency creation
        this.isDraggingDependency = false; // Flag for drag operation (legacy overlay flow)
        this.dependencyDragState = null; // State during dependency drag
        this.autoAlignMode = false; // Flag for auto-alignment mode
        this.originalPositions = new Map(); // Store original task positions for restoration
        this.selected = new Set(); // Currently selected objects for multi-drag
        
        // Constants - will be updated based on screen size
        this.updateConstants();
        
        // Add resize listener
        window.addEventListener('resize', () => {
            this.updateConstants();
            this.render();
        });
        
        // Pre-bind reusable global handlers to avoid add/remove leaks
        this._handlers = {
            depMouseMove: this.handleDependencyMouseMove.bind(this),
            depMouseUp: this.handleDependencyMouseUp.bind(this),
            depTouchMove: this.handleDependencyTouchMove.bind(this),
            depTouchEnd: this.handleDependencyTouchEnd.bind(this),
        };

        this.init();
        this.loadFromStorage();
        this.setupEnhancedSidebars();
        this.setupDetailsPanel();
        this.setupGlobalKeyboardShortcuts();
    }

    // Escape text for safe innerHTML usage
    escapeHTML(value) {
        const str = String(value ?? '');
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    setupEnhancedSidebars() {
        // Initialize sidebar state and dimensions
        this.sidebarState = {
            people: {
                collapsed: false,
                width: parseInt(localStorage.getItem('people-sidebar-width')) || 320,
                defaultWidth: 320,
                element: document.getElementById('people-palette'),
                toggle: document.getElementById('sidebar-toggle'),
                resizeHandle: document.getElementById('people-resize-handle')
            },
            timeline: {
                collapsed: true,
                width: parseInt(localStorage.getItem('timeline-sidebar-width')) || 280,
                defaultWidth: 280,
                element: document.getElementById('timeline-sidebar'),
                toggle: document.getElementById('timeline-toggle'),
                resizeHandle: document.getElementById('timeline-resize-handle')
            }
        };

        // Load saved states and respect initial HTML state
        const isMobile = window.innerWidth <= 480;
        
        // Check if sidebars are already collapsed in HTML
        const peopleHtmlCollapsed = this.sidebarState.people.element?.classList.contains('collapsed');
        const timelineHtmlCollapsed = this.sidebarState.timeline.element?.classList.contains('collapsed');
        
        const peopleCollapsed = peopleHtmlCollapsed ?? (localStorage.getItem('people-sidebar-collapsed') === 'true' || (isMobile && localStorage.getItem('people-sidebar-collapsed') === null));
        // Timeline starts collapsed by default (as set in HTML) unless specifically set to false
        const timelineCollapsed = timelineHtmlCollapsed ?? (localStorage.getItem('timeline-sidebar-collapsed') !== 'false');

        this.sidebarState.people.collapsed = peopleCollapsed;
        this.sidebarState.timeline.collapsed = timelineCollapsed;
        

        // Initialize sidebar states
        this.initializeSidebar('people');
        this.initializeSidebar('timeline');

        // Setup resize functionality
        this.setupSidebarResize('people');
        this.setupSidebarResize('timeline');

        // Setup accessibility features
        this.setupSidebarKeyboardNavigation();
    }

    initializeSidebar(sidebarKey) {
        const sidebar = this.sidebarState[sidebarKey];
        
        // Validate elements exist
        if (!sidebar.element) {
            console.error(`Sidebar element not found for ${sidebarKey}`);
            return;
        }
        
        // Set initial width
        if (!sidebar.collapsed) {
            sidebar.element.style.width = `${sidebar.width}px`;
        }

        // Set collapsed state
        if (sidebar.collapsed) {
            sidebar.element.classList.add('collapsed');
            if (sidebar.toggle) {
                sidebar.toggle.setAttribute('aria-expanded', 'false');
                sidebar.toggle.setAttribute('aria-label', `Show ${sidebarKey === 'people' ? 'People' : 'Timeline'} Sidebar`);
                const icon = sidebar.toggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', sidebarKey === 'people' ? 'panel-left-open' : 'panel-right-open');
                }
            }
        } else {
            sidebar.element.classList.remove('collapsed');
            sidebar.element.style.width = `${sidebar.width}px`;
            if (sidebar.toggle) {
                sidebar.toggle.setAttribute('aria-expanded', 'true');
                sidebar.toggle.setAttribute('aria-label', `Collapse ${sidebarKey === 'people' ? 'People' : 'Timeline'} Sidebar`);
                const icon = sidebar.toggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', sidebarKey === 'people' ? 'panel-left-close' : 'panel-right-close');
                }
            }
        }

        // Remove any existing event listeners to prevent duplicates
        if (sidebar.toggle) {
            sidebar.toggle.replaceWith(sidebar.toggle.cloneNode(true));
            sidebar.toggle = sidebar.element.querySelector('.sidebar-toggle');
            sidebar.toggle.addEventListener('click', () => this.toggleSidebar(sidebarKey));
        }

        // Update Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    toggleSidebar(sidebarKey) {
        const sidebar = this.sidebarState[sidebarKey];
        if (!sidebar || !sidebar.element) {
            console.error(`Sidebar not found: ${sidebarKey}`);
            return;
        }
        
        const wasCollapsed = sidebar.collapsed;
        sidebar.collapsed = !wasCollapsed;
        
        if (sidebar.collapsed) {
            // Collapsing
            sidebar.element.classList.add('collapsed');
            
            // Update toggle button
            if (sidebar.toggle) {
                sidebar.toggle.setAttribute('aria-expanded', 'false');
                sidebar.toggle.setAttribute('aria-label', `Show ${sidebarKey === 'people' ? 'People' : 'Timeline'} Sidebar`);
                const icon = sidebar.toggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', sidebarKey === 'people' ? 'panel-left-open' : 'panel-right-open');
                }
            }
        } else {
            // Expanding
            sidebar.element.classList.remove('collapsed');
            sidebar.element.style.width = `${sidebar.width}px`;
            
            // Update toggle button
            if (sidebar.toggle) {
                sidebar.toggle.setAttribute('aria-expanded', 'true');
                sidebar.toggle.setAttribute('aria-label', `Collapse ${sidebarKey === 'people' ? 'People' : 'Timeline'} Sidebar`);
                const icon = sidebar.toggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', sidebarKey === 'people' ? 'panel-left-close' : 'panel-right-close');
                }
            }
        }

        // Save state
        localStorage.setItem(`${sidebarKey}-sidebar-collapsed`, sidebar.collapsed.toString());
        
        // Update Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Trigger haptic feedback on supported devices
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }

        // Announce sidebar state change to screen readers
        this.announceSidebarState(sidebarKey, sidebar.collapsed);
    }

    setupSidebarResize(sidebarKey) {
        const sidebar = this.sidebarState[sidebarKey];
        const handle = sidebar.resizeHandle;
        
        if (!handle) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        // Mouse events
        handle.addEventListener('mousedown', (e) => {
            if (sidebar.collapsed) return;
            
            isResizing = true;
            startX = e.clientX;
            startWidth = sidebar.width;
            
            handle.classList.add('dragging');
            sidebar.element.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaX = sidebarKey === 'people' ? (e.clientX - startX) : (startX - e.clientX);
            const newWidth = Math.max(48, Math.min(sidebarKey === 'people' ? 500 : 400, startWidth + deltaX));
            
            sidebar.width = newWidth;
            sidebar.element.style.width = `${newWidth}px`;
        });

        document.addEventListener('mouseup', () => {
            if (!isResizing) return;
            
            isResizing = false;
            handle.classList.remove('dragging');
            sidebar.element.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            // Save width
            localStorage.setItem(`${sidebarKey}-sidebar-width`, sidebar.width.toString());
        });

        // Touch events for mobile
        handle.addEventListener('touchstart', (e) => {
            if (sidebar.collapsed) return;
            
            isResizing = true;
            startX = e.touches[0].clientX;
            startWidth = sidebar.width;
            
            handle.classList.add('dragging');
            sidebar.element.classList.add('resizing');
            
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isResizing) return;
            
            const deltaX = sidebarKey === 'people' ? (e.touches[0].clientX - startX) : (startX - e.touches[0].clientX);
            const newWidth = Math.max(48, Math.min(sidebarKey === 'people' ? 500 : 400, startWidth + deltaX));
            
            sidebar.width = newWidth;
            sidebar.element.style.width = `${newWidth}px`;
            
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (!isResizing) return;
            
            isResizing = false;
            handle.classList.remove('dragging');
            sidebar.element.classList.remove('resizing');
            
            // Save width
            localStorage.setItem(`${sidebarKey}-sidebar-width`, sidebar.width.toString());
            
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(25);
            }
        });
    }

    // Accessibility: Announce sidebar state changes to screen readers
    announceSidebarState(sidebarKey, collapsed) {
        const sidebarName = sidebarKey === 'people' ? 'People' : 'Timeline';
        const state = collapsed ? 'collapsed' : 'expanded';
        const message = `${sidebarName} sidebar ${state}`;
        
        // Create or update the announcement element
        let announcer = document.getElementById('sidebar-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'sidebar-announcer';
            announcer.className = 'sr-only';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(announcer);
        }
        
        // Clear and set the announcement
        announcer.textContent = '';
        setTimeout(() => {
            announcer.textContent = message;
        }, 100);
    }

    // Enhanced keyboard navigation for sidebars
    setupSidebarKeyboardNavigation() {
        // Add keyboard support for resize handles
        Object.keys(this.sidebarState).forEach(sidebarKey => {
            const handle = this.sidebarState[sidebarKey].resizeHandle;
            if (handle) {
                handle.setAttribute('tabindex', '0');
                handle.setAttribute('role', 'separator');
                handle.setAttribute('aria-orientation', 'vertical');
                handle.setAttribute('aria-label', `Resize ${sidebarKey === 'people' ? 'People' : 'Timeline'} sidebar`);
                
                handle.addEventListener('keydown', (e) => {
                    if (this.sidebarState[sidebarKey].collapsed) return;
                    
                    let newWidth = this.sidebarState[sidebarKey].width;
                    const step = e.shiftKey ? 50 : 10;
                    
                    switch (e.key) {
                        case 'ArrowLeft':
                            e.preventDefault();
                            newWidth = Math.max(48, newWidth - (sidebarKey === 'people' ? step : -step));
                            break;
                        case 'ArrowRight':
                            e.preventDefault();
                            newWidth = Math.min(sidebarKey === 'people' ? 500 : 400, newWidth + (sidebarKey === 'people' ? step : -step));
                            break;
                        case 'Home':
                            e.preventDefault();
                            newWidth = this.sidebarState[sidebarKey].defaultWidth;
                            break;
                        case 'Escape':
                            handle.blur();
                            return;
                        default:
                            return;
                    }
                    
                    this.sidebarState[sidebarKey].width = newWidth;
                    this.sidebarState[sidebarKey].element.style.width = `${newWidth}px`;
                    localStorage.setItem(`${sidebarKey}-sidebar-width`, newWidth.toString());
                    
                    // Announce the new width
                    this.announceWidthChange(sidebarKey, newWidth);
                });
            }
        });
    }

    // Announce width changes for accessibility
    announceWidthChange(sidebarKey, width) {
        const sidebarName = sidebarKey === 'people' ? 'People' : 'Timeline';
        const message = `${sidebarName} sidebar width: ${width} pixels`;
        
        let announcer = document.getElementById('width-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'width-announcer';
            announcer.className = 'sr-only';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(announcer);
        }
        
        announcer.textContent = message;
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

    // Selection handling
    toggleSelection(type, id) {
        const key = `${type}:${id}`;
        if (this.selected.has(key)) {
            this.selected.delete(key);
        } else {
            this.selected.add(key);
        }
        this.updateSelectionStyles();
    }

    clearSelection() {
        this.selected.clear();
        this.updateSelectionStyles();
    }

    updateSelectionStyles() {
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        this.selected.forEach(key => {
            const [type, id] = key.split(':');
            let selector = '';
            if (type === 'task') selector = `[data-task-id="${id}"]`;
            else if (type === 'epic') selector = `[data-epic-id="${id}"]`;
            else if (type === 'north-star') selector = `[data-north-star-id="${id}"]`;
            const el = document.querySelector(selector);
            if (el) {
                // For epics and north stars, the draggable element is the container
                el.classList.add('selected');
            }
        });
    }

    getItemFromTarget(target) {
        const dragType = target.dataset.dragType;
        if (dragType === 'task') {
            return { type: 'task', id: target.closest('.task').dataset.taskId };
        } else if (dragType === 'epic') {
            return { type: 'epic', id: target.closest('.epic').dataset.epicId };
        } else if (dragType === 'north-star') {
            return { type: 'north-star', id: target.closest('.north-star').dataset.northStarId };
        }
        return { type: dragType };
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
    
    // Persistence methods are mixed in from persistence.js
    
    updateConstants() {
        const width = window.innerWidth;
        this.NS_HEADER = 64;
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
        this.addMobileEnhancements();
        
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
        
        document.getElementById('add-north-star').addEventListener('click', () => {
            this.showDialog('New North Star', 'e.g., Improve Customer Retention by 25%', (title) => {
                this.addNorthStar(title);
            });
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

        
        
        document.getElementById('auto-align').addEventListener('click', () => {
            this.toggleAutoAlignment();
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
        this.renderNorthStars();
        this.renderEpics();
        this.renderTasks();
        this.renderConnections();
        this.renderDependencies();
        this.renderEmptyState();
        this.updateTimelineSidebar();
        this.updateUnalignedCount();
        this.updateStrategicAlignment();
        this.updateWorldTransform();
        this.updateSelectionStyles();
    }

    renderEmptyState() {
        const world = document.getElementById('world');
        const existingEmptyState = world.querySelector('.empty-state');
        
        // Remove existing empty state
        if (existingEmptyState) {
            existingEmptyState.remove();
        }
        
        // Check if we have any content
        const hasContent = this.northStars.length > 0 || this.epics.length > 0 || this.tasks.length > 0;
        
        if (!hasContent) {
            const emptyStateDiv = document.createElement('div');
            emptyStateDiv.className = 'empty-state';
            emptyStateDiv.innerHTML = `
                <div class="card empty-state-card">
                    <div class="empty-state-icon">
                        <i data-lucide="compass"></i>
                    </div>
                    <div class="empty-state-title">Welcome to Planner</div>
                    <div class="empty-state-description">
                        Create your first North Star to define strategic objectives, then add Epics and Tasks to break down the work.
                    </div>
                    <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem;">
                        <button class="btn btn-primary" onclick="app.addNorthStar()">
                            <i data-lucide="star"></i>
                            <span>Create North Star</span>
                        </button>
                        <button class="btn" onclick="app.addEpic()">
                            <i data-lucide="plus"></i>
                            <span>Add Epic</span>
                        </button>
                    </div>
                </div>
            `;
            
            // Center the empty state in the viewport
            emptyStateDiv.style.position = 'absolute';
            emptyStateDiv.style.top = '50%';
            emptyStateDiv.style.left = '50%';
            emptyStateDiv.style.transform = 'translate(-50%, -50%)';
            emptyStateDiv.style.zIndex = '1';
            
            world.appendChild(emptyStateDiv);
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
    
    initializeDependencyCreation() {
        // Initialize hover-based dependency creation system
        this.setupTaskHoverHandlers();
    }
    
    setupTaskHoverHandlers() {
        // This will be called after tasks are rendered to add hover handlers
        const tasks = document.querySelectorAll('.task, .epic, .north-star');
        tasks.forEach(taskEl => {
            this.addHoverDependencyHandlers(taskEl);
        });
    }
    
    addHoverDependencyHandlers(taskEl) {
        let hoverTimeout;
        let dependencyOverlay;
        
        const showDependencyOverlay = () => {
            if (dependencyOverlay) return; // Already shown
            
            dependencyOverlay = document.createElement('div');
            dependencyOverlay.className = 'dependency-overlay';
            
            // Add single draggable dependency handle
            const dependencyHandle = document.createElement('div');
            dependencyHandle.className = 'dependency-handle';
            dependencyHandle.innerHTML = '⟷';
            dependencyHandle.title = 'Drag to create dependency';
            
            dependencyOverlay.appendChild(dependencyHandle);
            taskEl.appendChild(dependencyOverlay);
            
            // Add drag handlers for dependency creation
            this.addDependencyDragHandlers(taskEl, dependencyHandle);
        };
        
        const hideDependencyOverlay = () => {
            if (dependencyOverlay && !this.isDraggingDependency) {
                dependencyOverlay.remove();
                dependencyOverlay = null;
            }
        };
        
        taskEl.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(showDependencyOverlay, 200); // Show after 200ms hover
        });
        
        taskEl.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);
            if (!this.isDraggingDependency) {
                setTimeout(hideDependencyOverlay, 150); // Hide after 150ms delay
            }
        });
    }
    
    addDependencyDragHandlers(taskEl, dependencyHandle) {
        const sourceId = taskEl.dataset.taskId || taskEl.dataset.epicId || taskEl.dataset.northStarId;
        const sourceType = taskEl.dataset.taskId ? 'task' : (taskEl.dataset.epicId ? 'epic' : 'north-star');
        
        let isDragging = false;
        let dragStartPos = null;
        let dragLine = null;
        
        // Mouse events
        dependencyHandle.addEventListener('mousedown', (e) => {
            this.startDependencyDrag(e, sourceId, sourceType, dependencyHandle);
        });
        
        // Touch events for mobile
        dependencyHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.startDependencyDrag({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => {},
                stopPropagation: () => {}
            }, sourceId, sourceType, dependencyHandle);
        }, { passive: false });
    }
    
    startDependencyDrag(e, sourceId, sourceType, handle) {
        e.preventDefault();
        e.stopPropagation();
        
        this.isDraggingDependency = true;
        this.dependencyDragState = {
            sourceId,
            sourceType,
            startPos: { x: e.clientX, y: e.clientY },
            handle
        };
        
        // Visual feedback
        document.body.classList.add('dependency-dragging');
        handle.classList.add('dragging');
        
        // Create drag line
        this.createDependencyDragLine(e.clientX, e.clientY);
        
        // Add document-level move and end handlers
        const handleMouseMove = (e) => this.updateDependencyDrag(e);
        const handleMouseUp = (e) => this.finishDependencyDrag(e, handleMouseMove, handleMouseUp);
        const handleTouchMove = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.updateDependencyDrag({ clientX: touch.clientX, clientY: touch.clientY });
        };
        const handleTouchEnd = (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.finishDependencyDrag({ clientX: touch.clientX, clientY: touch.clientY }, handleTouchMove, handleTouchEnd);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // Add escape handler
        this.dependencyEscapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.cancelDependencyDrag(handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd);
            }
        };
        document.addEventListener('keydown', this.dependencyEscapeHandler);
    }
    
    createDependencyDragLine(startX, startY) {
        // Remove existing drag line
        const existingLine = document.getElementById('dependency-drag-line');
        if (existingLine) existingLine.remove();
        
        // Create SVG line
        const svg = document.getElementById('connections');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.id = 'dependency-drag-line';
        line.setAttribute('class', 'dependency-drag-line');
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', startX);
        line.setAttribute('y2', startY);
        line.setAttribute('stroke', '#3b82f6');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('stroke-dasharray', '8,4');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        
        svg.appendChild(line);
    }
    
    updateDependencyDrag(e) {
        if (!this.isDraggingDependency || !this.dependencyDragState) return;
        
        const line = document.getElementById('dependency-drag-line');
        if (line) {
            line.setAttribute('x2', e.clientX);
            line.setAttribute('y2', e.clientY);
        }
        
        // Highlight potential drop targets
        this.updateDragTargetHighlight(e.clientX, e.clientY);
    }
    
    updateDragTargetHighlight(x, y) {
        // Clear existing highlights
        document.querySelectorAll('.task, .epic, .north-star').forEach(el => {
            el.classList.remove('dependency-drop-target', 'dependency-drop-invalid');
        });
        
        // Find element under cursor
        const elementUnder = document.elementFromPoint(x, y);
        const targetEl = elementUnder?.closest('.task, .epic, .north-star');
        
        if (targetEl) {
            const targetId = targetEl.dataset.taskId || targetEl.dataset.epicId || targetEl.dataset.northStarId;
            const sourceId = this.dependencyDragState.sourceId;
            
            // Don't allow self-dependency
            if (targetId === sourceId) {
                targetEl.classList.add('dependency-drop-invalid');
                return;
            }
            
            // Check for existing dependency
            const existingDep = this.dependencies.find(d =>
                d.from === sourceId && d.to === targetId
            );
            
            if (existingDep) {
                targetEl.classList.add('dependency-drop-invalid');
                return;
            }
            
            // Check for circular dependency
            if (this.wouldCreateCircularDependency(sourceId, targetId)) {
                targetEl.classList.add('dependency-drop-invalid');
                return;
            }
            
            // Valid drop target
            targetEl.classList.add('dependency-drop-target');
        }
    }
    
    finishDependencyDrag(e, mouseMoveHandler, mouseUpHandler, touchMoveHandler, touchEndHandler) {
        if (!this.isDraggingDependency || !this.dependencyDragState) return;
        
        const { sourceId, sourceType } = this.dependencyDragState;
        
        // Find drop target
        const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
        const targetEl = elementUnder?.closest('.task, .epic, .north-star');
        const targetId = targetEl?.dataset.taskId || targetEl?.dataset.epicId || targetEl?.dataset.northStarId;
        
        // Clean up
        this.cleanupDependencyDrag(mouseMoveHandler, mouseUpHandler, touchMoveHandler, touchEndHandler);
        
        // Create dependency if valid target
        if (targetId && targetId !== sourceId) {
            this.createDependency(sourceId, targetId);
        }
    }
    
    cancelDependencyDrag(mouseMoveHandler, mouseUpHandler, touchMoveHandler, touchEndHandler) {
        this.cleanupDependencyDrag(mouseMoveHandler, mouseUpHandler, touchMoveHandler, touchEndHandler);
    }
    
    cleanupDependencyDrag(mouseMoveHandler, mouseUpHandler, touchMoveHandler, touchEndHandler) {
        this.isDraggingDependency = false;
        this.dependencyDragState = null;
        
        // Clean up visual state
        document.body.classList.remove('dependency-dragging');
        document.querySelectorAll('.dependency-handle').forEach(h => h.classList.remove('dragging'));
        document.querySelectorAll('.task, .epic, .north-star').forEach(el => {
            el.classList.remove('dependency-drop-target', 'dependency-drop-invalid');
        });
        
        // Remove drag line
        const dragLine = document.getElementById('dependency-drag-line');
        if (dragLine) dragLine.remove();
        
        // Remove event listeners
        if (mouseMoveHandler) document.removeEventListener('mousemove', mouseMoveHandler);
        if (mouseUpHandler) document.removeEventListener('mouseup', mouseUpHandler);
        if (touchMoveHandler) document.removeEventListener('touchmove', touchMoveHandler);
        if (touchEndHandler) document.removeEventListener('touchend', touchEndHandler);
        
        if (this.dependencyEscapeHandler) {
            document.removeEventListener('keydown', this.dependencyEscapeHandler);
            this.dependencyEscapeHandler = null;
        }
        
        // Legacy overlay cleanup done; port-based dependency UI is always available
    }
    
    createDependency(fromId, toId) {
        // Check for existing dependency
        if (this.dependencies.some(d => d.from === fromId && d.to === toId)) {
            this.showDependencyError('Dependency already exists');
            return;
        }
        
        // Check for circular dependency
        if (this.wouldCreateCircularDependency(fromId, toId)) {
            this.showDependencyError('Would create circular dependency');
            return;
        }
        
        // Create dependency
        this.dependencies.push({
            from: fromId,
            to: toId,
            type: 'blocks'
        });
        
        this.render();
        this.saveToStorage();
        this.showDependencySuccess('Dependency created successfully');
        
        // If tasks are aligned in epics, apply Gantt chart behavior
        this.applyGanttBehavior(fromId, toId);
    }
    
    showDependencyError(message) {
        this.showDependencyMessage(message, 'error');
    }
    
    showDependencySuccess(message) {
        this.showDependencyMessage(message, 'success');
    }
    
    showDependencyMessage(message, type) {
        const existingMessage = document.getElementById('dependency-message');
        if (existingMessage) existingMessage.remove();
        
        const messageEl = document.createElement('div');
        messageEl.className = `dependency-message dependency-${type}`;
        messageEl.id = 'dependency-message';
        messageEl.textContent = message;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 3000);
    }
    
    applyGanttBehavior(fromId, toId) {
        const fromTask = this.findById(this.tasks, fromId);
        const toTask = this.findById(this.tasks, toId);
        
        // Only apply Gantt behavior if both tasks are aligned in epics
        if (!fromTask?.epicId || !toTask?.epicId) return;
        
        const fromEpic = this.findById(this.epics, fromTask.epicId);
        const toEpic = this.findById(this.epics, toTask.epicId);
        
        if (!fromEpic || !toEpic) return;
        
        // Calculate positions based on dependency
        const TASK_WIDTH = 200;
        const TASK_HEIGHT = 120;
        const GANTT_SPACING = 50; // Horizontal spacing between dependent tasks
        
        // Get absolute positions
        const fromPos = this.getTaskAbsolutePosition(fromTask);
        const toPos = this.getTaskAbsolutePosition(toTask);
        
        // If tasks are in the same epic, arrange horizontally
        if (fromTask.epicId === toTask.epicId) {
            const newToX = fromPos.x + TASK_WIDTH + GANTT_SPACING;
            
            // Update the dependent task's relative position within the epic
            toTask.x = newToX - fromEpic.x;
            toTask.y = toTask.y; // Keep same vertical position
            
            // Ensure the epic is wide enough to contain both tasks
            const minEpicWidth = (newToX - fromEpic.x) + TASK_WIDTH + 40; // 40px margin
            if (fromEpic.w < minEpicWidth) {
                fromEpic.w = minEpicWidth;
            }
        } else {
            // Tasks are in different epics - arrange epics horizontally
            const newEpicX = fromEpic.x + fromEpic.w + GANTT_SPACING;
            
            // Move the target epic to the right of the source epic
            const deltaX = newEpicX - toEpic.x;
            toEpic.x = newEpicX;
            
            // Also move any other tasks that depend on the moved epic
            this.adjustDependentEpics(toEpic.id, deltaX);
        }
        
        this.render();
        this.saveToStorage();
    }
    
    adjustDependentEpics(movedEpicId, deltaX) {
        // Find all tasks in the moved epic that have dependents
        const movedEpicTasks = this.tasks.filter(t => t.epicId === movedEpicId);
        
        movedEpicTasks.forEach(task => {
            // Find all tasks that depend on this task
            const dependentTasks = this.dependencies
                .filter(d => d.from === task.id)
                .map(d => this.findById(this.tasks, d.to))
                .filter(t => t && t.epicId && t.epicId !== movedEpicId);
            
            // Group dependents by epic and move those epics further right if needed
            const dependentEpics = [...new Set(dependentTasks.map(t => t.epicId))];
            
            dependentEpics.forEach(epicId => {
                const epic = this.findById(this.epics, epicId);
                if (epic) {
                    const movedEpic = this.findById(this.epics, movedEpicId);
                    const minX = movedEpic.x + movedEpic.w + 50; // 50px spacing
                    
                    if (epic.x < minX) {
                        const additionalDelta = minX - epic.x;
                        epic.x = minX;
                        // Recursively adjust dependents of this epic
                        this.adjustDependentEpics(epic.id, additionalDelta);
                    }
                }
            });
        });
    }
    
    clearDependencyDragState() {
        // Remove all dependency-related classes and states
        document.querySelectorAll('.task, .epic, .north-star').forEach(task => {
            task.classList.remove(
                'dependency-hover', 
                'dependency-source', 
                'dependency-target-valid', 
                'dependency-target-invalid',
                'dependency-success'
            );
        });
        
        document.querySelectorAll('.connection-port').forEach(port => {
            port.classList.remove(
                'drag-source', 
                'drag-target-valid', 
                'drag-target-invalid'
            );
        });
        
        // Remove preview line
        const existingPreview = document.querySelector('.dependency-preview-line');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // Hide snap preview
        const snapPreview = document.getElementById('snap-preview');
        if (snapPreview) {
            snapPreview.classList.remove('active');
        }
        
        // Reset drag state
        this.dependencyDragState = null;
    }
    
    setupConnectionPortListeners(taskElement, taskId) {
        const ports = taskElement.querySelectorAll('.connection-port');
        
        ports.forEach(port => {
            // Mouse events
            port.addEventListener('mousedown', (e) => this.handlePortMouseDown(e, taskId, port));
            port.addEventListener('mouseenter', (e) => this.handlePortMouseEnter(e, taskId, port));
            port.addEventListener('mouseleave', (e) => this.handlePortMouseLeave(e, taskId, port));
            
            // Touch events for mobile
            port.addEventListener('touchstart', (e) => this.handlePortTouchStart(e, taskId, port), { passive: false });
            
            // Add long press detection for better mobile UX
            let touchTimeout;
            port.addEventListener('touchstart', (e) => {
                if (!this.dependencyCreationMode) return;
                
                touchTimeout = setTimeout(() => {
                    // Show help tooltip on long press
                    if (port.dataset.portType === 'output') {
                        this.showPortTooltip(port, 'Drag from here to connect to another task');
                    } else {
                        this.showPortTooltip(port, 'Other tasks can connect to this port');
                    }
                }, 500);
            }, { passive: true });
            
            port.addEventListener('touchend', (e) => {
                if (touchTimeout) {
                    clearTimeout(touchTimeout);
                    touchTimeout = null;
                }
            }, { passive: true });
            
            port.addEventListener('touchcancel', (e) => {
                if (touchTimeout) {
                    clearTimeout(touchTimeout);
                    touchTimeout = null;
                }
            }, { passive: true });
            
            // Keyboard events for accessibility
            port.addEventListener('keydown', (e) => this.handlePortKeyDown(e, taskId, port));
            port.addEventListener('focus', (e) => this.handlePortFocus(e, taskId, port));
            port.addEventListener('blur', (e) => this.handlePortBlur(e, taskId, port));
        });
    }
    
    handlePortMouseDown(e, taskId, port) {
        if (!this.dependencyCreationMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const portType = port.dataset.portType;
        
        // Only allow drag from output ports
        if (portType !== 'output') return;
        
        this.startDependencyDrag(taskId, port, { x: e.clientX, y: e.clientY });
        
        // Add mouse move and up listeners to document (pre-bound to allow proper removal)
        document.addEventListener('mousemove', this._handlers.depMouseMove);
        document.addEventListener('mouseup', this._handlers.depMouseUp);
    }
    
    handlePortTouchStart(e, taskId, port) {
        if (!this.dependencyCreationMode) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const portType = port.dataset.portType;
        if (portType !== 'output') return;
        
        const touch = e.touches[0];
        this.startDependencyDrag(taskId, port, { x: touch.clientX, y: touch.clientY });
        
        // Add touch move and end listeners (pre-bound to allow proper removal)
        document.addEventListener('touchmove', this._handlers.depTouchMove);
        document.addEventListener('touchend', this._handlers.depTouchEnd);
    }
    
    startDependencyDrag(sourceTaskId, sourcePort, startPos) {
        this.dependencyDragState = {
            sourceTaskId: sourceTaskId,
            sourcePort: sourcePort,
            startPos: startPos,
            isActive: true
        };
        
        // Update UI
        sourcePort.classList.add('drag-source');
        const sourceTask = document.querySelector(`[data-task-id="${sourceTaskId}"]`);
        sourceTask.classList.add('dependency-source');
        
        // Haptic feedback for drag start
        if (this.hapticFeedback) {
            this.hapticFeedback.light();
        }
        
        // Update indicator
        const indicator = document.getElementById('dependency-mode-indicator');
        const indicatorText = document.getElementById('dependency-mode-text');
        indicatorText.textContent = 'Drag to a green input port to connect';
        indicator.classList.add('active');
        
        // Create preview line
        this.createPreviewLine(startPos);
    }
    
    createPreviewLine(startPos) {
        const svg = document.getElementById('dependencies-layer') || document.getElementById('connections');
        
        // Remove existing preview line
        const existingPreview = svg.querySelector('.dependency-preview-line');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // Create new preview line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('class', 'dependency-preview-line');
        
        // Convert screen coordinates to world coordinates
        const worldStart = this.screenToWorldCoordinates(startPos);
        const pathData = `M ${worldStart.x} ${worldStart.y} L ${worldStart.x} ${worldStart.y}`;
        line.setAttribute('d', pathData);
        
        svg.appendChild(line);
    }
    
    handleDependencyMouseMove(e) {
        if (!this.dependencyDragState?.isActive) return;
        
        this.updateDependencyDrag({ x: e.clientX, y: e.clientY });
    }
    
    handleDependencyTouchMove(e) {
        if (!this.dependencyDragState?.isActive) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        this.updateDependencyDrag({ x: touch.clientX, y: touch.clientY });
    }
    
    updateDependencyDrag(currentPos) {
        // Update preview line
        this.updatePreviewLine(currentPos);
        
        // Check for valid drop targets
        this.updateDropTargetStates(currentPos);
    }
    
    updatePreviewLine(currentPos) {
        const previewLine = document.querySelector('.dependency-preview-line');
        if (!previewLine) return;
        
        const worldStart = this.screenToWorldCoordinates(this.dependencyDragState.startPos);
        const worldEnd = this.screenToWorldCoordinates(currentPos);
        
        // Create curved path
        const pathData = this.createCurvedPath(worldStart, worldEnd);
        previewLine.setAttribute('d', pathData);
    }
    
    updateDropTargetStates(currentPos) {
        // Get element under cursor
        const elementUnder = document.elementFromPoint(currentPos.x, currentPos.y);
        const targetPort = elementUnder?.closest('.connection-port');
        const targetTask = elementUnder?.closest('.task');
        
        // Clear all target states
        document.querySelectorAll('.connection-port').forEach(port => {
            port.classList.remove('drag-target-valid', 'drag-target-invalid');
        });
        
        document.querySelectorAll('.task').forEach(task => {
            task.classList.remove('dependency-target-valid', 'dependency-target-invalid');
        });
        
        const snapPreview = document.getElementById('snap-preview');
        snapPreview.classList.remove('active');
        
        if (targetPort && targetTask) {
            const targetTaskId = targetPort.dataset.taskId;
            const portType = targetPort.dataset.portType;
            
            // Check if it's a valid target
            const isValidTarget = this.isValidDependencyTarget(
                this.dependencyDragState.sourceTaskId, 
                targetTaskId, 
                portType
            );
            
            if (isValidTarget) {
                targetPort.classList.add('drag-target-valid');
                targetTask.classList.add('dependency-target-valid');
                
                // Show snap preview
                const portRect = targetPort.getBoundingClientRect();
                snapPreview.style.left = (portRect.left + portRect.width / 2) + 'px';
                snapPreview.style.top = (portRect.top + portRect.height / 2) + 'px';
                snapPreview.classList.add('active');
                
            } else {
                targetPort.classList.add('drag-target-invalid');
                targetTask.classList.add('dependency-target-invalid');
            }
        }
    }
    
    isValidDependencyTarget(sourceTaskId, targetTaskId, targetPortType) {
        // Can't connect to self
        if (sourceTaskId === targetTaskId) return false;
        
        // Must be input port
        if (targetPortType !== 'input') return false;
        
        // Check for existing dependency
        const existingDependency = this.dependencies.find(dep =>
            dep.from === sourceTaskId && dep.to === targetTaskId
        );
        
        if (existingDependency) return false;
        
        // Check for circular dependencies
        if (this.wouldCreateCircularDependency(sourceTaskId, targetTaskId)) {
            return false;
        }
        
        return true;
    }
    
    wouldCreateCircularDependency(fromId, toId) {
        // Simple cycle detection using DFS
        const visited = new Set();
        
        function hasPath(start, end, dependencies) {
            if (start === end) return true;
            if (visited.has(start)) return false;
            
            visited.add(start);
            
            const outgoing = dependencies
                .filter(dep => dep.from === start)
                .map(dep => dep.to);
                
            for (const next of outgoing) {
                if (hasPath(next, end, dependencies)) {
                    return true;
                }
            }
            
            return false;
        }
        
        // Check if adding fromId -> toId would create a cycle
        return hasPath(toId, fromId, this.dependencies);
    }
    
    handleDependencyMouseUp(e) {
        this.finishDependencyDrag({ x: e.clientX, y: e.clientY });
        
        // Remove document listeners
        document.removeEventListener('mousemove', this._handlers.depMouseMove);
        document.removeEventListener('mouseup', this._handlers.depMouseUp);
    }
    
    handleDependencyTouchEnd(e) {
        e.preventDefault();
        
        // Get the touch position from the last known position
        const touch = e.changedTouches[0];
        this.finishDependencyDrag({ x: touch.clientX, y: touch.clientY });
        
        // Remove document listeners
        document.removeEventListener('touchmove', this._handlers.depTouchMove);
        document.removeEventListener('touchend', this._handlers.depTouchEnd);
    }
    
    finishDependencyDrag(endPos) {
        if (!this.dependencyDragState?.isActive) return;
        
        const elementUnder = document.elementFromPoint(endPos.x, endPos.y);
        const targetPort = elementUnder?.closest('.connection-port');
        
        if (targetPort) {
            const targetTaskId = targetPort.dataset.taskId;
            const portType = targetPort.dataset.portType;
            
            if (this.isValidDependencyTarget(
                this.dependencyDragState.sourceTaskId, 
                targetTaskId, 
                portType
            )) {
                this.createDependency(this.dependencyDragState.sourceTaskId, targetTaskId);
                this.showDependencySuccess();
                
                // Haptic feedback for successful connection
                if (this.hapticFeedback) {
                    this.hapticFeedback.heavy();
                }
            } else {
                this.showDependencyError('Invalid connection target');
            }
        } else {
            // Canceled - no target
            this.clearDependencyDragState();
        }
        
        this.dependencyDragState = null;
    }
    
    createDependency(fromId, toId) {
        const dependency = {
            from: fromId,
            to: toId,
            type: 'finish-to-start'
        };

        this.dependencies.push(dependency);
        this.renderDependencies();
        this.saveToStorage();
        
        this.clearDependencyDragState();
    }
    
    showDependencySuccess() {
        const indicator = document.getElementById('dependency-mode-indicator');
        const indicatorText = document.getElementById('dependency-mode-text');
        
        indicator.classList.add('success');
        indicatorText.textContent = 'Dependency created successfully!';
        
        setTimeout(() => {
            if (this.dependencyCreationMode) {
                indicator.classList.remove('success');
                indicatorText.textContent = 'Drag from yellow output port to green input port';
            }
        }, 2000);
    }
    
    showDependencyError(message) {
        const indicator = document.getElementById('dependency-mode-indicator');
        const indicatorText = document.getElementById('dependency-mode-text');
        
        indicator.classList.add('error');
        indicatorText.textContent = message;
        
        setTimeout(() => {
            if (this.dependencyCreationMode) {
                indicator.classList.remove('error');
                indicatorText.textContent = 'Drag from yellow output port to green input port';
            }
        }, 2000);
        
        this.clearDependencyDragState();
    }
    
    screenToWorldCoordinates(screenPos) {
        const canvas = document.getElementById('canvas');
        const world = document.getElementById('world');
        const canvasRect = canvas.getBoundingClientRect();
        
        const canvasX = screenPos.x - canvasRect.left;
        const canvasY = screenPos.y - canvasRect.top;
        
        return {
            x: (canvasX - this.view.x) / this.view.scale,
            y: (canvasY - this.view.y) / this.view.scale
        };
    }
    
    createCurvedPath(start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Control point offset based on distance
        const offset = Math.min(distance * 0.5, 100);
        
        const cp1x = start.x + offset;
        const cp1y = start.y;
        const cp2x = end.x - offset;
        const cp2y = end.y;
        
        return `M ${start.x} ${start.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${end.x} ${end.y}`;
    }
    
    // Port hover methods
    handlePortMouseEnter(e, taskId, port) {
        if (!this.dependencyCreationMode) return;
        
        port.style.transform = port.dataset.portType === 'input' ? 
            'translateY(-50%) scale(1.2)' : 
            'translateY(-50%) scale(1.2)';
    }
    
    handlePortMouseLeave(e, taskId, port) {
        if (!this.dependencyCreationMode) return;
        
        if (!port.classList.contains('drag-source') && 
            !port.classList.contains('drag-target-valid') && 
            !port.classList.contains('drag-target-invalid')) {
            port.style.transform = 'translateY(-50%) scale(1)';
        }
    }
    
    // Keyboard accessibility methods
    handlePortKeyDown(e, taskId, port) {
        if (!this.dependencyCreationMode) return;
        
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            
            if (port.dataset.portType === 'output') {
                // Start keyboard-based dependency creation
                this.startKeyboardDependencyCreation(taskId, port);
            }
        }
    }
    
    handlePortFocus(e, taskId, port) {
        if (!this.dependencyCreationMode) return;
        
        // Highlight the port and task
        port.style.transform = port.dataset.portType === 'input' ? 
            'translateY(-50%) scale(1.3)' : 
            'translateY(-50%) scale(1.3)';
    }
    
    handlePortBlur(e, taskId, port) {
        if (!this.dependencyCreationMode) return;
        
        port.style.transform = 'translateY(-50%) scale(1)';
    }
    
    startKeyboardDependencyCreation(sourceTaskId, sourcePort) {
        const indicator = document.getElementById('dependency-mode-indicator');
        const indicatorText = document.getElementById('dependency-mode-text');
        
        indicatorText.textContent = 'Use Tab to navigate to input ports, then press Enter to connect';
        
        // Mark source
        sourcePort.classList.add('drag-source');
        const sourceTask = document.querySelector(`[data-task-id="${sourceTaskId}"]`);
        sourceTask.classList.add('dependency-source');
        
        this.keyboardDependencyState = {
            sourceTaskId: sourceTaskId,
            sourcePort: sourcePort
        };
        
        // Set up enhanced keyboard navigation
        this.setupKeyboardDependencyNavigation();
    }
    
    setupKeyboardDependencyNavigation() {
        // Get all input ports for navigation
        const inputPorts = Array.from(document.querySelectorAll('.connection-port.input'));
        let currentIndex = -1;
        
        const keyboardHandler = (e) => {
            if (!this.keyboardDependencyState) return;
            
            switch(e.key) {
                case 'Tab':
                    e.preventDefault();
                    if (e.shiftKey) {
                        // Previous port
                        currentIndex = Math.max(0, currentIndex - 1);
                    } else {
                        // Next port
                        currentIndex = Math.min(inputPorts.length - 1, currentIndex + 1);
                    }
                    
                    // Remove previous focus
                    inputPorts.forEach(port => port.classList.remove('keyboard-focused'));
                    
                    // Focus current port
                    if (currentIndex >= 0 && currentIndex < inputPorts.length) {
                        const currentPort = inputPorts[currentIndex];
                        currentPort.classList.add('keyboard-focused');
                        currentPort.focus();
                        
                        // Show connection preview
                        this.showKeyboardConnectionPreview(currentPort);
                    }
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (currentIndex >= 0 && currentIndex < inputPorts.length) {
                        const targetPort = inputPorts[currentIndex];
                        const targetTaskId = targetPort.dataset.taskId;
                        
                        if (this.isValidDependencyTarget(
                            this.keyboardDependencyState.sourceTaskId,
                            targetTaskId,
                            'input'
                        )) {
                            this.createDependency(
                                this.keyboardDependencyState.sourceTaskId,
                                targetTaskId
                            );
                            this.showDependencySuccess();
                            this.endKeyboardDependencyCreation();
                        } else {
                            this.showDependencyError('Invalid connection target');
                        }
                    }
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    this.endKeyboardDependencyCreation();
                    break;
            }
        };
        
        // Add keyboard handler
        document.addEventListener('keydown', keyboardHandler);
        this.keyboardDependencyHandler = keyboardHandler;
        
        // Initial focus on first input port
        if (inputPorts.length > 0) {
            currentIndex = 0;
            inputPorts[0].classList.add('keyboard-focused');
            inputPorts[0].focus();
            this.showKeyboardConnectionPreview(inputPorts[0]);
        }
    }
    
    showKeyboardConnectionPreview(targetPort) {
        if (!this.keyboardDependencyState) return;
        
        // Get source and target positions
        const sourceTask = document.querySelector(`[data-task-id="${this.keyboardDependencyState.sourceTaskId}"]`);
        const targetTask = targetPort.closest('.task');
        
        if (!sourceTask || !targetTask) return;
        
        const sourcePos = this.getTaskAbsolutePosition(this.findById(this.tasks, this.keyboardDependencyState.sourceTaskId));
        const targetPos = this.getTaskAbsolutePosition(this.findById(this.tasks, targetPort.dataset.taskId));
        
        const startPoint = { 
            x: sourcePos.x + this.TASK_W + 6, 
            y: sourcePos.y + this.TASK_H / 2 
        };
        const endPoint = { 
            x: targetPos.x - 6, 
            y: targetPos.y + this.TASK_H / 2 
        };
        
        // Remove existing preview
        const existingPreview = document.querySelector('.keyboard-dependency-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // Create preview line
        const svg = document.getElementById('dependencies-layer') || document.getElementById('connections');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('class', 'keyboard-dependency-preview');
        line.setAttribute('d', this.createCurvedPath(startPoint, endPoint));
        line.style.stroke = '#10b981';
        line.style.strokeWidth = '2';
        line.style.strokeDasharray = '5,5';
        line.style.fill = 'none';
        line.style.opacity = '0.8';
        
        svg.appendChild(line);
    }
    
    endKeyboardDependencyCreation() {
        // Clean up keyboard state
        if (this.keyboardDependencyHandler) {
            document.removeEventListener('keydown', this.keyboardDependencyHandler);
            this.keyboardDependencyHandler = null;
        }
        
        // Remove keyboard focus styles
        document.querySelectorAll('.keyboard-focused').forEach(port => {
            port.classList.remove('keyboard-focused');
        });
        
        // Remove preview line
        const preview = document.querySelector('.keyboard-dependency-preview');
        if (preview) {
            preview.remove();
        }
        
        // Clear keyboard state
        this.keyboardDependencyState = null;
        
        // Clear drag states
        this.clearDependencyDragState();
        
        // Update indicator
        if (this.dependencyCreationMode) {
            const indicator = document.getElementById('dependency-mode-indicator');
            const indicatorText = document.getElementById('dependency-mode-text');
            indicatorText.textContent = 'Drag from yellow output port to green input port';
        }
    }
    
    showPortTooltip(port, message) {
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'port-tooltip';
        tooltip.textContent = message;
        tooltip.style.position = 'absolute';
        tooltip.style.background = '#1f2937';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '6px';
        tooltip.style.fontSize = '12px';
        tooltip.style.fontWeight = '500';
        tooltip.style.zIndex = '1000';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        tooltip.style.whiteSpace = 'nowrap';
        
        // Position tooltip above port
        const portRect = port.getBoundingClientRect();
        const canvasRect = document.getElementById('canvas').getBoundingClientRect();
        
        tooltip.style.left = (portRect.left - canvasRect.left) + 'px';
        tooltip.style.top = (portRect.top - canvasRect.top - 40) + 'px';
        tooltip.style.transform = 'translateX(-50%)';
        
        // Add to canvas
        document.getElementById('canvas').appendChild(tooltip);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 3000);
    }
    
    // Enhanced mobile touch support with haptic feedback
    addMobileEnhancements() {
        // Add haptic feedback for dependency interactions
        if ('vibrate' in navigator) {
            this.hapticFeedback = {
                light: () => navigator.vibrate(10),
                medium: () => navigator.vibrate(20),
                heavy: () => navigator.vibrate([20, 10, 20])
            };
        } else {
            this.hapticFeedback = {
                light: () => {},
                medium: () => {},
                heavy: () => {}
            };
        }
        
        // Improve touch accuracy with larger touch targets on small screens
        if (window.innerWidth <= 768) {
            const style = document.createElement('style');
            style.textContent = `
                @media (pointer: coarse) {
                    .connection-port {
                        width: 24px !important;
                        height: 24px !important;
                        border-width: 4px !important;
                    }
                    .connection-port.input {
                        left: -12px !important;
                    }
                    .connection-port.output {
                        right: -12px !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    renderDependencies() {
        const layer = document.getElementById('dependencies-layer');
        if (!layer) return;
        
        // Remove existing dependency lines and handles (keep defs and other layers)
        layer.querySelectorAll('.dependency-line, .dependency-delete-handle').forEach(el => el.remove());
        
        this.dependencies.forEach((dep, index) => {
            const fromItem = this.getItemById(dep.from);
            const toItem = this.getItemById(dep.to);

            if (!fromItem || !toItem) return;

            const startPoint = this.getItemCenter(fromItem);
            const endPoint = this.getItemCenter(toItem);

            // Create curved path using Bezier curve
            const pathData = this.createCurvedPath(startPoint, endPoint);
            
            // Create the dependency line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.setAttribute('d', pathData);
            line.setAttribute('class', 'dependency-line');
            line.setAttribute('data-from', dep.from);
            line.setAttribute('data-to', dep.to);
            line.setAttribute('data-dependency-index', index);
            
            // Add click handler for line selection/deletion
            line.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectDependencyLine(line, dep, index);
            });
            
            // Add hover effects
            line.addEventListener('mouseenter', () => {
                line.classList.add('highlighted');
                this.showDependencyDeleteHandle(line, dep, index);
            });
            
            line.addEventListener('mouseleave', () => {
                line.classList.remove('highlighted');
                this.hideDependencyDeleteHandle(index);
            });
            
            layer.appendChild(line);
        });
    }

    getItemById(id) {
        const task = this.findById(this.tasks, id);
        if (task) return { type: 'task', item: task };
        const epic = this.findById(this.epics, id);
        if (epic) return { type: 'epic', item: epic };
        const ns = this.findById(this.northStars, id);
        if (ns) return { type: 'north-star', item: ns };
        return null;
    }

    getItemCenter(entry) {
        const { type, item } = entry;
        if (type === 'task') {
            const pos = this.getTaskAbsolutePosition(item);
            return { x: pos.x + this.TASK_W / 2, y: pos.y + this.TASK_H / 2 };
        } else if (type === 'epic') {
            return { x: item.x + item.w / 2, y: item.y + item.h / 2 };
        } else if (type === 'north-star') {
            return { x: item.x + item.w / 2, y: item.y + item.h / 2 };
        }
        return { x: 0, y: 0 };
    }

    updateTimelineSidebar() {
        const container = document.getElementById('timeline-content');
        if (!container) return;

        const items = [];
        this.northStars.forEach(ns => {
            if (ns.dueDate) items.push({ type: 'North Star', title: ns.title, due: ns.dueDate });
        });
        this.epics.forEach(ep => {
            if (ep.dueDate) items.push({ type: 'Epic', title: ep.title, due: ep.dueDate });
        });
        this.tasks.forEach(t => {
            if (t.dueDate) items.push({ type: 'Task', title: t.title, due: t.dueDate });
        });

        items.sort((a, b) => new Date(a.due) - new Date(b.due));

        if (items.length === 0) {
            container.innerHTML = '<div class="timeline-empty">No timelines set</div>';
        } else {
            container.innerHTML = items.map(it => 
                `<div class=\"timeline-item\"><span class=\"timeline-type\">${this.escapeHTML(it.type)}</span>` +
                `<span class=\"timeline-title\">${this.escapeHTML(it.title)}</span>` +
                `<span class=\"timeline-date\">${new Date(it.due).toLocaleDateString()}</span></div>`
            ).join('');
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }
    
    showDependencyDeleteHandle(line, dependency, index) {
        // Remove existing handle
        this.hideDependencyDeleteHandle(index);
        
        // Get midpoint of the dependency line
        const pathElement = line;
        const pathLength = pathElement.getTotalLength();
        const midPoint = pathElement.getPointAtLength(pathLength / 2);
        
        // Create delete handle
        const handle = document.createElement('div');
        handle.className = 'dependency-delete-handle';
        handle.dataset.dependencyIndex = index;
        handle.innerHTML = '×';
        handle.title = 'Delete dependency';
        
        // Position the handle
        handle.style.left = (midPoint.x) + 'px';
        handle.style.top = (midPoint.y) + 'px';
        handle.style.transform = 'translate(-50%, -50%)';
        
        // Add click handler
        handle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteDependency(index);
        });
        
        // Add to world container (not SVG)
        const world = document.getElementById('world');
        world.appendChild(handle);
    }
    
    hideDependencyDeleteHandle(index) {
        const existingHandle = document.querySelector(`[data-dependency-index="${index}"]`);
        if (existingHandle) {
            existingHandle.remove();
        }
    }
    
    selectDependencyLine(line, dependency, index) {
        // Clear other selections
        document.querySelectorAll('.dependency-line').forEach(l => {
            l.classList.remove('highlighted');
        });
        
        // Highlight selected line
        line.classList.add('highlighted');
        
        // Show delete handle
        this.showDependencyDeleteHandle(line, dependency, index);
        
        // Auto-hide after a few seconds
        setTimeout(() => {
            if (!line.matches(':hover')) {
                line.classList.remove('highlighted');
                this.hideDependencyDeleteHandle(index);
            }
        }, 3000);
    }
    
    deleteDependency(index) {
        if (confirm('Delete this dependency?')) {
            this.dependencies.splice(index, 1);
            this.renderDependencies();
            this.saveToStorage();
            
            // Show success message
            const indicator = document.getElementById('dependency-mode-indicator');
            const indicatorText = document.getElementById('dependency-mode-text');
            
            if (this.dependencyCreationMode) {
                indicator.classList.add('success');
                indicatorText.textContent = 'Dependency deleted';
                
                setTimeout(() => {
                    if (this.dependencyCreationMode) {
                        indicator.classList.remove('success');
                        indicatorText.textContent = 'Drag from yellow output port to green input port';
                    }
                }, 1500);
            }
        }
    }
    
    // Auto-Alignment System
    toggleAutoAlignment() {
        this.autoAlignMode = !this.autoAlignMode;
        const button = document.getElementById('auto-align');
        
        if (this.autoAlignMode) {
            // Start auto-alignment
            button.classList.add('btn-active');
            button.title = 'Restore Original Layout';
            this.performAutoAlignment();
        } else {
            // Restore original layout
            button.classList.remove('btn-active');
            button.title = 'Auto-Align Tasks by Dependencies';
            this.restoreOriginalLayout();
        }
    }
    
    performAutoAlignment() {
        // Check if there are tasks to align
        if (this.tasks.length === 0) {
            this.showAutoAlignMessage('No tasks to align', 'error');
            this.autoAlignMode = false;
            document.getElementById('auto-align').classList.remove('btn-active');
            return;
        }
        
        // Check if there are dependencies
        if (this.dependencies.length === 0) {
            this.showAutoAlignMessage('No dependencies found. Create task dependencies first.', 'error');
            this.autoAlignMode = false;
            document.getElementById('auto-align').classList.remove('btn-active');
            return;
        }
        
        try {
            // Store original positions and epic assignments
            this.storeOriginalPositions();
            
            // Temporarily remove tasks from epics for better alignment
            this.temporarilyUnalignTasks();
            
            // Perform topological sort to create layers
            const layers = this.createDependencyLayers();
            
            // Calculate new positions
            const newPositions = this.calculateAlignedPositions(layers);
            
            // Animate tasks to new positions
            this.animateTasksToPositions(newPositions);
            
            this.showAutoAlignMessage(`Successfully aligned ${this.tasks.length} tasks in ${layers.length} layers`, 'success');
            
        } catch (error) {
            console.error('Auto-alignment error:', error);
            this.showAutoAlignMessage('Error during auto-alignment: ' + error.message, 'error');
            this.autoAlignMode = false;
            document.getElementById('auto-align').classList.remove('btn-active');
        }
    }
    
    storeOriginalPositions() {
        this.originalPositions.clear();
        
        this.tasks.forEach(task => {
            this.originalPositions.set(task.id, {
                x: task.x,
                y: task.y,
                ix: task.ix,
                iy: task.iy,
                epicId: task.epicId
            });
        });
    }
    
    temporarilyUnalignTasks() {
        this.tasks.forEach(task => {
            if (task.epicId) {
                // Convert epic-relative position to absolute
                const absPos = this.getTaskAbsolutePosition(task);
                task.x = absPos.x;
                task.y = absPos.y;
                delete task.ix;
                delete task.iy;
                delete task.epicId;
            }
        });
    }
    
    createDependencyLayers() {
        // Create adjacency list and in-degree count
        const graph = new Map();
        const inDegree = new Map();
        const taskIds = new Set(this.tasks.map(t => t.id));
        
        // Initialize graph
        this.tasks.forEach(task => {
            graph.set(task.id, []);
            inDegree.set(task.id, 0);
        });
        
        // Build graph from dependencies
        this.dependencies.forEach(dep => {
            // Only include dependencies where both tasks exist
            if (taskIds.has(dep.from) && taskIds.has(dep.to)) {
                graph.get(dep.from).push(dep.to);
                inDegree.set(dep.to, inDegree.get(dep.to) + 1);
            }
        });
        
        // Topological sort using Kahn's algorithm
        const layers = [];
        const queue = [];
        
        // Start with tasks that have no dependencies (in-degree 0)
        this.tasks.forEach(task => {
            if (inDegree.get(task.id) === 0) {
                queue.push(task.id);
            }
        });
        
        // If no starting points found, there might be isolated cycles or no dependencies at all
        if (queue.length === 0) {
            // Find any task as a starting point (this handles the case where all tasks have dependencies in a cycle)
            if (this.tasks.length > 0) {
                queue.push(this.tasks[0].id);
                inDegree.set(this.tasks[0].id, 0);
            }
        }
        
        while (queue.length > 0) {
            const currentLayer = [...queue];
            queue.length = 0; // Clear queue
            layers.push(currentLayer);
            
            currentLayer.forEach(taskId => {
                const neighbors = graph.get(taskId) || [];
                neighbors.forEach(neighborId => {
                    inDegree.set(neighborId, inDegree.get(neighborId) - 1);
                    if (inDegree.get(neighborId) === 0) {
                        queue.push(neighborId);
                    }
                });
            });
        }
        
        // Check for circular dependencies
        const processedTasks = layers.flat().length;
        if (processedTasks < this.tasks.length) {
            throw new Error('Circular dependencies detected. Cannot create valid layout.');
        }
        
        return layers;
    }
    
    calculateAlignedPositions(layers) {
        // Responsive spacing based on screen size
        const isMobile = window.innerWidth <= 768;
        const LAYER_SPACING = isMobile ? 160 : 200; // Horizontal spacing between layers
        const TASK_SPACING = isMobile ? 100 : 120; // Vertical spacing between tasks
        const MIN_PADDING = isMobile ? 30 : 50; // Minimum padding from edges
        
        const positions = new Map();
        
        // Get current viewport center
        const canvas = document.getElementById('canvas');
        const canvasRect = canvas.getBoundingClientRect();
        const viewportCenterX = (canvasRect.width / 2) / this.view.scale - this.view.x;
        const viewportCenterY = (canvasRect.height / 2) / this.view.scale - this.view.y;
        
        // Calculate layout dimensions
        const totalWidth = (layers.length - 1) * LAYER_SPACING;
        const maxLayerSize = Math.max(...layers.map(layer => layer.length));
        const totalHeight = (maxLayerSize - 1) * TASK_SPACING;
        
        // Calculate starting position (center the layout)
        const startX = viewportCenterX - totalWidth / 2;
        const startY = viewportCenterY - totalHeight / 2;
        
        // Position tasks in layers
        layers.forEach((layer, layerIndex) => {
            const layerX = startX + layerIndex * LAYER_SPACING;
            const layerHeight = (layer.length - 1) * TASK_SPACING;
            const layerStartY = startY + (totalHeight - layerHeight) / 2;
            
            layer.forEach((taskId, taskIndex) => {
                const taskY = layerStartY + taskIndex * TASK_SPACING;
                positions.set(taskId, {
                    x: Math.max(MIN_PADDING, layerX),
                    y: Math.max(MIN_PADDING, taskY)
                });
            });
        });
        
        return positions;
    }
    
    animateTasksToPositions(newPositions) {
        const tasks = document.querySelectorAll('.task');
        
        // Add animation class to all tasks
        tasks.forEach(taskEl => {
            taskEl.classList.add('auto-aligning');
        });
        
        // Update task positions in the data model
        this.tasks.forEach(task => {
            const newPos = newPositions.get(task.id);
            if (newPos) {
                task.x = newPos.x;
                task.y = newPos.y;
            }
        });
        
        // Re-render to apply new positions
        this.render();
        this.saveToStorage();
        
        // After animation completes, add success animation
        setTimeout(() => {
            tasks.forEach(taskEl => {
                taskEl.classList.remove('auto-aligning');
                taskEl.classList.add('auto-aligned');
            });
            
            // Remove success animation class after it completes
            setTimeout(() => {
                tasks.forEach(taskEl => {
                    taskEl.classList.remove('auto-aligned');
                });
            }, 600);
        }, 800);
    }
    
    restoreOriginalLayout() {
        if (this.originalPositions.size === 0) {
            this.showAutoAlignMessage('No original layout to restore', 'error');
            return;
        }
        
        try {
            // Restore original positions and epic assignments
            this.tasks.forEach(task => {
                const original = this.originalPositions.get(task.id);
                if (original) {
                    task.x = original.x;
                    task.y = original.y;
                    task.ix = original.ix;
                    task.iy = original.iy;
                    if (original.epicId) {
                        task.epicId = original.epicId;
                    }
                }
            });
            
            // Add animation class
            const tasks = document.querySelectorAll('.task');
            tasks.forEach(taskEl => {
                taskEl.classList.add('auto-aligning');
            });
            
            // Re-render to apply restored positions
            this.render();
            this.saveToStorage();
            
            // Remove animation class after completion
            setTimeout(() => {
                tasks.forEach(taskEl => {
                    taskEl.classList.remove('auto-aligning');
                });
            }, 800);
            
            this.showAutoAlignMessage('Layout restored to original positions', 'success');
            this.originalPositions.clear();
            
        } catch (error) {
            console.error('Restore layout error:', error);
            this.showAutoAlignMessage('Error restoring layout: ' + error.message, 'error');
        }
    }
    
    showAutoAlignMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.getElementById('auto-align-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'auto-align-message';
            messageEl.className = 'auto-align-message';
            document.body.appendChild(messageEl);
        }
        
        messageEl.textContent = message;
        messageEl.className = `auto-align-message ${type}`;
        messageEl.style.display = 'block';
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            if (messageEl) {
                messageEl.style.display = 'none';
            }
        }, 4000);
    }
    
    renderPeople() {
        const container = document.getElementById('people-list');
        
        if (this.people.length === 0) {
            // Show empty state card
            container.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Team</div>
                        <div class="card-description">Manage people and assignments</div>
                    </div>
                    <div class="card-content">
                        <div class="empty-state-icon">
                            <i data-lucide="users"></i>
                        </div>
                        <div style="text-align: center;">
                            <div class="empty-state-title" style="font-size: 1rem; margin-bottom: 0.5rem;">No people added</div>
                            <div class="empty-state-description" style="font-size: 0.8125rem;">
                                Add team members to assign tasks and track workload.
                            </div>
                            <button class="btn btn-primary" onclick="app.addPerson()" style="margin-top: 1rem;">
                                <i data-lucide="user-plus"></i>
                                <span>Add Person</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        // Clear container and render people
        container.innerHTML = '';
        
        this.people.forEach(person => {
            const personDiv = document.createElement('div');
            personDiv.className = 'person-card';
            personDiv.setAttribute('data-person-name', this.escapeHTML(person.name));
            personDiv.setAttribute('title', this.escapeHTML(person.name)); // Fallback tooltip
            personDiv.innerHTML = `
                <div class="person-header" draggable="true" data-type="person" data-person-id="${person.id}" onclick="app.openDetailsPanel('person', '${person.id}')" style="cursor: pointer;">
                    <i data-lucide="user"></i>
                    <span class="person-name">${this.escapeHTML(person.name)}</span>
                    <span class="activity-count">${person.activities.length}</span>
                    <button class="person-delete-btn" onclick="event.stopPropagation(); app.deletePerson('${person.id}')" title="Delete Person">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="activities-list">
                    ${person.activities.map(activity => `
                        <div class="activity-item">
                            <div class="activity" draggable="true" data-type="activity" data-person-id="${person.id}" data-activity-id="${activity.id}">
                                <span class="activity-text">${this.escapeHTML(activity.text)}</span>
                            </div>
                            <button class="remove-btn" onclick="app.removeActivity('${person.id}', '${activity.id}')">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    `).join('')}
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
    
    renderNorthStars() {
        const world = document.getElementById('world');
        
        // Remove existing north stars
        world.querySelectorAll('.north-star').forEach(el => el.remove());
        
        this.northStars.forEach(northStar => {
            const nsDiv = document.createElement('div');
            nsDiv.className = 'north-star';
            nsDiv.dataset.northStarId = northStar.id;
            nsDiv.style.transform = `translate(${northStar.x}px, ${northStar.y}px)`;
            nsDiv.style.width = `${northStar.w}px`;
            nsDiv.style.height = `${northStar.h}px`;
            
            const alignedEpics = this.epics.filter(e => e.northStarId === northStar.id);
            const totalTasks = alignedEpics.reduce((sum, epic) => {
                return sum + this.tasks.filter(t => t.epicId === epic.id).length;
            }, 0) + this.tasks.filter(t => t.northStarId === northStar.id && !t.epicId).length;
            
            const contentHeight = northStar.h - this.NS_HEADER;
            nsDiv.innerHTML = `
                <div class="north-star-header" data-drag-type="north-star" onclick="app.openDetailsPanel('north-star', '${northStar.id}')" style="cursor: pointer;">
                    <div class="north-star-info">
                        <div class="north-star-title">${this.escapeHTML(northStar.title)}</div>
                        <div class="north-star-metrics">
                            <span class="badge priority-${northStar.priority}">${northStar.priority}</span>
                            <span class="badge">Epics: ${alignedEpics.length}</span>
                            <span class="badge">Tasks: ${totalTasks}</span>
                            <span class="badge status-${northStar.status}">${northStar.status}</span>
                        </div>
                    </div>
                    <button class="north-star-delete-btn" onclick="event.stopPropagation(); app.deleteNorthStar('${northStar.id}')" title="Delete North Star">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="north-star-content" data-north-star-content="${northStar.id}" style="height: ${contentHeight}px;">
                    <div class="north-star-objective">${this.escapeHTML(northStar.objective || 'Define strategic objective...')}</div>
                    <div class="resize-handle" data-drag-type="resize" data-north-star-id="${northStar.id}"></div>
                </div>
            `;
            
            world.appendChild(nsDiv);
        });

        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        this.updateSelectionStyles();
    }

    renderEpics() {
        const world = document.getElementById('world');
        
        // Remove existing epics
        world.querySelectorAll('.epic').forEach(el => el.remove());
        
        this.epics.forEach(epic => {
            const epicDiv = document.createElement('div');
            epicDiv.className = `epic ${epic.status === 'done' ? 'done' : ''}`;
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
                <div class="epic-header" data-drag-type="epic" onclick="app.openDetailsPanel('epic', '${epic.id}')" style="cursor: pointer;">
                    <i data-lucide="star"></i>
                    <div class="epic-title">${this.escapeHTML(epic.title)}</div>
                    <div class="epic-badges">
                        <span class="badge priority-${epic.priority}">${epic.priority}</span>
                        <span class="badge">Tasks: ${epicTasks.length}</span>
                        <span class="badge">People: ${assignedPeopleIds.size}</span>
                    </div>
                    <button class="epic-done-btn" onclick="event.stopPropagation(); app.toggleEpicDone('${epic.id}')" title="Mark Epic as Done">
                        <i data-lucide="check"></i>
                    </button>
                    <button class="epic-delete-btn" onclick="event.stopPropagation(); app.deleteEpic('${epic.id}')" title="Delete Epic">
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

        this.updateSelectionStyles();
    }
    
    renderTasks() {
        const world = document.getElementById('world');
        
        // Remove existing tasks
        world.querySelectorAll('.task').forEach(el => el.remove());
        
        this.tasks.forEach(task => {
            const taskDiv = document.createElement('div');
            const absPos = this.getTaskAbsolutePosition(task);
            const taskAssignments = this.assignments.filter(a => a.taskId === task.id);
            
            taskDiv.className = `task ${task.epicId ? 'aligned' : 'unaligned'} ${task.status === 'done' ? 'done' : ''}`;
            taskDiv.dataset.taskId = task.id;
            taskDiv.dataset.dragType = 'task';
            taskDiv.style.transform = `translate(${absPos.x}px, ${absPos.y}px)`;
            
            taskDiv.innerHTML = `
                
                <div class="task-header" onclick="app.openDetailsPanel('task', '${task.id}')" style="cursor: pointer;">
                    <i data-lucide="target"></i>
                    <span>Task</span>
                    <button class="task-done-btn" onclick="event.stopPropagation(); app.toggleTaskDone('${task.id}')" title="Mark Task as Done">
                        <i data-lucide="check"></i>
                    </button>
                    <button class="task-delete-btn" onclick="event.stopPropagation(); app.deleteTask('${task.id}')" title="Delete Task">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="task-title" title="${this.escapeHTML(task.title)}">${this.escapeHTML(task.title)}</div>
                <div class="task-assignments">
                    ${taskAssignments.length === 0 ? 
                        '<span class="assignment-badge no-assignments">No people yet</span>' :
                        taskAssignments.map(assignment => {
                            const person = this.findById(this.people, assignment.personId);
                            const activity = assignment.activityId ? 
                                person?.activities.find(a => a.id === assignment.activityId) : null;
                            return `<span class="assignment-badge">
                                ${this.escapeHTML(person?.name || '')}${activity ? ` — ${this.escapeHTML(activity.text)}` : ''}
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
            
            // Add connection port event listeners
            this.setupConnectionPortListeners(taskDiv, task.id);
        });

        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        this.updateSelectionStyles();
    }
    
    renderConnections() {
        const layer = document.getElementById('alignment-layer');
        if (!layer) return;
        layer.innerHTML = '';
        
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
            
            layer.appendChild(line);
        });
    }
    
    updateUnalignedCount() {
        const count = this.tasks.filter(t => !t.epicId).length;
        document.getElementById('unaligned-count').textContent = count;
    }

    updateStrategicAlignment() {
        const totalTasks = this.tasks.length;
        if (totalTasks === 0) {
            document.getElementById('strategic-alignment').textContent = '0%';
            return;
        }
        
        // Count tasks with strategic alignment (via epic or directly)
        const alignedTasks = this.tasks.filter(task => {
            // Direct alignment to North Star
            if (task.northStarId) return true;
            
            // Inherited alignment via Epic
            if (task.epicId) {
                const epic = this.findById(this.epics, task.epicId);
                return epic && epic.northStarId;
            }
            
            return false;
        });
        
        const percentage = Math.round((alignedTasks.length / totalTasks) * 100);
        document.getElementById('strategic-alignment').textContent = `${percentage}%`;
    }
    
    updateWorldTransform() {
        const world = document.getElementById('world');
        world.style.transform = `translate(${this.view.x}px, ${this.view.y}px) scale(${this.view.scale})`;
        
        const svg = document.getElementById('connections');
        if (svg) {
            svg.style.transformOrigin = 'top left';
            svg.style.transform = `translate(${this.view.x}px, ${this.view.y}px) scale(${this.view.scale})`;
        }
        
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
        const target = e.target.closest('[data-drag-type]');
        if (target) {
            const item = this.getItemFromTarget(target);
            if (e.metaKey || e.ctrlKey) {
                // Toggle selection
                if (item.id) this.toggleSelection(item.type, item.id);
                return;
            }

            // Start multi-drag if item is selected among multiple
            const key = `${item.type}:${item.id}`;
            if (this.selected.has(key)) {
                if (this.selected.size > 1) {
                    this.startMultiDrag(e);
                    return;
                }
            } else {
                this.clearSelection();
                if (item.id) this.toggleSelection(item.type, item.id);
            }

            const dragType = target.dataset.dragType;
            if (dragType === 'north-star') {
                this.startDragNorthStar(e, target);
            } else if (dragType === 'epic') {
                this.startDragEpic(e, target);
            } else if (dragType === 'resize') {
                if (target.dataset.northStarId) {
                    this.startResizeNorthStar(e, target);
                } else {
                    this.startResizeEpic(e, target);
                }
            } else if (dragType === 'task') {
                this.startDragTask(e, target);
            }
        } else {
            // Clicked on empty canvas
            if (!(e.metaKey || e.ctrlKey)) this.clearSelection();
            if (e.shiftKey || e.metaKey || e.ctrlKey || e.button === 1) {
                this.dragging = { type: 'canvas' };
                this.dragStartPos = { x: e.clientX, y: e.clientY };
            }
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
        } else if (this.dragging.type === 'epic') {
            this.moveEpic(this.dragging.id, this.dragging.startPos.x + dx, this.dragging.startPos.y + dy);
        } else if (this.dragging.type === 'resize-north-star') {
            this.resizeNorthStar(this.dragging.id, dx, dy);
        } else if (this.dragging.type === 'resize') {
            this.resizeEpic(this.dragging.id, dx, dy);
        } else if (this.dragging.type === 'task') {
            this.moveTask(this.dragging.id, dx, dy);
        } else if (this.dragging.type === 'multi') {
            this.moveSelected(dx, dy);
        }
    }
    
    handleCanvasMouseUp(e) {
        if (this.dragging?.type === 'task') {
            this.handleTaskDragEnd(e);
        } else if (this.dragging?.type === 'epic') {
            this.handleEpicDragEnd(e);
        } else if (this.dragging?.type === 'multi') {
            this.saveToStorage();
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

    startDragNorthStar(e, element) {
        const northStarId = element.closest('.north-star').dataset.northStarId;
        const northStar = this.findById(this.northStars, northStarId);
        
        this.dragging = {
            type: 'north-star',
            id: northStarId,
            startPos: { x: northStar.x, y: northStar.y }
        };
        this.dragStartPos = { x: e.clientX, y: e.clientY };
        
        element.closest('.north-star').classList.add('dragging');
    }

    startResizeNorthStar(e, element) {
        const northStarId = element.dataset.northStarId;
        const northStar = this.findById(this.northStars, northStarId);
        
        this.dragging = {
            type: 'resize-north-star',
            id: northStarId,
            startPos: { w: northStar.w, h: northStar.h }
        };
        this.dragStartPos = { x: e.clientX, y: e.clientY };
        
        element.classList.add('dragging');
    }

    startMultiDrag(e) {
        const items = [];
        const selectedEpics = new Set();
        this.selected.forEach(key => {
            const [type, id] = key.split(':');
            if (type === 'epic') selectedEpics.add(id);
        });
        this.selected.forEach(key => {
            const [type, id] = key.split(':');
            if (type === 'task') {
                const task = this.findById(this.tasks, id);
                if (task && (!task.epicId || !selectedEpics.has(task.epicId))) {
                    const startPos = task.epicId ? { ix: task.ix || 0, iy: task.iy || 0, epicId: task.epicId } : { x: task.x, y: task.y };
                    items.push({ type: 'task', id, startPos });
                }
            } else if (type === 'epic') {
                const epic = this.findById(this.epics, id);
                if (epic) items.push({ type: 'epic', id, startPos: { x: epic.x, y: epic.y } });
            } else if (type === 'north-star') {
                const ns = this.findById(this.northStars, id);
                if (ns) items.push({ type: 'north-star', id, startPos: { x: ns.x, y: ns.y } });
            }
        });

        this.dragging = { type: 'multi', items };
        this.dragStartPos = { x: e.clientX, y: e.clientY };
    }

    moveSelected(dx, dy) {
        let epicMoved = false;
        this.dragging.items.forEach(item => {
            if (item.type === 'task') {
                const task = this.findById(this.tasks, item.id);
                if (!task) return;
                if (task.epicId) {
                    const epic = this.findById(this.epics, task.epicId);
                    if (!epic) return;
                    const maxX = Math.max(0, epic.w - this.EPIC_PAD_X * 2 - this.TASK_W);
                    const maxY = Math.max(0, epic.h - this.EPIC_HEADER - this.EPIC_PAD_Y * 2 - this.TASK_H);
                    task.ix = this.clamp(item.startPos.ix + dx / this.view.scale, 0, maxX);
                    task.iy = this.clamp(item.startPos.iy + dy / this.view.scale, 0, maxY);
                } else {
                    task.x = item.startPos.x + dx / this.view.scale;
                    task.y = item.startPos.y + dy / this.view.scale;
                }
                const absPos = this.getTaskAbsolutePosition(task);
                const el = document.querySelector(`[data-task-id="${item.id}"]`);
                if (el) el.style.transform = `translate(${absPos.x}px, ${absPos.y}px)`;
            } else if (item.type === 'epic') {
                const epic = this.findById(this.epics, item.id);
                if (!epic) return;
                epic.x = item.startPos.x + dx / this.view.scale;
                epic.y = item.startPos.y + dy / this.view.scale;
                const el = document.querySelector(`[data-epic-id="${item.id}"]`);
                if (el) el.closest('.epic').style.transform = `translate(${epic.x}px, ${epic.y}px)`;
                epicMoved = true;
            } else if (item.type === 'north-star') {
                const ns = this.findById(this.northStars, item.id);
                if (!ns) return;
                ns.x = item.startPos.x + dx / this.view.scale;
                ns.y = item.startPos.y + dy / this.view.scale;
                const el = document.querySelector(`[data-north-star-id="${item.id}"]`);
                if (el) el.closest('.north-star').style.transform = `translate(${ns.x}px, ${ns.y}px)`;
            }
        });
        if (epicMoved) {
            this.renderTasks();
        }
        this.renderConnections();
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
        this.updateSelectionStyles();
    }

    moveNorthStar(northStarId, x, y) {
        const northStar = this.findById(this.northStars, northStarId);
        if (!northStar) return;
        
        northStar.x = x;
        northStar.y = y;
        
        const element = document.querySelector(`[data-north-star-id="${northStarId}"]`);
        if (element) {
            element.closest('.north-star').style.transform = `translate(${x}px, ${y}px)`;
        }
        
        // Update connections
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

    resizeNorthStar(northStarId, dx, dy) {
        const northStar = this.findById(this.northStars, northStarId);
        if (!northStar) return;
        
        const MIN_NS_W = 400;
        const MIN_NS_H = 120;
        
        const newW = this.clamp(this.dragging.startPos.w + dx, MIN_NS_W, 1200);
        const newH = Math.max(this.dragging.startPos.h + dy, MIN_NS_H);
        
        northStar.w = newW;
        northStar.h = newH;
        
        this.renderNorthStars();
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

    handleEpicDragEnd(e) {
        const epicId = this.dragging.id;
        const epic = this.findById(this.epics, epicId);
        
        // Check if dropped on a North Star
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const northStarContent = elements.find(el => el.dataset.northStarContent);
        
        if (northStarContent && (!epic.northStarId || epic.northStarId !== northStarContent.dataset.northStarContent)) {
            // Align epic to North Star
            const northStarId = northStarContent.dataset.northStarContent;
            epic.northStarId = northStarId;
            epic.modifiedAt = Date.now();
        } else if (!northStarContent && epic.northStarId) {
            // Unalign epic from North Star (dropped outside any North Star)
            delete epic.northStarId;
            epic.modifiedAt = Date.now();
        }
        
        // Remove dragging class
        document.querySelector(`[data-epic-id="${epicId}"]`)?.closest('.epic')?.classList.remove('dragging');
        
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
    addNorthStar(title) {
        const northStar = {
            id: this.generateId('ns'),
            title: title,
            objective: '',
            successMetrics: '',
            timeframe: '',
            status: 'active',
            priority: 'high',
            x: 50 + Math.random() * 300,
            y: 30 + Math.random() * 80,
            w: 600,
            h: 180,
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            dueDate: null
        };
        
        this.northStars.push(northStar);
        this.render();
        this.saveToStorage();
    }

    addEpic(title) {
        const epic = {
            id: this.generateId('epic'),
            title: title,
            description: '',
            status: 'planning',
            priority: 'medium',
            x: 200 + Math.random() * 400,
            y: 80 + Math.random() * 120,
            w: 420,
            h: 320,
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            dueDate: null
        };
        
        this.epics.push(epic);
        this.render();
        this.saveToStorage();
    }
    
    addTask(title) {
        const task = {
            id: this.generateId('t'),
            title: title,
            description: '',
            status: 'todo',
            priority: 'medium',
            x: 260 + Math.random() * 520,
            y: 320 + Math.random() * 240,
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            dueDate: null
        };
        
        this.tasks.push(task);
        this.render();
        this.saveToStorage();
    }
    
    addPerson(name) {
        const person = {
            id: this.generateId('p'),
            name: name,
            role: '',
            email: '',
            activities: [],
            createdAt: Date.now(),
            modifiedAt: Date.now()
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

    deleteNorthStar(northStarId) {
        const northStar = this.findById(this.northStars, northStarId);
        if (!northStar) return;
        
        const alignedEpics = this.epics.filter(e => e.northStarId === northStarId);
        const confirmMessage = alignedEpics.length > 0 ? 
            `Are you sure you want to delete "${northStar.title}"? This will unalign ${alignedEpics.length} epic(s).` :
            `Are you sure you want to delete "${northStar.title}"?`;
            
        if (!confirm(confirmMessage)) return;
        
        // Unalign epics
        this.epics.forEach(epic => {
            if (epic.northStarId === northStarId) {
                delete epic.northStarId;
                epic.modifiedAt = Date.now();
            }
        });
        
        // Also unalign any directly aligned tasks
        this.tasks.forEach(task => {
            if (task.northStarId === northStarId) {
                delete task.northStarId;
                task.modifiedAt = Date.now();
            }
        });
        
        this.northStars = this.northStars.filter(ns => ns.id !== northStarId);

        this.render();
        this.saveToStorage();
    }

    toggleTaskDone(taskId) {
        const task = this.findById(this.tasks, taskId);
        if (!task) return;
        task.status = task.status === 'done' ? 'todo' : 'done';
        task.modifiedAt = Date.now();
        this.render();
        this.saveToStorage();
    }

    toggleEpicDone(epicId) {
        const epic = this.findById(this.epics, epicId);
        if (!epic) return;
        epic.status = epic.status === 'done' ? 'planning' : 'done';
        epic.modifiedAt = Date.now();
        this.render();
        this.saveToStorage();
    }

    // North Star helper functions
    loadNorthStarEpics(northStarId) {
        const epicsContainer = document.getElementById('ns-epics-list');
        const alignedEpics = this.epics.filter(epic => epic.northStarId === northStarId);
        
        if (alignedEpics.length === 0) {
            epicsContainer.innerHTML = '<p style="color: #64748b; font-size: 13px;">No epics aligned to this North Star</p>';
            return;
        }
        
        epicsContainer.innerHTML = alignedEpics.map(epic => `
            <div class="details-task-item" onclick="app.openDetailsPanel('epic', '${epic.id}')" tabindex="0">
                <div class="details-task-status ${epic.status === 'done' ? 'done' : ''}">
                    ${epic.status === 'done' ? '<i data-lucide="check"></i>' : ''}
                </div>
                <span class="details-task-title">${this.escapeHTML(epic.title)}</span>
                <div class="details-priority-badge ${epic.priority || 'medium'}">${epic.priority || 'medium'}</div>
            </div>
        `).join('');
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    updateNorthStarMetrics(northStarId) {
        const alignedEpics = this.epics.filter(e => e.northStarId === northStarId);
        const totalEpics = this.epics.length;
        
        const alignedTasks = alignedEpics.reduce((sum, epic) => {
            return sum + this.tasks.filter(t => t.epicId === epic.id).length;
        }, 0) + this.tasks.filter(t => t.northStarId === northStarId && !t.epicId).length;
        
        document.getElementById('ns-epic-alignment').textContent = 
            `${alignedEpics.length} of ${totalEpics} epics aligned`;
        document.getElementById('ns-task-coverage').textContent = 
            `${alignedTasks} tasks contributing`;
    }

    saveNorthStarDetails() {
        const northStar = this.northStars.find(ns => ns.id === this.currentDetailsItem?.id);
        if (!northStar) return;
        
        const title = document.getElementById('ns-title-input').value.trim();
        const objective = document.getElementById('ns-objective-input').value.trim();
        const metrics = document.getElementById('ns-metrics-input').value.trim();
        const timeframe = document.getElementById('ns-timeframe-input').value.trim();
        const status = document.getElementById('ns-status-input').value;
        const priority = document.getElementById('ns-priority-input').value;
        
        if (!title) {
            alert('North Star title is required');
            return;
        }
        
        northStar.title = title;
        northStar.objective = objective;
        northStar.successMetrics = metrics;
        northStar.timeframe = timeframe;
        northStar.status = status;
        northStar.priority = priority;
        northStar.modifiedAt = Date.now();
        
        this.render();
        this.saveToStorage();
        alert('North Star updated successfully');
    }

    deleteNorthStarFromDetails() {
        if (!this.currentDetailsItem?.id) return;
        
        if (confirm('Are you sure you want to delete this North Star? This will unalign any connected epics.')) {
            this.deleteNorthStar(this.currentDetailsItem.id);
            this.closeDetailsPanel();
        }
    }
    
    // Shortcut helper functions
    createNorthStar() {
        this.showDialog('New North Star', 'e.g., Improve Customer Retention by 25%', (title) => {
            this.addNorthStar(title);
        });
    }

    createEpic() {
        this.showDialog('New Epic', 'e.g., User Authentication', (title) => {
            this.addEpic(title);
        });
    }

    createTask() {
        this.showDialog('New Task', 'Short title', (title) => {
            this.addTask(title);
        });
    }

    createPerson() {
        this.showDialog('New Person', 'Name', (name) => {
            this.addPerson(name);
        });
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
    
    // Details Panel Management
    setupDetailsPanel() {
        const panel = document.getElementById('details-panel');
        const closeBtn = document.getElementById('details-panel-close');
        const overlay = document.getElementById('details-overlay');
        
        // Close panel handlers
        closeBtn.addEventListener('click', () => this.closeDetailsPanel());
        overlay.addEventListener('click', () => this.closeDetailsPanel());
        
        // Keyboard navigation and accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.classList.contains('open')) {
                this.closeDetailsPanel();
                e.preventDefault();
            }
            
            // Tab navigation within panel
            if (e.key === 'Tab' && panel.classList.contains('open')) {
                this.handleTabNavigation(e);
            }
        });
        
        // Make panel focusable
        panel.setAttribute('tabindex', '-1');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-labelledby', 'details-panel-title');
        
        // Setup action button handlers
        this.setupDetailActionHandlers();
        
        // Initial state - show empty state
        this.showEmptyDetailsState();
    }
    
    setupDetailActionHandlers() {
        // North Star action buttons
        document.getElementById('ns-save-btn')?.addEventListener('click', () => this.saveNorthStarDetails());
        document.getElementById('ns-delete-btn')?.addEventListener('click', () => this.deleteNorthStarFromDetails());

        // Epic action buttons
        document.getElementById('epic-save-btn')?.addEventListener('click', () => this.saveEpicDetails());
        document.getElementById('epic-delete-btn')?.addEventListener('click', () => this.deleteEpicFromDetails());
        
        // Task action buttons  
        document.getElementById('task-save-btn')?.addEventListener('click', () => this.saveTaskDetails());
        document.getElementById('task-delete-btn')?.addEventListener('click', () => this.deleteTaskFromDetails());
        
        // Person action buttons
        document.getElementById('person-save-btn')?.addEventListener('click', () => this.savePersonDetails());
        document.getElementById('person-delete-btn')?.addEventListener('click', () => this.deletePersonFromDetails());
    }
    
    setupGlobalKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only trigger shortcuts when not in input fields and panel is not open
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || 
                document.getElementById('details-panel').classList.contains('open')) {
                return;
            }
            
            // Ctrl + Arrow Keys for Sidebar Navigation
            if (e.ctrlKey && !e.shiftKey && !e.altKey) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.toggleSidebar('people');
                        return;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.toggleSidebar('timeline');
                        return;
                }
            }
            
            // Ctrl/Cmd + N for North Star
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.createNorthStar();
            }
            
            // Ctrl/Cmd + E for Epic
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.createEpic();
            }
            
            // Ctrl/Cmd + T for Task  
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.createTask();
            }
            
            // Ctrl/Cmd + P for Person
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                this.createPerson();
            }
        });
    }
    
    openDetailsPanel(type, itemId) {
        // Store current focus for restoration later
        this.storePreviousFocus();
        
        // Store current item details for save/delete operations
        this.currentDetailsItem = { type, id: itemId };
        
        const panel = document.getElementById('details-panel');
        const overlay = document.getElementById('details-overlay');
        const content = document.getElementById('details-panel-content');
        
        // Add transition class
        content.classList.add('transitioning');
        
        // Show panel
        panel.classList.add('open');
        
        // Show overlay on mobile
        if (window.innerWidth <= 768) {
            overlay.classList.add('visible');
        }
        
        // Load content after transition starts
        setTimeout(() => {
            this.loadDetailsContent(type, itemId);
            content.classList.remove('transitioning');
            content.classList.add('loaded');
            
            // Focus on the first input element or the panel itself
            const firstInput = panel.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            } else {
                panel.focus();
            }
        }, 150);
    }
    
    closeDetailsPanel() {
        const panel = document.getElementById('details-panel');
        const overlay = document.getElementById('details-overlay');
        const content = document.getElementById('details-panel-content');
        
        panel.classList.remove('open');
        overlay.classList.remove('visible');
        content.classList.remove('loaded');
        
        // Save any changes before closing
        this.saveDetailsChanges();
        
        // Restore focus to the previously focused element
        this.restorePreviousFocus();
    }
    
    loadDetailsContent(type, itemId) {
        // Hide all templates
        this.hideAllDetailsTemplates();
        
        // Update panel title
        const titleEl = document.getElementById('details-panel-title');
        const titleIcon = titleEl?.querySelector('i');
        const titleText = titleEl?.querySelector('span');
        
        switch (type) {
            case 'north-star':
                this.loadNorthStarDetails(itemId);
                if (titleIcon) titleIcon.setAttribute('data-lucide', 'star');
                if (titleText) titleText.textContent = 'North Star Details';
                break;
            case 'epic':
                this.loadEpicDetails(itemId);
                if (titleIcon) titleIcon.setAttribute('data-lucide', 'folder');
                if (titleText) titleText.textContent = 'Epic Details';
                break;
            case 'task':
                this.loadTaskDetails(itemId);
                if (titleIcon) titleIcon.setAttribute('data-lucide', 'target');
                if (titleText) titleText.textContent = 'Task Details';
                break;
            case 'person':
                this.loadPersonDetails(itemId);
                if (titleIcon) titleIcon.setAttribute('data-lucide', 'user');
                if (titleText) titleText.textContent = 'Person Details';
                break;
            default:
                this.showEmptyDetailsState();
                return;
        }
        
        // Refresh Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    hideAllDetailsTemplates() {
        document.getElementById('north-star-details-template').classList.add('hidden');
        document.getElementById('epic-details-template').classList.add('hidden');
        document.getElementById('task-details-template').classList.add('hidden');
        document.getElementById('person-details-template').classList.add('hidden');
        document.getElementById('empty-details-template').classList.add('hidden');
    }
    
    showEmptyDetailsState() {
        this.hideAllDetailsTemplates();
        document.getElementById('empty-details-template').classList.remove('hidden');
        
        const titleEl = document.getElementById('details-panel-title');
        const titleIcon = titleEl?.querySelector('i');
        const titleText = titleEl?.querySelector('span');
        
        if (titleIcon) {
            titleIcon.setAttribute('data-lucide', 'info');
        }
        if (titleText) {
            titleText.textContent = 'Details';
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    loadNorthStarDetails(northStarId) {
        const northStar = this.northStars.find(ns => ns.id === northStarId);
        if (!northStar) return;
        
        const template = document.getElementById('north-star-details-template');
        template.classList.remove('hidden');
        
        // Store current north star for saving changes
        this.currentDetailsItem = { type: 'north-star', id: northStarId };
        
        // Populate fields
        document.getElementById('ns-title-input').value = northStar.title || '';
        document.getElementById('ns-objective-input').value = northStar.objective || '';
        document.getElementById('ns-metrics-input').value = northStar.successMetrics || '';
        document.getElementById('ns-timeframe-input').value = northStar.timeframe || '';
        document.getElementById('ns-status-input').value = northStar.status || 'active';
        document.getElementById('ns-priority-input').value = northStar.priority || 'high';
        
        // Add real-time updating
        const titleInput = document.getElementById('ns-title-input');
        const objectiveInput = document.getElementById('ns-objective-input');
        const metricsInput = document.getElementById('ns-metrics-input');
        const timeframeInput = document.getElementById('ns-timeframe-input');
        const statusInput = document.getElementById('ns-status-input');
        const priorityInput = document.getElementById('ns-priority-input');
        
        const updateNorthStar = () => {
            northStar.title = titleInput.value;
            northStar.objective = objectiveInput.value;
            northStar.successMetrics = metricsInput.value;
            northStar.timeframe = timeframeInput.value;
            northStar.status = statusInput.value;
            northStar.priority = priorityInput.value;
            northStar.modifiedAt = Date.now();
            
            this.render();
            this.saveToStorage();
        };
        
        titleInput.addEventListener('input', updateNorthStar);
        objectiveInput.addEventListener('input', updateNorthStar);
        metricsInput.addEventListener('input', updateNorthStar);
        timeframeInput.addEventListener('input', updateNorthStar);
        statusInput.addEventListener('change', updateNorthStar);
        priorityInput.addEventListener('change', updateNorthStar);
        
        // Update metadata
        document.getElementById('ns-created-date').textContent = 
            new Date(northStar.createdAt).toLocaleDateString();
        document.getElementById('ns-modified-date').textContent = 
            new Date(northStar.modifiedAt).toLocaleDateString();
            
        // Load aligned epics
        this.loadNorthStarEpics(northStarId);
        
        // Update strategic metrics
        this.updateNorthStarMetrics(northStarId);
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    loadEpicDetails(epicId) {
        const epic = this.epics.find(e => e.id === epicId);
        if (!epic) return;
        
        const template = document.getElementById('epic-details-template');
        template.classList.remove('hidden');
        
        // Store current epic for saving changes
        this.currentDetailsItem = { type: 'epic', id: epicId };
        
        // Populate fields
        document.getElementById('epic-title-input').value = epic.title || '';
        document.getElementById('epic-description-input').value = epic.description || '';
        document.getElementById('epic-status-input').value = epic.status || 'planning';
        document.getElementById('epic-priority-input').value = epic.priority || 'medium';
        
        // Set up event listeners for real-time updates
        this.setupEpicDetailsListeners(epic);
        
        // Load tasks in epic
        this.loadEpicTasks(epicId);
        
        // Load metadata
        document.getElementById('epic-created-date').textContent = 
            epic.createdAt ? new Date(epic.createdAt).toLocaleString() : 'Unknown';
        document.getElementById('epic-modified-date').textContent = 
            epic.modifiedAt ? new Date(epic.modifiedAt).toLocaleString() : 'Unknown';
        
        const epicTasks = this.tasks.filter(task => task.epicId === epicId);
        document.getElementById('epic-task-count').textContent = epicTasks.length;
    }
    
    setupEpicDetailsListeners(epic) {
        const titleInput = document.getElementById('epic-title-input');
        const descInput = document.getElementById('epic-description-input');
        const statusInput = document.getElementById('epic-status-input');
        const priorityInput = document.getElementById('epic-priority-input');
        
        const updateEpic = () => {
            epic.title = titleInput.value;
            epic.description = descInput.value;
            epic.status = statusInput.value;
            epic.priority = priorityInput.value;
            epic.modifiedAt = Date.now();
            this.render();
            this.saveToStorage();
        };

        titleInput.addEventListener('input', updateEpic);
        descInput.addEventListener('input', updateEpic);
        statusInput.addEventListener('change', updateEpic);
        priorityInput.addEventListener('change', updateEpic);
    }
    
    loadEpicTasks(epicId) {
        const tasksContainer = document.getElementById('epic-tasks-list');
        const epicTasks = this.tasks.filter(task => task.epicId === epicId);
        
        if (epicTasks.length === 0) {
            tasksContainer.innerHTML = '<p style="color: #64748b; font-size: 13px;">No tasks in this epic</p>';
            return;
        }
        
        tasksContainer.innerHTML = epicTasks.map(task => `
            <div class="details-task-item" onclick="app.openDetailsPanel('task', '${task.id}')" tabindex="0">
                <div class="details-task-status ${task.status === 'done' ? 'done' : ''}">
                    ${task.status === 'done' ? '<i data-lucide="check"></i>' : ''}
                </div>
                <div class="details-task-title">${this.escapeHTML(task.title)}</div>
                <div class="details-priority-badge ${task.priority || 'medium'}">${task.priority || 'medium'}</div>
            </div>
        `).join('');
    }
    
    loadTaskDetails(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const template = document.getElementById('task-details-template');
        template.classList.remove('hidden');
        
        // Store current task for saving changes
        this.currentDetailsItem = { type: 'task', id: taskId };
        
        // Populate fields
        document.getElementById('task-title-input').value = task.title || '';
        document.getElementById('task-description-input').value = task.description || '';
        document.getElementById('task-status-input').value = task.status || 'todo';
        document.getElementById('task-priority-input').value = task.priority || 'medium';
        
        // Set up event listeners
        this.setupTaskDetailsListeners(task);
        
        // Load assignee info
        this.loadTaskAssignee(task);
        
        // Load parent epic info
        this.loadTaskEpic(task);
        
        // Load metadata
        document.getElementById('task-created-date').textContent = 
            task.createdAt ? new Date(task.createdAt).toLocaleString() : 'Unknown';
        document.getElementById('task-modified-date').textContent = 
            task.modifiedAt ? new Date(task.modifiedAt).toLocaleString() : 'Unknown';
    }
    
    setupTaskDetailsListeners(task) {
        const titleInput = document.getElementById('task-title-input');
        const descInput = document.getElementById('task-description-input');
        const statusInput = document.getElementById('task-status-input');
        const priorityInput = document.getElementById('task-priority-input');
        
        const updateTask = () => {
            task.title = titleInput.value;
            task.description = descInput.value;
            task.status = statusInput.value;
            task.priority = priorityInput.value;
            task.modifiedAt = Date.now();
            this.render();
            this.saveToStorage();
            
            // Update parent epic's modified date
            if (task.epicId) {
                const epic = this.epics.find(e => e.id === task.epicId);
                if (epic) {
                    epic.modifiedAt = Date.now();
                }
            }
        };
        
        titleInput.addEventListener('input', updateTask);
        descInput.addEventListener('input', updateTask);
        statusInput.addEventListener('change', updateTask);
        priorityInput.addEventListener('change', updateTask);
    }
    
    loadTaskAssignee(task) {
        const assignments = this.assignments.filter(a => a.taskId === task.id);
        const avatar = document.getElementById('task-assignee-avatar');
        const name = document.getElementById('task-assignee-name');
        const role = document.getElementById('task-assignee-role');
        
        if (assignments.length > 0) {
            const assignment = assignments[0]; // Show first assignment
            const person = this.people.find(p => p.id === assignment.personId);
            if (person) {
                avatar.textContent = person.name.charAt(0).toUpperCase();
                name.textContent = person.name;
                role.textContent = assignment.activityId ? 
                    person.activities.find(a => a.id === assignment.activityId)?.text || 'General' : 
                    'General';
                return;
            }
        }
        
        // No assignment
        avatar.textContent = '?';
        name.textContent = 'No assignment';
        role.textContent = 'Click to assign';
    }
    
    loadTaskEpic(task) {
        const epicInfo = document.getElementById('task-parent-epic');
        if (task.epicId) {
            const epic = this.epics.find(e => e.id === task.epicId);
            if (epic) {
                epicInfo.textContent = epic.title;
                epicInfo.style.cursor = 'pointer';
                epicInfo.onclick = () => this.openDetailsPanel('epic', epic.id);
                return;
            }
        }
        
        epicInfo.textContent = 'Not assigned to epic';
        epicInfo.style.cursor = 'default';
        epicInfo.onclick = null;
    }
    
    loadPersonDetails(personId) {
        const person = this.people.find(p => p.id === personId);
        if (!person) return;
        
        const template = document.getElementById('person-details-template');
        template.classList.remove('hidden');
        
        // Store current person for saving changes
        this.currentDetailsItem = { type: 'person', id: personId };
        
        // Populate fields
        document.getElementById('person-name-input').value = person.name || '';
        document.getElementById('person-role-input').value = person.role || '';
        document.getElementById('person-email-input').value = person.email || '';
        
        // Set up event listeners
        this.setupPersonDetailsListeners(person);
        
        // Load workload
        this.loadPersonWorkload(personId);
        
        // Load assigned tasks
        this.loadPersonTasks(personId);
    }
    
    setupPersonDetailsListeners(person) {
        const nameInput = document.getElementById('person-name-input');
        const roleInput = document.getElementById('person-role-input');
        const emailInput = document.getElementById('person-email-input');
        
        const updatePerson = () => {
            person.name = nameInput.value;
            person.role = roleInput.value;
            person.email = emailInput.value;
            person.modifiedAt = Date.now();
            this.render();
            this.saveToStorage();
        };
        
        nameInput.addEventListener('input', updatePerson);
        roleInput.addEventListener('input', updatePerson);
        emailInput.addEventListener('input', updatePerson);
    }
    
    loadPersonWorkload(personId) {
        const assignments = this.assignments.filter(a => a.personId === personId);
        const totalTasks = this.tasks.length;
        const assignedTasks = new Set(assignments.map(a => a.taskId)).size;
        
        const workloadPercent = totalTasks > 0 ? Math.round((assignedTasks / totalTasks) * 100) : 0;
        const workloadFill = document.getElementById('person-workload-fill');
        const workloadText = document.getElementById('person-workload-text');
        
        workloadFill.style.width = `${workloadPercent}%`;
        workloadText.textContent = `${assignedTasks} of ${totalTasks} tasks assigned (${workloadPercent}%)`;
        
        // Color coding for high workload
        if (workloadPercent > 75) {
            workloadFill.classList.add('high');
        } else {
            workloadFill.classList.remove('high');
        }
    }
    
    loadPersonTasks(personId) {
        const tasksContainer = document.getElementById('person-tasks-list');
        const assignments = this.assignments.filter(a => a.personId === personId);
        const assignedTaskIds = assignments.map(a => a.taskId);
        const assignedTasks = this.tasks.filter(t => assignedTaskIds.includes(t.id));
        
        if (assignedTasks.length === 0) {
            tasksContainer.innerHTML = '<p style="color: #64748b; font-size: 13px;">No tasks assigned</p>';
            return;
        }
        
        tasksContainer.innerHTML = assignedTasks.map(task => `
            <div class="details-task-item" onclick="app.openDetailsPanel('task', '${task.id}')" tabindex="0">
                <div class="details-task-status ${task.status === 'done' ? 'done' : ''}">
                    ${task.status === 'done' ? '<i data-lucide="check"></i>' : ''}
                </div>
                <div class="details-task-title">${this.escapeHTML(task.title)}</div>
                <div class="details-priority-badge ${task.priority || 'medium'}">${task.priority || 'medium'}</div>
            </div>
        `).join('');
    }
    
    saveDetailsChanges() {
        // Changes are saved in real-time through event listeners
        // This method is here for any future batch saving needs
        this.saveToStorage();
    }
    
    handleTabNavigation(e) {
        const panel = document.getElementById('details-panel');
        const focusableElements = panel.querySelectorAll(
            'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            // Shift + Tab (backward)
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            // Tab (forward)
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }
    
    // Store the element that had focus before opening the panel
    storePreviousFocus() {
        this.previousFocusElement = document.activeElement;
    }
    
    // Restore focus to the element that had focus before opening the panel
    restorePreviousFocus() {
        if (this.previousFocusElement && typeof this.previousFocusElement.focus === 'function') {
            this.previousFocusElement.focus();
        }
    }
    
    // Details Panel Save/Delete Methods
    saveEpicDetails() {
        const epic = this.epics.find(e => e.id === this.currentDetailsItem?.id);
        if (!epic) return;
        
        const title = document.getElementById('epic-title-input').value.trim();
        const description = document.getElementById('epic-description-input').value.trim();
        const status = document.getElementById('epic-status-input').value;
        const priority = document.getElementById('epic-priority-input').value;
        
        if (!title) {
            alert('Epic title is required');
            return;
        }
        
        epic.title = title;
        epic.description = description;
        epic.status = status;
        epic.priority = priority;
        epic.modifiedAt = new Date().toISOString();
        
        this.render();
        this.saveToStorage();
        alert('Epic updated successfully');
    }
    
    deleteEpicFromDetails() {
        if (!this.currentDetailsItem?.id) return;
        
        if (confirm('Are you sure you want to delete this epic? This will also remove all tasks within it.')) {
            this.deleteEpic(this.currentDetailsItem.id);
            this.closeDetailsPanel();
        }
    }
    
    saveTaskDetails() {
        const task = this.tasks.find(t => t.id === this.currentDetailsItem?.id);
        if (!task) return;
        
        const title = document.getElementById('task-title-input').value.trim();
        const description = document.getElementById('task-description-input').value.trim();
        const status = document.getElementById('task-status-input').value;
        const priority = document.getElementById('task-priority-input').value;
        
        if (!title) {
            alert('Task title is required');
            return;
        }
        
        task.title = title;
        task.description = description;
        task.status = status;
        task.priority = priority;
        task.modifiedAt = new Date().toISOString();
        
        this.render();
        this.saveToStorage();
        alert('Task updated successfully');
    }
    
    deleteTaskFromDetails() {
        if (!this.currentDetailsItem?.id) return;
        
        if (confirm('Are you sure you want to delete this task?')) {
            this.deleteTask(this.currentDetailsItem.id);
            this.closeDetailsPanel();
        }
    }
    
    savePersonDetails() {
        const person = this.people.find(p => p.id === this.currentDetailsItem?.id);
        if (!person) return;
        
        const name = document.getElementById('person-name-input').value.trim();
        const role = document.getElementById('person-role-input').value.trim();
        const email = document.getElementById('person-email-input').value.trim();
        
        if (!name) {
            alert('Person name is required');
            return;
        }
        
        person.name = name;
        person.role = role;
        person.email = email;
        
        this.render();
        this.saveToStorage();
        alert('Person updated successfully');
    }
    
    deletePersonFromDetails() {
        if (!this.currentDetailsItem?.id) return;
        
        if (confirm('Are you sure you want to delete this person? This will remove all assignments.')) {
            this.deletePerson(this.currentDetailsItem.id);
            this.closeDetailsPanel();
        }
    }
}

// Bootstrapping in js/main.js

/**
 * Mixin persistence methods into PlanningApp prototype
 * This adds saveToStorage, loadFromStorage, exportData, and importData methods
 * to all PlanningApp instances. These methods can be called as this.saveToStorage() etc.
 * 
 * Methods mixed in:
 * - saveToStorage(): Save state to localStorage
 * - loadFromStorage(): Load state from localStorage  
 * - exportData(): Export plan as JSON file
 * - importData(file): Import plan from JSON file
 */
Object.assign(PlanningApp.prototype, persistence);
