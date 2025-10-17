import fs from 'fs';
import path from 'path';

const warningsFile = path.join(process.cwd(), 'warnings.json');

export default function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*'); // puoi mettere anche 'https://nfgsup.github.io'
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // <--- importante

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const { date, text } = req.body;
      if (!date || !text) return res.status(400).json({ error: 'Missing date or text' });

      const data = fs.existsSync(warningsFile) ? JSON.parse(fs.readFileSync(warningsFile, 'utf-8')) : [];
      data.push({ date, text });
      fs.writeFileSync(warningsFile, JSON.stringify(data, null, 2));

      res.status(200).json({ message: 'Avvertimento aggiunto' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'GET') {
    let data = fs.existsSync(warningsFile) ? JSON.parse(fs.readFileSync(warningsFile, 'utf-8')) : [];
    res.status(200).json(data);
  } else {
    res.setHeader('Allow', ['GET','POST','OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
