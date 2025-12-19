const express = require('express');
const router = express.Router();

// Importa Controller-ul
const transactionController = require('../controllers/transactionController'); 

// --- II. CALCULE SOLD & PERIOADĂ ---

// 5. Soldul Final pe toată perioada (Global)
router.get('/sold-global', transactionController.getSoldTotalGlobal);

// 6. Soldul calculat între data de început și data de sfârșit.
router.get('/sold-period', transactionController.getSoldByPeriod);

// 7. Suma Veniturilor pe perioada specificată.
router.get('/income-period', transactionController.getIncomeByPeriod);

// 8. Suma Cheltuielilor pe perioada specificată.
router.get('/expense-period', transactionController.getExpenseByPeriod);


// --- III. ANALIZĂ & RAPORTARE ---

// 9. Top Cheltuieli după categorie
router.get('/top-expenses', transactionController.getTopCategories);

// 10. Venituri și Cheltuieli grupate pe lună
router.get('/monthly-flow', transactionController.getMonthlyTotals);

// 11. Statistici pentru luni arbitrare specificate
router.get('/selected-months', transactionController.getStatsByMonths);

// 12. Extrapolarea soldului viitor
router.get('/forecast', transactionController.getBalanceForecast);


module.exports = router;