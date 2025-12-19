const mysql = require('mysql2');
require('dotenv').config();

/**
 * Utilizăm createPool în loc de createConnection.
 * Un "pool" (rezervă) gestionează automat mai multe conexiuni simultan.
 * Dacă o conexiune se închide din cauza inactivității, pool-ul deschide
 * automat alta la următoarea cerere, eliminând erorile de tip "closed state".
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'my_budget',
  waitForConnections: true,
  connectionLimit: 10, // Menține până la 10 conexiuni pregătite
  queueLimit: 0
});

// Verificăm dacă baza de date este accesibilă la pornirea serverului
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Eroare critică la conectarea la baza de date:', err.message);
  } else {
    console.log('Conexiune reușită la baza de date!'); //prin Connection Pool
    connection.release(); // Eliberăm conexiunea înapoi în rezervă
  }
});

/**
 * Exportăm pool-ul. 
 * Acesta este compatibil cu metoda .query() folosită în Service-ul tău.
 */
module.exports = pool;