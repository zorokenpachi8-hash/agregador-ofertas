 const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());

// Variável para guardar as ofertas buscadas pelo robô
let ofertasGeral = [];

// Função do Robô que busca promoções
async function rasparOfertas() {
  console.log("🤖 Robô buscando novas ofertas...");
  try {
    // Busca ofertas de um agregador público / vitrine promocional
    const response = await axios.get('https://www.promobit.com.br/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const novasOfertas = [];

    // Captura os cards de produtos
    $('.element-card, article').slice(0, 10).each((i, el) => {
      const titulo = $(el).find('h3, .title, a.name').text().trim();
      const preco = $(el).find('.price, .value, span[class*="price"]').first().text().trim();
      const imagem = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      let link = $(el).find('a').attr('href');

      if (link && !link.startsWith('http')) {
        link = 'https://www.promobit.com.br' + link;
      }

      if (titulo && preco) {
        novasOfertas.push({
          titulo: titulo.substring(0, 50) + "...",
          preco: preco || "Ver preço",
          imagem: imagem || "https://via.placeholder.com/300x300?text=Sem+Imagem",
          link: link || "#"
        });
      }
    });

    if (novasOfertas.length > 0) {
      ofertasGeral = novasOfertas;
      console.log(`✅ ${novasOfertas.length} ofertas atualizadas com sucesso!`);
    }
  } catch (error) {
    console.error("Erro ao raspar ofertas:", error.message);
  }
}

// Executa o robô assim que o servidor inicia
rasparOfertas();

// O robô vai buscar novas ofertas automaticamente a cada 30 minutos
setInterval(rasparOfertas, 30 * 60 * 1000);

// Endpoint da API para o seu site frontend
app.get('/api/ofertas', (req, res) => {
  res.json(ofertasGeral);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
