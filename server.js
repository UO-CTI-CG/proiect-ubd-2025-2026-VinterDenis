// --- ACESTE LINII TREBUIE SĂ FIE PRIMELE ÎN FIȘIER PENTRU A EVITA EROAREA FETCH FAILED ---
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); 
// ------------------------------------------------------------------------------------

require('dotenv').config(); 

const express = require('express');
const cors = require('cors'); 

// Importăm rutele modulare
const transactionRoutes = require('./backend/routes/transactions'); 
const statsRoutes = require('./backend/routes/stats'); 
const categoryRoutes = require('./backend/routes/categories'); 
const aiRoutes = require("./backend/routes/ai"); // Ruta pentru Smart Advisor AI

// Importăm conexiunea la baza de date
const connection = require('./backend/app_config/db'); 

const app = express();
const PORT = process.env.PORT || 5000; 

// --- MIDDLEWARE ---
// Permitem accesul de la orice origine pentru a evita blocajele CORS în faza de dezvoltare
app.use(cors()); 
app.use(express.json()); 

// --- DEFINIREA RUTELOR API ---
app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes); 
app.use('/api/categories', categoryRoutes); 
app.use('/api/ai', aiRoutes); 

// Gestionare rută inexistentă (404)
app.use((req, res) => {
  res.status(404).json({ message: "Resursa solicitată nu a fost găsită pe server." });
});

// Pornirea serverului
app.listen(PORT, () => {
  console.log(`🚀 Server backend pornit pe http://localhost:${PORT}`);
  console.log(`🤖 Smart Advisor este gata de primire cereri la /api/ai/financial-report`);
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ EROARE CRITICĂ: GEMINI_API_KEY lipsește din .env!");
  } else {
    // Validare vizuală pentru utilizator fără a expune cheia completă
    console.log(`✅ Conexiune AI pregătită. (Sufix cheie: ...${apiKey.substring(apiKey.length - 4)})`);
  }
  
  console.log("✅ Prioritate IPv4 activată (Soluție pentru eroarea 'fetch failed' pe Windows).");
});