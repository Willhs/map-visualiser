//var notifications;
var currentUser = new userObject("obama","http://localhost:3000/image/userImage/obama.jpeg" );

function userObject(fname, image){
	this.fname = fname;
	this.userImage = image;
	this.sharedFileTimeStamp = [];
	this.sharedEventsFromOther = [];
	this.reset = function(){
		this.sharedFileTimeStamp = [];
		this.sharedEventsFromOther = [];
	}
}
function userAndSharedEvents(user, events){
	this.user =user;
	this.events = events;
	function getName (){
		return this.user.fname;
	}
}

function setButtonAndSetUser(fname){
	refreshLocationInfo();
	//removeLabels();
	setButtonBorderColorOff(fname);
	document.getElementById(fname).style.borderColor = "red";
	var srcAdd = document.getElementById(fname).src;
	currentUser = new userObject(fname,srcAdd);
	record.user = currentUser;
	$.ajax({
		type: 'GET',
		url: "/getNotification",
		data: fname,
		success: notification,
		dataType: "json",
		complete: function(){ console.log("get complete"); }
	});

}

function notification(data){

	if (data == "no_notifications"){
		$("#notification").html("no files in shared folder");
	}
	else {
		$("#notification").html("have "+ data.length + " files in shared folder");
		addAllSharedFilesTimeStamp(data);

	}
}
function addAllSharedFilesTimeStamp(files){
	if(files.length!=0){
		for (var i = 0; i<files.length; i++){
			from = files[i].user.sharedFileTimeStamp;
			if(from.length!=0){
				currentUser.sharedEventsFromOther.push(new userAndSharedEvents(files[i].user,files[i].events) );
				for(var j = 0; j<from.length; j++){
					var to = currentUser.sharedFileTimeStamp;
					if(!contains(from[j], to )){
						to.push(from[j]);
					}
				}
			}
		}
	}


}

function contains( a, obj){
	for(var i = 0; i<obj.length; i++){
		if(typeof(a)==String){
			if(obj[i].localeCompare(a)==0){
				return true;
			}
		}
		//else if(obj[i].events.length ==a.length && obj[i].user.fname == a.user.fname){
		else if(obj[i]===a){
			return true;
		}
	}
	return false;
}

function setButtonBorderColorOff(name){
	var userNames = ['obama','john','lorde','will'];
	for(var i = 0; i< userNames.length; i++){

		if(name != userNames[i])
			document.getElementById(userNames[i]).style.borderColor = "black";
	}
}

function saveFileToSharedUser(name){
	//sharedRecord.user.fname = name;
	//currentUser.sharedFileTimeStamp.push();

	$.ajax({
		type: 'POST',
		url: "/shareExploration",//url of receiver file on server
		data: {"file":JSON.stringify(record, null, 4),"to":name, "from":currentUser.fname, "timestamp": record.startTimeStamp},
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		dataType: "json" //text/json...

	});
}
function saveFileToPlayedShared(file){
	console.log("save file to played shared folder");
	$.ajax({
		type: 'POST',
		url: "/saveSharedPlayed",//url of receiver file on server
		data: {"filePlayed":JSON.stringify(file, null, 4),"from": currentUser.fname,"to":file.fromuser,"timestamp": record.startTimeStamp},
		success: function(response){ console.log(response) }, //callback when ajax request finishes
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
		success: function(response){ console.log(response) }, //callback when ajax request finishes
	})
}
function deletePlayedFromSharedFolder(playedFile){
	console.log("delete shared Played File");
	$.ajax({
		type: 'POST',
		url: "deletePlayed",
		data: { "playedFile": JSON.stringify(playedFile, null, 4) },
		dataType: "json",
		success: function(response){ console.log(response) }, //callback when ajax request finishes
	})
}

function showListNotifications(){
	var temp1 = currentUser.sharedEventsFromOther;
	var temp2 = currentUser.sharedFileTimeStamp;
	var idDiv = "notification-files";
	var idLabel = "notification-file";
	var div = document.getElementById(idDiv);
	removeLabels("notification-files");
	if(temp2.length!=0){
		divHideShow(div);
		//document.getElementById("notification-files").style.display = "inline";
		for(var i = 0; i<temp2.length; i++){
			var newLabel = document.createElement('label');
			newLabel.setAttribute("for", idLabel +i);
			newLabel.setAttribute("id", currentUser.fname+i);
			newLabel.innerHTML = "<"+i+"> "+"From: "+temp1[i].user.fname + " Date: "+ temp2[i].substring(5,20);

			var deleteButton = addDeleteButton();
			deleteButton.onclick = function () {
				if(checkMatchedTimeStamp()==0){
					saveFileToPlayedShared(record);
					deletePlayedFromSharedFolder(record);
					removeFromSharedFileTimeStamp(record);
				}else{console.log(" equals false")}
			}
			newLabel.appendChild(deleteButton);

			div.appendChild(newLabel);

			var linebreak = document.createElement("br");
			div.appendChild(linebreak);
			addLabelListener(i,currentUser.fname+i);
		}
	}
}
function addDeleteButton(){
	var deleteButton = document.createElement("input");
	deleteButton.type = "image";
	deleteButton.src = "image/delete.png";
	deleteButton.style.width = "20px";
	deleteButton.style.height = "20px";
	return deleteButton;
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

function addLabelListener(index,id){
	document.getElementById(id).addEventListener('click',function(){
		addListener(index);
	});
}
function addListener(index){
	record.events = [];
	record.events = currentUser.sharedEventsFromOther[index].events;
	record.startTimeStamp = currentUser.sharedFileTimeStamp[index];

	playRecording();
}
function divHideShow(div){
	if (div.style.display.localeCompare("inline")==0){
		//div.style.display = "none";
		setTimeout(function(){div.style.display = "none";},3000);
	}
	else{
		div.style.display = "inline";
		//setTimeout(function () {div.style.display = "none";}, 5000);
	}
}

function removeLabels(idName){
	var parent = document.getElementById(idName);
	while(parent.firstChild){//remove old labels
		parent.removeChild(parent.firstChild);
	}
}