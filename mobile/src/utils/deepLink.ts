/**
 * Validation stricte des liens profonds (deep links) et URLs de paiement PayTech.
 */

const ALLOWED_PAYMENT_HOSTS = ['paytech.sn', 'www.paytech.sn'];
const ALLOWED_APP_SCHEMES = ['revibeflip:', 'https:'];

export function isAllowedPayTechUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      ALLOWED_PAYMENT_HOSTS.some(
        (host) => parsed.hostname === host || parsed.hostname.endsWith('.' + host)
      )
    );
  } catch {
    return false;
  }
}

export function isAllowedDeepLink(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (!ALLOWED_APP_SCHEMES.includes(parsed.protocol)) {
      return false;
    }
    if (parsed.protocol === 'https:') {
      return parsed.hostname === 'revibeflip.sn' || parsed.hostname === 'www.revibeflip.sn';
    }
    return true;
  } catch {
    return false;
  }
}
