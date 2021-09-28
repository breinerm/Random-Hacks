function doGet(e) {
  var pw = generatePassword(12);
  return pw;
}

function generatePassword(len) {
  //the length of the password
  var length = len;
  var charset = [
    "0123456789",
    "abcdefghijklmnopqrstuvwxyz",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "!&$@*^()"
  ];
  var retVal = "";
  for (var i = 0; i < length; ++i) {
    var arrayKey = Math.floor(Math.random() * charset.length);
    var m = charset[arrayKey].length;
    retVal += charset[arrayKey].charAt(Math.floor(Math.random() * m));
  }
  var resp = {
    'password': retVal
  };
  return ContentService.createTextOutput(JSON.stringify(resp)).setMimeType(ContentService.MimeType.JSON);
}