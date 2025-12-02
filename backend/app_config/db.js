const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,         // Citeste din .env
  user: process.env.DB_USER,         // Citeste din .env
  password: process.env.DB_PASSWORD, // <-- Parola securizata
  database: process.env.DB_DATABASE  // Citeste din .env
});


connection.connect(err => {
  if (err) {
    console.error('Eroare la conectarea la baza de date: ' + err.stack);
    return;
  }
  console.log('Conexiune reușită la baza de date my_budget!');
});

// Exporta conexiunea pentru a fi folosita in alte fisiere
module.exports = connection;