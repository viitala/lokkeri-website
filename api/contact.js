require('dotenv').config();
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// API-avaimet
const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

// Tarkista avaimet
if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY || !FROM_EMAIL) {
  console.error('❌ Mailjet API-avaimet puuttuvat');
  process.exit(1);
}

console.log('✅ API-avaimet löytyivät');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API toimii!', timestamp: new Date() });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  console.log('📥 POST /api/contact saapui');
  console.log('📋 Request body:', req.body);
  try {
    const { name, email, message } = req.body;
    console.log('📩 Saapuva lomake:', { name, email, message });
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Kaikki kentät pakollisia' });
    }

    // Mailjet API kutsu fetch:llä (v3.1)
    const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString('base64');
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Messages: [{
          From: { Email: FROM_EMAIL, Name: 'Lokkero Contact' },
          To: [{ Email: FROM_EMAIL }],
          Subject: `Yhteydenotto Lokkerista: ${name}`,
          TextPart: `Uusi yhteydenotto:\n\nNimi: ${name}\nSähköposti: ${email}\nViesti:\n${message}`
        }]
      })
    });

    const data = await response.json();
    console.log('📧 Mailjet vastaus:', data);

    if (data.Messages && data.Messages[0].Status === 'success') {
      res.json({ success: true, message: 'Viesti lähetetty!' });
    } else {
      throw new Error('Mailjet error: ' + JSON.stringify(data.Messages[0].Errors || data.ErrorMessage));
    }
  } catch (error) {
    console.error('❌ Virhe:', error.message);
    res.status(500).json({ error: 'Lähetys epäonnistui' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server käynnissä: http://localhost:${port}`);
  console.log(`🧪 Testaa selaimella: http://localhost:${port}/api/test`);
});