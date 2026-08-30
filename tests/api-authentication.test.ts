import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserId = vi.fn();
const getDb = vi.fn();

vi.mock("@/lib/auth-helpers", () => ({ getCurrentUserId }));
vi.mock("@/lib/db", () => ({ getDb }));
vi.mock("@/lib/instagro-api", () => ({ genId: () => "order-1" }));

describe("protected API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue(null);
  });

  it("rejects unauthenticated order requests", async () => {
    const { GET, POST, PATCH } = await import("@/app/api/orders/route");
    expect((await GET(new Request("http://test/api/orders") as never)).status).toBe(401);
    expect((await POST(new Request("http://test/api/orders", { method: "POST", body: "{}" }) as never)).status).toBe(401);
    expect((await PATCH(new Request("http://test/api/orders", { method: "PATCH", body: "{}" }) as never)).status).toBe(401);
  });

  it("rejects unauthenticated seller-payout requests", async () => {
    const { GET, POST } = await import("@/app/api/seller/earnings/route");
    expect((await GET(new Request("http://test/api/seller/earnings") as never)).status).toBe(401);
    expect((await POST(new Request("http://test/api/seller/earnings", { method: "POST", body: "{}" }) as never)).status).toBe(401);
  });

  it("rejects unauthenticated farmer-ledger requests", async () => {
    const { GET, POST } = await import("@/app/api/farmer/ledger/route");
    expect((await GET(new Request("http://test/api/farmer/ledger") as never)).status).toBe(401);
    expect((await POST(new Request("http://test/api/farmer/ledger", { method: "POST", body: "{}" }) as never)).status).toBe(401);
  });
});
