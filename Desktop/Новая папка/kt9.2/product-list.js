class ProductList extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.products = [];
        this.loading = false;
        this.error = null;
    }

    connectedCallback() {
        this.render();
        this.loadProducts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.shadowRoot.querySelector('#refresh-btn').addEventListener('click', () => {
            this.loadProducts();
        });

        this.shadowRoot.querySelector('#theme-btn').addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    async loadProducts() {
        this.loading = true;
        this.error = null;
        this.render();

        try {
            const response = await fetch('https://fakestoreapi.com/products');
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            this.products = await response.json();
        } catch (err) {
            this.error = err.message;
        } finally {
            this.loading = false;
            this.render();
        }
    }

    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.toggle('dark');
        body.classList.toggle('light');
        
        const container = this.shadowRoot.querySelector('.container');
        container.style.setProperty('--card-bg', isDark ? '#2d2d2d' : 'white');
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    --card-bg: white;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                h1 {
                    font-size: 32px;
                }

                .controls {
                    display: flex;
                    gap: 10px;
                }

                button {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    transition: opacity 0.2s;
                }

                button:hover {
                    opacity: 0.8;
                }

                #refresh-btn {
                    background: #3498db;
                    color: white;
                }

                #theme-btn {
                    background: #95a5a6;
                    color: white;
                }

                .loading {
                    text-align: center;
                    padding: 50px;
                    font-size: 20px;
                }

                .error {
                    background: #e74c3c;
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                }

                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 25px;
                }

                @media (max-width: 768px) {
                    .grid {
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    }
                }
            </style>
            <div class="container">
                <div class="header">
                    <h1>Каталог товаров</h1>
                    <div class="controls">
                        <button id="refresh-btn">Обновить</button>
                        <button id="theme-btn">Тема</button>
                    </div>
                </div>
                ${this.renderContent()}
            </div>
        `;

        this.setupEventListeners();
    }

    renderContent() {
        if (this.loading) {
            return '<div class="loading">Загрузка...</div>';
        }

        if (this.error) {
            return `<div class="error">Ошибка: ${this.error}</div>`;
        }

        if (this.products.length === 0) {
            return '<div class="loading">Нет товаров</div>';
        }

        const items = this.products.map(product => `
            <product-item
                image="${product.image}"
                title="${product.title}"
                price="${product.price}"
                category="${product.category}"
                description="${product.description}"
            ></product-item>
        `).join('');

        return `<div class="grid">${items}</div>`;
    }
}

customElements.define('product-list', ProductList);