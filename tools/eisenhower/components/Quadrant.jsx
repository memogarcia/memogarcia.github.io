const { useState, useRef } = React;

function Quadrant({ quadrant, onAddTask, onEditTask }) {
    const { getTasksByQuadrant, getTaskCount, updateTask } = useTasks();
    const [isDragOver, setIsDragOver] = useState(false);
    const taskListRef = useRef(null);

    const tasks = getTasksByQuadrant(quadrant);
    const taskCount = getTaskCount(quadrant);

    // Quadrant configuration
    const quadrantConfig = {
        'urgent-important': {
            title: 'Urgent & Important',
            subtitle: 'Focus on these first',
            action: 'Do First',
            emptyMessage: 'Focus on these first'
        },
        'important': {
            title: 'Not Urgent & Important',
            subtitle: '',
            action: 'Schedule',
            emptyMessage: 'Schedule these'
        },
        'urgent': {
            title: 'Urgent & Unimportant',
            subtitle: 'Delegate these',
            action: 'Delegate',
            emptyMessage: 'Delegate these'
        },
        'neither': {
            title: 'Not Urgent & Unimportant',
            subtitle: '',
            action: 'Eliminate',
            emptyMessage: 'Eliminate these'
        }
    };

    const config = quadrantConfig[quadrant] || quadrantConfig['neither'];

    // Drag and Drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        // Only remove drag-over state if leaving the task list entirely
        if (!taskListRef.current?.contains(e.relatedTarget)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        try {
            const taskId = e.dataTransfer.getData('text/plain');
            const taskData = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
            
            if (!taskId || !taskData || taskData.quadrant === quadrant) {
                return; // Same quadrant or invalid data
            }

            // Update task quadrant
            updateTask(taskId, { quadrant });
            
            // Show success notification (could be implemented with context)
            console.log('Task moved successfully');
            
        } catch (error) {
            console.error('Failed to move task:', error);
        }
    };

    const handleAddTaskClick = () => {
        onAddTask(quadrant);
    };

    // Touch drop zone detection for mobile
    const handleTouchMove = (e) => {
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const taskList = elementBelow?.closest('.task-list');
        
        if (taskList === taskListRef.current) {
            setIsDragOver(true);
        } else {
            setIsDragOver(false);
        }
    };

    const handleTouchEnd = (e) => {
        if (e.changedTouches.length !== 1) return;
        
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const taskList = elementBelow?.closest('.task-list');
        
        setIsDragOver(false);
        
        if (taskList === taskListRef.current) {
            // Handle touch drop
            const draggedElement = document.querySelector('.task-item.dragging');
            if (draggedElement) {
                const taskId = draggedElement.dataset.taskId;
                if (taskId) {
                    // Get current task data
                    const currentTasks = getTasksByQuadrant(quadrant);
                    const allTasks = ['urgent-important', 'important', 'urgent', 'neither']
                        .flatMap(q => getTasksByQuadrant(q));
                    const task = allTasks.find(t => t.id === taskId);
                    
                    if (task && task.quadrant !== quadrant) {
                        updateTask(taskId, { quadrant });
                        console.log('Task moved successfully via touch');
                    }
                }
            }
        }
    };

    return React.createElement(
        'div',
        {
            className: `quadrant quadrant-${quadrant}`,
            'data-quadrant': quadrant,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
        },
        
        // Header
        React.createElement(
            'div',
            { className: 'quadrant-header' },
            React.createElement(
                'div',
                { className: 'quadrant-info' },
                React.createElement(
                    'h2',
                    { className: 'quadrant-title' },
                    config.title
                ),
                config.subtitle && React.createElement(
                    'p',
                    { className: 'quadrant-subtitle' },
                    config.subtitle
                ),
                React.createElement(
                    'span',
                    {
                        className: 'task-count',
                        'data-count': quadrant
                    },
                    `${config.action} • `,
                    React.createElement(
                        'span',
                        { className: 'count' },
                        taskCount
                    ),
                    ' tasks'
                )
            ),
            React.createElement(
                'button',
                {
                    className: 'add-task-btn',
                    'data-quadrant': quadrant,
                    'aria-label': `Add ${config.title.toLowerCase()} task`,
                    onClick: handleAddTaskClick
                },
                React.createElement(
                    'svg',
                    {
                        width: '16',
                        height: '16',
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: '2'
                    },
                    React.createElement('line', {
                        x1: '12',
                        y1: '5',
                        x2: '12',
                        y2: '19'
                    }),
                    React.createElement('line', {
                        x1: '5',
                        y1: '12',
                        x2: '19',
                        y2: '12'
                    })
                )
            )
        ),
        
        // Task List
        React.createElement(
            'div',
            {
                ref: taskListRef,
                className: `task-list ${isDragOver ? 'drag-over' : ''}`,
                'data-quadrant': quadrant,
                onDragOver: handleDragOver,
                onDragLeave: handleDragLeave,
                onDrop: handleDrop
            },
            tasks.length === 0
                ? React.createElement(
                    'div',
                    { className: 'empty-state' },
                    React.createElement('p', null, config.emptyMessage)
                )
                : tasks.map(task =>
                    React.createElement(TaskItem, {
                        key: task.id,
                        task: task,
                        onEdit: onEditTask
                    })
                )
        )
    );
}

// Export for global access
window.Quadrant = Quadrant;