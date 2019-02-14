var isLocalStorageSupported = function () {
    if (typeof (Storage) !== "undefined") {
        // Code for localStorage/sessionStorage.
        return true;
    } else {
        // Sorry! No Web Storage support..
        return false;
    }
}
