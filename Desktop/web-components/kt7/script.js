 // Компонент модального окна
 class MyModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .modal-content {
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    width: 400px;
                    max-width: 90%;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    position: relative;
                }

                .close-btn {
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #666;
                }

                .close-btn:hover {
                    color: #000;
                }

                h3 {
                    margin-top: 0;
                    color: #333;
                }

                p {
                    color: #666;
                    line-height: 1.5;
                }
            </style>
            <div class="modal">
                <div class="modal-content">
                    <button class="close-btn">&times;</button>
                    <h3>Пример модального окна</h3>
                    <p>Это пример содержимого модального окна. Вы можете добавить сюда любой контент: формы, изображения, текст и т.д.</p>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const modal = this.shadowRoot.querySelector('.modal');
        const closeBtn = this.shadowRoot.querySelector('.close-btn');

        // Закрытие по кнопке
        closeBtn.addEventListener('click', () => {
            this.close();
        });

        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });
    }

    open() {
        const modal = this.shadowRoot.querySelector('.modal');
        modal.style.display = 'flex';
        this.isOpen = true;
    }

    close() {
        const modal = this.shadowRoot.querySelector('.modal');
        modal.style.display = 'none';
        this.isOpen = false;
        console.log('Модальное окно закрыто');
    }
}

// Компонент списка задач
class TodoList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.tasks = [];
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                
                .empty-message {
                    text-align: center;
                    color: #888;
                    font-style: italic;
                    padding: 20px;
                }
            </style>
            <div class="todo-list">
                ${this.tasks.length === 0 ? '<p class="empty-message">Список задач пуст</p>' : ''}
            </div>
        `;
    }

    addTask(text) {
        if (!text.trim()) return;
        
        this.tasks.push(text);
        
        const todoItem = document.createElement('todo-item');
        todoItem.setAttribute('text', text);
        
        const todoList = this.shadowRoot.querySelector('.todo-list');
        const emptyMessage = todoList.querySelector('.empty-message');
        
        if (emptyMessage) {
            todoList.removeChild(emptyMessage);
        }
        
        todoList.appendChild(todoItem);
    }
}

// Компонент элемента списка задач
class TodoItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    static get observedAttributes() {
        return ['text'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'text' && oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        const text = this.getAttribute('text') || '';
        
        this.shadowRoot.innerHTML = `
            <style>
                .todo-item {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                    transition: background-color 0.2s;
                }

                .todo-item:hover {
                    background-color:rgb(49, 48, 48);
                }

                .todo-text {
                    flex: 1;
                    margin-left: 10px;
                }

                .delete-btn {
                    background-color: #e74c3c;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s;
                }

                .delete-btn:hover {
                    background-color: #c0392b;
                }
            </style>
            <div class="todo-item">
                <input type="checkbox" class="todo-checkbox">
                <span class="todo-text">${text}</span>
                <button class="delete-btn">Удалить</button>
            </div>
        `;
    }

    setupEventListeners() {
        const deleteBtn = this.shadowRoot.querySelector('.delete-btn');
        const checkbox = this.shadowRoot.querySelector('.todo-checkbox');
        const todoText = this.shadowRoot.querySelector('.todo-text');

        deleteBtn.addEventListener('click', () => {
            this.remove();
        });

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                todoText.style.textDecoration = 'line-through';
                todoText.style.color = '#888';
            } else {
                todoText.style.textDecoration = 'none';
                todoText.style.color = '';
            }
        });
    }
}

// Компонент кнопки смены темы
class ThemeButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isDark = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .theme-btn {
                    background-color: var(--primary-color, #4a6fa5);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: background-color 0.2s;
                }

                .theme-btn:hover {
                    background-color: #3a5a8c;
                }
            </style>
            <button class="theme-btn">Переключить тему</button>
        `;
    }

    setupEventListeners() {
        const button = this.shadowRoot.querySelector('.theme-btn');
        
        button.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    toggleTheme() {
        this.isDark = !this.isDark;
        
        if (this.isDark) {
            document.documentElement.style.setProperty('--bg-color', '#1a1a1a');
            document.documentElement.style.setProperty('--text-color', '#f0f0f0');
            document.documentElement.style.setProperty('--border-color', '#444');
            document.documentElement.style.setProperty('--shadow-color', 'rgba(255, 255, 255, 0.1)');
        } else {
            document.documentElement.style.setProperty('--bg-color', 'white');
            document.documentElement.style.setProperty('--text-color', 'black');
            document.documentElement.style.setProperty('--border-color', '#ddd');
            document.documentElement.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
        }
    }
}

// Регистрация компонентов
customElements.define('my-modal', MyModal);
customElements.define('todo-list', TodoList);
customElements.define('todo-item', TodoItem);
customElements.define('theme-button', ThemeButton);

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Модальное окно
    const modal = document.createElement('my-modal');
    document.body.appendChild(modal);
    
    const openModalBtn = document.getElementById('open-modal-btn');
    openModalBtn.addEventListener('click', () => {
        modal.open();
    });

    // Список задач
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoList = document.querySelector('todo-list');

    addTodoBtn.addEventListener('click', () => {
        todoList.addTask(todoInput.value);
        todoInput.value = '';
    });

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            todoList.addTask(todoInput.value);
            todoInput.value = '';
        }
    });
});