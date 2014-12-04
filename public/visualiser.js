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
.call(zoom);

var g = svg.append("g")
	.attr("transform", "translate(0,0)scale(1)");

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
	// places group to contain all elements of a place
	var places = g.selectAll("place")
	.data(cities)
	.enter()
	.append("g")
	.attr("id", function(d, i) { return i; })
	.on("dblclick.zoom", cityClicked)
	.on("click", selectLocation)
	.attr("class", "place");

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
		document.getElementById("city-list").appendChild(entry);
	}

});

// updates info bar to show information about the location and allows user to add annotations
function selectLocation(city){
	selectedLocation = city;
	document.getElementById("location-title").innerHTML = city.properties.NAME;

	// make and add list items to the location description
	var country = document.createElement("li");
	country.innerHTML = "Country: " + city.properties.SOV0NAME;

	var population = document.createElement("li");
	population.innerHTML = "Population: " + city.properties.GN_POP;

	var list = document.getElementById("location-info");
	list.innerHTML = null; // clear previous info list
	list.appendChild(country);
	list.appendChild(population);

	var annotations = document.getElementById("annotation-container");
	annotations.innerHTML = null; // clear previous annotations

	// get annotations for this location
	$.ajax({
		type: 'GET',
		url: "/getAnnotation",
		data: city.properties.NAME,
		success: addAnnotations, 
		dataType: "json",
		complete: function(){ console.log("get complete"); }
	});		

	// adds annotations to the location info
	function addAnnotations(annotations){
		if (annotations === "no_annotations") return;
		var container = document.getElementById("annotation-container");

		annotations.forEach(function(annotation){
			console.log("adding annotation");
		 	var div = document.createElement("div")
		 	var par = document.createElement("p");
		 	par.innerHTML = annotation.text;
		 	div.appendChild(par);
			container.appendChild(div);
		});		
	}

	//remove and add new annotation input
	var annotationInputCont = document.getElementById("annotation-input-container")
	annotationInputCont.innerHTML = null;
	makeAnnotationInput(annotationInputCont);
}

// adds an annotations to the currently selected location
function submitAnnotation(annotationText){

	var annotation = {
		user: userInfo.user,
		location: selectedLocation,
		text: annotationText,
		timestamp: new Date()
	};

	console.log("timestamp: " + (typeof annotation.timestamp));

	$.ajax({
		type: 'POST',
		url: "/postAnnotation",//url of receiver file on server
		data: { "annotation": JSON.stringify(annotation, null, 4) }, // plain object
		dataType: "json",
		complete: refreshInfo
	});

	// refresh the location info bar (to show the new annotation)
	function refreshInfo(){
		selectLocation(selectedLocation);
	}
}

// The movement function
var start = [width / 2, height / 2, height],
	end = [width / 2, height / 2, height];

function move(city, cb) {

	var callback = function() {
		if (cb) {
			cb();
		}
	};

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
	.tween("update-zoom", function(){
		return updateScaleAndTrans; // updates global scale and transition variables
	})
	.each("end.cb", callback);

	start = [x, y, scale];
	centered = city;

	// code from http://bl.ocks.org/mbostock/3828981
	function transform(p) {
		//k is the width of the selection we want to end with.
		var k = height / p[2];
		return "translate(" + (center[0] - p[0] * k) + "," + (center[1] - p[1] * k) + ")scale(" + k + ")";
	}
}

// updates the zoom.scale and zoom.translation properties to the map's current state
function updateScaleAndTrans(){
	zoom.scale(getScale(g.attr("transform")));
	zoom.translate(getTranslate(g.attr("transform")));
}

// gets the scale from a html transform string
function getScale(transformStr){
	var length = transformStr.length;
	var scale = transformStr.slice(transformStr.indexOf("scale")+6, length-1);
	return parseFloat(scale);
}

// gets the translation from a html transform string
function getTranslate(transformStr){
	var length = transformStr.length;
	var translationX = transformStr.slice(transformStr.indexOf("translate")+10, transformStr.indexOf(","));
	var translationY = transformStr.slice(transformStr.indexOf(",")+1, transformStr.indexOf(")"));
	return [parseFloat(translationX), parseFloat(translationY)];
}

// A function to reset the map view.
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
	move(d);
}

// A function that takes you to a city
function goToLoc(index) {
	move(cities[index]);
}


// A function that returns the selected city
function getSelectedInPath(elem) {
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