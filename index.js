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
  user: "administrationSTS",
  host: "avo-adb-002.postgres.database.azure.com",
  database: "indicatordb",
  password: "St$@0987",
  port: 5432,
  ssl: { rejectUnauthorized: false },
});


// ---------- Job Lock Helper ----------
const acquireJobLock = async (lockId, ttlMinutes = 9) => {
  const instanceId = process.env.WEBSITE_INSTANCE_ID || `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // 1. Clean up expired locks
    await pool.query(`DELETE FROM public.job_locks WHERE expires_at < NOW()`);

    // 2. Try to acquire lock
    const lockResult = await pool.query(
      `INSERT INTO public.job_locks (lock_id, acquired_at, instance_id, expires_at)
       VALUES ($1, NOW(), $2, NOW() + INTERVAL '${ttlMinutes} minutes')
       ON CONFLICT (lock_id) 
       DO NOTHING
       RETURNING lock_id, instance_id`,
      [lockId, instanceId]
    );

    return lockResult.rows.length > 0 
      ? { acquired: true, instanceId }
      : { acquired: false, instanceId };
      
  } catch (error) {
    console.error(`❌ Error acquiring lock ${lockId}:`, error.message);
    return { acquired: false, instanceId, error: error.message };
  }
};

const releaseJobLock = async (lockId, instanceId) => {
  try {
    await pool.query(
      `DELETE FROM public.job_locks WHERE lock_id = $1 AND instance_id = $2`,
      [lockId, instanceId]
    );
    console.log(`🔓 Instance ${instanceId} released lock ${lockId}`);
  } catch (error) {
    console.error(`⚠️ Could not release lock ${lockId}:`, error.message);
  }
};

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
    
      <h3 style="color:#0078D7;font-size:16px;margin-bottom:20px;">
            Plant: ${responsible.plant_name}
      </h3>
          
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
          INSERT INTO public.kpi_values_hist26 
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

    // 2️⃣ Fetch ALL historical KPI submissions for this responsible, ALL weeks
    const kpiRes = await pool.query(
      `
      SELECT DISTINCT ON (h.week, h.kpi_id)
             h.hist_id, h.kpi_values_id, h.new_value as value, h.week, 
             h.kpi_id, h.updated_at,
             k.indicator_title, k.indicator_sub_title, k.unit
      FROM public.kpi_values_hist26 h
      JOIN public."Kpi" k ON h.kpi_id = k.kpi_id
      WHERE h.responsible_id = $1
      ORDER BY h.week DESC, h.kpi_id ASC, h.updated_at DESC
      `,
      [responsible_id]
    );

    // 3️⃣ Group KPIs by week - FIX: Use Map to preserve order and handle duplicates properly
    const weekMap = new Map();
    kpiRes.rows.forEach(kpi => {
      if (!weekMap.has(kpi.week)) {
        weekMap.set(kpi.week, []);
      }
      weekMap.get(kpi.week).push(kpi);
    });

    // 4️⃣ Build Dashboard HTML
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

          .week-section { margin-bottom:30px; border:1px solid #e1e5e9; border-radius:8px; padding:20px; background:#fafbfc; }
          .week-title { color:#0078D7; font-size:20px; margin-bottom:15px; font-weight:600; border-bottom:2px solid #0078D7; padding-bottom:8px; }

          .kpi-card { background:#fff; border:1px solid #e1e5e9; border-radius:6px; padding:15px; margin-bottom:15px; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
          .kpi-title { font-weight:600; color:#333; margin-bottom:5px; }
          .kpi-subtitle { color:#666; font-size:13px; margin-bottom:10px; }
          .kpi-value { font-size:16px; font-weight:bold; color:#0078D7; }
          .kpi-unit { color:#888; font-size:12px; margin-top:5px; }
          .kpi-date { color:#999; font-size:11px; margin-top:3px; font-style:italic; }
          .no-data { color:#999; font-style:italic; }
          
          .summary { 
            background:#e7f3ff; 
            padding:15px; 
            border-radius:6px; 
            margin-bottom:25px;
            border-left:4px solid #0078D7;
          }
          .summary-text {
            margin:0;
            color:#333;
            font-size:14px;
          }
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

    // 5️⃣ Loop through WEEKS using Map
    if (weekMap.size === 0) {
      html += `<div class="no-data">No KPI data available yet.</div>`;
    } else {
      for (const [week, items] of weekMap) {
        html += `
          <div class="week-section">
            <div class="week-title">📅 Week ${week}</div>
        `;

        items.forEach(kpi => {
          const hasValue = kpi.value !== null && kpi.value !== undefined && kpi.value !== '';
          const submittedDate = kpi.updated_at ? new Date(kpi.updated_at).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '';
          
          html += `
            <div class="kpi-card">
              <div class="kpi-title">${kpi.indicator_title}</div>
              ${kpi.indicator_sub_title ? `<div class="kpi-subtitle">${kpi.indicator_sub_title}</div>` : ""}
              <div class="kpi-value ${!hasValue ? 'no-data' : ''}">${hasValue ? kpi.value : "Not filled yet"}</div>
              ${kpi.unit ? `<div class="kpi-unit">Unit: ${kpi.unit}</div>` : ""}
              ${submittedDate ? `<div class="kpi-date">Last updated: ${submittedDate}</div>` : ""}
            </div>
          `;
        });

        html += `</div>`;
      }
    }

    html += `
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).send(`<h2 style="color:red;">Error: ${err.message}</h2>`);
  }
});



app.get("/dashboard-history", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;

    const histRes = await pool.query(
      `
      SELECT h.hist_id, h.kpi_id, h.week, h.old_value, h.new_value, h.updated_at,
             k.indicator_title, k.indicator_sub_title, k.unit
      FROM public.kpi_values_hist26 h
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
cron.schedule(
  "30 08 * * *",
  async () => {
    const lockId = 'kpi_form_email_job';
    
    // Try to acquire lock
    const lock = await acquireJobLock(lockId, 15); // 15 minute TTL
    
    if (!lock.acquired) {
      console.log(`⏭️ Job ${lockId} already running in another instance, skipping.`);
      return;
    }
    
    console.log(`🔒 Instance ${lock.instanceId} acquired lock for ${lockId}`);
    
    try {
      const forcedWeek = "2026-Week02"; // or dynamically compute current week
      
      // ✅ Send only to responsibles who actually have KPI records for that week
      const resps = await pool.query(`
        SELECT DISTINCT r.responsible_id
        FROM public."Responsible" r
        JOIN public.kpi_values kv ON kv.responsible_id = r.responsible_id
        WHERE kv.week = $1
      `, [forcedWeek]);

      console.log(`📧 Sending KPI form emails to ${resps.rows.length} responsibles...`);
      
      for (let r of resps.rows) {
        await sendKPIEmail(r.responsible_id, forcedWeek);
      }

      console.log(`✅ KPI emails sent to ${resps.rows.length} responsibles`);
    } catch (err) {
      console.error("❌ Error sending scheduled emails:", err.message);
    } finally {
      await releaseJobLock(lockId, lock.instanceId);
    }
  },
  { scheduled: true, timezone: "Africa/Tunis" }
);

// ---------- Generate HTML/CSS Charts ----------
const generateVerticalBarChart = (chartData) => {
  const { title, subtitle, unit, data, weekLabels, currentWeek, stats } = chartData;

  // Ensure we have data
  if (!data || data.length === 0 || data.every(val => val <= 0)) {
    return `
      <div style="margin: 20px 0; background: white; border-radius: 8px; padding: 20px; border: 1px solid #e0e0e0;">
        <h3 style="margin: 0; color: #333; font-size: 16px; font-weight: 600;">${title}</h3>
        ${subtitle ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${subtitle}</p>` : ''}
        <p style="margin: 15px 0; color: #999; font-size: 14px;">No data available for chart display</p>
      </div>
    `;
  }

  // Find max value for scaling
  const maxValue = Math.max(...data.filter(val => val > 0)) * 1.1;
  const maxBarHeight = 150; // Maximum height in pixels

  return `
    <!-- Outlook-compatible Bar Chart -->
    <div style="margin: 20px 0; background: white; border-radius: 8px; padding: 20px; border: 1px solid #e0e0e0; font-family: Arial, sans-serif;">
      <!-- Chart Header -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0; color: #333; font-size: 16px; font-weight: 600;">${title}</h3>
        ${subtitle ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${subtitle}</p>` : ''}
        ${unit ? `<p style="margin: 5px 0 0 0; color: #888; font-size: 12px;">Unit: ${unit}</p>` : ''}
      </div>
      
      <!-- HTML Table Bar Chart -->
      <div style="margin: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <!-- Y-axis labels and bars -->
          <tr>
            <td width="40" valign="bottom" style="border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; padding-right: 10px; text-align: right;">
              <div style="height: ${maxBarHeight}px; position: relative;">
                ${[1, 0.75, 0.5, 0.25, 0].map((percent, i) => {
    const value = (percent * maxValue).toFixed(0);
    const top = (1 - percent) * maxBarHeight;
    return `
                    <div style="position: absolute; top: ${top}px; right: 0; transform: translateY(-50%); font-size: 10px; color: #666;">
                      ${value}
                    </div>
                  `;
  }).join('')}
              </div>
            </td>
            
            <!-- Bars -->
            <td valign="bottom" style="border-bottom: 1px solid #ccc; padding-left: 15px;">
              <table border="0" cellpadding="0" cellspacing="15" width="100%" style="border-collapse: separate;">
                <tr>
                  ${data.map((value, index) => {
    if (value <= 0) {
      return `
                        <td valign="bottom" align="center" style="width: ${100 / data.length}%;">
                          <div style="width: 30px; height: 5px; background-color: #f0f0f0; margin: 0 auto;"></div>
                          <div style="font-size: 11px; color: #999; margin-top: 8px; text-align: center;">
                            ${weekLabels[index] || `M${index + 1}`}
                          </div>
                          ${index === data.length - 1 ? `
                            <div style="font-size: 10px; color: #999; margin-top: 2px; text-align: center;">
                              (No data)
                            </div>
                          ` : ''}
                        </td>
                      `;
    }

    const barHeight = (value / maxValue) * maxBarHeight;
    const isCurrent = index === data.length - 1;
    const barColor = isCurrent ? '#4CAF50' : '#2196F3';

    return `
                      <td valign="bottom" align="center" style="width: ${100 / data.length}%;">
                        <!-- Bar container -->
                        <div style="position: relative; height: ${maxBarHeight}px;">
                          <!-- Bar -->
                          <div style="
                            position: absolute;
                            bottom: 0;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 30px;
                            height: ${barHeight}px;
                            background-color: ${barColor};
                            border-radius: 2px;
                          "></div>
                          
                          <!-- Value on top -->
                          <div style="
                            position: absolute;
                            bottom: ${barHeight}px;
                            left: 50%;
                            transform: translateX(-50%);
                            font-size: 11px;
                            font-weight: bold;
                            color: #333;
                            white-space: nowrap;
                            margin-bottom: 5px;
                          ">
                            ${value.toFixed(value >= 100 ? 0 : 2)}
                          </div>
                        </div>
                        
                        <!-- Month label -->
                        <div style="font-size: 11px; color: #666; margin-top: 8px; text-align: center;">
                          ${weekLabels[index] || `M${index + 1}`}
                        </div>
                        
                        <!-- Current indicator -->
                        ${isCurrent ? `
                          <div style="font-size: 10px; color: #4CAF50; font-weight: 600; margin-top: 2px; text-align: center;">
                            Current
                          </div>
                        ` : ''}
                      </td>
                    `;
  }).join('')}
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- X-axis -->
          <tr>
            <td style="height: 20px;"></td>
            <td></td>
          </tr>
        </table>
      </div>
      
      <!-- Stats Section - Updated to match your image -->
      <div style="background: #3880c7ff; border-radius: 6px; padding: 15px; margin-top: 20px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <tr>
            <!-- CURRENT VALUE -->
            <td width="25%" align="center" style="border-right: 1px solid #e0e0e0; padding: 10px;">
              <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                CURRENT VALUE
              </div>
              <div style="font-size: 20px; font-weight: 700; color: #4CAF50; margin-bottom: 3px;">
                ${stats.current}
              </div>
              <div style="font-size: 10px; color: #999;">
                ${currentWeek.replace('2025-Week', 'Week ') || 'Current'}
              </div>
            </td>
            
            <!-- AVERAGE -->
         <td width="25%" align="center" style="border-right: 1px solid #ad9f9cff; padding: 10px; background: #764ba2; border-radius: 12px;">
           <div style="font-size: 11px; color: rgba(255, 255, 255, 0.85); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; font-weight: 600;">
            AVERAGE
             </div>
          <div style="font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 3px;">
             ${stats.average}
             </div>
           <div style="font-size: 10px; color: rgba(255, 255, 255, 0.7);">
              ${stats.dataPoints || data.length} period${stats.dataPoints !== 1 ? 's' : ''}
            </div>
           </td>
            
            <!-- MAXIMUM -->
            <td width="25%" align="center" style="border-right: 1px solid #e0e0e0; padding: 10px;">
              <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                MAXIMUM
              </div>
              <div style="font-size: 20px; font-weight: 700; color: #FF9800; margin-bottom: 3px;">
                ${stats.max}
              </div>
              <div style="font-size: 10px; color: #999;">
                Peak Performance
              </div>
            </td>
            
            <!-- TREND -->
            <td width="25%" align="center" style="padding: 10px;">
              <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">
                TREND
              </div>
              <div style="font-size: 20px; font-weight: 700; color: ${stats.trend.startsWith('-') ? '#F44336' : '#4CAF50'}; margin-bottom: 3px;">
                ${stats.trend}
              </div>
              <div style="font-size: 10px; color: #999;">
                Week over week
              </div>
            </td>
          </tr>
        </table>
      </div>
      
      <!-- Legend -->
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="20" style="border-collapse: collapse; margin: 0 auto;">
                <tr>
                  <td>
                    <table border="0" cellpadding="0" cellspacing="5" style="border-collapse: collapse;">
                      <tr>
                        <td width="12" height="12" style="background-color: #2196F3; border-radius: 2px;"></td>
                        <td style="font-size: 11px; color: #666; padding-left: 5px;">Previous Periods</td>
                      </tr>
                    </table>
                  </td>
                  <td>
                    <table border="0" cellpadding="0" cellspacing="5" style="border-collapse: collapse;">
                      <tr>
                        <td width="12" height="12" style="background-color: #4CAF50; border-radius: 2px;"></td>
                        <td style="font-size: 11px; color: #666; padding-left: 5px;">Current Period</td>
                      </tr>
                    </table>
                  </td>
                  <td>
                    <table border="0" cellpadding="0" cellspacing="5" style="border-collapse: collapse;">
                      <tr>
                        <td width="12" height="12" style="background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 2px;"></td>
                        <td style="font-size: 11px; color: #666; padding-left: 5px;">No Data</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;
};

const generateWeeklyReportData = async (responsibleId, reportWeek) => {
  try {
    // Get historical data from kpi_values_hist26 table
    const histRes = await pool.query(
      `
      WITH KpiHistory AS (
        SELECT 
          h.kpi_id,
          h.week,
          h.new_value,
          h.updated_at,
          k.indicator_title,
          k.indicator_sub_title,
          k.unit,
          ROW_NUMBER() OVER (PARTITION BY h.kpi_id, h.week ORDER BY h.updated_at DESC) as rn
        FROM public.kpi_values_hist26 h
        JOIN public."Kpi" k ON h.kpi_id = k.kpi_id
        WHERE h.responsible_id = $1
          AND h.new_value IS NOT NULL
          AND h.new_value != ''
          AND h.new_value != '0'
      )
      SELECT * FROM KpiHistory 
      WHERE rn = 1
      ORDER BY kpi_id, week ASC
      `,
      [responsibleId]
    );

    if (!histRes.rows.length) {
      console.log(`No historical data found for responsible ${responsibleId}`);
      return null;
    }

    // Group by KPI
    const kpisData = {};
    const weekLabelsSet = new Set();

    histRes.rows.forEach(row => {
      const kpiId = row.kpi_id;

      if (!kpisData[kpiId]) {
        kpisData[kpiId] = {
          title: row.indicator_title,
          subtitle: row.indicator_sub_title || '',
          unit: row.unit || '',
          weeklyData: new Map() // Use Map to preserve insertion order
        };
      }

      // Parse value
      const value = parseFloat(row.new_value);
      if (!isNaN(value) && value > 0) {
        kpisData[kpiId].weeklyData.set(row.week, value);
        weekLabelsSet.add(row.week);
      }
    });

    // Convert week labels set to sorted array
    const weekLabels = Array.from(weekLabelsSet).sort((a, b) => {
      // Extract year and week numbers for sorting
      const [yearA, weekA] = a.includes('Week')
        ? [parseInt(a.split('-Week')[0]), parseInt(a.split('-Week')[1])]
        : [0, parseInt(a.replace('Week', ''))];

      const [yearB, weekB] = b.includes('Week')
        ? [parseInt(b.split('-Week')[0]), parseInt(b.split('-Week')[1])]
        : [0, parseInt(b.replace('Week', ''))];

      if (yearA !== yearB) return yearA - yearB;
      return weekA - weekB;
    });

    // If no week labels found, return null
    if (weekLabels.length === 0) {
      console.log(`No valid week data found for responsible ${responsibleId}`);
      return null;
    }

    const charts = [];

    // Process each KPI
    for (const [kpiId, kpiData] of Object.entries(kpisData)) {
      // Prepare data array for all weeks
      const dataPoints = [];

      weekLabels.forEach(week => {
        if (kpiData.weeklyData.has(week)) {
          dataPoints.push(kpiData.weeklyData.get(week));
        } else {
          dataPoints.push(0);
        }
      });

      // Skip if all values are zero
      const hasData = dataPoints.some(val => val > 0);
      if (!hasData) {
        continue;
      }

      // Find current week (latest with data)
      let currentWeek = null;
      let currentValue = 0;
      let previousValue = 0;

      // Go backwards to find the latest non-zero value
      for (let i = weekLabels.length - 1; i >= 0; i--) {
        if (dataPoints[i] > 0) {
          currentWeek = weekLabels[i];
          currentValue = dataPoints[i];

          // Find previous non-zero value for trend calculation
          for (let j = i - 1; j >= 0; j--) {
            if (dataPoints[j] > 0) {
              previousValue = dataPoints[j];
              break;
            }
          }
          break;
        }
      }

      if (!currentWeek) {
        continue; // No valid current week found
      }

      // Calculate statistics
      const nonZeroData = dataPoints.filter(val => val > 0);

      if (nonZeroData.length === 0) {
        continue;
      }

      const avg = nonZeroData.reduce((sum, val) => sum + val, 0) / nonZeroData.length;
      const max = Math.max(...nonZeroData);
      const min = Math.min(...nonZeroData);

      // Calculate trend (week-over-week change)
      let trend = '0.0%';
      if (previousValue > 0 && currentValue > 0) {
        const trendValue = ((currentValue - previousValue) / previousValue) * 100;
        trend = (trendValue >= 0 ? '+' : '') + trendValue.toFixed(1) + '%';
      }

      // Format week labels for display (simplify if too many)
      const displayWeekLabels = weekLabels.map(week => {
        if (week.includes('2025-Week')) {
          return `W${week.split('-Week')[1]}`;
        } else if (week.includes('Week')) {
          return `W${week.replace('Week', '')}`;
        }
        return week;
      });

      charts.push({
        kpiId: kpiId,
        title: kpiData.title,
        subtitle: kpiData.subtitle,
        unit: kpiData.unit,
        data: dataPoints,
        weekLabels: displayWeekLabels,
        fullWeeks: weekLabels,
        currentWeek: currentWeek,
        stats: {
          current: currentValue.toFixed(kpiData.unit === '%' ? 1 : 2),
          previous: previousValue > 0 ? previousValue.toFixed(kpiData.unit === '%' ? 1 : 2) : 'N/A',
          average: avg.toFixed(kpiData.unit === '%' ? 1 : 2),
          max: max.toFixed(kpiData.unit === '%' ? 1 : 2),
          min: min > 0 ? min.toFixed(kpiData.unit === '%' ? 1 : 2) : 'N/A',
          trend: trend,
          dataPoints: nonZeroData.length,
          totalWeeks: weekLabels.length
        }
      });
    }

    console.log(`Generated ${charts.length} KPI charts for responsible ${responsibleId}`);
    return charts;

  } catch (error) {
    console.error('Error generating weekly report data:', error);
    return null;
  }
};

const generateWeeklyReportEmail = async (responsibleId, reportWeek) => {
  try {
    // Get responsible info
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
    if (!responsible) throw new Error(`Responsible ${responsibleId} not found`);

    console.log(`Generating report for ${responsible.name}, week: ${reportWeek}`);

    // Generate charts data with multiple weeks
    const chartsData = await generateWeeklyReportData(responsibleId, reportWeek);

    let chartsHtml = '';
    if (chartsData && chartsData.length > 0) {
      chartsData.forEach(chart => {
        chartsHtml += generateVerticalBarChart(chart);
      });
    } else {
      // Check if there's any data at all
      const checkRes = await pool.query(
        `SELECT COUNT(*) FROM public.kpi_values_hist26 WHERE responsible_id = $1`,
        [responsibleId]
      );

      if (parseInt(checkRes.rows[0].count) === 0) {
        chartsHtml = `
          <div style="text-align: center; padding: 60px; background: #f8f9fa; border-radius: 12px; margin-bottom: 20px; border: 2px dashed #dee2e6;">
            <div style="font-size: 48px; color: #adb5bd; margin-bottom: 20px;">📊</div>
            <p style="color: #495057; margin: 0; font-size: 18px; font-weight: 500;">No KPI Data Available</p>
            <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 14px;">
              Start filling your KPI forms to track your performance over time.
            </p>
            <a href="http://localhost:5000/form?responsible_id=${responsible.responsible_id}&week=${reportWeek}"
               style="display: inline-block; margin-top: 20px; padding: 12px 24px; 
                      background: #28a745; color: white; text-decoration: none; 
                      border-radius: 6px; font-weight: 600; font-size: 14px;">
              ✏️ Start Tracking KPIs
            </a>
          </div>
        `;
      } else {
        chartsHtml = `
          <div style="text-align: center; padding: 60px; background: #f8f9fa; border-radius: 12px; margin-bottom: 20px; border: 2px dashed #dee2e6;">
            <div style="font-size: 48px; color: #adb5bd; margin-bottom: 20px;">📈</div>
            <p style="color: #495057; margin: 0; font-size: 18px; font-weight: 500;">Insufficient Data</p>
            <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 14px;">
              Fill your KPI form for week ${reportWeek} to generate performance charts.
            </p>
          </div>
        `;
      }
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KPI Performance Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f4f6f9; line-height: 1.4;">
  <!-- Simple container for Outlook -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #f4f6f9;">
    <tr>
      <td align="center" style="padding: 20px;">
        <!-- Main content table -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: #0078D7; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 300;">📊 KPI Performance Report</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                ${reportWeek.replace('2025-Week', 'Week ')} • Monthly View
              </p>
            </td>
          </tr>
          
          <!-- Responsible Info -->
          <tr>
            <td style="padding: 25px 30px; border-bottom: 1px solid #e9ecef;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="33%" align="center" style="padding: 10px;">
                    <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Responsible</div>
                    <div style="font-size: 16px; font-weight: 600; color: #333;">${responsible.name}</div>
                  </td>
                  <td width="34%" align="center" style="padding: 10px; border-left: 1px solid #e9ecef; border-right: 1px solid #e9ecef;">
                    <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Plant</div>
                    <div style="font-size: 16px; font-weight: 600; color: #333;">${responsible.plant_name}</div>
                  </td>
                  <td width="33%" align="center" style="padding: 10px;">
                    <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Department</div>
                    <div style="font-size: 16px; font-weight: 600; color: #333;">${responsible.department_name}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Charts Section -->
          <tr>
            <td style="padding: 30px;">
              ${chartsHtml}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background: #f8f9fa; border-top: 1px solid #e9ecef; border-radius: 0 0 8px 8px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="color: #666; font-size: 12px;">
                    <p style="margin: 0 0 5px 0;">
                      <strong>AVOCarbon KPI System</strong> | Automated Performance Report
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #999;">
                      Generated on ${new Date().toLocaleDateString()} • 
                      Contact: <a href="mailto:administration.STS@avocarbon.com" style="color: #0078D7; text-decoration: none;">administration.STS@avocarbon.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // Send email
    const transporter = createTransporter();
    const mailOptions = {
      from: '"AVOCarbon KPI System" <administration.STS@avocarbon.com>',
      to: responsible.email,
      subject: `📊 KPI Performance Trends - ${reportWeek} | ${responsible.name}`,
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Weekly report sent to ${responsible.email} for week ${reportWeek}`);

    return info;

  } catch (error) {
    console.error(`❌ Failed to send weekly report to responsible ID ${responsibleId}:`, error.message);
    throw error;
  }
};

// ---------- Schedule Weekly Reports  to send it for each responsible  ----------
// ---------- Schedule Weekly Reports ----------
// cron.schedule(
//   "43 11 * * *", // Every Friday at 9:00 AM
//   async () => {
//     const lockId = 'weekly_report_job';
    
//     // Try to acquire lock
//     const lock = await acquireJobLock(lockId, 60); // 60 minute TTL (longer job)
    
//     if (!lock.acquired) {
//       console.log(`⏭️ Job ${lockId} already running in another instance, skipping.`);
//       return;
//     }
    
//     console.log(`🔒 Instance ${lock.instanceId} acquired lock for ${lockId}`);
    
//     try {
//       // Calculate current week
//       const now = new Date();
//       const year = now.getFullYear();

//       // Get week number function
//       const getWeekNumber = (date) => {
//         const d = new Date(date);
//         d.setHours(0, 0, 0, 0);
//         d.setDate(d.getDate() + 4 - (d.getDay() || 7));
//         const yearStart = new Date(d.getFullYear(), 0, 1);
//         const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
//         return weekNo;
//       };

//       const weekNumber = getWeekNumber(now);
//       const currentWeek = `${year}-Week${weekNumber}`;
//       const previousWeek = `${year}-Week${weekNumber - 1}`;

//       console.log(`Current week: ${currentWeek}, Previous week: ${previousWeek}`);

//       // Get all responsibles who have ANY KPI history data
//       const resps = await pool.query(`
//         SELECT DISTINCT r.responsible_id, r.email, r.name
//         FROM public."Responsible" r
//         JOIN public.kpi_values_hist26 h ON r.responsible_id = h.responsible_id
//         WHERE r.email IS NOT NULL
//           AND r.email != ''
//         GROUP BY r.responsible_id, r.email, r.name
//         HAVING COUNT(h.hist_id) > 0
//         ORDER BY r.responsible_id
//       `);

//       console.log(`📊 Sending weekly reports for week ${previousWeek} to ${resps.rows.length} responsibles...`);

//       const results = [];
//       for (const [index, resp] of resps.rows.entries()) {
//         try {
//           await generateWeeklyReportEmail(resp.responsible_id, previousWeek);
//           console.log(`  [${index + 1}/${resps.rows.length}] Sent to ${resp.name} (${resp.email})`);
//           results.push({
//             responsible_id: resp.responsible_id,
//             name: resp.name,
//             status: 'success'
//           });

//           // Add delay to avoid rate limiting
//           await new Promise(resolve => setTimeout(resolve, 1500));
//         } catch (err) {
//           console.error(`  [${index + 1}/${resps.rows.length}] Failed for ${resp.name}:`, err.message);
//           results.push({
//             responsible_id: resp.responsible_id,
//             name: resp.name,
//             status: 'error',
//             message: err.message
//           });
//         }
//       }

//       const succeeded = results.filter(r => r.status === 'success').length;
//       console.log(`✅ Weekly reports completed. Sent: ${succeeded}/${results.length}`);

//     } catch (error) {
//       console.error("❌ Error in weekly report cron job:", error.message);
//     } finally {
//       await releaseJobLock(lockId, lock.instanceId);
//     }
//   },
//   {
//     scheduled: true,
//     timezone: "Africa/Tunis"
//   }
// );



// ========== UPDATED QUERY TO GET WEEKLY DATA ==========
const getDepartmentKPIReport = async (plantId, week) => {
  try {
    // 1. Get plant and manager info
    const plantRes = await pool.query(
      `
      SELECT p.plant_id, p.name AS plant_name, p.manager, p.manager_email
      FROM public."Plant" p
      WHERE p.plant_id = $1 AND p.manager_email IS NOT NULL
      `,
      [plantId]
    );

    const plant = plantRes.rows[0];
    if (!plant || !plant.manager_email) {
      return null;
    }

    // 2. Get KPIs - Use indicator_title for grouping
    const kpiRes = await pool.query(
      `
      WITH LatestKPIValues AS (
        SELECT 
          h.kpi_id,
          h.responsible_id,
          r.name AS responsible_name,
          h.week,
          h.new_value,
          h.updated_at,
          r.department_id,
          d.name AS department_name,
          k.indicator_title,
          k.indicator_sub_title,
          k.unit,
          ROW_NUMBER() OVER (
            PARTITION BY h.kpi_id, h.responsible_id, h.week 
            ORDER BY h.updated_at DESC
          ) as rn
        FROM public.kpi_values_hist26 h
        JOIN public."Responsible" r ON h.responsible_id = r.responsible_id
        JOIN public."Department" d ON r.department_id = d.department_id
        JOIN public."Kpi" k ON h.kpi_id = k.kpi_id
        WHERE r.plant_id = $1 
          AND h.week = $2
          AND h.new_value IS NOT NULL
          AND h.new_value != ''
          AND h.new_value ~ '^[0-9.]+$'
      )
      SELECT * FROM LatestKPIValues WHERE rn = 1
      ORDER BY indicator_title
      `,
      [plantId, week]
    );

    if (!kpiRes.rows.length) {
      console.log(`No KPI data found for plant ${plantId} week ${week}`);
      return null;
    }

    // 3. Get WEEKLY TREND DATA for ALL KPIs (last 12 weeks)
    const weeklyTrendRes = await pool.query(
      `
      WITH WeeklyKPIData AS (
        SELECT 
          k.kpi_id,
          k.indicator_title,
          k.indicator_sub_title,
          k.unit,
          h.week,
          AVG(CAST(h.new_value AS NUMERIC)) as avg_value,
          MIN(CAST(h.new_value AS NUMERIC)) as min_value,
          MAX(CAST(h.new_value AS NUMERIC)) as max_value,
          COUNT(*) as data_points,
          -- Extract week number for sorting
          CAST(SPLIT_PART(h.week, 'Week', 2) AS INTEGER) as week_num
        FROM public.kpi_values_hist26 h
        JOIN public."Kpi" k ON h.kpi_id = k.kpi_id
        JOIN public."Responsible" r ON h.responsible_id = r.responsible_id
        WHERE r.plant_id = $1 
          AND h.new_value IS NOT NULL
          AND h.new_value != ''
          AND h.new_value ~ '^[0-9.]+$'
          AND h.week LIKE '2025-Week%'
        GROUP BY k.kpi_id, k.indicator_title, k.indicator_sub_title, k.unit, h.week
      )
      SELECT * FROM WeeklyKPIData
      ORDER BY kpi_id, week_num DESC
      LIMIT 500
      `,
      [plantId]
    );

    // Helper function to extract department from indicator_title
    const extractDepartmentFromTitle = (indicatorTitle) => {
      if (!indicatorTitle) return 'Other';

      // Extract text after "Actual - "
      if (indicatorTitle.includes('Actual - ')) {
        const extracted = indicatorTitle.split('Actual - ')[1];

        // Further processing for specific cases
        if (extracted.includes('/')) {
          // For "VOH / FOH expenses (excluding salaries)", take first part
          return extracted.split('/')[0].trim();
        } else if (extracted.includes('(')) {
          // Remove parentheses content
          return extracted.split('(')[0].trim();
        }
        return extracted.trim();
      }

      return indicatorTitle;
    };

    // 4. Organize data by department (extracted from indicator_title)
    const kpisByDepartment = {};
    const weeklyDataByKPI = {};

    // First, organize weekly trend data
    weeklyTrendRes.rows.forEach(row => {
      const kpiKey = `${row.kpi_id}_${row.indicator_title}`;
      // Extract department from indicator_title
      const derivedDept = extractDepartmentFromTitle(row.indicator_title);

      if (!weeklyDataByKPI[kpiKey]) {
        weeklyDataByKPI[kpiKey] = {
          kpi_id: row.kpi_id,
          title: row.indicator_title,
          subtitle: row.indicator_sub_title || '',
          unit: row.unit || '',
          department: derivedDept, // Use extracted department
          weeks: [],
          values: []
        };
      }

      weeklyDataByKPI[kpiKey].weeks.push(row.week);
      weeklyDataByKPI[kpiKey].values.push(parseFloat(row.avg_value));
    });

    // Then, organize current week data by extracted department
    kpiRes.rows.forEach(row => {
      // Extract department from indicator_title
      const derivedDepartment = extractDepartmentFromTitle(row.indicator_title);
      const kpiKey = `${row.kpi_id}_${row.indicator_title}`;

      if (!kpisByDepartment[derivedDepartment]) {
        kpisByDepartment[derivedDepartment] = [];
      }

      let existingKpi = kpisByDepartment[derivedDepartment].find(k =>
        k.id === row.kpi_id && k.title === row.indicator_title
      );

      if (!existingKpi) {
        const value = parseFloat(row.new_value);

        existingKpi = {
          id: row.kpi_id,
          title: row.indicator_title,
          subtitle: row.indicator_sub_title || '',
          unit: row.unit || '',
          department: derivedDepartment, // Use extracted department
          originalDepartment: row.department_name, // Keep original for reference
          currentValue: value,
          weeklyData: weeklyDataByKPI[kpiKey] || { weeks: [], values: [] },
          lastUpdated: row.updated_at,
          responsible: row.responsible_name || ''
        };

        kpisByDepartment[derivedDepartment].push(existingKpi);
      }
    });

    // Sort departments alphabetically
    const sortedDepartments = {};
    Object.keys(kpisByDepartment)
      .sort()
      .forEach(dept => {
        sortedDepartments[dept] = kpisByDepartment[dept];
      });

    return {
      plant: plant,
      week: week,
      kpisByDepartment: sortedDepartments,
      stats: {
        totalDepartments: Object.keys(sortedDepartments).length,
        totalKPIs: Object.values(sortedDepartments).reduce((sum, kpis) => sum + kpis.length, 0),
        totalValues: kpiRes.rows.length
      }
    };
  } catch (error) {
    console.error(`Error getting KPI report for plant ${plantId}:`, error.message);
    return null;
  }
};

// ========== UPDATED CHART FUNCTION WITH WEEKLY BAR CHART ==========
// ========== UPDATED CHART FUNCTION WITH WEEKLY BAR CHART ==========
const createIndividualKPIChart = (kpi) => {
  const color = getDepartmentColor(kpi.department);
  const currentValue = kpi.currentValue || 0;
  // === SIMPLE & VISUAL TREND LOGIC (exactly what you asked) ===
  let trendArrow = '→';
  let trendColor = '#dfc54dff'; // orange for stable
  let trendText = 'No change';

  const values = kpi.weeklyData?.values || [];

  if (values.length >= 2) {
    const current = values[values.length - 1];
    const previous = values[values.length - 2];
    const change = current - previous;
    const percentChange = previous !== 0 ? ((change / previous) * 100) : 0;

    if (Math.abs(change) < 0.001) {
      // Exactly the same or negligible change
      trendArrow = '→';
      trendColor = '#fd7e14'; // orange
      trendText = 'No change';
    } else if (change < 0) {
      // Value INCREASED → GREEN
      trendArrow = '↗';
      trendColor = '#28a745';
      trendText = `+${Math.abs(percentChange).toFixed(1)}%`;
    } else {
      // Value DECREASED → RED
      trendArrow = ' ↘';
      trendColor = '#dc3545';
      trendText = `${percentChange.toFixed(1)}%`;
    }
  }

  // Calculate average value
  let averageValue = 0;
  if (values.length > 0) {
    const sum = values.reduce((acc, val) => acc + val, 0);
    averageValue = sum / values.length;
  }

  // Format average value
  let formattedAverage = averageValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  // Apply unit formatting to average
  if (kpi.unit) {
    if (kpi.unit.includes('%')) {
      formattedAverage = `${averageValue.toFixed(1)}%`;
    } else if (kpi.unit.toLowerCase().includes('cur')) {
      formattedAverage = `${(averageValue / 1000).toFixed(0)}K`;
    }
  }

  // Prepare weekly data (last 12 weeks, reversed for chronological order)
  const weeklyData = kpi.weeklyData || { weeks: [], values: [] };
  const last12Weeks = weeklyData.weeks.slice(0, 12).reverse();
  const last12Values = weeklyData.values.slice(0, 12).reverse();

  // Calculate max value for chart scaling
  const maxValue = Math.max(...last12Values, currentValue * 1.2, 100);

  // Calculate Y-axis values for grid lines
  const yAxisSteps = 5;
  const yAxisMax = Math.ceil(maxValue / 1000) * 1000; // Round up to nearest thousand
  const yAxisInterval = yAxisMax / yAxisSteps;

  // Generate vertical bar chart with proper axes - OUTLOOK COMPATIBLE
  const bars = last12Values.map((value, index) => {
    const heightPercent = (value / yAxisMax) * 100;
    const barHeightPx = Math.round((heightPercent / 100) * 160); // Convert to pixels
    const weekLabel = last12Weeks[index].replace('2025-Week', '');

    return `
      <td align="center" valign="bottom" style="padding: 0 2px; vertical-align: bottom; height: 180px;">
        <!-- Value label on top -->
        <div style="font-size: 9px; font-weight: bold; color: #2c3e50; margin-bottom: 3px;">
          ${value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value.toFixed(0)}
        </div>
        
        <!-- Bar -->
        <div style="
          width: 100%;
          min-width: 20px;
          max-width: 40px;
          height: ${Math.max(barHeightPx, 3)}px;
          background-color: ${color};
          border-radius: 3px 3px 0 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        "></div>
        
        <!-- Week label -->
        <div style="font-size: 10px; color: #495057; font-weight: 600; margin-top: 6px;">
            W${weekLabel}/25
        </div>
      </td>
    `;
  }).join('');

  // Generate Y-axis labels - OUTLOOK COMPATIBLE
  const yAxisLabels = [];
  for (let i = yAxisSteps; i >= 0; i--) {
    const value = (yAxisInterval * i);
    const displayValue = value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toFixed(0);
    yAxisLabels.push(`
      <tr>
        <td style="
          font-size: 9px;
          color: #6c757d;
          font-weight: 500;
          text-align: right;
          padding-right: 8px;
          height: ${160 / yAxisSteps}px;
          vertical-align: top;
        ">${displayValue}</td>
      </tr>
    `);
  }

  return `
   <div style="
  position: relative;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px;
  height: 100%;
  display: block;
">

  <!-- Use table for better email compatibility -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
<tr>
  <td align="left" valign="top" style="
    font-size: 11px;
    font-weight: 700;
    color: #2c3e50;
    line-height: 1.3;
    padding-right: 10px;
    position: relative;
    width: 100%;
  ">
    <!-- Main Content Container -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <!-- Left: Subtitle -->
        <td align="left" valign="middle" style="padding-right: 8px;">
          <span style="display: inline-block; vertical-align: middle;">
            ${kpi.subtitle}
          </span>
        </td>
        
        <!-- Middle: Responsible with Icon -->
        <td align="center" valign="middle" style="
          padding: 0 8px;
          white-space: nowrap;
        ">
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #f8fafc;
            padding: 3px 8px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          ">
            <!-- Responsible Icon -->
            <svg width="10" height="10" viewBox="0 0 16 16" style="
              fill: #64748b;
              flex-shrink: 0;
            ">
              <path d="M8 8c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span style="
              font-size: 10px;
              color: #475569;
              font-weight: 600;
              white-space: nowrap;
            ">
              ${kpi.responsible}
            </span>
          </div>

        </td>
        
        <!-- Right: Arrow Indicator -->
        <td align="right" valign="middle" width="28" style="padding-left: 8px;">
          <div style="
            width: 26px;
            height: 26px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            background: ${trendColor};
            color: white;
            font-size: 16px;
            font-weight: 900;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            ${trendArrow}
          </div>
        </td>
      </tr>
      
      <!-- Second Row: Average Value -->
      <tr>
      <td colspan="3" align="center" style="padding-top: 12px;">
       <table border="0" cellpadding="0" cellspacing="0" align="center" style="
      background: #764ba2;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
       ">
      <tr>
        <td style="
          font-size: 10px;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 8px 8px 20px;
        ">
          Average:
        </td>
        <td style="
          font-size: 18px;
          color: white;
          font-weight: 700;
          letter-spacing: -0.5px;
          padding: 8px 20px 8px 8px;
        ">
          ${formattedAverage}
        </td>
      </tr>
      </table>
       </td>
       </tr>
       </table>
       </td>
       </tr>
      
     </table>

     <!-- Chart Area -->
    <div style="
    height: calc(100% - 50px);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
      ">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
       ">
      <tr>
        <td style="padding: 15px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 40px; vertical-align: top;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="height: 180px;">
                  ${yAxisLabels.join('')}
                </table>
              </td>
              <td valign="bottom" style="vertical-align: bottom; position: relative;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="height: 180px;">
                  <tr style="vertical-align: bottom;">
                    ${bars || '<td style="text-align: center; color: #6c757d; font-size: 11px; padding: 60px 0;">No weekly data</td>'}
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</div>
  `;
};

// ========== UPDATED HTML GENERATION ==========
const generateManagerReportHtml = (reportData) => {
  const { plant, week, kpisByDepartment, stats } = reportData;

  // Create KPI sections by department
  let kpiSections = '';

  // Get departments sorted alphabetically
  const departments = Object.keys(kpisByDepartment).sort();

  departments.forEach(department => {
    const kpis = kpisByDepartment[department];
    if (kpis.length === 0) return;

    const color = getDepartmentColor(department);

    kpiSections += `
      <!-- Department Section -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 40px;">
        <tr>
          <td>
            <!-- Department Header -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 3px solid ${color};
            ">
              <tr>
                <td style="padding: 5px 0;">
                  <table border="0" cellpadding="0" cellspacing="0">
                 <tr>
  <td style="padding: 5px 0;">
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="
          width: 21px;
          height: 14px;
          background: ${color};
          border-radius: 50%;
        "></td>
        <td width="10" style="width: 10px;"></td> <!-- Spacer cell -->
        <td style="
          font-size: 20px;
          font-weight: 700;
          color: #2c3e50;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding-right: 10px;
             ">${department}</td>
             <td style="
             font-size: 12px;
             color: #6c757d;
              background: #f8f9fa;
              padding: 5px 14px;
               border-radius: 12px;
              font-weight: 600;
              ">${kpis.length} KPIs</td>
               </tr>
              </table>
                </td>
                 </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- KPI Cards Grid: 3 per row using table -->
            <table border="0" cellpadding="10" cellspacing="0" width="100%">
              ${createKPIRows(kpis)}
            </table>
          </td>
        </tr>
      </table>
    `;
  });

  // Helper function to create KPI rows with 3 cards each
  function createKPIRows(kpis) {
    let rows = '';
    for (let i = 0; i < kpis.length; i += 3) {
      const rowKPIs = kpis.slice(i, i + 3);
      rows += '<tr>';

      rowKPIs.forEach(kpi => {
        rows += `<td width="33%" valign="top" style="padding: 10px;">${createIndividualKPIChart(kpi)}</td>`;
      });

      // Fill empty cells if less than 3 KPIs in row
      const emptyCells = 3 - rowKPIs.length;
      for (let j = 0; j < emptyCells; j++) {
        rows += '<td width="33%" style="padding: 10px;"></td>';
      }

      rows += '</tr>';
    }
    return rows;
  }

  // Return complete HTML (ONCE - NOT DUPLICATED)
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plant Weekly KPI Dashboard - ${plant.plant_name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', Arial, sans-serif;
      background: #f8f9fa;
    }
    
    /* Responsive grid for smaller screens */
    @media (max-width: 1200px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }
    
    @media (max-width: 768px) {
      .kpi-grid {
        grid-template-columns: 1fr !important;
      }
    }
  </style>
</head>
<body>
  <div style="padding: 30px 20px; max-width: 1400px; margin: 0 auto;">
    <!-- Header -->
    <div style="
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      margin-bottom: 30px;
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
      ">
        <div>
          <h1 style="
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 800;
            color: #2c3e50;
            letter-spacing: -0.5px;
          ">
            📊 PLANT WEEKLY KPI DASHBOARD
          </h1>
          <div style="font-size: 14px; color: #6c757d;">
            Plant: <strong style="color: #495057;">${plant.plant_name}</strong> • 
            Week: <strong style="color: #495057;">${week.replace('2025-Week', 'W')}</strong> • 
            Manager: <strong style="color: #495057;">${plant.manager || 'N/A'}</strong>
          </div>
        </div>
        
        <div style="text-align: right;">
          <div style="font-size: 13px; color: #6c757d; margin-bottom: 5px;">Updated</div>
          <div style="font-size: 14px; font-weight: 600; color: #495057;">
            ${new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
          </div>
        </div>
      </div>
      
      <!-- Summary Stats -->
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
      ">
        <div style="text-align: center;">
          <div style="
            font-size: 28px;
            font-weight: 800;
            color: #0078D7;
            margin-bottom: 5px;
          ">${stats.totalDepartments}</div>
          <div style="font-size: 12px; color: #6c757d; font-weight: 500;">Departments</div>
        </div>
        
        <div style="text-align: center;">
          <div style="
            font-size: 28px;
            font-weight: 800;
            color: #28a745;
            margin-bottom: 5px;
          ">${stats.totalKPIs}</div>
          <div style="font-size: 12px; color: #6c757d; font-weight: 500;">Total KPIs</div>
        </div>
        
     
        
        <div style="text-align: center;">
          <div style="
            font-size: 28px;
            font-weight: 800;
            color: #6f42c1;
            margin-bottom: 5px;
          ">${week.replace('2025-Week', 'W')}</div>
          <div style="font-size: 12px; color: #6c757d; font-weight: 500;">Current Week</div>
        </div>
      </div>
    </div>
    
    <!-- KPI Sections by Department -->
    <div style="
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    ">
      ${kpiSections || '<div style="text-align: center; padding: 60px; color: #6c757d;">No KPI data available</div>'}
    </div>
    
    <!-- Footer -->
    <div style="
      background: #2c3e50;
      color: white;
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      margin-top: 30px;
    ">
      <div style="margin-bottom: 20px;">
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">
          AVOCarbon Plant Analytics
        </div>
        <div style="font-size: 13px; opacity: 0.8;">
          Weekly KPI Performance Monitoring
        </div>
      </div>
      
      <div style="
        display: flex;
        justify-content: center;
        gap: 30px;
        flex-wrap: wrap;
        border-top: 1px solid rgba(255,255,255,0.1);
        padding-top: 20px;
      ">
        <div>
          <div style="font-size: 11px; opacity: 0.6; margin-bottom: 5px;">Contact</div>
          <div style="font-size: 13px;">
            <a href="mailto:${plant.manager_email}" 
               style="color: #4facfe; text-decoration: none;">${plant.manager_email}</a>
          </div>
        </div>
        
        <div>
          <div style="font-size: 11px; opacity: 0.6; margin-bottom: 5px;">Week</div>
          <div style="font-size: 13px; font-weight: 500;">
            ${week.replace('2025-Week', 'Week ')}
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Helper function for department colors (unchanged)
const getDepartmentColor = (departmentName) => {
  // First, handle the extracted department names
  if (departmentName.includes('Sales')) return '#667eea'; // Blue
  if (departmentName.includes('Production')) return '#4facfe'; // Light Blue
  if (departmentName.includes('Quality')) return '#43e97b'; // Green
  if (departmentName.includes('VOH')) return '#909d6fff'; // Pink
  if (departmentName.includes('Engineering')) return '#36a07bff'; // Pink
  if (departmentName.includes('Human resources')) return '#78d69aff'; // Pink
  if (departmentName.includes('Stocks')) return '#6a772aff'; // Pink
  if (departmentName.includes('AR/AP')) return '#96ce25ff'; // Pink
  if (departmentName.includes('Cash')) return '#54591bff'; // Pink
  // Fallback to original mapping
  const colorMap = {
    'Production': '#667eea',
    'Quality': '#f093fb',
    'Maintenance': '#4facfe',
    'Safety': '#43e97b',
    'Operations': '#fa709a',
    'Engineering': '#30cfd0',
    'Supply-chain': '#f6d365',
    'Administration': '#a8edea',
    'Finance': '#f093fb',
    'HR': '#4facfe',
    'IT': '#667eea',
    'Sales': '#43e97b',
    'Other': '#6c757d'
  };

  return colorMap[departmentName] || '#6c757d';
};
// Helper function (unchanged)
const getPreviousWeek = (currentWeek) => {
  const [yearStr, weekStr] = currentWeek.split('-Week');
  let year = parseInt(yearStr);
  let weekNumber = parseInt(weekStr);

  weekNumber -= 1;
  if (weekNumber < 1) {
    year -= 1;
    weekNumber = 52;
  }

  return `${year}-Week${weekNumber}`;
};

// Email sender function (unchanged)
const sendDepartmentKPIReportEmail = async (plantId, currentWeek) => {
  try {
    const prevWeek = getPreviousWeek(currentWeek);
    const reportData = await getDepartmentKPIReport(plantId, prevWeek);

    if (!reportData || reportData.stats.totalKPIs === 0) {
      console.log(`⚠️ No department KPI data to send for plant ${plantId} week ${prevWeek}`);
      return null;
    }

    const emailHtml = generateManagerReportHtml(reportData);

    const transporter = createTransporter();
    const mailOptions = {
      from: '"AVOCarbon Plant Analytics" <administration.STS@avocarbon.com>',
      to: reportData.plant.manager_email,
      subject: `📊 Weekly KPI Dashboard - ${reportData.plant.plant_name} - Week ${prevWeek.replace('2025-Week', '')}`,
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Weekly KPI report sent to ${reportData.plant.manager_email} for plant ${reportData.plant.plant_name} (Week ${prevWeek})`);

    return info;
  } catch (error) {
    console.error(`❌ Failed to send KPI report for plant ${plantId}:`, error.message);
    return null;
  }
};
// ---------- Update Cron Job for Department Reports ----------
// ---------- Schedule Department Reports ----------
// cron.schedule(
//   "00 10 * * *", // Adjust time as needed
//   async () => {
//     const lockId = 'department_report_job';
    
//     // Try to acquire lock
//     const lock = await acquireJobLock(lockId, 60); // 60 minute TTL
    
//     if (!lock.acquired) {
//       console.log(`⏭️ Job ${lockId} already running in another instance, skipping.`);
//       return;
//     }
    
//     console.log(`🔒 Instance ${lock.instanceId} acquired lock for ${lockId}`);
    
//     try {
//       const now = new Date();
//       const year = now.getFullYear();

//       // Get week number
//       const getWeekNumber = (date) => {
//         const d = new Date(date);
//         d.setHours(0, 0, 0, 0);
//         d.setDate(d.getDate() + 4 - (d.getDay() || 7));
//         const yearStart = new Date(d.getFullYear(), 0, 1);
//         const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
//         return weekNo;
//       };

//       const weekNumber = getWeekNumber(now);
//       const currentWeek = `${year}-Week${weekNumber}`;

//       console.log(`📊 Starting department KPI reports for week ${currentWeek}...`);

//       // Get all plants with managers
//       const plantsRes = await pool.query(`
//         SELECT plant_id, name, manager_email 
//         FROM public."Plant" 
//         WHERE manager_email IS NOT NULL AND manager_email != ''
//       `);

//       console.log(`Found ${plantsRes.rows.length} plants with managers`);

//       const results = [];
//       for (const [index, plant] of plantsRes.rows.entries()) {
//         try {
//           console.log(`  [${index + 1}/${plantsRes.rows.length}] Processing ${plant.name}...`);
//           await sendDepartmentKPIReportEmail(plant.plant_id, currentWeek);
//           results.push({
//             plant_id: plant.plant_id,
//             name: plant.name,
//             status: 'success'
//           });

//           // Add delay to avoid rate limiting
//           await new Promise(resolve => setTimeout(resolve, 1500));
//         } catch (err) {
//           console.error(`  [${index + 1}/${plantsRes.rows.length}] Failed for ${plant.name}:`, err.message);
//           results.push({
//             plant_id: plant.plant_id,
//             name: plant.name,
//             status: 'error',
//             message: err.message
//           });
//         }
//       }

//       const succeeded = results.filter(r => r.status === 'success').length;
//       console.log(`✅ Department KPI reports completed. Sent: ${succeeded}/${results.length}`);

//     } catch (error) {
//       console.error("❌ Error in department KPI report cron job:", error.message);
//     } finally {
//       await releaseJobLock(lockId, lock.instanceId);
//     }
//   },
//   {
//     scheduled: true,
//     timezone: "Africa/Tunis"
//   }
// );

// ---------- Start server ----------
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
