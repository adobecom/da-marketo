const CONSENT_REMINDER_KEY = 'milo:marketo-consent-reminder';
const MAX_AGE = 10 * 60 * 1000;

export function updateConsentReminder(values, destination) {
  try {
    sessionStorage.removeItem(CONSENT_REMINDER_KEY);
    // Germany's cs3P;ve1 notice uses this checkbox name.
    if (values?.Country !== 'DE' || values.mktoKoreaPrivacyThirdParty !== 'yes' || !destination) return;

    // The custom runtime only treats absolute URLs as redirect destinations.
    const url = new URL(destination);
    if (url.origin !== window.location.origin || url.pathname === window.location.pathname) {
      window.lana?.log('Marketo consent reminder requires a separate same-origin thank-you page', { tags: 'marketo', severity: 'w' });
      return;
    }

    sessionStorage.setItem(CONSENT_REMINDER_KEY, JSON.stringify({
      version: 1,
      destination: `${url.origin}${url.pathname}`,
      createdAt: Date.now(),
    }));
  } catch {
    window.lana?.log('Could not update Marketo consent reminder', { tags: 'marketo', severity: 'w' });
  }
}

export function consumeReminder() {
  try {
    const raw = sessionStorage.getItem(CONSENT_REMINDER_KEY);
    if (!raw) return false;
    let reminder;
    try {
      reminder = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(CONSENT_REMINDER_KEY);
      window.lana?.log('Could not read Marketo consent reminder', { tags: 'marketo', severity: 'w' });
      return false;
    }
    if (reminder?.version === 1
      && Number.isFinite(reminder.createdAt)
      && typeof reminder.destination === 'string') {
      const age = Date.now() - reminder.createdAt;
      if (age >= 0 && age <= MAX_AGE) {
        if (reminder.destination !== `${window.location.origin}${window.location.pathname}`) return false;
        sessionStorage.removeItem(CONSENT_REMINDER_KEY);
        return true;
      }
    }
    sessionStorage.removeItem(CONSENT_REMINDER_KEY);
    window.lana?.log('Discarding invalid or expired Marketo consent reminder', { tags: 'marketo', severity: 'w' });
  } catch {
    window.lana?.log('Could not read Marketo consent reminder', { tags: 'marketo', severity: 'w' });
  }
  return false;
}
