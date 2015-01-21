
var selectedExploration = null; // currently selected exploration
var currentUser = null; // the user who is currently logged in

function User(name, explorations){
	this.name = name;
	this.explorations = explorations; //all explorations
	this.currentExpl = null; // a recording in progress (none at start)

	// add an exploration
	this.addExploration = function (expl){
		this.explorations.push(expl);
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
		var userExpl = null;
		this.explorations.forEach(function(expl){
			if (expl.timeStamp.localeCompare(timeStamp)==0){
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

	// removes the first exploration from the user
	this.removeExploration = function(exploration){
		for (var i = 0; i < this.explorations.length; i++){
			if (this.explorations[i].equals(exploration))
				this.explorations.splice(i, 1);
				return true;
		}
	}
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
		}
		else{
			alert("username/password are invalid");
		}
	}
}

function logon(name){

	currentUser = new User(name);
	loadAllExplorations(name, gotExplorations);

	function gotExplorations(allExplorations){
		currentUser.setExplorations(allExplorations);
		updateSideBar();
	}
}

function logout(){
	currentUser = null;
	deselectExploration();
	updateSideBar();

	disableAction("record");
//	resetNotificationLable("none");
//	document.getElementById("expl-sent-message").innerHTML = "";
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
		contentType: "application/json",		
	});

	function dealWithExplorations(explorations, cb){
		// input arrays contain objects with exploration data, but no methods.
		var allExplorationsData = JSON.parse(explorations);
		var explorationCount = allExplorationsData.length;

		if (explorationCount == 0){
			$("#noOfFilesLoaded").html("no exploration loaded");
		}
		else {
			$("#noOfFilesLoaded").html("have "+ explorationCount + " explorations loaded");
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

function userLoggedOn(){
	return currentUser;
}