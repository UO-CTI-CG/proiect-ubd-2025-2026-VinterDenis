const express = require('express');
const router = express.Router();

// Importa Controller-ul
const transactionController = require('../controllers/transactionController'); 

// --- RUTE DE BAZĂ (I. BAZĂ & MANAGEMENT) ---

// 4. Listarea tuturor tranzacțiilor (GET /api/transactions/all)
router.get('/all', transactionController.getAllTransactions); 

// 1. Adaugă o tranzacție nouă (POST /api/transactions)
router.post('/', transactionController.addTransaction); 

// 2. Modifică o tranzacție (PUT /api/transactions/:id)
router.put('/:id', transactionController.updateTransaction); 

// 3. Șterge o tranzacție (DELETE /api/transactions/:id)
router.delete('/:id', transactionController.deleteTransaction); 


// --- IV. FILTRARE SIMPLĂ (Funcțiile 13 & 14) ---

// 13. Caută tranzacții după text (GET /api/transactions/search?query=...)
router.get('/search', transactionController.filterByText); 

// 14. Filtrează tranzacțiile după tip (GET /api/transactions/filter/:type)
router.get('/filter/:type', transactionController.getTransactionsByType);


module.exports = router;