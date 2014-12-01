/* Copyright (c) 2014, Sivan Fesherman
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. **/

var width = $(window).width() * 0.8,
height = $(window).height(),
centered;

var active;
//How far we should scale into a selection
var SCALE_FACTOR = 1200;
//How fast we should zoom. Lower numbers zoom faster.
var ANIMATION_DELAY = 0.8;
//How large the ping effect should be, in proportion to the height of the screen.
var PING_SIZE = 0.2;
//The ease function used for transitioning
var EASE_FUNCTION = "cubic-in-out";
//The array of easing functions and zoom speeds to use
var FROM_TEXT_FILE = [];
//The constants for the animation delay function to be used in the set easing function
var FAST = 0.4;
var SLOW = 2.4;
//The path to the easing function text file
var PATH_TO_FILE = "data/functions/easingFunctions20.txt"

	var cities, distances, direction, paths;

var projection = d3.geo.mercator()
.center([68.0, 48.0])
.scale(2000)
.translate([width/2,height/2]);

var path = d3.geo.path().projection(projection)
.pointRadius(2.5);

// mousewheel zooming
var zoom = d3.behavior.zoom()
.on("zoom.normal",function() {
	/*  var moveDist = d3.event.scale - lastMouseScale;
          var scale = getCurrentScale() + moveDist;
          console.log("Mousewheel dist: " + moveDist);
          g.attr("transform","translate(" + d3.event.translate + ")scale(" + scale + ")");
          lastMouseScale = d3.event.scale;*/
	g.attr("transform","translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	//   console.log(d3.event.scale);
})

var svg = d3.select("body").append("svg")
.attr("width", width)
.attr("height", height)
.attr("class", "svg_map")
.call(zoom);

var g = svg.append("g")
.attr("transform", "translate(0,0)scale(1)"); // have to initialise scale for zoom

// Read country outline from file
d3.json("data/kaz.json", function(error, json) {
	var subunits = topojson.feature(json, json.objects.kaz_subunits);

	// make outline of land mass

	g.insert("path",":first-child")
	.datum(subunits)
	.attr("d", path)
	.attr("class", "kaz_subunit")
	// set colour
	.attr("fill","#D0FA58")
	.attr("stroke", "#FF0040");

});

// Add cities
d3.json("data/kaz_places.json", function(error, json){
	cities = json.features;


	// group to contain all elemets of a place


	var places = g.selectAll("place")
	.data(cities)
	.enter()
	.append("g")
	.on("click.zoom", cityClicked)
	.attr("class", "place")
	.attr("id", function(d, i) {
		return i;
	});

	places.append("path")
	.attr("d", path);

	// Assign labels to cities
	places.append("text")
	.attr("class", "place-label")
	.attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
	.attr("dy", ".35em")
	.text(function(d) { return d.properties.NAME; });

	// Align labels to minimize overlaps
	g.selectAll(".place-label")
	.attr("x", function(d) { return d.geometry.coordinates[0] > -1 ? 6 : -6; })
	.style("text-anchor", function(d) { return d.geometry.coordinates[0] > -1 ? "start" : "end"; });

	//Populate city selector
	for (var i = 0; i < cities.length; i++) {
		var entry = document.createElement("option");
		entry.text = cities[i].properties.NAME;
		entry.value = i;
		document.getElementById("cityList").appendChild(entry);
	}

});

// The movement function
var start = [width / 2, height / 2, height],
	end = [width / 2, height / 2, height];

function move(city, cb) {

	var callback = function() {
		if (cb) {
			cb();
		}
	};

	if (centered === city){
		return reset();
	}

	var b = path.centroid(city);
	var x = b[0],
	y = b[1],
	scale = 200; // the scale at which a country is zoomed to

	end[0] = x;
	end[1] = y;
	end[2] = scale;

	var sb = getRealBounds();
	start = [sb[0][0], sb[0][1], height / d3.transform(g.attr("transform")).scale[0]];

	var center = [width / 2, height / 2],
	i = d3.interpolateZoom(start, end);

	g.transition()
	.duration(i.duration * ANIMATION_DELAY)
	.ease(EASE_FUNCTION)
	.attrTween("transform", function() {
		return function(t) { return transform(i(t)); };
	})
	.each("end.cb", callback)
	.each("end.update", function(){
		updateScaleAndTrans(); // updates global scale and transition variables
	});

	start = [x, y, scale];
	centered = city;

	//http://bl.ocks.org/mbostock/3828981
	function transform(p) {
		//k is the width of the selection we want to end with.
		var k = height / p[2];
		return "translate(" + (center[0] - p[0] * k) + "," + (center[1] - p[1] * k) + ")scale(" + k + ")";
	}
}

// updates the zoom.scale and zoom.translation properties to the map's current state
function updateScaleAndTrans(){

	var scale = getScale(g.attr("transform"));
	var translate = getTranslate(g.attr("transform"));
	//console.log(scale);
	//console.log(translate);
	zoom.scale(scale);
	zoom.translate(translate);
}

// gets the current map scale
function getScale(transformStr){
	// console.log(transformStr);
	var length = transformStr.length;
	var scale = transformStr.slice(transformStr.indexOf("scale")+6, length-1);
	// console.log(scale);
	return parseInt(scale);
}

function getTranslate(transformStr){
	// console.log(transformStr);
	var length = transformStr.length;
	var translationX = transformStr.slice(transformStr.indexOf("translate")+10, transformStr.indexOf(","));
	var translationY = transformStr.slice(transformStr.indexOf(",")+1, transformStr.indexOf(")"));
	//console.log("translation: " + [translationX, translationY]);
	return [parseInt(translationX), parseInt(translationY)];
}

// A function to reset the map view.
function reset(){
	//console.log("resetting");
	x = width / 2;
	y = height / 2;
	k = 1;
	centered = null;

	g.transition()
	.duration(900 * ANIMATION_DELAY)
	.ease(EASE_FUNCTION)
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
	.style("stroke-width", 1.5 / k + "px");

}


// A function to set the easing function and animation speed
// from the information in the text file.
function setEaseFunction(index){
	var zoomIn = FROM_TEXT_FILE[index][0];
	var zoomOut = FROM_TEXT_FILE[index][1];
	var speed = FROM_TEXT_FILE[index][2];

	// set the easing function
	EASE_FUNCTION = (zoomIn == zoomOut ? zoomIn+"-in-out" : zoomIn+"-in"+zoomOut+"-out");
	// set the animation delay
	ANIMATION_DELAY = (speed == "slow" ? SLOW : FAST);
}

// A function to return the index of a given city
function getCityIndex(name){
	for(j = 0; j < cities.length; j++){
		if(cities[j].properties.NAME == name){
			return j;
		}
	}
}

function cityClicked(d){
	move(d);
}

// A function that takes you to a city
function goToLoc(index) {
	move(cities[index]);
}

var transitionList = [];

// Remove all cities from the path
function clearPath() {
	transitionList = [];
}

// A function to add a city to the path
function addToPath(index) {
	var city = cities[index];
	transitionList.push(city);
	var entry = document.createElement("option");
	entry.value = index;
	entry.text = city.properties.NAME;
	entry.className = "city-entry";
	entry.setAttribute("ondblclick", 'goToLoc(' + index + ')');
	entry.setAttribute("onmouseover", 'ping(' + index + ')');
	document.getElementById('pathList').add(entry, null);
}

// A function that removes a city from the path
function removeFromPath(index) {
	var loc = transitionList.indexOf(cities[index]);
	if (loc > -1) {
		transitionList.splice(loc, 1);
	}
	var pathList = document.getElementById('pathList');
	if (pathList.options.length > 0) {
		pathList.remove(pathList.options.selectedIndex);
	}

}

// A function that takes the user through the path
var pathTimer = [];
function followPath(index) {
	if (transitionList.length > index) {
		console.log("1");
		move(transitionList[index], function() {


			pathTimer = followPath(index + 1);
		});
		return new Date().getTime();
	}
}

//A function that takes the user through the path


function savePath(){

	//var map = transitionList.map(function(i){return JSON.stringify(i)});
	// console.log(map);
	$.ajax({
		type: 'POST',
		url: "/postpath",//url of receiver file on server
		data: {"path_taken":JSON.stringify(transitionList, null, 4)},
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		dataType: "json" //text/json...

	});

}
function saveExploration(){

	$.ajax({
		type: 'POST',
		url: "/postExploration",//url of receiver file on server
		data: {"exploration":JSON.stringify(events, null, 4)},
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		dataType: "json" //text/json...

	});

}



// A function that returns the selected city
function getSelected(elem) {
	console.log(elem);
	console.log(elem.options[elem.selectedIndex]);
	return elem.options[elem.selectedIndex].value;
}

//Pings a country on the scren
function ping(index) {

	var source = cities[index];

	var center = path.centroid(source);
	var screenvars = getAbsoluteBounds();

	var xdist = Math.abs(center[0] - screenvars[0][0]);
	var ydist = Math.abs(center[1] - screenvars[0][1]);

	var startR = 0;

	//Only adjust radius if the target is off the map
	if ((xdist) > (screenvars[1][0]) || (ydist) > (screenvars[1][1])) {
		if (xdist === 0) {
			//Perfectly vertical alignment
			startR = ydist - (screenvars[1][1]);
		}
		else if (ydist === 0) {
			//Perfectly horizontal alignment
			startR = xdist - (screenvars[1][0]);
		}
		else {

			var xdy = (xdist / ydist);
			var screenRatio = width / height;
			var scaleVar = ((xdy) >= screenRatio) ? (xdist / (Math.abs(xdist - screenvars[1][0]))) : (ydist / (Math.abs(ydist - screenvars[1][1])));
			var dist = Math.sqrt(xdist * xdist + ydist * ydist);

			startR = dist / scaleVar;
		}

	}

	var endR = startR + screenvars[1][1] * PING_SIZE;

	//TODO render circles
	g.append("circle")
	.attr("class", "ping")
	.attr("cx", center[0])
	.attr("cy", center[1])
	.attr("r", startR)
	.transition()
	.duration(750)
	.style("stroke-opacity", 0.25)
	.attr("r", endR)
	.each("end", function() {
		g.select(".ping").remove();
	});

}

//Convert the screen coords into data coords
function getRealBounds() {
	var transforms = d3.transform(g.attr("transform"));

	var tx = transforms.translate[0];
	var ty = transforms.translate[1];
	var sc = height / transforms.scale[1];

	var xcenter = ((width / 2) - tx) / transforms.scale[0];
	var ycenter = ((height / 2) - ty) / transforms.scale[0];

	var xspan = width * sc / SCALE_FACTOR;
	var yspan = height * sc / SCALE_FACTOR;

	return [[xcenter, ycenter], [xspan, yspan]];

}

//Convert
function getAbsoluteBounds() {
	var transforms = d3.transform(g.attr("transform"));

	var tx = transforms.translate[0];
	var ty = transforms.translate[1];

	var xcenter = ((width / 2) - tx) / transforms.scale[0];
	var ycenter = ((height / 2) - ty) / transforms.scale[0];

	return [[xcenter, ycenter], [(width / 2) / transforms.scale[1], (height / 2) / transforms.scale[1]]];
}

// --- Will and Jacky's added code:
function handlePathUpload(file){
	//console.log(file);
	fr = new FileReader();
	fr.onload = receivedText;
	fr.readAsText(file);

	clearPath();

	function receivedText() {
		var inputCities = JSON.parse(fr.result);

		for (var i = 0; i < inputCities.length; i++){
			var inputCity = inputCities[i];

			addToPath(getCityIndex(inputCity))
		}
		console.log(transitionList.length + " transitions");
	}
	//transitionList = function(i){return data[i]};
}

// handles the upload of an file containing exploration data
function handleExplorationUpload(file){
	//console.log(file);
	fr = new FileReader();
	fr.onload = receivedText;
	fr.readAsText(file);
	function receivedText() {
		var inputEvents = JSON.parse(fr.result);
		events = [];

		for (var i = 0; i < inputEvents.length; i++){
			var inputEvent = inputEvents[i];
			events.push(inputEvent);
		}

		console.log(events.length + " events add from exploration file");
	}
}

var events = [];
function event(type, time, info){
	this.type = type;
	this.time = time;
	this.info = info;
}


// beings recording of certain user navigation actions
function startRecording() {

	buttonImageConvert("record-button", "record_red.jpeg");
	buttonImageConvert("stop-button", "stop_red.jpeg");
	buttonImageConvert("reset-button","reset_red.jpeg");
	buttonImageConvert("save-exploration-button", "save_blue.jpeg");
	buttonImageConvert("play-exploration-button","play_green.jpg");
	stopExplButton.disabled = false;
	saveExplButton.disabled = false;
	playExplButton.disabled = false;
	//playExplButton.disabled = true;

	// adds event listeners which record user navigation actions
	zoom.on("zoom.record", recordMovement);
	saveExplButton.disabled = true; // have to stop recording before saving

	// listeners for all events that cause scale and pan transitions
	// go to city button
	goToCity.addEventListener("click", recordTravel(document.getElementById('cityList').value));

	// cities on the map
	var mapCities = document.getElementsByClassName("place");
	console.log(mapCities.length);
	for (var i = 0; i < mapCities.length; i++){
		var city = mapCities.item(i);
		city.addEventListener("click", recordTravel(city.id));
	}

	// entries in the side bar drop-down menu
	var cityEntries = document.getElementsByClassName("city-entry");
	console.log(cityEntries.length);
	for (var i = 0; i < cityEntries.length; i++){
		var entry = cityEntries.item(i);
		entry.addEventListener("dblclick", recordTravel(entry.value));
	}

	addRecordingGraphics();
}

// adds graphics to the map to show that recording is in progress.
function addRecordingGraphics(){
	//var points = [0, 0, width, height];
	var borderWidth = 20;
	var circleRadius = 30;
	var padding = 10;
	var circleCX = borderWidth + circleRadius;
	var circleCY = borderWidth + circleRadius;

	svg.append("rect")
		.attr("id", "record-border")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", width)
		.attr("height", height - borderWidth/2)
		.style("stroke", "red")
		.style("fill", "none")
		.style("stroke-width", borderWidth);

	svg.append('circle')
		.attr("id", "record-circle")
	    .attr('cx', circleCX)
	    .attr('cy', circleCY)
	    .attr('r', circleRadius/1.5)
	    .style('fill', 'red');
}

// ends recording of user navigation
function stopRecording() {
	buttonImageConvert("record-button", "record_gray.jpeg");
	saveExplButton.disabled = false;
	if(events.length>0){
		console.log("events size: "+events.length);
		buttonImageConvert("save-exploration-button", "save_blue.jpeg");
		buttonImageConvert("play-exploration-button", "play_green.jpg");
		buttonImageConvert("reset-button", "reset_red.jpeg");

	}else{
		buttonImageConvert("play-exploration-button", "play_gray.jpeg");
		buttonImageConvert("save-exploration-button", "save_gray.jpeg");
		buttonImageConvert("reset-button", "reset_gray.jpeg");
	}
	// removes event listeners which are recording user navigation.
	goToCity.removeEventListener("click", recordTravel);
	zoom.on("zoom.record", null);//remove recording zoom listener
	//saveExplButton.disabled = false; // can now save recording.

	// cities on the map
	var mapCities = document.getElementsByClassName("place");
	for (var i = 0; i < mapCities.length; i++){
		var city = mapCities.item(i);
		city.removeEventListener("onclick", recordTravel(city.id));
	}

	// entries in the side bar drop-down menu
	var cityEntries = document.getElementsByClassName("city-entry");
	for (var i = 0; i < cityEntries.length; i++){
		var entry = cityEntries.item(i);
		entry.removeEventListener("dblclick", recordTravel(entry.value));
	}
	// remove recording graphics
	d3.select("#record-border").remove();
	d3.select("#record-circle").remove();

	console.log("Recorded " + events.length + " events");
}

// records an instance of a user action to travel to a place on the map
function recordTravel(cityIndex){
	return function (){
		events.push(new event("travel", new Date().getTime(), cityIndex));
		console.log("recording travel: "+ cityIndex);
	}
}

// records a user pan or zoom
function recordMovement(){
	events.push(new event("movement", new Date().getTime(), "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"));
	console.log("translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

// plays a recording of navigation events (from events array)
function playRecording(){
	if (events.length == 0) {
		return; // if no events, do nothing.
	}

	var firstTime = events[0].time;

	for (var i=0; i < events.length; i++){
		var event = events[i];
		var delay = event.time - firstTime; // is ms, the time between first event and this event
		//console.log(event);
		setTimeout(function(event){
			switch (event.type){
			case ("travel"):
				goToLoc(parseInt(event.info));
			break;
			case ("movement"):
				g.attr("transform", event.info);
				break;
			}
		}, delay, event);
	}
	stopRecording();
}

function buttonImageConvert(myImgId, imageName)
{
	var loc = "http://localhost:3000/image/";
	var getId = document.getElementById(myImgId);
	getId.src = loc + imageName;
}
function resetExplButtonFunction () {
	events = [];
	stopExplButton.disabled = true;
	saveExplButton.disabled = true;
	playExplButton.disabled = true;
	buttonImageConvert('save-exploration-button', "save_gray.jpeg");
	buttonImageConvert("stop-button", "stop_gray.jpeg");
	buttonImageConvert("play-exploration-button", "play_gray.jpeg");
	d3.select("#record-border").remove();
	d3.select("#record-circle").remove();

}

function saveExplButtonFunction () {
	buttonImageConvert("stop-button", "stop_gray.jpeg");
	buttonImageConvert("save-exploration-button", "save_gray.jpeg");
	if(events.length>0)	saveExploration();
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
// -------------- event handling for DOM elements ----------------

var goToCity = document.getElementById("go-to-city");
goToCity.addEventListener("click", function () { goToLoc(document.getElementById('cityList').value); });

// events for html elements.
document.getElementById("add-to-path").onclick = function () { addToPath(document.getElementById('cityList').value); }
document.getElementById("remove-from-path").onclick = function () { removeFromPath(getSelected(document.getElementById('pathList'))); }
document.getElementById("follow-path").onclick = function () { followPath(0); }
document.getElementById('save-path').onclick = function () { savePath(); }

var resetExplButton = document.getElementById("reset-button");
resetExplButton.onclick = resetExplButtonFunction;

document.getElementById("upload-path").addEventListener('change', function () {

	handlePathUpload(document.getElementById("upload-path").files[0]);}, false);

document.getElementById("load-exploration-button").addEventListener('change', loadExplButtonFunction, false);

var recordExplButton = document.getElementById("record-button");
recordExplButton.addEventListener("click", startRecording);

var stopExplButton = document.getElementById("stop-button")
stopExplButton.addEventListener('click', stopRecording);

var playExplButton = document.getElementById("play-exploration-button");
playExplButton.addEventListener('click', function () {
	if(events.length==0) alert("Record before repaly!")
	d3.select("#record-border").remove();
	d3.select("#record-circle").remove();
	playRecording();
});

var saveExplButton = document.getElementById('save-exploration-button');
saveExplButton.onclick = saveExplButtonFunction;

