import type {
  AvailabilityStatus,
  FuelType,
  Transmission,
  VehicleCondition,
} from "@/generated/prisma/enums";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

/** 550000 → "₹5,50,000" */
export function formatINR(amount: number): string {
  return inrFormatter.format(amount);
}

/** 550000 → "₹5.5 Lakh", 12500000 → "₹1.25 Crore" — compact, for filters/chips. */
export function formatINRCompact(amount: number): string {
  if (amount >= 1_00_00_000) return `₹${trimDecimal(amount / 1_00_00_000)} Crore`;
  if (amount >= 1_00_000) return `₹${trimDecimal(amount / 1_00_000)} Lakh`;
  return formatINR(amount);
}

function trimDecimal(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export const CONTACT_FOR_PRICE = "Contact for Price";

/** Public price label. `price` is already null when the admin hid it. */
export function getDisplayPrice(vehicle: { price: number | null; showPrice: boolean }): string {
  return vehicle.showPrice && vehicle.price !== null ? formatINR(vehicle.price) : CONTACT_FOR_PRICE;
}

export function formatKilometres(km: number): string {
  return `${numberFormatter.format(km)} km`;
}

export function formatOwnership(count: number): string {
  const suffix = count === 1 ? "st" : count === 2 ? "nd" : count === 3 ? "rd" : "th";
  return `${count}${suffix} owner`;
}

export const FUEL_LABELS: Record<FuelType, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  CNG: "CNG",
  LPG: "LPG",
  ELECTRIC: "Electric",
  HYBRID: "Hybrid",
  PETROL_CNG: "Petrol + CNG",
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  MANUAL: "Manual",
  AUTOMATIC: "Automatic",
  AMT: "AMT",
  CVT: "CVT",
  DCT: "DCT",
};

export const CONDITION_LABELS: Record<VehicleCondition, string> = {
  EXCELLENT: "Excellent",
  VERY_GOOD: "Very good",
  GOOD: "Good",
  FAIR: "Fair",
};

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
};
