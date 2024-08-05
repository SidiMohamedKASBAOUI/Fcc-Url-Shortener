require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
let bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL);




// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});
//body parser
app.use(bodyParser.urlencoded({extended: false}))

let urlSchema  = new mongoose.Schema({
  urlString: {
        type : String,
        required: true
  },
  urlNumber: Number,
  
});
let Address;
Address = mongoose.model('Address', urlSchema); 
var google = new Address({
  urlString:'https://www.google.com',
  urlNumber:1,
});
google.save();
const urlRegex = /^(http:\/\/|https:\/\/)[^\s$.?#].[^\s]*$/i;

// Post shorturl

app.post('/api/shorturl', async (req, res)=>{

  const { url } = req.body;
   //console.log(req.body);
   if(!url || !urlRegex.test(url)){
    res.json({"error":"invalid url"})
    return;
  }
  try{
  const Insert = await findOrCreateAndUpdate(url);
  res.json({"original_url":Insert.urlString, "short_url":Insert.urlNumber})
}catch(err){
  res.status(500).json({ "error": "Internal Server Error" });
}
})
// Create new path /api/shorturl/:short_url
app.get('/api/shorturl/:short_url', async (req, res) => {
  const { short_url } = req.params;

  try {
    const data = await Address.findOne({ urlNumber: short_url });
    
    if (data) {
      res.redirect(data.urlString);
    } else {
      res.status(404).json({ "error": "No short URL found for this short_url" });
    }
  } catch (err) {
    res.status(500).json({ "error": "Internal Server Error" });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

async function findOrCreateAndUpdate(url) {
  try {
    // Check if the document with the given urlString already exists
    let data = await Address.findOne({ urlString: url });

    if (data) {
      // If found, return the existing document
      return data;
    } else {
      // If not found, find the highest urlNumber
      const lastEntry = await Address.findOne().sort('-urlNumber').exec();

      // Determine the new urlNumber
      const newNumber = lastEntry ? lastEntry.urlNumber + 1 : 1;
      const newAddress = new Address({
        urlString: url,
        urlNumber: newNumber
      });

      // Save the new document
      data = await newAddress.save();
      return data;
    }
  } catch (err) {
    // Handle errors by throwing them so they can be caught by the caller
    throw err;
  }
}