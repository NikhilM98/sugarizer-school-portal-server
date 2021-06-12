// Handle to wait for db connection
var mongo = require('mongodb');
var settings = require('./settings').load();
//- Utility functions

// Init database
exports.deleteDB = function() {

	var client = createConnection(settings);

	// Open the db
	client.connect(function(err, client) {
		if (!err) {
			var db = client.db(settings.database.name);
			db.dropDatabase(function(err, res) {
				if(err) console.log("Error:" + err.message);
				console.log("Result of the operation: " +res);
				console.log("Your " + db.databaseName + "database has been deleted");
			});
		} else {
			console.log(err.message);
		}
	});
};

function createConnection(settings) {
	return new mongo.MongoClient(
		settings.database.replicaset ? 'mongodb://'+settings.database.server+'/'+settings.database.name+'?replicaSet=rs0' : 'mongodb://'+settings.database.server+':'+settings.database.port+'/'+settings.database.name,
		{auto_reconnect: false, w:1, useNewUrlParser: true, useUnifiedTopology: true });
}
