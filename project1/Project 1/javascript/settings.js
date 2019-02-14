function saveChanges() {
    var directAccess = document.Settings["DifficultyLevel"];
    // use local storage to save the settings
    // local storage is persisted
    localStorage.DifficultyLevel = directAccess.value;
    return false; // prevent further bubbling of event
}

// this is used to preselect the radio button
var onLoadFunction = function () {
    // if the difficulty level has never been set, then it would be undefned
    if (localStorage.DifficultyLevel == undefined) {
        localStorage.DifficultyLevel = "1"; // then set to 1 as default
    }
    // and set the radio button, similar to read
    document.Settings["DifficultyLevel"].value = localStorage.DifficultyLevel;
}
