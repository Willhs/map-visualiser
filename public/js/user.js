function User(name, explorations){
	this.name = name;
	this.explorations = explorations; //all explorations
	this.currentExpl = null; // a recording in progress (none at start)

	// add an exploration
	this.addExploration = function (expl){
		this.exploration.push(expl);
	};

	this.setExplorations = function(explorations){
		this.explorations = explorations;
	}

	this.getCurrentExploration = function(){
		return this.currentExpl;
	}
	this.setCurrentExploration = function(expl){
		this.currentExpl = expl;
	};

	this.resetCurrentExploration = function(){
		this.currentExpl = null;
	};
	// gets an exploration (given a timestamp) from the user's collection of explorations
	this.getExploration = function(timeStamp){
		var userExpl;
		this.explorations.forEach(function(expl){
			if (expl.timeStamp.localeCompare(timeStamp)==0){
				userExpl = expl;
			}
		});
		return userExpl;
	};

	this.getExplorationByIndex = function(index){
		return explorations[index];
	};

	this.getExplorations = function(){
		return this.explorations;
	}

	// gets all the explorations which are considered new
	this.getNewExplorations = function(){
		var newExplorations = [];
		this.explorations.forEach(function(exploration){
			if (exploration.isNew){
				newExplorations.push(exploration);
			}
		});
		return newExplorations;
	}
}

var selectedExploration = null; // currently selected exploration
var currentUser = null; // the user who is currently logged in

function loadFileButtonFunction(){
	handleFileUpload(document.getElementById("load-file-button").files[0]);
}

//logs on a user
function attemptLogon(name, pw){

	// returns whether logon is approved
	$.ajax({
		type: 'POST',
		url: "/checkAuthentication",
		data : JSON.stringify({userName: name, password: pw}),
		success: gotApprovalResponse,
		contentType: "application/json"
	});
	
	function gotApprovalResponse(approved){
		if(JSON.parse(approved)){
			logon(name);

			if(logonButton.value=="Logon"){
				logonButton.value="Logoff";
				document.getElementById("userName-input").disabled = true;
				document.getElementById("password-input").disabled = true;
			}
		}
		else{
			alert("username/password are invalid");
		}
	}
}

function logon(name){

	currentUser = new User(name);
	loadAllExplorations(name, gotExplorations);
//	loadUserInfo(name, gotUserInfo);

	function gotExplorations(allExplorations){
		currentUser.setExplorations(allExplorations);
		updateSideBar();
	}
}

function attemptCreateAccount(name, pw){

	$.ajax({
		type: 'POST',
		url: "/checkUsersFile",
		data : JSON.stringify({userName: name}),
		success: gotApproval,
		contentType: "application/json"
	});
	//
	function gotApproval(approved){
		if(!JSON.parse(approved)){
			createAccount(name, pw);
		}
		else{
			alert("user name already been used, please choose another name");
		}
	}
}

function loadAllExplorations(userName, cb){
	$.ajax({
		type: 'GET',
		url: "/getUserExplorations",
		data: userName,
		success: function(data) { dealWithExplorations(data, cb); },
		dataType: "json"
	});

	function dealWithExplorations(explorations, cb){
		// input arrays contain objects with exploration data, but no methods.
		var allExplorationsData = explorations;
		var explorationCount = allExplorationsData.length;

		if (explorationCount == 0){
			$("#noOfFilesLoaded").html("no files in your folders");
		}
		else {
			$("#noOfFilesLoaded").html("have "+ explorationCount + " files in shared folder");
		}

		// transfer all data into new Exploration objects (so that methods can be used on them).
		var allExplorations = [];

		allExplorationsData.forEach(function(data){
			var exploration = new Exploration();

			// if expl has audio, convert audio arraybuffer to blob
			if (data.audio){
				var audioASCII = data.audio;
				var byteCharacters = atob(audioASCII);
				var byteNumbers = new Array(byteCharacters.length);
				for (var i = 0; i < byteCharacters.length; i++) {
				    byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				var byteArray = new Uint8Array(byteNumbers);
				data.audio = new Blob([byteArray], {type: "audio/wav"});
			}

			exploration.transferPropertiesFrom(data);
			allExplorations.push(exploration);

		});
		// send back explorations
		cb(allExplorations);
	}
}

// updates elements in the side bar
function updateSideBar(){
	updateUserButtons(currentUser);
	updateExplorationChooser();
	refreshLocationInfo();
	updateExplorationControls();
	updateNotifications(currentUser);
}

// updates the exploration chooser (drop down box)
function updateExplorationChooser(){
	// remove old
	var chooser= document.getElementById("exploration-selector");

	while(chooser.firstChild){//remove old labels
		chooser.removeChild(chooser.firstChild);
	}

	var explorations = currentUser ? currentUser.getExplorations() : [];

	explorations.forEach(function(exploration, index){
		var explOption = document.createElement('option');
		explOption.setAttribute("id", exploration.timeStamp);
		var explorationName = exploration.name +" - "+ exploration.timeStamp;
		explOption.innerHTML = explorationName;
		explOption.value = index;
		chooser.appendChild(explOption);
		var linebreak = document.createElement("br");
		chooser.appendChild(linebreak);
	});
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
// TODO: RE-WRITE
function updateNotifications(currentUser){
//	var notificationBox = $("#notification-files");
//	notificationBox.style.display = "none";
	if (!currentUser)
		return;

	var newExplorations = currentUser.getNewExplorations();

	if(newExplorations.length>0){
		$("#notification").html("have "+ newExplorations.length + " files in shared folder");
		//showListNotifications();
		document.getElementById("notification-files").style.display = "block";
	}
	else{
		$("#notification").html("have no files in shared folder");
	}
}

function updateExplorationControls(){
	resetExplorations();
}

function logout(){
	currentUser = null;
	logonButton.value="Logon";
	userNameInput.disabled = false;
	passwordInput.disabled = false;

	updateSideBar();
}

function contains(a, obj){
	for(var i = 0; i<obj.length; i++){
		if(typeof(a)==String){
			if(obj[i].localeCompare(a)==0){
				return true;
			}
		}
		else if(obj[i]===a){
			return true;
		}
	}
	return false;
}

function saveFileToSharedUser(name){
	if(name==currentUser.name) return;
	console.log("save file to "+name+"'s shared folder");
	console.log("select time: "+selectedExploration.timeStamp);

	$.ajax({
		type: 'POST',
		url: "/shareExploration",//url of receiver file on server
		data: JSON.stringify({"exploration":selectedExploration,"to":name, "from":currentUser.name}),
		//data: JSON.stringify(record),
		success: function(response){
			if(!JSON.parse(response))
				alert("user does not exist!");
		}, //callback when ajax request finishes
		contentType: "application/json" //text/json...
	});
}
function saveFileToPlayedShared(file){
	console.log("save file to played shared folder");
	$.ajax({
		type: 'POST',
		url: "/saveSharedPlayed",//url of receiver file on server
		data: {"filePlayed":JSON.stringify(file),"from": currentUser.fname,"to":file.user.fname,"timestamp": sharedExplorationFrom.startTimeStamp},
		success: function(response){ console.log(response); }, //callback when ajax request finishes
		dataType: "json" //text/json...

	});
}
function deleteExplorationFile(file){
	console.log("delete shared Played File");
	$.ajax({
		type: 'POST',
		url: "deleteExplorationFile",
		data: { "explorationFile": JSON.stringify(file, null, 4) },
		dataType: "json",
		success: function(response){ console.log(response); } //callback when ajax request finishes
	});
}
function deletePlayedFromSharedFolder(playedFile){
	console.log("delete shared Played File");
	$.ajax({
		type: 'POST',
		url: "deletePlayed",
		data: { "playedFile": JSON.stringify(playedFile, null, 4) },
		dataType: "json",
		success: function(response){ console.log(response); }, //callback when ajax request finishes
	});
}

function createAccount(name, pw){
	console.log("add new user's name and pw to logonInfo file");

	$.ajax({
		type: 'POST',
		url: "createAccount",
		data: JSON.stringify({userName: name, password: pw}),
		contentType: "application/json",
		success: function(response){ console.log(response); }, //callback when ajax request finishes
	});
	window.document.write("new account created!");
	window.close();

}


function showListNotifications(){
	var temp1 = currentUser.sharedEventsFromOther;
	var temp2 = currentUser.sharedFileTimeStamp;
	var idDiv = "notification-files";
	var idLabel = "notification-file";
	var div = document.getElementById(idDiv);
	var notificationChooser= document.getElementById(idDiv);
	while(notificationChooser.firstChild){//remove old labels
		notificationChooser.removeChild(notificationChooser.firstChild);
	}

	divHideShow(div);
	if(temp2.length!=0){
		var quickPlayDiv = document.createElement("div");
		quickPlayDiv.className = "quickPlayDivClass";
		var qButton = document.createElement('input');
		var qButtonId = 'qButton';
		qButton.setAttribute("type",'image');
		qButton.setAttribute("src",'image/play.jpeg');
		qButton.setAttribute("alt", 'javascript button');
		qButton.setAttribute("id", qButtonId);
		qButton.style.width = '15px';
		qButton.style.height = '15px';
		qButton.onclick = function(){
			playExplorationing();
		};
		quickPlayDiv.appendChild(qButton);
		div.appendChild(quickPlayDiv);
		var nLabels = [];
		var clicked = false;
		for(var i = 0; i<temp2.length; i++){
			var currentFileName = null;
			var newLabel = document.createElement('label');
			newLabel.setAttribute("for", idLabel +i);
			newLabel.setAttribute("id", currentUser.fname+i);
			fileName = temp1[i].user.fname +"  "+ temp2[i].substring(5,20);
			newLabel.innerHTML = fileName;
			div.appendChild(newLabel);
			var linebreak = document.createElement("br");
			div.appendChild(linebreak);
			nLabels.push(newLabel);
			addLabelListener(i, currentUser.fname, clicked, nLabels, null);
		}

		var delDiv = document.createElement("div");
		delDiv.className = "delDivClass";
		var deleteButton = addDeleteButton();
		deleteButton.onclick = function () {delFunction();};
		delDiv.appendChild(deleteButton);
		div.appendChild(delDiv);

	}
}

function delFunction(){
	if(checkMatchedTimeStamp()==0){
		noOfSharedFiles-=1;
		$("#notification").html("have "+ noOfSharedFiles + " files in shared folder");
		saveFileToPlayedShared(sharedExplorationFrom);
		sharedExplorationFrom.reset();
		deletePlayedFromSharedFolder(record);
		removeFromSharedFileTimeStamp(record);
		removeSharedEventsFromOther(record);
		showListNotifications();
	}else{console.log(" equals false");}
}

function addDeleteButton(){
	var deleteButton = document.createElement("input");
	deleteButton.id = "delButton";
	deleteButton.type = "image";
	deleteButton.src = "image/delete.png";
	deleteButton.style.width = "15px";
	deleteButton.style.height = "15px";
	return deleteButton;
}

function removeSharedEventsFromOther(record){
	var index = currentUser.sharedEventsFromOther.indexOf(record);
	if(index>-1){
		currentUser.sharedEventsFromOther.splice(index,1);
	}
}

function removeFromSharedFileTimeStamp(record){
	var index = currentUser.sharedFileTimeStamp.indexOf(record.startTimeStamp);
	if(index>-1){
		currentUser.sharedFileTimeStamp.splice(index,1);
	}
}

function checkMatchedTimeStamp(){
	for(var i = 0; i<currentUser.sharedFileTimeStamp.length; i++){
		if(currentUser.sharedFileTimeStamp[i].localeCompare(record.startTimeStamp)==0){
			return 0;
		}
	}
	return 1;
}

function addLabelListener(index,id2,click,nLabels, file){

	var id = id2+index;
	document.getElementById(id).addEventListener('click',function(){
		addListener(index, file);

		backgroundColorStateChange(id2,index,click,nLabels);
	});
}

function addListener(index, file){
	//record.reset();
	if(file==null){
		record.events = currentUser.sharedEventsFromOther[index].events;
		record.startTimeStamp = currentUser.sharedFileTimeStamp[index];
		sharedExplorationFrom = new Exploration();
		sharedExplorationFrom.setExploration(currentUser.sharedEventsFromOther[index]);
	}
	else{
		record.setExploration(file);

	}
}

function divHideShow(div){

	if (div.style.display.localeCompare("inline")==0){
		div.style.display = "none";
		//setTimeout(function(){div.style.display = "none";},3000);
	}
	else{
		div.style.display = "inline";
		//setTimeout(function () {div.style.display = "none";}, 5000);
	}
}