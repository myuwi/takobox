import ky from "ky";

export const client = ky.extend({
  prefixUrl: "/api",
  hooks: {
    beforeRequest: [
      (req) => {
        const token = localStorage.getItem("token");
        if (token) {
          req.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (_req, _opts, res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      },
    ],
  },
});
