/**
 *
 */
var currentUser = new user("obama","http://localhost:3000/image/userImage/obama.jpeg" );
function user(fname, image){
	this.fname = fname;
	this.userImage = image;
}
//var userInfo = {
//		user: currentUser,
//
//		setUser: function(name,image){
//			if(currentUser.fname==name) {
//				this.user = currentUser;
//				record.setUser(this.user);
//
//			}
//
//			this.user = new userObject(name, image);
//			record.setUser(this.user);
//			users.push(this.user);
//
//		},
//
//		getUser: function(){
//			this.user!=null? this.user : this.user = new userObject("obama","http://localhost:3000/image/userImage/obama.jpeg");
//			record.setUser(this.user);
//		},
//		getUserName: function(){
//			console.log(this.user.fname);
//			return this.user.fname != null? this.user.fname : "obama";
//		},
//		isEmpty: function(){
//			return this.user==null;
//		}
//
//}

function saveUser(){
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
	currentUser = new user(fname,document.getElementById(fname).src);
	record.user = currentUser;
	saveUser();
}
function setButtonBorderColorOff(name){
	var userNames = ['obama','john','lorde','will'];
	for(var i = 0; i< userNames.length; i++){

		if(name != userNames[i])
			document.getElementById(userNames[i]).style.borderColor = "black";
	}
}
function saveFileToSharedUser(name){
	temp.user.fname = name;
	console.log("record name: "+ record.user.fname+"   temp name: " + temp.user.fname);
	temp.user.userImage = "http://localhost:3000/image/userImage/"+name+".jpeg";
	$.ajax({
		type: 'POST',
		url: "/postFile",//url of receiver file on server
		data: {"file":JSON.stringify(temp, null, 4),"name": temp.fname},
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		dataType: "json" //text/json...

	});
}

var temp = null;
function handleFileUpload(file){

	fr = new FileReader();
	fr.onload = receivedText;
	fr.readAsText(file);
	function receivedText() {
		var fileRecord = JSON.parse(fr.result);
		// replaces properties of local record.
		temp.events = fileRecord.events;
		temp.firstEventTime = fileRecord.firstEventTime;

		console.log(record.numEvents() + " events add from exploration file");
	}
}
