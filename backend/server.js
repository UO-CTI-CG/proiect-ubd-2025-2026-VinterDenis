require('dotenv').config(); 

const express = require('express');
const transactionRoutes = require('./routes/transactions'); 
const statsRoutes = require('./routes/stats'); 
const categoryRoutes = require('./routes/categories'); 
const connection = require('./app_config/db'); 


const app = express();
const PORT = process.env.PORT || 3000; 

app.use(express.json()); 

app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes); 

app.use('/api/categories', categoryRoutes); 

app.listen(PORT, () => {
  console.log(`Server pornit pe http://localhost:${PORT}`);
});