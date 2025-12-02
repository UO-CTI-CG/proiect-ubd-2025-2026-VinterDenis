const express = require('express');
const router = express.Router();

// Importa functia logica pe care am scris-o in transactionService
const transactionService = require('../services/transactionService'); 

// RUTA GET /api/transactions/sold-total
router.get('/sold-total', async (req, res) => {
    try {
        // 1. Apeleaza functia din Service si asteapta rezultatul
        // "await" asteapta ca Promise-ul din transactionService.js sa se rezolve
        const sold = await transactionService.getSoldTotal();
        
        // 2. Returneaza rezultatul in format JSON catre frontend
        res.json({ 
            soldTotal: sold 
        });
        
    } catch (error) {
        // 3. In caz de eroare (ex: conexiune BD esuata), trimite cod 500
        console.error('Eroare pe ruta /sold-total:', error);
        res.status(500).send('Eroare la calcularea soldului total.');
    }
});

module.exports = router;