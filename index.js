require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ---------- Postgres ----------
const pool = new Pool({
  user: "adminavo",
  host: "avo-adb-001.postgres.database.azure.com",
  database: "indicatordb",
  password: "$#fKcdXPg4@ue8AW",
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

// ---------- Nodemailer ----------
const createTransporter = () =>
  nodemailer.createTransport({
    host: "avocarbon-com.mail.protection.outlook.com",
    port: 25,
    secure: false,
    auth: {
      user: "administration.STS@avocarbon.com",
      pass: "shnlgdyfbcztbhxn",
    },
  });

// ---------- Fetch Responsible + KPIs ----------
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
    JOIN "Kpi" k ON kv.kpi_id = k.kpi_id
    WHERE kv.responsible_id = $1 AND kv.week = $2
    ORDER BY k.kpi_id ASC
    `,
    [responsibleId, week]
  );

  return { responsible, kpis: kpiRes.rows };
};

// ---------- Generate email HTML with redirect button ----------
const generateEmailHtml = ({ responsible, kpis, week }) => {
  if (!responsible) throw new Error("Responsible not found");
  if (!kpis.length) return `<p>No KPIs found for week ${week}</p>`;

  // Encode KPI values in URL parameters
  const kpiParams = kpis
    .map(
      (kpi) =>
        `value_${kpi.kpi_values_id}=${encodeURIComponent(kpi.value || "")}`
    )
    .join("&");

  const url = `https://kpi-form.azurewebsites.net/kpi-review?responsible_id=${responsible.responsible_id}&week=${week}&${kpiParams}`;

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>KPI Form</title></head>
  <body style="font-family: 'Segoe UI', sans-serif; background:#f4f4f4; padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;padding:25px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
      <h2 style="color:#0078D7;font-size:22px;margin-bottom:25px;text-align:center;">KPI Submission Form - Week ${week}</h2>
      <p>Hello <strong>${responsible.name}</strong>, please review your KPI values and submit:</p>
      <ul>
        ${kpis
          .map(
            (kpi) =>
              `<li><strong>${kpi.indicator_title} - ${kpi.indicator_sub_title || ""}:</strong> ${kpi.value || ""} ${kpi.unit || ""}</li>`
          )
          .join("")}
      </ul>
      <a href="${url}" style="display:inline-block;padding:12px 20px;background:#0078D7;color:#fff;border-radius:6px;text-decoration:none;margin-top:20px;">
        Submit KPI
      </a>
    </div>
  </body>
  </html>
  `;
};

// ---------- Submit KPI endpoint ----------
app.post("/api/submit-kpi", async (req, res) => {
  try {
    const { responsible_id, ...values } = req.body;
    const keys = Object.keys(values).filter((k) => k.startsWith("value_"));

    for (let key of keys) {
      const kpiValuesId = key.split("_")[1];
      const value = values[key];

      await pool.query(
        `UPDATE public."kpi_values" SET value=$1 WHERE kpi_values_id=$2`,
        [value, kpiValuesId]
      );
    }

    res.json({
      status: "success",
      message: "✅ KPI values submitted successfully!",
      responsible_id,
      week: values.week,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ---------- KPI Review Page ----------
app.get("/kpi-review", async (req, res) => {
  try {
    const { responsible_id, week, ...kpiValues } = req.query;
    if (!responsible_id || !week) throw new Error("Missing responsible_id or week");

    const { responsible, kpis } = await getResponsibleWithKPIs(responsible_id, week);

    // Render KPI review page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Review KPI</title></head>
      <body style="font-family:'Segoe UI', sans-serif;background:#f4f4f4;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;padding:25px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
          <h2 style="color:#0078D7;text-align:center;">Review Your KPI Submission - Week ${week}</h2>
          <div id="kpiContainer"></div>
          <div id="status" style="margin-top:20px;text-align:center;color:#555;">Submitting in 1 second...</div>
        </div>
        <script>
          const kpiValues = ${JSON.stringify(kpiValues)};
          const container = document.getElementById('kpiContainer');
           Object.keys(kpiValues).forEach(k => {
          const div = document.createElement('div');
          div.style.marginBottom = "10px";

          const label = document.createElement('label');
          label.textContent = k;
          label.style.display = 'block';
          label.style.marginBottom = '4px';

          const input = document.createElement('input');
          input.type = 'text';
          input.name = k;
          input.value = kpiValues[k];
          input.style.width = '100%';
          input.style.padding = '8px';
          input.style.border = '1px solid #ccc';
          input.style.borderRadius = '4px';
          div.appendChild(label);
          div.appendChild(input);
          container.appendChild(div);
          });


          setTimeout(async () => {
            try {
              const body = { responsible_id: '${responsible_id}', week: '${week}', ...kpiValues };
              const response = await fetch('/api/submit-kpi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });
              const data = await response.json();
              if (data.status === 'success') {
                window.location.href = '/kpi-submitted?responsible_id=${responsible_id}&week=${week}';
              } else {
                document.getElementById('status').textContent = 'Error saving KPI: ' + data.message;
              }
            } catch (err) {
              document.getElementById('status').textContent = 'Network error: ' + err.message;
            }
          }, 1000);
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
});

// ---------- KPI Submitted page ----------
app.get("/kpi-submitted", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;
    if (!responsible_id || !week) throw new Error("Missing parameters");

    const { responsible, kpis } = await getResponsibleWithKPIs(responsible_id, week);

    const kpiHtml = kpis
      .map(
        (kpi) =>
          `<li><strong>${kpi.indicator_title} - ${kpi.indicator_sub_title || ''}:</strong> ${kpi.value || 'N/A'} ${kpi.unit || ''}</li>`
      )
      .join('');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>KPI Submitted</title></head>
      <body style="font-family:'Segoe UI', sans-serif;background:#f4f4f4;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;padding:25px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
          <h2 style="color:#28a745;text-align:center;">KPI Submitted Successfully!</h2>
          <p><strong>Responsible:</strong> ${responsible.name}</p>
          <p><strong>Week:</strong> ${week}</p>
          <ul>${kpiHtml}</ul>
          <p style="text-align:center;color:#555;">You can now close this page. Thank you!</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
});

// ---------- Send KPI email ----------
const sendKPIEmail = async (responsibleId, week) => {
  try {
    const { responsible, kpis } = await getResponsibleWithKPIs(responsibleId, week);
    if (!kpis.length) return;

    const html = generateEmailHtml({ responsible, kpis, week });
    const transporter = createTransporter();
    await transporter.sendMail({
      from: '"Avocarbon Administration" <administration.STS@avocarbon.com>',
      to: responsible.email,
      subject: `KPI Form for ${responsible.name} - Week ${week}`,
      html,
    });

    console.log(`✅ Email sent to ${responsible.email}`);
  } catch (err) {
    console.error(`❌ Failed to send email for Responsible ID ${responsibleId}:`, err.message);
  }
};

// ---------- Schedule weekly email ----------
let cronRunning = false;
cron.schedule(
  "48 10 * * *", // daily 09:51 Africa/Tunis
  async () => {
    if (cronRunning) return;
    cronRunning = true;

    const forcedWeek = "W39"; // adjust dynamically if needed
    try {
      const resps = await pool.query(`SELECT responsible_id FROM public."Responsible"`);
      for (let r of resps.rows) await sendKPIEmail(r.responsible_id, forcedWeek);
      console.log(`✅ KPI emails sent for week ${forcedWeek}`);
    } catch (err) {
      console.error("❌ Error sending scheduled emails:", err.message);
    } finally {
      cronRunning = false;
    }
  },
  { scheduled: true, timezone: "Africa/Tunis" }
);

// ---------- Root ----------
app.get("/", (req, res) => {
  res.send("<h1>KPI Submission System is running</h1>");
});

app.listen(port, () => console.log(`Server running on port ${port}`));
