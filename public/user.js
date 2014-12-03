var userInfo = {
	user: "obama",
	//records: null,
	image: "http://localhost:3000/image/userImage/obama.jpeg ",
	setUser: function(name){
		this.user = name;
		console.log(name);
	},
//	setRecord: function(records){
//		this.records = records;
//	},
	setImage: function(image){
		this.image = image;
		console.log("image add: " + image);
	},
	isEmpty: function(){
		return this.user==null && this.image == null;
	}

}

function saveUser(){
	$.ajax({
		type: 'POST',
		url: "/postUser",//url of receiver file on server

		data: {"user":JSON.stringify(userInfo, null, 4),"userName": userInfo.user},
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		dataType: "json"

	});
}

