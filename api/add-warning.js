import fs from 'fs';
import path from 'path';

const warningsFile = path.join(process.cwd(), 'warnings.json');

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if(req.method === 'OPTIONS') return res.status(200).end();

  if(req.method === 'GET') {
    let data = [];
    if(fs.existsSync(warningsFile)) {
      data = JSON.parse(fs.readFileSync(warningsFile, 'utf-8'));
    }
    res.status(200).json(data);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
