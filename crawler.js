console.log('page load');
var express = require('express');
var app = express();
var fs = require("fs");
var cors = require('cors');
app.use(cors());

var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');


// body parse thing
const bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true}));     // to support URL-encoded bodies


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Content-Type", "text/json; charset=utf-8");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Accept");
  next();
});

const server = app.listen(8095, function () {
  const host = server.address();
  const port = server.address().port;
  // 82.31.145.132
  console.log("TurdServer listening at http://localhost:" + port);
  console.log("TurdServer listening at http://127.0.0.1:" +  port);

});

var START_URL = "http://denofgeekus.vm.didev.co.uk/";
var MAX_PAGES_TO_VISIT = 1;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;


//pagesToVisit.push(START_URL);

app.get('/getData', function (req, res) {

  // incoming queryString

  const webAddress = req.query.webAddress;
  const pageCount = req.query.pageCount;
  pagesToVisit.push(webAddress);
  //let data = crawl();

  console.log('webAddress', webAddress, pagesToVisit);
  console.log('pagesToVisit',  pagesToVisit);


   const data = {test: 'stuff'};
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
