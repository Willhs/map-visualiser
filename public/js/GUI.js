//updates elements in the side bar
function updateSideBar(){
	updateUserButtons(currentUser);
	updateExplorationChooser();
	updateLocationInfo();
	updateExplorationControls();
	updateNotifications();
	updateLogonElements();
}

//updates the exploration chooser (drop down box)
function updateExplorationChooser(){

	// clear all explorations
	while(explChooser.firstChild){
		explChooser.removeChild(explChooser.firstChild);
	}

	var explorations = userLoggedOn() ? currentUser.getExplorations() : [];
	if(explorations.length===0){
		$("#noOfFilesLoaded").html("no explorations loaded");
		return;
	}
	explorations.forEach(function(exploration, index){
		var explOption = document.createElement('option');
		explOption.setAttribute("id", exploration.timeStamp);
		var explorationName = exploration.name +" - "+ exploration.timeStamp;
		explOption.innerHTML = explorationName;
		explOption.value = index;
		explChooser.appendChild(explOption);
	});

	ensureExplorationSelected();
}

//updates the user buttons to show who is logged in
function updateUserButtons(currentUser){
	var userButtons = document.getElementsByClassName("user-button");
	Array.prototype.forEach.call(userButtons, function(userButton){
		if (currentUser && userButton.id === currentUser.name){
			userButton.classList.remove("other-user-button");
			userButton.classList.add("current-user-button");
		} else {
			userButton.classList.remove("current-user-button");
			userButton.classList.add("other-user-button");
		}
	});
}

//updates the notification GUI elements
function updateNotifications(){
	if (!userLoggedOn())
		return;

	var sharedExpl = currentUser.getSharedExploration();
	var newCount = 0;
	
	sharedExpl.forEach(function(expl){
		if(expl.isNew) newCount++;
	});

	if(newCount!=0){
		$("#notification").html("have "+ newCount + " new explorations.");	
		notificationSelector.style.display = "none";
		resetNotificationLable("block");
	}
	else{
		$("#notification").html("have no new explorations.");
	}
}

function updateExplorationControls(){
	resetExplorations();
}

function updateLogonElements(){
	// if user is currently logged on
	if (userLoggedOn()){
		logonButton.value = "Log off";
		userNameInput.disabled = true;
		passwordInput.disabled = true;
	}
	// if no users logged on
	else {
		logonButton.value = "Log on";
		userNameInput.disabled = false;
		passwordInput.disabled = false;

		userNameInput.value = "";
		passwordInput.value = "";
	}
}

function updateDeleteButton(){	
	if (selectedExploration)
		deleteExplButton.style.visibility = "visible";
	else deleteExplButton.style.visibility = "hidden";
}


function changeButtonColour(name, state){
	var button = document.getElementById(name + "-exploration-button");

	if (state)
		button.src = IMAGE_PATH + name + "_on.jpeg";
	else
		button.src = IMAGE_PATH + name + "_off.jpeg";
}

//adds graphics to the map to show that recording is in progress.
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

// remove recording related graphics
function removeRecordingGraphics(){
	d3.select("#record-border").remove();
	d3.select("#record-circle").remove();
}

function showListNotifications(){
	var notificationChooser= document.getElementById("notification-selector");
	while(notificationChooser.firstChild){//remove old labels
		notificationChooser.removeChild(notificationChooser.firstChild);
	}
	var newSharedExpls = currentUser.getSharedExploration();
	divHideShow(notificationChooser);
	if(newSharedExpls.length>0){
		newSharedExpls.forEach(function(expl, index){
			if(expl.isNew){
				var newOption = document.createElement('option');
				newOption.setAttribute("id", currentUser.name+index);
				newOption.value = index;

				explorationName = expl.userName +" "+ expl.timeStamp.substr(0,24)+" "+expl.timeStamp.substr(34,40);
				newOption.innerHTML = explorationName;
				newOption.onclick  = function(){
					selectExploration(newSharedExpls[index]);
					stopRecording();
					enableAction("play");
					enableAction("reset");

				};
				notificationChooser.appendChild(newOption);
			}
		});
	}
}

function divHideShow(div){

	if (div.style.display.localeCompare("block")==0){
		div.style.display = "none";
	}
	else{
		div.style.display = "block";
		setTimeout(function () {div.style.display = "none";}, 3000);
	}
}
//reset notifications lable when logoff
function resetNotificationLable(state){
	document.getElementById("notification").style.display = state;
}

// displays information about the location selected
function displayLocationInfo(city){

	document.getElementById("location-title").innerHTML = city.properties.NAME;

	var annotations = document.getElementById("annotation-container");
	annotations.innerHTML = null; // clear previous annotations

	//remove and add new annotation input
	var annotationInputCont = document.getElementById("annotation-input-container");
	annotationInputCont.innerHTML = null;
	if (currentUser != null)
		makeAnnotationInput(annotationInputCont);

	// get annotations for this location
	$.ajax({
		type: 'GET',
		url: "/getAnnotations",
		data: city.properties.NAME,
		success: displayAnnotations,
		dataType: "json",
	});

	// displays annotations associated with the current location
	function displayAnnotations(annotations){
		// if response is "no_annotations", no annotations were found, so do nothing
		if (annotations === "no_annotations") return;
		// make a secondary annotation container so that all annotations can be loaded at once
		var container = document.createElement("div");
		container.className["annotation-container-2"];

		annotations.forEach(function(annotation){

			var userName = annotation.userName;
			var timestamp = new Date(annotation.timestamp);
			var time = timestamp.getHours() + ":" + timestamp.getMinutes();
			var date = timestamp.getDate() + "/" + timestamp.getMonth();
		 	var annInfo = "<i> – " + userName + " " + date + " " + time + "</i>";

		 	// make necessary DOM elements
		 	var rowDiv = document.createElement("div");
		 	var textDiv = document.createElement("div");
		 	var controlsDiv = document.createElement("div");
		 	var content = document.createElement("p");
		 	var info = document.createElement("p");

		 	// set class (styles are applied in styles.css)
		 	content.className = "annotation-text annotation-content";
		 	info.className = "annotation-text annotation-info";
		 	controlsDiv.className ="annotation-inner-container annotation-controls";
		 	textDiv.className ="annotation-inner-container annotation-text-container";
		 	rowDiv.className = "annotation-row";

		 	content.innerHTML = annotation.text;
		 	info.innerHTML = annInfo;

		 	// display delete button if user owns the annotation
		 	// TODO: more reliable equality check
		 	if (currentUser != null && currentUser.name === userName){
			 	var deleteButton = document.createElement("input");
			 	deleteButton.type = "image";
			 	deleteButton.src = IMAGE_PATH + "delete.png";
			 	deleteButton.id = "delete-button";
			 	deleteButton.onclick = function () { deleteAnnotation(annotation); }
		 		controlsDiv.appendChild(deleteButton);
		 	}

		 	textDiv.appendChild(content);
		 	textDiv.appendChild(info);

		 	rowDiv.appendChild(textDiv);
		 	rowDiv.appendChild(controlsDiv);

			container.appendChild(rowDiv);
		});
		// TODO: load all annotations at once
		document.getElementById("annotation-container")
			.appendChild(container);
	}
}

// makes an annotation text input element.
function makeAnnotationInput(container){
	var annInput = document.createElement("input");
	annInput.type = "text";
	annInput.placeholder = "Add annotation";

	annInput.onkeydown = function(event) { // if enter is pushed, submit the annotation
		if (event.keyCode === 13) submitAnnotation(annInput.value);
	}
	container.appendChild(annInput);
	annInput.focus();
}

function changeButtonColour(name, state){
	var button = document.getElementById(name + "-exploration-button");

	if (state)
		button.src = IMAGE_PATH + name + "_on.jpeg";
	else
		button.src = IMAGE_PATH + name + "_off.jpeg";
}