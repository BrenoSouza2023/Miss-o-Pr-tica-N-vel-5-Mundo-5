require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { sanitizeInput } = require('./utils/sanitizer');
const { authenticateToken, authorizeAdmin } = require('./middlewares/auth');

const app = express();
app.use(bodyParser.json());

const users = [
  { username: "user", password: "123456", id: 123, email: "user@dominio.com", perfil: "user" },
  { username: "admin", password: "123456789", id: 124, email: "admin@dominio.com", perfil: "admin" },
  { username: "colab", password: "123", id: 125, email: "colab@dominio.com", perfil: "user" }
];

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, perfil: user.perfil },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

  const token = generateToken(user);
  res.json({ token });
});

app.get('/api/users', authenticateToken, authorizeAdmin, (req, res) => {
  res.status(200).json({ data: users });
});

app.get('/api/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
  res.status(200).json({ data: user });
});

app.get('/api/contracts', authenticateToken, authorizeAdmin, (req, res) => {
  const { empresa, inicio } = req.query;

  if (!empresa || !inicio) return res.status(400).json({ message: 'Parâmetros faltando' });

  const safeEmpresa = sanitizeInput(empresa);
  const safeInicio = sanitizeInput(inicio);

  const result = [{ id: 1, empresa: safeEmpresa, data_inicio: safeInicio }];
  res.status(200).json({ data: result });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));