const db = require('../app_config/db'); // Importa conexiunea la baza de date

// Functia 1: Calculeaza soldul total (Venituri - Cheltuieli)
function getSoldTotal() {
    // Interogarea SQL
    const sql = `
        SELECT
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) -
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)
        AS sold_total
        FROM transactions;
    `;
    
    // Invelim apelul db.query intr-un Promise pentru a folosi sintaxa async/await in rute
    return new Promise((resolve, reject) => {
        db.query(sql, (err, results) => {
            if (err) return reject(err);
            
            // Extragem valoarea sold_total din rezultate
            const sold = results[0].sold_total;
            resolve(sold);
        });
    });
}

// Exportam functia
module.exports = {
    getSoldTotal
};