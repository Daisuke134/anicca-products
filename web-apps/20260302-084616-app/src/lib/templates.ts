export interface SignatureData {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  linkedin: string;
  twitter: string;
  color: string;
}

export const defaultData: SignatureData = {
  name: "Jane Smith",
  title: "Product Designer",
  company: "Acme Inc.",
  email: "jane@acme.com",
  phone: "+1 (555) 123-4567",
  website: "acme.com",
  linkedin: "janesmith",
  twitter: "janesmith",
  color: "#4f46e5",
};

export type TemplateName = "modern" | "minimal" | "bold";

export function generateSignatureHtml(
  data: SignatureData,
  template: TemplateName
): string {
  const { name, title, company, email, phone, website, linkedin, twitter, color } = data;

  const socialLinks = [
    linkedin && `<a href="https://linkedin.com/in/${linkedin}" style="color:${color};text-decoration:none;font-size:13px;">LinkedIn</a>`,
    twitter && `<a href="https://x.com/${twitter}" style="color:${color};text-decoration:none;font-size:13px;">X</a>`,
    website && `<a href="https://${website}" style="color:${color};text-decoration:none;font-size:13px;">${website}</a>`,
  ]
    .filter(Boolean)
    .join(' &nbsp;|&nbsp; ');

  if (template === "modern") {
    return `<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;color:#333;">
  <tr>
    <td style="border-right:3px solid ${color};padding-right:16px;">
      <strong style="font-size:16px;color:#111;">${name}</strong><br/>
      <span style="font-size:13px;color:#555;">${title}${company ? ` at ${company}` : ""}</span>
    </td>
    <td style="padding-left:16px;">
      ${email ? `<div style="font-size:13px;"><a href="mailto:${email}" style="color:${color};text-decoration:none;">${email}</a></div>` : ""}
      ${phone ? `<div style="font-size:13px;color:#555;">${phone}</div>` : ""}
      ${socialLinks ? `<div style="margin-top:4px;">${socialLinks}</div>` : ""}
    </td>
  </tr>
</table>`;
  }

  if (template === "minimal") {
    return `<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;color:#333;">
  <tr><td>
    <strong style="font-size:15px;color:#111;">${name}</strong>
    <span style="font-size:13px;color:#888;"> &mdash; ${title}${company ? `, ${company}` : ""}</span><br/>
    <div style="margin-top:4px;font-size:13px;">
      ${email ? `<a href="mailto:${email}" style="color:${color};text-decoration:none;">${email}</a>` : ""}
      ${phone ? ` &nbsp;|&nbsp; ${phone}` : ""}
    </div>
    ${socialLinks ? `<div style="margin-top:2px;">${socialLinks}</div>` : ""}
  </td></tr>
</table>`;
  }

  // bold template
  return `<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">
  <tr><td style="background:${color};padding:12px 20px;border-radius:8px;">
    <strong style="font-size:18px;color:#fff;">${name}</strong><br/>
    <span style="font-size:13px;color:rgba(255,255,255,0.85);">${title}${company ? ` | ${company}` : ""}</span>
  </td></tr>
  <tr><td style="padding:8px 4px 0;">
    <div style="font-size:13px;">
      ${email ? `<a href="mailto:${email}" style="color:${color};text-decoration:none;">${email}</a>` : ""}
      ${phone ? ` &nbsp;|&nbsp; <span style="color:#555;">${phone}</span>` : ""}
    </div>
    ${socialLinks ? `<div style="margin-top:4px;">${socialLinks}</div>` : ""}
  </td></tr>
</table>`;
}
