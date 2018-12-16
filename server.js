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
  res.header("Content-Type", "text/html; charset=utf-8");
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
// this is why css failed, it was sending content-type as html, we now respond with css for this url
app.get('/css/styles.css', function (req, res) {
  const html = fs.readFileSync('./css/styles.css');
  res.header("Content-Type", "text/css; charset=utf-8");
  res.end(html);
});

// will respond to any request to http://localhost:PORT/getData
app.get('/getData', function (req, res) {

  const url = req.query.url;  // get the ?url= you sent in
  const limit = req.query.limit; // get the ?limit= you sent in (not used right now)
  console.log('server Recieved: query=', req.query);
  // send an error if the params are missing
  if(!url || !limit) {
    const out = {links:[], scripts: [], css: [], errors:['bad request']}
    console.log('Error: query=', req.query);
    res.end(JSON.stringify(out));
  }

  // pass res in so we can res.end and send the data after async call to the page
  api.getPage(url, limit, res);
   //res.end(JSON.stringify(out)); // not deeded anymore we call it after the async call
});

// this is the programme, i called it api because i can!
// the above just responds to a url, the REST server, this is the api does the donkey work
//
let api = {
  getPage: (url, limit, res) => {
    request(url, function(error, response, body) {
      if(response && response.statusCode === 200) {
       const $ = cheerio.load(body);
       let links = api.getLinks($);
       let scripts = api.getScripts($);
       let css = api.getCss($);
       let out = {links: links, scripts: scripts, css: css, errors: []};
       console.log('OK 200: sending:', out );
       res.end(JSON.stringify(out));
     } else {
       console.log('getPage Error not 200', error);
       let response = {
         errors: [error, url, 'api.getpage'],
         links: [],
         scripts: [],
         css: []
       };
       res.end(JSON.stringify(response));
     }
    });
  },
  buildResponse: () => {

  },
  getLinks: ($) => {
    const relativeLinks = $("a[href^='/']");
    let out = [];
    relativeLinks.each(function() {
      //console.log("Links: " + "\n" + $(this).attr('href'));
      out.push($(this).attr('href'));
    });
    return out;
  },
  getScripts: ($) => {
    const scripts =  $("script");
    let out = [];
    scripts.each(function() {
      if($(this).attr('src')) {
        out.push($(this).attr('src'));
      } else {
        out.push('inline script: ' + $(this).toString().length + ' chars');
      }
    });
    return out;
  },
  getCss: ($) => {
    const css =  $("link");
    let out = [];
    css.each(function() {
      if($(this).attr('href')) {
        out.push($(this).attr('href'));
      }
    });
    return out;
  }
};
