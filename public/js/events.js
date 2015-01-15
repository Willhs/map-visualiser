//-------------- event handling for DOM elements ----------------

var recordExplButton = document.getElementById("record-exploration-button"),
	playExplButton = document.getElementById("play-exploration-button"),
	pauseExplButton = document.getElementById("pause-exploration-button"),
	stopExplButton = document.getElementById("stop-exploration-button"),
	saveExplButton = document.getElementById('save-exploration-button'),
	resetExplButton = document.getElementById("reset-exploration-button"),
	explChooser = document.getElementById("exploration-selector"),
	userNameInput = document.getElementById("username-input"),
	passwordInput = document.getElementById("password-input"),
	logonButton = document.getElementById("logon-button"),
	delButton = document.getElementById("delete-button"),
	messageBar = document.getElementById("percent"),	
	scrubber = document.getElementById("scrubber");
	notificationSelector = document.getElementById("notification-selector");

//explorations

recordExplButton.addEventListener("click", function(){
	if (recording)
		stopRecording();
	else
		startRecording();
});

playExplButton.addEventListener('click', function () {
	if (!paused)
		startPlayback(selectedExploration);
	else resumePlayback(selectedExploration);
});

pauseExplButton.addEventListener('click', function(){
	pausePlayback(selectedExploration);
});

stopExplButton.addEventListener('click', function(){
	stopPlayback(selectedExploration);
});

saveExplButton.onclick = saveExploration;

resetExplButton.onclick = resetExplorations;

explChooser.onclick = updateSelectedExploration;

//users
var guestUsers = ["obama", "john", "lorde", "will"];

guestUsers.forEach(function(userName){
	document.getElementById(userName).onclick= function() {
		userNameInput.value = userName;
		passwordInput.value = "password";
	};
});

//submit button
logonButton.onclick = function(){

	// if noone is logged on
	if(userLoggedOn()){
		if (!recording)
			logout(currentUser);
	}
	else{
		attemptLogon(userNameInput.value, passwordInput.value);
	}
};
//share button
document.getElementById("submit-shared-file").addEventListener('click',function(){

	var userLabelValue = document.getElementById("userId").value;
	console.log("userID: "+userLabelValue);
	if(userLabelValue!=null){
		if(selectedExploration!=null){
			saveFileToSharedUser(userLabelValue);
			document.getElementById("to").innerHTML = "To: exploration sent to " +userLabelValue;
		}
	}
});
//notifications
document.getElementById("notification").addEventListener('click',function(){
	showListNotifications();
});

//new account
var myWindow;
var newAccount = document.getElementById("create-new-account");
newAccount.onclick = function(){
	myWindow = window.open("newAccountPopupWindow.html", "_blank", "toolbar=yes, scrollbars=no, resizable=no, top=500, left=800, width=270, height=180");
};

//remove current choice exploration
delButton.onclick = function(){
	if(selectedExploration==null){
		return;
	}
	if(currentUser.explorations.indexOf(selectedExploration)<0){
		return;
	}
	deleteExploration(selectedExploration);

	deselectExploration();
};

// init
resetExplorations();