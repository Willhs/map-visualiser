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

var IMAGE_PATH = "data/image/";

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

// data to be bound to svg elements
var cities, distances, direction, paths;

// location/city that was last selected.
var selectedLocation;

var projection = d3.geo.mercator()
.center([68.0, 48.0])
.scale(2000)
.translate([width/2,height/2]);

var path = d3.geo.path().projection(projection)
.pointRadius(2.5);

// mousewheel zooming
var zoom = d3.behavior.zoom()
.on("zoom.normal",function() {
	g.attr("transform","translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
})

var svg = d3.select("body").append("svg")
.attr("width", width)
.attr("height", height)
.attr("class", "svg_map")
.attr("id", "svg_map")
.call(zoom) // attach zoom listener
.on("dblclick.zoom", null); // disable double-click zoom

var g = svg.append("g")
	.attr("id","map_area")
	.attr("transform", "translate(0,0)scale(1)");
svg.style('cursor','move');

// Read country outline from file
d3.json("data/map/kaz.json", function(error, json) {
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
d3.json("data/map/kaz_places.json", function(error, json){
	cities = json.features;
	// places group to contain all elements of a place
	var places = g.selectAll(".place")
	.data(cities)
	.enter()
	.append("g")
		.attr("id", function(d, i) { return d.properties.NAME; })
		.on("dblclick.zoom", cityClicked)
		.on("click", selectLocation)
		.attr("class", "place");

	places.append("path")
	.attr("d", path);

	// Assign labels to cities
	places.append("text")
	.attr("class", "place-label")
	.attr("id", function(d, i) { return i;} )
	.attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
	.attr("dy", ".35em")
	.text(function(d) { return d.properties.NAME; });
	places.style('cursor','hand');

	// Align labels to minimize overlaps
	g.selectAll(".place-label")
	.attr("x", function(d) { return d.geometry.coordinates[0] > -1 ? 6 : -6; })
	.style("text-anchor", function(d) { return d.geometry.coordinates[0] > -1 ? "start" : "end"; });
});

// updates info bar to show information about the location and allows user to add annotations
function selectLocation(city){
	selectedLocation = city;
	displayLocationInfo(city);
}

// adds an annotations to the currently selected location
function submitAnnotation(annotationText){

	var annotation = {
		userName: currentUser.name,
		location: selectedLocation,
		text: annotationText,
		timestamp: new Date()
	};

	$.ajax({
		type: 'POST',
		url: "/postAnnotation",
		data: JSON.stringify(annotation),
		contentType: "application/json",
		complete: updateLocationInfo
	});
}


// refresh the location info bar
function updateLocationInfo(){
	if (selectedLocation)
		selectLocation(selectedLocation);
}

// removing an annotation from a location.
function deleteAnnotation(annotation){
	console.log("delete annotation");
	$.ajax({
		type: 'POST',
		url: "deleteAnnotation",
		data: JSON.stringify(annotation),
		contentType: "application/json",
		complete: updateLocationInfo
	})
}

// Defaults for the travelTo function?
var start = [width / 2, height / 2, height],
	end = [width / 2, height / 2, height];

// smoothly transitions from current location to a city
// if elapsedTime is specified, makes the transition from elapsedTime to end
function travelTo(city, duration, elapsedTime) {

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

	var duration = duration ? duration : i.duration * ANIMATION_DELAY,
		ease = elapsedTime ? resumed_ease(EASE_FUNCTION, elapsedTime) : EASE_FUNCTION;

	g.transition()
	.duration(duration)
	.ease(ease)
	.attrTween("transform", function() {
		return function(t) { return transform(i(t)); };
	})
	.each("end.update", function(){
		updateScaleAndTrans(); // updates global scale and transition variables});
	});

	start = [x, y, scale];
	centered = city;

	// code from http://bl.ocks.org/mbostock/3828981
	function transform(p) {
		//k is the width of the selection we want to end with.
		var k = height / p[2];
		return "translate(" + (center[0] - p[0] * k) + "," + (center[1] - p[1] * k) + ")scale(" + k + ")";
	}
}

function resumed_ease( ease, elapsed_time ) {
    var y = typeof ease == "function" ? ease : d3.ease.call(d3, ease);
    return function( x_resumed ) {
        var x_original = d3.scale
                        .linear()
                        .domain([0,1])
                        .range([elapsed_time,1])
                        ( x_resumed );
        return d3.scale
                .linear()
                .domain([ y(elapsed_time), 1 ])
                .range([0,1])
                ( y ( x_original ) );
    };
}

// updates the zoom.scale and zoom.translation properties to the map's current state
function updateScaleAndTrans(){
	var scale = d3.transform(g.attr("transform")).scale[0];
	var translate = [d3.transform(g.attr("transform")).translate[0], d3.transform(g.attr("transform")).translate[1]];
	zoom.scale(scale);
	zoom.translate(translate);
}

// A function to reset the map to the center, zoomed out.
/*function reset(){
	x = width / 2;
	y = height / 2;
	k = 1;
	centered = null;

	g.transition()
	.duration(900 * ANIMATION_DELAY)
	.ease(EASE_FUNCTION)
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
	.style("stroke-width", 1.5 / k + "px")
	.tween("update-zoom", function(){
		return updateScaleAndTrans; // updates global scale and transition variables
	});
}*/

// sets the easing function and animation speed
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
	travelTo(d);
}

// A function that takes you to a city
// location: number (city index) or string (city name)
// duration: duration of transition
// elapsedTime: continue transition from this time
function goToLoc(location, duration, elapsedTime) {
	if (typeof location === "number")
		location = cities[index];
	if (typeof location === "string")
		location = cities[getCityIndex(location)];

	selectLocation(location); // so that information appears in sidebar
	travelTo(location, duration, elapsedTime);
}

// Pings a country on the scren
function ping(location) {
	var source;
	if (typeof location === "number")
		source = cities[location];
	if (typeof location === "string")
		source = cities[getCityIndex(location)];

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

	g.append("circle")
	.attr({
		class: "ping",
		cx: center[0],
		cy: center[1],
		r: startR})
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