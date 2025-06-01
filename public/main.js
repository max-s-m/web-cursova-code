document.addEventListener('DOMContentLoaded', () => {
    const cryptoServ = new CryptoService();
    const dbServ = new DBService();
    const passwordServ = new PasswordService(cryptoServ, dbServ);
    const uiMan = new UIManager();

    const appCtrl = new AppController(uiMan, passwordServ);
    appCtrl.init();
});