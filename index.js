// index.js
require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

const app = express();
const port = Number(process.env.PORT || 5000);

// Ensure local time matches business timezone
process.env.TZ = "Africa/Tunis";

// -------------------- Middleware --------------------
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// We inline tiny scripts in the HTML pages
app.use(helmet({ contentSecurityPolicy: false }));

// -------------------- Postgres --------------------
const pool = new Pool({
  user: "adminavo",
  host: "avo-adb-001.postgres.database.azure.com",
  database: "indicatordb",
  password: "$#fKcdXPg4@ue8AW",
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

// -------------------- Helpers --------------------
const escapeHTML = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function currentISOWeekTag(d = new Date()) {
  // Returns like "W39"
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `W${String(weekNo).padStart(2, "0")}`;
}

const getResponsibleWithKPIs = async (responsibleId, week) => {
  const resResp = await pool.query(
    `
    SELECT r.responsible_id, r.name, r.email, r.plant_id, r.department_id,
           p.name AS plant_name, d.name AS department_name
    FROM public."Responsible" r
    JOIN public."Plant" p ON r.plant_id = p.plant_id
    JOIN public."Department" d ON r.department_id = d.department_id
    WHERE r.responsible_id = $1
    `,
    [responsibleId]
  );
  const responsible = resResp.rows[0];
  if (!responsible) throw new Error("Responsible not found");

  const kpiRes = await pool.query(
    `
    SELECT kv.kpi_values_id, kv.value, kv.week, k.kpi_id, 
           k.indicator_title, k.indicator_sub_title, k.unit
    FROM public.kpi_values kv
    JOIN public."Kpi" k ON kv.kpi_id = k.kpi_id
    WHERE kv.responsible_id = $1 AND kv.week = $2
    ORDER BY k.kpi_id ASC
    `,
    [responsibleId, week]
  );
  return { responsible, kpis: kpiRes.rows };
};

// -------------------- Email (template + sender) --------------------
// ---------- Nodemailer ----------
const createTransporter = () =>
  nodemailer.createTransport({
    host: "smtp.office365.com", // Microsoft 365 submission endpoint
    port: 587,                  // STARTTLS
    secure: false,              // use STARTTLS
    auth: {
      user: "administration.STS@avocarbon.com",  // mailbox
      pass: "shnlgdyfbcztbhxn",                  // app password or regular (if no MFA)
    },
    tls: { ciphers: "TLSv1.2" },
    logger: true,  // enable while debugging
    debug: true,
  });

// Verify SMTP on boot so you see clear errors
(async () => {
  try {
    const t = createTransporter();
    await t.verify();
    console.log("✅ SMTP ready");
  } catch (e) {
    console.error("❌ SMTP verify failed:", {
      message: e.message,
      code: e.code,
      command: e.command,
      response: e.response,
      responseCode: e.responseCode,
    });
  }
})();

const generateEmailHtml = ({ responsible, kpis, week }) => {
  const formUrl =
    `https://kpi-form.azurewebsites.net/kpi-form` +
    `?responsible_id=${encodeURIComponent(responsible.responsible_id)}` +
    `&week=${encodeURIComponent(week)}`;

  const list = (kpis || [])
    .map((k) => {
      const label = `${escapeHTML(k.indicator_title)}${k.indicator_sub_title ? " - " + escapeHTML(k.indicator_sub_title) : ""}`;
      const unit = k.unit ? " " + escapeHTML(k.unit) : "";
      const val = k.value == null ? "—" : escapeHTML(k.value);
      return `<li style="margin:6px 0">${label}: <strong>${val}${unit}</strong></li>`;
    })
    .join("");

  return `
  <!doctype html>
  <html>
    <head><meta charset="utf-8"><title>KPI Form - ${escapeHTML(week)}</title></head>
    <body style="font-family:Segoe UI,Arial,sans-serif;background:#f6f8fa;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:10px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,.08)">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <img src="https://www.avocarbon.com/wp-content/uploads/2019/02/AVO-Carbon-Logo.png" alt="AVO Carbon" style="height:28px" onerror="this.style.display='none'"/>
          <h2 style="margin:0;color:#0078D7">KPI Submission – Week ${escapeHTML(week)}</h2>
        </div>
        <p>Hello <strong>${escapeHTML(responsible.name)}</strong>,</p>
        <p>Please submit your KPI values for <strong>${escapeHTML(week)}</strong>.</p>
        <p style="margin:14px 0 6px 0;font-weight:600">Your current values:</p>
        <ul style="padding-left:18px;margin-top:6px">${list}</ul>

        <p style="margin-top:18px">
          <a href="${formUrl}" style="background:#0d6efd;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:600">
            Open KPI Form
          </a>
        </p>

        <p style="color:#6b7280;font-size:12px;margin-top:24px">If the button doesn't work, open this link: ${formUrl}</p>
      </div>
    </body>
  </html>`;
};

const sendKPIEmail = async (responsibleId, week) => {
  try {
    const { responsible, kpis } = await getResponsibleWithKPIs(responsibleId, week);
    if (!responsible?.email) throw new Error("Responsible has no email");

    const html = generateEmailHtml({ responsible, kpis, week });
    const transporter = createTransporter();

    await transporter.sendMail({
      from: '"AVOCarbon Administration" <administration.STS@avocarbon.com>', // match auth user or ensure Send As rights
      to: responsible.email,
      subject: `KPI Submission – ${responsible.name} – ${week}`,
      html,
    });

    console.log(`✅ Email sent to ${responsible.email} (${week})`);
  } catch (err) {
    console.error("❌ sendMail failed", {
      message: err?.message,
      code: err?.code,
      command: err?.command,
      response: err?.response,
      responseCode: err?.responseCode,
    });
    throw err;
  }
};

// -------------------- Manual trigger routes (for testing) --------------------
app.get("/send-test-email", async (req, res) => {
  const to = req.query.to;
  if (!to) return res.status(400).send("Missing ?to=email");
  try {
    const t = createTransporter();
    await t.sendMail({
      from: '"AVOCarbon Administration" <administration.STS@avocarbon.com>',
      to,
      subject: "SMTP test",
      text: "If you received this, SMTP works ✅",
    });
    res.send(`Test email sent to ${escapeHTML(to)}`);
  } catch (e) {
    res.status(500).send(JSON.stringify({
      message: e.message, code: e.code, response: e.response, responseCode: e.responseCode
    }));
  }
});

// Send to ONE responsible now: /send-kpi-email?responsible_id=123&week=W39
app.get("/send-kpi-email", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;
    if (!responsible_id || !week) throw new Error("Missing responsible_id or week");
    await sendKPIEmail(responsible_id, week);
    res.send(`Sent to responsible_id=${escapeHTML(responsible_id)} for ${escapeHTML(week)}`);
  } catch (e) {
    res.status(500).send(`Error: ${escapeHTML(e.message)}`);
  }
});

// Send to EVERY responsible now (bulk): /send-kpi-emails?week=W39
app.get("/send-kpi-emails", async (req, res) => {
  try {
    const week = req.query.week || currentISOWeekTag(new Date());
    console.log(`[MANUAL] Sending emails for ${week} at ${new Date().toISOString()}`);
    const resps = await pool.query(`SELECT responsible_id FROM public."Responsible"`);
    for (const r of resps.rows) await sendKPIEmail(r.responsible_id, week);
    res.send(`Queued emails for week ${escapeHTML(week)}`);
  } catch (e) {
    res.status(500).send(`Error: ${escapeHTML(e.message)}`);
  }
});

// -------------------- Pages & API (form → review → submit → success) --------------------
app.get("/", (_req, res) => res.send("<h1>KPI Submission System is running</h1>"));

app.get("/kpi-form", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;
    if (!responsible_id || !week) throw new Error("Missing responsible_id or week");

    const { responsible, kpis } = await getResponsibleWithKPIs(responsible_id, week);

    const inputs = kpis.map(k => {
      const label = escapeHTML(k.indicator_title) + (k.indicator_sub_title ? " - " + escapeHTML(k.indicator_sub_title) : "");
      const unit = k.unit ? ` (${escapeHTML(k.unit)})` : "";
      return `
        <div style="margin-bottom:14px">
          <label style="display:block;margin-bottom:6px;font-weight:600">${label}${unit}</label>
          <input type="text" name="value_${k.kpi_values_id}" placeholder="Enter value"
                 style="width:100%;padding:10px;border:1px solid #d0d7de;border-radius:6px" />
        </div>
      `;
    }).join("");

    res.send(`
      <!doctype html>
      <html>
      <head><meta charset="utf-8"><title>KPI Form — Week ${escapeHTML(week)}</title></head>
      <body style="font-family:'Segoe UI',sans-serif;background:#f4f4f4;padding:20px">
        <div style="max-width:700px;margin:0 auto;background:#fff;padding:24px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.08)">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <img src="https://www.avocarbon.com/wp-content/uploads/2019/02/AVO-Carbon-Logo.png" alt="AVO Carbon" style="height:28px" onerror="this.style.display='none'"/>
            <h2 style="margin:0;color:#0078D7">KPI Submission Form - Week ${escapeHTML(week)}</h2>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0 24px;">
            <div><div style="font-size:12px;color:#6b7280">Responsible</div>
              <input value="${escapeHTML(responsible.name)}" disabled style="width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:6px;background:#fafafa"/></div>
            <div><div style="font-size:12px;color:#6b7280">Week</div>
              <input value="${escapeHTML(week)}" disabled style="width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:6px;background:#fafafa"/></div>
            <div><div style="font-size:12px;color:#6b7280">Plant</div>
              <input value="${escapeHTML(responsible.plant_name)}" disabled style="width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:6px;background:#fafafa"/></div>
            <div><div style="font-size:12px;color:#6b7280">Department</div>
              <input value="${escapeHTML(responsible.department_name)}" disabled style="width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:6px;background:#fafafa"/></div>
          </div>

          <form id="kpiForm">
            ${inputs}
            <button type="submit" style="width:100%;padding:12px 16px;background:#0d6efd;color:#fff;border:0;border-radius:8px;font-weight:600;cursor:pointer">
              Review & Submit KPI
            </button>
          </form>
        </div>

        <script>
          const form = document.getElementById('kpiForm');
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const params = new URLSearchParams();
            params.set('responsible_id', ${JSON.stringify(String(req.query.responsible_id))});
            params.set('week', ${JSON.stringify(String(week))});
            for (const [k,v] of fd.entries()) {
              if (k.startsWith('value_')) params.set(k, v);
            }
            location.href = '/kpi-review?' + params.toString();
          });
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(400).send(`<h1>Error</h1><p>${escapeHTML(err.message)}</p>`);
  }
});

app.get("/kpi-review", async (req, res) => {
  try {
    const { responsible_id, week, ...q } = req.query;
    if (!responsible_id || !week) throw new Error("Missing responsible_id or week");

    const { responsible, kpis } = await getResponsibleWithKPIs(responsible_id, week);

    const rows = kpis.map(k => {
      const qpKey = `value_${k.kpi_values_id}`;
      const newVal = q[qpKey] ?? "";
      const currentVal = k.value ?? "";
      const label = escapeHTML(k.indicator_title) + (k.indicator_sub_title ? " - " + escapeHTML(k.indicator_sub_title) : "");
      const unit = k.unit ? ` (${escapeHTML(k.unit)})` : "";
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${label}${unit}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;color:#6b7280">${currentVal === "" ? "<em>empty</em>" : escapeHTML(currentVal)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">${escapeHTML(newVal)}</td>
        </tr>
      `;
    }).join("");

    res.send(`
      <!doctype html>
      <html>
      <head><meta charset="utf-8"><title>Review KPI — Week ${escapeHTML(week)}</title></head>
      <body style="font-family:'Segoe UI',sans-serif;background:#f4f4f4;padding:20px">
        <div style="max-width:800px;margin:0 auto;background:#fff;padding:24px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.08)">
          <h2 style="margin-top:0;text-align:center;color:#0078D7">Review Your KPI — Week ${escapeHTML(week)}</h2>

          <table style="width:100%;border-collapse:collapse;margin:10px 0 4px 0">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #e5e7eb">Indicator</th>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #e5e7eb">Current (DB)</th>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #e5e7eb">New (from URL)</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div id="status" style="margin-top:12px;color:#6b7280;text-align:center">
            Saving in 1 second…
          </div>
        </div>

        <script>
          const body = ${JSON.stringify(req.query)};
          const statusEl = document.getElementById('status');
          setTimeout(async () => {
            try {
              const resp = await fetch('/api/submit-kpi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });
              const data = await resp.json();
              if (data.status === 'success') {
                location.href = '/kpi-submitted?responsible_id=' + encodeURIComponent(body.responsible_id) +
                                '&week=' + encodeURIComponent(body.week);
              } else {
                statusEl.style.color = '#b91c1c';
                statusEl.textContent = 'Error: ' + (data.message || 'Unknown error');
              }
            } catch (e) {
              statusEl.style.color = '#b91c1c';
              statusEl.textContent = 'Network error: ' + e.message;
            }
          }, 1000);
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(400).send(`<h1>Error</h1><p>${escapeHTML(err.message)}</p>`);
  }
});

app.post("/api/submit-kpi", async (req, res) => {
  const client = await pool.connect();
  try {
    const { responsible_id, week, ...values } = req.body || {};
    if (!responsible_id || !week) throw new Error("Missing responsible_id or week");

    const keys = Object.keys(values).filter(k => k.startsWith("value_"));
    if (keys.length === 0) throw new Error("No KPI values provided");

    // (Optional) validation
    for (const k of keys) {
      const v = values[k];
      if (String(v).length > 100) throw new Error(`Value too long in ${k}`);
    }

    // Ensure KPIs map to this responsible/week
    const ids = keys.map(k => Number(k.split("_")[1]));
    const check = await client.query(
      `SELECT kpi_values_id FROM public.kpi_values
       WHERE responsible_id=$1 AND week=$2 AND kpi_values_id = ANY($3::int[])`,
      [responsible_id, week, ids]
    );
    if (check.rows.length !== ids.length) throw new Error("KPI set mismatch for responsible/week");

    await client.query("BEGIN");
    for (const key of keys) {
      const id = Number(key.split("_")[1]);
      const val = values[key];
      await client.query(`UPDATE public.kpi_values SET value=$1 WHERE kpi_values_id=$2`, [val, id]);
    }
    await client.query("COMMIT");

    res.json({ status: "success", message: "✅ KPI values submitted successfully!", responsible_id, week });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ status: "error", message: err.message });
  } finally {
    client.release();
  }
});

app.get("/kpi-submitted", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;
    if (!responsible_id || !week) throw new Error("Missing parameters");

    const { responsible, kpis } = await getResponsibleWithKPIs(responsible_id, week);
    const list = kpis.map(k => {
      const label = escapeHTML(k.indicator_title) + (k.indicator_sub_title ? " - " + escapeHTML(k.indicator_sub_title) : "");
      const unit = k.unit ? " " + escapeHTML(k.unit) : "";
      return `<li style="margin:6px 0"><strong>${label}:</strong> ${escapeHTML(k.value ?? "N/A")}${unit}</li>`;
    }).join("");

    res.send(`
      <!doctype html>
      <html>
      <head><meta charset="utf-8"><title>KPI Submitted — Week ${escapeHTML(week)}</title></head>
      <body style="font-family:'Segoe UI',sans-serif;background:#f4f4f4;padding:20px">
        <div style="max-width:700px;margin:0 auto;background:#fff;padding:24px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.08)">
          <h2 style="color:#28a745;text-align:center;margin-top:0">KPI Submitted Successfully</h2>
          <p><strong>Responsible:</strong> ${escapeHTML(responsible.name)}</p>
          <p><strong>Week:</strong> ${escapeHTML(week)}</p>
          <ul>${list}</ul>
          <p style="text-align:center;color:#6b7280">You can now close this page. Thank you!</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(400).send(`<h1>Error</h1><p>${escapeHTML(err.message)}</p>`);
  }
});

// -------------------- Daily Cron at 14:51 Africa/Tunis --------------------
let cronRunning = false;
cron.schedule(
  "55 14 * * *",
  async () => {
    if (cronRunning) return;
    cronRunning = true;

    console.log(`[CRON] Triggered at ${new Date().toISOString()} (Africa/Tunis 14:51)`);
    const week = currentISOWeekTag(new Date());
    try {
      const resps = await pool.query(`SELECT responsible_id FROM public."Responsible"`);
      for (const r of resps.rows) {
        await sendKPIEmail(r.responsible_id, week);
      }
      console.log(`✅ KPI emails sent for ${week}`);
    } catch (err) {
      console.error("❌ Error sending scheduled emails:", err.message);
    } finally {
      cronRunning = false;
    }
  },
  { scheduled: true, timezone: "Africa/Tunis" }
);

// Optional: Startup catch-up (run once if server starts within 7 mins after 14:51)
(function startupCatchup() {
  const TARGET_HOUR = 14, TARGET_MIN = 51, GRACE_MIN = 7;
  const now = new Date(), hh = now.getHours(), mm = now.getMinutes();
  if (hh === TARGET_HOUR && mm >= TARGET_MIN && mm < TARGET_MIN + GRACE_MIN) {
    console.log(`[CRON] Startup catch-up: running at ${now.toISOString()}`);
    (async () => {
      const week = currentISOWeekTag(new Date());
      const resps = await pool.query(`SELECT responsible_id FROM public."Responsible"`);
      for (const r of resps.rows) await sendKPIEmail(r.responsible_id, week);
    })().catch(e => console.error("[CRON] catch-up error:", e));
  } else {
    console.log(`[CRON] Startup: no catch-up (now ${hh}:${String(mm).padStart(2,"0")} local)`);
  }
})();

// -------------------- Start --------------------
app.listen(port, () => console.log(`Server running on port ${port}`));
