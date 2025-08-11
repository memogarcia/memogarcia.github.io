const textInput = document.getElementById('reminder-text');
const timeInput = document.getElementById('reminder-time');
const addBtn = document.getElementById('add-btn');
const listEl = document.getElementById('reminders');

let reminders = JSON.parse(localStorage.getItem('reminders') || '[]');

function save() {
    localStorage.setItem('reminders', JSON.stringify(reminders));
}

function render() {
    listEl.innerHTML = '';
    if (reminders.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'no-reminders';
        empty.textContent = 'No reminders yet';
        listEl.appendChild(empty);
        return;
    }

    reminders.forEach((reminder, index) => {
        const item = document.createElement('div');
        item.className = 'reminder-item';

        const info = document.createElement('div');
        info.className = 'reminder-info';

        const text = document.createElement('div');
        text.className = 'reminder-text';
        text.textContent = reminder.text;

        const time = document.createElement('time');
        time.className = 'reminder-time';
        time.textContent = new Date(reminder.time).toLocaleString();

        info.appendChild(text);
        info.appendChild(time);

        const del = document.createElement('button');
        del.className = 'delete-btn';
        del.innerHTML = '&times;';
        del.addEventListener('click', () => {
            reminders.splice(index, 1);
            save();
            render();
        });

        item.appendChild(info);
        item.appendChild(del);
        listEl.appendChild(item);
    });
}

addBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    const time = timeInput.value;
    if (!text || !time) return;
    reminders.push({ text, time });
    save();
    textInput.value = '';
    timeInput.value = '';
    render();
});

render();
