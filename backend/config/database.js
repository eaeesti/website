module.exports = ({ env }) => ({
  connection: {
    client: "postgres",
    connection: {
      connectionString: env("DATABASE_URL"),
      host: env("DATABASE_HOST", "127.0.0.1"),
      port: env.int("DATABASE_PORT", 5432),
      database: env("DATABASE_NAME", "efektiivnealtruism"),
      user: env("DATABASE_USERNAME", "strapi"),
      password: env("DATABASE_PASSWORD", "strapi"),
      ssl: env.bool("DATABASE_SSL", false) && {
        rejectUnauthorized: env.bool("DATABASE_SSL_REJECT_UNAUTHORIZED", true),
      },
      schema: env("DATABASE_SCHEMA", "public"),
    },
    // Small on purpose: this shares a 2 GB box with the frontend and Postgres
    // itself, and a content site with one Strapi worker never needs ten
    // connections at once.
    pool: {
      min: env.int("DATABASE_POOL_MIN", 0),
      max: env.int("DATABASE_POOL_MAX", 5),
    },
    acquireConnectionTimeout: env.int("DATABASE_CONNECTION_TIMEOUT", 60000),
  },
});
