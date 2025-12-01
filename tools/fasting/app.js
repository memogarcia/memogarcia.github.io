/**
 * Fasting Timer Logic
 */

// DOM Elements
const timeElapsedEl = document.getElementById('timeElapsed');
const statusBadgeEl = document.getElementById('statusBadge');
const toggleBtn = document.getElementById('toggleBtn');
const resetBtn = document.getElementById('resetBtn');
const startTimeDisplay = document.getElementById('startTimeDisplay');
const startTimeText = document.getElementById('startTimeText');
const editStartTimeBtn = document.getElementById('editStartTimeBtn');
const editStartTimeContainer = document.getElementById('editStartTimeContainer');
const startTimeInput = document.getElementById('startTimeInput');
const saveStartTimeBtn = document.getElementById('saveStartTimeBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const currentStageCard = document.getElementById('currentStageCard');
const stageIcon = document.getElementById('stageIcon');
const stageTitle = document.getElementById('stageTitle');
const stageDescription = document.getElementById('stageDescription');
const timelineEl = document.getElementById('timeline');
const themeToggle = document.getElementById('themeToggle');

// State
let state = {
    startTime: null,
    isFasting: false
};

// Fasting Stages Data
const fastingStages = [
    {
        hours: 0,
        title: "Anabolic State",
        description: "Your body is digesting food and storing energy. Insulin levels are high.",
        icon: "🍽️"
    },
    {
        hours: 4,
        title: "Catabolic State",
        description: "Blood sugar falls. Insulin drops. Your body starts switching to burning stored energy.",
        icon: "📉"
    },
    {
        hours: 12,
        title: "Ketosis Begins",
        description: "Your body starts breaking down fat for energy. You may feel more focused.",
        icon: "🔥"
    },
    {
        hours: 16,
        title: "Deep Ketosis",
        description: "Fat burning accelerates. This is the sweet spot for 16:8 intermittent fasting.",
        icon: "⚡"
    },
    {
        hours: 18,
        title: "Autophagy Begins",
        description: "Cellular cleanup starts. Your body recycles old and damaged cell components.",
        icon: "♻️"
    },
    {
        hours: 24,
        title: "Peak Autophagy",
        description: "Significant cellular repair. Growth hormone levels increase significantly.",
        icon: "🧬"
    },
    {
        hours: 48,
        title: "Immune Regeneration",
        description: "Stem cell regeneration and immune system reset begins.",
        icon: "🛡️"
    },
    {
        hours: 72,
        title: "Deep Fasting",
        description: "Maximum autophagy and immune reset. Consult a doctor for prolonged fasts.",
        icon: "🧘"
    }
];

// Initialize
function init() {
    loadState();
    setupEventListeners();
    renderTimeline();
    updateUI();

    // Start timer loop
    setInterval(updateTimer, 1000);
}

// Load state from localStorage
function loadState() {
    const savedState = localStorage.getItem('fastingState');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        state.startTime = parsed.startTime ? new Date(parsed.startTime) : null;
        state.isFasting = parsed.isFasting;
    }

    // Theme handling
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark');
        updateThemeIcon(true);
    } else {
        updateThemeIcon(false);
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('fastingState', JSON.stringify(state));
}

// Setup Event Listeners
function setupEventListeners() {
    toggleBtn.addEventListener('click', toggleFasting);
    resetBtn.addEventListener('click', resetFasting);

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
    });

    editStartTimeBtn.addEventListener('click', showEditStartTime);
    saveStartTimeBtn.addEventListener('click', saveStartTime);
    cancelEditBtn.addEventListener('click', hideEditStartTime);
}

function showEditStartTime() {
    if (!state.startTime) return;

    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const now = new Date(state.startTime);
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    startTimeInput.value = now.toISOString().slice(0, 16);

    editStartTimeContainer.style.display = 'flex';
    editStartTimeBtn.style.display = 'none';
}

function hideEditStartTime() {
    editStartTimeContainer.style.display = 'none';
    editStartTimeBtn.style.display = 'inline-block';
}

function saveStartTime() {
    const newTime = new Date(startTimeInput.value);
    if (isNaN(newTime.getTime())) {
        alert('Invalid date/time');
        return;
    }

    state.startTime = newTime;
    saveState();
    updateUI();
    hideEditStartTime();
}

function updateThemeIcon(isDark) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    if (isDark) {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

// Toggle Fasting State
function toggleFasting() {
    if (state.isFasting) {
        // Stop fasting
        // Ideally we would save this to a history array here
        state.isFasting = false;
        state.startTime = null;
    } else {
        // Start fasting
        state.isFasting = true;
        state.startTime = new Date();
    }
    saveState();
    updateUI();
}

// Reset Fasting
function resetFasting() {
    if (confirm('Are you sure you want to reset your current fast?')) {
        state.isFasting = false;
        state.startTime = null;
        saveState();
        updateUI();
    }
}

// Update Timer Display
function updateTimer() {
    if (!state.isFasting || !state.startTime) {
        return;
    }

    const now = new Date();
    const diff = now - state.startTime;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    timeElapsedEl.textContent =
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Check if we need to update stage info (every minute is fine, but every second is okay too)
    updateStageInfo(hours);
}

// Update UI based on state
function updateUI() {
    if (state.isFasting) {
        toggleBtn.textContent = 'Stop Fasting';
        toggleBtn.classList.replace('btn-primary', 'btn-destructive'); // Change style if needed, or keep primary
        toggleBtn.classList.remove('btn-primary');
        toggleBtn.classList.add('btn-destructive'); // Actually destructive is better for stop

        resetBtn.style.display = 'none'; // Hide reset when running, stop acts as reset/finish

        statusBadgeEl.textContent = 'Fasting Active';
        statusBadgeEl.classList.add('active');

        startTimeDisplay.style.display = 'block';
        startTimeText.textContent = state.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        updateTimer(); // Immediate update
    } else {
        toggleBtn.textContent = 'Start Fasting';
        toggleBtn.classList.remove('btn-destructive');
        toggleBtn.classList.add('btn-primary');

        resetBtn.style.display = 'none';

        statusBadgeEl.textContent = 'Not Fasting';
        statusBadgeEl.classList.remove('active');

        timeElapsedEl.textContent = '00:00:00';
        startTimeDisplay.style.display = 'none';

        // Reset stage info to initial
        updateStageInfo(0);
    }
}

// Render Timeline
function renderTimeline() {
    timelineEl.innerHTML = '';

    fastingStages.forEach((stage, index) => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.dataset.hours = stage.hours;

        item.innerHTML = `
            <div class="timeline-marker"></div>
            <div class="timeline-time">${stage.hours} Hours</div>
            <div class="timeline-title">${stage.title}</div>
            <div class="timeline-desc">${stage.description}</div>
        `;

        timelineEl.appendChild(item);
    });
}

// Update Stage Info and Timeline
function updateStageInfo(currentHours) {
    // Find current stage
    // Reverse array to find the highest hour threshold passed
    const currentStage = [...fastingStages].reverse().find(stage => currentHours >= stage.hours) || fastingStages[0];

    // Update Card
    stageIcon.textContent = currentStage.icon;
    stageTitle.textContent = currentStage.title;
    stageDescription.textContent = currentStage.description;

    // Update Timeline highlighting
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        const itemHours = parseInt(item.dataset.hours);

        item.classList.remove('active', 'completed');

        if (state.isFasting) {
            if (itemHours === currentStage.hours) {
                item.classList.add('active');
            } else if (itemHours < currentStage.hours) {
                item.classList.add('completed');
            }
        }
    });
}

// Run init
init();
