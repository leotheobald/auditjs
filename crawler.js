console.log('page load');
var express = require('express');
var app = express();
var fs = require("fs");
var cors = require('cors');
app.use(cors());

var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');


// body parse thing, dont worry it globally works when bad strings turn up
const bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true}));     // to support URL-encoded bodies

// always send all these headers from yr server, your browser will need them
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Content-Type", "text/json; charset=utf-8");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Accept");
  next();
});

// GO
//var START_URL = "http://denofgeekus.vm.didev.co.uk/";
var MAX_PAGES_TO_VISIT = 1;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
let url; // = new URL(START_URL);Fprto
//var baseUrl = url.protocol + "//" + url.hostname;

// fire up a web server
const server = app.listen(8095, function () {
  //
});

// will respond to any posts or gets to http://localhost:8095/getData
// when you call this address a json will be sent back.
// req is the url params you sent/ the res is what you send back
app.get('/getData', function (req, res) {

  // incoming queryString for getData should be ?webAddress=http://someUrl&pageCount=1
  // get the values posted in from 8082
  const webAddress = req.query.webAddress;
  const pageCount = req.query.pageCount;
  console.log('server Recieved: webAddress', webAddress, 'pageCount',  pageCount);
  // TODO check they re valid!

  // add the webAddress to list of pages to scrape
  pagesToVisit.push(webAddress);

  // get the return from the crawl() function
  let data = crawl(); // should be an object with data

  console.log('crawl data ', data);

   //data = {test: 'stuff'};
   res.end(JSON.stringify(data));
});



// Test form
//var pages = document.getElementsByName("webaddress")[0].value;
//var pagecount = document.getElementsByName("pagecount")[0].value;

//var START_URL = pages;
//var MAX_PAGES_TO_VISIT = pagecount;


//crawl();

function crawl() {
  if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
    console.log("Reached max limit of number of pages to visit.");
    return;
  }
  var nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {

    // We've already visited this page, so repeat the crawl
    crawl();
  } else {

    // New page we haven't visited
    return visitPage(nextPage, crawl);
  }
}

function visitPage(url, callback) {
  // Add page to our set
  pagesVisited[url] = true;
  numPagesVisited++;

  // Make the request
  console.log("Visiting page " + url);
  request(url, function(error, response, body) {
    // Check status code (200 is HTTP OK)
    console.log('http error', error, response);
    //onsole.log("Status code: " + response.statusCode);

    if(response && response.statusCode !== 200) {
      callback();
      return;
    }
    // Parse the document body
    var $ = cheerio.load(body);

    let pagesToVisit = collectInternalLinks($);
    let scripts = createListOfScripts($);

    // In this short program, our callback is just calling crawl()
    callback();

    return {pagesToVisit: pagesToVisit, scripts: scripts} ;
  });
}

function collectInternalLinks($) {
  var relativeLinks = $("a[href^='/']");

  //console.log("Found " + relativeLinks.length + " relative links on page");
  relativeLinks.each(function() {

    //console.log("Links: " + "\n" + $(this).attr('href'));
    pagesToVisit.push(baseUrl + $(this).attr('href'));

  });

  return pagesToVisit ;
}

// Lets collect the script tags in the current page.
function createListOfScripts($) {
  return $("script");
};
