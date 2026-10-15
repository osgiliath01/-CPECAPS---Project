const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

export const money = (n) => peso.format(Number(n) || 0);
export const cents = (n) => Math.round((Number(n) || 0) * 100);
export const todayISO = () => new Date().toLocaleDateString("en-CA");

export const fmtDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const fmtStamp = (iso) =>
  new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });