const { useState, useEffect } = React;

function EisenhowerMatrix() {
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedQuadrant, setSelectedQuadrant] = useState('');
    
    const { currentEditingTask, setEditingTask, clearEditingTask, getAllStats } = useTasks();

    // Handle opening add task dialog
    const handleAddTask = (quadrant) => {
        setSelectedQuadrant(quadrant);
        setAddDialogOpen(true);
    };

    // Handle opening edit task dialog
    const handleEditTask = (taskId) => {
        setEditingTask(taskId);
        setEditDialogOpen(true);
    };

    // Handle closing dialogs
    const handleCloseAddDialog = () => {
        setAddDialogOpen(false);
        setSelectedQuadrant('');
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        clearEditingTask();
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (addDialogOpen) {
                    handleCloseAddDialog();
                }
                if (editDialogOpen) {
                    handleCloseEditDialog();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [addDialogOpen, editDialogOpen]);

    // Expose utility functions to global scope for debugging
    useEffect(() => {
        window.getTaskStats = getAllStats;
        
        console.log('Eisenhower Matrix React loaded. Available console commands:');
        console.log('- getTaskStats() - Get task statistics');
    }, [getAllStats]);

    return React.createElement(
        React.Fragment,
        null,
        
        // Main Container
        React.createElement(
            'div',
            { className: 'container' },
            
            // Matrix Grid
            React.createElement(
                'div',
                { className: 'matrix-container' },
                React.createElement(Quadrant, {
                    quadrant: 'urgent-important',
                    onAddTask: handleAddTask,
                    onEditTask: handleEditTask
                }),
                React.createElement(Quadrant, {
                    quadrant: 'important',
                    onAddTask: handleAddTask,
                    onEditTask: handleEditTask
                }),
                React.createElement(Quadrant, {
                    quadrant: 'urgent',
                    onAddTask: handleAddTask,
                    onEditTask: handleEditTask
                }),
                React.createElement(Quadrant, {
                    quadrant: 'neither',
                    onAddTask: handleAddTask,
                    onEditTask: handleEditTask
                })
            )
        ),
        
        // Add Task Dialog
        React.createElement(AddTaskDialog, {
            isOpen: addDialogOpen,
            onClose: handleCloseAddDialog,
            quadrant: selectedQuadrant
        }),
        
        // Edit Task Dialog
        React.createElement(EditTaskDialog, {
            isOpen: editDialogOpen,
            onClose: handleCloseEditDialog
        })
    );
}

// Main App Component
function App() {
    return React.createElement(
        TaskProvider,
        null,
        React.createElement(EisenhowerMatrix)
    );
}

// Render the app
document.addEventListener('DOMContentLoaded', () => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
    
    console.log('Eisenhower Matrix React app initialized successfully');
});

// Export for global access
window.EisenhowerMatrix = EisenhowerMatrix;
window.App = App;