/**
 *
 */
function createNewUser(user){
	
}

function saveUser(){
	$.ajax({
		type: 'POST',
		url: "/postUser",//url of receiver file on server
		data: {"user":JSON.stringify(record, null, 4)},
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		dataType: "json" //text/json...

	});
}