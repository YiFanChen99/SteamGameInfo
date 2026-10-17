
const WorksheetName = 'STEAM';
const Range = ''; // \d+ or '' (means all)
// B名稱, C原價, D最低off, E上市, F評價度, G更新日, H更新距離, I, J最低$, K購買/期待度1~5, LAnyDeal
const StartAscii = 'B'.charCodeAt(0); // 66
const UnusedColumes = ['C', 'D', 'E', 'F', 'H', 'J'];
const DropColumes = UnusedColumes.concat(['I']);
const MergedColumes = ['L'];
// i.e. Return: B, G, K

/**
 * @private
 */
function indexToColumeChar(index) {
  const targetAscii = StartAscii + index;
  return String.fromCharCode(targetAscii);
}

/**
 * @private
 */
function arrayToObjWithColumeKey(arr) {
  return arr.reduce((accumulator, value, index) => {
    const key = indexToColumeChar(index);
    if (!DropColumes.includes(key)) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

/**
 * @private
 */
function dropMergedColume(obj) {
  for (colume of MergedColumes) {
    delete obj[colume];
  }
}

/**
 * @private
 */
function toDateString(dateTime) {
  if (dateTime instanceof Date) {
    return dateTime.toDateString();
  } else if (!dateTime) {
    return '';
  } else {
    return new Date(dateTime).toLocaleDateString();
  }
}

function doGet(e) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(WorksheetName);

  const row1 = sheet.getRange(`B1:L1`).getValues().flat();
  const labelMap = arrayToObjWithColumeKey(row1);
  dropMergedColume(labelMap);

  const rows = sheet.getRange(`B2:L${Range}`).getValues();
  const games = rows.reduce((accumulator, row) => {
    // Skip no name
    if (row[0] === '') {
      return accumulator;
    }

    const game = arrayToObjWithColumeKey(row);
    // Skip want unknown or 0
    if (game['K'] === '' || game['K'] == 0) {
      return accumulator;
    }

    if (game['G'] !== '') {
      game['G'] = toDateString(game['G']);
    }
    
    const isHaved = game['L'] ? String(game['L']) : '';
    const isHavedMatched = isHaved.match(/[^\d]*已有[^\d]*/);
    if (isHavedMatched) {
      game['K'] = isHavedMatched[0];
    }
    dropMergedColume(game);
    
    accumulator.push(game);
    return accumulator;
  }, []);

  return ContentService.createTextOutput(JSON.stringify({ games, labelMap }))
    .setMimeType(ContentService.MimeType.JSON);
}
