/**
 * EA Estonia's branding in the admin: the logo on the login page and in the
 * menu, EA blue instead of Strapi's purple, and welcome texts that say where
 * editors are. The browser tab's icon is ../../favicon.png, which Strapi
 * serves as /favicon.ico.
 */
import type { StrapiApp } from "@strapi/strapi/admin";
import icon from "./extensions/icon.png";
import logo from "./extensions/logo.png";

/** The site's palette (frontend/src/app/globals.css), in Strapi's names. */
const lightColors = {
  primary100: "#f0f7ff",
  primary200: "#e0effe",
  primary500: "#0c8eeb",
  primary600: "#0072ce",
  primary700: "#0158a3",
  buttonPrimary500: "#0c8eeb",
  buttonPrimary600: "#0072ce",
};

/** Lighter blues for text and outlines on the dark background. */
const darkColors = {
  primary200: "#0b3f6f",
  primary500: "#0072ce",
  primary600: "#36a9fa",
  primary700: "#7cc5fd",
  buttonPrimary500: "#0c8eeb",
  buttonPrimary600: "#0072ce",
};

export default {
  config: {
    auth: { logo },
    menu: { logo: icon },
    theme: {
      light: { colors: lightColors },
      dark: { colors: darkColors },
    },
    translations: {
      en: {
        "Auth.form.welcome.title": "EA Estonia's website",
        "Auth.form.welcome.subtitle": "Log in to edit efektiivnealtruism.org",
        "app.components.LeftMenu.navbrand.title": "EA Estonia",
        "app.components.LeftMenu.navbrand.workplace": "Website",
      },
    },
    // Strapi's video tutorials and release news are for developers.
    tutorials: false,
    notifications: { releases: false },
  },
  bootstrap(_app: StrapiApp) {},
};
