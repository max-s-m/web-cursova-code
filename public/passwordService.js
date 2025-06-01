class PasswordService {
    constructor(cryptoService, dbService) {
        this.cryptoService = cryptoService;
        this.dbService = dbService;
        this.CYR_ALPHA = ["А", "а", "Б", "б", "В", "в", "Г", "г", "Ґ", "ґ", "Д", "д", "Е", "е", "Є", "є", "Э", "э", "Ё", "ё", "Ж", "ж", "З", "з", "И", "и", "І", "і", "Ї", "ї", "Ы", "ы", "Й", "й", "К", "к", "Л", "л", "М", "м", "Н", "н", "О", "о", "П", "п", "Р", "р", "С", "с", "Т", "т", "У", "у", "Ф", "ф", "Х", "х", "Ц", "ц", "Ч", "ч", "Ш", "ш", "Щ", "щ", "Ю", "ю", "Я", "я", "Ь", "ь", "Ъ", "ъ"];
        this.LAT_ALPHA = ['A', 'a', 'B', 'b', 'C', 'c', 'D', 'd', 'E', 'e', 'F', 'f', 'G', 'g', 'H', 'h', 'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l', 'M', 'm', 'N', 'n', 'O', 'o', 'P', 'p', 'Q', 'q', 'R', 'r', 'S', 's', 'T', 't', 'U', 'u', 'V', 'v', 'W', 'w', 'X', 'x', 'Y', 'y', 'Z', 'z'];
        this.VALID_SPEC_CHARS_DEFAULT = ['!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_', '`', '{', '|', '}', '~'];
        this.DIGIT_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    }

    _rangeRand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generatePassword(options) {
        const { passLen, latin, cyrillic, specCharNum, specCharsString } = options;

        if (passLen < 1 || passLen > 128) throw new Error("Довжина паролю має бути від 1 до 128.");
        if (latin < 0 || cyrillic < 0 || specCharNum < 0) throw new Error("Кількість символів не може бути від'ємною.");

        let currentLen = latin + cyrillic + specCharNum;
        if (currentLen > passLen) throw new Error("Сума символів перевищує загальну довжину паролю.");

        const numDigits = passLen - currentLen;

        const specCharsArray = specCharsString ? Array.from(new Set(specCharsString.split('').filter(ch => this.VALID_SPEC_CHARS_DEFAULT.includes(ch)))) : [];
        if (specCharNum > 0 && specCharsArray.length === 0 && specCharsString.length > 0) {
            throw new Error("Введено непідтримувані спецсимволи або не введено спецсимволи при їх кількості > 0.");
        }
        if (specCharNum > 0 && specCharsArray.length === 0 && !specCharsString) {
            throw new Error("Не введено спецсимволи, але їх кількість > 0.");
        }

        let effectiveSpecCharNum = specCharNum;
        if (specCharNum > specCharsArray.length && specCharsArray.length > 0) {
            effectiveSpecCharNum = specCharsArray.length;
        }


        let passChars = [];
        for (let i = 0; i < cyrillic; i++) passChars.push(this.CYR_ALPHA[this._rangeRand(0, this.CYR_ALPHA.length - 1)]);
        for (let i = 0; i < latin; i++) passChars.push(this.LAT_ALPHA[this._rangeRand(0, this.LAT_ALPHA.length - 1)]);
        for (let i = 0; i < effectiveSpecCharNum; i++) {
            if (specCharsArray.length > 0) {
                passChars.push(specCharsArray[this._rangeRand(0, specCharsArray.length - 1)]);
            }
        }

        const remainingLength = passLen - passChars.length;
        for (let i = 0; i < remainingLength; i++) passChars.push(this.DIGIT_CHARS[this._rangeRand(0, this.DIGIT_CHARS.length - 1)]);


        for (let i = passChars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [passChars[i], passChars[j]] = [passChars[j], passChars[i]];
        }
        return passChars.join('');
    }

    async addPasswordEntry(login, password, masterKey) {
        if (!login || !password) throw new Error("Логін та пароль не можуть бути порожніми.");
        const encryptedLogin = this.cryptoService.encrypt(login, masterKey);
        const encryptedPassword = this.cryptoService.encrypt(password, masterKey);

        const result = await this.dbService.addEntry(encryptedLogin, encryptedPassword);
        if (!result.success) {
            throw new Error(result.message || "Не вдалося додати пароль на сервері.");
        }
        return result;
    }

    async removePasswordEntry(loginToDelete, masterKey) {
        if (!loginToDelete) throw new Error("Логін для видалення не може бути порожнім.");
        const encryptedLoginToDelete = this.cryptoService.encrypt(loginToDelete, masterKey);

        const result = await this.dbService.deleteEntryByEncryptedLogin(encryptedLoginToDelete);
        if (!result.success) {
            throw new Error(result.message || "Не вдалося видалити пароль на сервері.");
        }
        return result;
    }

    async getDecryptedPasswords(masterKey) {
        const allEncryptedEntries = await this.dbService.getAllEntries();
        const decryptedPasswords = [];

        for (const entry of allEncryptedEntries) {
            try {
                const decryptedLogin = this.cryptoService.decrypt(entry.encrypted_login, masterKey);
                const decryptedPassword = this.cryptoService.decrypt(entry.encrypted_password, masterKey);

                if (decryptedLogin.length > 0 || decryptedPassword.length > 0 || (entry.encrypted_login === "" && entry.encrypted_password === "")) {
                    decryptedPasswords.push({ login: decryptedLogin, password: decryptedPassword });
                } else {
                    if (entry.encrypted_login.length > 0 || entry.encrypted_password.length > 0) {
                        console.warn("Можливо, неправильний ключ для запису:", entry.encrypted_login);
                        decryptedPasswords.push({ login: decryptedLogin, password: decryptedPassword });
                    }
                }

            } catch (e) {
                console.warn("Не вдалося дешифрувати запис (клієнт):", entry.encrypted_login, e);
            }
        }
        return decryptedPasswords;
    }
}