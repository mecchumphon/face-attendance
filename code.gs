/*
  === ขั้นตอนการแก้ไขไฟล์ code.gs (Google Apps Script) รอบที่ 2 ===
  เพื่อให้ฝั่งเว็บสามารถ "ดึงข้อมูล" กลับไปแสดงที่ Dashboard ได้

  1. ไปที่ไฟล์ code.gs ของคุณ
  2. หาฟังก์ชัน doGet(e) ที่อยู่ส่วนบนๆ ของไฟล์
  3. แก้ไขเพิ่มเงื่อนไข `getLogs` ตามตัวอย่างด้านล่าง
  4. นำฟังก์ชัน `getLogs()` ไปวางต่อท้ายด้านล่างสุดของไฟล์
*/

// --- ส่วนที่ 1: แก้ไขฟังก์ชัน doGet(e) เดิม ให้เป็นแบบนี้ ---

function doGet(e) {
  const action = e.parameter.action;
  let result;

  if (action === 'getConfig') {
    result = getConfig();
  } else if (action === 'getKnownFaces') {
    result = getKnownFaces();
  } else if (action === 'getLogs') {      // <--- 🟢 เพิ่มบรรทัดนี้
    result = getLogs();                   // <--- 🟢 เพิ่มบรรทัดนี้
  } else {
    result = { error: 'Unknown action: ' + action };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


// --- ส่วนที่ 2: ก๊อปปี้ฟังก์ชันใหม่นี้ ไปวางไว้ "ด้านล่างสุด" ของไฟล์ code.gs ---

function getLogs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let allLogs = [];

  // 1. อ่านข้อมูลจากชีต "Logs" (เข้างานปกติ)
  // **หมายเหตุ: เปลี่ยนชื่อ 'Logs' ให้ตรงกับชื่อชีตที่คุณตั้งไว้สำหรับการเข้างานปกติ**
  const logsSheet = ss.getSheetByName('Logs'); 
  if (logsSheet) {
    const data = logsSheet.getDataRange().getDisplayValues(); 
    // ใช้ getDisplayValues() เพื่อดึงวันที่ในรูปแบบ Text (ป้องกันเวลาเพี้ยน)
    
    for (let i = 1; i < data.length; i++) { // เริ่มที่ 1 เพื่อข้ามหัวตาราง
      if(data[i][0] === "") continue; // ข้ามบรรทัดว่าง
      allLogs.push({
        timestamp: data[i][0],
        studentId: data[i][1],
        name: data[i][2],
        location: data[i][5] || data[i][3] + ',' + data[i][4], // ถ้าไม่มีชื่อสถานที่ ให้แสดงพิกัดแทน
        type: "เข้างานปกติ",
        detail: "-"
      });
    }
  }

  // 2. อ่านข้อมูลจากชีต "Shift_Logs" (เข้าเวร)
  const shiftSheet = ss.getSheetByName('Shift_Logs');
  if (shiftSheet) {
    const data = shiftSheet.getDataRange().getDisplayValues();
    for (let i = 1; i < data.length; i++) {
      if(data[i][0] === "") continue;
      allLogs.push({
        timestamp: data[i][0],
        studentId: data[i][1],
        name: data[i][2],
        location: data[i][5] || "ไม่ระบุพิกัด",
        type: "เข้าเวร",
        detail: data[i][6] || "-" // ชื่ออาจารย์แพทย์จะอยู่คอลัมน์ G (index 6)
      });
    }
  }

  // พลิกข้อมูล (Reverse) เพื่อให้รายการที่บันทึกล่าสุด (ใหม่สุด) ขึ้นมาก่อน
  allLogs.reverse();

  return { success: true, logs: allLogs };
}

/*
  === สำคัญมาก ===
  แก้ไขเสร็จแล้วอย่าลืมกด Deploy > Manage deployments > ✏️ Edit > เลือก New version > Deploy ทุกครั้ง!
*/
