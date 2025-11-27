class TaskList extends HTMLElement {
    constructor() {
        super();
        this.tasks = [];
        this.nextId = 1;
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.innerHTML = `
            <div class="task-list-container">
                <h1>Task List</h1>
                <form class="task-form">
                    <input type="text" class="task-input" placeholder="Enter new task" required>
                    <button type="submit" class="add-button">Add Task</button>
                </form>
                <ul class="tasks"></ul>
            </div>
        `;
    }

    attachEventListeners() {
        const form = this.querySelector('.task-form');
        const input = this.querySelector('.task-input');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (text) {
                this.addTask(text);
                input.value = '';
            }
        });
    }

    addTask(text) {
        const task = {
            id: this.nextId++,
            text: text,
            completed: false
        };
        this.tasks.push(task);
        this.updateTaskList();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.updateTaskList();
    }

    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.updateTaskList();
        }
    }

    updateTaskList() {
        const tasksList = this.querySelector('.tasks');
        const fragment = document.createDocumentFragment();
        
        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.dataset.id = task.id;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            
            const span = document.createElement('span');
            span.className = task.completed ? 'task-text completed' : 'task-text';
            span.textContent = task.text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.textContent = 'Delete';
            
            checkbox.addEventListener('change', () => this.toggleTask(task.id));
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
            
            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(deleteBtn);
            fragment.appendChild(li);
        });
        
        tasksList.innerHTML = '';
        tasksList.appendChild(fragment);
    }

    getTasks() {
        return this.tasks;
    }

    getTaskById(id) {
        return this.tasks.find(task => task.id === id);
    }
}

customElements.define('task-list', TaskList);