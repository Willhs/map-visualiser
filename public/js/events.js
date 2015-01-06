//-------------- event handling for DOM elements ----------------

var recordExplButton = document.getElementById("record-exploration-button"),
	playExplButton = document.getElementById("play-exploration-button"),
	stopExplButton = document.getElementById("stop-exploration-button"),
	saveExplButton = document.getElementById('save-exploration-button'),
	resetExplButton = document.getElementById("reset-exploration-button"),
	explChooser = document.getElementById("exploration-selector"),
	userNameInput = document.getElementById("userName-input"),
	passwordInput = document.getElementById("password-input"),
	logonButton = document.getElementById("submit-userandpassword");


//explorations

recordExplButton.addEventListener("click", function(){
	if (recording)
		stopRecording();
	else
		startRecording();
});

playExplButton.addEventListener('click', function () {
	startPlayBack(selectedExploration);
});

stopExplButton.addEventListener('click', function(){ stopPlayBack(selectedExploration); });

saveExplButton.onclick = saveExploration;

resetExplButton.onclick = reset;

explChooser.onclick = function(){
	if (explChooser.selectedIndex === -1)
		return;
	var explTimeStamp = explChooser.options[explChooser.selectedIndex].id;
	var userExpl = currentUser.getExploration(explTimeStamp);
	selectExploration(userExpl);

};

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
	if(currentUser){		
		logout(currentUser);
	}
	else{
		attemptLogon(userNameInput.value, passwordInput.value);
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

//new account
var myWindow;
var newAccount = document.getElementById("createNewAccount");
newAccount.onclick = function(){
	myWindow = window.open("newAccountPopupWindow.html", "_blank", "toolbar=yes, scrollbars=no, resizable=no, top=500, left=800, width=270, height=150");
};