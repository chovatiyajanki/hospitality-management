export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const clinicMapsUrl = "https://maps.app.goo.gl/wbXjsdfjXJFM1uMb6?g_st=aw";
export const clinicAddress = "7,8, Bhagirath Soc Vibhag 2, Lambe Hanuman Rd, Vasundhara Society, Shivnagar Society, Varachha, Surat, Gujarat 395006";
export const clinicPhone = "+91 99135 67716";

export function whatsappUrl(phone, text = "") {
  const digits = String(phone || "").replace(/\D/g, "");
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  const msg = encodeURIComponent(text);
  return `https://wa.me/${withCountry}${msg ? `?text=${msg}` : ""}`;
}

export function telHref(phone) {
  const digits = String(phone || "").replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}
