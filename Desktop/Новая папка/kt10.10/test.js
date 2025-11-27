const expect = chai.expect;

describe('Корзина товаров', () => {
    
    beforeEach(() => {
        clearCart();
    });
    
    describe('addToCart', () => {
        
        it('добавление нового товара', () => {
            addToCart('1', 2);
            const result = getCart();
            expect(result['1']).to.equal(2);
        });
        
        it('увеличение количества уже добавленного товара', () => {
            addToCart('1', 2);
            addToCart('1', 3);
            const result = getCart();
            expect(result['1']).to.equal(5);
        });
        
        it('попытка добавить товар с отрицательным количеством', () => {
            expect(() => addToCart('1', -5)).to.throw('Quantity must be positive');
        });
        
        it('попытка добавить товар с нулевым количеством', () => {
            expect(() => addToCart('1', 0)).to.throw('Quantity must be positive');
        });
        
        it('добавление нескольких разных товаров', () => {
            addToCart('1', 2);
            addToCart('2', 3);
            const result = getCart();
            expect(result['1']).to.equal(2);
            expect(result['2']).to.equal(3);
        });
        
    });
    
});