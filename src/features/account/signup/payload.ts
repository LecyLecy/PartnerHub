import type { OrganizerRegistration, OrganizerType, SponsorRegistration, UserRegistration } from "@/contracts/account";
import { normalizePhone, stripFormatting } from "@/lib/form/validators";
import type { RegistrationValues } from "./schemas";

const text = (value: string) => value.trim() || null;

function common(values: RegistrationValues) {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: normalizePhone(values.phone) ?? values.phone,
    password: values.password,
    acceptTerms: true as const,
  };
}

export function buildUser(values: RegistrationValues): UserRegistration {
  return { ...common(values), institution: text(values.institution), city: text(values.city), interests: values.interests };
}

export function buildOrganizer(values: RegistrationValues): OrganizerRegistration {
  const individual = values.organizerType === "individual";
  return {
    ...common(values),
    organizerType: values.organizerType as OrganizerType,
    organizationName: individual ? text(values.organizationName) : values.organizationName.trim(),
    description: values.description.trim(),
    city: values.city.trim(),
    address: values.address.trim(),
    position: values.position.trim(),
    website: text(values.website),
    social: text(values.social),
    experience: text(values.experience),
  };
}

export function buildSponsor(values: RegistrationValues): SponsorRegistration {
  return {
    ...common(values),
    position: values.position.trim(),
    companyName: values.companyName.trim(),
    industry: values.industry,
    scale: (values.scale || null) as SponsorRegistration["scale"],
    legalNumber: stripFormatting(values.legalNumber),
    npwp: values.npwp.trim() ? stripFormatting(values.npwp) : null,
    address: values.address.trim(),
    city: values.city.trim(),
    website: values.website.trim(),
    social: text(values.social),
    categories: values.categories,
    budget: text(values.budget),
  };
}
