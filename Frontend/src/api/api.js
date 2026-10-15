import { createMockApi } from "./mockAPI";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Set VITE_DEMO=true in .env.local to run on built-in sample data (no server).
export const DEMO = import.meta.env.VITE_DEMO === "true";

export const ROUTES = {
  login: "/token",
  register: "/auth/register",
  disbursements: "/disbursements/", // trailing slash avoids a 307 redirect
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

/* The backend has no "list all disbursements" route, so the app remembers the
   project titles it has seen (created, imported or opened) in this browser and
   builds the list from each project's summary. */
const KNOWN_KEY = "projectTitles";
const knownProjects = {
  get() {
    try {
      const v = JSON.parse(localStorage.getItem(KNOWN_KEY));
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  },
  save(list) {
    try {
      localStorage.setItem(KNOWN_KEY, JSON.stringify(list));
    } catch {
      /* storage unavailable */
    }
  },
  add(title) {
    const t = (title || "").trim();
    if (!t) return;
    const list = this.get();
    if (!list.some((x) => x.toLowerCase() === t.toLowerCase())) this.save([...list, t]);
  },
  remove(title) {
    this.save(this.get().filter((x) => x.toLowerCase() !== title.toLowerCase()));
  },
};

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
    // The backend only exposes GET /projects/{title}/summary, so the list is
    // built by combining the summaries of every project this browser knows about.
    listDisbursements: async () => {
      const titles = knownProjects.get();
      const results = await Promise.allSettled(titles.map((t) => call(ROUTES.summary(t))));
      const rows = [];
      let failure = null;
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          const title = r.value.project_title || titles[i];
          r.value.entries.forEach((en) => rows.push({ ...en, project_title: title }));
        } else if (r.reason?.status === 404) {
          // keep the title so a mismatch stays visible instead of vanishing
          console.warn(`Summary for "${titles[i]}" returned 404 (Project not found).`);
        } else {
          failure = r.reason;
        }
      });
      if (failure && rows.length === 0) throw failure;
      return rows;
    },
    getSummary: async (title) => {
      const s = await call(ROUTES.summary(title));
      knownProjects.add(s.project_title || title);
      return s;
    },
    createDisbursement: async (body) => {
      const created = await call(ROUTES.disbursements, { method: "POST", body });
      knownProjects.add(body.project_title);
      return created;
    },
    updateDisbursement: (id, body) =>
      call(ROUTES.disbursement(id), { method: UPDATE_METHOD, body }),
    deleteDisbursement: (id) => call(ROUTES.disbursement(id), { method: "DELETE" }),
    changePassword: (body) => call(ROUTES.password, { method: "POST", body }),
  };
}