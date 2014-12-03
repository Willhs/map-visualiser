function user(name){
	userInfo.setUser(name);
}
var userInfo = {
	user: null,
	records:null,
	setUser: function(name){
		this.user = name;
	},
	setRecord: function(records){
		this.records = records;
	}
}

function saveUser(){
	$.ajax({
		type: 'POST',
		url: "/postUser",//url of receiver file on server

		data: {"user":JSON.stringify(userInfo, null, 4)},
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		dataType: "json"

	});
}

