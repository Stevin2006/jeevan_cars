import { beforeAll, describe, expect, it } from "vitest";
import { getCatalogueFacets } from "@/lib/data/taxonomy";
import { getRelatedVehicles, getVehicleBySlug, searchVehicles } from "@/lib/data/vehicles";
import { parseCatalogueParams } from "@/lib/validations/catalogue-params";
import { createTaxonomy, createVehicle, prisma, resetDatabase } from "../helpers/db";

let refs: Awaited<ReturnType<typeof createTaxonomy>>;
const search = (query: Record<string, string>) => searchVehicles(parseCatalogueParams(query));
const names = (result: Awaited<ReturnType<typeof search>>) =>
  result.vehicles.map((vehicle) => vehicle.name);

beforeAll(async () => {
  await resetDatabase();
  refs = await createTaxonomy();
  const suv = { categoryId: refs.suv.id, brandId: refs.hyundai.id };
  const sedan = { categoryId: refs.sedan.id, brandId: refs.honda.id };
  const day = (n: number) => new Date(Date.UTC(2026, 9, n));

  await createVehicle(suv, {
    name: "Creta Diesel",
    model: "Creta",
    slug: "creta",
    fuelType: "DIESEL",
    price: 1_200_000,
    manufacturingYear: 2021,
    createdAt: day(5),
  });
  await createVehicle(suv, {
    name: "Venue Petrol",
    model: "Venue",
    slug: "venue",
    price: 800_000,
    ownershipCount: 3,
    manufacturingYear: 2019,
    createdAt: day(4),
  });
  await createVehicle(sedan, {
    name: "City CVT",
    model: "City",
    slug: "city",
    transmission: "CVT",
    price: 950_000,
    availability: "RESERVED",
    manufacturingYear: 2018,
    createdAt: day(3),
  });
  // Hidden price: stored, but must never leak or match price filters.
  await createVehicle(sedan, {
    name: "Accord Hybrid",
    model: "Accord",
    slug: "accord",
    fuelType: "HYBRID",
    price: 400_000,
    showPrice: false,
    registrationNumber: "KL 07 AB 1234",
    internalNotes: "secret",
    createdAt: day(2),
  });
  await createVehicle(suv, {
    name: "Sold Tucson",
    slug: "sold",
    availability: "SOLD",
    createdAt: day(1),
  });
  await createVehicle(suv, {
    name: "Draft Alcazar",
    slug: "draft",
    status: "DRAFT",
    createdAt: day(6),
  });
});

describe("searchVehicles", () => {
  it("lists in-stock published vehicles, newest first", async () => {
    const result = await search({});
    expect(names(result)).toEqual(["Creta Diesel", "Venue Petrol", "City CVT", "Accord Hybrid"]);
    expect(result.total).toBe(4);
  });

  it("filters by category, brand, fuel, transmission, ownership and year", async () => {
    expect(names(await search({ category: "suvs" }))).toEqual(["Creta Diesel", "Venue Petrol"]);
    expect(names(await search({ brand: "honda" }))).toEqual(["City CVT", "Accord Hybrid"]);
    expect(names(await search({ fuel: "DIESEL" }))).toEqual(["Creta Diesel"]);
    expect(names(await search({ transmission: "CVT" }))).toEqual(["City CVT"]);
    expect(names(await search({ ownership: "3" }))).toEqual(["Venue Petrol"]);
    expect(names(await search({ yearMin: "2019", yearMax: "2020" }))).toEqual([
      "Venue Petrol",
      "Accord Hybrid",
    ]);
  });

  it("searches across name, model and brand", async () => {
    expect(names(await search({ q: "hyundai" }))).toEqual(["Creta Diesel", "Venue Petrol"]);
    expect(names(await search({ q: "CITY" }))).toEqual(["City CVT"]);
  });

  it("never matches hidden prices in price filters", async () => {
    expect(names(await search({ priceMax: "500000" }))).toEqual([]);
    expect(names(await search({ priceMin: "900000" }))).toEqual(["Creta Diesel", "City CVT"]);
  });

  it("sorts by price with hidden prices last", async () => {
    expect(names(await search({ sort: "price_asc" }))).toEqual([
      "Venue Petrol",
      "City CVT",
      "Creta Diesel",
      "Accord Hybrid",
    ]);
    expect(names(await search({ sort: "price_desc" }))).toEqual([
      "Creta Diesel",
      "City CVT",
      "Venue Petrol",
      "Accord Hybrid",
    ]);
  });

  it("strips hidden prices and private fields from results", async () => {
    const accord = (await search({ q: "accord" })).vehicles[0]!;
    expect(accord.price).toBeNull();
    expect(JSON.stringify(accord)).not.toMatch(/400000|registrationNumber|internalNotes|KL 07/);
  });
});

describe("vehicle detail and related", () => {
  it("returns sold vehicles but never drafts", async () => {
    expect((await getVehicleBySlug("sold"))?.availability).toBe("SOLD");
    expect(await getVehicleBySlug("draft")).toBeNull();
  });

  it("keeps private fields out of the detail payload", async () => {
    const accord = await getVehicleBySlug("accord");
    expect(accord?.price).toBeNull();
    expect(JSON.stringify(accord)).not.toMatch(/400000|secret|KL 07/);
  });

  it("suggests in-stock vehicles from the same category first, excluding itself", async () => {
    const creta = await prisma.vehicle.findUniqueOrThrow({ where: { slug: "creta" } });
    const related = await getRelatedVehicles(creta);
    expect(related.map((vehicle) => vehicle.name)).toEqual(["Venue Petrol"]);
  });
});

describe("getCatalogueFacets", () => {
  it("offers only options with stock, with counts", async () => {
    const facets = await getCatalogueFacets();
    expect(facets.categories).toEqual([
      { name: "SUVs", slug: "suvs", count: 2 },
      { name: "Sedans", slug: "sedans", count: 2 },
    ]);
    expect(facets.fuelTypes.sort()).toEqual(["DIESEL", "HYBRID", "PETROL"]);
    expect(facets.yearRange).toEqual({ min: 2018, max: 2021 });
  });
});
