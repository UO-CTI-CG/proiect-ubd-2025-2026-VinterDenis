require('dotenv').config(); 

const express = require('express');
const cors = require('cors'); 


const transactionRoutes = require('./backend/routes/transactions'); 
const statsRoutes = require('./backend/routes/stats'); 
const categoryRoutes = require('./backend/routes/categories'); 
const connection = require('./backend/app_config/db'); // Calea catre conexiunea DB


const app = express();
const PORT = process.env.PORT || 3000; 



app.use(cors()); 
app.use(express.json()); 

app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes); 
app.use('/api/categories', categoryRoutes); 

app.listen(PORT, () => {
  
  console.log(`Server pornit pe http://localhost:${PORT}`);
});