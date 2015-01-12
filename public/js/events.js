//-------------- event handling for DOM elements ----------------

var sideBar =  document.getElementById("sideBar"),
recordExplButton = document.getElementById("record-exploration-button"),
playExplButton = document.getElementById("play-exploration-button"),
pauseExplButton = document.getElementById("pause-exploration-button"),
stopExplButton = document.getElementById("stop-exploration-button"),
saveExplButton = document.getElementById('save-exploration-button'),
resetExplButton = document.getElementById("reset-exploration-button"),
explChooser = document.getElementById("exploration-selector"),
userNameInput = document.getElementById("userName-input"),
passwordInput = document.getElementById("password-input"),
logonButton = document.getElementById("submit-userandpassword"),
delButton = document.getElementById("delExplButton"),
messageBar = document.getElementById("percent");
processBar = document.getElementById("progress");

//explorations

recordExplButton.addEventListener("click", function(){
	if (recording)
		stopRecording();
	else
		startRecording();
});

playExplButton.addEventListener('click', function () {
	var lastTime = selectedExploration.getEvent(selectedExploration.events.length-1).time;
	var firstTime = selectedExploration.getEvent(0).time
	var totalDruation = lastTime - firstTime;
	processBar.max = totalDruation;
	startPlayBack(selectedExploration);


});

pauseExplButton.addEventListener('click', function(){
	//requestPause = true;
	stopPlayBack(selectedExploration, "pause");
});

stopExplButton.addEventListener('click', function(){
	stopPlayBack(selectedExploration, "stop");
});

saveExplButton.onclick = saveExploration;

resetExplButton.onclick = resetExplorations;

explChooser.onclick = function(){
	if (explChooser.selectedIndex === -1)
		return;

	var explTimeStamp = explChooser.options[explChooser.selectedIndex].id;
	var userExpl = currentUser.getExploration(explTimeStamp);
	stopRecording();
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
//share button
document.getElementById("submit-shareFile").addEventListener('click',function(){

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
var newAccount = document.getElementById("createNewAccount");
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
	console.log(selectedExploration);
	deleteExploration(selectedExploration);

	deselectExploration();
};
processBar.addEventListener("click", function(event){
	if(selectedExploration==null)return;
	var cursorX = event.clientX;
	//var barLeft = sideBar.style.left;
	var windowWidth = $(window).width();
	//var barLeft = sideBar.getBoundingClientRect().left - 3;
	var barLeft = windowWidth*0.81+17.05;
	//var barRight = barLeft+288;
	var realBarX = cursorX - barLeft;
	console.log("realBarX: "+ realBarX);
	var events = selectedExploration.events;
	var eventLength =  288/events.length;
	var eventIndex = function(){
		var temp = 288/events.length;
		for(var i = 0; i<events.length; i++){
			if(realBarX>=temp-eventLength && realBarX<=temp){
				index = i;
				return i;
			}
		temp += eventLength;
		}
	};
	console.log("events["+eventIndex()+"].time: "+ events[eventIndex()].time +"    "+ events[0].time);
	processBar.value = events[eventIndex()].time;
	console.log("processBar.value: "+ processBar.value);

});
