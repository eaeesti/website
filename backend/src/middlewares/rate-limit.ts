import { RateLimit } from "koa2-ratelimit";
import { isProxyAddress } from "../utils/rate-limiter";

/**
 * A coarse per-address limit on everything Strapi serves.
 *
 * The frontend runs on the same machine and calls Strapi on 127.0.0.1, so
 * every page render arrives from the loopback address. Counting those would
 * put the whole site's traffic into a single bucket and, after a cache flush
 * with a crawler around, turn pages into 429 errors. Loopback is skipped
 * instead. That includes ordinary visitors while SERVER_PROXY is off, when
 * nginx's address is all Strapi can see: no limit is better than one shared
 * by everyone.
 */
export default () =>
  RateLimit.middleware({
    interval: { min: 15 },
    max: 1000,
    message: "Too many requests, please try again later.",
    skip: async (ctx) => isProxyAddress(ctx.request.ip),
  });
