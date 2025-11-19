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
      
      <h2 style="color:#0078D7;font-size:22px;margin-bottom:20px;">KPI Submission - ${week}</h2>

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



// ---------- Redirect handler ----------

app.get("/redirect", async (req, res) => {
  try {
    const { responsible_id, week, ...values } = req.query;
    const kpiValues = Object.entries(values)
      .filter(([key]) => key.startsWith("value_"))
      .map(([key, val]) => ({
        kpi_values_id: key.split("_")[1],
        value: val,
      }));

    for (let item of kpiValues) {
      // 1️⃣ Get the old value
      const oldRes = await pool.query(
        `SELECT value, kpi_id FROM public."kpi_values" WHERE kpi_values_id = $1`,
        [item.kpi_values_id]
      );

      if (oldRes.rows.length) {
        const { value: old_value, kpi_id } = oldRes.rows[0];

        // 2️⃣ Insert into history table
        await pool.query(
          `
          INSERT INTO public.kpi_values_hist 
          (kpi_values_id, responsible_id, kpi_id, week, old_value, new_value)
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            item.kpi_values_id,
            responsible_id,
            kpi_id,
            week,
            old_value,
            item.value,
          ]
        );

        // 3️⃣ Update current value
        await pool.query(
          `UPDATE public."kpi_values" SET value = $1 WHERE kpi_values_id = $2`,
          [item.value, item.kpi_values_id]
        );
      }
    }

    // 4️⃣ Instead of redirecting to dashboard, show success message
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>KPI Submitted</title>
        <style>
          body { 
            font-family:'Segoe UI',sans-serif; 
            background:#f4f4f4; 
            display:flex; 
            justify-content:center; 
            align-items:center; 
            height:100vh; 
            margin:0; 
          }
          .success-container {
            background:#fff; 
            padding:40px; 
            border-radius:10px; 
            box-shadow:0 4px 15px rgba(0,0,0,0.1);
            text-align:center;
          }
          h1 { color:#28a745; font-size:28px; margin-bottom:20px; }
          p { font-size:16px; color:#333; margin-bottom:30px; }
          a { display:inline-block; padding:12px 25px; background:#0078D7; color:white; text-decoration:none; border-radius:6px; font-weight:bold; }
          a:hover { background:#005ea6; }
        </style>
      </head>
      <body>
        <div class="success-container">
          <h1>✅ KPI Submitted Successfully!</h1>
          <p>Your KPI values for ${week} have been saved.</p>
          <a href="/dashboard?responsible_id=${responsible_id}">Go to Dashboard</a>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    console.error("❌ Error in /redirect:", err.message);
    res.status(500).send(`
      <h2 style="color:red;">❌ Failed to submit KPI values</h2>
      <p>${err.message}</p>
    `);
  }
});


// ---------- Modern Web  page ----------
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
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #f4f6f9; 
            padding: 20px;
            margin: 0;
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: #fff; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            background: #0078D7; 
            color: white; 
            padding: 20px; 
            text-align: center;
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px;
            font-weight: 600;
          }
          .form-section { 
            padding: 30px;
          }
          .info-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 25px;
            border-left: 4px solid #0078D7;
          }
          .info-row {
            display: flex;
            margin-bottom: 15px;
            align-items: center;
          }
          .info-label {
            font-weight: 600;
            color: #333;
            width: 120px;
            font-size: 14px;
          }
          .info-value {
            flex: 1;
            padding: 8px 12px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }
          .kpi-section {
            margin-top: 30px;
          }
          .kpi-section h3 {
            color: #0078D7;
            margin-bottom: 20px;
            font-size: 18px;
            border-bottom: 2px solid #0078D7;
            padding-bottom: 8px;
          }
          .kpi-card {
            background: #fff;
            border: 1px solid #e1e5e9;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          }
          .kpi-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
            font-size: 15px;
          }
          .kpi-subtitle {
            color: #666;
            font-size: 13px;
            margin-bottom: 10px;
          }
          .kpi-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            transition: border-color 0.2s;
          }
          .kpi-input:focus {
            border-color: #0078D7;
            outline: none;
            box-shadow: 0 0 0 2px rgba(0,120,215,0.1);
          }
          .submit-btn {
            background: #0078D7;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
            display: block;
            width: 100%;
            margin-top: 20px;
          }
          .submit-btn:hover {
            background: #005ea6;
          }
          .unit-label {
            color: #888;
            font-size: 12px;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
          <h2 style="color:#0078D7;font-size:22px;margin-bottom:5px;">
             KPI Submission - ${week}
           </h2>
          <h3 style="color:#555;font-size:16px;margin-bottom:20px;">
            Plant: ${responsible.plant_name}
          </h3>
          </div>
          
          <div class="form-section">
            <div class="info-section">
              <div class="info-row">
                <div class="info-label">Responsible Name</div>
                <div class="info-value">${responsible.name}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Plant</div>
                <div class="info-value">${responsible.plant_name}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Department</div>
                <div class="info-value">${responsible.department_name}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Week</div>
                <div class="info-value">${week}</div>
              </div>
            </div>

            <div class="kpi-section">
              <h3>KPI Values</h3>
              <form action="/redirect" method="GET">
                <input type="hidden" name="responsible_id" value="${responsible_id}" />
                <input type="hidden" name="week" value="${week}" />
                ${kpis.map(kpi => `
                  <div class="kpi-card">
                    <div class="kpi-title">${kpi.indicator_title}</div>
                    ${kpi.indicator_sub_title ? `<div class="kpi-subtitle">${kpi.indicator_sub_title}</div>` : ''}
                    <input 
                      type="text" 
                      name="value_${kpi.kpi_values_id}" 
                      value="${kpi.value || ''}" 
                      placeholder="Enter value" 
                      class="kpi-input"
                    />
                    ${kpi.unit ? `<div class="unit-label">Unit: ${kpi.unit}</div>` : ''}
                  </div>
                `).join('')}
                <button type="submit" class="submit-btn">Submit KPI Values</button>
              </form>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.send(`<p style="color:red;">Error: ${err.message}</p>`);
  }
});

// ---------- Modern Dashboard by Week ----------
app.get("/dashboard", async (req, res) => {
  try {
    const { responsible_id } = req.query;

    // 1️⃣ Fetch responsible info
    const resResp = await pool.query(
      `
      SELECT r.responsible_id, r.name, r.email, r.plant_id, r.department_id,
             p.name AS plant_name, d.name AS department_name
      FROM public."Responsible" r
      JOIN public."Plant" p ON r.plant_id = p.plant_id
      JOIN public."Department" d ON r.department_id = d.department_id
      WHERE r.responsible_id = $1
      `,
      [responsible_id]
    );
    const responsible = resResp.rows[0];
    if (!responsible) throw new Error("Responsible not found");

    // 2️⃣ Fetch all KPI values for this responsible, grouped by week
    const kpiRes = await pool.query(
      `
      SELECT kv.kpi_values_id, kv.value, kv.week, k.kpi_id,
             k.indicator_title, k.indicator_sub_title, k.unit
      FROM public.kpi_values kv
      JOIN public."Kpi" k ON kv.kpi_id = k.kpi_id
      WHERE kv.responsible_id = $1
      ORDER BY kv.week ASC, k.kpi_id ASC
      `,
      [responsible_id]
    );

    // 3️⃣ Group KPIs by week
    const weeks = {};
    kpiRes.rows.forEach(kpi => {
      if (!weeks[kpi.week]) weeks[kpi.week] = [];
      weeks[kpi.week].push(kpi);
    });

    // 4️⃣ Generate HTML
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>KPI Dashboard - ${responsible.name}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f4f6f9; padding: 20px; margin:0; }
          .container { max-width: 900px; margin: 0 auto; }
          .header { background:#0078D7; color:white; padding:20px; text-align:center; border-radius:8px 8px 0 0; }
          .header h1 { margin:0; font-size:24px; }
          .content { background:#fff; padding:30px; border-radius:0 0 8px 8px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
          .info-section { background:#f8f9fa; padding:20px; border-radius:6px; margin-bottom:25px; border-left:4px solid #0078D7; }
          .info-row { display:flex; margin-bottom:10px; }
          .info-label { width:120px; font-weight:600; color:#333; }
          .info-value { flex:1; background:white; padding:8px 12px; border:1px solid #ddd; border-radius:4px; }
          .week-section { margin-bottom:30px; }
          .week-title { color:#0078D7; font-size:18px; margin-bottom:10px; font-weight:600; border-bottom:2px solid #0078D7; padding-bottom:5px; }
          .kpi-card { background:#fff; border:1px solid #e1e5e9; border-radius:6px; padding:15px; margin-bottom:15px; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
          .kpi-title { font-weight:600; color:#333; margin-bottom:5px; }
          .kpi-subtitle { color:#666; font-size:13px; margin-bottom:10px; }
          .kpi-value { font-size:16px; font-weight:bold; color:#0078D7; }
          .kpi-unit { color:#888; font-size:12px; margin-top:5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KPI Dashboard - ${responsible.name}</h1>
          </div>
          <div class="content">
            <div class="info-section">
              <div class="info-row"><div class="info-label">Responsible</div><div class="info-value">${responsible.name}</div></div>
              <div class="info-row"><div class="info-label">Plant</div><div class="info-value">${responsible.plant_name}</div></div>
              <div class="info-row"><div class="info-label">Department</div><div class="info-value">${responsible.department_name}</div></div>
            </div>
    `;

    for (const [week, items] of Object.entries(weeks)) {
      html += `<div class="week-section"><div class="week-title">${week}</div>`;
      items.forEach(kpi => {
        html += `<div class="kpi-card">
                  <div class="kpi-title">${kpi.indicator_title}</div>
                  ${kpi.indicator_sub_title ? `<div class="kpi-subtitle">${kpi.indicator_sub_title}</div>` : ''}
                  <div class="kpi-value">${kpi.value || 'Not filled'}</div>
                  ${kpi.unit ? `<div class="kpi-unit">${kpi.unit}</div>` : ''}
                 </div>`;
      });
      html += `</div>`;
    }

    html += `</div></div></body></html>`;
    res.send(html);

  } catch (err) {
    res.send(`<p style="color:red;">Error: ${err.message}</p>`);
  }
});




app.get("/dashboard-history", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;

    const histRes = await pool.query(
      `
      SELECT h.hist_id, h.kpi_id, h.week, h.old_value, h.new_value, h.updated_at,
             k.indicator_title, k.indicator_sub_title, k.unit
      FROM public.kpi_values_hist h
      JOIN public."Kpi" k ON h.kpi_id = k.kpi_id
      WHERE h.responsible_id = $1
      ORDER BY h.updated_at DESC
      `,
      [responsible_id]
    );

    const rows = histRes.rows;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>KPI History Dashboard</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f4f6f9;
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
            text-align: center;
            color: #0078D7;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 10px 12px;
            border: 1px solid #ddd;
            text-align: center;
          }
          th {
            background: #0078D7;
            color: white;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background: #f8f9fa;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>KPI Value History</h1>
          <table>
            <thead>
              <tr>
                <th>Indicator</th>
                <th>Sub Title</th>
                <th>Week</th>
                <th>Old Value</th>
                <th>New Value</th>
                <th>Unit</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (r) => `
                  <tr>
                    <td>${r.indicator_title}</td>
                    <td>${r.indicator_sub_title || "-"}</td>
                    <td>${r.week}</td>
                    <td>${r.old_value ?? "—"}</td>
                    <td>${r.new_value ?? "—"}</td>
                    <td>${r.unit || ""}</td>
                    <td>${new Date(r.updated_at).toLocaleString()}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("❌ Error loading dashboard-history:", err.message);
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
      subject: `KPI Form for ${responsible.name} - ${week}`,
      html,
    });
    console.log(`✅ Email sent to ${responsible.email}: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Failed to send email to responsible ID ${responsibleId}:`, err.message);
  }
};

// ---------- Schedule weekly email ----------
// ---------- Schedule weekly email ----------
let cronRunning = false;
cron.schedule(
  "15 10 * * *",
  async () => {
    if (cronRunning) return console.log("⏭️ Cron already running, skip...");
    cronRunning = true;

    const forcedWeek = "2025-Week45"; // or dynamically compute current week
    try {
      // ✅ Send only to responsibles who actually have KPI records for that week
      const resps = await pool.query(`
        SELECT DISTINCT r.responsible_id
        FROM public."Responsible" r
        JOIN public.kpi_values kv ON kv.responsible_id = r.responsible_id
        WHERE kv.week = $1
      `, [forcedWeek]);

      for (let r of resps.rows) {
        await sendKPIEmail(r.responsible_id, forcedWeek);
      }

      console.log(`✅ KPI emails sent to ${resps.rows.length} responsibles`);
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
