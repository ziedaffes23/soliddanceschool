/**
 * Solid Dance School — mail relay (Google Apps Script).
 * Emails are sent from the Google account that deploys this script.
 * Free Gmail: ~100 emails/day (Google Workspace: ~1500/day).
 *
 * 1) Replace SECRET below with a long random phrase (same value goes in Cloudflare as APPS_SCRIPT_SECRET).
 * 2) Run `authorize` once (Run ▶) and accept the permissions.
 * 3) Deploy → New deployment → type "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 * 4) Copy the Web app URL (ends with /exec) → Cloudflare variable APPS_SCRIPT_URL.
 */
const SECRET = 'CHANGE_THIS_TO_A_LONG_RANDOM_PHRASE';

function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    if (!SECRET || SECRET.indexOf('CHANGE_THIS') === 0) return out({ ok: false, error: 'Set SECRET in the script first' });
    if (b.secret !== SECRET) return out({ ok: false, error: 'unauthorized' });
    if (!b.to || !b.subject) return out({ ok: false, error: 'missing to/subject' });
    GmailApp.sendEmail(String(b.to), String(b.subject), String(b.text || ''), {
      htmlBody: b.html ? String(b.html) : undefined,
      name: b.name || 'Solid Dance School',
      replyTo: b.replyTo || undefined
    });
    return out({ ok: true, remaining: MailApp.getRemainingDailyQuota() });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function doGet() { return out({ ok: true, service: 'solid-mail-relay' }); }

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor to grant Gmail permission. */
function authorize() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Solid mail relay ready', 'Authorization OK. You can now deploy as a web app.');
}
