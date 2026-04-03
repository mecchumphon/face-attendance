// ============================================================
//  GOOGLE APPS SCRIPT — REST API Backend (รองรับหลายจุดเช็คอิน)
//  วิธีใช้: Deploy > New deployment > Web App
//           Execute as: Me | Who has access: Anyone
// ============================================================

function doGet(e) {
  const action = e.parameter.action;
  let result;

  if (action === 'getConfig') {
    result = getConfig();
  } else if (action === 'getKnownFaces') {
    result = getKnownFaces();
  } else {
    result = { error: 'Unknown action: ' + action };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Invalid JSON body' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const action = data.action;
  let result;

  if (action === 'registerUser') {
    result = registerUser(data.name, data.faceDescriptor);
  } else if (action === 'logAttendance') {
    result = logAttendance(data.name, data.lat, data.lng);
  } else if (action === 'saveConfig') {
    // เปลี่ยนมารับค่า locations เป็น Array แทนแบบเดิม
    result = saveConfig(data.locations);
  } else {
    result = { error: 'Unknown action: ' + action };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- ส่วนจัดการใบหน้า (Users) ---
function registerUser(name, faceDescriptor) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Users');
  if (!sheet) sheet = ss.insertSheet('Users');

  sheet.appendRow([name, JSON.stringify(faceDescriptor), new Date()]);
  return { success: true, message: 'บันทึกข้อมูลหน้าเรียบร้อย' };
}

function getKnownFaces() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Users');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  let users = [];
  for (let i = 1; i < data.length; i++) {
    const name = data[i][0];
    const jsonStr = data[i][1];
    if (name && jsonStr) {
      try {
        users.push({ label: name, descriptor: JSON.parse(jsonStr) });
      } catch (e) {}
    }
  }
  return users;
}

// --- ส่วนบันทึกเวลา (Attendance) ---
function logAttendance(name, lat, lng) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Attendance');
  if (!sheet) {
    sheet = ss.insertSheet('Attendance');
    sheet.appendRow(['Name', 'Time', 'Date', 'Latitude', 'Longitude', 'Google Map Link']);
  }

  const now = new Date();
  const mapLink = (lat && lng) ? `https://www.google.com/maps?q=${lat},${lng}` : '';
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'd/M/yyyy');
  const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');

  sheet.appendRow([
    name,
    timeStr,
    "'" + dateStr,
    lat || '-',
    lng || '-',
    mapLink
  ]);
  return { success: true, message: 'บันทึกเวลาสำเร็จ' };
}

// --- ส่วนจัดการ Config (GPS หลายจุด) ---
function saveConfig(locationsArray) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Config');

  if (!sheet) {
    sheet = ss.insertSheet('Config');
    sheet.getRange('A1:B1').setValues([['Parameter', 'Value']]);
    sheet.setColumnWidth(1, 150);
  }

  // บันทึกข้อมูลหลายจุดเป็น JSON ก้อนเดียวลงในช่อง B2
  sheet.getRange('A2').setValue('Locations (JSON)');
  sheet.getRange('B2').setValue(JSON.stringify(locationsArray));
  
  // ลบข้อมูลบรรทัด 3-4 เก่าทิ้ง (ถ้ามี) เพื่อความสะอาดและไม่สับสน
  sheet.getRange('A3:B4').clearContent();

  return { success: true, message: 'บันทึกพิกัดทุกจุดลง Google Sheets เรียบร้อย' };
}

function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Config');

  let config = { locations: [] };

  if (sheet) {
    const val = sheet.getRange('B2').getValue();
    
    // พยายามแกะข้อมูล JSON ที่บันทึกไว้
    if (val && typeof val === 'string' && val.startsWith('[')) {
      try {
        config.locations = JSON.parse(val);
      } catch(e) {}
    } 
    // รองรับข้อมูลแบบเก่า (กรณีเพิ่งอัปเดตโค้ด แล้วยังมีพิกัดเก่าค้างอยู่)
    else {
      const latVal = sheet.getRange('B2').getValue();
      const lngVal = sheet.getRange('B3').getValue();
      const radVal = sheet.getRange('B4').getValue();
      if(latVal && lngVal) {
        config.locations.push({ name: 'สาขาหลัก', lat: latVal, lng: lngVal, radius: radVal || 0.5 });
      }
    }
  }
  return config;
}
