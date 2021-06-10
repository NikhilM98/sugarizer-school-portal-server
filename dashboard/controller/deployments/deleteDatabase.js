var MongoClient = require("mongodb");

exports.deleteDatabase = function (settings){
	
	var url = 'mongodb://localhost:27017/';
	var databasename = settings.database.name; // Database name

	MongoClient.connect(url).then(function (client) {
  
		// Reference of database
		var connect = client.db(databasename);
  
		// Dropping the database
		connect.dropDatabase();
  
		console.log("Database deletion successful");
	}).catch(function (err) {
		console.log(err.Message);
	});
};
