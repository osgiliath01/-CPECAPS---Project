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
  return {
    login: () => delay({ access_token: "demo", token_type: "bearer" }),
    register: () => delay(DEMO_USER),
    me: () => delay(DEMO_USER),
    changePassword: () => delay(DEMO_USER),

    listDisbursements: () => delay(store.map((e) => ({ ...e }))),

    getSummary: (title) => {
      const entries = store.filter((e) => sameTitle(e.project_title, title));
      if (entries.length === 0) return Promise.reject(notFound("Project not found"));
      const total = entries.reduce((s, e) => s + Number(e.amount), 0);
      return delay({
        project_title: entries[0].project_title,
        total_amount: total,
        entries: entries.map((e) => ({ ...e })),
      });
    },

    createDisbursement: (body) => {
      // reuse the stored spelling if the project already exists
      const existing = store.find((e) => sameTitle(e.project_title, body.project_title));
      const entry = {
        id: nextId++,
        project_title: existing ? existing.project_title : body.project_title.trim(),
        date: body.date,
        cv_no: body.cv_no,
        payee: body.payee,
        amount: Number(body.amount).toFixed(2),
        created_at: now(),
        updated_at: now(),
        created_by: "demo | Demo User",
        updated_by: "Demo User",
      };
      store = [...store, entry];
      return delay({ ...entry });
    },

    updateDisbursement: (id, body) => {
      const i = store.findIndex((e) => e.id === id);
      if (i < 0) return Promise.reject(notFound("Disbursement log not found"));
      const { editor_name, ...changes } = body;
      const next = {
        ...store[i],
        ...changes,
        updated_by: editor_name || store[i].updated_by,
        updated_at: now(),
      };
      store = store.map((e, k) => (k === i ? next : e));
      return delay({ ...next });
    },

    deleteDisbursement: (id) => {
      if (!store.some((e) => e.id === id))
        return Promise.reject(notFound("Disbursement log not found"));
      store = store.filter((e) => e.id !== id);
      return delay(null);
    },
  };
}