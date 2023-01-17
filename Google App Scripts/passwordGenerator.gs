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
  var usedIndexes = [];
  var retVal = "";
  for (var i = 0; i < length  ; ++i) {
    Logger.log("usedIndexes: "+retVal.length+usedIndexes.length);
    var arrayKey = Math.floor(Math.random() * charset.length);
    Logger.log("arraykey:"+retVal.length +3);
    if(!usedIndexes.includes(arrayKey)){
      usedIndexes.push(arrayKey);
    }
    var m = charset[arrayKey].length;
    retVal += charset[arrayKey].charAt(Math.floor(Math.random() * m));
    Logger.log(retVal);
    if(retVal.length >= len && usedIndexes.length <charset.length){
      length++;
    }
  }
  var resp = {
    'password': retVal
  };
  return ContentService.createTextOutput(JSON.stringify(resp)).setMimeType(ContentService.MimeType.JSON);
}
