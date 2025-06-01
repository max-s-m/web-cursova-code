class CryptoService {
    constructor() {
        this.THE_CHARS = [
            "А", "а", "Б", "б", "В", "в", "Г", "г", "Ґ", "ґ", "Д", "д", "Е", "е", "Є", "є", "Э", "э", "Ё", "ё",
            "Ж", "ж", "З", "з", "И", "и", "І", "і", "Ї", "ї", "Ы", "ы", "Й", "й", "К", "к", "Л", "л", "М", "м",
            "Н", "н", "О", "о", "П", "п", "Р", "р", "С", "с", "Т", "т", "У", "у", "Ф", "ф", "Х", "х", "Ц", "ц",
            "Ч", "ч", "Ш", "ш", "Щ", "щ", "Ю", "ю", "Я", "я", "Ь", "ь", "Ъ", "ъ",
            "A", "a", "B", "b", "C", "c", "D", "d", "E", "e", "F", "f", "G", "g", "H", "h", "I", "i", "J", "j",
            "K", "k", "L", "l", "M", "m", "N", "n", "O", "o", "P", "p", "Q", "q", "R", "r", "S", "s", "T", "t",
            "U", "u", "V", "v", "W", "w", "X", "x", "Y", "y", "Z", "z",
            "!", "\"", "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "<", "=", ">", "?",
            "@", "[", "\\", "]", "^", "_", "`", "{", "|", "}", "~",
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
        ];
        this.encryptionMap = new Map();
        this.decryptionMap = new Map();
    }

    _stringHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash;
    }

    _buildMap(key, isEncryption) {
        const map = new Map();
        const hashedKey = this._stringHash(key);
        let currentId = 0;
        const substIdTaken = new Array(this.THE_CHARS.length).fill(false);

        for (const char of this.THE_CHARS) {
            let shift = 0;
            let substId;
            const stringToHash = (hashedKey - currentId).toString();
            const finalHash = Math.abs(this._stringHash(stringToHash));

            do {
                substId = (Math.abs(finalHash - shift++)) % this.THE_CHARS.length;
            } while (substIdTaken[substId]);

            substIdTaken[substId] = true;
            const substChar = this.THE_CHARS[substId];

            if (isEncryption) {
                map.set(char, substChar);
            } else {
                map.set(substChar, char);
            }
            currentId++;
        }
        return map;
    }

    _prepareMaps(key) {
        this.encryptionMap = this._buildMap(key, true);
        this.decryptionMap = this._buildMap(key, false);
    }

    encrypt(text, key) {
        this._prepareMaps(key);
        let encryptedText = "";
        for (const char of text) {
            if (char === '\n' || char === '\t') {
                encryptedText += char;
            } else {
                if (this.encryptionMap.has(char)) {
                    encryptedText += this.encryptionMap.get(char);
                }
            }
        }
        return encryptedText;
    }

    decrypt(text, key) {
        this._prepareMaps(key);
        let decryptedText = "";
        for (const char of text) {
            if (char === '\n' || char === '\t') {
                decryptedText += char;
            } else {
                if (this.decryptionMap.has(char)) {
                    decryptedText += this.decryptionMap.get(char);
                }
            }
        }
        return decryptedText;
    }
}