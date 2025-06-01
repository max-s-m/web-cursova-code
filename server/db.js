const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1235',
    database: 'pass_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function setupDatabase() {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS passwords (
                id INT AUTO_INCREMENT PRIMARY KEY,
                encrypted_login TEXT NOT NULL,
                encrypted_password TEXT NOT NULL,
                UNIQUE INDEX idx_encrypted_login (encrypted_login(255)) -- Обмеження довжини для індексу TEXT
            )
        `);
        console.log("Таблиця 'passwords' готова.");

        await connection.query(`
            CREATE TABLE IF NOT EXISTS validation_marker (
                id INT AUTO_INCREMENT PRIMARY KEY,
                marker_key VARCHAR(50) UNIQUE NOT NULL,
                encrypted_value TEXT NOT NULL
            )
        `);
        console.log("Таблиця 'validation_marker' готова.");

    } catch (error) {
        console.error("Помилка при налаштуванні бази даних:", error);
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    pool,
    setupDatabase
};