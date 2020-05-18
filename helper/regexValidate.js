module.exports = function(type) {
	switch (type) {
	case "name":
		//All Alphanumeric characters case insensitive + spaces
		return /^[a-z0-9 ]+$/i;
	case "pass":
		//All alphanumeric characters case insensitive
		return /^[a-z0-9]+$/i;
	case "username":
		return /^[a-z0-9_-]{3,32}$/i;
	case "email":
		//All alphanumeric characters case insensitive
		return /^([a-zA-Z0-9_\-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
	default:
		//All alphanumeric characters case insensitive
		return /^[a-z0-9]+$/i;
	}
};
