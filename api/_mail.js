// Email sending + templates (French) for Solid Dance School. Provider is chosen by environment variables:
//   APPS_SCRIPT_URL + APPS_SCRIPT_SECRET — send from your own Gmail through a Google Apps Script web app (google-apps-script/Mail.gs)
//   BREVO_API_KEY  (+ MAIL_FROM = a sender address verified in Brevo)   — recommended, free tier, no domain needed
//   RESEND_API_KEY (+ MAIL_FROM = an address on a domain verified in Resend)
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => { const v = Math.round((Number(n) || 0) * 100) / 100; return `${Number.isInteger(v) ? v : v.toFixed(2)} DT`; };
const frDate = iso => { if (!iso) return '—'; const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`); return isNaN(d) ? String(iso) : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };
const shortDate = iso => { if (!iso) return '—'; const d = new Date(`${String(iso).slice(0, 10)}T12:00:00Z`); return isNaN(d) ? String(iso) : d.toLocaleDateString('fr-FR', { timeZone: 'UTC' }); };

function config() {
  const env = process.env, from = (env.MAIL_FROM || '').trim(), name = (env.MAIL_FROM_NAME || 'Solid Dance School').trim();
  if (env.APPS_SCRIPT_URL && env.APPS_SCRIPT_SECRET) return { provider: 'google-apps-script', url: env.APPS_SCRIPT_URL, key: env.APPS_SCRIPT_SECRET, from: from || 'your Google account', name };
  if (env.BREVO_API_KEY && from) return { provider: 'brevo', key: env.BREVO_API_KEY, from, name };
  if (env.RESEND_API_KEY && from) return { provider: 'resend', key: env.RESEND_API_KEY, from, name };
  return { provider: null, from, name };
}
const isConfigured = () => !!config().provider;
const validEmail = e => /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/.test(String(e || '').trim());

async function sendMail({ to, subject, html, text, replyTo }) {
  const cfg = config(); const list = (Array.isArray(to) ? to : String(to || '').split(/[,;]/)).map(x => x.trim()).filter(validEmail);
  if (!cfg.provider) return { ok: false, error: 'Email is not configured (set APPS_SCRIPT_URL + APPS_SCRIPT_SECRET, or BREVO_API_KEY + MAIL_FROM).' };
  if (!list.length) return { ok: false, error: 'No valid recipient address.' };
  try {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 9000);
    let res;
    if (cfg.provider === 'google-apps-script') {
      res = await fetch(cfg.url, { method: 'POST', signal: ctl.signal, redirect: 'follow', headers: { 'content-type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ secret: cfg.key, to: list.join(','), subject, html, text, name: cfg.name, replyTo: replyTo && validEmail(replyTo) ? replyTo : '' }) });
      clearTimeout(timer);
      const t = await res.text().catch(() => ''); let j = {}; try { j = JSON.parse(t); } catch (e) { /* not JSON */ }
      if (!res.ok || !j.ok) return { ok: false, error: `Google Apps Script error: ${(j.error || t.replace(/<[^>]*>/g, ' ').trim()).slice(0, 200) || res.status}` };
      return { ok: true };
    }
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

/* ---------- templates (table-based, inline styles: safe for Gmail / Outlook / mobile) ---------- */
const LIME = '#c8ff3d', INK = '#0a0a0a', MUTED = '#6b6f66', LINE = '#e7e9e0';
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const shell = ({ preheader = '', badge = '', title, intro = '', body = '', cta, ctaUrl, footer = '' }) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#eceee6;font-family:${FONT};color:${INK};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eceee6"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">
 <tr><td style="background:${INK};padding:22px 28px;border-radius:14px 14px 0 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
   <td style="font-family:${FONT};font-weight:900;font-size:20px;letter-spacing:.32em;color:${LIME}">SOLID</td>
   <td align="right" style="font-family:${FONT};font-size:11px;letter-spacing:.2em;color:#9a9d94;text-transform:uppercase">Dance School</td>
  </tr></table></td></tr>
 <tr><td style="background:${LIME};height:5px;line-height:5px;font-size:0">&nbsp;</td></tr>
 <tr><td style="background:#ffffff;padding:34px 28px 30px;border-left:1px solid ${LINE};border-right:1px solid ${LINE}">
  ${badge ? `<div style="display:inline-block;background:${INK};color:${LIME};font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;padding:6px 12px;border-radius:99px;margin:0 0 16px">${esc(badge)}</div>` : ''}
  <h1 style="margin:0 0 12px;font-family:${FONT};font-size:28px;line-height:1.15;font-weight:900;letter-spacing:-.01em;color:${INK}">${esc(title)}</h1>
  ${intro ? `<p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#33362f">${intro}</p>` : ''}
  ${body}
  ${cta && ctaUrl ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 0"><tr><td style="background:${INK};border-radius:10px"><a href="${esc(ctaUrl)}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:14px;font-weight:700;color:${LIME};text-decoration:none;letter-spacing:.04em">${esc(cta)} &rarr;</a></td></tr></table>` : ''}
 </td></tr>
 <tr><td style="background:#f7f8f3;padding:18px 28px;border:1px solid ${LINE};border-top:0;border-radius:0 0 14px 14px;font-size:12px;line-height:1.6;color:${MUTED}">${footer || 'Solid Dance School'}</td></tr>
</table>
<p style="margin:14px 0 0;font-size:11px;color:#9a9d94;font-family:${FONT}">Message automatique envoyé par le site Solid Dance School.</p>
</td></tr></table></body></html>`;

const rowsHtml = rows => { const r = rows.filter(x => x[1] !== undefined && x[1] !== null && x[1] !== '' && x[1] !== '—'); if (!r.length) return '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};border-radius:12px;border-collapse:separate;overflow:hidden;background:#fbfbf8;margin:0 0 6px">${r.map(([k, v], i) => `<tr><td style="padding:12px 16px;${i ? `border-top:1px solid ${LINE};` : ''}font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${MUTED};width:38%;vertical-align:top">${esc(k)}</td><td style="padding:12px 16px;${i ? `border-top:1px solid ${LINE};` : ''}font-size:15px;font-weight:700;color:${INK};vertical-align:top">${esc(v)}</td></tr>`).join('')}</table>`; };
const rowsText = rows => rows.filter(r => r[1] !== undefined && r[1] !== null && r[1] !== '').map(([k, v]) => `${k}: ${v}`).join('\n');
const amountCard = (label, amount, sub) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};border-radius:14px;margin:0 0 18px"><tr><td style="padding:22px 24px"><div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#9a9d94">${esc(label)}</div><div style="font-family:${FONT};font-size:38px;line-height:1.1;font-weight:900;color:${LIME};margin:6px 0 2px">${esc(amount)}</div>${sub ? `<div style="font-size:13px;color:#d3d6cb">${esc(sub)}</div>` : ''}</td></tr></table>`;

function ownerNewRegistration(r, adminUrl) {
  const rows = [['Élève', r.name], ['Naissance', r.dob || r.birthInfo], ['Style de danse', r.danceStyle], ['Cours', r.class || r.className], ['Père / tuteur', [r.fatherName || r.parentName, r.fatherPhone || r.parentPhone].filter(Boolean).join(' · ')], ['Email', r.email || r.fatherEmail], ['Mère', [r.motherName, r.motherPhone].filter(Boolean).join(' · ')], ['Adresse', r.address || r.fatherAddress], ['Message', r.message || r.comment]];
  return { subject: `Nouvelle inscription — ${r.name || 'Sans nom'}`,
    html: shell({ preheader: `${r.name || 'Un nouvel élève'} vient de s’inscrire.`, badge: 'Nouvelle inscription', title: r.name || 'Nouvel élève', intro: 'Une nouvelle inscription vient d’arriver sur le site. Voici les détails à traiter :', body: rowsHtml(rows), cta: 'Ouvrir l’espace admin', ctaUrl: adminUrl, footer: 'Pensez à affecter l’élève à un cours et à enregistrer son premier paiement.' }),
    text: `Nouvelle inscription\n\n${rowsText(rows)}\n\nAdmin: ${adminUrl}` };
}
function ownerPayment(items, adminUrl) {
  const one = items.length === 1 ? items[0] : null;
  const lines = items.map(i => [`${i.name}${i.className ? ' · ' + i.className : ''}`, `${money(i.amount)} · ${i.method || '—'} · ${shortDate(i.date)}${i.remaining > 0 ? ` · reste ${money(i.remaining)}` : ' · soldé'}`]);
  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const body = (one ? amountCard('Montant reçu', money(one.amount), `${one.method || 'Paiement'} · ${shortDate(one.date)}`) + rowsHtml([['Élève', one.name], ['Cours', one.className], ['Total convenu', money(one.total)], ['Déjà payé', money(one.paid)], ['Reste à payer', one.remaining > 0 ? money(one.remaining) : 'Soldé ✓'], ['Téléphone', one.phone], ['Email', one.email]])
    : amountCard('Total reçu', money(total), `${items.length} paiements`) + rowsHtml(lines));
  return { subject: one ? `Paiement reçu — ${one.name} (${money(one.amount)})` : `${items.length} paiements reçus`,
    html: shell({ preheader: one ? `${money(one.amount)} reçu de ${one.name}.` : `${items.length} paiements enregistrés.`, badge: 'Paiement enregistré', title: one ? one.name : 'Nouveaux paiements', intro: one ? 'Un paiement vient d’être enregistré dans l’espace admin.' : 'Plusieurs paiements viennent d’être enregistrés.', body, cta: 'Voir les paiements', ctaUrl: adminUrl }),
    text: `Paiement(s) enregistré(s)\n\n${rowsText(lines)}\n\n${adminUrl}` };
}
function parentReminder(x, school) {
  const who = x.parentName || x.name, when = x.when || 'demain';
  const rows = [['Élève', x.name], ['Cours', x.className], ['Échéance', frDate(x.dueDate)], ['Reste total à payer', money(x.remaining)]];
  const contact = [school.phone, school.email].filter(Boolean).map(esc).join(' &nbsp;·&nbsp; ');
  return { subject: `Rappel de paiement — échéance ${when} (${shortDate(x.dueDate)})`,
    html: shell({ preheader: `Un paiement de ${money(x.amount)} est prévu ${when} pour ${x.name}.`, badge: 'Rappel de paiement', title: `Échéance ${when}`, intro: `Bonjour <b>${esc(who)}</b>,<br>nous vous rappelons qu’un paiement est prévu <b>${esc(when)}</b> pour l’inscription de <b>${esc(x.name)}</b> à Solid Dance School.`,
      body: amountCard('Montant à régler', money(x.amount), `avant le ${frDate(x.dueDate)}`) + rowsHtml(rows) + `<p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#33362f">Le règlement s’effectue directement à l’école. Si le paiement a déjà été effectué, merci d’ignorer ce message.</p><p style="margin:14px 0 0;font-size:14px;line-height:1.6">Merci et à très bientôt,<br><b>L’équipe Solid Dance School</b></p>`,
      footer: contact ? `Une question ? Contactez-nous : ${contact}` : 'Solid Dance School' }),
    text: `Bonjour ${who},\n\nRappel : un paiement de ${money(x.amount)} est prévu ${when} pour l'inscription de ${x.name}.\n\n${rowsText(rows)}\n\nSi le paiement a déjà été effectué, merci d'ignorer ce message.\n\nSolid Dance School${school.phone || school.email ? '\n' + [school.phone, school.email].filter(Boolean).join(' · ') : ''}` };
}
function ownerDigest(sent, missing, failed, today) {
  const li = a => `<ul style="margin:0 0 6px;padding-left:20px;font-size:14px;line-height:1.8">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const block = (t, a, color) => a.length ? `<p style="margin:16px 0 4px;font-size:13px;font-weight:700;color:${color}">${esc(t)}</p>${li(a)}` : '';
  return { subject: `Rappels de paiement envoyés (${sent.length}) — ${shortDate(today)}`,
    html: shell({ preheader: `${sent.length} rappel(s) envoyé(s) aux parents.`, badge: 'Récapitulatif du jour', title: `${sent.length} rappel${sent.length > 1 ? 's' : ''} envoyé${sent.length > 1 ? 's' : ''}`, intro: 'Rappels de paiement envoyés aux parents pour les échéances de demain.',
      body: block('Envoyés', sent, '#1b7a2f') + block('Sans adresse email — à contacter par téléphone', missing, '#b3261e') + block('Échecs d’envoi', failed, '#b3261e') }),
    text: `Rappels envoyés: ${sent.join(', ') || 'aucun'}\nSans email: ${missing.join(', ') || '—'}\nÉchecs: ${failed.join(', ') || '—'}` };
}
function testMail() {
  return { subject: 'Test — Solid Dance School',
    html: shell({ preheader: 'Les emails du site fonctionnent.', badge: 'Test', title: 'Tout fonctionne ✓', intro: 'Les emails du site Solid Dance School sont bien configurés. Vous recevrez ici les nouvelles inscriptions et les paiements.' }),
    text: 'Les emails du site Solid Dance School fonctionnent.' };
}

module.exports = { sendMail, isConfigured, config, validEmail, ownerNewRegistration, ownerPayment, parentReminder, ownerDigest, testMail, money };
