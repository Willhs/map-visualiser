//-------------- event handling for DOM elements ----------------

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
	console.log("explIndex: " + explTimeStamp);
	var userExpl = currentUser.getExploration(explTimeStamp);
	console.log("userExpl: "+ userExpl);
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
var logonButton = document.getElementById("submit-userandpassword");
logonButton.onclick = function(){
	var userName = document.getElementById("userName-input");
	var password = document.getElementById("password-input");

	if(logonButton.value=="Logoff"){
		logonButton.value="Logon";
		document.getElementById("userName-input").disabled = false;
		document.getElementById("password-input").disabled = false;


		var userButtons = document.getElementsByClassName("user-button");
		Array.prototype.forEach.call(userButtons, function(userButton){
			if (userButton.id === userName.value){
				userButton.classList.add("other-user-button");
			}
		});
		currentUser = null;
		userName.value = "username";
		password.value = "password";
		disableAllButtons;
		disableAction("record");
		disableAction("reset");


	}
	else{
		if(!password.value){
			alert("password can not be null");
		}
		else{

			attemptLogon(userName.value,password.value);
			//loadAllFiles();
		}
	}


};
//share button
document.getElementById("submit-shareFile").addEventListener('click',function(){

	var userLabelValue = document.getElementById("userId").value;
	console.log("userID: "+userLabelValue);
	if(userLabelValue!=null){
		saveFileToSharedUser(userLabelValue);
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
	myWindow = window.open("newAccountPopupWindow.html", "_blank", "toolbar=yes, scrollbars=no, resizable=no, top=500, left=800, width=270, height=150");
};
