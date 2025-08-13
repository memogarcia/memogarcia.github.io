// Performance monitoring for planner tool
class PerformanceMonitor {
    constructor() {
        this.isEnabled = localStorage.getItem('performance-monitoring') === 'true';
        this.metrics = {
            fps: 0,
            frameTime: 0,
            renderTime: 0,
            dragEvents: 0,
            lastUpdate: Date.now()
        };
        
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.displayElement = null;
        
        if (this.isEnabled) {
            this.init();
        }
    }
    
    init() {
        this.createDisplay();
        this.startMonitoring();
        console.log('Performance monitoring enabled');
    }
    
    createDisplay() {
        this.displayElement = document.createElement('div');
        this.displayElement.id = 'performance-monitor';
        this.displayElement.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            min-width: 150px;
        `;
        document.body.appendChild(this.displayElement);
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Toggle Perf';
        toggleButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 170px;
            background: #333;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 11px;
            cursor: pointer;
            z-index: 10001;
        `;
        toggleButton.onclick = () => this.toggle();
        document.body.appendChild(toggleButton);
    }
    
    startMonitoring() {
        const monitor = () => {
            const now = performance.now();
            const deltaTime = now - this.lastFrameTime;
            
            this.frameCount++;
            
            // Update every second
            if (now - this.metrics.lastUpdate >= 1000) {
                this.metrics.fps = Math.round((this.frameCount * 1000) / (now - this.metrics.lastUpdate));
                this.metrics.frameTime = Math.round(deltaTime * 100) / 100;
                this.metrics.lastUpdate = now;
                this.frameCount = 0;
                
                this.updateDisplay();
            }
            
            this.lastFrameTime = now;
            requestAnimationFrame(monitor);
        };
        
        requestAnimationFrame(monitor);
    }
    
    updateDisplay() {
        if (!this.displayElement) return;
        
        const fpsColor = this.metrics.fps >= 50 ? '#0f0' : this.metrics.fps >= 30 ? '#ff0' : '#f00';
        
        this.displayElement.innerHTML = `
            <div>FPS: <span style="color: ${fpsColor}">${this.metrics.fps}</span></div>
            <div>Frame: ${this.metrics.frameTime}ms</div>
            <div>Render: ${this.metrics.renderTime}ms</div>
            <div>Drags: ${this.metrics.dragEvents}</div>
        `;
    }
    
    recordDragEvent() {
        this.metrics.dragEvents++;
    }
    
    recordRenderTime(time) {
        this.metrics.renderTime = Math.round(time * 100) / 100;
    }
    
    toggle() {
        this.isEnabled = !this.isEnabled;
        localStorage.setItem('performance-monitoring', this.isEnabled.toString());
        
        if (this.isEnabled) {
            this.init();
        } else {
            if (this.displayElement) {
                this.displayElement.remove();
                this.displayElement = null;
            }
            console.log('Performance monitoring disabled');
        }
    }
    
    static enable() {
        localStorage.setItem('performance-monitoring', 'true');
        window.location.reload();
    }
    
    static disable() {
        localStorage.setItem('performance-monitoring', 'false');
        if (window.performanceMonitor?.displayElement) {
            window.performanceMonitor.displayElement.remove();
        }
    }
}

// Auto-initialize if enabled
if (localStorage.getItem('performance-monitoring') === 'true') {
    window.performanceMonitor = new PerformanceMonitor();
}

// Export for console usage
window.PerformanceMonitor = PerformanceMonitor;

// Console commands for easy toggling
console.log('Performance Monitor Commands:');
console.log('- PerformanceMonitor.enable() // Enable monitoring');
console.log('- PerformanceMonitor.disable() // Disable monitoring');