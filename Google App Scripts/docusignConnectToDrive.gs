// Function to back up all docusign envelopes utilizing docusign connect

function doPost(e) {
  uploadPDFToDrive(e);
  return HtmlService.createHtmlOutput("post request received");
}
  
function uploadPDFToDrive(x){
  var mainfolder = DriveApp.getFolderById("[FOLDERID]"); //Input google drive folder id where you want this all stored
  //var folders = mainfolder.getFolders();
  var xmlData = x.postData.contents;
  var ns = XmlService.getNamespace("http://www.docusign.net/API/3.0");
  xmlData = xmlData.replace(/=([a-zA-Z0-9\%-:]+)/g, "=\"$1\"").replace(/nowrap/g, "");
  var envStatus = XmlService.parse(xmlData).getRootElement().getChildren('EnvelopeStatus',ns)[0];
  var subject = envStatus.getChildText('Subject', ns);
  var yearCompleted = envStatus.getChildText('Completed', ns).substring(0, 4); //Used to group the envelopes by year
  var username = envStatus.getChildText('UserName',ns);
  var docs = XmlService.parse(xmlData).getRootElement().getChildren('DocumentPDFs',ns);
  var docStatuses = envStatus.getChildren('DocumentStatuses', ns);
  var recipients;
  var recStatus = envStatus.getChildren('RecipientStatuses', ns);
  
  let docStatusMap = {};
  for( var i = 0; i< docStatuses.length; i++){
    var docStatus = docStatuses[i];
    var docStatus = docStatus.getChildren('DocumentStatus', ns);
    for( var j = 0; j < docStatus.length; j++) {
      var fileID = docStatus[j].getChildText('ID', ns);
      docStatusMap[fileID] = docStatus[j].getChildText('Sequence', ns);
    }
  }
  var signers = [];
  for( var i = 0; i < recStatus.length; i++) {
    var recStatuses = recStatus[i].getChildren('RecipientStatus', ns);
    for( var j = 0; j < recStatuses.length; j++) {
      
      var role;
      var recipient = recStatuses[j].getChildText('UserName', ns);
      var routingOrder = recStatuses[j].getChildText('RoutingOrder', ns);
      signers.push(recipient);
      if(recipient == username){
        role = ' (sender/signer' +/*routingOrder+*/')';
      } else {
        role = ' (recipient/signer' +/*routingOrder+*/')';
      }
      if (recipients == null){
         recipients = recipient + role;
      } else {
        recipients = recipients + ', ' + recipient + role;
      }
    }
  }
  if(signers.indexOf(username) < 0 ){
    recipients = recipients + ', ' + username + ' (sender)'; //Include sender if signature was only required for recipient
  }
  
  var yearFolder;
  yearCompleted = "Docusign Envelopes - "+yearCompleted;
  var folderSearch = mainfolder.getFoldersByName(yearCompleted);
  while (folderSearch.hasNext()){
    var fol = folderSearch.next();
    yearFolder = DriveApp.getFolderById(fol.getId());
  }
  if(yearFolder == null){
    yearFolder = mainfolder.createFolder(yearCompleted);
  }
  subject = subject.replace("Please DocuSign these documents: ",""); // "Remove Please DocuSign these documents: " for readability
  
  // PDF gets sent over as a blob, so we need to convert to pdf
  var blobSet = new Set();
  for( var i = 0; i < docs.length; i++ ) {
    var doc = docs[i];
    var docpdfs = doc.getChildren('DocumentPDF', ns);
    for( var j = 0; j <docpdfs.length;j++){
      var fileName = docpdfs[j].getChildText('Name', ns);
      var fileId = docpdfs[j].getChildText('DocumentID', ns);
      var newSubject = subject;
      var docNumber = docStatusMap[fileId];
      Logger.log('docStatusMap.fileName', docStatusMap.fileName);
      if(docNumber == null){
        docNumber = docpdfs[j].getChildText('DocumentType', ns);
      } else {
        docNumber = docNumber+'.';
      }
      fileName = docNumber+' '+recipients+' - '+fileName;
      var bytes = Utilities.base64Decode(docpdfs[j].getChildText('PDFBytes',ns));
      var blob = Utilities.newBlob(bytes, "application/pdf", fileName);
      blobSet.add(blob);
      if(newSubject == subject && (subject == 'Documents for your DocuSign Signature')){
        newSubject = fileName;
      } else if(newSubject != subject){
        newSubject = newSubject+'; '+fileName;
      }
    }
  }
  var envFolder = yearFolder.createFolder(recipients + ' - ' +subject);
  for ( var i = blobSet.values(), val=null; val=i.next().value;){
    envFolder.createFile(val);
  }
}
