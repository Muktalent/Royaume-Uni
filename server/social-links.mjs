// social-links-v1
// Normalises employee social profiles into safe, canonical HTTPS URLs.
// Only known platforms and hosts are accepted; anything else is rejected.
export const PLATFORMS = {
  linkedin:  { label: "LinkedIn",  hosts: ["linkedin.com"],                 placeholder: "linkedin.com/in/your-name" },
  instagram: { label: "Instagram", hosts: ["instagram.com"],                placeholder: "@yourname" },
  tiktok:    { label: "TikTok",    hosts: ["tiktok.com"],                   placeholder: "@yourname" },
  facebook:  { label: "Facebook",  hosts: ["facebook.com", "fb.com"],       placeholder: "facebook.com/yourpage" },
  youtube:   { label: "YouTube",   hosts: ["youtube.com"],                  placeholder: "@yourchannel" },
  x:         { label: "X",         hosts: ["x.com", "twitter.com"],         placeholder: "@yourname" },
  whatsapp:  { label: "WhatsApp",  hosts: ["wa.me", "whatsapp.com"],        placeholder: "+212 6 12 34 56 78" }
};
export const PLATFORM_ORDER = Object.keys(PLATFORMS);

export class SocialError extends Error {
  constructor(platform, message) { super(message); this.platform = platform; this.status = 400; }
}

function hostAllowed(host, hosts) {
  const h = host.toLowerCase().replace(/^(www\.|m\.|mobile\.|web\.)/, "");
  return hosts.some(allowed => h === allowed);
}

function parseUrl(raw) {
  let text = raw.trim();
  if (!/^https?:\/\//i.test(text)) text = "https://" + text;
  let url;
  try { url = new URL(text); } catch { return null; }
  if (url.username || url.password || url.port) return null;
  return url;
}

const looksLikeUrl = v => /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/|$)/i.test(v.trim());

// Returns {value, url} or null for empty input. Throws SocialError when invalid.
export function normaliseSocial(platform, input) {
  const spec = PLATFORMS[platform];
  if (!spec) throw new SocialError(platform, "Unsupported platform.");
  if (typeof input !== "string") throw new SocialError(platform, "Invalid value.");
  const raw = input.trim();
  if (!raw) return null;
  if (raw.length > 200 || /[\s<>"'`\\]/.test(raw.replace(/^\+?[\d\s()-]+$/, "")))
    throw new SocialError(platform, `Enter a valid ${spec.label} profile.`);

  if (platform === "whatsapp") {
    let digits;
    if (looksLikeUrl(raw)) {
      const url = parseUrl(raw);
      if (!url || !hostAllowed(url.hostname, spec.hosts)) throw new SocialError(platform, "Use a wa.me link or an international phone number.");
      digits = url.hostname.endsWith("wa.me") ? url.pathname.replace(/\D/g, "") : (url.searchParams.get("phone") || "").replace(/\D/g, "");
    } else {
      if (!/^\+?[\d\s().-]{7,24}$/.test(raw)) throw new SocialError(platform, "Use an international phone number, for example +212 6 12 34 56 78.");
      digits = raw.replace(/^00/, "").replace(/\D/g, "");
    }
    if (!/^[1-9]\d{6,14}$/.test(digits)) throw new SocialError(platform, "Use an international phone number with country code.");
    return { value: "+" + digits, url: "https://wa.me/" + digits };
  }

  let handle = null, path = null;
  if (looksLikeUrl(raw)) {
    const url = parseUrl(raw);
    if (!url || !hostAllowed(url.hostname, spec.hosts)) throw new SocialError(platform, `The link must be a ${spec.label} address.`);
    const parts = url.pathname.split("/").filter(Boolean);
    if (platform === "linkedin") {
      if (parts.length < 2 || !["in", "company", "school", "showcase"].includes(parts[0])) throw new SocialError(platform, "Use your linkedin.com/in/… profile link.");
      if (!/^[A-Za-z0-9\-_%.]{2,100}$/.test(parts[1])) throw new SocialError(platform, "Invalid LinkedIn profile link.");
      return { value: parts[0] + "/" + parts[1], url: `https://www.linkedin.com/${parts[0]}/${parts[1]}` };
    }
    if (platform === "facebook" && parts[0] === "profile.php") {
      const id = url.searchParams.get("id") || "";
      if (!/^\d{5,25}$/.test(id)) throw new SocialError(platform, "Invalid Facebook profile link.");
      return { value: "profile.php?id=" + id, url: "https://www.facebook.com/profile.php?id=" + id };
    }
    if (platform === "youtube" && ["channel", "c", "user"].includes(parts[0])) {
      if (!/^[A-Za-z0-9_-]{2,100}$/.test(parts[1] || "")) throw new SocialError(platform, "Invalid YouTube channel link.");
      return { value: parts[0] + "/" + parts[1], url: `https://www.youtube.com/${parts[0]}/${parts[1]}` };
    }
    handle = parts[0] || "";
    path = parts;
  } else handle = raw;

  handle = handle.replace(/^@/, "");
  const rules = {
    linkedin:  /^[A-Za-z0-9\-_%]{3,100}$/,
    instagram: /^[A-Za-z0-9._]{1,30}$/,
    tiktok:    /^[A-Za-z0-9._]{2,24}$/,
    facebook:  /^[A-Za-z0-9.]{3,50}$/,
    youtube:   /^[A-Za-z0-9._-]{3,30}$/,
    x:         /^[A-Za-z0-9_]{1,15}$/
  };
  const reserved = { instagram: ["p", "reel", "explore", "stories", "accounts"], facebook: ["sharer", "share", "groups", "events", "watch", "login"], x: ["home", "share", "intent", "i", "search"], tiktok: ["tag", "discover", "video"], youtube: ["watch", "shorts", "results", "playlist"] };
  if (!rules[platform].test(handle) || reserved[platform]?.includes(handle.toLowerCase()))
    throw new SocialError(platform, `Enter a valid ${spec.label} username or profile link.`);
  if (path && platform === "linkedin") throw new SocialError(platform, "Use your linkedin.com/in/… profile link.");
  const urls = {
    linkedin:  h => `https://www.linkedin.com/in/${h}`,
    instagram: h => `https://www.instagram.com/${h}/`,
    tiktok:    h => `https://www.tiktok.com/@${h}`,
    facebook:  h => `https://www.facebook.com/${h}`,
    youtube:   h => `https://www.youtube.com/@${h}`,
    x:         h => `https://x.com/${h}`
  };
  return { value: platform === "linkedin" || platform === "facebook" ? handle : "@" + handle, url: urls[platform](handle) };
}

// Accepts {platform: "raw input"}; returns {links: {platform: {value,url}}} or throws.
export function normaliseSocialSet(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new SocialError(null, "Invalid social links.");
  const links = {};
  for (const [platform, value] of Object.entries(input)) {
    if (!PLATFORMS[platform]) throw new SocialError(platform, "Unsupported platform.");
    const normalised = normaliseSocial(platform, value ?? "");
    if (normalised) links[platform] = normalised;
  }
  return links;
}

// Re-validates stored JSON before it is exposed publicly (defence in depth).
export function publicSocials(stored) {
  const out = [];
  if (!stored || typeof stored !== "object") return out;
  for (const platform of PLATFORM_ORDER) {
    const item = stored[platform];
    if (!item?.url) continue;
    try {
      const url = new URL(item.url);
      if (url.protocol !== "https:" || !hostAllowed(url.hostname, PLATFORMS[platform].hosts)) continue;
      out.push({ platform, label: PLATFORMS[platform].label, value: String(item.value || "").slice(0, 120), url: url.href });
    } catch { /* skip invalid stored value */ }
  }
  return out;
}
