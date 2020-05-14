console.log("Hello World");

function setModalContent(content) {
	document.getElementById('releaseName').innerText= content.name;
	document.getElementById('releaseNamespace').innerText= content.namespace;
	document.getElementById('releaseRevision').innerText= content.revision;
	document.getElementById('releaseUpdated').innerText= content.updated;
	document.getElementById('releaseStatus').innerText= content.status;
	document.getElementById('releaseChart').innerText= content.chart;
	document.getElementById('releaseAppVersion').innerText= content.app_version;
}
