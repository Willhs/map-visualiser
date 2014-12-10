// constructor for Event objects
function Event(type, body, time){
	this.type = type;
	this.body = body;
	this.time = time; // time that event occured at
}

// a record of an exploration of the visualisation
var record = {
	user: currentUser,
	events : [], // events that took place over the course of the exploration
	firstEventTime : null,


	addEvent : function (type, body){
		var currentTime = new Date().getTime();
		if (this.firstEventTime == null){
			this.firstEventTime = currentTime;
		}
		var timeFromFirstEvent = currentTime - this.firstEventTime;
		var event = new Event(type, body, timeFromFirstEvent);
		this.events.push(event);
	},

	getEvent : function (i){
		return this.events[i];
	},

	hasNextEvent : function (event){
		if (this.events.indexOf(event) >= this.events.length-1){
			return false;
		}
		return true;
	},

	nextEvent : function (event){
		if (!isNextEvent(event)){
			throw "there's no next events in record";
		}
		return this.events[this.events.indexOf(event) + 1];
	},

	numEvents : function(){
		return this.events.length;
	},

	isEmpty : function(){
		return this.events.length == 0;
	},

	reset : function(){
		this.events = [];
		this.firstEventTime = null;
	}
}

// handles the upload of an file containing exploration data
function handleExplorationUpload(file){
	console.log(file);
	fr = new FileReader();
	fr.onload = receivedText;
	fr.readAsText(file);
	function receivedText() {
		var fileRecord = JSON.parse(fr.result);
		// replaces properties of local record.
		record.events = fileRecord.events;
		record.firstEventTime = fileRecord.firstEventTime;

		console.log(record.numEvents() + " events add from exploration file");
	}
}

// beings recording of certain user navigation actions
function startRecording() {

	// adds event listeners which record user navigation actions
	zoom.on("zoom.record", recordMovement);

	// listeners for all events that cause scale and pan transitions
	
	// cities on the map
	var mapCities = document.getElementsByClassName("place");
	for (var i = 0; i < mapCities.length; i++){
		var city = mapCities.item(i);
		city.addEventListener("dblclick", recordTravel(getCityIndex(city.id)));
	}

	// entries in the side bar drop-down menu
	var cityEntries = document.getElementsByClassName("city-entry");
	for (var i = 0; i < cityEntries.length; i++){
		var entry = cityEntries.item(i);
		entry.addEventListener("dblclick", recordTravel(entry.value));
	}

	// go to city button
	//goToCity.addEventListener("click", recordTravel(document.getElementById('city-list').value));
	
	buttonImageConvert("record-button", "record_red.jpeg");
	buttonImageConvert("stop-button", "stop_red.jpeg");
	buttonImageConvert("reset-button","reset_red.jpeg");
	buttonImageConvert("save-exploration-button", "save_blue.jpeg");
	buttonImageConvert("play-exploration-button","play_green.jpg");
	stopExplButton.disabled = false;
	saveExplButton.disabled = false;
	playExplButton.disabled = false;
	recordExplButton.disabled = false;
	addRecordingGraphics();
}

// adds graphics to the map to show that recording is in progress.
function addRecordingGraphics(){
	//var points = [0, 0, width, height];
	var borderWidth = 10;
	var circleRadius = 20;
	var padding = 10;
	var bottomPadding = 10;
	var circleCX = borderWidth + circleRadius;
	var circleCY = borderWidth + circleRadius;

	svg.append("rect")
		.attr("id", "record-border")
		.attr("x", 0 + borderWidth/2)
		.attr("y", 0 + borderWidth/2)
		.attr("width", width - borderWidth)
		.attr("height", height - bottomPadding - borderWidth)
		.style("stroke", "red")
		.style("fill", "none")
		.style("stroke-width", borderWidth);

	svg.append('circle')
		.attr("id", "record-circle")
	    .attr('cx', circleCX)
	    .attr('cy', circleCY)
	    .attr('r', circleRadius)
	    .style('fill', 'red')
	    .transition().duration();
}

// ends recording of user navigation
function stopRecording() {	
	// removes event listeners which are recording user navigation.
	// goToCity.removeEventListener("click", recordTravel);
	zoom.on("zoom.record", null);//remove recording zoom listener
	//saveExplButton.disabled = false; // can now save recording.

	// cities on the map
	var mapCities = document.getElementsByClassName("place");
	for (var i = 0; i < mapCities.length; i++){
		var city = mapCities.item(i);
		city.removeEventListener("onclick", recordTravel(getCityIndex(city.id)));
	}

	// entries in the side bar drop-down menu
	var cityEntries = document.getElementsByClassName("city-entry");
	for (var i = 0; i < cityEntries.length; i++){
		var entry = cityEntries.item(i);
		entry.removeEventListener("dblclick", recordTravel(entry.value));
	}
	// remove recording related graphics
	d3.select("#record-border").remove();
	d3.select("#record-circle").remove();

	// Jacky's gross stuff
	buttonImageConvert("record-button", "record_gray.jpeg");
	saveExplButton.disabled = false;
	if(!record.isEmpty()){
		buttonImageConvert("save-exploration-button", "save_blue.jpeg");
		buttonImageConvert("play-exploration-button", "play_green.jpg");
		buttonImageConvert("reset-button", "reset_red.jpeg");

	}else{
		buttonImageConvert("play-exploration-button", "play_gray.jpeg");
		buttonImageConvert("save-exploration-button", "save_gray.jpeg");
		buttonImageConvert("reset-button", "reset_gray.jpeg");
	}

	console.log("Recorded/Played " + record.numEvents() + " events");
}

// records an instance of a user action to travel to a place on the map
function recordTravel(cityIndex){
	return function (){
		record.addEvent("travel", cityIndex);
	}
}

// records a user pan or zoom
function recordMovement(){
	record.addEvent("movement", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

// plays a recording of navigation events (from events array)
function playRecording(){
	if (record.numEvents() == 0) {
		return; // if no events, do nothing.
	}
	// plays all events recursively from index i to events.length-1
	function launchEvent(i){
		var currentEvent = record.getEvent(i);
		switch (currentEvent.type){
			case ("travel"):
				var cityIndex = currentEvent.body;
				goToLoc(parseInt(cityIndex));
				break;
			case ("movement"):
				var transform = currentEvent.body;
				g.attr("transform", transform);
				updateScaleAndTrans();
				break;
		}

		if (!record.hasNextEvent(currentEvent)){ return; } // if reached end of array, stop.

		var nextEvent = record.getEvent(i+1);
		var delay = nextEvent.time - currentEvent.time; // is ms, the time between current and next event

		setTimeout(launchEvent, delay, i + 1);
	}
	stopRecording();
	launchEvent(0); // launch the first event.
}

function buttonImageConvert(myImgId, imageName){
	var loc = "http://localhost:3000/image/";
	var getId = document.getElementById(myImgId);
	getId.src = loc + imageName;
}
function resetExplButtonFunction () {
	record.reset();
	stopExplButton.disabled = true;
	saveExplButton.disabled = true;
	playExplButton.disabled = true;
	buttonImageConvert("record-button", "record_gray.jpeg");
	buttonImageConvert('save-exploration-button', "save_gray.jpeg");
	buttonImageConvert("stop-button", "stop_gray.jpeg");
	buttonImageConvert("play-exploration-button", "play_gray.jpeg");
	d3.select("#record-border").remove();
	d3.select("#record-circle").remove();

}

function saveExplButtonFunction () {
	buttonImageConvert("stop-button", "stop_gray.jpeg");
	buttonImageConvert("save-exploration-button", "save_gray.jpeg");
	if(!record.isEmpty()){
		saveExploration();
	}
	else alert("record list are empty!");
}

function loadExplButtonFunction () {
	buttonImageConvert("play-exploration-button", "play_green.jpg");
	handleExplorationUpload(document.getElementById("load-exploration-button").files[0]);
	stopExplButton.disabled = true;
	saveExplButton.disabled = true;
	resetExplButton.disabled = true;
	recordExplButton.disabled = true;
	playExplButton.disabled = false;
}

function saveExploration(){
	$.ajax({
		type: 'POST',
		url: "/postExploration",//url of receiver file on server
		data: JSON.stringify(record),
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		contentType: "application/json"
	});
}