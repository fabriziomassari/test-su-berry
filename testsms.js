var sms = require('./smsfa.js');
var models = require('./models.js');
var http = require('http'); 
var gpio = require("gpio");
var fs = require('fs');
var dirty = require('dirty');
//var argv = require('optimist').argv;
var _ = require('underscore');

var gpio23, stato = 'OFF';
var runDir = process.cwd();

var noArgs = true;

console.log("Read configuration from " + runDir + '/config.js');

try {
    var config = require(runDir + '/config');
} catch (e) {
    throw "No configuration file found. Missing \'config.js\'";
}

var db = dirty(runDir + '/messages.db');
var nl = (process.platform === 'win32' ? '\r\n' : '\n');

storedMessages = new models.Messages();

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

db.on('load', function() {	
	storedMessages = new models.Messages(db.get('messages') || []);
	
	/* opzioni a linea di comando
    if (argv.reset) {
	
        // RESET STORAGE
		console.log("Reset Storage"); 

        if (argv.reset =='messages') {
            db.set("messages", []);
        } else {
            db.set("messages", []);            
        }
		
    } else if (argv.read) {

		// READ DATASOURCE
		console.log("Read Database"); 

		//process.stdout.write(JSON.stringify(db.get('messages')));
		process.stdout.write(JSON.stringify(storedMessages.toJSON()));
		
	} else if (argv.send) {

		// SEND MESSAGE
		console.log("Send Test Message"); 
		
		// this is a workaround for bug in optimist, please give phone numbers by a leading plus sign including country code
		var to = new String(argv.to);
		to = (to.indexOf('+') !== 0) ? '+' + to : to;

		sms.send({
			to: to || '',
			text: argv.message || ''
		}, function messageSent (response) {
			// message sent
		});
		
	} else {
	*/
        // WATCH MESSAGE INPUT AND NOTIFY REGISTERED LISTENER ON UPDATES
		getMessagesFromGateway();		
	/*}*/
});

function processNewCommands() {
	//console.log('ecco il timeout');
	var dbModificato = false;
	var comandoEseguito = false;
	for (var i=storedMessages.length-1; i >= 0; i--) {
		var mess = storedMessages.models[i].attributes;		
		if (mess.status == 'UnRead'){
			//console.log(mess.message.substring(0, 5).toUpperCase() + "->" + mess.status + "<-");
			if (!comandoEseguito){ // esegue solo l'ultimo comando NUOVO arrivato, gli altri li ignora
				if (mess.message.substring(0, 5).toUpperCase() == 'ECHO '){
					console.log("Nuovo comando: ->" + mess.message + "<- da " + mess.phoneNumber);								
					var numero = mess.phoneNumber;
					var testo = mess.message.substring(5);
					sms.send({
							to: numero,    	
							text: testo     
						},function(response){
							console.log('Comando ECHO eseguito: ' + response);
						});
					comandoEseguito = true;
				}
			}
			//cambiare lo status del mesaggio da UnRead a Read una volta eseguito il comando
			mess.status = 'Read'; 
			dbModificato = true;
		}
	}
	if (dbModificato) {
		db.set("messages", storedMessages.toJSON(),function(){
			console.log('db Saved');
		});
	}
}

function getMessagesFromGateway () {
	//console.log("checking new messages each 30 seconds...");
	renderMessages(function(updatesFound){
		if (updatesFound) {
			console.log("storing new messages...");
			//console.log(storedMessages.toJSON());
			db.set("messages", storedMessages.toJSON(), function messagesSaved (){
                console.log("new messages stored...");
				sms.deletesms(function(){
					console.log("new messages Deleted...");
					//setTimeout(processNewCommands, 1000);
					processNewCommands();
				});
					
			});
		}
		setTimeout(getMessagesFromGateway, config.timeout);
	});		
}

function renderMessages (callback) {

	var getMessagesCallback = function(response){

		var pattern = config.patterns[config.patternLang];

		var headers = new RegExp(pattern.messageSeparator,'g');
		var matcher = response.match(headers);
		var updatesFound = false;
		if (matcher) {
			for (var i=0; i<matcher.length; i++) {
				var message = {};

				// get header

				var header = new RegExp(pattern.messageSeparator,'g');
				header.exec(matcher[i]); //console.log(RegExp.$2);
				for (var index in pattern.separatorAttributes) {
					var attribute = pattern.separatorAttributes[index];
					var idx = new Number(index) + 1;
					message[attribute] = RegExp['$'+idx];
				}

				// get body

				var msgextract = response.split(matcher[i]);
				if (matcher[i+1]) {
					msgextract = msgextract[1].split(matcher[i+1]);
					msgextract = msgextract[0];
				} else {
					msgextract = msgextract[1];
				}

				var messageExp = new RegExp(pattern.bodyDefinition.replace(/\\r\\n/g,nl),'g');
				messageExp.exec(msgextract);
				for (var index in pattern.bodyAttributes) {
					var attribute = pattern.bodyAttributes[index];
					var idx = new Number(index) + 1;
					message[attribute] = RegExp['$'+idx];
				}
				message.hash = encode(message.sendDateStr + message.phoneNumber + 'sms');

				var matchingMessages = storedMessages.where({hash: message.hash});
				if (_.isEmpty(matchingMessages)) {
					updatesFound = true;					
					storedMessages.add(message);
				}
			}
		}

		if (callback) {
			callback(updatesFound);
		}
		
		/*
		for (var i=0; i < storedMessages.length; i++) {
			var mess = storedMessages.models[i].attributes;
			console.log(mess.status + " message from " + mess.phoneNumber + ": " + mess.message);
		}
		*/
		
		
		/*
		storedMessages.forEach(function(key, val) { 		
			console.log('Found key: %s, val: %j', key, val); 
			console.log(key.message);
		});
		*/
		
		
	};

	sms.getsms(getMessagesCallback);	
}

function encode (txt) {
    return new Buffer(txt).toString('base64');
}

function decode (txt) {
    return new Buffer(txt, 'base64').toString('utf8');
}

//if (argv.reset || argv.read || argv.send) {noArgs = false;}

if (noArgs) {
	http.createServer(function (request,response) { 

		//console.log(request.url);	
		
		var altro = "";
		
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
		else if (request.url == "/read") {
			console.log("Request READ");
			
			for (var i=0; i < storedMessages.length; i++) {
				var mess = storedMessages.models[i].attributes;		
				altro += "<br><h3>";
				altro += " Date: " + mess.sendDateStr + "";
				altro += " - Number: " + mess.phoneNumber + "";
				altro += " - Message: " +  mess.message + "</h3>";													
			}
			
			/*
			sms.getsms(function(result){
				fs.writeFile('last Read result.txt', result, function (err) {
				  if (err) return console.log('Errore writeFile: ' + err);
				  console.log('Dati scritti in \'last Read result.txt\'');
				});
				//console.log('\tResult READ: \r\n' + result);
			});
			*/
		}
		/*
		else if (request.url == "/send") {
			console.log("Request SEND");
			sms.send({
				to: '+393409394072',       	// Recipient Phone Number, lead by +49...
				text: 'Messaggio da NODEJS!'    // Text to send
			}, function(result) {			
				console.log('\tResult SEND: \r\n' + result);
			});				
		}
		*/
		if (stato == 'ON'){
			//response.write('<h1>Stato: <IMG src="http://static2.wikia.nocookie.net/__cb20130828083719/theamazingworldofgumball/images/8/81/Power_button.png" width=32px>&nbsp;&nbsp;&nbsp;&nbsp;<a href="/read">Read</h1></a><hr>');
			response.write('<h1>Stato: <IMG src="http://setiquest.org/wiki/images/thumb/0/06/Light_bulb.png/285px-Light_bulb.png" height=32px>&nbsp;&nbsp;&nbsp;&nbsp;<a href="/read">Read</h1></a><hr>');
		}
		else{
			//response.write('<h1>Stato: <IMG src="http://blog.anttix.org/wp-content/uploads/2011/11/off.png" width=32px>&nbsp;&nbsp;&nbsp;&nbsp;<a href="/read">Read</h1></a><hr>');
			response.write('<h1>Stato: <IMG src="http://www.clker.com/cliparts/6/3/c/1/1197103478642310320webmichl_light_bulb.svg.hi.png" height=32px>&nbsp;&nbsp;&nbsp;&nbsp;<a href="/read">Read</h1></a><hr>');
		}
		response.write('<center><br><a href="/on"><IMG src="http://static2.wikia.nocookie.net/__cb20130828083719/theamazingworldofgumball/images/8/81/Power_button.png" width=128px></a><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><a href="/off"><img src="http://blog.anttix.org/wp-content/uploads/2011/11/off.png" width=128px></a></center>'); 
		response.write('<br><br><hr><h2>' + altro + '</h2>');
		response.end();

	}).listen(8000) 
	console.log("Web Server running at http://127.0.0.1:8000") 	
} else {
	console.log("Execution ends by Args") 
}


