const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

/** "Gratis" for 0, otherwise "Rp50.000". Display only: PartnerHub does not take payments. */
export const formatPrice = (priceIdr: number) => priceIdr <= 0 ? "Gratis" : rupiah.format(priceIdr).replace(/\s/g, "");