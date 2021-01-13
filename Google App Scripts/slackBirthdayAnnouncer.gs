// If someone's birthday is today, announce their birthday on Slack


function announceBirthday() {
  
  // Source Sheet is populated by an API call made by formula. Need to flush the sheet to recalcuate the formula
  SpreadsheetApp.flush();
  var sSheet = SpreadsheetApp.getActiveSpreadsheet();
  var srcSheet = sSheet.getSheetByName("[INSERT PRIMARY SHEETNAME");
  //Since the Source sheet is called by an API call, we have static redundancy sheet set up
  var redundantSheet = sSheet.getSheetByName("[INSERT REDUNDANT SHEETNAME]");
  if(redundantSheet.getLastRow() > srcSheet.getLastRow()){
    srcSheet = redundantSheet;
  }
  
  // If we are using the redundant sheet, notify someone
  if (srcSheet == redundantSheet){
    Logger.log("Got into Email If Condition");
    var emailAddress = "[INSERT RECIPIENT EMAIL]";
    var message = "[INSERT MESSAGE]";
    var subject = "[INSERT SUBJECT]";
    MailApp.sendEmail(emailAddress, subject, message);
  }
  
  var tarSheet = sSheet.getSheetByName("Logger");
  var lastRow = srcSheet.getLastRow();
  // Get todays date
  var today = Utilities.formatDate(new Date(), "GMT+1", "yyyy-MM-dd");
  // Need to append a "Z" to the date because GAS doesn't handle dates and timezones well
  var td = new Date(today+"z");
  
  //Loop through the list of birthdays and see if anyone's birthday is today
  for (var i = 2; i <= lastRow; i++) {
    // B is the column that has the dates
    var cell = srcSheet.getRange("B" + i);
    var val = cell.getValue();
    // Get cell value and append "z" since GAS doesn't play well with timezones and dates
    var valDate = new Date(val+"z");
   
    // Compare today's month and day with each birthdate and copy them to the target sheet
    if (valDate.getMonth() == td.getMonth() && valDate.getDate() == td.getDate()) {
      var emailCell = srcSheet.getRange("C" + i);
      var emailVal = emailCell.getValue();
      // Get user by email 
      var url = "https://slack.com/api/users.lookupByEmail?token=[INSERT SLACK AUTH TOKEN]&email="+emailVal;
      var response = UrlFetchApp.fetch(url, {'muteHttpExceptions': true});
      var json = response.getContentText();
      var data = JSON.parse(json);
      var slackUsername = data.user['name'];
      var channel = "[INSERT SLACK CHANNEL ID]";
      var slackMessage = "@channel Happy Birthday @"+slackUsername+"! :celebrate: :tada: :celebrate: :bananadance:";
      if (slackUsername !== ""){
        var postURL = "https://slack.com/api/chat.postMessage?token=[INSERT SLACK BOT AUTH TOKEN]&channel="+channel+"&text="+encodeURI(slackMessage)+"&pretty=1&link_names=true";
        var response = UrlFetchApp.fetch(postURL, {'muteHttpExceptions': true});
        
      
        var srcRange = srcSheet.getRange("A" + i + ":C" + i);
        
        var tarRow = tarSheet.getLastRow();
        tarSheet.insertRowAfter(tarRow);
        var tarRange = tarSheet.getRange("A" + (tarRow+1) + ":C" + (tarRow+1));
        var logDateRange = tarSheet.getRange("D"+(tarRow+1));
        
        
        srcRange.copyTo(tarRange);
        logDateRange.setValue(today);
      }
    }
  }
};