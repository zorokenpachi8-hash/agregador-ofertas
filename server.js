const express = require('express');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Simulação / Banco temporário de ofertas
let ofertas = [
  {
    id: 1,
    titulo: "Exemplo de Oferta Flash",
    preco: "R$ 99,90",
    link: "https://amazon.com.br",
    imagem: "https://via.placeholder.com/150"
  }
];

// Rota principal para o frontend buscar as ofertas
app.get('/api/ofertas', (req, res) => {
  res.json(ofertas);
});

// Agendador (Cron Job) - Roda a cada 1 hora para sincronizar
cron.schedule('0 * * * *', () => {
  console.log('🔄 Robô sincronizando ofertas com APIs parceiras...');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor e Robô rodando na porta ${PORT}`);
});
