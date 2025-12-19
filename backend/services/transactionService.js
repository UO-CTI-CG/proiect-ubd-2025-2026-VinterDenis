const connection = require('../app_config/db');

// Functie helper pentru a executa interogari bazate pe Promise
const executeQuery = (sql, values = []) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, values, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};


// --- I. BAZĂ & MANAGEMENT (CRUD) ----------------------------------------------------

// 4. Listarea tuturor tranzacțiilor (Read)
const getAllTransactions = () => {
    const sql = 'SELECT id, type, amount, category_id, description, DATE_FORMAT(date, "%Y-%m-%d") as date FROM transactions ORDER BY date DESC, id DESC';
    return executeQuery(sql);
};

// 1. (Create)
const addTransaction = (data) => {
    const sql = 'INSERT INTO transactions (type, amount, category_id, description, date) VALUES (?, ?, ?, ?, ?)';
    const values = [data.type, data.amount, data.category_id, data.description, data.date];
    return executeQuery(sql, values).then(results => results.insertId);
};

// 2. (Update)
const updateTransaction = (id, data) => {
    const sql = 'UPDATE transactions SET type = ?, amount = ?, category_id = ?, description = ?, date = ? WHERE id = ?';
    const values = [data.type, data.amount, data.category_id, data.description, data.date, id];
    return executeQuery(sql, values).then(results => results.affectedRows);
};

// 3. (Delete)
const deleteTransaction = (id) => {
    const sql = 'DELETE FROM transactions WHERE id = ?';
    return executeQuery(sql, [id]).then(results => results.affectedRows);
};


// --- II. CALCULE SOLD & PERIOADĂ ---------------------------------------------------

// 5. Soldul Final pe toată perioada
const getSoldTotalGlobal = () => {
    const sql = `SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS sold_total FROM transactions;`;
    return executeQuery(sql).then(results => results[0].sold_total);
};

// 6. Soldul calculat între data de început și data de sfârșit
const getSoldByPeriod = (start, end) => {
    const sql = `SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS sold_period FROM transactions WHERE date BETWEEN ? AND ?;`;
    return executeQuery(sql, [start, end]).then(results => results[0].sold_period);
};

// 7. Suma Veniturilor pe perioada specificată
const getIncomeByPeriod = (start, end) => {
    const sql = `SELECT SUM(amount) AS total_income FROM transactions WHERE type = 'income' AND date BETWEEN ? AND ?;`;
    return executeQuery(sql, [start, end]).then(results => results[0].total_income);
};

// 8. Suma Cheltuielilor pe perioada specificată
const getExpenseByPeriod = (start, end) => {
    const sql = `SELECT SUM(amount) AS total_expense FROM transactions WHERE type = 'expense' AND date BETWEEN ? AND ?;`;
    return executeQuery(sql, [start, end]).then(results => results[0].total_expense);
};


// --- III. ANALIZĂ & RAPORTARE ------------------------------------------------------

// 9. Identifică cele mai mari N categorii de cheltuieli
const getTopCategories = (limit) => {
    const sql = `SELECT c.name AS category_name, SUM(t.amount) AS total_spent 
                 FROM transactions t JOIN categories c ON t.category_id = c.id 
                 WHERE t.type = 'expense' 
                 GROUP BY c.name ORDER BY total_spent DESC LIMIT ?;`;
    return executeQuery(sql, [parseInt(limit, 10)]);
};

// 10. Venituri și Cheltuieli grupate pe lună
const getMonthlyTotals = () => {
    const sql = `SELECT YEAR(date) as year, MONTH(date) as month, 
                 SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income, 
                 SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
                 FROM transactions GROUP BY year, month ORDER BY year ASC, month ASC;`;
    return executeQuery(sql);
};

// 11. Statistici pentru luni arbitrare specificate (ex: Februarie, Iunie)
const getStatsByMonths = (monthsList) => {
    const placeholders = monthsList.map(() => '?').join(',');
    const sql = `SELECT YEAR(date) AS year, MONTH(date) AS month,
                 SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income, 
                 SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
                 FROM transactions 
                 WHERE MONTH(date) IN (${placeholders})
                 GROUP BY year, month ORDER BY year, month;`;
    return executeQuery(sql, monthsList);
};

// 12. Extrapolarea soldului viitor bazat pe media tranzacțiilor
const getBalanceForecast = async (months) => {
    const monthlyTotals = await getMonthlyTotals();
    if (monthlyTotals.length === 0) return { error: "Nu sunt suficiente date." };
    
    // Calculăm suma soldurilor lunare (venit - cheltuială pentru fiecare lună)
    const totalSoldSum = monthlyTotals.reduce((sum, item) => {
        return sum + (Number(item.total_income) - Number(item.total_expense));
    }, 0);
    
    // Calculăm media pe o singură lună
    const monthlyAverage = totalSoldSum / monthlyTotals.length;
    
    const currentSold = await getSoldTotalGlobal();
    const forecast = [];
    
    for (let i = 1; i <= parseInt(months, 10); i++) {
        forecast.push({
            month_projection: i,
            // Folosim Number() pentru a forța adunarea matematică
            projected_sold: (Number(currentSold) + (monthlyAverage * i)).toFixed(2)
        });
    }
    return forecast;
};
// --- IV. FILTRARE SIMPLĂ -----------------------------------------------------------

// 13. Caută tranzacții după text în descriere/categorie
const filterByText = (query) => {
    const sql = `
        SELECT t.*, c.name as category_name
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.description LIKE ? OR c.name LIKE ?
        ORDER BY t.date DESC;
    `;
    const searchParam = `%${query}%`;
    return executeQuery(sql, [searchParam, searchParam]);
};

// 14. Filtrează tranzacțiile pentru a afișa doar Venituri sau doar Cheltuieli
const getTransactionsByType = (type) => {
    const sql = `SELECT * FROM transactions WHERE type = ? ORDER BY date DESC;`;
    return executeQuery(sql, [type]);
};


module.exports = {
    // Exportam toate cele 14 functii:
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

