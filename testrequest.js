var request = require('request');
request('http://extranet.telethon.it/berry/getkey.ashx', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log('->'+body+'<-') // Print the google web page.
  }
})