const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// AGGIUNGI QUESTO PER CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // permette qualsiasi origine
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200); // preflight
  next();
});

const GITHUB_USER = 'TUO_USER';
const REPO = 'TUO_REPO';
const BRANCH = 'main';
const FILE_PATH = 'warnings.json';
const TOKEN = process.env.GITHUB_TOKEN;

app.post('/add-warning', async (req,res)=>{
  const { date, text } = req.body;
  if(!date || !text) return res.status(400).json({error:'date e text richiesti'});

  try{
    const getFile = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,{
      headers:{'Authorization':'token '+TOKEN,'Accept':'application/vnd.github.v3+json'}
    });
    const data = await getFile.json();
    const oldWarnings = JSON.parse(Buffer.from(data.content,'base64').toString('utf-8'));
    oldWarnings.push({date,text});
    const newContent = Buffer.from(JSON.stringify(oldWarnings,null,2)).toString('base64');

    const putFile = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO}/contents/${FILE_PATH}`,{
      method:'PUT',
      headers:{'Authorization':'token '+TOKEN,'Accept':'application/vnd.github.v3+json'},
      body: JSON.stringify({
        message: `Aggiunto avvertimento ${date} - ${text}`,
        content: newContent,
        sha: data.sha,
        branch: BRANCH
      })
    });
    const result = await putFile.json();
    res.json(result);
  }catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server in ascolto su port ${PORT}`));
