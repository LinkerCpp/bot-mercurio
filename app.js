/*
 * Esse projeto foi baseado no projeto de início rápido do facebook messenger.
 *
 * A plataforma glitch foi utilizada para cópia rápida dos arquivos originais
 * presentes no tutorial, mas podem haver alterações no código final. 
 *
 * O tutorial pode ser achado no site - https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 * Para maior consistência com a documentação original, os nomes das variáveis e das funções foram mantidas no original em inglês. 
 * Autor: Willian Amaral
 */

  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

'use strict';

// Importar dependências e carregar o servidor http
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // cria um servidor http express

// Configura as portas do servidor e exibe mensagem caso bem sucedido
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Aceita requisilções do tipo POST no endpoint do webhook
app.post('/webhook', (req, res) => {  

  // Trata o corpo da mensagem do POST
  let body = req.body;

  // Checa se o evento é de uma assinatura na página
  if (body.object === 'page') {

    // Iterações e respostas de cada post vão aqui -PARTE PRINCIPAL DO CÓDIGO-
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
      
      //Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

function handleMessage(sender_psid, received_message) {
  let response;
  
  // Checks if the message contains text
  if (received_message.text) {    
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    response = {
      "text": `Você me enviou a mensagem: "${received_message.text}". Agora me envie uma imagem!`
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
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
  
  // Send the response message
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

  // Envia a requisição HTTP para a plataforma do messenger
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

// Aceita requisições GET no endpoint do webhook
app.get('/webhook', (req, res) => {
  
  /** Token de Verificação do bot - é utilizado na plataforma
  de aplicativos do facebook **/
  const VERIFY_TOKEN = "arcoiris123";
  
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
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responde com o 200 ok e verifica o funcionamento do webhook com o challenge
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responde com o erro 403 PROIBIDO se os valores do token forem diferentes. 
      res.sendStatus(403);      
    }
  }
});