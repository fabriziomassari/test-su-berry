var request = require('request');
var sensore = require('./temp.js');
var fs = require('fs');
var tempValue, conta = 0, key = '';

fs.writeFile('logtempverb.txt',conta.toString() + ' - '+ new Date().toString().substr(0,24) + '\r\n');
fs.writeFile('logtemp.txt','');

function readTemp(){	
	sensore.getTemp(function(done,value){
		if(done){
			var adesso = new Date();
			tempValue = value;
			conta++
			console.log(conta.toString() + ' - The temperature is: ' + tempValue + '°C');
			fs.appendFile('logtempverb.txt',conta.toString() + ' - '+ adesso.toString().substr(0,24) + ' - The temperature is: ' + tempValue + '°C\r\n');
			fs.appendFile('logtemp.txt',adesso.toString().substr(0,24) + ', ' + tempValue + '\r\n');
			request('http://extranet.telethon.it/berry/getkey.ashx', function (error, response, body) {
			  if (!error && response.statusCode == 200 && body != 'Err') {
				key = body;
				request('http://extranet.telethon.it/berry/set.ashx?k=' + key + '&t=' + tempValue + '&m=AUTO&r=AUTO&i=Roma', function (error, response, body) {
				  if (!error && response.statusCode == 200 && body == 'OK') {
					//console.log('Logged!');
				  }
				});
			  }
			});
		}
	});	
}

sensore.init(function(loaded){
	if(loaded){
		readTemp();
		setInterval(readTemp,60000-52);
	}
	else console.log('Fatal Error');
});

