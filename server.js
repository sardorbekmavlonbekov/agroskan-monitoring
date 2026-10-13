// Lokal ishga tushirish uchun (npm run dev / npm start)
const app = require('./app');

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`AgroScan server ${PORT}-portda ishlayapti`));
}

module.exports = app;
