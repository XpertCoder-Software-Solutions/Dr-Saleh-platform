import { escapeHtml } from '../../email/templates/template-helpers';

/**
 * Branded email layout for every notification the platform sends: a navy header with the
 * white logo, a white card with the message, and a footer with the support contacts.
 *
 * Built from tables with inline styles so it renders the same in Gmail, Outlook and Apple
 * Mail. The content is described as blocks (text, a one-time code, a details list, an
 * invoice...) instead of raw HTML, and every value is escaped.
 */

export type EmailTone = 'brand' | 'success' | 'danger' | 'info';

export type InvoiceLine = {
  title: string;
  /** e.g. "دورة", "كتاب ورقي". */
  kind?: string;
  quantity: number;
  unitPrice: string;
  total: string;
};

export type EmailInvoice = {
  number: string;
  date: string;
  status?: string;
  paymentMethod?: string;
  lines: InvoiceLine[];
  subtotal: string;
  discount?: string;
  shipping?: string;
  total: string;
  shippingAddress?: string;
};

export type EmailBlock =
  | { type: 'text'; text: string; muted?: boolean }
  | { type: 'code'; code: string; caption?: string }
  | { type: 'details'; rows: Array<[label: string, value: string]> }
  | { type: 'invoice'; invoice: EmailInvoice }
  | { type: 'note'; text: string; tone?: EmailTone }
  | { type: 'list'; items: string[] };

export type NotificationEmailTemplateParams = {
  brandName: string;
  logoUrl: string;
  platformUrl: string;
  supportEmail: string;
  /** Short text inbox apps show next to the subject. */
  preheader?: string;
  /** Small pill above the title ("تم الدفع"). */
  badge?: string;
  tone?: EmailTone;
  title: string;
  greeting?: string;
  blocks: EmailBlock[];
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  footerNote?: string;
  whatsappUrl?: string;
};

export type BuiltNotificationEmail = {
  htmlContent: string;
  textContent: string;
};

const C = {
  navy: '#0B2E52',
  navy2: '#164A7E',
  ink: '#0C2A4A',
  text: '#33475B',
  muted: '#6B7C8F',
  line: '#E3EAF2',
  surface: '#F4F7FB',
  page: '#EAF0F7',
  gold: '#E8A33D',
  goldSoft: '#FDF3E1',
  blue: '#2F86C9',
  blueSoft: '#EAF4FC',
  green: '#1E8E5A',
  greenSoft: '#E7F6EC',
  red: '#C8423B',
  redSoft: '#FDECEB',
};

const FONT = "'IBM Plex Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif";
const HEAD_FONT =
  "'Readex Pro','IBM Plex Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif";

const TONES: Record<EmailTone, { fg: string; bg: string }> = {
  brand: { fg: C.navy2, bg: C.blueSoft },
  info: { fg: C.blue, bg: C.blueSoft },
  success: { fg: C.green, bg: C.greenSoft },
  danger: { fg: C.red, bg: C.redSoft },
};

const e = escapeHtml;

function textBlock(text: string, muted?: boolean) {
  return `<p style="margin:0 0 14px;font-family:${FONT};font-size:${muted ? 14 : 16}px;line-height:1.9;color:${muted ? C.muted : C.text};">${e(text)}</p>`;
}

function codeBlock(code: string, caption?: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:6px 0 18px;">
  <tr><td align="center" style="background:${C.blueSoft};border:1.5px dashed #9CC6E8;border-radius:16px;padding:22px 12px;">
    <div dir="ltr" style="font-family:'Courier New',Consolas,monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:${C.navy};">${e(code)}</div>
    ${caption ? `<div style="margin-top:8px;font-family:${FONT};font-size:13px;color:${C.muted};">${e(caption)}</div>` : ''}
  </td></tr>
</table>`;
}

function detailsBlock(rows: Array<[string, string]>) {
  const body = rows
    .filter(([, v]) => v && v.trim().length > 0)
    .map(
      ([label, value], i) => `<tr>
      <td style="padding:12px 16px;${i ? `border-top:1px solid ${C.line};` : ''}font-family:${FONT};font-size:14px;color:${C.muted};white-space:nowrap;">${e(label)}</td>
      <td style="padding:12px 16px;${i ? `border-top:1px solid ${C.line};` : ''}font-family:${FONT};font-size:14px;font-weight:700;color:${C.ink};text-align:left;" dir="auto">${e(value)}</td>
    </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:4px 0 18px;background:${C.surface};border-radius:14px;border-collapse:separate;">${body}</table>`;
}

function noteBlock(text: string, tone: EmailTone = 'info') {
  const t = TONES[tone];
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:4px 0 18px;">
  <tr><td style="background:${t.bg};border-right:4px solid ${t.fg};border-radius:12px;padding:14px 16px;font-family:${FONT};font-size:14px;line-height:1.8;color:${C.text};">${e(text)}</td></tr>
</table>`;
}

function listBlock(items: string[]) {
  const rows = items
    .map(
      (item, i) => `<tr>
      <td width="34" valign="top" style="padding:6px 0;">
        <div style="width:26px;height:26px;line-height:26px;border-radius:13px;background:${C.gold};color:${C.navy};text-align:center;font-family:${HEAD_FONT};font-size:13px;font-weight:700;">${i + 1}</div>
      </td>
      <td style="padding:8px 8px 6px 0;font-family:${FONT};font-size:15px;line-height:1.7;color:${C.text};">${e(item)}</td>
    </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">${rows}</table>`;
}

function invoiceBlock(inv: EmailInvoice) {
  const meta: Array<[string, string | undefined]> = [
    ['رقم الفاتورة', inv.number],
    ['التاريخ', inv.date],
    ['طريقة الدفع', inv.paymentMethod],
    ['الحالة', inv.status],
  ];
  // Two per row, so long values (order number, card) stay on one line on phones.
  const cells = meta
    .filter((m): m is [string, string] => Boolean(m[1]))
    .map(
      ([
        label,
        value,
      ]) => `<td width="50%" valign="top" style="padding:0 0 12px 12px;">
        <div style="font-family:${FONT};font-size:12px;color:${C.muted};">${e(label)}</div>
        <div style="font-family:${FONT};font-size:14px;font-weight:700;color:${C.ink};white-space:nowrap;"><span dir="auto">${e(value)}</span></div>
      </td>`,
    );
  const metaRows: string[] = [];
  for (let i = 0; i < cells.length; i += 2) {
    metaRows.push(`<tr>${cells[i]}${cells[i + 1] ?? '<td></td>'}</tr>`);
  }
  const metaCells = metaRows.join('');
  const th = (label: string, align: string, w?: string) =>
    `<th align="${align}" ${w ? `width="${w}"` : ''} style="padding:10px 14px;background:${C.navy};color:#ffffff;font-family:${FONT};font-size:12px;font-weight:700;text-align:${align};">${e(label)}</th>`;
  // Two columns (item, line total) so it reads well on a phone; the kind, quantity and
  // unit price sit under the item name.
  const lines = inv.lines
    .map((l) => {
      const sub = [l.kind, `${l.quantity} × ${l.unitPrice}`]
        .filter(Boolean)
        .join(' · ');
      return `<tr>
      <td style="padding:12px 14px;border-bottom:1px solid ${C.line};font-family:${FONT};font-size:14px;color:${C.ink};line-height:1.6;">
        <b>${e(l.title)}</b><div style="font-size:12px;color:${C.muted};font-weight:400;">${e(sub)}</div>
      </td>
      <td align="left" valign="top" style="padding:12px 14px;border-bottom:1px solid ${C.line};font-family:${FONT};font-size:14px;font-weight:700;color:${C.ink};white-space:nowrap;">${e(l.total)}</td>
    </tr>`;
    })
    .join('');
  const sumRow = (label: string, value: string, color = C.ink) => `<tr>
      <td style="padding:5px 0;font-family:${FONT};font-size:14px;color:${C.muted};">${e(label)}</td>
      <td align="left" style="padding:5px 0;font-family:${FONT};font-size:14px;font-weight:700;color:${color};white-space:nowrap;">${e(value)}</td>
    </tr>`;

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:6px 0 20px;border:1px solid ${C.line};border-radius:16px;border-collapse:separate;overflow:hidden;">
  <tr><td style="padding:18px 18px 6px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
      <td style="font-family:${HEAD_FONT};font-size:18px;font-weight:700;color:${C.navy};padding-bottom:12px;">الفاتورة</td>
    </tr></table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${metaCells}</table>
  </td></tr>
  <tr><td style="padding:0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>${th('البند', 'right')}${th('الإجمالي', 'left', '110')}</tr>
      ${lines}
    </table>
  </td></tr>
  <tr><td style="padding:14px 18px 6px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      ${sumRow('المجموع', inv.subtotal)}
      ${inv.discount ? sumRow('الخصم', inv.discount, C.green) : ''}
      ${inv.shipping ? sumRow('الشحن', inv.shipping) : ''}
    </table>
  </td></tr>
  <tr><td style="padding:6px 18px 18px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.goldSoft};border-radius:12px;">
      <tr>
        <td style="padding:14px 16px;font-family:${HEAD_FONT};font-size:16px;font-weight:700;color:${C.ink};">الإجمالي</td>
        <td align="left" style="padding:14px 16px;font-family:${HEAD_FONT};font-size:20px;font-weight:700;color:${C.navy};white-space:nowrap;">${e(inv.total)}</td>
      </tr>
    </table>
  </td></tr>
  ${
    inv.shippingAddress
      ? `<tr><td style="padding:0 18px 18px;font-family:${FONT};font-size:13px;line-height:1.8;color:${C.text};"><span style="color:${C.muted};">عنوان الشحن: </span>${e(inv.shippingAddress)}</td></tr>`
      : ''
  }
</table>`;
}

function renderBlock(block: EmailBlock): string {
  switch (block.type) {
    case 'text':
      return textBlock(block.text, block.muted);
    case 'code':
      return codeBlock(block.code, block.caption);
    case 'details':
      return detailsBlock(block.rows);
    case 'invoice':
      return invoiceBlock(block.invoice);
    case 'note':
      return noteBlock(block.text, block.tone);
    case 'list':
      return listBlock(block.items);
  }
}

function blockToText(block: EmailBlock): string[] {
  switch (block.type) {
    case 'text':
    case 'note':
      return [block.text];
    case 'code':
      return [block.code, block.caption ?? ''];
    case 'details':
      return block.rows.filter(([, v]) => v).map(([l, v]) => `${l}: ${v}`);
    case 'list':
      return block.items.map((item, i) => `${i + 1}. ${item}`);
    case 'invoice': {
      const inv = block.invoice;
      return [
        `الفاتورة ${inv.number} — ${inv.date}`,
        ...inv.lines.map((l) => `- ${l.title} × ${l.quantity}: ${l.total}`),
        `المجموع: ${inv.subtotal}`,
        inv.discount ? `الخصم: − ${inv.discount}` : '',
        inv.shipping ? `الشحن: ${inv.shipping}` : '',
        `الإجمالي: ${inv.total}`,
        inv.paymentMethod ? `طريقة الدفع: ${inv.paymentMethod}` : '',
        inv.shippingAddress ? `عنوان الشحن: ${inv.shippingAddress}` : '',
      ];
    }
  }
}

export function buildNotificationEmailTemplate({
  brandName,
  logoUrl,
  platformUrl,
  supportEmail,
  preheader,
  badge,
  tone = 'brand',
  title,
  greeting,
  blocks,
  ctaLabel,
  ctaUrl,
  secondaryLabel,
  secondaryUrl,
  footerNote,
  whatsappUrl,
}: NotificationEmailTemplateParams): BuiltNotificationEmail {
  const t = TONES[tone];
  const home = e(platformUrl);
  const cta =
    ctaLabel && ctaUrl
      ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 6px;"><tr>
          <td style="border-radius:999px;background:${C.gold};box-shadow:0 10px 22px -12px rgba(232,163,61,.9);">
            <a href="${e(ctaUrl)}" style="display:inline-block;padding:14px 30px;font-family:${HEAD_FONT};font-size:15px;font-weight:700;color:${C.navy};text-decoration:none;border-radius:999px;">${e(ctaLabel)}</a>
          </td>
          ${
            secondaryLabel && secondaryUrl
              ? `<td width="10"></td><td style="border-radius:999px;border:1.5px solid ${C.line};">
            <a href="${e(secondaryUrl)}" style="display:inline-block;padding:12.5px 22px;font-family:${HEAD_FONT};font-size:14px;font-weight:700;color:${C.navy2};text-decoration:none;border-radius:999px;">${e(secondaryLabel)}</a>
          </td>`
              : ''
          }
        </tr></table>`
      : '';

  const htmlContent = `<!doctype html>
<html lang="ar" dir="rtl" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${e(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;700&family=Readex+Pro:wght@500;700&display=swap" rel="stylesheet">
  <style>
    @media (max-width:620px){
      .px{padding-left:20px!important;padding-right:20px!important}
      .title{font-size:22px!important}
    }
    a{color:${C.blue}}
  </style>
</head>
<body style="margin:0;padding:0;background:${C.page};" dir="rtl">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${e(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>` : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.page};" dir="rtl">
    <tr><td align="center" style="padding:28px 12px 36px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">

        <!-- Header -->
        <tr><td align="center" bgcolor="${C.navy}" style="background:${C.navy};background-image:linear-gradient(135deg,${C.navy} 0%,${C.navy2} 100%);border-radius:24px 24px 0 0;padding:30px 24px 26px;">
          <a href="${home}" style="text-decoration:none;"><img src="${e(logoUrl)}" width="150" alt="${e(brandName)}" style="display:block;width:150px;max-width:150px;height:auto;border:0;"></a>
          <div style="margin-top:10px;font-family:${FONT};font-size:12px;letter-spacing:.3px;color:#B9CDE3;">التربية الواعية بتبدأ بفهم طفلك</div>
        </td></tr>
        <tr><td style="background:${C.gold};height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>

        <!-- Card -->
        <tr><td class="px" bgcolor="#ffffff" style="background:#ffffff;padding:34px 36px 30px;text-align:right;">
          ${badge ? `<div style="display:inline-block;margin-bottom:14px;padding:5px 14px;border-radius:999px;background:${t.bg};color:${t.fg};font-family:${HEAD_FONT};font-size:13px;font-weight:700;">${e(badge)}</div>` : ''}
          <h1 class="title" style="margin:0 0 14px;font-family:${HEAD_FONT};font-size:26px;line-height:1.4;font-weight:700;color:${C.ink};">${e(title)}</h1>
          ${greeting ? `<p style="margin:0 0 14px;font-family:${FONT};font-size:17px;font-weight:700;color:${C.ink};">${e(greeting)}</p>` : ''}
          ${blocks.map(renderBlock).join('\n')}
          ${cta}
          ${footerNote ? `<p style="margin:20px 0 0;font-family:${FONT};font-size:13px;line-height:1.8;color:${C.muted};">${e(footerNote)}</p>` : ''}
        </td></tr>

        <!-- Help -->
        <tr><td class="px" bgcolor="${C.surface}" style="background:${C.surface};padding:20px 36px;border-top:1px solid ${C.line};text-align:right;">
          <p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.9;color:${C.text};">
            محتاج مساعدة؟ ابعتلنا على
            <a href="mailto:${e(supportEmail)}" style="color:${C.blue};font-weight:700;text-decoration:none;" dir="ltr">${e(supportEmail)}</a>${
              whatsappUrl
                ? ` أو كلّمنا على <a href="${e(whatsappUrl)}" style="color:${C.green};font-weight:700;text-decoration:none;">واتساب</a>`
                : ''
            }
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="background:${C.navy};border-radius:0 0 24px 24px;padding:22px 24px;">
          <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;">
            <a href="${home}" style="color:#ffffff;text-decoration:none;font-weight:700;">الرئيسية</a>
            <span style="color:#5D7E9F;">&nbsp;·&nbsp;</span>
            <a href="${home}/courses" style="color:#ffffff;text-decoration:none;font-weight:700;">الدورات</a>
            <span style="color:#5D7E9F;">&nbsp;·&nbsp;</span>
            <a href="${home}/account" style="color:#ffffff;text-decoration:none;font-weight:700;">حسابي</a>
          </p>
          <p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.7;color:#8FA9C4;">رسالة تلقائية من ${e(brandName)} — من فضلك متردّش عليها.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textContent = [
    title,
    '',
    greeting,
    ...blocks.flatMap(blockToText),
    '',
    ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}` : undefined,
    secondaryLabel && secondaryUrl
      ? `${secondaryLabel}: ${secondaryUrl}`
      : undefined,
    footerNote,
    `للمساعدة: ${supportEmail}`,
    `— ${brandName}`,
  ]
    .filter((line): line is string => typeof line === 'string' && line !== '')
    .join('\n');

  return { htmlContent, textContent };
}
