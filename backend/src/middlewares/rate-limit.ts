import { RateLimit } from "koa2-ratelimit";
import { isInternalAddress } from "../utils/rate-limiter";

/**
 * A coarse per-address limit on everything Strapi serves.
 *
 * The frontend runs on the same machine, so every page render, and every
 * /uploads file the site proxies for its visitors, arrives from one address:
 * loopback, or the site container's. Counting those would put the whole
 * site's traffic into a single bucket that anyone could empty by requesting
 * the site's /uploads, and then Strapi would refuse the site's page renders
 * with 429s. Loopback and private addresses are skipped instead. That
 * includes ordinary visitors while SERVER_PROXY is off, when nginx's address
 * is all Strapi can see: no limit is better than one shared by everyone.
 */
export default () =>
  RateLimit.middleware({
    interval: { min: 15 },
    max: 1000,
    message: "Too many requests, please try again later.",
    skip: async (ctx) => isInternalAddress(ctx.request.ip),
  });
