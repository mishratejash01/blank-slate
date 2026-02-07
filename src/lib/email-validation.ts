const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'aol.com', 'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'proton.me', 'zoho.com',
  'mail.com', 'yandex.com', 'gmx.com', 'gmx.net',
  'tutanota.com', 'fastmail.com', 'hushmail.com',
  'inbox.com', 'rediffmail.com',
];

export function isWorkspaceEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !PUBLIC_EMAIL_DOMAINS.includes(domain);
}

export function getOrganizationDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}
