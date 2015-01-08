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
				console.log("returning exploration");
				userExpl = expl;
			}
		});
		return userExpl;
	};
	this.getSharedExploration = function(){
		var sharedExpl = [];
		this.explorations.forEach(function(expl){
			if(expl.userName.localeCompare(name)!=0){
				sharedExpl.push(expl);
			}
		});
		return sharedExpl;
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
function logout(){
	currentUser = null;
	logonButton.value="Logon";
	userNameInput.disabled = false;
	passwordInput.disabled = false;
	userNameInput.value = "";
	passwordInput.value = "";
	updateSideBar();
	resetNotificationLable("none");
	deselectExploration();
	document.getElementById("notification-selector").style.display = "none";
	document.getElementById("userId").value = "";


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
		dataType: "json",
		complete: function(){ console.log("get all files complete"); }
	});

	function dealWithExplorations(explorations, cb){
		// input arrays contain objects with exploration data, but no methods.
		var allExplorationsData = explorations;
		var explorationCount = allExplorationsData.length;

		if (explorationCount == 0){
			$("#noOfFilesLoaded").html("no files loaded");
		}
		else {
			$("#noOfFilesLoaded").html("have "+ explorationCount + " files loaded");
		}

		// transfer all data into new Exploration objects (so that methods can be used on them).
		var allExplorations = [];

		allExplorationsData.forEach(function(data){
			var exploration = new Exploration();
			exploration.transferPropertiesFrom(data);
			allExplorations.push(exploration);
		});
		// send back explorations
		cb(allExplorations);
	}
}

//updates elements in the side bar
function updateSideBar(){
	updateUserButtons(currentUser);
	updateExplorationChooser();
	refreshLocationInfo();
	updateExplorationControls();
	updateNotifications(currentUser);
}

//updates the exploration chooser (drop down box)
function updateExplorationChooser(){
	console.log("update chooser");
	// remove old
	var chooser= document.getElementById("exploration-selector");

	while(chooser.firstChild){//remove old labels
		chooser.removeChild(chooser.firstChild);
	}

	var explorations = currentUser ? currentUser.getExplorations() : [];

	if(explorations.length==0){
		$("#noOfFilesLoaded").html("no explorations loaded");
		return;
	}
	explorations.forEach(function(exploration, index){
		var explOption = document.createElement('option');
		explOption.setAttribute("id", exploration.timeStamp);
		var explorationName = exploration.name +" - "+ exploration.timeStamp.substr(0,24)+" "+exploration.timeStamp.substr(34,40);
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
function updateNotifications(currentUser){
	if (!currentUser)
		return;

	var sharedExpl = currentUser.getSharedExploration();
	console.log(sharedExpl.length);
	var newCount = 0;
	sharedExpl.forEach(function(expl){
		if(expl.isNew) newCount++;
	});
	if(newCount!=0){

		$("#notification").html("have "+ newCount + " new explorations.");
		resetNotificationLable("block");
	}
	else{
		$("#notification").html("have no new explorations.");
	}
}

function updateExplorationControls(){
	reset();
}

function saveFileToSharedUser(name){
	if(name==currentUser.name) return;
	if(selectedExploration==null) return;
	console.log("save file to "+name+"'s folder");
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

function deleteExploration(expl){
	console.log("delete exploration");
	$.ajax({
		type: 'POST',
		url: "deleteExploration",
		data: JSON.stringify({expl: expl, userName: currentUser.name}),
		contentType: "application/json",
		success: function(response){
			console.log("del expl: "+response);
			if(response==="OK"){
				var index = currentUser.explorations.indexOf(selectedExploration);
				if(index<0) return;
				currentUser.explorations.splice(index,1);
				updateExplorationChooser();
			}

		}, //callback when ajax request finishes
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

function updateExplorationState(expl){
	if(expl!=null){
		console.log("change state: expl not null");
		$.ajax({
			type: 'POST',
			url: "updateExplState",
			data: JSON.stringify({expl: expl, userName: currentUser.name}),
			contentType: "application/json",
			success: function(response){ console.log(response); }, //callback when ajax request finishes
		});
	}
}

function addDeleteButton(){
	var deleteButton = document.createElement("input");
	deleteButton.id = "delButton";
	deleteButton.type = "image";
	deleteButton.src = "data/image/delete.png";
	deleteButton.style.width = "15px";
	deleteButton.style.height = "15px";
	return deleteButton;
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
//reset notificatoins lable when logoff
function resetNotificationLable(state){
	document.getElementById("notification").style.display = state;
}
