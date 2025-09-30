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

// ---------- Generate email HTML with "Fill KPI Form" button ----------
const generateEmailHtml = ({ responsible, week }) => {
  const formUrl = `https://kpi-form.azurewebsites.net/kpi-entry?responsible_id=${responsible.responsible_id}&week=${week}`;

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>KPI Form</title></head>
    <body style="font-family: 'Segoe UI', sans-serif; background:#f4f4f4; padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;padding:25px;
                  border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
        <div style="display:flex;align-items:center;justify-content:flex-start;gap:25px;margin-bottom:30px;">
          <img src="https://media.licdn.com/dms/image/v2/D4E0BAQGYVmAPO2RZqQ/company-logo_200_200/company-logo_200_200/0/1689240189455/avocarbon_group_logo?e=2147483647&v=beta&t=nZNCXd3ypoMFQnQMxfAZrljyNBbp4E5HM11Y1yl9_L0" 
               alt="AVOCarbon Logo" style="width:80px;height:80px;object-fit:contain;">
          <h2 style="color:#0078D7;font-size:22px;margin:0;font-weight:700;text-align:center;width:100%;">
              KPI Submission Form - Week ${week}
          </h2>
        </div>

        <p>Hello ${responsible.name},</p>
        <p>Click the button below to fill and submit your KPIs for Week ${week}:</p>

        <a href="${formUrl}" 
           style="display:inline-block;padding:12px 20px;background:#0078D7;color:#fff;
                  text-decoration:none;border-radius:8px;font-weight:600;">
          Fill KPI Form
        </a>

        <p style="margin-top:20px;font-size:12px;color:#777;">
          This link is personalized and only valid for you. If you did not request this, please ignore this email.
        </p>
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
      await pool.query(
        `UPDATE public."kpi_values" SET value=$1 WHERE kpi_values_id=$2`,
        [values[key], kpiValuesId]
      );
    }

    res.json({ status: "success", message: "✅ KPI values submitted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "❌ Error submitting KPI values." });
  }
});

// ---------- Get KPIs by responsible ----------
app.get("/api/kpis/:responsibleId", async (req, res) => {
  try {
    const responsibleId = req.params.responsibleId;
    const week = req.query.week || "37-25";

    const { responsible, kpis } = await getResponsibleWithKPIs(responsibleId, week);

    if (!kpis.length) {
      return res.json({ status: "success", responsible, groupedKpis: {} });
    }

    const groupedKpis = {};
    kpis.forEach((kpi) => {
      if (!groupedKpis[kpi.indicator_title]) groupedKpis[kpi.indicator_title] = [];
      groupedKpis[kpi.indicator_title].push({
        kpi_values_id: kpi.kpi_values_id,
        kpi_id: kpi.kpi_id,
        indicator_sub_title: kpi.indicator_sub_title,
        unit: kpi.unit,
        value: kpi.value,
      });
    });

    res.json({ status: "success", responsible, groupedKpis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ---------- Send KPI email ----------
const sendKPIEmail = async (responsibleId, week) => {
  try {
    // Lock KPI values to prevent double sending
    const lockRes = await pool.query(
      `
      UPDATE public.kpi_values
      SET value = value
      WHERE responsible_id = $1
        AND week = $2
        AND value IS NULL
      RETURNING kpi_values_id
      `,
      [responsibleId, week]
    );

    if (lockRes.rowCount === 0) {
      console.log(`⚠️ Already sent or no KPIs for Responsible ID ${responsibleId}, week ${week}`);
      return;
    }

    const { responsible } = await getResponsibleWithKPIs(responsibleId, week);
    const html = generateEmailHtml({ responsible, week });
    const transporter = createTransporter();

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

// ---------- Schedule weekly KPI emails ----------
let cronRunning = false;

cron.schedule(
  "20 17 * * *",
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
      console.log("✅ All KPI emails sent successfully");
    } catch (err) {
      console.error("❌ Error sending scheduled emails:", err.message);
    } finally {
      cronRunning = false;
    }
  },
  { scheduled: true, timezone: "Africa/Tunis" }
);

app.listen(port, () => console.log(`Server running on port ${port}`));
