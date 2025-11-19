// header
class SiteHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                header {
                    background: linear-gradient(135deg, #2c3e50, #4a6491);
                    color: white;
                    padding: 1rem 0;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                        
                .container {
                    width: 90%;
                    max-width: 1200px;
                    margin: 0 auto;
                    isplay: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                        
                .logo {
                    font-size: 1.8rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                }
            </style>
            <header>
                <div class="container">
                    <div class="logo">TechStore</div>
                </div>
            </header>
        `;
    }
}

// footer
class SiteFooter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                footer {
                    background-color: #2c3e50;
                    color: white;
                    padding: 2.5rem 0 1.5rem;
                    margin-top: 3rem;
                }
                        
                .container {
                    width: 90%;
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    flex-wrap: wrap;
                }
                        
                .footer-section {
                    flex: 1;
                    min-width: 200px;
                    margin-bottom: 1.5rem;
                }
                        
                .footer-section h3 {
                    margin-bottom: 1.2rem;
                    font-size: 1.3rem;
                    color: #3498db;
                }
                        
                .footer-section p {
                    margin-bottom: 0.8rem;
                }        
                .copyright {
                    text-align: center;
                    width: 100%;
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    color: #bdc3c7;
                    font-size: 0.9rem;
                }
            </style>
            <footer>
                <div class="container">
                    <div class="footer-section">
                        <h3>Часы работы</h3>
                        <p>Пн-Пт: 9:00 - 21:00</p>
                        <p>Сб-Вс: 10:00 - 20:00</p>
                    </div>
                </div>
            </footer>
        `;
    }
}



//карточка товара
class ProductCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        const template = document.getElementById('product-card-template');
        const content = template.content.cloneNode(true);

        const image = content.querySelector('.product-image');
        image.src = this.getAttribute('image');
        image.alt = this.getAttribute('title');

        const title = content.querySelector('.product-title');
        title.textContent = this.getAttribute('title');

        const description = content.querySelector('.product-description');
        description.textContent = this.getAttribute('description');

        const price = content.querySelector('.product-price');
        price.textContent = this.getAttribute('price');

        this.shadowRoot.appendChild(content);
    }
}

// Регистрируем все компоненты
customElements.define('site-header', SiteHeader);
customElements.define('site-footer', SiteFooter);
customElements.define('product-card', ProductCard);