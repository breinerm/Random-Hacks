function announceBirthday() {
  pullJSON();
  var sSheet = SpreadsheetApp.getActiveSpreadsheet();
  var srcSheet = sSheet.getSheetByName("[SHEETNAME]"); // Replace with sheetname you want data to be placed into
  var bDayRows = new Array();
  var tarSheet = sSheet.getSheetByName("Logger"); // Replace with name of sheet you want to store logs in 
  var lastRow = srcSheet.getLastRow();
  var today = Utilities.formatDate(new Date(), "GMT+1", "yyyy-MM-dd");
  var td = new Date(today + "z"); // Need to append a "Z" to the date because GAS doesn't handle dates and timezones well
  var slackUsername = null;
 
  //Loop through the list of birthdays and see if anyone's birthday is today
  for (var i = 2; i <= lastRow; i++) {
    // B is the column that has the dates
    var cell = srcSheet.getRange("B" + i);
    var val = cell.getValue();
    // Get cell value and append "z" since GAS doesn't play well with timezones and dates
    var valDate = new Date(val + "z");

    // Compare today's month and day with each birthdate and copy them to the target sheet
    if (valDate.getMonth() == td.getMonth() && valDate.getDate() == td.getDate()) {
      bDayRows.push(i);
      var emailCell = srcSheet.getRange("C" + i);
      var emailVal = emailCell.getValue();
      // Get user by email 
      var url = "https://slack.com/api/users.lookupByEmail?token="+getToken([SCRIPTPROPERTYKEY])+"&email=" + emailVal;
      var response = UrlFetchApp.fetch(url, {
        'muteHttpExceptions': true
      });
      var json = response.getContentText();
      var data = JSON.parse(json);
      if (slackUsername !== null) {
        slackUsername += ', @' + data.user['name'];
      } else {
        slackUsername = '@' + data.user['name'];
      }
    }
  }

  if (slackUsername !== "" && slackUsername !== null) {
    var channel = "[CHANNELID]"; // Replace with id of channel you want to post the birthday announcement to
    var slackMessage = "@channel Happy Birthday " + slackUsername + "! :celebrate: :tada: :celebrate: :bananadance:";
    var postURL = "https://slack.com/api/chat.postMessage?token="+getToken([SCRIPTPROPERTYKEY])+"&channel=" + channel + "&text=" + encodeURI(slackMessage) + "&pretty=1&link_names=true";
    var response = UrlFetchApp.fetch(postURL, {
      'muteHttpExceptions': true
    });

    for (var h = 0; h < bDayRows.length; h++) {
      var i = bDayRows[h];
      var srcRange = srcSheet.getRange("A" + i + ":C" + i).getValues();

      var tarRow = tarSheet.getLastRow();
      tarSheet.insertRowAfter(tarRow);
      var tarRange = tarSheet.getRange("A" + (tarRow + 1) + ":C" + (tarRow + 1));
      var logDateRange = tarSheet.getRange("D" + (tarRow + 1));

      Logger.log('tarRow' + tarRow);
      Logger.log('srcRange' + srcRange);

      tarRange.setValues(srcRange);
      logDateRange.setValue(today);
    }
  }
}

function pullJSON() {
  var sheet = getSheetById([SHEET ID]);
  var url = "[URL]"; // Paste your url that returns json object of names, birthdays, and email
  var response = UrlFetchApp.fetch(url); // get feed
  var dataAll = JSON.parse(response.getContentText());
  var employees = [];
  var empLine = [];

  empLine.push("Name", "Birthdate", "Email");
  employees.push(empLine);
  
  for (var x = 0; x < dataAll.data.length; x++) {
    var emp = dataAll.data[x];
    var empData = [];
    var bday = emp["[BIRTHDAY]"]; // Replace with keys of birthday in your json object
    if (bday != null && bday != '') {
      empData.push(emp["[NAME]"], bday, emp["EMAIL"]); // Replace with keys of name and email in your json object
      employees.push(empData);
    }
  }

  if (employees.length > 0) {
    // Clear sheet in case new range is smaller than existing
    sheet.clear();
    sheet.getRange(1, 1, employees.length, employees[0].length).setValues(employees);
  } else {
    var channel = "[CHANNELID]"; // Replace with id of channel you want to post to if it fails
    var slackMessage = "BirthdayBot failed to get an updated employee list.";
    var postURL = "https://slack.com/api/chat.postMessage?token="+getToken([SCRIPTPROPERTYKEY])+"&channel=" + channel + "&text=" + encodeURI(slackMessage) + "&pretty=1&link_names=true";
    var response = UrlFetchApp.fetch(postURL, {
      'muteHttpExceptions': true
    });
  }
}

function getSheetById(id) {
  return SpreadsheetApp.getActive().getSheets().filter(
    function(s) {
      return s.getSheetId() === id;
    }
  )[0];
}

function getToken(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}
