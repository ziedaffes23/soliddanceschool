/* Solid Dance School — Supabase → Google Sheets backup
 * One-way sync: Supabase remains the source of truth.
 * Paste into Extensions → Apps Script in the existing backup workbook.
 * The function reads the sanitized export_site_backup RPC, so admin password
 * hashes are never copied into Google Sheets.
 */

const SUPABASE_URL = 'https://pnoqggozzybcxfvwjmsr.supabase.co';
const SUPABASE_ANON_KEY = 'PASTE_THE_PUBLIC_ANON_KEY_HERE';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Solid Backup')
    .addItem('Sync now', 'syncNow')
    .addItem('Install 15-minute trigger', 'installTrigger')
    .addToUi();
}

function installTrigger() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'syncNow').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncNow').timeBased().everyMinutes(15).create();
  syncNow();
}

function syncNow() {
  const response = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/rpc/export_site_backup', {
    method: 'post', headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) throw new Error('Supabase request failed: ' + response.getContentText());
  const data = JSON.parse(response.getContentText()) || {};
  const registrations = Array.isArray(data.registrations) ? data.registrations : [];
  const teachers = Array.isArray(data.teachers) ? data.teachers : [];
  const packs = Array.isArray(data.packs) ? data.packs : [];
  const syncedAt = new Date();
  const teacherById = Object.fromEntries(teachers.map(t => [t.id, t.name || '']));
  const packById = Object.fromEntries(packs.map(p => [p.id, p.name || '']));
  const registrationRows = registrations.map(r => [r.id || '', studentName(r), r.birthInfo || r.dob || '', r.danceStyle || '', r.fatherName || '', r.fatherAddress || '', r.fatherPhone || '', r.fatherEmail || '', r.motherName || '', r.motherPhone || '', r.registrationDate || r.date || '', r.interestStatus || r.status || '', r.studentStatus || '', r.paymentStatus || '', packById[r.packId] || r.packId || '', r.notes || '', syncedAt]);
  const studentRows = registrations.filter(r => r.studentStatus === 'confirmed' || r.status === 'confirmed').map(r => [r.id || '', studentName(r), r.className || r.class || '', r.level || '', teacherById[r.teacherId] || r.teacher || '', r.studentStatus || r.status || '', r.registrationDate || r.date || '', r.phone || r.parentPhone || '', r.parentName || r.fatherName || r.motherName || '', syncedAt]);
  const leadRows = registrations.filter(r => r.interestStatus === 'interested' || r.status === 'Interested').map(r => [r.id || '', studentName(r), r.phone || r.fatherPhone || r.motherPhone || '', r.email || r.fatherEmail || '', r.className || r.class || '', r.interestStatus || r.status || '', r.registrationDate || r.date || '', syncedAt]);
  const paymentRows = [];
  registrations.forEach(r => {
    const payments = r.paymentPlan && Array.isArray(r.paymentPlan.payments) ? r.paymentPlan.payments : [];
    payments.forEach(p => paymentRows.push([r.id || '', studentName(r), p.date || '', Number(p.amount || 0), p.method || '', p.status || '', p.note || '', syncedAt]));
  });
  writeTab('Data JSON', [['Synced at', 'Complete sanitized Supabase JSON'], [syncedAt, JSON.stringify(data)]], false);
  writeTab('Registrations', registrationRows); writeTab('Students', studentRows); writeTab('Leads', leadRows); writeTab('Payments', paymentRows);
  writeTab('Sync Log', [[syncedAt, registrations.length, 'SUCCESS', 'Complete sanitized Supabase export']]);
}
function studentName(r) { return r.name || [r.firstName, r.lastName].filter(Boolean).join(' ') || ''; }
function writeTab(name, rows, withHeader = true) {
  const workbook = SpreadsheetApp.getActiveSpreadsheet(); const sheet = workbook.getSheetByName(name) || workbook.insertSheet(name);
  const output = withHeader ? [headers(name)].concat(rows) : rows; const columns = Math.max(...output.map(row => row.length), 1); const currentRows = Math.max(sheet.getLastRow(), 1); const currentColumns = Math.max(sheet.getLastColumn(), columns);
  sheet.getRange(1, 1, currentRows, currentColumns).clearContent(); if (output.length) sheet.getRange(1, 1, output.length, columns).setValues(output.map(row => row.concat(Array(columns - row.length).fill('')))); sheet.setFrozenRows(1); sheet.autoResizeColumns(1, Math.min(columns, 20));
}
function headers(name) { return ({ Registrations: ['ID','Student','Birth / DOB','Style','Father','Address','Father phone','Father email','Mother','Mother phone','Registered','Interest','Student status','Payment','Pack','Notes','Synced at'], Students: ['ID','Student','Class','Level','Teacher','Status','Registered','Parent phone','Parent','Synced at'], Leads: ['ID','Student','Phone','Email','Class','Interest','Registered','Synced at'], Payments: ['Student ID','Student','Date','Amount','Method','Status','Note','Synced at'], 'Sync Log': ['Synced at','Registration count','Result','Details'] })[name] || [] }
