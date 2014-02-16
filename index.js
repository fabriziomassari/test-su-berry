var http = require('http'); 
var gpio = require("gpio");
var gpio23, stato = 'OFF';

var off = function(a) {
	gpio23 = gpio.export(23, {
	   direction: 'out',
	   interval: 200,
	   ready: function() {
		gpio23.reset();
		if (a){
			console.log("Port 23 set to " + gpio23.value);    // should log 0
		}		
	   }
	});		 
}

setTimeout(function(){off();},1000);
setTimeout(function(){off();},1200);

http.createServer(function (request,response) { 

//	console.log(request.url);	

	response.writeHead(200, {'Content-Type': 'text/html'}); 

	if (request.url == "/on" && stato == 'OFF'){
		stato = 'ON';
		console.log("Request ON");
		gpio23 = gpio.export(23, {
		   direction: 'out',
		   interval: 200,
		   ready: function() {
			gpio23.reset();
			gpio23.set(1,function() {
			   console.log("Port 23 set to " + gpio23.value);    // should log 1
			   gpio23.unexport();			   
			});			
		   }
		});
	}
	else if (request.url == "/off") {
		stato = 'OFF';
		console.log("Request OFF");
		off();
		setTimeout(function(){off(true);},200);
	}
	
	response.write('<h1>Stato: ' + stato + '</h1>');
	response.end('<center><br><a href="/on"><IMG src="http://static2.wikia.nocookie.net/__cb20130828083719/theamazingworldofgumball/images/8/81/Power_button.png"></a><br><br><a href="/off"><img src="http://blog.anttix.org/wp-content/uploads/2011/11/off.png"></a></center>'); 

}).listen(8000) 
console.log("Web Server running at http://127.0.0.1:8000") 