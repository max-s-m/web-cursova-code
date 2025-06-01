class AppController {
    constructor(uiManager, passwordService) {
        this.uiManager = uiManager;
        this.passwordService = passwordService;
        this.dbService = passwordService.dbService;

        this.masterKey = null;
        this.isAuthenticated = false;
        this.generatedPasswordCache = null;
    }

    init() {
        this._bindEvents();
        this.uiManager.showScreen('masterKey');
    }

    _bindEvents() {
        this.uiManager.buttons.unlock.addEventListener('click', async () => await this.handleUnlock());
        this.uiManager.buttons.lock.addEventListener('click', () => this.handleLock());

        this.uiManager.buttons.viewPasswords.addEventListener('click', async () => await this.handleViewPasswords());
        this.uiManager.buttons.managePasswords.addEventListener('click', () => this.uiManager.showScreen('passwordEdit'));

        this.uiManager.buttons.backToMainFromList.addEventListener('click', () => this.uiManager.showScreen('mainMenu'));
        this.uiManager.buttons.backToMainFromEdit.addEventListener('click', () => this.uiManager.showScreen('mainMenu'));

        this.uiManager.buttons.showAddPasswordForm.addEventListener('click', () => {
            this.uiManager.showScreen('addPasswordForm');
            this.uiManager.hideAddPasswordSubForms();
            this.uiManager.clearInputs('newLogin', 'newPassword', 'genLoginInput');
        });
        this.uiManager.buttons.showRemovePasswordForm.addEventListener('click', () => {
            this.uiManager.showScreen('removePasswordForm');
            this.uiManager.clearInputs('loginToDelete');
        });

        this.uiManager.buttons.addOwnPassword.addEventListener('click', () => this.uiManager.showManualAddPasswordFields());
        this.uiManager.buttons.generatePassword.addEventListener('click', () => this.uiManager.showGeneratePasswordFields());
        this.uiManager.buttons.saveManualPassword.addEventListener('click', async () => await this.handleSaveManualPassword());
        this.uiManager.buttons.executeGenerate.addEventListener('click', () => this.handleExecuteGeneratePassword());
        this.uiManager.buttons.saveGeneratedPassword.addEventListener('click', async () => await this.handleSaveGeneratedPassword());
        this.uiManager.buttons.backToEditFromAdd.addEventListener('click', () => {
            this.uiManager.showScreen('passwordEdit');
            this.uiManager.hideAddPasswordSubForms();
        });

        this.uiManager.buttons.executeDelete.addEventListener('click', async () => await this.handleExecuteDeletePassword());
        this.uiManager.buttons.backToEditFromRemove.addEventListener('click', () => this.uiManager.showScreen('passwordEdit'));
    }

    async handleUnlock() {
        const key = this.uiManager.inputs.masterKey.value;
        if (!key) {
            this.uiManager.showMessage('error', "Майстер-ключ не може бути порожнім.", 'masterKey');
            return;
        }

        try {
            const response = await this.dbService.validateMasterKey(key);
            if (response.success) {
                this.masterKey = key;
                this.isAuthenticated = true;
                this.uiManager.showScreen('mainMenu');
                this.uiManager.showMessage('success', response.message, 'masterKey');
            } else {
                this.uiManager.showMessage('error', response.message || "Неправильний майстер-ключ.", 'masterKey');
            }
            this.uiManager.inputs.masterKey.value = '';
        } catch (error) {
            console.error("Помилка розблокування (клієнт):", error);
            this.uiManager.showMessage('error', error.message || "Помилка з'єднання або сервера.", 'masterKey');
        }
    }

    handleLock() {
        this.masterKey = null;
        this.isAuthenticated = false;
        this.generatedPasswordCache = null;
        this.uiManager.clearInputs();
        this.uiManager.showScreen('masterKey');
        this.uiManager.showMessage('success', "Сховище заблоковано.", 'masterKey');
    }

    async handleViewPasswords() {
        if (!this.isAuthenticated) {
            this.uiManager.showMessage('error', "Спочатку розблокуйте сховище.", 'global');
            this.uiManager.showScreen('masterKey');
            return;
        }
        this.uiManager.outputs.passwordsContainer.innerHTML = '<p>Завантаження...</p>';
        try {
            const passwords = await this.passwordService.getDecryptedPasswords(this.masterKey);
            this.uiManager.displayPasswords(passwords);
            this.uiManager.showScreen('passwordList');
        } catch (error) {
            console.error("Помилка перегляду паролів (клієнт):", error);
            this.uiManager.showMessage('error', error.message || "Помилка отримання паролів.", 'global');
            this.uiManager.outputs.passwordsContainer.innerHTML = '<p>Помилка завантаження паролів.</p>';
        }
    }

    async handleSaveManualPassword() {
        if (!this.isAuthenticated) { this.handleLock(); return; }
        const login = this.uiManager.inputs.newLogin.value;
        const password = this.uiManager.inputs.newPassword.value;
        if (!login || !password) {
            this.uiManager.showMessage('error', "Логін та пароль не можуть бути порожніми.", 'addPassword');
            return;
        }
        try {
            await this.passwordService.addPasswordEntry(login, password, this.masterKey);
            this.uiManager.showMessage('success', "Пароль успішно додано.", 'addPassword');
            this.uiManager.clearInputs('newLogin', 'newPassword');
            this.uiManager.hideAddPasswordSubForms();
            setTimeout(() => this.uiManager.showScreen('passwordEdit'), 1500);
        } catch (error) {
            console.error("Помилка додавання пароля (клієнт):", error);
            this.uiManager.showMessage('error', error.message || "Помилка додавання пароля.", 'addPassword');
        }
    }

    handleExecuteGeneratePassword() {
        if (!this.isAuthenticated) { this.handleLock(); return; }
        try {
            const options = this.uiManager.getPasswordGenerationOptions();
            if (options.latin + options.cyrillic + options.specCharNum > options.passLen) {
                throw new Error("Сума типів символів перевищує загальну довжину пароля.");
            }
            const genPass = this.passwordService.generatePassword(options);
            this.uiManager.outputs.generatedPassword.textContent = genPass;
            this.generatedPasswordCache = genPass;
            this.uiManager.showSaveGeneratedPasswordFields();
            this.uiManager.showMessage('success', "Пароль згенеровано.", 'addPassword');
        } catch (error) {
            console.error("Помилка генерації пароля:", error);
            this.uiManager.outputs.generatedPassword.textContent = '';
            this.generatedPasswordCache = null;
            this.uiManager.showMessage('error', `Помилка генерації: ${error.message || error}`, 'addPassword');
        }
    }

    async handleSaveGeneratedPassword() {
        if (!this.isAuthenticated) { this.handleLock(); return; }
        const login = this.uiManager.inputs.genLoginInput.value;
        if (!login || !this.generatedPasswordCache) {
            this.uiManager.showMessage('error', "Логін не може бути порожнім, і пароль має бути згенеровано.", 'addPassword');
            return;
        }
        try {
            await this.passwordService.addPasswordEntry(login, this.generatedPasswordCache, this.masterKey);
            this.uiManager.showMessage('success', "Згенерований пароль успішно додано.", 'addPassword');
            this.uiManager.clearInputs('genLoginInput');
            this.uiManager.outputs.generatedPassword.textContent = '';
            this.generatedPasswordCache = null;
            this.uiManager.hideAddPasswordSubForms();
            setTimeout(() => this.uiManager.showScreen('passwordEdit'), 1500);
        } catch (error) {
            console.error("Помилка збереження згенерованого пароля (клієнт):", error);
            this.uiManager.showMessage('error', error.message || "Помилка збереження пароля.", 'addPassword');
        }
    }

    async handleExecuteDeletePassword() {
        if (!this.isAuthenticated) { this.handleLock(); return; }
        const loginToDelete = this.uiManager.inputs.loginToDelete.value;
        if (!loginToDelete) {
            this.uiManager.showMessage('error', "Введіть логін для видалення.", 'removePassword');
            return;
        }
        try {
            await this.passwordService.removePasswordEntry(loginToDelete, this.masterKey);
            this.uiManager.showMessage('success', "Пароль успішно видалено.", 'removePassword');
            this.uiManager.clearInputs('loginToDelete');
            setTimeout(() => this.uiManager.showScreen('passwordEdit'), 1500);
        } catch (error) {
            console.error("Помилка видалення пароля (клієнт):", error);
            this.uiManager.showMessage('error', error.message || "Помилка видалення пароля.", 'removePassword');
        }
    }
}