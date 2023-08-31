require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3333;

app.use(cors());

// SERVE UP STATIC FILES (ie. css styling)
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .catch(error => console.error.bind(console, 'connection error on connect:'));
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

let UrlDb;
db.once('open', async function() {
  console.log("Connection Successful!");

  const UrlSchema = new mongoose.Schema({
    url: String,
    shortUrl: Number
  });
  UrlDb = mongoose.model('Url', UrlSchema, 'url-shortener');
  // const defaultEntry = new UrlDb({
  //   url: 'https://www.google.com/',
  //   shortUrl: 0
  // });
  // await defaultEntry.save();
  await UrlDb.findOneAndUpdate({ shortUrl: 0 },
    {
      $setOnInsert: {
        url: 'https://www.google.com/',
        shortUrl: 0,
      },
    },
    {
      returnOriginal: false,
      upsert: true,
    }
  );
});


async function shortenURL(currUrl) {
  let maxDocument = await UrlDb.find({}, {"shortUrl": 1}).sort({shortUrl: -1}).limit(1).exec();
  const maxValue = maxDocument[0].shortUrl;
  console.log("maxShortUrl: %s", maxValue);

  return UrlDb.findOneAndUpdate({ url: currUrl },
    {
      $setOnInsert: {
        url: currUrl,
        shortUrl: maxValue + 1,
      },
    },
    {
      returnOriginal: false,
      upsert: true,
    }
  );
};

function checkIfShortIdExists (shortenedUrl) {
  return UrlDb.findOne({ shortUrl: shortenedUrl });
}

app.get('/', function(req, res) {
  const htmlPath = path.join(__dirname, 'views', 'index.html');
  res.sendFile(htmlPath);
});

app.post('/api/shorturl', async function(req, res) {
  let longUrl;
  try {
    longUrl = new URL(req.body.url);
  } catch (err) {
    return res.status(400).send({ error: 'invalid URL' });
  }

  dns.lookup(longUrl.hostname, (err) => {
    if (err) {
      return res.status(404).send({ error: 'Address not found' });
    };

    shortenURL(longUrl.href)
      .then(result => {
        console.log(result);
        res.json({
          url: result.url,
          shortUrl: result.shortUrl,
        });
      })
      .catch(console.error);
  });
});


app.get('/api/shorturl/:shortUrl', (req, res) => {
  const shortUrl = req.params.shortUrl;
  console.log(shortUrl);

  checkIfShortIdExists(shortUrl)
    .then(doc => {
      if (doc === null) return res.send('Uh oh. We could not find a link at that URL');

      res.redirect(doc.url)
    })
    .catch(console.error);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// https://www.freecodecamp.org/