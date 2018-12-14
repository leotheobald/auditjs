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

  const url = req.query.url;
  const limit = req.query.limit;
  console.log('server Recieved: query=', req.query);
  // TODO check they re valid!

  // pass res in so we can res.end and send the data after async call to the page
  api.getPage(url, limit, res);
   //res.end(JSON.stringify(out)); // not deeded anymore we call it after the async call
});

let api = {
  getPage: (url, limit, res) => {
    request(url, function(error, response, body) {
      if(response && response.statusCode === 200) {
       const $ = cheerio.load(body);
       let links = api.getLinks($);
       let scripts = api.getScripts($);
       let out = {links: links, scripts: scripts, errors: []};
       console.log('OK 200: sending: links=', links.length + ' scripts=' + scripts.length);
       res.end(JSON.stringify(out));
     } else {
       console.log('getPage Error not 200', error);
       let response = {
         errors: [error, url, 'api.getpage'],
         links: [],
         scripts: []
       };
       res.end(JSON.stringify(response));
     }
    });
  },
  getLinks: ($) => {
    const relativeLinks = $("a[href^='/']");
    let pagesToVisit = [];
    relativeLinks.each(function() {
      //console.log("Links: " + "\n" + $(this).attr('href'));
      pagesToVisit.push($(this).attr('href'));
    });
    return pagesToVisit;
  },
  getScripts: ($) => {
    const scripts =  $("script");
    let scriptLinks = [];
    scripts.each(function() {
      if($(this).attr('src')) {
        scriptLinks.push($(this).attr('src'));
      } else {
        scriptLinks.push('inline script: ' + $(this).toString().length + ' chars');
      }
    });
    return scriptLinks;
  }
};
