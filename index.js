// app.js

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const axios = require('axios');
const web3 = require('web3');

const app = express();
const SECRET_KEY = 'your_secret_key';

app.use(bodyParser.json());

// Sample user data (in real-world scenario, you'd use a database)
const users = [];

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    req.user = decoded.user;
    next();
  });
};

// Task 1: User Authentication with JWT
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  // In real-world scenario, you'd hash the password before saving
  users.push({ username, password });
  res.json({ message: 'User registered successfully' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ user: user.username }, SECRET_KEY);
  res.json({ token });
});

// Task 2: API Endpoints for Data Retrieval
app.get('/api/data', async (req, res) => {
  try {
    const { category, limit } = req.query;
    const response = await axios.get('https://api.publicapis.org/entries');
    let data = response.data.entries;

    if (category) {
      data = data.filter(entry => entry.Category.toLowerCase() === category.toLowerCase());
    }

    if (limit) {
      data = data.slice(0, limit);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Task 3: Swagger Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JWT Authentication with Express',
      version: '1.0.0',
      description: 'API documentation for JWT authentication and data retrieval',
    },
  },
  apis: ['./app.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Task 4: Secure API Endpoint for Authenticated Users Only
app.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Protected route accessed successfully', user: req.user });
});

// Task 5: Retrieve Ethereum Account Balance (Optional)
app.get('/eth_balance', async (req, res) => {
  try {
    const { address } = req.query;
    const web3Provider = new web3.providers.HttpProvider('https://mainnet.infura.io/v3/your_infura_project_id');
    const web3Instance = new web3(web3Provider);

    const balance = await web3Instance.eth.getBalance(address);
    res.json({ balance: web3Instance.utils.fromWei(balance, 'ether') });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve balance', error: error.message });
  }
});

// Start the server
app.listen(3005, () => {
  console.log(`Server is running on http://localhost:${3005}`);
});
