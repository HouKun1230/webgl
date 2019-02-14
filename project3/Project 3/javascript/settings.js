function saveChanges() {
	var LightingDirectAccess = document.Settings["Lighting"];
	localStorage.Lighting = LightingDirectAccess.value;

	var DirectionDirectAccess = document.Settings["Direction"];
	localStorage.Direction = DirectionDirectAccess.value;

	var BranchCountSelectionDirectAccess = document.Settings["BranchCountSelection"];
	if (BranchCountSelectionDirectAccess.value == "Random") {
		localStorage.BranchCountRandom = true;
	} else {
		localStorage.BranchCountRandom = false; // then set to 1 as default
	}

	var BranchLengthSelectionDirectAccess = document.Settings["BranchLengthSelection"];
	if (BranchLengthSelectionDirectAccess.value == "Random") {
		localStorage.BranchLengthRandom = true;
	} else {
		localStorage.BranchLengthRandom = false; // then set to 1 as default
	}

	var BranchLengthDirectAccess = document.Settings["BranchLength"];
	if (BranchLengthDirectAccess.value != "") {
		localStorage.BranchLength = BranchLengthDirectAccess.value;
	}

	var BranchCountDirectAccess = document.Settings["BranchCount"];
	if (BranchCountDirectAccess.value != "") {
		localStorage.BranchCount = BranchCountDirectAccess.value;
	}

	return false; // prevent further bubbling of event
}

// this is used to preselect the radio button
var onLoadFunction = function () {
	document.Settings["Lighting"].value = getLighting();
	document.Settings["Direction"].value = getBranchDirection();

	if (isBranchCountRandom() == "true") {
		document.Settings["BranchCountSelection"].value = "Random";
	} else {
		document.Settings["BranchCountSelection"].value = "Custom";
	}

	if (isBranchLengthRandom() == "true") {
		document.Settings["BranchLengthSelection"].value = "Random";
	} else {
		document.Settings["BranchLengthSelection"].value = "Custom";
	}

	document.Settings["BranchCount"].value = getCustomBranchCount();
	document.Settings["BranchLength"].value = getCustomBranchLength();
}

var getLighting = function () {
	if (localStorage.Lighting == undefined) {
		localStorage.Lighting = "true"; // then set to 1 as default
	}
	return localStorage.Lighting;
}

var isBranchCountRandom = function () {
	if (localStorage.BranchCountRandom == undefined) {
		localStorage.BranchCountRandom = "true"; // then set to 1 as default
	}
	return localStorage.BranchCountRandom;
}

var getCustomBranchCount = function () {
	if (localStorage.BranchCount == undefined) {
		localStorage.BranchCount = "8"; // then set to 1 as default
	}
	return localStorage.BranchCount;
}

var isBranchLengthRandom = function () {
	if (localStorage.BranchLengthRandom == undefined) {
		localStorage.BranchLengthRandom = "true"; // then set to 1 as default
	}
	return localStorage.BranchLengthRandom;
}

var getCustomBranchLength = function () {
	if (localStorage.BranchLength == undefined) {
		localStorage.BranchLength = "4"; // then set to 1 as default
	}
	return localStorage.BranchLength;
}

var getBranchDirection = function () {
	if (localStorage.Direction == undefined) {
		localStorage.Direction = "Random"; // then set to 1 as default
	}
	return localStorage.Direction;
}
