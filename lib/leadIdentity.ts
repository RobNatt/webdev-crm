const normalize = (value: string | undefined) => (value ?? "").trim().toLowerCase();

export function leadIdentityKey(input: { companyName?: string; website?: string; phone?: string }) {
  const company = normalize(input.companyName);
  const website = normalize(input.website);
  const phone = normalize(input.phone).replace(/[^\d+]/g, "");
  return `${company}|${website}|${phone}`;
}
