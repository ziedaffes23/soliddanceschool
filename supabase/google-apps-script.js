/* Solid Dance School — Supabase → Google Sheets backup
 * One-way sync: Supabase remains the source of truth.
 * Paste this file into Extensions → Apps Script in the backup spreadsheet.
 */

const SUPABASE_URL = 'https://pnoqggozzybcxfvwjmsr.supabase.co';
const SUPABASE_ANON_KEY = 'PASTE_THE_PUBLIC_ANON_KEY_HERE';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Solid Backup')
    .addItem('Sync now', 'syncNow')
    .addItem('Install 15-minute trigger', 'installTrigger')
    .addToUi();
}

function installTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncNow')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncNow').timeBased().everyMinutes(15).create();
  syncNow();
}

function syncNow() {
  const response = UrlFetchApp.fetch(
    SUPABASE_URL + '/rest/v1/site_data?id=eq.default&select=data',
    {
      method: 'get',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY
      },
      muteHttpExceptions: true
    }
  );

  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error('Supabase request failed: ' + response.getContentText());
  }

  const records = JSON.parse(response.getContentText());
  const data = records.length ? (records[0].data || {}) : {};
  const registrations = Array.isArray(data.registrations) ? data.registrations : [];
  const teachers = Array.isArray(data.teachers) ? data.teachers : [];
  const packs = Array.isArray(data.packs) ? data.packs : [];
  const syncedAt = new Date();

  const teacherById = Object.fromEntries(teachers.map(t => [t.id, t.name || '']));
  const packById = Object.fromEntries(packs.map(p => [p.id, p.name || '']));

  const registrationRows = registrations.map(r => [
    r.id || '',
    studentName(r),
    r.birthInfo || r.dob || '',
    r.danceStyle || '',
    r.fatherName || '',
    r.fatherAddress || '',
    r.fatherPhone || '',
    r.fatherEmail || '',
    r.motherName || '',
    r.motherPhone || '',
    r.registrationDate || r.date || '',
    r.interestStatus || r.status || '',
    r.studentStatus || '',
    r.paymentStatus || '',
    packById[r.packId] || r.packId || '',
    r.notes || '',
    syncedAt
  ]);

  const studentRows = registrations
    .filter(r => r.studentStatus === 'confirmed' || r.status === 'confirmed')
    .map(r => [
      r.id || '', studentName(r), r.className || r.class || '', r.level || '',
      teacherById[r.teacherId] || r.teacher || '', r.studentStatus || r.status || '',
      r.registrationDate || r.date || '', r.phone || r.parentPhone || '',
      r.parentName || r.fatherName || r.motherName || '', syncedAt
    ]);

  const leadRows = registrations
    .filter(r => r.interestStatus === 'interested' || r.status === 'Interested')
    .map(r => [
      r.id || '', studentName(r), r.phone || r.fatherPhone || r.motherPhone || '',
      r.email || r.fatherEmail || '', r.className || r.class || '',
      r.interestStatus || r.status || '', r.registrationDate || r.date || '', syncedAt
    ]);

  const paymentRows = [];
  registrations.forEach(r => {
    (r.paymentPlan && Array.isArray(r.paymentPlan.payments) ? r.paymentPlan.payments : []).forEach(p => {
      paymentRows.push([
        r.id || '', studentName(r), p.date || '', Number(p.amount || 0),
        p.method || '', p.status || '', p.note || '', syncedAt
      ]);
    });
  });

  writeTab('Registrations', registrationRows);
  writeTab('Students', studentRows);
  writeTab('Leads', leadRows);
  writeTab('Payments', paymentRows);
  writeTab('Sync Log', [[syncedAt, registrations.length, 'SUCCESS', 'Supabase data exported']]);
}

function studentName(r) {
  return r.name || [r.firstName, r.lastName].filter(Boolean).join(' ') || '';
}

function writeTab(name, rows) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet tab: ' + name);
  const lastColumn = sheet.getLastColumn() || 1;
  const lastRow = Math.max(sheet.getLastRow(), 1);
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, lastColumn).clearContent();
  if (rows.length) sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, Math.min(lastColumn, 17));
}
