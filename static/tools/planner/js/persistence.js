/**
 * Persistence module for Planner application
 * These methods are mixed into PlanningApp prototype via Object.assign
 * They handle all data storage, loading, export, and import functionality
 */
export const persistence = {
  /**
   * Save current application state to localStorage
   * Automatically called after most user actions
   */
  saveToStorage() {
    const data = {
      northStars: this.northStars,
      epics: this.epics,
      tasks: this.tasks,
      people: this.people,
      assignments: this.assignments,
      dependencies: this.dependencies,
      view: this.view
    };
    localStorage.setItem('planner-data', JSON.stringify(data));
  },

  /**
   * Load application state from localStorage
   * Called during app initialization
   * Handles backward compatibility with older data formats
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('planner-data');
      if (stored) {
        const data = JSON.parse(stored);
        this.northStars = data.northStars || [];
        this.epics = data.epics || data.northStars || [];
        this.tasks = data.tasks || [];
        this.people = data.people || [];
        this.assignments = data.assignments || [];
        this.dependencies = (data.dependencies || []).map(d => ({
          from: d.from ?? d.fromTaskId,
          to: d.to ?? d.toTaskId,
          type: d.type || 'blocks'
        }));
        this.view = data.view || { x: 0, y: 0, scale: 1 };
        this.render();
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  },

  /**
   * Export current plan as JSON file
   * Creates downloadable file with timestamp
   */
  exportData() {
    const data = {
      northStars: this.northStars,
      epics: this.epics,
      tasks: this.tasks,
      people: this.people,
      assignments: this.assignments,
      dependencies: this.dependencies,
      exportDate: new Date().toISOString(),
      version: '2.1'
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
  },

  /**
   * Import plan from JSON file
   * Validates data format and updates application state
   * @param {File} file - File object from input element
   */
  importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data && typeof data === 'object') {
          this.northStars = data.northStars || [];
          this.epics = data.epics || data.northStars || [];
          this.tasks = data.tasks || [];
          this.people = data.people || [];
          this.assignments = data.assignments || [];
          this.dependencies = (data.dependencies || []).map(d => ({
            from: d.from ?? d.fromTaskId,
            to: d.to ?? d.toTaskId,
            type: d.type || 'blocks'
          }));
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
};

