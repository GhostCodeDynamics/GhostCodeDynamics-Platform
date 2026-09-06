/**
 * Central place for external business-contact details used across pages.
 *
 * TODO: set the real values.
 *  - GITHUB_ORG_URL: replace the generic github.com placeholder with the
 *    GhostCode Dynamics organization URL (e.g. https://github.com/YourOrg).
 *  - WHATSAPP_NUMBER: digits only, with country code (e.g. "919876543210").
 *    keep null to hide the WhatsApp card until a number is configured.
 */
export const SITE_EMAIL = "ghostcodedynamics@gmail.com";
export const GITHUB_ORG_URL = "https://github.com/ghostcodedynamics";
export const WHATSAPP_NUMBER = "919424733426"; 
export const WHATSAPP_URL = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : null;
