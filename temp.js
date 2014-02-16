var sensor = require('ds18x20');
/*
sensor.isDriverLoaded(function (err, isLoaded) {
    console.log(isLoaded);
});

sensor.loadDriver(function (err) {
    if (err) console.log('something went wrong loading the driver:', err)
    else console.log('driver is loaded');
});

sensor.list(function (err, listOfDeviceIds) {
	for (var i = 0; i < listOfDeviceIds.length; i++) {
		console.log(listOfDeviceIds[i]);
		//Do something
	}
    //console.log(listOfDeviceIds);
});

sensor.getAll(function (err, tempObj) {
	
   for (var prop in tempObj) {
	  // important check that this is objects own property 
	  // not from prototype prop inherited
	  //if(tempObj.hasOwnProperty(prop)){
		console.log(prop + " = " + tempObj[prop]);
	  //}
   }
	
    console.log(tempObj);
});
*/

var SENSORE = {

	loaded: false,
	temp: -1000,
	
	init: function (callback){
		loaded = false;
		sensor.isDriverLoaded(function (err, isLoaded) {
			if (err) console.log('something went wrong asking the driver:', err)
			else {
				if (isLoaded){
					///console.log('driver is already loaded');
					loaded = true;					
					if (callback) callback(true);
				}
				else{
					sensor.loadDriver(function (err) {
						if (err) console.log('something went wrong loading the TEMP driver:', err)
						else {
							///console.log('driver is just loaded');
							loaded = true;							
							if (callback) callback(true);
						}
					});
				}				
			}			
		});		
	},
	
	getTemp: function (callback) {
		if (loaded) {
			sensor.getAll(function (err, tempObj) {		
				if (err) console.log('something went wrong getting temperature:', err)
				else {
					//console.log(tempObj);
					for (var prop in tempObj) {
						///console.log(prop + " = " + tempObj[prop]);
						temp = tempObj[prop];
					}				
					//console.log(tempObj);
					///console.log("Temperature acquired");
					if (callback) callback(true,temp);
				}
			});
		}
		else{
			console.log("TEMP Driver not loaded");
			if (callback) callback(false,0);
		}
    }
};

module.exports = SENSORE;