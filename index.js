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

// ---------- Generate email HTML ----------
const generateEmailHtml = ({ responsible, kpis, week }) => {
  if (!responsible) throw new Error("Responsible not found");
  if (!kpis.length) return `<p>No KPIs found for week ${week}</p>`;

  // Group KPIs by indicator_title
  const groupedKpis = {};
  kpis.forEach((kpi) => {
    if (!groupedKpis[kpi.indicator_title])
      groupedKpis[kpi.indicator_title] = [];
    groupedKpis[kpi.indicator_title].push(kpi);
  });

  let kpiFields = "";
  Object.keys(groupedKpis).forEach((title) => {
    kpiFields += `
      <div style="margin-bottom:25px;padding:15px;border:1px solid #ddd;border-radius:8px;">
        <h3 style="margin:0 0 15px 0;font-size:18px;color:#0078D7;font-weight:700;">
          ${title}
        </h3>
    `;
    groupedKpis[title].forEach((kpi) => {
      kpiFields += `
        <div style="margin-bottom:15px;">
          <label style="display:block;margin-bottom:5px;color:#555;font-size:14px;">
            ${kpi.indicator_sub_title || ""} (${kpi.unit || ""}):
          </label>
          <input type="text" name="value_${kpi.kpi_values_id}" placeholder="Enter value"
              value="${kpi.value || ""}"
              style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;
                     font-size:14px;box-sizing:border-box;" />
        </div>
      `;
    });
    kpiFields += `</div>`;
  });

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>KPI Form</title></head>
  <body style="font-family: 'Segoe UI', sans-serif; background:#f4f4f4; padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;padding:25px;
                border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
      <div style="display:flex;align-items:center;justify-content:flex-start;
                  gap:25px;margin-bottom:30px;">
        <img src="https://media.licdn.com/dms/image/v2/D4E0BAQGYVmAPO2RZqQ/company-logo_200_200/company-logo_200_200/0/1689240189455/avocarbon_group_logo?e=2147483647&v=beta&t=nZNCXd3ypoMFQnQMxfAZrljyNBbp4E5HM11Y1yl9_L0" 
            alt="AVOCarbon Logo" style="width:80px;height:80px;object-fit:contain;">
        <h2 style="color:#0078D7;font-size:22px;margin:0;font-weight:700;text-align:center;width:100%;">
          KPI Submission Form - Week ${week}
        </h2>
      </div>

      <form action="https://kpi-form.azurewebsites.net/kpi-review" method="GET">
        <div style="margin-bottom:20px;">
          <label style="display:block;margin-bottom:5px;color:#555;font-weight:600;">
            Responsible Name
          </label>
          <input type="text" name="responsible_name" value="${responsible.name}" readonly
              style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;
                     font-size:14px;background:#f9f9f9;" />
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block;margin-bottom:5px;color:#555;font-weight:600;">Plant</label>
          <input type="text" name="plant" value="${responsible.plant_name}" readonly
              style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;
                     font-size:14px;background:#f9f9f9;" />
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block;margin-bottom:5px;color:#555;font-weight:600;">Department</label>
          <input type="text" name="department" value="${responsible.department_name}" readonly
              style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;
                     font-size:14px;background:#f9f9f9;" />
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block;margin-bottom:5px;color:#555;font-weight:600;">Week</label>
          <input type="text" name="week" value="${week}" readonly
              style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;
                     font-size:14px;background:#f9f9f9;" />
        </div>

        ${kpiFields}

        <input type="hidden" name="responsible_id" value="${responsible.responsible_id}" />
        <input type="hidden" name="week" value="${week}" />

        <button type="submit"
            style="width:100%;padding:12px;background:#0078D7;color:#fff;font-size:16px;
                   font-weight:600;border:none;border-radius:8px;cursor:pointer;">
            Review & Submit KPI
        </button>
      </form>
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
    
    console.log(`📥 Processing submission for responsible_id: ${responsible_id}`);
    console.log(`📊 Values to update:`, keys.length);
    
    for (let key of keys) {
      const kpiValuesId = key.split("_")[1];
      const value = values[key];
      console.log(`🔄 Updating kpi_values_id: ${kpiValuesId} with value: ${value}`);
      
      await pool.query(
        `UPDATE public."kpi_values" SET value=$1 WHERE kpi_values_id=$2`,
        [value, kpiValuesId]
      );
    }
    
    console.log(`✅ Successfully updated all KPI values for responsible_id: ${responsible_id}`);
    res.json({ 
      status: "success", 
      message: "✅ KPI values submitted successfully!",
      responsible_id: responsible_id,
      week: values.week || req.query.week 
    });
  } catch (err) {
    console.error("❌ Error submitting KPI values:", err);
    res.status(500).json({ 
      status: "error", 
      message: "❌ Error submitting KPI values." 
    });
  }
});

// ---------- KPI Review Page (holds indicators and values, fetches them, persists after 1 second) ----------
app.get("/kpi-review", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;
    if (!responsible_id || !week) {
      throw new Error("Missing responsible_id or week parameters");
    }

    const { responsible, kpis } = await getResponsibleWithKPIs(responsible_id, week);

    // Group KPIs by title for display
    const groupedKpis = {};
    kpis.forEach((kpi) => {
      if (!groupedKpis[kpi.indicator_title]) groupedKpis[kpi.indicator_title] = [];
      groupedKpis[kpi.indicator_title].push(kpi);
    });

    let kpiDisplay = "";
    Object.keys(groupedKpis).forEach((title) => {
      kpiDisplay += `
        <div style="margin-bottom:25px;padding:15px;border:1px solid #ddd;border-radius:8px;">
          <h3 style="margin:0 0 15px 0;font-size:18px;color:#0078D7;font-weight:700;">
            ${title}
          </h3>
      `;
      groupedKpis[title].forEach((kpi) => {
        kpiDisplay += `
          <div style="margin-bottom:15px;">
            <label style="display:block;margin-bottom:5px;color:#555;font-size:14px;">
              ${kpi.indicator_sub_title || ""} (${kpi.unit || ""}):
            </label>
            <div style="padding:10px;border:1px solid #ccc;border-radius:6px;
                        font-size:14px;background:#f9f9f9;min-height:20px;">
              <span id="value_${kpi.kpi_values_id}">${kpi.value || "Enter value"}</span>
              <input type="hidden" id="input_${kpi.kpi_values_id}" value="${kpi.value || ""}" />
            </div>
          </div>
        `;
      });
      kpiDisplay += `</div>`;
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>KPI Review</title></head>
      <body style="font-family: 'Segoe UI', sans-serif; background:#f4f4f4; padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;padding:25px;
                    border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
          <div style="display:flex;align-items:center;justify-content:flex-start;
                      gap:25px;margin-bottom:30px;">
            <img src="https://media.licdn.com/dms/image/v2/D4E0BAQGYVmAPO2RZqQ/company-logo_200_200/company-logo_200_200/0/1689240189455/avocarbon_group_logo?e=2147483647&v=beta&t=nZNCXd3ypoMFQnQMxfAZrljyNBbp4E5HM11Y1yl9_L0" 
                alt="AVOCarbon Logo" style="width:80px;height:80px;object-fit:contain;">
            <h2 style="color:#0078D7;font-size:22px;margin:0;font-weight:700;text-align:center;width:100%;">
              Review Your KPI Submission - Week ${week}
            </h2>
          </div>

          <div style="margin-bottom:20px;">
            <label style="display:block;margin-bottom:5px;color:#555;font-weight:600;">
              Responsible Name
            </label>
            <input type="text" value="${responsible.name}" readonly
                style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;
                       font-size:14px;background:#f9f9f9;" />
          </div>
          <div style="margin-bottom:20px;">
            <label style="display:block;margin-bottom:5px;color:#555;font-weight:600;">Plant</label>
            <input type="text" value="${responsible.plant_name}" readonly
                style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;
                       font-size:14px;background:#f9f9f9;" />
          </div>
          <div style="margin-bottom:20px;">
            <label style="display:block;margin-bottom:5px;color:#555;font-weight:600;">Department</label>
            <input type="text" value="${responsible.department_name}" readonly
                style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;
                       font-size:14px;background:#f9f9f9;" />
          </div>
          <div style="margin-bottom:20px;">
            <label style="display:block;margin-bottom:5px;color:#555;font-weight:600;">Week</label>
            <input type="text" value="${week}" readonly
                style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;
                       font-size:14px;background:#f9f9f9;" />
          </div>

          ${kpiDisplay}

          <input type="hidden" id="responsible_id" value="${responsible_id}" />
          <input type="hidden" id="week" value="${week}" />

          <button id="submitBtn"
              style="width:100%;padding:12px;background:#0078D7;color:#fff;font-size:16px;
                     font-weight:600;border:none;border-radius:8px;cursor:pointer;">
            Confirm & Submit KPI
          </button>

          <div id="status" style="margin-top:20px;text-align:center;display:none;"></div>
        </div>

        <script>
          document.getElementById('submitBtn').addEventListener('click', async function(e) {
            e.preventDefault();
            const submitBtn = this;
            const statusEl = document.getElementById('status');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            statusEl.style.display = 'block';
            statusEl.textContent = 'Reviewing your submission...';

            // Collect values from hidden inputs (these hold the submitted values from the form)
            const body = {
              responsible_id: document.getElementById('responsible_id').value,
              week: document.getElementById('week').value
            };
            ${kpis.map(kpi => `body['value_${kpi.kpi_values_id}'] = document.getElementById('input_${kpi.kpi_values_id}').value;`).join('\n            ')}

            // Wait 1 second before persisting
            setTimeout(async () => {
              try {
                statusEl.textContent = 'Persisting data to database...';
                
                const response = await fetch('/api/submit-kpi', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  body: JSON.stringify(body)
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                  statusEl.textContent = '✅ Submission confirmed and saved!';
                  statusEl.style.color = '#28a745';
                  
                  // Redirect to success page after another short delay
                  setTimeout(() => {
                    window.location.href = \`/kpi-submitted?responsible_id=\${body.responsible_id}&week=\${body.week}\`;
                  }, 1500);
                  
                } else {
                  statusEl.textContent = '❌ Error: ' + data.message;
                  statusEl.style.color = '#dc3545';
                  submitBtn.disabled = false;
                  submitBtn.textContent = 'Confirm & Submit KPI';
                  console.error('Submission error:', data);
                }
              } catch (err) {
                statusEl.textContent = '❌ Network error: ' + err.message;
                statusEl.style.color = '#dc3545';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Confirm & Submit KPI';
                console.error('Network error:', err);
              }
            }, 1000);
          });
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Error loading KPI review:", err);
    res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
  }
});

// ---------- KPI Submitted page ----------
app.get("/kpi-submitted", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;
    if (!responsible_id || !week) {
      throw new Error("Missing parameters - responsible_id and week are required");
    }

    console.log(`📋 Showing submitted KPIs for responsible_id: ${responsible_id}, week: ${week}`);

    const { responsible, kpis } = await getResponsibleWithKPIs(responsible_id, week);

    let kpiHtml = "";
    if (kpis.length > 0) {
      kpiHtml = `<div style="margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px;">`;
      kpiHtml += `<h3 style="color: #0078D7; margin-top: 0;">Submitted Values:</h3>`;
      
      // Group KPIs by title for better display
      const groupedKpis = {};
      kpis.forEach((kpi) => {
        if (!groupedKpis[kpi.indicator_title]) groupedKpis[kpi.indicator_title] = [];
        groupedKpis[kpi.indicator_title].push(kpi);
      });

      Object.keys(groupedKpis).forEach(title => {
        kpiHtml += `<div style="margin-bottom: 15px;">`;
        kpiHtml += `<h4 style="color: #495057; margin-bottom: 10px;">${title}</h4>`;
        groupedKpis[title].forEach(kpi => {
          kpiHtml += `<p style="margin: 5px 0; padding-left: 15px;">
            <strong>${kpi.indicator_sub_title || 'Value'}:</strong> 
            ${kpi.value || 'N/A'} ${kpi.unit || ''}
          </p>`;
        });
        kpiHtml += `</div>`;
      });
      kpiHtml += `</div>`;
    } else {
      kpiHtml = `<p style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 5px;">
        No KPI data found for this period.
      </p>`;
    }

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>KPI Submitted Successfully</title>
          <style>
            body { 
              font-family: 'Segoe UI', sans-serif; 
              padding: 20px; 
              background: #f4f4f4;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .container { 
              max-width: 700px; 
              margin: 0 auto; 
              background: #fff; 
              padding: 30px; 
              border-radius: 10px; 
              box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
            }
            .success-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e9ecef;
            }
            .success-icon {
              font-size: 48px;
              color: #28a745;
              margin-bottom: 15px;
            }
            h1 { 
              color: #28a745; 
              margin: 0;
              font-size: 28px;
            }
            h2 {
              color: #495057;
              margin: 10px 0;
              font-size: 20px;
            }
            .info-box {
              background: #e7f3ff;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .close-message {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              color: #6c757d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-header">
              <div class="success-icon">✅</div>
              <h1>KPI Submitted Successfully!</h1>
            </div>
            
            <div class="info-box">
              <h2>${responsible.name}</h2>
              <p><strong>Plant:</strong> ${responsible.plant_name}</p>
              <p><strong>Department:</strong> ${responsible.department_name}</p>
              <p><strong>Week:</strong> ${week}</p>
            </div>

            ${kpiHtml}

            <div class="close-message">
              <p>Your KPI data has been saved successfully. You can safely close this page.</p>
              <p><em>Thank you for your submission!</em></p>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Error loading submitted KPIs:", err);
    res.send(`
      <html>
        <head><style>body { font-family: sans-serif; padding: 20px; } .error { color: #dc3545; background: #f8d7da; padding: 15px; border-radius: 5px; }</style></head>
        <body>
          <div class="error">
            <h1>Error Loading Submission</h1>
            <p>${err.message}</p>
            <p><a href="/">Return to Home</a></p>
          </div>
        </body>
      </html>
    `);
  }
});

// ---------- Send KPI email ----------
const sendKPIEmail = async (responsibleId, week) => {
  try {
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

    console.log(`✅ Email sent to ${responsible.email}: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Failed to send email to responsible ID ${responsibleId}:`, err.message);
  }
};

// ---------- Schedule weekly email ----------
let cronRunning = false;

cron.schedule(
  "51 09 * * *", // daily at 10:15 AM Africa/Tunis
  async () => {
    if (cronRunning) {
      console.log("⏭️ Cron already running, skip...");
      return;
    }
    cronRunning = true;

    const forcedWeek = "W39"; // adjust dynamically if needed
    let successCount = 0;
    let errorCount = 0;
    try {
      const resps = await pool.query(`SELECT responsible_id FROM public."Responsible"`);
      for (let r of resps.rows) {
        try {
          await sendKPIEmail(r.responsible_id, forcedWeek);
          successCount++;
        } catch (sendErr) {
          errorCount++;
        }
      }
      console.log(`✅ KPI emails sent: ${successCount} successful, ${errorCount} failed`);
    } catch (err) {
      console.error("❌ Error sending scheduled emails:", err.message);
    } finally {
      cronRunning = false;
    }
  },
  { scheduled: true, timezone: "Africa/Tunis" }
);

// Root route for testing
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>KPI System</title></head>
      <body>
        <h1>KPI Submission System</h1>
        <p>System is running. Use the email links to access KPI forms.</p>
      </body>
    </html>
  `);
});

app.listen(port, () => console.log(`Server running on port ${port}`));
