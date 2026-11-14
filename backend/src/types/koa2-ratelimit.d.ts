declare module "koa2-ratelimit" {
  import type { Context, Middleware } from "koa";
  export const RateLimit: {
    middleware(options: {
      interval?: { min?: number; hour?: number; day?: number } | number;
      max?: number;
      message?: string;
      skip?: (ctx: Context) => Promise<boolean>;
      /** The bucket a request counts against; default `global|<ip>`. */
      keyGenerator?: (ctx: Context) => Promise<string>;
    }): Middleware;
  };
}
