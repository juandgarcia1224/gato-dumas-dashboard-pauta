/** CTAs de Meta más comunes en español. Fallback: prettify del enum. */
const CTA_LABELS: Record<string, string> = {
  WHATSAPP_MESSAGE: "Enviar WhatsApp",
  MESSAGE_PAGE: "Enviar mensaje",
  LEARN_MORE: "Más información",
  SIGN_UP: "Registrarte",
  SUBSCRIBE: "Suscribirte",
  CONTACT_US: "Contactar",
  GET_QUOTE: "Pedir información",
  APPLY_NOW: "Solicitar ahora",
  BOOK_NOW: "Reservar",
  CALL_NOW: "Llamar",
  SHOP_NOW: "Comprar",
  GET_OFFER: "Ver oferta",
};

export function ctaLabel(cta: string): string {
  return (
    CTA_LABELS[cta] ??
    cta.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase())
  );
}
