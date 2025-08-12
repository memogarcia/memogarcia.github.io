const { useState, useEffect, useRef } = React;

// Notification component
function Notification({ message, type = 'info', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const typeColors = {
        error: 'var(--destructive)',
        success: 'var(--success)',
        info: 'var(--primary)'
    };

    const notificationStyle = {
        position: 'fixed',
        top: '80px',
        right: '20px',
        background: 'var(--entry)',
        border: `1px solid ${typeColors[type]}`,
        borderRadius: '8px',
        padding: '12px 20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        maxWidth: '300px',
        color: typeColors[type],
        animation: 'slideIn 0.3s ease'
    };

    return React.createElement(
        'div',
        {
            style: notificationStyle
        },
        message
    );
}

// Add Task Dialog Component
function AddTaskDialog({ isOpen, onClose, quadrant }) {
    const { addTask } = useTasks();
    const [text, setText] = useState('');
    const [notes, setNotes] = useState('');
    const [notification, setNotification] = useState(null);
    const inputRef = useRef(null);

    const quadrantNames = {
        'urgent-important': 'Urgent & Important',
        'important': 'Not Urgent & Important',
        'urgent': 'Urgent & Unimportant',
        'neither': 'Not Urgent & Unimportant'
    };

    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [isOpen]);

    // Clear form when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setText('');
            setNotes('');
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const trimmedText = text.trim();
        if (!trimmedText || trimmedText.length === 0) {
            setNotification({ message: 'Task description is required', type: 'error' });
            return;
        }

        if (trimmedText.length > 200) {
            setNotification({ message: 'Task description must be 200 characters or less', type: 'error' });
            return;
        }

        try {
            addTask(trimmedText, notes.trim(), quadrant);
            setNotification({ message: 'Task added successfully', type: 'success' });
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Failed to save new task:', error);
            setNotification({ message: 'Failed to save task', type: 'error' });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    if (!isOpen) return null;

    return React.createElement(
        React.Fragment,
        null,
        // Backdrop
        React.createElement('div', {
            className: 'modal-backdrop',
            onClick: onClose
        }),
        
        // Modal
        React.createElement(
            'div',
            {
                className: 'modal',
                onClick: (e) => e.stopPropagation()
            },
            // Header
            React.createElement(
                'div',
                { className: 'modal-header' },
                React.createElement(
                    'h3',
                    null,
                    `Add Task - ${quadrantNames[quadrant] || 'Unknown'}`
                ),
                React.createElement(
                    'button',
                    {
                        className: 'modal-close',
                        onClick: onClose,
                        type: 'button'
                    },
                    '×'
                )
            ),
            
            // Body
            React.createElement(
                'form',
                { onSubmit: handleSubmit },
                React.createElement(
                    'div',
                    { className: 'modal-body' },
                    React.createElement(
                        'div',
                        { className: 'input-group' },
                        React.createElement(
                            'label',
                            { htmlFor: 'task-input' },
                            'Task Description'
                        ),
                        React.createElement('input', {
                            ref: inputRef,
                            id: 'task-input',
                            type: 'text',
                            placeholder: 'Enter your task...',
                            maxLength: '200',
                            value: text,
                            onChange: (e) => setText(e.target.value),
                            onKeyPress: handleKeyPress
                        })
                    ),
                    React.createElement(
                        'div',
                        { className: 'input-group' },
                        React.createElement(
                            'label',
                            { htmlFor: 'task-notes' },
                            'Notes (optional)'
                        ),
                        React.createElement('textarea', {
                            id: 'task-notes',
                            placeholder: 'Additional notes...',
                            rows: '3',
                            maxLength: '500',
                            value: notes,
                            onChange: (e) => setNotes(e.target.value)
                        })
                    )
                ),
                
                // Actions
                React.createElement(
                    'div',
                    { className: 'modal-actions' },
                    React.createElement(
                        'button',
                        {
                            type: 'button',
                            className: 'btn btn-outline',
                            onClick: onClose
                        },
                        'Cancel'
                    ),
                    React.createElement(
                        'button',
                        {
                            type: 'submit',
                            className: 'btn btn-primary',
                            disabled: !text.trim()
                        },
                        'Add Task'
                    )
                )
            )
        ),
        
        // Notification
        notification && React.createElement(Notification, {
            message: notification.message,
            type: notification.type,
            onClose: () => setNotification(null)
        })
    );
}

// Edit Task Dialog Component
function EditTaskDialog({ isOpen, onClose }) {
    const { currentEditingTask, getTaskById, updateTask, deleteTask, clearEditingTask } = useTasks();
    const [text, setText] = useState('');
    const [notes, setNotes] = useState('');
    const [quadrant, setQuadrant] = useState('');
    const [notification, setNotification] = useState(null);
    const inputRef = useRef(null);

    const task = currentEditingTask ? getTaskById(currentEditingTask) : null;

    // Load task data when dialog opens or task changes
    useEffect(() => {
        if (isOpen && task) {
            setText(task.text || '');
            setNotes(task.notes || '');
            setQuadrant(task.quadrant || '');
            
            if (inputRef.current) {
                setTimeout(() => inputRef.current.focus(), 100);
            }
        }
    }, [isOpen, task]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const trimmedText = text.trim();
        if (!trimmedText || trimmedText.length === 0) {
            setNotification({ message: 'Task description is required', type: 'error' });
            return;
        }

        if (trimmedText.length > 200) {
            setNotification({ message: 'Task description must be 200 characters or less', type: 'error' });
            return;
        }

        try {
            updateTask(currentEditingTask, {
                text: trimmedText,
                notes: notes.trim(),
                quadrant: quadrant || task.quadrant
            });
            
            setNotification({ message: 'Task updated successfully', type: 'success' });
            setTimeout(() => {
                clearEditingTask();
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Failed to save task edit:', error);
            setNotification({ message: 'Failed to update task', type: 'error' });
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                deleteTask(currentEditingTask);
                setNotification({ message: 'Task deleted successfully', type: 'success' });
                setTimeout(() => {
                    clearEditingTask();
                    onClose();
                }, 1000);
            } catch (error) {
                console.error('Failed to delete task:', error);
                setNotification({ message: 'Failed to delete task', type: 'error' });
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    if (!isOpen || !task) return null;

    return React.createElement(
        React.Fragment,
        null,
        // Backdrop
        React.createElement('div', {
            className: 'modal-backdrop',
            onClick: onClose
        }),
        
        // Modal
        React.createElement(
            'div',
            {
                className: 'modal',
                onClick: (e) => e.stopPropagation()
            },
            // Header
            React.createElement(
                'div',
                { className: 'modal-header' },
                React.createElement('h3', null, 'Edit Task'),
                React.createElement(
                    'button',
                    {
                        className: 'modal-close',
                        onClick: onClose,
                        type: 'button'
                    },
                    '×'
                )
            ),
            
            // Body
            React.createElement(
                'form',
                { onSubmit: handleSubmit },
                React.createElement(
                    'div',
                    { className: 'modal-body' },
                    React.createElement(
                        'div',
                        { className: 'input-group' },
                        React.createElement(
                            'label',
                            { htmlFor: 'edit-task-input' },
                            'Task Description'
                        ),
                        React.createElement('input', {
                            ref: inputRef,
                            id: 'edit-task-input',
                            type: 'text',
                            placeholder: 'Enter your task...',
                            maxLength: '200',
                            value: text,
                            onChange: (e) => setText(e.target.value),
                            onKeyPress: handleKeyPress
                        })
                    ),
                    React.createElement(
                        'div',
                        { className: 'input-group' },
                        React.createElement(
                            'label',
                            { htmlFor: 'edit-task-notes' },
                            'Notes (optional)'
                        ),
                        React.createElement('textarea', {
                            id: 'edit-task-notes',
                            placeholder: 'Additional notes...',
                            rows: '3',
                            maxLength: '500',
                            value: notes,
                            onChange: (e) => setNotes(e.target.value)
                        })
                    ),
                    React.createElement(
                        'div',
                        { className: 'input-group' },
                        React.createElement(
                            'label',
                            { htmlFor: 'edit-task-quadrant' },
                            'Move to Quadrant'
                        ),
                        React.createElement(
                            'select',
                            {
                                id: 'edit-task-quadrant',
                                value: quadrant,
                                onChange: (e) => setQuadrant(e.target.value)
                            },
                            React.createElement('option', { value: 'urgent-important' }, 'Urgent & Important'),
                            React.createElement('option', { value: 'important' }, 'Not Urgent & Important'),
                            React.createElement('option', { value: 'urgent' }, 'Urgent & Unimportant'),
                            React.createElement('option', { value: 'neither' }, 'Not Urgent & Unimportant')
                        )
                    )
                ),
                
                // Actions
                React.createElement(
                    'div',
                    { className: 'modal-actions' },
                    React.createElement(
                        'button',
                        {
                            type: 'button',
                            className: 'btn btn-danger',
                            onClick: handleDelete
                        },
                        'Delete'
                    ),
                    React.createElement(
                        'button',
                        {
                            type: 'button',
                            className: 'btn btn-outline',
                            onClick: onClose
                        },
                        'Cancel'
                    ),
                    React.createElement(
                        'button',
                        {
                            type: 'submit',
                            className: 'btn btn-primary',
                            disabled: !text.trim()
                        },
                        'Save Changes'
                    )
                )
            )
        ),
        
        // Notification
        notification && React.createElement(Notification, {
            message: notification.message,
            type: notification.type,
            onClose: () => setNotification(null)
        })
    );
}

// Export for global access
window.AddTaskDialog = AddTaskDialog;
window.EditTaskDialog = EditTaskDialog;
window.Notification = Notification;