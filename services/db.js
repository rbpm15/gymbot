const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn("WARNING: DATABASE_URL environment variable is not defined.");
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // Required for Neon SSL connection
    }
});

// Auto-initialize the table if it does not exist
async function initDb() {
    if (!connectionString) return;
    try {
        const client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS registrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                plan VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Database table 'registrations' initialized successfully.");
        client.release();
    } catch (err) {
        console.error("Failed to initialize database table:", err);
    }
}

module.exports = {
    pool,
    initDb
};
