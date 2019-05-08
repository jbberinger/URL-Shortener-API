'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');
var url = require("url");
var cors = require('cors');
var app = express();
var bodyParser = require('body-parser');

// Sets up MongoDB Atlas
try {
  mongoose.connect(process.env.MONGODBATLAS_URI, 
                   { useNewUrlParser: true , 
                    useCreateIndex: true, 
                    useFindAndModify: false});
} catch (error) {
  console.error(error);
}

// Stores short url with original url
let Schema = mongoose.Schema;
let shortUrlSchema = new Schema({url: {type: String, required: true},
                             shortUrl: {type: Number, required: true}});
let ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

// Counter for shorturl 
let counterSchema = new Schema({counter: {type: Number, required: true}});
let Counter = mongoose.model('Counter', counterSchema);

// Basic Configuration 
var port = process.env.PORT || 3000;
app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});

const INVALID_URL = {"error": "invalid URL"};

// Handles url shortening POST method
app.post("/api/shorturl/new", (req, res) => {
  
  const _url = req.body.url;
  console.log('url:' + _url);
  
  // Increments and returns counter promise
  const updateCounter = () => {
   return new Promise(resolve => {
        Counter.findOneAndUpdate({},{ $inc: { counter: 1 }}, {new: true}, (err, result) => {
          let counter = 0;
          if(err){
            console.error(err);
            return;
        }else{
          if(!result){
            console.log('made new counter');
            let counterDoc = new Counter({counter: 0});
            counterDoc.save((err, data) => err ? console.error(err): console.log(':' + data));
          }else{
            console.log('got counter from db');
            counter = result.counter;
          }
        }      
        resolve(counter);         
        });
    });
  }
        
  // Validates url input and returns boolean promise
  const validateUrl = () => {
    return new Promise(resolve => {
      dns.lookup(url.parse(_url).hostname, (err, address) => {
        console.log(address);
        if(address == null) {
          console.log('url failed dns lookup');
          console.error(err);
          resolve(false);
        }else{
          console.log('url is valid');
          resolve(true);
        }
      });
    });
  };
  
  // Checks database for url and returns boolean promise.
  const checkDatabase = () => {
    return new Promise(resolve => {
      ShortUrl.findOne({url: _url}, (err, result) => {
        console.log('checked db for existing url result: ' + result);
        if(result == null) {
          console.log('url is not in db');
          resolve(false);
        }else{
          console.log('url is in db');
          resolve(true);
        }
      });
    });
  }
  
  // Creates new ShortUrl document if neccessary, otherwise returns existing shortened url.
  const createShortUrl = (isInDatabase, counter) => {
    return new Promise(resolve => {
      if(!isInDatabase) {
        console.log('Since url is not in database, need to make new shortUrl document');
        let document = ShortUrl({url: _url, shortUrl: counter});
        document.save((err, data) => err ? console.error(err): console.log(data));
        resolve({url: _url, shortUrl: counter});
      }else{
        console.log('Since url is in database, return existing document');
        ShortUrl.findOne({url: _url}, (err, result) => {
          console.log('existing shortURL in database: ' + result);
          resolve({url: result.url, shortUrl: result.shortUrl});
        });
      } 
    });
  }
  
  // Displays formatted ShortUrl json object
  const displayShortUrl = (resultObj) => {
      res.json(resultObj);
  }
  
  // Manages asyncronous calls to database.
  async function go() {
    let counter = await updateCounter();
    let isValid = await validateUrl();
    let isInDatabase = await checkDatabase();
    if(isValid){
      let resultObj = await createShortUrl(isInDatabase, counter);
      await displayShortUrl(resultObj);
    }else{
      res.json(INVALID_URL);
    }
  }
  
  go();
  
});
  
// Handles redirect from shortUrl to original url.
app.get("/api/shorturl/:shortKey", (req, res) => {
  console.log('ok')
  try{
  ShortUrl.findOne({shortUrl: Number(req.params.shortKey)}, (err, result) => {
    if(result != null) {
      console.log('found: ' + result.url)
      res.redirect(result.url);
    }
  });
  }catch (error) {
    console.error('error: ' + error)
  }
});