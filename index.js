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
    host: "smtp.office365.com",
    port: 587,       // TLS port
    secure: false,   // false for TLS
    auth: {
      user: "administration.STS@avocarbon.com",
      pass: "shnlgdyfbcztbhxn",
    },
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false,
    },
    logger: true,
    debug: true,
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

// ---------- Generate Email HTML ----------
const generateEmailHtml = ({ responsible, kpis, week }) => {
  if (!responsible) throw new Error("Responsible not found");
  if (!kpis.length) return `<p>No KPIs found for week ${week}</p>`;

  // Generate KPI input fields
  let kpiFieldsHtml = "";
  kpis.forEach(kpi => {
    kpiFieldsHtml += `
      <label>${kpi.indicator_title} - ${kpi.indicator_sub_title || ''} (${kpi.unit || ''})</label>
      <input type="text" name="value_${kpi.kpi_values_id}" value="${kpi.value || ''}" />
    `;
  });

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>KPI Submission Form</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; background:#f4f4f4; padding:20px; }
      .container { max-width:600px; margin:0 auto; background:#fff; padding:25px; border-radius:10px; }
      h2 { color:#0078D7; font-size:22px; text-align:center; }
      label { display:block; margin-bottom:5px; color:#555; font-weight:600; }
      input[type="text"] { width:100%; padding:10px; border:1px solid #ccc; border-radius:6px; margin-bottom:15px; }
      button { width:100%; padding:12px; background:#0078D7; color:#fff; font-size:16px; border:none; border-radius:8px; cursor:pointer; }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>KPI Submission Form - Week ${week}</h2>

      <form action="https://kpi-form.azurewebsites.net/process-kpi" method="GET">
        <input type="hidden" name="responsible_id" value="${responsible.responsible_id}" />
        <input type="hidden" name="week" value="${week}" />

        ${kpiFieldsHtml}

        <!-- Hidden field for base64 JSON -->
        <input type="hidden" name="kpi_payload" id="kpi_payload" value="" />

        <button type="submit" onclick="encodeKpiValues()">Submit KPI</button>
      </form>
    </div>

    <script>
      function encodeKpiValues() {
        const form = document.querySelector('form');
        const kpiValues = {};
        for (let input of form.querySelectorAll('input[name^="value_"]')) {
          kpiValues[input.name] = input.value;
        }
        form.kpi_payload.value = btoa(JSON.stringify(kpiValues));
      }
    </script>
  </body>
  </html>
  `;
};

// ---------- Submit KPI endpoint ----------
app.post("/api/submit-kpi", async (req, res) => {
  try {
    const { responsible_id, ...values } = req.body;
    const keys = Object.keys(values).filter(k => k.startsWith("value_"));

    for (let key of keys) {
      const kpiValuesId = key.split("_")[1];
      const value = values[key];

      await pool.query(
        `UPDATE public."kpi_values" SET value=$1 WHERE kpi_values_id=$2`,
        [value, kpiValuesId]
      );
    }

    res.json({ status: "success", message: "KPI values submitted successfully!" });
  } catch (err) {
    console.error("Error submitting KPI:", err);
    res.status(500).json({ status: "error", message: "Error submitting KPI values." });
  }
});

// ---------- Process KPI via GET redirect ----------
app.get("/process-kpi", async (req, res) => {
  try {
    const { responsible_id, week, kpi_payload } = req.query;
    if (!responsible_id || !week || !kpi_payload)
      return res.status(400).send("Missing parameters");

    const kpis = JSON.parse(Buffer.from(kpi_payload, "base64").toString());

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Processing KPI Submission</title>
        <style>
          body { font-family:'Segoe UI', sans-serif; background:#f4f4f4; padding:20px; display:flex; justify-content:center; align-items:center; min-height:100vh; }
          .container { background:#fff; padding:30px; border-radius:10px; text-align:center; box-shadow:0 4px 15px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <div class="container">
          <div id="status">Submitting KPI...</div>
        </div>

        <script>
          async function submitData() {
            const body = { responsible_id: '${responsible_id}', week: '${week}', ...${JSON.stringify(kpis)} };
            const statusEl = document.getElementById('status');

            try {
              const resp = await fetch('https://kpi-form.azurewebsites.net/api/submit-kpi', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(body)
              });
              const data = await resp.json();
              if (data.status === 'success') {
                statusEl.textContent = '✅ KPI saved! Redirecting...';
                setTimeout(() => {
                  window.location.href = 'https://kpi-form.azurewebsites.net/kpi-submitted?responsible_id=${responsible_id}&week=${week}';
                }, 1000);
              } else {
                statusEl.textContent = '❌ Error: ' + data.message;
              }
            } catch (err) {
              statusEl.textContent = '❌ Network error: ' + err.message;
            }
          }
          setTimeout(submitData, 500);
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("Error processing KPI: " + err.message);
  }
});

// ---------- KPI Submitted page ----------
app.get("/kpi-submitted", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;
    if (!responsible_id || !week)
      throw new Error("Missing parameters");

    const { responsible, kpis } = await getResponsibleWithKPIs(responsible_id, week);

    let kpiHtml = "";
    if (kpis.length > 0) {
      const grouped = {};
      kpis.forEach(k => {
        if (!grouped[k.indicator_title]) grouped[k.indicator_title] = [];
        grouped[k.indicator_title].push(k);
      });

      Object.keys(grouped).forEach(title => {
        kpiHtml += `<div style="margin-bottom:15px;"><h4>${title}</h4>`;
        grouped[title].forEach(k => {
          kpiHtml += `<p>${k.indicator_sub_title || 'Value'}: ${k.value || 'N/A'} ${k.unit || ''}</p>`;
        });
        kpiHtml += `</div>`;
      });
    } else {
      kpiHtml = `<p>No KPI data found for this period.</p>`;
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>KPI Submitted</title></head>
      <body>
        <h1>KPI Submitted Successfully</h1>
        <h2>${responsible.name}</h2>
        <p>Plant: ${responsible.plant_name}</p>
        <p>Department: ${responsible.department_name}</p>
        <p>Week: ${week}</p>
        ${kpiHtml}
      </body>
      </html>
    `);
  } catch (err) {
    res.send(`<p>Error loading submitted KPIs: ${err.message}</p>`);
  }
});

// ---------- Send KPI email ----------
const sendKPIEmail = async (responsibleId, week) => {
  try {
    const { responsible, kpis } = await getResponsibleWithKPIs(responsibleId, week);
    if (!kpis.length) return;

    const html = generateEmailHtml({ responsible, kpis, week });
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: '"Avocarbon Administration" <administration.STS@avocarbon.com>',
      to: responsible.email,
      subject: `KPI Form for ${responsible.name} - Week ${week}`,
      html,
    });

    console.log(`Email sent to ${responsible.email}: ${info.messageId}`);
  } catch (err) {
    console.error(`Failed to send email to responsible ID ${responsibleId}:`, err.message);
  }
};

// ---------- Schedule weekly email ----------
let cronRunning = false;
cron.schedule(
  "05 14 * * *", // daily at 17:29 Africa/Tunis
  async () => {
    if (cronRunning) return;
    cronRunning = true;

    const forcedWeek = "W39";
    try {
      const resps = await pool.query(`SELECT responsible_id FROM public."Responsible"`);
      for (let r of resps.rows) {
        await sendKPIEmail(r.responsible_id, forcedWeek);
      }
      console.log("All KPI emails sent");
    } catch (err) {
      console.error("Error sending scheduled emails:", err.message);
    } finally {
      cronRunning = false;
    }
  },
  { scheduled: true, timezone: "Africa/Tunis" }
);

// ---------- Root route ----------
app.get("/", (req, res) => {
  res.send(`<h1>KPI Submission System Running</h1><p>Use the email links to access KPI forms.</p>`);
});

app.listen(port, () => console.log(`Server running on port ${port}`));
