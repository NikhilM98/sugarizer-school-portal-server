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
	case "short-name":
		return /^[a-z0-9]{3,32}$/i;
	case "email":
		//All alphanumeric characters case insensitive
		return /^([a-zA-Z0-9_\-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
	case "language":
		return /^en$|^es$|^fr$|^hi$/;
	case "address":
		return /^[#.0-9a-zA-Z\s,-]+$/;
	case "number":
		return /^[0-9]+$/i;
	case "devices":
		return /^desktop$|^laptop$|^mobile$|^tablet$/;
	default:
		//All alphanumeric characters case insensitive
		return /^[a-z0-9]+$/i;
	}
};
