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
    port: 25, // Try 587 if port 25 blocked
    secure: false,
    auth: {
      user: "administration.STS@avocarbon.com",
      pass: "shnlgdyfbcztbhxn",
    },
  });

// ---------- Fetch Responsible + KPIs ----------
const getResponsibleWithKPIs = async (responsibleId, week) => {
  const resResp = await pool.query(
    `SELECT r.responsible_id, r.name, r.email, r.plant_id, r.department_id,
            p.name AS plant_name, d.name AS department_name
     FROM public."Responsible" r
     JOIN public."Plant" p ON r.plant_id = p.plant_id
     JOIN public."Department" d ON r.department_id = d.department_id
     WHERE r.responsible_id = $1`,
    [responsibleId]
  );

  const responsible = resResp.rows[0];
  if (!responsible) throw new Error("Responsible not found");

  const kpiRes = await pool.query(
    `SELECT kv.kpi_values_id, kv.value, kv.week, k.kpi_id, 
            k.indicator_title, k.indicator_sub_title, k.unit
     FROM public.kpi_values kv
     JOIN "Kpi" k ON kv.kpi_id = k.kpi_id
     WHERE kv.responsible_id = $1 AND kv.week = $2
     ORDER BY k.kpi_id ASC`,
    [responsibleId, week]
  );

  return { responsible, kpis: kpiRes.rows };
};

// ---------- Generate email HTML ----------
const generateEmailHtml = ({ responsible, kpis, week }) => {
  if (!responsible) throw new Error("Responsible not found");
  if (!kpis.length) return `<p>No KPIs found for week ${week}</p>`;

  const groupedKpis = {};
  kpis.forEach(kpi => {
    if (!groupedKpis[kpi.indicator_title]) groupedKpis[kpi.indicator_title] = [];
    groupedKpis[kpi.indicator_title].push(kpi);
  });

  let kpiFields = "";
  Object.keys(groupedKpis).forEach(title => {
    kpiFields += `<div style="margin-bottom:25px;padding:15px;border:1px solid #ddd;border-radius:8px;">
      <h3 style="margin:0 0 15px 0;font-size:18px;color:#0078D7;font-weight:700;">${title}</h3>`;
    groupedKpis[title].forEach(kpi => {
      kpiFields += `<div style="margin-bottom:15px;">
        <label style="display:block;margin-bottom:5px;color:#555;font-size:14px;">
          ${kpi.indicator_sub_title || ""} (${kpi.unit || ""}):
        </label>
        <input type="text" name="value_${kpi.kpi_values_id}" placeholder="Enter value"
          value="${kpi.value || ""}" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;
          font-size:14px;box-sizing:border-box;" />
      </div>`;
    });
    kpiFields += `</div>`;
  });

  return `<html><body style="font-family:'Segoe UI', sans-serif;background:#f4f4f4;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;padding:25px;border-radius:10px;
      box-shadow:0 4px 15px rgba(0,0,0,0.1);">
      <h2 style="color:#0078D7;text-align:center;">KPI Submission Form - Week ${week}</h2>
      <form>
        <input type="hidden" name="responsible_id" value="${responsible.responsible_id}" />
        <input type="hidden" name="week" value="${week}" />
        ${kpiFields}
      </form>
    </div>
  </body></html>`;
};

// ---------- Send KPI email ----------
const sendKPIEmail = async (responsibleId, week) => {
  try {
    const { responsible, kpis } = await getResponsibleWithKPIs(responsibleId, week);
    if (!kpis.length) {
      console.log(`⚠️ No KPIs for Responsible ID ${responsibleId}`);
      return;
    }

    const html = generateEmailHtml({ responsible, kpis, week });
    const transporter = createTransporter();

    // Test SMTP connection first
    await transporter.verify();

    const info = await transporter.sendMail({
      from: '"Avocarbon Administration" <administration.STS@avocarbon.com>',
      to: responsible.email,
      subject: `KPI Form for ${responsible.name} - Week ${week}`,
      html,
    });

    console.log(`✅ Email sent to ${responsible.email}: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Failed to send email to responsible ID ${responsibleId}:`, err.message);
  }
};

// ---------- Test cron: every minute ----------
let cronRunning = false;
cron.schedule("* * * * *", async () => {
  console.log("⏱️ Cron tick");
  if (cronRunning) {
    console.log("⏭️ Cron already running, skip...");
    return;
  }
  cronRunning = true;

  const testWeek = "W39"; // testing
  try {
    const resps = await pool.query(`SELECT responsible_id FROM public."Responsible"`);
    for (let r of resps.rows) {
      console.log(`➡️ Sending email to Responsible ID ${r.responsible_id}`);
      await sendKPIEmail(r.responsible_id, testWeek);
    }
    console.log("✅ All KPI emails sent (testing mode)");
  } catch (err) {
    console.error("❌ Error in cron:", err.message);
  } finally {
    cronRunning = false;
  }
}, { scheduled: true, timezone: "Africa/Tunis" });

// ---------- Start server ----------
app.listen(port, () => console.log(`Server running on port ${port}`));
