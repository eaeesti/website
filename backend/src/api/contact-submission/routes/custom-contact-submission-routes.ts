export default {
  routes: [
    {
      method: "POST",
      path: "/contact",
      handler: "contact-submission.contact",
      // Public on purpose: the form is filled in by visitors. The controller
      // validates the body and rate-limits by address.
      config: { auth: false },
    },
  ],
};
