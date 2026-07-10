const express = require('express');
const router = express.Router();
const { pool } = require('../services/db');

router.post('/', async (req, res) => {
    try {
        const { name, email, phone, plan } = req.body;

        // Basic validation
        if (!name || !email || !phone || !plan) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const queryText = `
            INSERT INTO registrations (name, email, phone, plan)
            VALUES ($1, $2, $3, $4)
            RETURNING id, created_at;
        `;
        const values = [name, email, phone, plan];

        const result = await pool.query(queryText, values);
        const newRecord = result.rows[0];

        res.status(201).json({
            message: 'Registro guardado exitosamente en Neon',
            id: newRecord.id,
            created_at: newRecord.created_at
        });
    } catch (error) {
        console.error('Error saving registration to DB:', error.message);
        res.status(500).json({ error: 'Error interno al guardar el registro en la base de datos' });
    }
});

module.exports = router;
