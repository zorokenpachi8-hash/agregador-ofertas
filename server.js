const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

// Ofertas padrão de reserva (para a tela nunca ficar vazia)
let ofertasGeral = [
  {
    titulo: "Smartphone Samsung Galaxy A54 5G 128GB",
    preco: "R$ 1.699,00",
    imagem: "https://m.media-amazon.com/images/I/61U6oC65TTL._AC_SL1000_.jpg",
    link: "https://www.amazon.com.br"
  },
  {
    titulo: "Fone de Ouvido Bluetooth Sem Fio TWS",
    preco: "R$ 89,90",
    imagem: "https://m.media-amazon.com/images/I/51tr30S-38L._AC_SL1000_.jpg",
    link: "https://shopee.com.br"
  }
];

// Função do Robô que busca promoções
async function rasparOfertas() {
  console.log("🤖 Robô buscando novas ofertas...");
  try {
    const response = await axios.get('https://www.promobit.com.br/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      },
      timeout: 8000
    });

    const $ = cheerio.load(response.data);
    const novasOfertas = [];

    $('article, .element-card').slice(0, 10).each((i, el) => {
      const titulo = $(el).find('h3, .title, a.name').text().trim();
      const preco = $(el).find('.price, .value, span[class*="price"]').first().text().trim();
      let imagem = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      let link = $(el).find('a').attr('href');

      if (link && !link.startsWith('http')) {
        link = 'https://www.promobit.com.br' + link;
      }

      if (titulo && preco) {
        novasOfertas.push({
          titulo: titulo.substring(0, 45) + "...",
          preco: preco,
          imagem: imagem || "https://via.placeholder.com/300x300?text=Produto",
          link: link || "#"
        });
      }
    });

    if (novasOfertas.length > 0) {
      ofertasGeral = novasOfertas;
      console.log(`✅ ${novasOfertas.length} ofertas atualizadas!`);
    }
  } catch (error) {
    console.error("Erro no robô, mantendo ofertas atuais:", error.message);
  }
}

// Executa a busca ao iniciar
rasparOfertas();

// Atualiza a cada 30 minutos
setInterval(rasparOfertas, 30 * 60 * 1000);

app.get('/api/ofertas', (req, res) => {
  res.json(ofertasGeral);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
