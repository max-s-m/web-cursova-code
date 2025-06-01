class UIManager {
    constructor() {
        this.screens = {
            masterKey: document.getElementById('masterKeyScreen'),
            mainMenu: document.getElementById('mainMenuScreen'),
            passwordList: document.getElementById('passwordListScreen'),
            passwordEdit: document.getElementById('passwordEditScreen'),
            addPasswordForm: document.getElementById('addPasswordFormScreen'),
            removePasswordForm: document.getElementById('removePasswordFormScreen'),
        };
        this.inputs = {
            masterKey: document.getElementById('masterKeyInput'),
            newLogin: document.getElementById('newLoginInput'),
            newPassword: document.getElementById('newPasswordInput'),
            genPassLen: document.getElementById('genPassLen'),
            genLatin: document.getElementById('genLatin'),
            genCyrillic: document.getElementById('genCyrillic'),
            genSpecCharNum: document.getElementById('genSpecCharNum'),
            genSpecChars: document.getElementById('genSpecChars'),
            genLoginInput: document.getElementById('genLoginInput'),
            loginToDelete: document.getElementById('loginToDeleteInput'),
        };
        this.outputs = {
            passwordsContainer: document.getElementById('passwordsContainer'),
            generatedPassword: document.getElementById('generatedPasswordOutput'),
            masterKeyMessage: document.getElementById('masterKeyMessage'),
            addPasswordMessage: document.getElementById('addPasswordMessage'),
            removePasswordMessage: document.getElementById('removePasswordMessage'),
            globalMessage: document.getElementById('globalMessage'),
        };
        this.buttons = {
            unlock: document.getElementById('unlockButton'),
            viewPasswords: document.getElementById('viewPasswordsButton'),
            managePasswords: document.getElementById('managePasswordsButton'),
            lock: document.getElementById('lockButton'),
            backToMainFromList: document.getElementById('backToMainFromList'),
            showAddPasswordForm: document.getElementById('showAddPasswordFormButton'),
            showRemovePasswordForm: document.getElementById('showRemovePasswordFormButton'),
            backToMainFromEdit: document.getElementById('backToMainFromEdit'),
            addOwnPassword: document.getElementById('addOwnPasswordButton'),
            generatePassword: document.getElementById('generatePasswordButton'),
            saveManualPassword: document.getElementById('saveManualPasswordButton'),
            executeGenerate: document.getElementById('executeGenerateButton'),
            saveGeneratedPassword: document.getElementById('saveGeneratedPasswordButton'),
            backToEditFromAdd: document.getElementById('backToEditFromAdd'),
            executeDelete: document.getElementById('executeDeleteButton'),
            backToEditFromRemove: document.getElementById('backToEditFromRemove'),
        };
        this.forms = {
            manualAddPasswordFields: document.getElementById('manualAddPasswordFields'),
            generatePasswordFields: document.getElementById('generatePasswordFields'),
            saveGeneratedPasswordFields: document.getElementById('saveGeneratedPasswordFields'),
        }

        this._hideAllScreens();
        this.showScreen('masterKey');
    }

    _hideAllScreens() {
        for (const screenName in this.screens) {
            this.screens[screenName].style.display = 'none';
        }
    }

    showScreen(screenName) {
        this._hideAllScreens();
        if (this.screens[screenName]) {
            this.screens[screenName].style.display = 'block';
        }
        this.clearMessages();
    }

    displayPasswords(passwords) {
        this.outputs.passwordsContainer.innerHTML = '';
        if (passwords.length === 0) {
            this.outputs.passwordsContainer.innerHTML = '<p>Сховище порожнє або не вдалося розшифрувати записи.</p>';
            return;
        }
        passwords.forEach(p => {
            const div = document.createElement('div');
            div.innerHTML = `<strong>Логін/Ресурс:</strong> ${this._escapeHTML(p.login || '')}<br>
                             <strong>Пароль:</strong> ${this._escapeHTML(p.password || '')}`;
            this.outputs.passwordsContainer.appendChild(div);
        });
    }

    _escapeHTML(str) {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }

    clearInputs(...inputKeys) {
        if (inputKeys.length === 0) {
            for (const key in this.inputs) {
                if (this.inputs[key].type !== 'button' && this.inputs[key].type !== 'submit') {
                    this.inputs[key].value = '';
                }
            }
            this.outputs.generatedPassword.textContent = '';
        } else {
            inputKeys.forEach(key => {
                if (this.inputs[key]) this.inputs[key].value = '';
            });
        }
    }

    showMessage(type, text, area = 'global') {
        let targetArea;
        switch(area) {
            case 'masterKey': targetArea = this.outputs.masterKeyMessage; break;
            case 'addPassword': targetArea = this.outputs.addPasswordMessage; break;
            case 'removePassword': targetArea = this.outputs.removePasswordMessage; break;
            default: targetArea = this.outputs.globalMessage;
        }
        targetArea.textContent = text;
        targetArea.className = `message ${type}`;
    }

    clearMessages() {
        this.outputs.masterKeyMessage.textContent = '';
        this.outputs.masterKeyMessage.className = 'message';
        this.outputs.addPasswordMessage.textContent = '';
        this.outputs.addPasswordMessage.className = 'message';
        this.outputs.removePasswordMessage.textContent = '';
        this.outputs.removePasswordMessage.className = 'message';
        this.outputs.globalMessage.textContent = '';
        this.outputs.globalMessage.className = 'message error';
    }

    getPasswordGenerationOptions() {
        return {
            passLen: parseInt(this.inputs.genPassLen.value),
            latin: parseInt(this.inputs.genLatin.value),
            cyrillic: parseInt(this.inputs.genCyrillic.value),
            specCharNum: parseInt(this.inputs.genSpecCharNum.value),
            specCharsString: this.inputs.genSpecChars.value
        };
    }

    showManualAddPasswordFields() {
        this.forms.manualAddPasswordFields.style.display = 'block';
        this.forms.generatePasswordFields.style.display = 'none';
        this.outputs.generatedPassword.textContent = '';
        this.forms.saveGeneratedPasswordFields.style.display = 'none';
    }

    showGeneratePasswordFields() {
        this.forms.manualAddPasswordFields.style.display = 'none';
        this.forms.generatePasswordFields.style.display = 'block';
    }

    showSaveGeneratedPasswordFields() {
        this.forms.saveGeneratedPasswordFields.style.display = 'block';
    }

    hideAddPasswordSubForms() {
        this.forms.manualAddPasswordFields.style.display = 'none';
        this.forms.generatePasswordFields.style.display = 'none';
        this.outputs.generatedPassword.textContent = '';
        this.forms.saveGeneratedPasswordFields.style.display = 'none';
    }
}