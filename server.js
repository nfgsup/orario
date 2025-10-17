const express = require('express');
const fetch = require('node-fetch'); // se node <18 installa: npm i node-fetch
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const GITHUB_USER = 'TUO_USER';       // metti il tuo user GitHub
const REPO = 'TUO_REPO';              // metti il repo dove c'è warnings.json
const BRANCH = 'main';
const FILE_PATH = 'warnings.json';
const TOKEN = process.env.GITHUB_TOKEN; // token messo come variabile d'ambiente su Vercel

app.post('/add-warning', async (req,res)=>{
  const { date, text } = req.body;
  if(!date || !text) return res.status(400).json({error:'date e text richiesti'});

  try{
    // prendi il file attuale
    const getFile = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,{
      headers:{'Authorization': 'token '+TOKEN,'Accept':'application/vnd.github.v3+json'}
    });
    const data = await getFile.json();
    const oldWarnings = JSON.parse(Buffer.from(data.content,'base64').toString('utf-8'));

    // aggiungi il nuovo warning
    oldWarnings.push({date,text});
    const newContent = Buffer.from(JSON.stringify(oldWarnings,null,2)).toString('base64');

    // PUT file aggiornato
    const putFile = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO}/contents/${FILE_PATH}`,{
      method:'PUT',
      headers:{'Authorization': 'token '+TOKEN,'Accept':'application/vnd.github.v3+json'},
      body: JSON.stringify({
        message: `Aggiunto avvertimento ${date} - ${text}`,
        content: newContent,
        sha: data.sha,
        branch: BRANCH
      })
    });
    const result = await putFile.json();
    res.json(result);
  }catch(e){
    console.error(e);
    res.status(500).json({error:e.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server in ascolto su port ${PORT}`));
