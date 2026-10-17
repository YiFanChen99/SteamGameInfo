
function WantToOwned(records) {
  let record = records[0];
  return [[record[0], undefined, record[11], undefined, undefined, undefined, "O",
          `${record[4]}，${record[12]}，${record[13]}`]]
}

// 未能成功呼叫，cell 內呼叫權限不足
function FindRowByValue(name) {
  Logger.log(`FindRowByValue enter with name: ${name}`);
  // const spreadsheetUrl = '<SPREADSHEET_URL>';
  const spreadsheetUrl = '<SPREADSHEET_URL>';
  const sheetName = 'STEAM'

  const ss = SpreadsheetApp.openByUrl(spreadsheetUrl);
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  Logger.log(`  loaded data length: ${data.length}`);

  for (let i = 0; i < data.length; i++) {
    if (data[i][1].toString().includes(name)) { // B欄是索引1
      Logger.log('找到匹配列: ' + data[i]);
      return data[i];
    }
  }
}
