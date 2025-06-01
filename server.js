const express = require('express');
const cors = require('cors');
const { pool, setupDatabase } = require('./server/db');
const ServerCryptoService = require('./server/cryptoService');

const app = express();
const port = 3000;
const cryptoService = new ServerCryptoService();

const VALIDATION_PLAIN_TEXT = "PasswordManagerValidationMarkerOK";
const MARKER_DB_KEY = "master_validation_marker";

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/validate-key', async (req, res) => {
    const { masterKey } = req.body;
    if (!masterKey) {
        return res.status(400).json({ success: false, message: "Майстер-ключ не надано" });
    }

    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query('SELECT encrypted_value FROM validation_marker WHERE marker_key = ?', [MARKER_DB_KEY]);

            if (rows.length > 0) {
                const encryptedMarkerFromDB = rows[0].encrypted_value;
                const decryptedMarker = cryptoService.decrypt(encryptedMarkerFromDB, masterKey);

                if (decryptedMarker === VALIDATION_PLAIN_TEXT) {
                    res.json({ success: true, message: "Ключ валідний" });
                } else {
                    res.status(401).json({ success: false, message: "Неправильний майстер-ключ" });
                }
            } else {
                // Маркер не існує, створюємо новий
                const newEncryptedMarker = cryptoService.encrypt(VALIDATION_PLAIN_TEXT, masterKey);
                await connection.query('INSERT INTO validation_marker (marker_key, encrypted_value) VALUES (?, ?)', [MARKER_DB_KEY, newEncryptedMarker]);
                res.json({ success: true, message: "Нове сховище створено, ключ валідний" });
            }
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Помилка валідації ключа:", error);
        res.status(500).json({ success: false, message: "Серверна помилка при валідації ключа" });
    }
});

app.get('/api/passwords', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query('SELECT id, encrypted_login, encrypted_password FROM passwords');
            res.json({ success: true, data: rows });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Помилка отримання паролів:", error);
        res.status(500).json({ success: false, message: "Серверна помилка при отриманні паролів" });
    }
});

app.post('/api/passwords', async (req, res) => {
    const { encryptedLogin, encryptedPassword } = req.body;
    if (!encryptedLogin || !encryptedPassword) {
        return res.status(400).json({ success: false, message: "Зашифрований логін та пароль обов'язкові" });
    }

    try {
        const connection = await pool.getConnection();
        try {
            const [existing] = await connection.query('SELECT id FROM passwords WHERE encrypted_login = ?', [encryptedLogin]);
            if (existing.length > 0) {
                return res.status(409).json({ success: false, message: "Запис з таким (зашифрованим) логіном вже існує." });
            }

            await connection.query('INSERT INTO passwords (encrypted_login, encrypted_password) VALUES (?, ?)', [encryptedLogin, encryptedPassword]);
            res.status(201).json({ success: true, message: "Пароль успішно додано" });
        } finally {
            connection.release();
        }
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: "Запис з таким (зашифрованим) логіном вже існує (БД)." });
        }
        console.error("Помилка додавання пароля:", error);
        res.status(500).json({ success: false, message: "Серверна помилка при додаванні пароля" });
    }
});

app.delete('/api/passwords', async (req, res) => {
    const { encryptedLogin } = req.body;
    if (!encryptedLogin) {
        return res.status(400).json({ success: false, message: "Зашифрований логін для видалення обов'язковий" });
    }

    try {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query('DELETE FROM passwords WHERE encrypted_login = ?', [encryptedLogin]);
            if (result.affectedRows > 0) {
                res.json({ success: true, message: "Пароль успішно видалено" });
            } else {
                res.status(404).json({ success: false, message: "Пароль з таким (зашифрованим) логіном не знайдено" });
            }
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Помилка видалення пароля:", error);
        res.status(500).json({ success: false, message: "Серверна помилка при видаленні пароля" });
    }
});

async function startServer() {
    try {
        await setupDatabase();
        app.listen(port, () => {
            console.log(`Сервер запущено на http://localhost:${port}`);
            console.log(`Клієнт доступний на http://localhost:${port}/index.html (або просто /)`);
        });
    } catch (error) {
        console.error("Не вдалося запустити сервер:", error);
        process.exit(1);
    }
}

startServer();