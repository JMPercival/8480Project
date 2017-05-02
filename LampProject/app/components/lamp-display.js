import Ember from 'ember';

export default Ember.Component.extend({
	metawearConnected: false,
	macAddressOfBoard: 'DA:88:BB:64:7B:CB',
	MWaccelHistory: [],
	activeData: [],
	timeStacks: [],
	activityPresent: 0,
	getRequestSent: 0,
	timeActivated: 0,
	init: function(){
		this._super();
		var component = this;
		this.get('runCheck')(component);
	},
	runCheck: function(component){
		Ember.run.later(function(){
			//the get request url after conditions have been met
			var theUrl = "http://10.12.16.146:8000/";
			var get_request_sent = component.get('getRequestSent');
			var activity_present = component.get('activityPresent');
			var active_data = component.get('activeData');
			var cur_date = new Date();
			var temp_time = cur_date.getTime();

			//sends the on request if we see activity present
			//and the on request has not been sent yet
			if(get_request_sent == 0 && activity_present == 1){
				var xmlHttp = new XMLHttpRequest();
				//Not asynchronous because at this point
				//our objective has been achieved if this sends
				xmlHttp.open( "GET", theUrl+"on", false ); // false for synchronous request
				xmlHttp.send( null );
				console.log("On Request Sent to:" + theUrl + "on");
				//can use this if we want it later
				//var response_recieved = xmlHttp.responseText;	
				active_data.addObjects([
					{"time":new Date(temp_time-1),"value":0},
					{"time":new Date(temp_time),"value":1}
				]);
				get_request_sent = 1;
				component.set("getRequestSent", get_request_sent);
				component.set("timeActivated", Date.now());
			}
			//sends the off request if 60 seconds have passed without activity
			//otherwise, resets the counter
			if(get_request_sent==1)
			{
				var current_time = Date.now();
				var time_activated = component.get("timeActivated");
				//if it has been 60 secs. since last activation
				//10 seconds for presentation
				if(current_time - time_activated >= 10000){ 
					var xmlHttp = new XMLHttpRequest();
					// false for synchronous request
					xmlHttp.open( "GET", theUrl+"off", false ); 
					xmlHttp.send( null );
					console.log("Off Request Sent to:" + theUrl + "off");
					//can use this if we want it later
					//var response_recieved = xmlHttp.responseText;
					active_data.addObjects([
						{"time":new Date(temp_time-1),"value":1},
						{"time":new Date(temp_time),"value":0}
					]);

					console.log(active_data);
					component.set("getRequestSent",0);
				}
				else{
					if(activity_present == 1){
						component.set("timeActivated", current_time);
					}
				}
				component.set("activityPresent", 0);
			}

			component.get('runCheck')(component);
		}, 1000);
	},

	updateAccelData: function(component, result){
		component.set('z', result.z);
		var current_time = Date.now();
		//update history, maintain 50 points max
		var history=component.get('MWaccelHistory');
		var time_stacks = component.get('timeStacks');
		var activity_present = component.get('activityPresent');
		//Has to be set lower than normal(.976) because
		//when the device gets warm, the noise increases
		if(result.z <= 1.008 && result.z >= 0.976){
			result.z = 1;
		}
		else{
			for(var i=time_stacks.length-1; i>=0; i--){
				if(current_time - time_stacks[i][0] <= 2000)
				{
					time_stacks[i].push(current_time);
					if(time_stacks[i].length >= 30){
						activity_present = 1;
						component.set('activityPresent',  activity_present);
						//console.log('GOT IT!!!!');
						time_stacks = [];
						break;
					}
				}
				else{
					time_stacks.pop();
				}
			}

			time_stacks.unshift([current_time]);
		}

		if(history.length === 50){
			history.shiftObject();//shift an x off
		}
		
		var newZPoint = {time: current_time, label: 'z', value: result.z};
		history.addObjects([newZPoint]);
		
/*		if(result.z != 1){
			console.log(newZPoint);
		}
*/

	},
	actions: {
		accelON: function(component){
			var component = this;
			Ember.run.later(function(){
				//wrapper to preserve binding satistfaction
				try {
				//invoke metawear connection
					console.log('attempting to start accelerometer on: ' + component.get('macAddressOfBoard'));
					metawear.mwdevice.startAccelerometer(
						function(result){ //success
							component.get('updateAccelData')(component,result);
						}, function(error){//fail
							console.log(error);
							alert('error: '+error);
						}
					);

				}
				catch(err){
					console.log('error: '+err);
					alert('error: '+err);
				}
			}, 100);//run after 100ms
		},
		accelOFF: function(){
			var component = this;
			Ember.run.later(function(){
				//wrapper to preserve binding satistfaction
				try {
				//invoke metawear connection
					console.log('attempting to stop accelerometer on: ' + component.get('macAddressOfBoard'));
					metawear.mwdevice.stopAccelerometer();
				}
				catch(err){
					console.log('error: '+err);
					alert('error: '+err);
				}
			}, 100);//run after 100ms
		},
		connect: function(){
			var component = this;
			Ember.run.later(function(){
				//wrapper to preserve binding satistfaction
				try {
				//invoke metawear connection
					console.log('attempting to connect to: ' + component.get('macAddressOfBoard'));
					metawear.mwdevice.connect(component.get('macAddressOfBoard'),
						function(){//success
							console.log('connected');
							component.set('metawearConnected', true);
						}, function(error){//failure
							console.log('connection failed' +error);
							alert('error: '+error);
						});
				}
				catch(err){
					console.log('error: '+err);
					alert('error: '+err);
				}

			}, 100);//run after 100ms
		},
		disconnect: function(){
			var component = this;
			Ember.run.later(function(){
				//wrapper to preserve binding satistfaction
				try {
				//invoke metawear connection
					console.log('Disconnecting from: ' + component.get('macAddressOfBoard'));
					metawear.mwdevice.disconnect();
					component.set('metawearConnected', false);
				}
				catch(err){
					console.log('error: '+err);
					alert('error: '+err);
				}

			}, 100);//run after 100ms
		},
	}
});
