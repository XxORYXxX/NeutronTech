// database.js
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const PORT = 3000;

const MySQL = mysql.createConnection({
    host: 'localhost', // o la IP de tu servidor MySQL
    user: 'Client', // tu usuario de MySQL
    password: '[|ClientUser765|]', // tu contraseña
    database: 'NeutronTech_Server' // el nombre de tu base de datos
});

// Crear pool de conexiones
const pool = mysql.createPool(MySQL);

// Servir imágenes estáticas desde el directorio de uploads
app.use('/images', express.static(path.join(__dirname, 'uploads')));

// Obtener un producto específico con su imagen
app.get('/api/products/:id', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();

        const [rows] = await connection.execute(
            `SELECT id, name, description, price, image, stock 
             FROM products WHERE id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const product = rows[0];

        // Construir URL completa de la imagen
        if (product.image) {
            product.image = `${req.protocol}://${req.get('host')}/images/${path.basename(product.image)}`;
        } else {
            product.image = null;
        }

        // No exponer la ruta física por seguridad
        delete product.image;

        res.json(product);
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        if (connection) connection.release();
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
connection.connect(err => { if (err) throw err; console.log('Conectado a la base de datos MySQL'); });

app.use(cors({
    origin: 'http://localhost:63342',
    methods: ['POST'],
    credentials: true
}));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const prompt = `
      . 
      Tu conocimiento incluye:
      - 
      
      Respuestas:
      1.
      
      Usuario pregunta: ${userMessage}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error('Error en chat endpoint:', error);
        res.status(500).json({
            reply: 'Lo siento, estoy teniendo problemas para responder. ¿Puedes intentarlo de nuevo más tarde?'
        });
    }
});