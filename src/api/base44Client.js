// Standalone-shim: geen base44-SDK. SendEmail is een no-op fallback; de echte
// aanvragen gaan via fetch('/api/leads') in de pagina's zelf.
export const base44 = {
  integrations: { Core: { SendEmail: async () => ({ ok: true }) } },
};
export default base44;
