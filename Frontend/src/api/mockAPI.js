/* In-memory stand-in for the backend, used when VITE_DEMO=true.
   Data lives only in browser memory and resets on page refresh. */

const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 150));
const notFound = (msg) => Object.assign(new Error(msg), { status: 404 });

const DEMO_USER = {
  id: 1,
  name: "Demo User",
  username: "demo",
  is_active: true,
  is_superuser: true,
  created_at: "2026-01-05T08:00:00+08:00",
  updated_at: "2026-01-05T08:00:00+08:00",
};

const row = (id, project_title, date, cv_no, payee, amount, stamp) => ({
  id,
  project_title,
  date,
  cv_no,
  payee,
  amount: amount.toFixed(2),
  created_at: stamp,
  updated_at: stamp,
  created_by: "demo | Demo User",
  updated_by: "Demo User",
});

let store = [
  row(1, "Calamba Warehouse Expansion", "2026-08-03", "CV-0101", "Metro Steel Supply", 185000, "2026-08-03T09:15:00+08:00"),
  row(2, "Calamba Warehouse Expansion", "2026-08-12", "CV-0108", "R. Santos Electrical Works", 64250.5, "2026-08-12T14:40:00+08:00"),
  row(3, "Calamba Warehouse Expansion", "2026-09-01", "CV-0122", "Laguna Concrete Corp.", 212400, "2026-09-01T10:05:00+08:00"),
  row(4, "Batangas Pump Station", "2026-07-21", "CV-0087", "HydroTech Pumps Inc.", 540000, "2026-07-21T11:20:00+08:00"),
  row(5, "Batangas Pump Station", "2026-08-30", "CV-0119", "Southern Luzon Pipes", 97800.75, "2026-08-30T16:00:00+08:00"),
  row(6, "Plant 2 Roof Repair", "2026-09-14", "CV-0131", "Alpha Roofing Services", 38500, "2026-09-14T09:45:00+08:00"),
  row(7, "Plant 2 Roof Repair", "2026-09-22", "CV-0136", "Bright Paint & Coatings", 12950, "2026-09-22T13:10:00+08:00"),
  row(8, "Plant 2 Roof Repair", "2026-10-05", "CV-0142", "Kuya Mark Hauling", 4200, "2026-10-05T15:30:00+08:00"),
];
let nextId = 9;

const sameTitle = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
const now = () => new Date().toISOString();

export function createMockApi() {
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