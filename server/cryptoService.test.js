const ServerCryptoService = require('./cryptoService');

describe('ServerCryptoService', () => {
    let cryptoService;
    beforeEach(() => {
        cryptoService = new ServerCryptoService();
    });

    test('1. повинен правильно шифрувати та дешифрувати рядок', () => {
        const originalText = "ПростийТекстДляТесту123!";
        const key = "мій_супер_ключ";
        const encryptedText = cryptoService.encrypt(originalText, key);
        const decryptedText = cryptoService.decrypt(encryptedText, key);
        expect(decryptedText).toBe(originalText);
    });

    test('2. шифрування одного й того ж рядка тим самим ключем має давати однаковий результат', () => {
        const text = "повторюванийТекст";
        const key = "однаковийКлюч";
        const encrypted1 = cryptoService.encrypt(text, key);
        const encrypted2 = cryptoService.encrypt(text, key);
        expect(encrypted1).toBe(encrypted2);
    });

    test('3. дешифрування тексту, зашифрованого іншим ключем, не повинно повертати оригінал', () => {
        const originalText = "СекретнийТекст";
        const key1 = "ключОдин";
        const key2 = "ключДва";
        const encryptedText = cryptoService.encrypt(originalText, key1);
        const decryptedTextWithWrongKey = cryptoService.decrypt(encryptedText, key2);
        expect(decryptedTextWithWrongKey).not.toBe(originalText);
    });

    test('4. шифрування порожнього рядка має повертати порожній рядок', () => {
        const emptyText = "";
        const key = "будь-якийКлюч";
        const encryptedEmpty = cryptoService.encrypt(emptyText, key);
        expect(encryptedEmpty).toBe("");
        const decryptedEmpty = cryptoService.decrypt(encryptedEmpty, key);
        expect(decryptedEmpty).toBe("");
    });
});