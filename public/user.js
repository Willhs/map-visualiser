var currentUser = new userObject("obama","http://localhost:3000/image/userImage/obama.jpeg" );

function userObject(fname, image){
	this.fname = fname;
	this.userImage = image;
}

function setButtonAndSetUser(fname){
	refreshLocationInfo();
	setButtonBorderColorOff(fname);
	document.getElementById(fname).style.borderColor = "red";
	var srcAdd = document.getElementById(fname).src;
	currentUser = new userObject(fname,srcAdd);
	record.user = currentUser;
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
		data: JSON.stringify({
			"file": record, 
			"to": name, 
			"from": currentUser.fname 
		}),
		success: function(response){ console.log(response); }, //callback when ajax request finishes
		contentType: "application/json"
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
