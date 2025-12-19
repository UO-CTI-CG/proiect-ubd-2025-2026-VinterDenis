const transactionService = require('../services/transactionService');

// Helper pentru a gestiona validarea de bază a perioadei
const validatePeriod = (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) {
        res.status(400).json({ message: 'Vă rugăm să specificați data de început și data de sfârșit.' });
        return null;
    }
    return { start, end };
};

// --- I. BAZĂ & MANAGEMENT (CRUD) ---

const getAllTransactions = async (req, res) => {
    try {
        const transactions = await transactionService.getAllTransactions();
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

const addTransaction = async (req, res) => {
    try {
        const newTransactionId = await transactionService.addTransaction(req.body);
        res.status(201).json({ 
            message: 'Tranzacție adăugată cu succes.', 
            id: newTransactionId 
        });
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

const updateTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        const affectedRows = await transactionService.updateTransaction(id, req.body);
        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Tranzacția nu a fost găsită.' });
        }
        res.status(200).json({ message: 'Tranzacție actualizată cu succes.' });
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

const deleteTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        const affectedRows = await transactionService.deleteTransaction(id);
        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Tranzacția nu a fost găsită.' });
        }
        res.status(200).json({ message: 'Tranzacție ștearsă cu succes.' });
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

// --- II. CALCULE SOLD & PERIOADĂ ---

// 5. Sold Global
const getSoldTotalGlobal = async (req, res) => {
    try {
        const sold = await transactionService.getSoldTotalGlobal();
        res.status(200).json({ soldTotalGlobal: sold });
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

// 6. Sold pe Perioadă
const getSoldByPeriod = async (req, res) => {
    const period = validatePeriod(req, res);
    if (!period) return;
    try {
        const sold = await transactionService.getSoldByPeriod(period.start, period.end);
        res.status(200).json({ soldPeriod: sold });
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

// 7. Venit pe Perioadă
const getIncomeByPeriod = async (req, res) => {
    const period = validatePeriod(req, res);
    if (!period) return;
    try {
        const totalIncome = await transactionService.getIncomeByPeriod(period.start, period.end);
        res.status(200).json({ totalIncome: totalIncome });
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

// 8. Cheltuieli pe Perioadă
const getExpenseByPeriod = async (req, res) => {
    const period = validatePeriod(req, res);
    if (!period) return;
    try {
        const totalExpense = await transactionService.getExpenseByPeriod(period.start, period.end);
        res.status(200).json({ totalExpense: totalExpense });
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

// --- III. ANALIZĂ & RAPORTARE ---

// 9. Top Cheltuieli
const getTopCategories = async (req, res) => {
    const limit = req.query.limit || 5; 
    try {
        const topExpenses = await transactionService.getTopCategories(limit);
        res.status(200).json(topExpenses);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

// 10. Totaluri Lunare
const getMonthlyTotals = async (req, res) => {
    try {
        const totals = await transactionService.getMonthlyTotals();
        res.status(200).json(totals);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

// 11. Statistici pentru Luni Arbitrare
const getStatsByMonths = async (req, res) => {
    const { months } = req.query; 
    if (!months) return res.status(400).json({ message: 'Vă rugăm să specificați o listă de luni (ex: ?months=1,5).' });
    
    try {
        const monthsArray = months.split(',').map(Number); 
        const stats = await transactionService.getStatsByMonths(monthsArray);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

// 12. Prognoza Soldului
const getBalanceForecast = async (req, res) => {
    const months = req.query.months || 3; 
    try {
        const forecast = await transactionService.getBalanceForecast(months);
        res.status(200).json(forecast);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

// --- IV. FILTRARE SIMPLĂ ---

// 13. Caută după text
const filterByText = async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Vă rugăm să specificați un termen de căutare (query).' });
    try {
        const results = await transactionService.filterByText(query);
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

// 14. Filtrare după tip
const getTransactionsByType = async (req, res) => {
    const { type } = req.params; 
    if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ message: 'Tipul de tranzacție trebuie să fie "income" sau "expense".' });
    }
    try {
        const transactions = await transactionService.getTransactionsByType(type);
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};


module.exports = {
    getAllTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getSoldTotalGlobal,
    getSoldByPeriod,
    getIncomeByPeriod,
    getExpenseByPeriod,
    getTopCategories,
    getMonthlyTotals,
    getStatsByMonths,
    getBalanceForecast,
    filterByText,
    getTransactionsByType,
};