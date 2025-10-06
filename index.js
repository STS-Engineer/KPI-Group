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

// ---------- Fetch Responsible + their KPIs ----------
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

// ---------- Generate Email HTML with Button ----------
const generateEmailHtml = ({ responsible, week }) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>KPI Form</title></head>
<body style="font-family:'Segoe UI',sans-serif;background:#f4f4f4;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;padding:25px;
              border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);text-align:center;">
    <img src="https://media.licdn.com/dms/image/v2/D4E0BAQGYVmAPO2RZqQ/company-logo_200_200/company-logo_200_200/0/1689240189455/avocarbon_group_logo?e=2147483647&v=beta&t=nZNCXd3ypoMFQnQMxfAZrljyNBbp4E5HM11Y1yl9_L0" 
         alt="AVOCarbon Logo" style="width:80px;height:80px;object-fit:contain;margin-bottom:20px;">
    <h2 style="color:#0078D7;font-size:22px;margin-bottom:25px;">KPI Submission - Week ${week}</h2>
    <a href="https://kpi-form.azurewebsites.net/form?responsible_id=${responsible.responsible_id}&week=${week}"
       style="display:inline-block;padding:12px 20px;background:#0078D7;color:white;
              border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
      Fill KPI Form
    </a>
    <p style="margin-top:20px;font-size:12px;color:#888;">
      Click the button above to fill your KPIs for week ${week}.
    </p>
  </div>
</body>
</html>
`;

// ---------- Redirect handler ----------
app.get("/redirect", async (req, res) => {
  try {
    const { responsible_id, week, ...values } = req.query;
    const kpiValues = Object.entries(values)
      .filter(([key]) => key.startsWith("value_"))
      .map(([key, val]) => ({ kpi_values_id: key.split("_")[1], value: val }));

    for (let item of kpiValues) {
      await pool.query(
        `UPDATE public."kpi_values" SET value=$1 WHERE kpi_values_id=$2`,
        [item.value, item.kpi_values_id]
      );
    }

    res.redirect(`/dashboard?responsible_id=${responsible_id}&week=${week}`);
  } catch (err) {
    console.error("❌ Error in /redirect:", err.message);
    res.status(500).send(`<h2 style="color:red;">❌ Failed to submit KPI values</h2><p>${err.message}</p>`);
  }
});

// ---------- Modern Web form page ----------
app.get("/form", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;
    const { responsible, kpis } = await getResponsibleWithKPIs(responsible_id, week);
    if (!kpis.length) return res.send("<p>No KPIs found for this week.</p>");

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>KPI Form - Week ${week}</title>
        <style>
          body { font-family:'Segoe UI',sans-serif; background:#f4f6f9; padding:40px; }
          .container { max-width:750px; margin:0 auto; background:#fff; padding:30px; border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,0.1); }
          h1 { text-align:center; color:#0078D7; margin-bottom:30px; }
          .info-card { background:#f0f4f8; padding:15px 20px; border-radius:10px; margin-bottom:25px; box-shadow:0 4px 8px rgba(0,0,0,0.05); }
          .info-card p { margin:5px 0; font-size:14px; }
          .kpi-card { margin-bottom:20px; padding:20px; border-radius:12px; background:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.08); transition:0.2s; }
          .kpi-card:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,0.12); }
          .kpi-card label { font-weight:600; color:#333; display:block; margin-bottom:8px; }
          .kpi-card input { width:100%; padding:12px; font-size:14px; border-radius:8px; border:1px solid #ccc; box-shadow:inset 0 1px 3px rgba(0,0,0,0.08); transition:0.2s; }
          .kpi-card input:focus { border-color:#0078D7; box-shadow:0 0 5px rgba(0,120,215,0.3); outline:none; }
          .submit-btn { display:block; width:100%; padding:14px; background:#0078D7; color:#fff; font-size:16px; font-weight:bold; border:none; border-radius:8px; cursor:pointer; box-shadow:0 4px 10px rgba(0,120,215,0.3); transition:0.2s; }
          .submit-btn:hover { background:#005ea0; box-shadow:0 6px 12px rgba(0,120,215,0.4); }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>KPI Form - Week ${week}</h1>
          <div class="info-card">
            <p><strong>Responsible:</strong> ${responsible.name}</p>
            <p><strong>Department:</strong> ${responsible.department_name}</p>
            <p><strong>Plant:</strong> ${responsible.plant_name}</p>
            <p><strong>Week:</strong> ${week}</p>
          </div>
          <form action="/redirect" method="GET">
            <input type="hidden" name="responsible_id" value="${responsible_id}" />
            <input type="hidden" name="week" value="${week}" />
            ${kpis.map(kpi => `
              <div class="kpi-card">
                <label>${kpi.indicator_title} - ${kpi.indicator_sub_title || ''} (${kpi.unit || ''})</label>
                <input type="text" name="value_${kpi.kpi_values_id}" value="${kpi.value || ''}" placeholder="Enter value" />
              </div>
            `).join('')}
            <button type="submit" class="submit-btn">Submit KPI</button>
          </form>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.send(`<p style="color:red;">Error: ${err.message}</p>`);
  }
});

// ---------- Modern Dashboard ----------
app.get("/dashboard", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;
    const { responsible, kpis } = await getResponsibleWithKPIs(responsible_id, week);
    if (!kpis.length) return res.send("<p>No KPIs found for this week.</p>");

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>KPI Dashboard - Week ${week}</title>
        <style>
          body { font-family:'Segoe UI',sans-serif; background:#f4f6f9; padding:40px; }
          .container { max-width:900px; margin:0 auto; }
          h1 { text-align:center; color:#0078D7; margin-bottom:30px; }
          .info-card { background:#f0f4f8; padding:15px 20px; border-radius:10px; margin-bottom:25px; box-shadow:0 4px 8px rgba(0,0,0,0.05); }
          .info-card p { margin:5px 0; font-size:14px; }
          .kpi-grid { display:flex; flex-wrap:wrap; gap:20px; }
          .kpi-card { flex:1 1 200px; background:#fff; padding:20px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.08); transition:0.2s; }
          .kpi-card:hover { transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,0.12); }
          .kpi-card h3 { margin-top:0; color:#0078D7; font-size:16px; }
          .kpi-card p { margin:5px 0; color:#555; }
          .kpi-value { font-size:18px; font-weight:bold; color:#333; margin-top:10px; }
          .kpi-missing { color:#d9534f; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>KPI Dashboard - Week ${week}</h1>
          <div class="info-card">
            <p><strong>Responsible:</strong> ${responsible.name}</p>
            <p><strong>Department:</strong> ${responsible.department_name}</p>
            <p><strong>Plant:</strong> ${responsible.plant_name}</p>
            <p><strong>Week:</strong> ${week}</p>
          </div>
          <div class="kpi-grid">
            ${kpis.map(kpi => `
              <div class="kpi-card">
                <h3>${kpi.indicator_title}</h3>
                <p>${kpi.indicator_sub_title || ''}</p>
                <p class="kpi-value ${kpi.value ? '' : 'kpi-missing'}">
                  ${kpi.value || 'Not filled'} ${kpi.unit || ''}
                </p>
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.send(`<p style="color:red;">Error: ${err.message}</p>`);
  }
});

// ---------- Send KPI email ----------
const sendKPIEmail = async (responsibleId, week) => {
  try {
    const { responsible } = await getResponsibleWithKPIs(responsibleId, week);
    const html = generateEmailHtml({ responsible, week });
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: '"Administration STS" <administration.STS@avocarbon.com>',
      to: responsible.email,
      subject: `KPI Form for ${responsible.name} - Week ${week}`,
      html,
    });
    console.log(`✅ Email sent to ${responsible.email}: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Failed to send email to responsible ID ${responsibleId}:`, err.message);
  }
};

// ---------- Schedule weekly email ----------
let cronRunning = false;
cron.schedule(
  "35 12 * * *",
  async () => {
    if (cronRunning) return console.log("⏭️ Cron already running, skip...");
    cronRunning = true;

    const forcedWeek = "W39";
    try {
      const resps = await pool.query(`SELECT responsible_id FROM public."Responsible"`);
      for (let r of resps.rows) {
        await sendKPIEmail(r.responsible_id, forcedWeek);
      }
      console.log("✅ All KPI emails sent");
    } catch (err) {
      console.error("❌ Error sending scheduled emails:", err.message);
    } finally {
      cronRunning = false;
    }
  },
  { scheduled: true, timezone: "Africa/Tunis" }
);

// ---------- Start server ----------
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
