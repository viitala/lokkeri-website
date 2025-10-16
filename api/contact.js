require('dotenv').config();
const express = require('express');
const mailjet = require('node-mailjet');

const app = express();
const port = process.env.PORT || 3000;

// API-avaimet
const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

// Tarkista avaimet
console.log('🔍 Tarkistetaan API-avaimet...');
if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY || !FROM_EMAIL) {
  console.error('❌ Virhe: Mailjet API-avaimet puuttuvat .env-tiedostosta');
  console.error('Tarkista .env tiedosto:');
  console.error('- MAILJET_API_KEY');
  console.error('- MAILJET_SECRET_KEY'); 
  console.error('- FROM_EMAIL');
  process.exit(1);
}
console.log('✅ API-avaimet löytyivät');

const client = mailjet.apiConnect(MAILJET_API_KEY, MAILJET_SECRET_KEY);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API toimii!', timestamp: new Date() });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    console.log('📩 Saapuva lomake:', { name, email });
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Kaikki kentät pakollisia' });
    }

    const request = await client
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [{
          From: { Email: FROM_EMAIL, Name: 'Lokkero Contact' },
          To: [{ Email: FROM_EMAIL }],
          Subject: `Yhteydenotto Lokkerista: ${name}`,
          TextPart: `Uusi yhteydenotto:\n\nNimi: ${name}\nSähköposti: ${email}\nViesti:\n${message}`
        }]
      });

    console.log('📧 Mailjet vastaus:', request.body);

    if (request.body.Messages[0].Status === 'success') {
      res.json({ success: true, message: 'Viesti lähetetty!' });
    } else {
      throw new Error('Mailjet error: ' + request.body.Messages[0].Errors);
    }
  } catch (error) {
    console.error('❌ Virhe:', error.message);
    res.status(500).json({ error: 'Lähetys epäonnistui' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server käynnissä: http://localhost:${port}`);
  console.log(`🧪 Testaa selaimella: http://localhost:${port}/api/test`);
  console.log(`📧 Testaa lomake: curl -X POST http://localhost:${port}/api/contact -H "Content-Type: application/json" -d '{"name":"Testi","email":"test@example.com","message":"Hei maailma"}'`);
});