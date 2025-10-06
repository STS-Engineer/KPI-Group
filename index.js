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
const generateEmailHtml = ({ responsible, week }) => {
  return `
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
};

// ---------- Redirect handler (saves KPI values after submission) ----------
app.get("/redirect", async (req, res) => {
  try {
    const { responsible_id, week, ...values } = req.query;
    const kpiValues = Object.entries(values)
      .filter(([key]) => key.startsWith("value_"))
      .map(([key, val]) => ({ kpi_values_id: key.split("_")[1], value: val }));

    // Persist after 1 second
    setTimeout(async () => {
      for (let item of kpiValues) {
        await pool.query(
          `UPDATE public."kpi_values" SET value=$1 WHERE kpi_values_id=$2`,
          [item.value, item.kpi_values_id]
        );
      }
    }, 1000);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Submitting KPI</title></head>
      <body style="font-family:'Segoe UI',sans-serif;text-align:center;padding-top:100px;">
        <h2 style="color:#0078D7;">Submitting KPI values...</h2>
        <p>Please wait while we save your KPI data for week ${week}.</p>
        <script>
          setTimeout(() => {
            document.body.innerHTML = '<h2 style="color:green;">✅ KPI values submitted successfully!</h2>';
          }, 1500);
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("❌ Error in /redirect:", err.message);
    res.status(500).send(`<h2 style="color:red;">❌ Failed to submit KPI values</h2><p>${err.message}</p>`);
  }
});

// ---------- Web form page ----------
app.get("/form", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;
    const { responsible, kpis } = await getResponsibleWithKPIs(responsible_id, week);

    if (!kpis.length) return res.send("<p>No KPIs found for this week.</p>");

    let kpiFields = "";
    kpis.forEach((kpi) => {
      kpiFields += `
        <div style="margin-bottom:15px;">
          <label>${kpi.indicator_title} - ${kpi.indicator_sub_title || ""} (${kpi.unit || ""})</label>
          <input type="text" name="value_${kpi.kpi_values_id}" value="${kpi.value || ""}" style="width:100%;padding:8px;margin-top:4px;" />
        </div>
      `;
    });

    res.send(`
      <div style="max-width:600px;margin:0 auto;padding:25px;font-family:'Segoe UI',sans-serif;">
        <h2 style="color:#0078D7;">KPI Form - Week ${week}</h2>
        <form action="/redirect" method="GET">
          <input type="hidden" name="responsible_id" value="${responsible_id}" />
          <input type="hidden" name="week" value="${week}" />
          ${kpiFields}
          <button type="submit" style="padding:12px 20px;background:#0078D7;color:white;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">
            Submit KPI
          </button>
        </form>
      </div>
    `);
  } catch (err) {
    res.send(`<p>Error: ${err.message}</p>`);
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
  "58 11 * * *",
  async () => {
    if (cronRunning) {
      console.log("⏭️ Cron already running, skip...");
      return;
    }
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
