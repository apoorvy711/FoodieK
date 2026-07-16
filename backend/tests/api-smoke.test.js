const request = require("supertest");
const app = require("../src/app");

describe("API smoke", () => {
  it("returns health payload on /", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("returns health payload on /api", async () => {
    const response = await request(app).get("/api");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("rejects unsupported origin", async () => {
    const response = await request(app)
      .get("/api")
      .set("Origin", "http://malicious.example.com");

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });

  it("validates auth payload", async () => {
    const response = await request(app)
      .post("/api/auth/user/login")
      .send({ email: "bad-email", password: "123" });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
  });

  it("protects admin endpoints", async () => {
    const response = await request(app).get("/api/admin/dashboard");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects webhook with invalid secret", async () => {
    const response = await request(app)
      .post("/api/payments/webhook")
      .send({ orderId: "507f1f77bcf86cd799439011", status: "paid" });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
