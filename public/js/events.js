//-------------- event handling for DOM elements ----------------

var recordExplButton = document.getElementById("record-exploration-button"),
playExplButton = document.getElementById("play-exploration-button"),
pauseExplButton = document.getElementById("pause-exploration-button"),
stopExplButton = document.getElementById("stop-exploration-button"),
saveExplButton = document.getElementById('save-exploration-button'),
deleteExplButton = document.getElementById('delete-exploration-button'),
resetExplButton = document.getElementById("reset-exploration-button"),
explChooser = document.getElementById("exploration-selector"),
userNameInput = document.getElementById("username-input"),
passwordInput = document.getElementById("password-input"),
logonButton = document.getElementById("logon-button"),
messageBar = document.getElementById("percent"),
notificationLabel = document.getElementById("notification"),
removeNotification = document.getElementById("remove-notification"),
quickplayNotification = document.getElementById("quickplay-notification"),
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

	var userLabelValue = document.getElementById("user-input").value;
	console.log("user-input: "+userLabelValue);
	if(userLabelValue!=null && userLabelValue!=currentUser.name && selectedExploration!=null){
		saveFileToSharedUser(userLabelValue);
		var selectedExplName = selectedExploration.name;
		document.getElementById("expl-sent-message").innerHTML = "Sent to: "+userLabelValue+ "     ExplName:"+ selectedExplName;
	}
});
//notifications
notificationLabel.addEventListener('click',function(){
	notificationLabel.display = "none";
	stopRecording();
	showListNotifications();
});

//new account
var myWindow;
var newAccount = document.getElementById("create-new-account");
newAccount.onclick = function(){
	myWindow = window.open("newAccountPopupWindow.html", "_blank", "toolbar=yes, scrollbars=no, resizable=no, top=500, left=800, width=270, height=180");
};

//remove current choice exploration
deleteExplButton.onclick = function(){
	deleteExploration(selectedExploration);
	deselectExploration();
};

removeNotification.addEventListener("click", function(){
	var selected = currentUser.getSharedExploration()[notificationSelector.options[notificationSelector.selectedIndex].value];
	selected.isNew = false;
	setExplorationIsOld(selected);
	notificationSelector.style.display = "none";
	removeNotification.style.display = "none";
	quickplayNotification.style.display = "none";
	updateNotifications();
});
quickplayNotification.addEventListener("click", function(){
	playExploration(currentUser.getCurrentExploration());
});