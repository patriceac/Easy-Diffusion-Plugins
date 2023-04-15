/*
    Daily Folders
    by Patrice

    Format folder names as YYYY-MM-DD for saving images (one folder per day).
*/
(function () {
    let d = new Date();
    SD.sessionId = d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2)
})()
