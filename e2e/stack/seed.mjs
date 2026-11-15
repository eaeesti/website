// Loads Strapi, fills its new database with the content in content.ts
// through the Document Service, makes the admins the tests sign in as, writes
// the site's API token for site.mjs, and starts Strapi. Run by strapi.mjs, in
// the backend's folder and with its settings. Plain JavaScript, like the
// backend's scripts: Strapi's types live in the backend, not here.
import { copyFileSync, mkdtempSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ADMINS, ROOT, TOKEN_FILE } from "./config.ts";
import {
  EMAIL_CONFIG,
  IMAGE,
  PAGES,
  POSTS,
  TEXT,
  globalData,
} from "./content.ts";

const backendDir = process.cwd();
const require = createRequire(join(backendDir, "package.json"));
const { createStrapi } = require("@strapi/strapi");

/** The fixture image, uploaded the way the media library does it. */
async function uploadImage(strapi) {
  // A copy: the upload may move or delete the file it's given.
  const path = join(mkdtempSync(join(tmpdir(), "e2e-")), "photo.png");
  copyFileSync(join(ROOT, "e2e", "fixtures", "photo.png"), path);
  const [file] = await strapi
    .plugin("upload")
    .service("upload")
    .upload({
      data: { fileInfo: { alternativeText: "Sinine ring", name: "photo.png" } },
      files: {
        filepath: path,
        originalFilename: "photo.png",
        mimetype: "image/png",
        size: statSync(path).size,
      },
    });
  return file.id;
}

/** The content with every IMAGE replaced by the uploaded file. */
function withImage(value, imageId) {
  if (value === IMAGE) return imageId;
  if (Array.isArray(value)) {
    return value.map((item) => withImage(item, imageId));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        withImage(item, imageId),
      ]),
    );
  }
  return value;
}

const metadata = (title, description) => ({ title, description });

async function seedAdmins(strapi) {
  const role = await strapi.service("admin::role").getSuperAdmin();
  for (const admin of Object.values(ADMINS)) {
    await strapi
      .service("admin::user")
      .create({ ...admin, isActive: true, roles: [role.id] });
  }
}

/**
 * The bootstrap made the site's token, whose key can't be read back, so
 * give it a new one and hand that to the site.
 */
async function writeSiteToken(strapi) {
  const token = await strapi.db
    .query("admin::api-token")
    .findOne({ where: { name: "Public API Token" } });
  if (!token) throw new Error("Strapi's bootstrap made no Public API Token");
  const { accessKey } = await strapi
    .service("admin::api-token")
    .regenerate(token.id);
  writeFileSync(TOKEN_FILE, accessKey);
}

async function seed(strapi) {
  await seedAdmins(strapi);
  const imageId = await uploadImage(strapi);
  const docs = (uid) => strapi.documents(uid);

  // Single types without drafts: created as they are, English as an update.
  const global = await docs("api::global.global").create({
    data: globalData("et"),
    locale: "et",
  });
  await docs("api::global.global").update({
    documentId: global.documentId,
    data: globalData("en"),
    locale: "en",
  });
  await docs("api::email-config.email-config").create({ data: EMAIL_CONFIG });

  for (const page of PAGES) {
    const data = (content) =>
      withImage(
        {
          name: content.name,
          slug: content.slug,
          metadata: metadata(content.name, content.description),
          sections: content.sections,
        },
        imageId,
      );
    const created = await docs("api::page.page").create({
      data: data(page),
      locale: "et",
      status: "published",
    });
    if (page.en) {
      await docs("api::page.page").update({
        documentId: created.documentId,
        data: data(page.en),
        locale: "en",
        status: "published",
      });
    }
  }

  const author = await docs("api::blog-author.blog-author").create({
    data: { name: TEXT.authorName, role: "Toimetaja" },
  });
  const category = await docs("api::blog-category.blog-category").create({
    data: {
      name: TEXT.categoryName,
      slug: "karjaar",
      description: "Postitused karjäärist.",
    },
  });
  for (const post of POSTS) {
    await docs("api::blog-post.blog-post").create({
      data: {
        title: post.title,
        slug: post.slug,
        date: post.date,
        excerpt: post.excerpt,
        content: post.content,
        image: imageId,
        authors: [author.documentId],
        categories: post.inCategory ? [category.documentId] : [],
        metadata: metadata(post.title, post.excerpt),
      },
      status: "published",
    });
  }
}

const strapi = createStrapi({
  appDir: backendDir,
  distDir: join(backendDir, "dist"),
});
await strapi.load();
await seed(strapi);
await writeSiteToken(strapi);
await strapi.start();
