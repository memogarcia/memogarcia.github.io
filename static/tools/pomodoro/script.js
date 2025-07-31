class PomodoroTimer {
    constructor() {
        this.duration = 25 * 60;
        this.timeLeft = this.duration;
        this.isRunning = false;
        this.isPaused = false;
        this.currentTopic = '';
        this.interval = null;
        this.sessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '[]');
        
        this.initElements();
        this.bindEvents();
        this.updateDisplay();
        this.loadHistory();
        
        // Initially hide timer and show setup
        this.showSetupView();
    }
    
    initElements() {
        this.topicInput = document.getElementById('topic');
        this.durationInput = document.getElementById('duration');
        this.timerDisplay = document.getElementById('timer');
        this.statusDisplay = document.getElementById('status');
        this.currentTopicDisplay = document.getElementById('current-topic');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.historyDiv = document.getElementById('history');
        this.timerDisplayContainer = document.querySelector('.timer-display');
        this.setupSection = document.querySelector('.setup-section');
        this.statsSection = document.querySelector('.stats');
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.durationInput.addEventListener('change', () => this.updateDuration());
    }
    
    showTimerView() {
        this.timerDisplayContainer.style.display = 'block';
        this.setupSection.style.display = 'none';
        this.statsSection.style.display = 'none';
    }
    
    showSetupView() {
        this.timerDisplayContainer.style.display = 'none';
        this.setupSection.style.display = 'block';
        this.statsSection.style.display = 'block';
    }
    
    updateDuration() {
        if (!this.isRunning) {
            const minutes = parseInt(this.durationInput.value) || 25;
            this.duration = minutes * 60;
            this.timeLeft = this.duration;
            this.updateDisplay();
        }
    }
    
    start() {
        if (!this.isRunning) {
            this.currentTopic = this.topicInput.value || 'Focus Session';
            this.currentTopicDisplay.textContent = this.currentTopic;
            this.isRunning = true;
            this.isPaused = false;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.topicInput.disabled = true;
            this.durationInput.disabled = true;
            this.statusDisplay.textContent = 'Working...';
            
            this.showTimerView();
            
            this.interval = setInterval(() => this.tick(), 1000);
        }
    }
    
    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            clearInterval(this.interval);
            this.pauseBtn.textContent = 'Resume';
            this.statusDisplay.textContent = 'Paused';
        } else if (this.isRunning && this.isPaused) {
            this.isPaused = false;
            this.pauseBtn.textContent = 'Pause';
            this.statusDisplay.textContent = 'Working...';
            this.interval = setInterval(() => this.tick(), 1000);
        }
    }
    
    reset() {
        clearInterval(this.interval);
        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = this.duration;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.textContent = 'Pause';
        this.topicInput.disabled = false;
        this.durationInput.disabled = false;
        this.currentTopicDisplay.textContent = '';
        this.statusDisplay.textContent = 'Ready';
        this.updateDisplay();
        
        this.showSetupView();
    }
    
    tick() {
        this.timeLeft--;
        this.updateDisplay();
        
        if (this.timeLeft <= 0) {
            this.complete();
        }
    }
    
    complete() {
        clearInterval(this.interval);
        this.playNotification();
        this.saveSession();
        
        this.statusDisplay.textContent = 'Complete!';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.topicInput.disabled = false;
        this.durationInput.disabled = false;
        
        setTimeout(() => {
            this.reset();
        }, 3000);
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.title = this.isRunning ? `${this.timerDisplay.textContent} - ${this.currentTopic}` : 'Pomodoro Timer';
    }
    
    playNotification() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Complete!', {
                body: `${this.currentTopic} session finished!`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>'
            });
        }
    }
    
    saveSession() {
        const session = {
            topic: this.currentTopic,
            duration: Math.floor(this.duration / 60),
            completedAt: new Date().toISOString()
        };
        
        this.sessions.unshift(session);
        if (this.sessions.length > 10) {
            this.sessions = this.sessions.slice(0, 10);
        }
        
        localStorage.setItem('pomodoroSessions', JSON.stringify(this.sessions));
        this.loadHistory();
    }
    
    loadHistory() {
        this.historyDiv.innerHTML = '';
        
        if (this.sessions.length === 0) {
            this.historyDiv.innerHTML = '<p class="no-sessions">No sessions yet</p>';
            return;
        }
        
        this.sessions.forEach(session => {
            const date = new Date(session.completedAt);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const sessionEl = document.createElement('div');
            sessionEl.className = 'session-item';
            sessionEl.innerHTML = `
                <div class="session-topic">${session.topic}</div>
                <div class="session-meta">${session.duration} min • ${dateStr} ${timeStr}</div>
            `;
            
            this.historyDiv.appendChild(sessionEl);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
    
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});