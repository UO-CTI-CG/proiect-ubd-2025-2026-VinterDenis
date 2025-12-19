const categoryService = require('../services/categoryService');

const getAllCategories = async (req, res) => {
    try {
        const categories = await categoryService.getAllCategories();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};


const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await categoryService.getCategoryById(id);
        
        if (!category) {
            return res.status(404).json({ message: 'Categoria nu a fost găsită.' });
        }
        
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

const addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Numele categoriei este obligatoriu.' });
        
        const newId = await categoryService.addCategory(name);
        res.status(201).json({ message: 'Categorie adăugată cu succes.', id: newId });
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) return res.status(400).json({ message: 'Noul nume este obligatoriu.' });

        const affectedRows = await categoryService.updateCategory(id, name);
        
        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Categoria nu a fost găsită.' });
        }

        res.status(200).json({ message: 'Categorie actualizată cu succes.' });
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const affectedRows = await categoryService.deleteCategory(id);
        
        if (affectedRows === 0) return res.status(404).json({ message: 'Nu a fost găsită.' });
        
        res.status(200).json({ message: 'Categorie ștearsă cu succes.' });
    } catch (error) {
        res.status(500).json({ message: 'Eroare la server.', error: error.message });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById, 
    addCategory,
    updateCategory,
    deleteCategory
};