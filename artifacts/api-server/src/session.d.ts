import "express-session";

declare module "express-session" {
  interface SessionData {
    merchantId: number;
    adminId: number;
  }
}
