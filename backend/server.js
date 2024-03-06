import express from 'express';
import mongoose from 'mongoose';
import cron from 'node-cron';
import bodyParser from 'body-parser';

const app = express();
const port = 5000;

// Configurar o Express para receber dados em JSON e urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Conectar ao banco de dados MongoDB
await mongoose.connect('mongodb://localhost:27017/comemorativas', {
  //useNewUrlParser: true,
  //useUnifiedTopology: true,
});

// Definir o modelo para as datas comemorativas
const comemorativaSchema = new mongoose.Schema({
  nome: String,
  data: Date,
  dataString: String,
});

const Comemorativa = mongoose.model('Comemorativa', comemorativaSchema);



// Tarefa agendada para buscar automaticamente as datas comemorativas diariamente
cron.schedule('0 0 * * *', async () => {
    try {
      const dataAtual = new Date();
      dataAtual.setHours(0, 0, 0, 0);
  
      const amanha = new Date(dataAtual);
      amanha.setDate(dataAtual.getDate() + 1);
  
      const datasComemorativasDoDia = await Comemorativa.find({
        data: { $gte: dataAtual, $lt: amanha },
      });
  
      console.log('Datas comemorativas do dia:', datasComemorativasDoDia);
    } catch (error) {
      console.error('Erro ao buscar datas comemorativas do dia:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo', // Substitua pelo fuso horário desejado
  });




// Rota para obter todas as datas comemorativas do dia
app.get('/datas-atuais', async (req, res) => {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
  
      const datasComemorativasDoDia = await Comemorativa.find({
        $expr: {
          $eq: [
            { $dateToString: { format: '%Y-%m-%d', date: '$data' } },
            { $dateToString: { format: '%Y-%m-%d', date: hoje } },
          ],
        },
      });
  
      res.json(datasComemorativasDoDia);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar datas comemorativas do dia.' });
    }
  });
  




  app.post('/datas', async (req, res) => {
    const { nome, data } = req.body;
  
    if (!nome || !data) {
      return res.status(400).json({ error: 'Nome, data e tipo são obrigatórios.' });
    }
  
    try {
      const novaComemorativa = new Comemorativa({ nome, data, dataString: data.toISOString().split('T')[0] });
      await novaComemorativa.save();
      res.status(201).json(novaComemorativa);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao adicionar nova data comemorativa.' });
    }
  });


// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});