var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');

// Test form 
//var pages = document.getElementsByName("webaddress")[0].value;
//var pagecount = document.getElementsByName("pagecount")[0].value;

//var START_URL = pages;
//var MAX_PAGES_TO_VISIT = pagecount;

var START_URL = "http://denofgeekus.vm.didev.co.uk/";
var MAX_PAGES_TO_VISIT = 1;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;

pagesToVisit.push(START_URL);
crawl();

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
    visitPage(nextPage, crawl);
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
    console.log("Status code: " + response.statusCode);

    if(response.statusCode !== 200) {
      callback();
      return;
    }
    // Parse the document body
    var $ = cheerio.load(body);

    collectInternalLinks($);
    createListOfScripts($);

    // In this short program, our callback is just calling crawl()
    callback();
  });
}

function collectInternalLinks($) {
  var relativeLinks = $("a[href^='/']");

  //console.log("Found " + relativeLinks.length + " relative links on page");
  relativeLinks.each(function() {

    //console.log("Links: " + "\n" + $(this).attr('href'));
    pagesToVisit.push(baseUrl + $(this).attr('href'));
  });
}

// Lets collect the script tags in the current page.
function createListOfScripts($) {
  var scriptTags = $("script");
  console.log("Found " + scriptTags.length + " script tags on page");
  
  scriptTags.each(function() {

    console.log("Scripts: " + "\n" + $(this));
    //pagesToVisit.push($(this).attr('src'));
  });
}

