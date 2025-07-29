// Essay App JavaScript
class EssayApp {
    constructor() {
        this.data = {
            title: 'Ideas for my essay',
            brainstorm: [],
            research: [],
            outline: [
                { id: 1, text: 'The role of editing in the writing process', level: 0, children: [] },
                { id: 2, text: 'Discussing how revision and editing can transform a rough draft into a polished piece of writing', level: 0, children: [
                    { id: 3, text: 'What are some common editing techniques?', level: 1 },
                    { id: 4, text: 'What are the benefits of splitting up different editing phases?', level: 1 }
                ]},
                { id: 5, text: 'How does writing reflect cultural identity?', level: 0, children: [
                    { id: 6, text: 'Some examples of how writers in the past have reflected their cultural background and heritage in their writing', level: 1 }
                ]},
                { id: 7, text: 'How to different cultural backgrounds use storytelling to maintain identity, community, and tradition', level: 0, children: [] }
            ],
            connections: [] // Links between research and outline items
        };
        
        this.init();
        this.loadFromStorage();
    }
    
    init() {
        // Event listeners for workflow steps
        document.querySelectorAll('.workflow-step').forEach((step, index) => {
            step.addEventListener('click', () => this.handleWorkflowStep(index));
        });
        
        // Try Essay button
        document.querySelector('.try-essay-btn').addEventListener('click', () => {
            this.showModal('brainstorm-modal');
        });
        
        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal.id);
            });
        });
        
        // Modal save buttons
        document.querySelector('.save-brainstorm').addEventListener('click', () => this.saveBrainstorm());
        document.querySelector('.save-research').addEventListener('click', () => this.saveResearch());
        document.querySelector('.save-outline').addEventListener('click', () => this.saveOutline());
        
        // Add outline item button
        document.querySelector('.add-outline-item').addEventListener('click', () => this.addOutlineItem());
        
        // Essay title input
        document.querySelector('.essay-title').addEventListener('input', (e) => {
            this.data.title = e.target.value;
            this.saveToStorage();
        });
        
        // Update UI with existing data
        this.updateUI();
    }
    
    handleWorkflowStep(index) {
        const modals = ['brainstorm-modal', 'research-modal', 'outline-modal', 'research-modal'];
        if (index < modals.length) {
            this.showModal(modals[index]);
        }
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('hidden');
        
        // Load existing data into modals
        if (modalId === 'brainstorm-modal') {
            document.getElementById('brainstorm-input').value = this.data.brainstorm.join('\n\n');
        } else if (modalId === 'outline-modal') {
            this.renderOutlineEditor();
        }
    }
    
    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }
    
    saveBrainstorm() {
        const input = document.getElementById('brainstorm-input').value;
        this.data.brainstorm = input.split('\n\n').filter(item => item.trim());
        this.saveToStorage();
        this.hideModal('brainstorm-modal');
        this.updateUI();
    }
    
    saveResearch() {
        const title = document.getElementById('research-title').value;
        const content = document.getElementById('research-content').value;
        const url = document.getElementById('research-url').value;
        
        if (title && content) {
            this.data.research.push({
                id: Date.now(),
                title,
                content,
                url,
                createdAt: new Date().toISOString()
            });
            
            // Clear form
            document.getElementById('research-title').value = '';
            document.getElementById('research-content').value = '';
            document.getElementById('research-url').value = '';
            
            this.saveToStorage();
            this.hideModal('research-modal');
            this.updateUI();
        }
    }
    
    renderOutlineEditor() {
        const editor = document.getElementById('outline-editor');
        editor.innerHTML = '';
        
        this.data.outline.forEach(item => {
            const itemElement = this.createOutlineItemElement(item);
            editor.appendChild(itemElement);
            
            if (item.children && item.children.length > 0) {
                item.children.forEach(child => {
                    const childElement = this.createOutlineItemElement(child, true);
                    editor.appendChild(childElement);
                });
            }
        });
    }
    
    createOutlineItemElement(item, isChild = false) {
        const div = document.createElement('div');
        div.className = 'outline-item';
        if (isChild) div.style.marginLeft = '2rem';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = item.text;
        input.dataset.id = item.id;
        input.addEventListener('input', (e) => {
            this.updateOutlineItem(item.id, e.target.value);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', () => {
            this.deleteOutlineItem(item.id);
            this.renderOutlineEditor();
        });
        
        div.appendChild(input);
        div.appendChild(deleteBtn);
        
        return div;
    }
    
    addOutlineItem() {
        const newItem = {
            id: Date.now(),
            text: 'New section',
            level: 0,
            children: []
        };
        
        this.data.outline.push(newItem);
        this.renderOutlineEditor();
    }
    
    updateOutlineItem(id, text) {
        const findAndUpdate = (items) => {
            for (let item of items) {
                if (item.id === id) {
                    item.text = text;
                    return true;
                }
                if (item.children && findAndUpdate(item.children)) {
                    return true;
                }
            }
            return false;
        };
        
        findAndUpdate(this.data.outline);
    }
    
    deleteOutlineItem(id) {
        const findAndDelete = (items) => {
            for (let i = 0; i < items.length; i++) {
                if (items[i].id === id) {
                    items.splice(i, 1);
                    return true;
                }
                if (items[i].children && findAndDelete(items[i].children)) {
                    return true;
                }
            }
            return false;
        };
        
        findAndDelete(this.data.outline);
        this.saveToStorage();
    }
    
    saveOutline() {
        this.saveToStorage();
        this.hideModal('outline-modal');
        this.updateUI();
    }
    
    updateUI() {
        // Update essay title
        document.querySelector('.essay-title').value = this.data.title;
        document.querySelector('.doc-title').textContent = this.data.title;
        
        // Update outline display
        const outlineList = document.querySelector('.outline-list');
        outlineList.innerHTML = this.renderOutlineHTML(this.data.outline);
        
        // Update workflow step indicators
        const steps = document.querySelectorAll('.step-icon');
        if (this.data.brainstorm.length > 0) steps[0].style.opacity = '1';
        if (this.data.research.length > 0) steps[1].style.opacity = '1';
        if (this.data.outline.length > 0) steps[2].style.opacity = '1';
        if (this.data.connections.length > 0) steps[3].style.opacity = '1';
    }
    
    renderOutlineHTML(items) {
        return items.map(item => {
            let html = `<li>${item.text}`;
            if (item.children && item.children.length > 0) {
                html += `<ul>${this.renderOutlineHTML(item.children)}</ul>`;
            }
            html += '</li>';
            return html;
        }).join('');
    }
    
    saveToStorage() {
        localStorage.setItem('essayAppData', JSON.stringify(this.data));
    }
    
    loadFromStorage() {
        const saved = localStorage.getItem('essayAppData');
        if (saved) {
            try {
                this.data = JSON.parse(saved);
                this.updateUI();
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new EssayApp();
});