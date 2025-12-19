const connection = require('../app_config/db');

// Helper pentru execuție SQL
const executeQuery = (sql, values = []) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, values, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
};

const getAllCategories = () => {
    return executeQuery('SELECT * FROM categories ORDER BY name ASC');
};


const getCategoryById = (id) => {
    return executeQuery('SELECT * FROM categories WHERE id = ?', [id])
        .then(results => results[0]); 
};

const addCategory = (name) => {
    return executeQuery('INSERT INTO categories (name) VALUES (?)', [name])
        .then(results => results.insertId);
};

const updateCategory = (id, name) => {
    return executeQuery('UPDATE categories SET name = ? WHERE id = ?', [name, id])
        .then(results => results.affectedRows);
};

const deleteCategory = (id) => {
    return executeQuery('DELETE FROM categories WHERE id = ?', [id])
        .then(results => results.affectedRows);
};

module.exports = {
    getAllCategories,
    getCategoryById, 
    addCategory,
    updateCategory,
    deleteCategory
};