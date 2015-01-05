//-------------- event handling for DOM elements ----------------
/*p
// paths
var goToCity = document.getElementById("go-to-city");
goToCity.addEventListener("click", function () { goToLoc(document.getElementById('city-list').value); });
document.getElementById("add-to-path").onclick = function () { addToPath(document.getElementById('city-list').value); }
document.getElementById("remove-from-path").onclick = function () { removeFromPath(getSelectedInPath(document.getElementById('path-list'))); }
document.getElementById("follow-path").onclick = function () { followPath(0); }
document.getElementById('save-path').onclick = function () { savePath(); }

document.getElementById("upload-path").addEventListener('change', function () {
	handlePathUpload(document.getElementById("upload-path").files[0]);
}, false);*/

//explorations
var recordExplButton = document.getElementById("record-exploration-button");
recordExplButton.addEventListener("click", function(){
	if (recording)
		stopRecording();
	else
		startRecording();
});

var playExplButton = document.getElementById("play-exploration-button");
playExplButton.addEventListener('click', function () {
	playBackExploration(selectedExploration);
});

var stopExplButton = document.getElementById("stop-exploration-button");
stopExplButton.addEventListener('click', function(){ stopPlayBack(selectedExploration); });

var saveExplButton = document.getElementById('save-exploration-button');
saveExplButton.onclick = saveExploration;

var resetExplButton = document.getElementById("reset-exploration-button");
resetExplButton.onclick = reset;

var explChooser = document.getElementById("exploration-selector");
explChooser.onclick = function(){
	var explTimeStamp = explChooser.options[explChooser .selectedIndex].id;
	var userExpl = currentUser.getExploration(explTimeStamp);
	selectExploration(userExpl);

};

//users
var users = ["obama", "john", "lorde", "will"];

users.forEach(function(userName){
	document.getElementById(userName).onclick= function() {
		document.getElementById("userName-input").value = userName;
	};
});


//submit button
document.getElementById("submit-userandpassword").onclick = function(){
	var userName = document.getElementById("userName-input").value;
	var password = document.getElementById("passwrod-input").value;
	if(!password){
		alert("password can not be null");
	}
	else{

		attemptLogon(userName,password);
		//loadAllFiles();
	}
};
// share button
document.getElementById("submit-shareFile").addEventListener('click',function(){

	var userLabelValue = document.getElementById("userId").value;
	console.log("userID: "+userLabelValue);
	if(userLabelValue!=null){
		saveFileToSharedUser(userLabelValue);
	}
});
// notifications
document.getElementById("notification").addEventListener('click',function(){
	showListNotifications();
});
