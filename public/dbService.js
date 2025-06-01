class DBService {
    constructor(baseUrl = 'http://localhost:3000/api') {
        this.baseUrl = baseUrl;
    }

    async _fetch(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`HTTP помилка ${response.status}: ${response.statusText}`);
                }
                throw new Error(errorData.message || `HTTP помилка ${response.status}`);
            }
            if (response.status === 204 || response.headers.get("content-length") === "0") {
                return { success: true };
            }
            return response.json();
        } catch (error) {
            console.error('Помилка запиту:', error.message);
            throw error;
        }
    }

    async validateMasterKey(masterKey) {
        return this._fetch(`${this.baseUrl}/validate-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ masterKey })
        });
    }

    async getAllEntries() {
        const response = await this._fetch(`${this.baseUrl}/passwords`);
        if (response.success) {
            return response.data;
        }
        throw new Error(response.message || "Не вдалося отримати записи");
    }

    async addEntry(encryptedLogin, encryptedPassword) {
        return this._fetch(`${this.baseUrl}/passwords`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encryptedLogin, encryptedPassword })
        });
    }

    async deleteEntryByEncryptedLogin(encryptedLogin) {
        return this._fetch(`${this.baseUrl}/passwords`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ encryptedLogin })
        });
    }
}