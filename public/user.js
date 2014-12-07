

var currentUser = new userObject("obama","http://localhost:3000/image/userImage/obama.jpeg" );
function userObject(fname, image){
	this.fname = fname;
	this.userImage = image;
}

function saveUser(){
	console.log("saveuser: "+currentUser.fname);
	$.ajax({
		type: 'POST',
		url: "/postUser",//url of receiver file on server
		data: {"user":JSON.stringify(currentUser, null, 4),"name": currentUser.fname},
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		dataType: "json" //text/json...
	});
}

function setButtonAndSetUser(fname){
	setButtonBorderColorOff(fname);
	document.getElementById(fname).style.borderColor = "red";
	var srcAdd = document.getElementById(fname).src;
	currentUser = new userObject(fname,srcAdd);
	record.user = currentUser;
	//saveUser();
//	$.ajax({
//		type: 'GET',
//		url: "/getNotification",
//		success: notification,
//		dataType: "json",
//		complete: function(){ console.log("get complete"); }
//	});
}
var numberOfFiles = 0;
function notification(notifications){
	console.log(notifications);
	if (notifications === "no_sharedFiles") numberOfFiles = 0;
	else numberOfFiles =  1;
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
	$.ajax({
		type: 'POST',
		url: "/shareExploration",//url of receiver file on server
		data: {"file":JSON.stringify(record, null, 4),"to":name, "from":currentUser.fname },
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		dataType: "json" //text/json...

	});
}
