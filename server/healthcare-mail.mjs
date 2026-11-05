// MUKTalent Healthcare · transactional email (Resend). Candidate-facing mail in EN / ES / AR / FR.
const SITE = () => (process.env.PUBLIC_SITE_URL || "https://www.muktalent.com").replace(/\/+$/, "");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const T = {
  en: {
    dir: "ltr", hello: n => `Dear ${n},`,
    regSubject: r => `Your MUKTalent Healthcare registration · ${r}`,
    regBody: r => [`Thank you for registering with MUKTalent Healthcare. Your candidate reference is <b>${r}</b>.`, "A member of our recruitment team will review your profile. If your experience matches current opportunities, a recruitment consultant will contact you to discuss the next steps.", "MUKTalent Healthcare does not charge candidates recruitment or work-finding fees. We cannot guarantee employment, visa approval, professional registration or a specific salary."],
    regPortal: "Create your secure candidate portal account with this same email address to follow your progress, upload requested documents and message your consultant.",
    regPortalCta: "Open the candidate portal",
    restricted: "Important: your country of residence is currently listed under the UK Code of Practice for international recruitment. We are not permitted to actively recruit from this country, so we will not match you with employers. You can still apply directly to advertised UK vacancies, for example through NHS Jobs.",
    dupSubject: "You are already registered with MUKTalent Healthcare",
    dupBody: ["We received a new registration request with this email address, but a candidate profile already exists.", "Sign in to your candidate portal to update your details, or reply to this email if you need help."],
    enqSubject: r => `We have received your enquiry · ${r}`,
    enqBody: r => [`Thank you for contacting MUKTalent Healthcare. Your enquiry reference is <b>${r}</b>.`, "The relevant team will reply within two working days."],
    cmpSubject: r => `Complaint received · ${r}`,
    cmpBody: (r, d) => [`We have recorded your complaint under reference <b>${r}</b>.`, `We will acknowledge it formally within ${d.ack} working days and aim to provide a full response within ${d.resp} working days, in line with our Complaints Procedure.`, "If you are not satisfied with our final response, you can escalate your concern to the bodies listed in the procedure, including the Employment Agency Standards Inspectorate and NHS Employers (internationalrecruitment@nhsconfed.org)."],
    stageSubject: "Update on your recruitment journey",
    stageBody: s => [`Your recruitment journey has moved to: <b>${s}</b>.`, "Sign in to your portal for details."],
    docSubject: "A document has been requested",
    docBody: l => [`Your consultant has requested: <b>${l}</b>.`, "Please upload it securely through your candidate portal. Do not send identity documents by email."],
    msgSubject: "New message from your MUKTalent Healthcare consultant",
    msgBody: ["You have a new message in your candidate portal."],
    sign: "MUKTalent Healthcare · Maghreb UK Talent Ltd · London, United Kingdom",
    footer: "You are receiving this email because you contacted MUKTalent Healthcare. Privacy notice:"
  },
  es: {
    dir: "ltr", hello: n => `Estimado/a ${n}:`,
    regSubject: r => `Tu registro en MUKTalent Healthcare · ${r}`,
    regBody: r => [`Gracias por registrarte en MUKTalent Healthcare. Tu referencia de candidato es <b>${r}</b>.`, "Un miembro de nuestro equipo revisará tu perfil. Si tu experiencia encaja con las oportunidades actuales, un consultor de selección se pondrá en contacto contigo para hablar de los siguientes pasos.", "MUKTalent Healthcare no cobra a los candidatos tarifas de selección ni de búsqueda de empleo. No podemos garantizar empleo, aprobación de visado, registro profesional ni un salario concreto."],
    regPortal: "Crea tu cuenta segura en el portal del candidato con este mismo correo para seguir tu proceso, subir los documentos que te pidamos y escribir a tu consultor.",
    regPortalCta: "Abrir el portal del candidato",
    restricted: "Importante: tu país de residencia figura actualmente en el Código de Prácticas del Reino Unido para la contratación internacional. No se nos permite reclutar activamente en este país, por lo que no te presentaremos a empleadores. Aun así, puedes presentar tu candidatura directamente a vacantes publicadas en el Reino Unido, por ejemplo en NHS Jobs.",
    dupSubject: "Ya estás registrado/a en MUKTalent Healthcare",
    dupBody: ["Hemos recibido una nueva solicitud de registro con este correo, pero ya existe un perfil de candidato.", "Inicia sesión en tu portal para actualizar tus datos o responde a este correo si necesitas ayuda."],
    enqSubject: r => `Hemos recibido tu consulta · ${r}`,
    enqBody: r => [`Gracias por contactar con MUKTalent Healthcare. La referencia de tu consulta es <b>${r}</b>.`, "El equipo correspondiente te responderá en un plazo de dos días laborables."],
    cmpSubject: r => `Reclamación recibida · ${r}`,
    cmpBody: (r, d) => [`Hemos registrado tu reclamación con la referencia <b>${r}</b>.`, `Te enviaremos un acuse formal en ${d.ack} días laborables y procuraremos darte una respuesta completa en ${d.resp} días laborables, según nuestro Procedimiento de Reclamaciones.`, "Si no estás de acuerdo con nuestra respuesta final, puedes elevar tu caso a los organismos indicados en el procedimiento, como la Employment Agency Standards Inspectorate y NHS Employers (internationalrecruitment@nhsconfed.org)."],
    stageSubject: "Novedades en tu proceso de selección",
    stageBody: s => [`Tu proceso ha avanzado a: <b>${s}</b>.`, "Inicia sesión en tu portal para ver los detalles."],
    docSubject: "Se ha solicitado un documento",
    docBody: l => [`Tu consultor ha solicitado: <b>${l}</b>.`, "Súbelo de forma segura a través de tu portal. No envíes documentos de identidad por correo electrónico."],
    msgSubject: "Nuevo mensaje de tu consultor de MUKTalent Healthcare",
    msgBody: ["Tienes un mensaje nuevo en tu portal del candidato."],
    sign: "MUKTalent Healthcare · Maghreb UK Talent Ltd · Londres, Reino Unido",
    footer: "Recibes este correo porque contactaste con MUKTalent Healthcare. Aviso de privacidad:"
  },
  fr: {
    dir: "ltr", hello: n => `Bonjour ${n},`,
    regSubject: r => `Votre inscription MUKTalent Healthcare · ${r}`,
    regBody: r => [`Merci de votre inscription auprès de MUKTalent Healthcare. Votre référence candidat est <b>${r}</b>.`, "Un membre de notre équipe examinera votre profil. Si votre expérience correspond aux opportunités actuelles, un consultant en recrutement vous contactera pour les prochaines étapes.", "MUKTalent Healthcare ne facture aux candidats aucuns frais de recrutement ou de placement. Nous ne pouvons garantir ni un emploi, ni l’obtention d’un visa, ni l’enregistrement professionnel, ni un salaire précis."],
    regPortal: "Créez votre compte sécurisé sur le portail candidat avec cette même adresse e-mail pour suivre votre parcours, déposer les documents demandés et écrire à votre consultant.",
    regPortalCta: "Ouvrir le portail candidat",
    restricted: "Important : votre pays de résidence figure actuellement sur la liste du Code de bonnes pratiques britannique pour le recrutement international. Nous ne sommes pas autorisés à recruter activement dans ce pays et ne vous présenterons donc pas à des employeurs. Vous pouvez toutefois postuler directement aux offres publiées au Royaume-Uni, par exemple sur NHS Jobs.",
    dupSubject: "Vous êtes déjà inscrit(e) chez MUKTalent Healthcare",
    dupBody: ["Nous avons reçu une nouvelle demande d’inscription avec cette adresse, mais un profil candidat existe déjà.", "Connectez-vous à votre portail pour mettre à jour vos informations, ou répondez à cet e-mail si vous avez besoin d’aide."],
    enqSubject: r => `Nous avons bien reçu votre demande · ${r}`,
    enqBody: r => [`Merci d’avoir contacté MUKTalent Healthcare. La référence de votre demande est <b>${r}</b>.`, "L’équipe concernée vous répondra sous deux jours ouvrés."],
    cmpSubject: r => `Réclamation reçue · ${r}`,
    cmpBody: (r, d) => [`Nous avons enregistré votre réclamation sous la référence <b>${r}</b>.`, `Nous en accuserons formellement réception sous ${d.ack} jours ouvrés et visons une réponse complète sous ${d.resp} jours ouvrés, conformément à notre procédure de réclamation.`, "Si notre réponse finale ne vous satisfait pas, vous pouvez saisir les organismes indiqués dans la procédure, notamment l’Employment Agency Standards Inspectorate et NHS Employers (internationalrecruitment@nhsconfed.org)."],
    stageSubject: "Mise à jour de votre parcours de recrutement",
    stageBody: s => [`Votre parcours est passé à l’étape : <b>${s}</b>.`, "Connectez-vous à votre portail pour plus de détails."],
    docSubject: "Un document vous est demandé",
    docBody: l => [`Votre consultant vous demande : <b>${l}</b>.`, "Déposez-le de manière sécurisée via votre portail. N’envoyez pas de pièces d’identité par e-mail."],
    msgSubject: "Nouveau message de votre consultant MUKTalent Healthcare",
    msgBody: ["Vous avez un nouveau message dans votre portail candidat."],
    sign: "MUKTalent Healthcare · Maghreb UK Talent Ltd · Londres, Royaume-Uni",
    footer: "Vous recevez cet e-mail car vous avez contacté MUKTalent Healthcare. Politique de confidentialité :"
  },
  ar: {
    dir: "rtl", hello: n => `${n} المحترم/ة،`,
    regSubject: r => `تسجيلك في MUKTalent Healthcare · ${r}`,
    regBody: r => [`شكرًا لتسجيلك في MUKTalent Healthcare. رقمك المرجعي كمرشح هو <b>${r}</b>.`, "سيقوم أحد أعضاء فريق التوظيف بمراجعة ملفك. إذا كانت خبرتك تتوافق مع الفرص المتاحة، سيتواصل معك مستشار توظيف لمناقشة الخطوات التالية.", "لا تفرض MUKTalent Healthcare على المرشحين أي رسوم توظيف أو رسوم للبحث عن عمل. لا يمكننا ضمان الحصول على وظيفة أو الموافقة على التأشيرة أو التسجيل المهني أو راتب محدد."],
    regPortal: "أنشئ حسابك الآمن في بوابة المرشح باستخدام عنوان البريد الإلكتروني نفسه لمتابعة تقدمك، ورفع المستندات المطلوبة، ومراسلة مستشارك.",
    regPortalCta: "فتح بوابة المرشح",
    restricted: "تنبيه مهم: بلد إقامتك مدرج حاليًا ضمن مدونة الممارسات البريطانية للتوظيف الدولي. لا يُسمح لنا بالتوظيف النشط من هذا البلد، ولذلك لن نرشحك لأصحاب العمل. لا يزال بإمكانك التقدم مباشرة إلى الوظائف المعلنة في المملكة المتحدة، مثل موقع NHS Jobs.",
    dupSubject: "أنت مسجل/ة بالفعل في MUKTalent Healthcare",
    dupBody: ["تلقينا طلب تسجيل جديدًا بهذا البريد الإلكتروني، لكن لديك ملف مرشح موجود بالفعل.", "سجّل الدخول إلى بوابتك لتحديث بياناتك، أو رُدّ على هذه الرسالة إذا احتجت إلى مساعدة."],
    enqSubject: r => `تلقينا استفسارك · ${r}`,
    enqBody: r => [`شكرًا لتواصلك مع MUKTalent Healthcare. الرقم المرجعي لاستفسارك هو <b>${r}</b>.`, "سيرد عليك الفريق المختص خلال يومي عمل."],
    cmpSubject: r => `تم استلام الشكوى · ${r}`,
    cmpBody: (r, d) => [`سجّلنا شكواك تحت الرقم المرجعي <b>${r}</b>.`, `سنؤكد استلامها رسميًا خلال ${d.ack} أيام عمل ونسعى إلى تقديم رد كامل خلال ${d.resp} يوم عمل وفقًا لإجراءات الشكاوى لدينا.`, "إذا لم تكن راضيًا عن ردنا النهائي، يمكنك رفع الأمر إلى الجهات المذكورة في الإجراء، بما في ذلك Employment Agency Standards Inspectorate وNHS Employers (internationalrecruitment@nhsconfed.org)."],
    stageSubject: "تحديث بشأن مسار توظيفك",
    stageBody: s => [`انتقل مسار توظيفك إلى: <b>${s}</b>.`, "سجّل الدخول إلى بوابتك للاطلاع على التفاصيل."],
    docSubject: "تم طلب مستند",
    docBody: l => [`طلب مستشارك: <b>${l}</b>.`, "يرجى رفعه بأمان عبر بوابة المرشح. لا ترسل وثائق الهوية عبر البريد الإلكتروني."],
    msgSubject: "رسالة جديدة من مستشارك في MUKTalent Healthcare",
    msgBody: ["لديك رسالة جديدة في بوابة المرشح."],
    sign: "MUKTalent Healthcare · Maghreb UK Talent Ltd · لندن، المملكة المتحدة",
    footer: "تتلقى هذه الرسالة لأنك تواصلت مع MUKTalent Healthcare. إشعار الخصوصية:"
  }
};
export const mailText = lang => T[lang] || T.en;

function layout(lang, title, paragraphs, cta) {
  const t = mailText(lang);
  const body = paragraphs.map(p => `<p style="margin:0 0 14px;line-height:1.6">${p}</p>`).join("");
  const button = cta ? `<p style="margin:22px 0"><a href="${esc(cta.href)}" style="background:#292929;color:#F7F5F0;text-decoration:none;padding:12px 22px;border-radius:999px;display:inline-block;font-weight:600">${esc(cta.label)}</a></p>` : "";
  return `<!doctype html><html lang="${lang}" dir="${t.dir}"><body style="margin:0;background:#F7F5F0;font-family:Helvetica,Arial,sans-serif;color:#292929">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F0;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #E3E3E1">
<tr><td style="background:#292929;padding:22px 28px;color:#F7F5F0;font-size:13px;letter-spacing:.18em;text-transform:uppercase">MUKTalent <span style="color:#B7A078">Healthcare</span></td></tr>
<tr><td style="padding:30px 28px 10px;font-size:15px" dir="${t.dir}"><h1 style="font-family:Georgia,serif;font-weight:500;font-size:22px;margin:0 0 18px;color:#292929">${esc(title)}</h1>${body}${button}</td></tr>
<tr><td style="padding:16px 28px 26px;font-size:12px;color:#6E6E67;border-top:1px solid #E3E3E1" dir="${t.dir}">${esc(t.sign)}<br>${esc(t.footer)} <a href="${SITE()}/healthcare/candidate-privacy/" style="color:#292929">${SITE().replace(/^https?:\/\//, "")}/healthcare/candidate-privacy/</a></td></tr>
</table></td></tr></table></body></html>`;
}
const plain = html => html.replace(/<br>/g, "\n").replace(/<\/p>/g, "\n\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, "\n\n").trim();

export async function sendMail({ to, subject, html, replyTo, idempotencyKey }) {
  if (!process.env.RESEND_API_KEY || !process.env.BOOKING_FROM_EMAIL || !to) return "skipped";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(7000),
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
      body: JSON.stringify({ from: process.env.BOOKING_FROM_EMAIL, to: Array.isArray(to) ? to : [to], reply_to: replyTo || "agents@muktalent.com", subject, html, text: plain(html) })
    });
    return r.ok ? "sent" : "failed";
  } catch { return "failed"; }
}

export function candidateMail(kind, lang, data) {
  const t = mailText(lang);
  const portal = { href: SITE() + "/healthcare/portal/", label: t.regPortalCta };
  switch (kind) {
    case "registered": {
      const p = [t.hello(esc(data.name)), ...t.regBody(esc(data.reference))];
      if (data.restricted) p.push(`<span style="display:block;background:#F7F5F0;border-left:3px solid #B7A078;padding:10px 14px">${esc(t.restricted)}</span>`);
      p.push(esc(t.regPortal));
      return { subject: t.regSubject(data.reference), html: layout(lang, t.regSubject(data.reference), p, portal) };
    }
    case "duplicate":
      return { subject: t.dupSubject, html: layout(lang, t.dupSubject, [t.hello(esc(data.name)), ...t.dupBody.map(esc)], portal) };
    case "enquiry":
      return { subject: t.enqSubject(data.reference), html: layout(lang, t.enqSubject(data.reference), [t.hello(esc(data.name)), ...t.enqBody(esc(data.reference))]) };
    case "complaint":
      return { subject: t.cmpSubject(data.reference), html: layout(lang, t.cmpSubject(data.reference), [t.hello(esc(data.name)), ...t.cmpBody(esc(data.reference), data.days)]) };
    case "stage":
      return { subject: t.stageSubject, html: layout(lang, t.stageSubject, [t.hello(esc(data.name)), ...t.stageBody(esc(data.stage))], portal) };
    case "document":
      return { subject: t.docSubject, html: layout(lang, t.docSubject, [t.hello(esc(data.name)), ...t.docBody(esc(data.label))], portal) };
    case "message":
      return { subject: t.msgSubject, html: layout(lang, t.msgSubject, [t.hello(esc(data.name)), ...t.msgBody.map(esc)], portal) };
    default: throw new Error("Unknown mail kind");
  }
}

// Internal notification to the recruitment team (English).
export function teamMail(title, rows, link) {
  const table = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">${rows.filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => `<tr><td style="padding:7px 10px 7px 0;color:#6E6E67;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:7px 0;border-bottom:1px solid #F7F5F0">${esc(v)}</td></tr>`).join("")}</table>`;
  return { subject: `[Healthcare] ${title}`, html: layout("en", title, [table], link ? { href: SITE() + link, label: "Open in Healthcare Management" } : null) };
}
