class ProductItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['image', 'title', 'price', 'category', 'theme'];
    }

    connectedCallback() {
        this.render();
        this.shadowRoot.querySelector('.card').addEventListener('click', () => {
            this.showDetails();
        });
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const image = this.getAttribute('image') || '';
        const title = this.getAttribute('title') || 'Без названия';
        const price = this.getAttribute('price') || '0';
        const category = this.getAttribute('category') || '';
        const theme = this.getAttribute('theme') || 'light';
        
        const isDark = theme === 'dark';

        this.shadowRoot.innerHTML = `
            <style>
                .card {
                    background: ${isDark ? '#2d2d2d' : 'white'};
                    color: ${isDark ? '#f5f5f5' : '#333'};
                    border-radius: 12px;
                    padding: 20px;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                }

                .image-container {
                    width: 100%;
                    height: 200px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 15px;
                    overflow: hidden;
                    border-radius: 8px;
                    background: ${isDark ? '#1a1a1a' : '#f9f9f9'};
                    border: 1px solid ${isDark ? '#444' : '#eee'};
                }

                img {
                    max-width: 90%;
                    max-height: 90%;
                    object-fit: contain;
                }

                .category {
                    font-size: 12px;
                    color: ${isDark ? '#aaa' : '#666'};
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }

                .title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    flex-grow: 1;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .price {
                    font-size: 20px;
                    color: #2ecc71;
                    font-weight: bold;
                }
            </style>
            <div class="card">
                <div class="image-container">
                    <img src="${image}" alt="${title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2216%22 fill=%22%23999%22%3EНет фото%3C/text%3E%3C/svg%3E'">
                </div>
                <div class="category">${category}</div>
                <div class="title">${title}</div>
                <div class="price">$${price}</div>
            </div>
        `;
    }

    showDetails() {
        const details = `
Название: ${this.getAttribute('title')}
Категория: ${this.getAttribute('category')}
Цена: $${this.getAttribute('price')}
Описание: ${this.getAttribute('description') || 'Нет описания'}
        `;
        alert(details);
    }
}

customElements.define('product-item', ProductItem);