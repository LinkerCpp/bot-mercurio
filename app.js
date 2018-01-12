/*
 * Esse projeto foi baseado no projeto de início rápido do facebook messenger.
 *
 * A plataforma glitch foi utilizada para cópia rápida dos arquivos originais
 * presentes no tutorial, mas podem haver alterações no código final. 
 *
 * O tutorial pode ser achado no site - https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 * Para maior consistência com a documentação original, os nomes das variáveis e das funções foram mantidas no original em inglês. 
 * Autor: Willian Amaral
 * Empresa: Mercurio Comunicação e Marketing
 * www.mercuriomkt.com
 */

require('dotenv').config()
'use strict';
// Variáveis de Ambiente 
const 
	pageToken = process.env.pageToken,
	verifyToken = process.env.verifyToken,
	privkey = process.env.privkey,
	cert = process.env.cert,
	chain = process.env.chain;



// Importar dependências e carregar o servidor http
const 
  request = require('superagent'),
  express = require('express'),
  body_parser = require('body-parser'),
  https = require('https'),
  fs = require('fs'),
  app = express().use(body_parser.json()); // cria um servidor http express

// Aceita requisilções do tipo POST no endpoint do webhook
app.post('/webhook', (req, res) => {  

  // Trata o corpo da mensagem do POST
  let body = req.body;

  // Checa se o evento é de uma assinatura na página
  if (body.object === 'page') {

    // Iterações e respostas de cada post vão aqui -PARTE PRINCIPAL DO CÓDIGO-
    body.entry.forEach(function(entry) {

      // Recebe o evento do webhook. entry.messaging é uma matriz, mas
      // só irá conter sempre um único evento, por isso seu índice está setado em 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
      
      // Recebe o PSID do remetente
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      
      // Checa se o evento é uma mensagem ou um postback
      // e passa o evento para a função apropriada
      // Mensagem: Texto enviado pelo remetente
      // Postback: Processamento feito pelo bot, com a exibição de elementos 
      // web interativos, como botões
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Retorna uma resposta 200 ok para todos os eventos
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Retorna '404 Não encontrado' se o evento não é de uma assinatura da página
    res.sendStatus(404);
  }

});

// Aceita requisições GET no endpoint do webhook
app.get('/webhook', (req, res) => {
  
  // Tratando os parâmetros da requisição
  // hub.mode - deve ser sempre "subscribe" 
  // hub.verify_token - verifica se os tokens são consistentes
  // hub.challenge - uma cadeia aleatória para transmissão
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checa se o mode e o token foram enviados
  if (mode && token) {
  
    // Checa se o mode e o token estão corretos
    if (mode === 'subscribe' && token === verifyToken) {
      
      // Responde com o 200 ok e verifica o funcionamento do webhook com o challenge
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responde com o erro 403 PROIBIDO se os valores do token forem diferentes. 
      res.sendStatus(403);      
    }
  }
});

function handleMessage(sender_psid, received_message) {
  let response;
  
  // Checa se a mensagem contém texto
  if (received_message.text) {    
    // Cria o payload para uma mensagem de texto básico
    // que será adicionada ao corpo da nossa requisição para a API de envio
    // Payload: conteúdo de uma transmissão, carga
    response = {
      "text": `Você me enviou a mensagem: "${received_message.text}". Agora me envie uma imagem!`
    }
  } else if (received_message.attachments) { // Aqui, a mensagem é um anexo, como uma imagem
    // Recebe a URL do anexo
    let attachment_url = received_message.attachments[0].payload.url;
    // Constrói a resposta com template básico, o anexo e dois botões. 
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Essa é a imagem correta?",
            "subtitle": "Aperte o botão para responder",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Sim",
                "payload": "sim",
              },
              {
                "type": "postback",
                "title": "Não",
                "payload": "nao",
              }
            ],
          }]
        }
      }
    }
  } 
  
  // Envia a mensagem de resposta
  callSendAPI(sender_psid, response);    
}

function handlePostback(sender_psid, received_postback) {
  let response;
  
  // Recebe o payload do postback. 
  let payload = received_postback.payload;

  // Define a resposta dependendo do payload do postback
  if (payload === 'sim') {
    response = { "text": "Ótimo, a funcionalidade está perfeita!" }
  } else if (payload === 'nao') {
    response = { "text": "Ops, tente enviar uma imagem diferente" }
  }
  // Envia a mensagem para reconhecer o postback
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // Constrói o corpo da mensagem (em JSON)
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  request
	.post('https://graph.facebook.com/v2.6/me/messages')
	.query({access_token: pageToken})
	.send(request_body)
	.end((err,res, body) => {
		if(!err) {
			console.log('Mensagem enviada!');
		} else {
			console.error("Incapaz de enviar mensaegem" + err);
		}
	     });
}

 https.createServer({
	key: fs.readFileSync(privkey),
	cert: fs.readFileSync(cert),
	ca: fs.readFileSync(chain)
}, app).listen(55555, function () {
	console.log('App está pronto na porta 55555');
});

