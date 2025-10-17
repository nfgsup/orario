import fs from 'fs';
import path from 'path';

const warningsFile = path.resolve('./warnings.json');

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { date, text } = req.body;
      if (!date || !text) return res.status(400).json({ error: 'Missing date or text' });

      const data = JSON.parse(fs.readFileSync(warningsFile));
      data.push({ date, text });
      fs.writeFileSync(warningsFile, JSON.stringify(data, null, 2));

      res.status(200).json({ message: 'Avvertimento aggiunto' });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
