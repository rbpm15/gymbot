require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const chatRoutes = require('./routes/chat');
const registrationRoutes = require('./routes/registration');
const { initDb } = require('./services/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/chat', chatRoutes);
app.use('/register', registrationRoutes);

// Initialize database tables
initDb();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
