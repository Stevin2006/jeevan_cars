import { beforeEach, describe, expect, it } from "vitest";
import { changePassword, login, logout } from "@/actions/auth";
import { deleteEnquiry, setEnquiryStatus, updateEnquiry } from "@/actions/admin-enquiries";
import { getSiteUploadSignature, updateSiteSettings } from "@/actions/settings";
import { deleteTaxonomy, saveTaxonomy } from "@/actions/taxonomy";
import {
  createVehicle,
  deleteVehicle,
  getVehicleUploadSignature,
  quickUpdateVehicle,
  updateVehicle,
} from "@/actions/vehicles";
import { getSession, SESSION_COOKIE } from "@/lib/auth/session";
import {
  ADMIN_PASSWORD,
  createAdmin,
  createTaxonomy,
  createVehicle as seedVehicle,
  prisma,
  resetDatabase,
  signInAsAdmin,
} from "../helpers/db";
import { isRedirectTo, requestState, resetRequest } from "../helpers/request";

async function expectRedirect(promise: Promise<unknown>, path: string) {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(isRedirectTo(error, path), `expected redirect to ${path}, got ${String(error)}`).toBe(
    true,
  );
}

beforeEach(async () => {
  await resetDatabase();
  resetRequest();
});

describe("admin actions require a valid session", () => {
  it("rejects every admin action without a session and changes nothing", async () => {
    const { suv, hyundai } = await createTaxonomy();
    const vehicle = await seedVehicle({ categoryId: suv.id, brandId: hyundai.id });
    const enquiry = await prisma.enquiry.create({
      data: {
        name: "A",
        phone: "+919876543210",
        message: "Hello there friend",
        source: "CONTACT_PAGE",
      },
    });

    const attempts: Promise<unknown>[] = [
      createVehicle({}),
      updateVehicle(vehicle.id, {}),
      deleteVehicle(vehicle.id),
      quickUpdateVehicle({ id: vehicle.id, availability: "SOLD" }),
      getVehicleUploadSignature(),
      saveTaxonomy("category", { name: "Hacked", sortOrder: 0, isActive: true }),
      deleteTaxonomy("brand", hyundai.id),
      updateEnquiry({ id: enquiry.id, status: "CLOSED", adminNotes: null, followUpAt: null }),
      setEnquiryStatus(enquiry.id, "CLOSED"),
      deleteEnquiry(enquiry.id),
      updateSiteSettings({ businessName: "Hacked", hero: null }),
      getSiteUploadSignature(),
      changePassword({
        currentPassword: "x",
        newPassword: "y".repeat(12),
        confirmPassword: "y".repeat(12),
      }),
    ];
    for (const attempt of attempts) await expectRedirect(attempt, "/admin/login");

    expect(
      await prisma.vehicle.findUnique({
        where: { id: vehicle.id },
        select: { availability: true },
      }),
    ).toEqual({
      availability: "AVAILABLE",
    });
    expect(await prisma.vehicleCategory.count({ where: { name: "Hacked" } })).toBe(0);
    expect(await prisma.vehicleBrand.count()).toBe(2);
    expect((await prisma.enquiry.findUniqueOrThrow({ where: { id: enquiry.id } })).status).toBe(
      "NEW",
    );
    expect(await prisma.siteSettings.count()).toBe(0);
  });

  it("treats a forged cookie as signed out", async () => {
    requestState.cookies.set(SESSION_COOKIE, "forged-token");
    expect(await getSession()).toBeNull();
    await expectRedirect(deleteVehicle("anything"), "/admin/login");
  });

  it("expires idle sessions and removes them", async () => {
    await signInAsAdmin();
    await prisma.adminSession.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await getSession()).toBeNull();
    expect(await prisma.adminSession.count()).toBe(0);
  });

  it("expires sessions after the absolute 30-day limit even if active", async () => {
    await signInAsAdmin();
    await prisma.adminSession.updateMany({
      data: {
        createdAt: new Date(Date.now() - 31 * 86_400_000),
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    expect(await getSession()).toBeNull();
  });
});

describe("login", () => {
  it("returns the same generic error for unknown emails and wrong passwords", async () => {
    await createAdmin();
    const unknown = await login({ email: "nobody@example.test", password: ADMIN_PASSWORD });
    const wrong = await login({ email: "admin@example.test", password: "wrong password" });
    expect(unknown).toEqual(wrong);
    expect(unknown.ok).toBe(false);
    expect(requestState.cookies.size).toBe(0);
  });

  it("signs in, stores only a hash of the token and redirects to a safe next path", async () => {
    await createAdmin();
    await expectRedirect(
      login({
        email: " ADMIN@example.test ",
        password: ADMIN_PASSWORD,
        next: "/admin/enquiries?status=NEW",
      }),
      "/admin/enquiries?status=NEW",
    );
    const token = requestState.cookies.get(SESSION_COOKIE)!;
    expect(token).toMatch(/^[\w-]{43}$/);
    const session = await prisma.adminSession.findFirstOrThrow();
    expect(session.tokenHash).not.toBe(token);
    expect(session.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect((await getSession())?.email).toBe("admin@example.test");
  });

  it.each(["//evil.example/admin", "https://evil.example", "/vehicles", "/admin/../../x\\y"])(
    "ignores an unsafe next path (%s)",
    async (next) => {
      await createAdmin();
      await expectRedirect(
        login({ email: "admin@example.test", password: ADMIN_PASSWORD, next }),
        "/admin/dashboard",
      );
    },
  );

  it("locks an email out after 5 failed attempts, even with the right password", async () => {
    await createAdmin();
    for (let attempt = 0; attempt < 5; attempt++) {
      resetRequest(`198.51.100.${attempt}`); // different IPs: the per-email limit applies
      expect((await login({ email: "admin@example.test", password: "nope" })).ok).toBe(false);
    }
    resetRequest("198.51.100.99");
    const result = await login({ email: "admin@example.test", password: ADMIN_PASSWORD });
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("Too many") });
  });

  it("never locks out repeated successful sign-ins, and success clears earlier failures", async () => {
    await createAdmin();
    for (let attempt = 0; attempt < 4; attempt++) {
      await login({ email: "admin@example.test", password: "nope" });
    }
    for (let attempt = 0; attempt < 8; attempt++) {
      await expectRedirect(
        login({ email: "admin@example.test", password: ADMIN_PASSWORD }),
        "/admin/dashboard",
      );
    }
    expect(await prisma.rateLimit.count({ where: { key: "login:email:admin@example.test" } })).toBe(
      0,
    );
  });

  it("signs out and deletes the session", async () => {
    await signInAsAdmin();
    await expectRedirect(logout(), "/admin/login");
    expect(requestState.cookies.has(SESSION_COOKIE)).toBe(false);
    expect(await prisma.adminSession.count()).toBe(0);
  });
});

describe("changePassword", () => {
  it("rejects a wrong current password", async () => {
    await signInAsAdmin();
    const result = await changePassword({
      currentPassword: "not it",
      newPassword: "a brand new passphrase",
      confirmPassword: "a brand new passphrase",
    });
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { currentPassword: expect.any(Array) },
    });
  });

  it("changes the password and signs out other sessions only", async () => {
    const admin = await signInAsAdmin();
    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        tokenHash: "f".repeat(64),
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });

    const result = await changePassword({
      currentPassword: ADMIN_PASSWORD,
      newPassword: "a brand new passphrase",
      confirmPassword: "a brand new passphrase",
    });
    expect(result.ok).toBe(true);
    expect(await prisma.adminSession.count()).toBe(1);
    expect(await getSession()).not.toBeNull();

    resetRequest("192.0.2.50");
    await expectRedirect(
      login({ email: "admin@example.test", password: "a brand new passphrase" }),
      "/admin/dashboard",
    );
  });
});
