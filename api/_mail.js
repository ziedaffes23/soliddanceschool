// Email sending + templates (French) for Solid Dance School. Provider is chosen by environment variables:
//   BREVO_API_KEY  (+ MAIL_FROM = a sender address verified in Brevo)   — recommended, free tier, no domain needed
//   RESEND_API_KEY (+ MAIL_FROM = an address on a domain verified in Resend)
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => { const v = Math.round((Number(n) || 0) * 100) / 100; return `${Number.isInteger(v) ? v : v.toFixed(2)} DT`; };
const frDate = iso => { if (!iso) return '—'; const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`); return isNaN(d) ? String(iso) : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };
const shortDate = iso => { if (!iso) return '—'; const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`); return isNaN(d) ? String(iso) : d.toLocaleDateString('fr-FR', { timeZone: 'UTC' }); };

function config() {
  const env = process.env, from = (env.MAIL_FROM || '').trim(), name = (env.MAIL_FROM_NAME || 'Solid Dance School').trim();
  if (env.BREVO_API_KEY && from) return { provider: 'brevo', key: env.BREVO_API_KEY, from, name };
  if (env.RESEND_API_KEY && from) return { provider: 'resend', key: env.RESEND_API_KEY, from, name };
  return { provider: null, from, name };
}
const isConfigured = () => !!config().provider;
const validEmail = e => /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/.test(String(e || '').trim());

async function sendMail({ to, subject, html, text, replyTo }) {
  const cfg = config(); const list = (Array.isArray(to) ? to : String(to || '').split(/[,;]/)).map(x => x.trim()).filter(validEmail);
  if (!cfg.provider) return { ok: false, error: 'Email is not configured (missing BREVO_API_KEY / MAIL_FROM).' };
  if (!list.length) return { ok: false, error: 'No valid recipient address.' };
  try {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 9000);
    let res;
    if (cfg.provider === 'brevo') {
      res = await fetch((process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email'), { method: 'POST', signal: ctl.signal, headers: { 'api-key': cfg.key, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: { name: cfg.name, email: cfg.from }, to: list.map(email => ({ email })), subject, htmlContent: html, textContent: text, ...(replyTo && validEmail(replyTo) ? { replyTo: { email: replyTo } } : {}) }) });
    } else {
      res = await fetch('https://api.resend.com/emails', { method: 'POST', signal: ctl.signal, headers: { authorization: `Bearer ${cfg.key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from: `${cfg.name} <${cfg.from}>`, to: list, subject, html, text, ...(replyTo && validEmail(replyTo) ? { reply_to: replyTo } : {}) }) });
    }
    clearTimeout(timer);
    if (!res.ok) { const t = await res.text().catch(() => ''); return { ok: false, error: `Mail provider error ${res.status}: ${t.slice(0, 200)}` }; }
    return { ok: true };
  } catch (e) { return { ok: false, error: 'Mail request failed: ' + (e.name === 'AbortError' ? 'timeout' : e.message) }; }
}

/* ---------- templates ---------- */
const shell = (title, body, footer = '') => `<!doctype html><html><body style="margin:0;background:#f2f2ec;font-family:Arial,Helvetica,sans-serif;color:#111"><div style="max-width:600px;margin:0 auto;padding:24px"><div style="background:#0a0a0a;color:#c8ff3d;padding:18px 24px;font-weight:800;letter-spacing:.14em;font-size:15px">SOLID DANCE SCHOOL</div><div style="background:#fff;padding:28px 24px;border:1px solid #ddd;border-top:0"><h1 style="font-size:22px;margin:0 0 16px">${esc(title)}</h1>${body}</div><div style="padding:14px 4px;font-size:12px;color:#666">${footer}</div></div></body></html>`;
const rowsHtml = rows => `<table style="width:100%;border-collapse:collapse;margin:8px 0 4px">${rows.filter(r => r[1] !== undefined && r[1] !== '').map(([k, v]) => `<tr><td style="padding:8px 10px;border-bottom:1px solid #eee;color:#666;width:38%;font-size:13px">${esc(k)}</td><td style="padding:8px 10px;border-bottom:1px solid #eee;font-size:14px"><b>${esc(v)}</b></td></tr>`).join('')}</table>`;
const rowsText = rows => rows.filter(r => r[1] !== undefined && r[1] !== '').map(([k, v]) => `${k}: ${v}`).join('\n');

function ownerNewRegistration(r, adminUrl) {
  const rows = [['Élève', r.name], ['Naissance', r.dob || r.birthInfo], ['Style de danse', r.danceStyle], ['Cours', r.class || r.className], ['Père / tuteur', [r.fatherName || r.parentName, r.fatherPhone || r.parentPhone].filter(Boolean).join(' · ')], ['Email', r.email || r.fatherEmail], ['Mère', [r.motherName, r.motherPhone].filter(Boolean).join(' · ')], ['Adresse', r.address || r.fatherAddress], ['Message', r.message || r.comment]];
  return { subject: `Nouvelle inscription — ${r.name || 'Sans nom'}`, html: shell('Nouvelle inscription reçue', `<p style="margin:0 0 12px">Une nouvelle inscription vient d’arriver sur le site.</p>${rowsHtml(rows)}<p style="margin:18px 0 0"><a href="${esc(adminUrl)}" style="background:#c8ff3d;color:#000;padding:11px 18px;text-decoration:none;font-weight:700;font-size:13px">Ouvrir l’espace admin</a></p>`), text: `Nouvelle inscription\n\n${rowsText(rows)}\n\nAdmin: ${adminUrl}` };
}
function ownerPayment(items, adminUrl) {
  const lines = items.map(i => [`${i.name}${i.className ? ' · ' + i.className : ''}`, `${money(i.amount)} · ${i.method || '—'} · ${shortDate(i.date)}${i.remaining > 0 ? ` · reste ${money(i.remaining)}` : ' · soldé'}`]);
  return { subject: items.length === 1 ? `Paiement reçu — ${items[0].name} (${money(items[0].amount)})` : `${items.length} paiements reçus`, html: shell('Paiement enregistré', `${rowsHtml(lines)}${items.length === 1 ? rowsHtml([['Total convenu', money(items[0].total)], ['Déjà payé', money(items[0].paid)], ['Reste à payer', money(items[0].remaining)], ['Téléphone', items[0].phone], ['Email', items[0].email]]) : ''}<p style="margin:18px 0 0"><a href="${esc(adminUrl)}" style="background:#c8ff3d;color:#000;padding:11px 18px;text-decoration:none;font-weight:700;font-size:13px">Voir les paiements</a></p>`), text: `Paiement(s) enregistré(s)\n\n${rowsText(lines)}\n\n${adminUrl}` };
}
function parentReminder(x, school) {
  const who = x.parentName || x.name, rows = [['Élève', x.name], ['Cours', x.className], ['Montant à régler', money(x.amount)], ['Échéance', frDate(x.dueDate)], ['Reste total à payer', money(x.remaining)]];
  const contact = [school.phone, school.email].filter(Boolean).join(' · ');
  return { subject: `Rappel de paiement — échéance ${x.when || 'demain'} (${shortDate(x.dueDate)})`, html: shell('Rappel de paiement', `<p style="margin:0 0 12px">Bonjour ${esc(who)},</p><p style="margin:0 0 12px">Nous vous rappelons qu’un paiement est prévu <b>${esc(x.when || 'demain')}</b> pour l’inscription de <b>${esc(x.name)}</b> à Solid Dance School.</p>${rowsHtml(rows)}<p style="margin:16px 0 0;font-size:14px">Vous pouvez régler directement à l’école. Si le paiement a déjà été effectué, merci d’ignorer ce message.</p><p style="margin:14px 0 0;font-size:14px">Merci et à bientôt,<br><b>L’équipe Solid Dance School</b></p>`, `${esc(contact)}`), text: `Bonjour ${who},\n\nRappel : un paiement est prévu ${x.when || 'demain'} pour l'inscription de ${x.name}.\n\n${rowsText(rows)}\n\nSi le paiement a déjà été effectué, merci d'ignorer ce message.\n\nSolid Dance School${contact ? '\n' + contact : ''}` };
}
function ownerDigest(sent, missing, failed, today) {
  const li = a => a.map(x => `<li>${esc(x)}</li>`).join('');
  return { subject: `Rappels de paiement envoyés (${sent.length}) — ${shortDate(today)}`, html: shell('Rappels de paiement du jour', `<p style="margin:0 0 10px"><b>${sent.length}</b> rappel(s) envoyé(s) aux parents pour les échéances de demain.</p>${sent.length ? `<ul style="margin:0 0 12px;padding-left:18px;font-size:14px">${li(sent)}</ul>` : ''}${missing.length ? `<p style="margin:12px 0 6px;color:#b3261e"><b>Sans adresse email (à contacter par téléphone) :</b></p><ul style="margin:0;padding-left:18px;font-size:14px">${li(missing)}</ul>` : ''}${failed.length ? `<p style="margin:12px 0 6px;color:#b3261e"><b>Échecs d’envoi :</b></p><ul style="margin:0;padding-left:18px;font-size:14px">${li(failed)}</ul>` : ''}`), text: `Rappels envoyés: ${sent.join(', ') || 'aucun'}\nSans email: ${missing.join(', ') || '—'}\nÉchecs: ${failed.join(', ') || '—'}` };
}

module.exports = { sendMail, isConfigured, config, validEmail, ownerNewRegistration, ownerPayment, parentReminder, ownerDigest, money };
