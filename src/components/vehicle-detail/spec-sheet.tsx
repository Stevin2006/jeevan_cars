import type { VehicleDetailData } from "@/lib/data/vehicles";
import {
  CONDITION_LABELS,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  formatKilometres,
  formatOwnership,
} from "@/lib/format";

type Row = { label: string; value: string };

function SpecGroup({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <h3 className="mb-3 label-caps text-muted-foreground">{title}</h3>
      <dl className="divide-y rounded-lg border bg-surface">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-3 text-sm sm:px-5"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Core specifications plus admin-defined extra rows, grouped as entered. */
export function SpecSheet({ vehicle }: { vehicle: VehicleDetailData }) {
  const core: Row[] = [
    { label: "Brand", value: vehicle.brand.name },
    { label: "Model", value: vehicle.model },
    ...(vehicle.variant ? [{ label: "Variant", value: vehicle.variant }] : []),
    { label: "Category", value: vehicle.category.name },
    { label: "Manufacturing year", value: String(vehicle.manufacturingYear) },
    ...(vehicle.registrationYear
      ? [{ label: "Registration year", value: String(vehicle.registrationYear) }]
      : []),
    { label: "Kilometres driven", value: formatKilometres(vehicle.kilometresDriven) },
    { label: "Fuel", value: FUEL_LABELS[vehicle.fuelType] },
    { label: "Transmission", value: TRANSMISSION_LABELS[vehicle.transmission] },
    { label: "Ownership", value: formatOwnership(vehicle.ownershipCount) },
    { label: "Condition", value: CONDITION_LABELS[vehicle.condition] },
    ...(vehicle.colour ? [{ label: "Colour", value: vehicle.colour }] : []),
    ...(vehicle.seatingCapacity
      ? [{ label: "Seating", value: `${vehicle.seatingCapacity} seats` }]
      : []),
  ];

  const extraGroups = new Map<string, Row[]>();
  for (const spec of vehicle.specifications) {
    const rows = extraGroups.get(spec.group) ?? [];
    rows.push({ label: spec.label, value: spec.value });
    extraGroups.set(spec.group, rows);
  }

  return (
    <div className="space-y-8">
      <SpecGroup title="Specifications" rows={core} />
      {[...extraGroups].map(([group, rows]) => (
        <SpecGroup key={group} title={group} rows={rows} />
      ))}
    </div>
  );
}
