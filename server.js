require('dotenv').config({ path: './config.env' });

const express = require('express');
const connectToMongo = require('./config/db');

connectToMongo();

const app = express();
//midlewares
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/private', require('./routes/private'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`Server Running at port: ${PORT}`);
});
