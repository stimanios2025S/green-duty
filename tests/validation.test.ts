import { describe, expect, it } from "vitest";
import { orderSchema, signupSchema } from "@/lib/validations";

describe("API payload validation", () => {
  it("accepts a valid signup payload", () => {
    expect(signupSchema.safeParse({ name: "Farmer", email: "farmer@example.com", password: "secure-password", accountType: "farmer" }).success).toBe(true);
  });

  it("rejects an order without products", () => {
    expect(orderSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an order item with an invalid quantity", () => {
    expect(orderSchema.safeParse({ items: [{ productId: "p1", productName: "Seed", quantity: 0, price: 500 }] }).success).toBe(false);
  });
});
