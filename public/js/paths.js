var transitionList = [];

// Remove all cities from the path
function clearPath() {
	transitionList = [];
}

// add a city to the path
function addToPath(index) {
	var city = cities[index];
	transitionList.push(city);
	var entry = document.createElement("option");
	entry.value = index;
	entry.text = city.properties.NAME;
	entry.className = "city-entry";
	entry.setAttribute("ondblclick", 'goToLoc(' + index + ')');
	entry.setAttribute("onmouseover", 'ping(' + index + ')');
	document.getElementById('path-list').add(entry, null);
}

// removes a city from the path
function removeFromPath(index) {
	var loc = transitionList.indexOf(cities[index]);
	if (loc > -1) {
		transitionList.splice(loc, 1);
	}
	var pathList = document.getElementById('path-list');
	if (pathList.options.length > 0) {
		pathList.remove(pathList.options.selectedIndex);
	}
}

var pathTimer = [];
// takes the user through the path
function followPath(index) {
	if (transitionList.length > index) {
		move(transitionList[index], function() {
			pathTimer = followPath(index + 1);
		});
		return new Date().getTime();
	}
}

function handlePathUpload(file){
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
}

function savePath(){
	$.ajax({
		type: 'POST',
		url: "/postpath",//url of receiver file on server
		data: JSON.stringify(transitionList),
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		contentType: "application/json" //text/json...

	});
}