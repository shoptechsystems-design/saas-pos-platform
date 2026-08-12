import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Tenant, TenantMembership, User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  tenant?: Tenant;
  membership?: TenantMembership;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // Authentication is optional for public procedures; protected middleware handles the denial.
    user = null;
  }
  return { req: opts.req, res: opts.res, user };
}
