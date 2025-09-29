// database.js
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors({
    origin: 'http://localhost:63342',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'Client',
    password: '[|ClientUser765|]',
    database: 'NeutronTech_Server',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL database');
        connection.release();
    }
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                reply: 'No message provided'
            });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

        const prompt = `
Eres un asistente útil de NeutronTech.

Tu conocimiento incluye:
- Tecnología y productos electrónicos
- Soporte técnico  
- Información sobre productos

Respuestas:
1. Sé amable y profesional
2. Proporciona información útil
3. Si no sabes algo, reconócelo
4. Si te preguntan en un idioma responde en ese idioma

Usuario pregunta: ${message}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({
            reply: 'Lo siento, estoy teniendo problemas para responder. ¿Puedes intentarlo de nuevo más tarde?'
        });
    }
});

// Get products by category
app.get('/api/products/category/:category', async (req, res) => {
    let connection;
    try {
        connection = await pool.promise().getConnection();
        const [rows] = await connection.execute(
            `SELECT id, name, description, price, image, stock, category, ratings FROM products WHERE category = ?`,
            [req.params.category]
        );
        // Add image URL
        rows.forEach(product => {
            product.imageUrl = product.image
                ? `${req.protocol}://${req.get('host')}/images/${path.basename(product.image)}`
                : null;
        });
        res.json(rows);
    } catch (error) {
        console.error('Error getting products by category:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

// Decrease stock by 1
app.post('/api/products/decrement-stock', async (req, res) => {
    const { id } = req.body;
    let connection;
    try {
        connection = await pool.promise().getConnection();
        await connection.execute(
            'UPDATE products SET stock = stock - 1 WHERE id = ? AND stock > 0',
            [id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error decrementing stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

// Increase stock by 1
app.post('/api/products/increment-stock', async (req, res) => {
    const { id } = req.body;
    let connection;
    try {
        connection = await pool.promise().getConnection();
        await connection.execute(
            'UPDATE products SET stock = stock + 1 WHERE id = ?',
            [id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error incrementing stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});