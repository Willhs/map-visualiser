

var users = [];
var currentUser = new userObject("obama","http://localhost:3000/image/userImage/obama.jpeg" );
function userObject(fname, image){
	this.fname = fname;
	this.userImage = image;
}
//var userInfo = {
//user: currentUser,

//setUser: function(name,image){
//if(currentUser.fname==name) {
//this.user = currentUser;
//record.setUser(this.user);

//}

//this.user = new userObject(name, image);
//record.setUser(this.user);
//users.push(this.user);

//},

//getUser: function(){
//this.user!=null? this.user : this.user = new userObject("obama","http://localhost:3000/image/userImage/obama.jpeg");
//record.setUser(this.user);
//},
//getUserName: function(){
//console.log(this.user.fname);
//return this.user.fname != null? this.user.fname : "obama";
//},
//isEmpty: function(){
//return this.user==null;
//}

//}

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
	checkUsersName(fname,srcAdd);

	$.ajax({
		type: 'GET',
		url: "/getNotification",
		success: notification,
		dataType: "json",
		complete: function(){ console.log("get complete"); }
	});
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
var temp = {
		user: null,
		events : [], // events that took place over the course of the exploration
		firstEventTime : null,
}

function handleFileUpload(file){

	fr = new FileReader();
	fr.onload = receivedText;
	fr.readAsText(file);
	function receivedText() {
		var fileRecord = JSON.parse(fr.result);
		// replaces properties of local record.
		temp.events = fileRecord.events;
		temp.user = fileRecord.user;
		temp.firstEventTime = fileRecord.firstEventTime;
	}
}

function saveFileToSharedUser(name){
	//temp.user.fname = name;
	$.ajax({
		type: 'POST',
		url: "/postFile",//url of receiver file on server
		data: {"file":JSON.stringify(temp, null, 4),"to":name, "from":currentUser.fname },
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		dataType: "json" //text/json...

	});
}

function loadFileButtonFunction(){
	handleFileUpload(document.getElementById("load-file-button").files[0]);
}
//if current user in users array return if not add to users array
function checkUsersName(userName, srcAdd){
	var inUserArray = false;
	for (user in users){
		if(users[user].fname.localeCompare(userName)==0){
			alert("user name already used please choose another name");
			inUserArray = true;
		}
	}
	if(inUserArray==false){
		console.log("inUserArray flase 1: "+ srcAdd + "  name: "+ userName);
		currentUser = new userObject(userName,srcAdd);
		console.log("inUserArray flase 2: "+ srcAdd);
		users.push(currentUser);
		record.user = currentUser;
		saveUser();
	}
}

