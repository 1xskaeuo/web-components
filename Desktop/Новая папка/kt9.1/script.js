class UserList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.state = 'loading';
        this.users = [];
        this.error = null;
    }

    static get observedAttributes() {
        return ['limit'];
    }

    connectedCallback() {
        this.render();
        this.loadUsers();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'limit' && oldValue !== newValue) {
            this.render();
        }
    }

    async loadUsers() {
        try {
            this.state = 'loading';
            this.render();

            const response = await fetch('https://jsonplaceholder.typicode.com/users');
            
            if (!response.ok) {
                throw new Error('Network error');
            }

            this.users = await response.json();
            this.state = 'success';
            this.render();
        } catch (error) {
            this.state = 'error';
            this.error = error.message;
            this.render();
        }
    }

    getDisplayUsers() {
        const limit = parseInt(this.getAttribute('limit'));
        if (limit && !isNaN(limit)) {
            return this.users.slice(0, limit);
        }
        return this.users;
    }

    render() {
        const styles = `
            <style>
                :host {
                    display: block;
                }

                .loading,
                .error {
                    text-align: center;
                    padding: 40px 20px;
                    font-size: 1.2rem;
                    color: white;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    backdrop-filter: blur(10px);
                }

                .error {
                    background: rgba(255, 59, 48, 0.2);
                    border: 2px solid rgba(255, 59, 48, 0.5);
                }

                .user-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    padding: 0;
                    list-style: none;
                }

                .user-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .user-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
                }

                .user-name {
                    font-size: 1.4rem;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 10px;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .user-detail {
                    display: flex;
                    align-items: center;
                    font-size: 0.95rem;
                    color: #666;
                }

                .user-detail strong {
                    color: #667eea;
                    min-width: 80px;
                    font-weight: 500;
                }

                .user-email {
                    color: #764ba2;
                    text-decoration: none;
                }

                .user-email:hover {
                    text-decoration: underline;
                }

                .user-company {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #eee;
                    font-size: 0.9rem;
                    color: #888;
                }
            </style>
        `;

        if (this.state === 'loading') {
            this.shadowRoot.innerHTML = `
                ${styles}
                <div class="loading">Загрузка...</div>
            `;
            return;
        }

        if (this.state === 'error') {
            this.shadowRoot.innerHTML = `
                ${styles}
                <div class="error">Ошибка загрузки данных</div>
            `;
            return;
        }

        const users = this.getDisplayUsers();
        const userCards = users.map(user => `
            <li class="user-card">
                <div class="user-name">${user.name}</div>
                <div class="user-info">
                    <div class="user-detail">
                        <strong>Email:</strong>
                        <a href="mailto:${user.email}" class="user-email">${user.email}</a>
                    </div>
                    <div class="user-detail">
                        <strong>Телефон:</strong>
                        <span>${user.phone}</span>
                    </div>
                    <div class="user-detail">
                        <strong>Город:</strong>
                        <span>${user.address.city}</span>
                    </div>
                    <div class="user-company">🏢 ${user.company.name}</div>
                </div>
            </li>
        `).join('');

        this.shadowRoot.innerHTML = `
            ${styles}
            <ul class="user-grid">
                ${userCards}
            </ul>
        `;
    }
}

customElements.define('user-list', UserList);