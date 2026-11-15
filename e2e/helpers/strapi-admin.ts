import { expect } from "@playwright/test";
import { URLS } from "../stack/config.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Strapi's admin API, as the admin panel uses it: signed in as an admin,
 * reading and saving documents through the content manager.
 */
export class StrapiAdmin {
  private readonly token: string;

  private constructor(token: string) {
    this.token = token;
  }

  static async signIn(email: string, password: string) {
    const response = await fetch(`${URLS.strapi}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(response.status, "signing in to Strapi's admin").toBe(200);
    const body: unknown = await response.json();
    const token =
      isRecord(body) && isRecord(body.data) ? body.data.token : undefined;
    if (typeof token !== "string")
      throw new Error("No token from /admin/login");
    return new StrapiAdmin(token);
  }

  async request(method: string, path: string, body?: unknown) {
    const response = await fetch(`${URLS.strapi}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json: unknown = await response.json();
    expect(response.ok, `${method} ${path}: ${JSON.stringify(json)}`).toBe(
      true,
    );
    return json;
  }

  /** A page's documentId, by its slug, in Estonian. */
  async pageId(slug: string): Promise<string> {
    const query = new URLSearchParams({
      locale: "et",
      "filters[$and][0][slug][$eq]": slug,
    });
    const body = await this.request(
      "GET",
      `/content-manager/collection-types/api::page.page?${query}`,
    );
    const results = isRecord(body) ? body.results : undefined;
    const first = Array.isArray(results) ? results[0] : undefined;
    const id = isRecord(first) ? first.documentId : undefined;
    if (typeof id !== "string") throw new Error(`No page with slug ${slug}`);
    return id;
  }

  /**
   * Changes a page's draft as `change` says and publishes it, as an editor
   * does with the Save and Publish buttons.
   */
  async editAndPublishPage(
    slug: string,
    change: (page: Record<string, unknown>) => Record<string, unknown>,
  ) {
    const id = await this.pageId(slug);
    const path = `/content-manager/collection-types/api::page.page/${id}`;
    const body = await this.request("GET", `${path}?locale=et`);
    const page = isRecord(body) ? body.data : undefined;
    if (!isRecord(page)) throw new Error(`No data for page ${slug}`);
    await this.request("PUT", `${path}?locale=et`, change(page));
    await this.request("POST", `${path}/actions/publish?locale=et`, {});
  }
}
