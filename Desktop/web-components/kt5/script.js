class MyBox extends HTMLElement {
    constructor() {
        super();
    }
    
    static get observedAttributes() {
        return ["color"];
    }
    
    // Подключение элемента к DOM
    connectedCallback() {
        this.textContent = "Я появился!";
        this.style.backgroundColor = "green";
        this.style.padding = "20px";
        this.style.margin = "10px";
        this.style.display = "inline-block";
    }
    
    // Обработка изменения атрибутов
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "color") {
            this.style.backgroundColor = newValue;
        }
    }
    
    // При удалении из DOM
    disconnectedCallback() {
        console.log("Меня удалили!");
    }
}

customElements.define("my-box", MyBox);

// Логика кнопок
document.getElementById("redBtn").addEventListener("click", () => {
    document.querySelector("my-box").setAttribute("color", "red");
});

document.getElementById("blueBtn").addEventListener("click", () => {
    document.querySelector("my-box").setAttribute("color", "blue");
});

document.getElementById("removeBtn").addEventListener("click", () => {
    const myBox = document.querySelector("my-box");
    if (myBox) {
        myBox.remove();
    }
});