const { useState, useRef, useEffect } = React;

function TaskItem({ task, onEdit, onDragStart, onDragEnd }) {
    const { toggleTask, deleteTask } = useTasks();
    const [isDragging, setIsDragging] = useState(false);
    const itemRef = useRef(null);

    // HTML escape utility
    const escapeHtml = (text) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    };

    const handleCheckboxClick = (e) => {
        e.stopPropagation();
        toggleTask(task.id);
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        onEdit(task.id);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask(task.id);
        }
    };

    const handleContentClick = () => {
        onEdit(task.id);
    };

    // Drag and Drop handlers
    const handleDragStart = (e) => {
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.setData('application/json', JSON.stringify(task));
        
        if (itemRef.current) {
            itemRef.current.classList.add('dragging');
        }
        
        onDragStart && onDragStart(task.id, e);
    };

    const handleDragEnd = (e) => {
        setIsDragging(false);
        
        if (itemRef.current) {
            itemRef.current.classList.remove('dragging');
        }
        
        onDragEnd && onDragEnd(task.id, e);
    };

    // Touch events for mobile drag and drop
    const [touchStartTime, setTouchStartTime] = useState(0);
    const [touchTimer, setTouchTimer] = useState(null);

    const handleTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        
        setTouchStartTime(Date.now());
        
        // Long press detection for drag initiation
        const timer = setTimeout(() => {
            setIsDragging(true);
            if (itemRef.current) {
                itemRef.current.classList.add('dragging');
                // Provide haptic feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
            onDragStart && onDragStart(task.id, e);
        }, 500); // 500ms long press
        
        setTouchTimer(timer);
    };

    const handleTouchMove = (e) => {
        if (touchTimer) {
            clearTimeout(touchTimer);
            setTouchTimer(null);
        }

        if (!isDragging || e.touches.length !== 1) return;

        e.preventDefault();
        const touch = e.touches[0];
        
        // Move the dragged element
        if (itemRef.current) {
            itemRef.current.style.position = 'fixed';
            itemRef.current.style.left = touch.clientX - 50 + 'px';
            itemRef.current.style.top = touch.clientY - 25 + 'px';
            itemRef.current.style.zIndex = '1000';
            itemRef.current.style.transform = 'rotate(5deg) scale(1.1)';
        }
    };

    const handleTouchEnd = (e) => {
        if (touchTimer) {
            clearTimeout(touchTimer);
            setTouchTimer(null);
        }

        if (isDragging) {
            if (itemRef.current) {
                itemRef.current.style.position = '';
                itemRef.current.style.left = '';
                itemRef.current.style.top = '';
                itemRef.current.style.zIndex = '';
                itemRef.current.style.transform = '';
                itemRef.current.classList.remove('dragging');
            }
            setIsDragging(false);
            onDragEnd && onDragEnd(task.id, e);
        }
    };

    return React.createElement(
        'div',
        {
            ref: itemRef,
            className: `task-item ${task.completed ? 'completed' : ''}`,
            'data-task-id': task.id,
            draggable: true,
            role: 'listitem',
            tabIndex: 0,
            'aria-label': task.text,
            onDragStart: handleDragStart,
            onDragEnd: handleDragEnd,
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
        },
        // Checkbox
        React.createElement('div', {
            className: `task-checkbox ${task.completed ? 'checked' : ''}`,
            role: 'checkbox',
            'aria-checked': task.completed,
            'aria-label': `Mark task as ${task.completed ? 'incomplete' : 'complete'}`,
            onClick: handleCheckboxClick
        }),
        
        // Content
        React.createElement(
            'div',
            {
                className: 'task-content',
                onClick: handleContentClick
            },
            React.createElement(
                'div',
                {
                    className: 'task-text',
                    dangerouslySetInnerHTML: { __html: escapeHtml(task.text) }
                }
            ),
            task.notes && React.createElement(
                'div',
                {
                    className: 'task-notes',
                    dangerouslySetInnerHTML: { __html: escapeHtml(task.notes) }
                }
            ),
            React.createElement(
                'div',
                { className: 'task-inbox' },
                'Inbox'
            )
        ),
        
        // Actions
        React.createElement(
            'div',
            { className: 'task-actions' },
            React.createElement(
                'button',
                {
                    className: 'task-action edit',
                    'aria-label': 'Edit task',
                    title: 'Edit task',
                    onClick: handleEditClick
                },
                React.createElement(
                    'svg',
                    {
                        width: '14',
                        height: '14',
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: '2'
                    },
                    React.createElement('path', {
                        d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'
                    }),
                    React.createElement('path', {
                        d: 'm18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z'
                    })
                )
            ),
            React.createElement(
                'button',
                {
                    className: 'task-action delete',
                    'aria-label': 'Delete task',
                    title: 'Delete task',
                    onClick: handleDeleteClick
                },
                React.createElement(
                    'svg',
                    {
                        width: '14',
                        height: '14',
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: '2'
                    },
                    React.createElement('polyline', {
                        points: '3,6 5,6 21,6'
                    }),
                    React.createElement('path', {
                        d: 'm19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2'
                    })
                )
            )
        )
    );
}

// Export for global access
window.TaskItem = TaskItem;