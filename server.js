/*
A complete single server solution
Its a single REST server that delivers the index.html and any json

All output including index.html is sent from the REST server on 8082
the rest server output depends on the request url.
if the request url is /getData you get json, if it is empty you get index.html
$ node server.js

If you visit http://localhost:8082/ without any /pramaters you get index.html like before.
If click a button on the index page you will make an ajax call to the same server which returns json.


*/

const fs = require('fs');
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

const request = require('request');
const cheerio = require('cheerio');
const URL = require('url-parse');
const PORT = 8082;

// body parse thing, dont worry it globally works when bad strings turn up
const bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true}));     // to support URL-encoded bodies

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Content-Type", "text/json; charset=utf-8");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Accept");
  next();
});
const server = app.listen(PORT, function () {
  console.log('Rest server running on port: ', PORT);
});

// will respond to any request to http://localhost:PORT/
// spits out the index page
app.get('/', function (req, res) {
  const html = fs.readFileSync('./index.html');
  res.header("Content-Type", "text/html; charset=utf-8");
  res.end(html);
});

// will respond to any request to http://localhost:PORT/getData?url=https://www.ibm.com&limit=3
app.get('/getData', function (req, res) {

  const webAddress = req.query.url;
  const pageCount = req.query.limit;
  console.log('server Recieved: query=', req.query);
  // TODO check they re valid!

  const html = api.getPage(webAddress);
  let errors = [];
  let scripts = [];
  let links = [];
  //console.log('html', html);

  // Parse the document body
  //var $ = cheerio.load(html);

  // add the webAddress to list of pages to scrape
  //pagesToVisit.push(webAddress);

  // get the return from the crawl() function
  //let data = crawl(); // should be an object with data

  //console.log('crawl data ', data);
  // build a consistant json to send back
  let out = {
    errors: errors
    query: req.query,
    links: {},
    scripts: {},
    html: html
  };

   res.end(JSON.stringify(out));
});



let api = {
  getPage: (url) => {
    request(url, function(error, response, body) {
      console.log('getPage response', error, response.statusCode);

      if(response && response.statusCode === 200) {
       const $ = cheerio.load(body);
       let links = api.getLinks($);
     } else {
        console.log('Error not 200', error);
     }
    });
  },
  getLinks: ($) => {
    const relativeLinks = $("a[href^='/']");
    let pagesToVisit = [];
    relativeLinks.each(function() {
      //console.log("Links: " + "\n" + $(this).attr('href'));
      // make a distinct list - no duplicates
      pagesToVisit.push({$(this).attr('href'): $(this).attr('href')});
    });
    return pagesToVisit;
  },
  getScripts: ($) => {
    const scripts =  $("script");
    let scriptLinks = [];
    scripts.each(function() {
      // make a distinct list - no duplicates
      scriptLinks.push({$(this).attr('src'): $(this).attr('src')});
    });
    return scriptLinks;

  };

};
