require('dotenv').config(); // Incarca variabilele din fisierul .env

const express = require('express');

// Importa rutele tranzacțiilor din folderul routes/
const transactionRoutes = require('./routes/transactions'); 
// Importa obiectul de conexiune la baza de date din folderul app_config/
const connection = require('./app_config/db'); 

const app = express();
const PORT = 3000; 

// Middleware-uri: Configureaza serverul sa citeasca cererile JSON
app.use(express.json()); 

// Rutele API: Leaga ruta principala (/api/transactions) de logica din transactionRoutes
app.use('/api/transactions', transactionRoutes);

// Pornirea serverului
app.listen(PORT, () => {
  console.log(`Server pornit pe http://localhost:${PORT}`);
  
  // Verifica daca a reusit sa importe conexiunea la BD
  if (connection.threadId) {
    console.log('Stare conexiune BD: Activa');
  } else {
    console.log('Stare conexiune BD: Inactiva/Eroare');
  }
});