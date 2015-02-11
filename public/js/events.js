//-------------- event handling for DOM elements ----------------


// ######### guest users #############################

var guestUsers = ["obama", "john", "lorde", "will"];

guestUsers.forEach(function(userName){
	document.getElementById(userName).onclick= function() {
		userNameInput.value = userName;
		passwordInput.value = "password";
	};
});
// #################################################
// ######### exploration controls #################

recordExplButton.addEventListener("click", function(){
	if (recording){
		stopRecording();
		if (inserting)
			insertIntoSelectedExploration(currentUser.getCurrentExploration());
	}
	else
		startRecording();
});

playExplButton.on('click', function () {
	if (paused)
		resumePlayback(selectedExploration);
	else startPlayback(selectedExploration);
});

pauseExplButton.on('click', function(){
	pausePlayback(selectedExploration);
});

stopExplButton.on('click', function(){
	stopPlayback(selectedExploration);
});

saveExplButton.click(function(){
	saveExploration(currentUser.getCurrentExploration());
});

deleteExplButton.click(function(){
	if (selectedExploration)
		deleteExploration(selectedExploration);
});

resetExplButton.click(resetExplorations);

// ##########################################
// ######## exploration chooser and login

explChooser.onclick = updateSelectedExploration;

showPathButton.onclick = toggleVisablePath;

//submit button
logonButton.onclick = function(){
	// if noone is logged on
	if(userLoggedOn()){
		if (!recording)
			logout(currentUser);
	}
	else{
		attemptLogin(userNameInput.value, passwordInput.value);
	}
};

// #########################################
// ############# share button #############

document.getElementById("submit-shared-file").addEventListener('click',function(){

	var userLabelValue = document.getElementById("user-input").value;
	if(userLabelValue != null && userLabelValue != currentUser.name && selectedExploration != null){
		shareFile(selectedExploration, userLabelValue);		
	}
});

// ##########################################
// ############## create new account #######
var myWindow;
var newAccount = document.getElementById("create-new-account");
newAccount.onclick = function(){
	myWindow = window.open("newAccountPopupWindow.html", "_blank", "toolbar=yes, scrollbars=no, resizable=no, top=500, left=800, width=270, height=180");
};

// ##########################################
// ############### notifications ###########

notificationContainer.addEventListener('click',function(){
	stopRecording();
	if(showListNotifications()){
		divHideShow(notificationSelector);
		divHideShow(removeNotification);
		divHideShow(quickplayNotification);

	}
	else{
		setNotificationButtonOff();
	}
});

removeNotification.addEventListener("click", function(){
	var selected = currentUser.getSharedExploration()[notificationSelector.options[notificationSelector.selectedIndex].value];
	selected.isNew = false;
	setExplorationIsOld(selected);

	setNotificationButtonOff();
	updateNotifications();
	deselectExploration();
});

quickplayNotification.addEventListener("click", function(){
	selected = currentUser.getSharedExploration()[notificationSelector.options[notificationSelector.selectedIndex].value];
	startPlayback(selected);
	selected.isNew = true;
	updateNotifications();
});

// ##########################################
// ########### inserting ##################

insertButton.click(function(){
	inserting = true;
	startRecording();
	insertButton.css("visibility", "hidden");
	var time = getCurrentPlaybackTime();
	var xpos = progressBar.getXPosOfTime(time);
	progressBar.showInsertGraphics(xpos);
});

stopInsertButton.click( function(){
	var currentExpl = currentUser.getCurrentExploration();

	// either wait for audio to finish converting to wav
	if (audioRecorder){
		stopRecording(doneRecording);
	}
	else {
		stopRecording();
		doneRecording();
	}

	function doneRecording(){
		inserting = false;

		var insertionDuration = currentExpl.getDuration();
		var currentTime = getCurrentPlaybackTime();

		insertIntoSelectedExploration(currentExpl);

		// gui stuff
		progressBar.hideInsertGraphics();
		progressBar.showInsertedChunk(currentTime, insertionDuration);
	}
});

// ---- INIT
resetExplorations();