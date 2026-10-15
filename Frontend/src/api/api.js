import { createMockApi } from "./mockAPI";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Set VITE_DEMO=true in .env.local to run on built-in sample data (no server).
export const DEMO = import.meta.env.VITE_DEMO === "true";

export const ROUTES = {
  login: "/token",
  register: "/auth/register",
  disbursements: "/disbursements/", // trailing slash avoids a 307 redirect
  projects: "/projects",
  summary: (title) => `/projects/${encodeURIComponent(title)}/summary`,
  disbursement: (id) => `/disbursements/${id}`,
  password: "/users/change-password",
};
const UPDATE_METHOD = "PATCH";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function http(path, { method = "GET", body, form, token } = {}) {
  const headers = {};
  let payload;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = new URLSearchParams(form);
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(API_URL + path, { method, headers, body: payload });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and that the API is running.", 0);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = Array.isArray(data.detail) ? data.detail.map((d) => d.msg).join(" ") : data.detail;
    } catch {
      /* body wasn't JSON */
    }
    throw new ApiError(detail || `Request failed (${res.status}).`, res.status);
  }
  return res.status === 204 ? null : res.json();
}

// The backend has no /users/me, so the session info comes from the JWT itself.
function decodeToken(t) {
  try {
    const b64 = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

export function createApi(token, onUnauthorized) {
  if (DEMO) return createMockApi();
  const call = async (path, opts = {}) => {
    try {
      return await http(path, { ...opts, token });
    } catch (e) {
      if (e.status === 401 && token && onUnauthorized) onUnauthorized();
      throw e;
    }
  };
  return {
    login: (username, password) =>
      http(ROUTES.login, { method: "POST", form: { username, password } }),
    register: (body) => http(ROUTES.register, { method: "POST", body }),
    me: async () => {
      const payload = decodeToken(token);
      const expired = payload?.exp && payload.exp * 1000 < Date.now();
      if (!payload?.sub || expired) throw new ApiError("Your session has expired.", 401);
      return { username: payload.sub, name: payload.sub, is_superuser: false };
    },
    
    listProjects: () => call(ROUTES.projects),

    // Lists every project from the backend, then combines their summaries
    // into one flat list of entries for the Voucher Control table.
    listDisbursements: async () => {
      const projects = await call(ROUTES.projects);
      const results = await Promise.allSettled(
        projects.map((p) => call(ROUTES.summary(p.title)))
      );
      const rows = [];
      let failure = null;
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          const title = r.value.project_title || projects[i].title;
          r.value.entries.forEach((en) => rows.push({ ...en, project_title: title }));
        } else {
          failure = r.reason;
        }
      });
      if (failure && rows.length === 0 && projects.length > 0) throw failure;
      return rows;
    },

    getSummary: (title) => call(ROUTES.summary(title)),

    createDisbursement: (body) =>
      call(ROUTES.disbursements, { method: "POST", body }),

    updateDisbursement: (id, body) =>
      call(ROUTES.disbursement(id), { method: UPDATE_METHOD, body }),

    deleteDisbursement: (id) => call(ROUTES.disbursement(id), { method: "DELETE" }),

    createProject: (title) => call(ROUTES.projects, { method: "POST", body: { title } }),

    changePassword: (body) => call(ROUTES.password, { method: "POST", body }),
  };
}