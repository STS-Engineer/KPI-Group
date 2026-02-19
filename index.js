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
// Remove the old acquireJobLock and releaseJobLock functions
// ---------- IMPROVED Job Lock Helper with PostgreSQL Advisory Locks ----------
const acquireJobLock = async (lockId, ttlMinutes = 9) => {
  const instanceId = process.env.WEBSITE_INSTANCE_ID || `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Convert lockId string to a consistent integer hash
    const lockHash = Math.abs(lockId.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));

    // Try to acquire PostgreSQL advisory lock (non-blocking)
    const result = await pool.query('SELECT pg_try_advisory_lock($1) as acquired', [lockHash]);

    if (result.rows[0].acquired) {
      console.log(`🔒 Instance ${instanceId} acquired lock ${lockId} (hash: ${lockHash})`);
      return { acquired: true, instanceId, lockHash };
    } else {
      console.log(`⏭️ Instance ${instanceId} failed to acquire lock ${lockId} - another instance is running this job`);
      return { acquired: false, instanceId, lockHash };
    }
  } catch (error) {
    console.error(`❌ Error acquiring lock ${lockId}:`, error.message);
    return { acquired: false, instanceId, error: error.message };
  }
};

const releaseJobLock = async (lockId, instanceId, lockHash) => {
  try {
    if (lockHash) {
      await pool.query('SELECT pg_advisory_unlock($1)', [lockHash]);
      console.log(`🔓 Instance ${instanceId} released lock ${lockId}`);
    }
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
          
      <a href="http://localhost:5000/form?responsible_id=${responsible.responsible_id}&week=${week}"
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

// ========== CORRECTIVE ACTION SYSTEM - START ==========


const generateCorrectiveActionEmailHtml = ({ responsible, kpi, week, value, target_value }) => {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>Corrective Action Required</title></head>
  <body style="font-family:'Segoe UI',sans-serif;background:#f4f4f4;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;padding:25px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
      <div style="text-align:center;margin-bottom:25px;">
        <div style="width:80px;height:80px;margin:0 auto 15px;background:#ff9800;border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:40px;">⚠️</span>
        </div>
        <h2 style="color:#d32f2f;font-size:22px;margin:0;">Corrective Action Required</h2>
        <p style="color:#666;font-size:14px;margin:10px 0 0 0;">KPI Below target_value - Week ${week}</p>
      </div>
      
      <div style="background:#f8f9fa;padding:20px;border-radius:6px;margin-bottom:20px;border-left:4px solid #d32f2f;">
        <div style="margin-bottom:12px;">
          <span style="font-weight:600;color:#333;font-size:13px;">Plant: </span>
          <span style="color:#666;font-size:13px;">${responsible.plant_name}</span>
        </div>
        <div style="margin-bottom:12px;">
          <span style="font-weight:600;color:#333;font-size:13px;">Department: </span>
          <span style="color:#666;font-size:13px;">${responsible.department_name}</span>
        </div>
        <div>
          <span style="font-weight:600;color:#333;font-size:13px;">Responsible: </span>
          <span style="color:#666;font-size:13px;">${responsible.name}</span>
        </div>
      </div>
      
      <div style="background:#fff3e0;padding:20px;border-radius:6px;margin-bottom:20px;border:1px solid #ffb74d;">
        <h3 style="color:#e65100;font-size:16px;margin:0 0 15px 0;">KPI Performance Alert</h3>
        <div style="margin-bottom:10px;">
          <span style="font-weight:600;color:#333;font-size:13px;">Indicator: </span>
          <span style="color:#666;font-size:13px;">${kpi.indicator_title}</span>
        </div>
        <div style="margin-top:15px;display:flex;justify-content:space-around;background:white;padding:15px;border-radius:4px;">
          <div style="text-align:center;">
            <div style="font-size:11px;color:#666;margin-bottom:5px;">Current Value</div>
            <div style="font-size:20px;font-weight:700;color:#d32f2f;">${value}${kpi.unit || ''}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:11px;color:#666;margin-bottom:5px;">target_value</div>
            <div style="font-size:20px;font-weight:700;color:#4caf50;">${target_value}${kpi.unit || ''}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:11px;color:#666;margin-bottom:5px;">Gap</div>
            <div style="font-size:20px;font-weight:700;color:#ff9800;">
              ${(parseFloat(target_value) - parseFloat(value)).toFixed(2)}${kpi.unit || ''}
            </div>
          </div>
        </div>
      </div>
      
      <div style="text-align:center;margin:25px 0;">
        <a href="http://localhost:5000/corrective-action-form?responsible_id=${responsible.responsible_id}&kpi_id=${kpi.kpi_id}&week=${week}"
           style="display:inline-block;padding:14px 30px;background:#d32f2f;color:white;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
          📝 Fill Corrective Action Form
        </a>
      </div>
      
      <div style="margin-top:25px;padding-top:20px;border-top:1px solid #e0e0e0;text-align:center;">
        <p style="font-size:11px;color:#999;margin:0;">
          This is an automated alert from AVOCarbon KPI System<br>
          Please complete the corrective action form within 24 hours
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
};

// ========== ENHANCED CORRECTIVE ACTION SYSTEM WITH EMAIL NOTIFICATIONS ==========

// Generate target update email HTML
const generateTargetUpdateEmailHtml = ({ responsible, kpi, week, oldTarget, newTarget }) => {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>KPI Target Updated</title></head>
  <body style="font-family:'Segoe UI',sans-serif;background:#f4f4f4;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;padding:25px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="text-align:center;margin-bottom:30px;">
        <div style="width:80px;height:80px;margin:0 auto 15px;background:#4caf50;border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:40px;">🎯</span>
        </div>
        <h2 style="color:#4caf50;font-size:22px;margin:0;">KPI Target Updated</h2>
        <p style="color:#666;font-size:14px;margin:10px 0 0 0;">Week ${week} - Performance Exceeds Expectations</p>
      </div>
      
      <!-- Responsible Info -->
      <div style="background:#e8f5e9;padding:20px;border-radius:6px;margin-bottom:25px;border-left:4px solid #4caf50;">
        <div style="margin-bottom:12px;">
          <span style="font-weight:600;color:#333;font-size:13px;">Plant: </span>
          <span style="color:#666;font-size:13px;">${responsible.plant_name}</span>
        </div>
        <div style="margin-bottom:12px;">
          <span style="font-weight:600;color:#333;font-size:13px;">Department: </span>
          <span style="color:#666;font-size:13px;">${responsible.department_name}</span>
        </div>
        <div>
          <span style="font-weight:600;color:#333;font-size:13px;">Responsible: </span>
          <span style="color:#666;font-size:13px;">${responsible.name}</span>
        </div>
      </div>
      
      <!-- KPI Details -->
      <div style="background:#f5f5f5;padding:20px;border-radius:6px;margin-bottom:25px;">
        <h3 style="color:#333;font-size:16px;margin:0 0 15px 0;">KPI Information</h3>
        <div style="margin-bottom:10px;">
          <span style="font-weight:600;color:#333;font-size:13px;">Indicator: </span>
          <span style="color:#666;font-size:13px;">${kpi.indicator_title}</span>
        </div>
        ${kpi.indicator_sub_title ? `
        <div style="margin-bottom:10px;">
          <span style="font-weight:600;color:#333;font-size:13px;">Sub-title: </span>
          <span style="color:#666;font-size:13px;">${kpi.indicator_sub_title}</span>
        </div>
        ` : ''}
        ${kpi.unit ? `
        <div>
          <span style="font-weight:600;color:#333;font-size:13px;">Unit: </span>
          <span style="color:#666;font-size:13px;">${kpi.unit}</span>
        </div>
        ` : ''}
      </div>
      
      <!-- Target Update Details -->
      <div style="background:#fff3e0;padding:20px;border-radius:6px;margin-bottom:25px;border:1px solid #ffb74d;">
        <h3 style="color:#e65100;font-size:16px;margin:0 0 15px 0;">Target Value Updated</h3>
        <p style="color:#666;font-size:14px;margin:0 0 15px 0;">
          Your KPI performance exceeded the target value for week ${week}. 
          The system has automatically updated the target to reflect this achievement.
        </p>
        
        <div style="margin-top:15px;display:flex;justify-content:space-around;background:white;padding:15px;border-radius:4px;">
          <div style="text-align:center;">
            <div style="font-size:11px;color:#666;margin-bottom:5px;">Previous Target</div>
            <div style="font-size:20px;font-weight:700;color:#d32f2f;">${oldTarget}${kpi.unit || ''}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:24px;color:#666;margin:8px;">→</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:11px;color:#666;margin-bottom:5px;">New Target</div>
            <div style="font-size:20px;font-weight:700;color:#4caf50;">${newTarget}${kpi.unit || ''}</div>
          </div>
        </div>
        
        <div style="text-align:center;margin-top:15px;padding:10px;background:#e8f5e9;border-radius:4px;">
          <div style="font-size:20px;font-weight:700;color:#2e7d32;">
            +${((newTarget - oldTarget) / oldTarget * 100).toFixed(1)}%
          </div>
          <div style="font-size:11px;color:#666;">Improvement</div>
        </div>
      </div>
      
      <!-- Message -->
      <div style="background:#e3f2fd;padding:20px;border-radius:6px;margin-bottom:25px;">
        <h3 style="color:#1976d2;font-size:15px;margin:0 0 12px 0;">🎉 Congratulations!</h3>
        <ul style="margin:0;padding-left:20px;color:#555;font-size:13px;line-height:1.8;">
          <li>Your KPI performance has exceeded expectations</li>
          <li>The target has been updated to reflect your achievement</li>
          <li>Continue maintaining or improving this performance</li>
          <li><strong>Next target will be based on this new value</strong></li>
        </ul>
      </div>
      
      <!-- Footer -->
      <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e0e0e0;text-align:center;">
        <p style="font-size:11px;color:#999;margin:0;line-height:1.6;">
          This is an automated notification from AVOCarbon KPI System<br>
          <strong>Week ${week}</strong> • Generated on ${new Date().toLocaleDateString()}<br>
          For assistance, contact: <a href="mailto:administration.STS@avocarbon.com" style="color:#0078D7;">administration.STS@avocarbon.com</a>
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
};

// Send target update email
const sendTargetUpdateEmail = async (responsibleId, kpiId, week, oldTarget, newTarget) => {
  try {
    // Get responsible info
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
    if (!responsible || !responsible.email) {
      console.log(`No email found for responsible ${responsibleId}`);
      return null;
    }

    // Get KPI details
    const kpiRes = await pool.query(
      `SELECT kpi_id, indicator_title, indicator_sub_title, unit
       FROM public."Kpi"
       WHERE kpi_id = $1`,
      [kpiId]
    );

    const kpi = kpiRes.rows[0];
    if (!kpi) {
      console.log(`KPI ${kpiId} not found`);
      return null;
    }

    const html = generateTargetUpdateEmailHtml({
      responsible,
      kpi,
      week,
      oldTarget,
      newTarget
    });

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: '"AVOCarbon KPI System" <administration.STS@avocarbon.com>',
      to: responsible.email,
      subject: `🎯 Target Updated - ${kpi.indicator_title} - Week ${week}`,
      html,
    });

    console.log(`✅ Target update email sent to ${responsible.email} for KPI ${kpiId}`);
    return info;
  } catch (err) {
    console.error(`❌ Failed to send target update email:`, err.message);
    return null;
  }
};

// ========== CONSOLIDATED TARGET UPDATE EMAIL FUNCTIONS ==========

// Generate consolidated target update email HTML
const generateConsolidatedTargetUpdateEmailHtml = ({ responsible, week, targetUpdates }) => {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>KPI Targets Updated</title></head>
  <body style="font-family:'Segoe UI',sans-serif;background:#f4f4f4;padding:20px;">
    <div style="max-width:700px;margin:0 auto;background:#fff;padding:25px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="text-align:center;margin-bottom:30px;">
        <div style="width:90px;height:90px;margin:0 auto 15px;background:#4caf50;border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:45px;">🎯</span>
        </div>
        <h2 style="color:#4caf50;font-size:24px;margin:0;">KPI Targets Updated</h2>
        <p style="color:#666;font-size:14px;margin:10px 0 0 0;">Week ${week} - Performance Exceeds Expectations</p>
      </div>
      
      <!-- Responsible Info -->
      <div style="background:#e8f5e9;padding:20px;border-radius:6px;margin-bottom:25px;border-left:4px solid #4caf50;">
        <div style="margin-bottom:12px;">
          <span style="font-weight:600;color:#333;font-size:13px;">Responsible: </span>
          <span style="color:#666;font-size:13px;">${responsible.name}</span>
        </div>
        <div style="margin-bottom:12px;">
          <span style="font-weight:600;color:#333;font-size:13px;">Plant: </span>
          <span style="color:#666;font-size:13px;">${responsible.plant_name}</span>
        </div>
        <div>
          <span style="font-weight:600;color:#333;font-size:13px;">Department: </span>
          <span style="color:#666;font-size:13px;">${responsible.department_name}</span>
        </div>
      </div>
      
      <!-- Summary Badge -->
      <div style="background:#fff3e0;padding:15px;border-radius:6px;margin-bottom:25px;text-align:center;border:2px solid #ff9800;">
        <span style="font-size:32px;font-weight:700;color:#4caf50;">${targetUpdates.length}</span>
        <span style="font-size:14px;color:#666;display:block;margin-top:5px;">KPI Target${targetUpdates.length > 1 ? 's' : ''} Updated</span>
      </div>
      
      <!-- KPIs List -->
      <div style="margin-bottom:25px;">
        <h3 style="color:#333;font-size:16px;margin-bottom:15px;border-bottom:2px solid #e0e0e0;padding-bottom:8px;">
          📊 Target Updates Summary
        </h3>
        
        ${targetUpdates.map((update, index) => `
        <div style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:15px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
            <div style="flex:1;">
              <div style="font-weight:600;color:#333;font-size:14px;margin-bottom:5px;">
                ${index + 1}. ${update.indicator_title}
              </div>
              ${update.indicator_sub_title ? `
              <div style="color:#666;font-size:12px;margin-bottom:8px;">
                ${update.indicator_sub_title}
              </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Performance Summary -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:white;padding:12px;border-radius:4px;margin-bottom:10px;">
            <div style="text-align:center;">
              <div style="font-size:10px;color:#666;margin-bottom:4px;text-transform:uppercase;">Old Target</div>
              <div style="font-size:16px;font-weight:700;color:#d32f2f;">${update.oldTarget} ${update.unit || ''}</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:10px;color:#666;margin-bottom:4px;text-transform:uppercase;">New Target</div>
              <div style="font-size:16px;font-weight:700;color:#4caf50;">${update.newTarget} ${update.unit || ''}</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:10px;color:#666;margin-bottom:4px;text-transform:uppercase;">Improvement</div>
              <div style="font-size:16px;font-weight:700;color:#ff9800;">
                +${update.improvement}%
              </div>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div style="margin-top:10px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#666;margin-bottom:4px;">
              <span>${update.oldTarget} ${update.unit || ''}</span>
              <span>+${update.improvement}%</span>
              <span>${update.newTarget} ${update.unit || ''}</span>
            </div>
            <div style="height:6px;background:#e0e0e0;border-radius:3px;overflow:hidden;">
              <div style="height:100%;background:#4caf50;width:${Math.min(update.improvement, 100)}%;"></div>
            </div>
          </div>
        </div>
        `).join('')}
      </div>
      
      <!-- Congratulations Section -->
      <div style="background:#e3f2fd;padding:20px;border-radius:6px;margin-bottom:25px;">
        <h3 style="color:#1976d2;font-size:15px;margin:0 0 12px 0;">🎉 Congratulations!</h3>
        <ul style="margin:0;padding-left:20px;color:#555;font-size:13px;line-height:1.8;">
          <li><strong>${targetUpdates.length} KPI${targetUpdates.length > 1 ? 's' : ''} exceeded their targets</strong></li>
          <li>Target values have been updated to reflect your achievements</li>
          <li>Continue maintaining or improving this performance</li>
          <li>Future targets will be based on these new values</li>
        </ul>
      </div>
      
      <!-- Next Steps -->
      <div style="background:#fff8e1;padding:20px;border-radius:6px;margin-bottom:25px;">
        <h3 style="color:#ff8f00;font-size:15px;margin:0 0 12px 0;">📈 What This Means</h3>
        <ul style="margin:0;padding-left:20px;color:#555;font-size:13px;line-height:1.8;">
          <li>You've set a new standard for these KPIs</li>
          <li>The system now expects at least this level of performance</li>
          <li>Your achievement is officially recorded in the system</li>
          <li>Keep up the excellent work!</li>
        </ul>
      </div>
      
      <!-- Footer -->
      <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e0e0e0;text-align:center;">
        <p style="font-size:11px;color:#999;margin:0;line-height:1.6;">
          This is an automated notification from AVOCarbon KPI System<br>
          <strong>Week ${week}</strong> • Generated on ${new Date().toLocaleDateString()}<br>
          For assistance, contact: <a href="mailto:administration.STS@avocarbon.com" style="color:#0078D7;">administration.STS@avocarbon.com</a>
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
};

// Send consolidated target update email
const sendConsolidatedTargetUpdateEmail = async (responsibleId, week, targetUpdates) => {
  try {
    // Get responsible info
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
    if (!responsible || !responsible.email) {
      console.log(`No email found for responsible ${responsibleId}`);
      return null;
    }

    if (targetUpdates.length === 0) {
      console.log(`No target updates to send for responsible ${responsibleId}, week ${week}`);
      return null;
    }

    // Get KPI details for each update
    const enhancedUpdates = [];
    for (const update of targetUpdates) {
      const kpiRes = await pool.query(
        `SELECT indicator_title, indicator_sub_title, unit
         FROM public."Kpi"
         WHERE kpi_id = $1`,
        [update.kpiId]
      );

      if (kpiRes.rows[0]) {
        const kpi = kpiRes.rows[0];
        const improvement = ((update.newTarget - update.oldTarget) / update.oldTarget * 100).toFixed(1);

        enhancedUpdates.push({
          kpiId: update.kpiId,
          indicator_title: kpi.indicator_title,
          indicator_sub_title: kpi.indicator_sub_title,
          unit: kpi.unit || '',
          oldTarget: update.oldTarget,
          newTarget: update.newTarget,
          improvement: improvement
        });
      }
    }

    const html = generateConsolidatedTargetUpdateEmailHtml({
      responsible,
      week,
      targetUpdates: enhancedUpdates
    });

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: '"AVOCarbon KPI System" <administration.STS@avocarbon.com>',
      to: responsible.email,
      subject: `🎯 ${targetUpdates.length} KPI Target${targetUpdates.length > 1 ? 's' : ''} Updated - Week ${week}`,
      html,
    });

    console.log(`✅ Consolidated target update email sent to ${responsible.email} (${targetUpdates.length} KPIs)`);
    return info;
  } catch (err) {
    console.error(`❌ Failed to send consolidated target update email:`, err.message);
    return null;
  }
};


// Modified: Enhanced function with email notifications
// Modified: Enhanced function to COLLECT target updates for consolidated email
const checkAndTriggerCorrectiveActions = async (
  responsibleId,
  kpiId,
  week,
  newValue,
  histId
) => {
  try {
    // 1️⃣ Get current target value
    const kpiRes = await pool.query(
      `SELECT target_value FROM public."Kpi" WHERE kpi_id = $1`,
      [kpiId]
    );

    if (!kpiRes.rows.length) return { targetUpdated: false };

    const currentTarget = parseFloat(kpiRes.rows[0].target_value);
    const numValue = parseFloat(newValue);

    if (isNaN(numValue) || isNaN(currentTarget)) return { targetUpdated: false };

    // 2️⃣ Always update history with current target
    await pool.query(
      `UPDATE public.kpi_values_hist26
       SET target = $1
       WHERE responsible_id = $2
         AND kpi_id = $3
         AND week = $4
         AND (target IS NULL OR target < $1)`,
      [numValue, responsibleId, kpiId, week]
    );

    console.log(`📝 History updated with target: ${currentTarget} for hist_id: ${histId}`);

    // 3️⃣ If value exceeds target → update KPI target and RETURN update info
    if (numValue > currentTarget) {
      const oldTarget = currentTarget;

      // ✅ Update KPI target
      await pool.query(
        `UPDATE public."Kpi"
         SET target_value = $1
         WHERE kpi_id = $2`,
        [numValue, kpiId]
      );

      console.log(`🎯 Updated target for KPI ${kpiId}: ${oldTarget} → ${numValue}`);

      // ✅ Return target update info (NO EMAIL SENT HERE)
      return {
        targetUpdated: true,
        updateInfo: {
          kpiId: kpiId,
          oldTarget: oldTarget,
          newTarget: numValue
        }
      };
    }

    // 4️⃣ If value is BELOW target → create corrective action
    if (numValue < currentTarget) {
      const existingCA = await pool.query(
        `SELECT corrective_action_id
         FROM public.corrective_actions
         WHERE responsible_id = $1
           AND kpi_id = $2
           AND week = $3
           AND status = 'Open'`,
        [responsibleId, kpiId, week]
      );

      if (existingCA.rows.length === 0) {
        await pool.query(
          `INSERT INTO public.corrective_actions
           (responsible_id, kpi_id, week, status)
           VALUES ($1, $2, $3, 'Open')`,
          [responsibleId, kpiId, week]
        );

        console.log(`🔴 Corrective action created for KPI ${kpiId}, Week ${week}`);
      }
    }

    return { targetUpdated: false };

  } catch (error) {
    console.error(`Error checking corrective actions:`, error.message);
    return { targetUpdated: false, error: error.message };
  }
};
// ========== CORRECTIVE ACTION SYSTEM - END ==========

// ========== BULK CORRECTIVE ACTIONS FORM ==========
app.get("/corrective-actions-bulk", async (req, res) => {
  try {
    const { responsible_id, week } = req.query;

    // Get responsible info
    const resResp = await pool.query(
      `SELECT r.responsible_id, r.name, r.email, r.plant_id, r.department_id,
             p.name AS plant_name, d.name AS department_name
      FROM public."Responsible" r
      JOIN public."Plant" p ON r.plant_id = p.plant_id
      JOIN public."Department" d ON r.department_id = d.department_id
      WHERE r.responsible_id = $1`,
      [responsible_id]
    );

    const responsible = resResp.rows[0];
    if (!responsible) return res.status(404).send("Responsible not found");

    // Get all open corrective actions
    const actionsRes = await pool.query(
      `SELECT ca.*, k.indicator_title, k.indicator_sub_title, k.unit, k.target_value,
              kv.value
       FROM public.corrective_actions ca
       JOIN public."Kpi" k ON ca.kpi_id = k.kpi_id
       LEFT JOIN public.kpi_values kv ON ca.kpi_id = kv.kpi_id 
         AND kv.responsible_id = ca.responsible_id 
         AND kv.week = ca.week
       WHERE ca.responsible_id = $1 
         AND ca.week = $2 
         AND ca.status = 'Open'
       ORDER BY k.indicator_title`,
      [responsible_id, week]
    );

    const actions = actionsRes.rows;
    if (actions.length === 0) {
      return res.send(`
        <div style="text-align:center;padding:60px;font-family:'Segoe UI',sans-serif;">
          <h2 style="color:#4caf50;">✅ No Open Corrective Actions</h2>
          <p>All corrective actions for week ${week} have been completed.</p>
          <a href="/dashboard?responsible_id=${responsible_id}" style="display:inline-block;padding:12px 25px;background:#0078D7;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Go to Dashboard</a>
        </div>
      `);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Corrective Actions - Week ${week}</title>
        <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          background-image: url("https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
         }

        .container {
           max-width: 1000px;
           margin: 0 auto;
           background: rgba(255, 255, 255, 0.95);
           backdrop-filter: blur(5px);
           border-radius: 8px;
           box-shadow: 0 2px 20px rgba(0,0,0,0.3);
           overflow: hidden;
           }

          .header { background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 600; }
          .badge { background: rgba(255,255,255,0.2); display: inline-block; padding: 8px 16px; border-radius: 20px; margin-top: 10px; font-size: 14px; }
          .form-section { padding: 30px; }
          .info-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin-bottom: 25px; border-radius: 4px; }
          .kpi-section { margin-bottom: 30px; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; background: #fafafa; }
          .kpi-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e0e0e0; }
          .kpi-title { font-size: 16px; font-weight: 700; color: #333; }
          .kpi-subtitle { font-size: 13px; color: #666; margin-top: 5px; }
          .perf-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
          .stat-box { text-align: center; padding: 12px; background: white; border-radius: 6px; border: 1px solid #e0e0e0; }
          .stat-label { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
          .stat-value { font-size: 20px; font-weight: 700; }
          .stat-value.current { color: #d32f2f; }
          .stat-value.target { color: #4caf50; }
          .stat-value.gap { color: #ff9800; }
          .form-group { margin-bottom: 20px; }
          label { display: block; font-weight: 600; color: #333; margin-bottom: 8px; font-size: 13px; }
          label .required { color: #d32f2f; }
          textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; font-family: 'Segoe UI', sans-serif; box-sizing: border-box; min-height: 80px; resize: vertical; }
          textarea:focus { border-color: #d32f2f; outline: none; box-shadow: 0 0 0 2px rgba(211,47,47,0.1); }
          .help-text { font-size: 11px; color: #666; margin-top: 5px; font-style: italic; }
          .submit-btn { background: #d32f2f; color: white; border: none; padding: 16px 40px; border-radius: 6px; font-size: 17px; font-weight: 700; cursor: pointer; width: 100%; margin-top: 20px; }
          .submit-btn:hover { background: #b71c1c; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
            <h1>Corrective Actions Required</h1>
            <div class="badge">${actions.length} KPI${actions.length > 1 ? 's' : ''} Below Target - Week ${week}</div>
          </div>

          <div class="form-section">
            <div class="info-box">
              <strong>${responsible.name}</strong> • ${responsible.plant_name} • ${responsible.department_name}
            </div>

            <form action="/submit-bulk-corrective-actions" method="POST">
              <input type="hidden" name="responsible_id" value="${responsible_id}">
              <input type="hidden" name="week" value="${week}">

              ${actions.map((action, index) => `
                <div class="kpi-section">
                  <input type="hidden" name="corrective_action_ids[]" value="${action.corrective_action_id}">
                  
                  <div class="kpi-header">
                    <div>
                      <div style="display:inline-block;width:30px;height:30px;background:#d32f2f;color:white;border-radius:50%;text-align:center;line-height:30px;font-weight:700;margin-right:10px;">${index + 1}</div>
                      <div style="display:inline-block;vertical-align:top;">
                        <div class="kpi-title">${action.indicator_title}</div>
                        ${action.indicator_sub_title ? `<div class="kpi-subtitle">${action.indicator_sub_title}</div>` : ''}
                      </div>
                    </div>
                  </div>

                  <div class="perf-stats">
                    <div class="stat-box">
                      <div class="stat-label">Current</div>
                      <div class="stat-value current">${action.value || '0'} ${action.unit || ''}</div>
                    </div>
                    <div class="stat-box">
                      <div class="stat-label">Target</div>
                      <div class="stat-value target">${action.target_value || 'N/A'} ${action.unit || ''}</div>
                    </div>
                    <div class="stat-box">
                      <div class="stat-label">Gap</div>
                      <div class="stat-value gap">
                        ${action.target_value ? (parseFloat(action.target_value) - parseFloat(action.value || 0)).toFixed(2) : 'N/A'} ${action.unit || ''}
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Root Cause<span class="required">*</span></label>
                    <textarea name="root_cause_${action.corrective_action_id}" required placeholder="Why did this KPI fall below target?">${action.root_cause || ''}</textarea>
                  </div>

                  <div class="form-group">
                    <label>Implemented Solution<span class="required">*</span></label>
                    <textarea name="solution_${action.corrective_action_id}" required placeholder="What actions have been taken?">${action.implemented_solution || ''}</textarea>
                  </div>

                  <div class="form-group">
                    <label>Evidence<span class="required">*</span></label>
                    <textarea name="evidence_${action.corrective_action_id}" required placeholder="What evidence shows improvement?">${action.evidence || ''}</textarea>
                    <div class="help-text">Provide data, metrics, or observations demonstrating effectiveness</div>
                  </div>
                </div>
              `).join('')}

              <button type="submit" class="submit-btn">
                ✓ Submit All Corrective Actions (${actions.length})
              </button>
            </form>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Error loading bulk corrective actions:", err);
    res.status(500).send(`<p style="color:red;">Error: ${err.message}</p>`);
  }
});

// ========== SUBMIT BULK CORRECTIVE ACTIONS ==========
app.post("/submit-bulk-corrective-actions", async (req, res) => {
  try {
    const { responsible_id, week, corrective_action_ids, ...formData } = req.body;

    const ids = Array.isArray(corrective_action_ids)
      ? corrective_action_ids
      : [corrective_action_ids];

    let completedCount = 0;

    for (const caId of ids) {
      const rootCause = formData[`root_cause_${caId}`];
      const solution = formData[`solution_${caId}`];
      const evidence = formData[`evidence_${caId}`];

      if (rootCause && solution && evidence) {
        await pool.query(
          `UPDATE public.corrective_actions
           SET root_cause = $1, 
               implemented_solution = $2, 
               evidence = $3,
               status = 'Completed',
               updated_date = NOW()
           WHERE corrective_action_id = $4`,
          [rootCause, solution, evidence, caId]
        );
        completedCount++;
      }
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Corrective Actions Submitted</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f4f6f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .success-container { background: white; padding: 50px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; max-width: 600px; }
          h1 { color: #4caf50; font-size: 32px; margin-bottom: 20px; }
          .count { font-size: 48px; font-weight: 700; color: #4caf50; margin: 20px 0; }
          p { font-size: 16px; color: #333; margin-bottom: 30px; line-height: 1.6; }
          a { display: inline-block; padding: 14px 30px; background: #0078D7; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px; }
          a:hover { background: #005ea6; }
        </style>
      </head>
      <body>
        <div class="success-container">
          <h1>✅ All Corrective Actions Submitted!</h1>
          <div class="count">${completedCount}</div>
          <p>
            You have successfully completed all corrective actions for week ${week}.<br>
            The quality team will review your submissions.
          </p>

          <a href="/corrective-actions-list?responsible_id=${responsible_id}">View Corrective Actions</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Error submitting bulk corrective actions:", err);
    res.status(500).send(`<h2 style="color:red;">Error: ${err.message}</h2>`);
  }
});
// Generate consolidated corrective action email with ALL KPIs below target
const generateConsolidatedCorrectiveActionEmail = ({ responsible, week, kpisWithActions }) => {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>Corrective Actions Required</title></head>
  <body style="font-family:'Segoe UI',sans-serif;background:#f4f4f4;padding:20px;">
    <div style="max-width:700px;margin:0 auto;background:#fff;padding:25px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="text-align:center;margin-bottom:30px;">
        <div style="width:90px;height:90px;margin:0 auto 15px;background:#ff9800;border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:45px;">⚠️</span>
        </div>
        <h2 style="color:#d32f2f;font-size:24px;margin:0;">Corrective Actions Required</h2>
        <p style="color:#666;font-size:14px;margin:10px 0 0 0;">Week ${week} - Multiple KPIs Below Target</p>
      </div>
      
      <!-- Responsible Info -->
      <div style="background:#f8f9fa;padding:20px;border-radius:6px;margin-bottom:25px;border-left:4px solid #d32f2f;">
        <div style="margin-bottom:12px;">
          <span style="font-weight:600;color:#333;font-size:13px;">Responsible: </span>
          <span style="color:#666;font-size:13px;">${responsible.name}</span>
        </div>
        <div style="margin-bottom:12px;">
          <span style="font-weight:600;color:#333;font-size:13px;">Plant: </span>
          <span style="color:#666;font-size:13px;">${responsible.plant_name}</span>
        </div>
        <div>
          <span style="font-weight:600;color:#333;font-size:13px;">Department: </span>
          <span style="color:#666;font-size:13px;">${responsible.department_name}</span>
        </div>
      </div>
      
      <!-- Summary Badge -->
      <div style="background:#fff3e0;padding:15px;border-radius:6px;margin-bottom:25px;text-align:center;border:2px solid #ff9800;">
        <span style="font-size:32px;font-weight:700;color:#d32f2f;">${kpisWithActions.length}</span>
        <span style="font-size:14px;color:#666;display:block;margin-top:5px;">KPIs Requiring Corrective Action</span>
      </div>
      
      <!-- KPIs List -->
      <div style="margin-bottom:25px;">
        <h3 style="color:#333;font-size:16px;margin-bottom:15px;border-bottom:2px solid #e0e0e0;padding-bottom:8px;">
          📊 Performance Summary
        </h3>
        
        ${kpisWithActions.map((kpi, index) => `
        <div style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:15px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
            <div style="flex:1;">
              <div style="font-weight:600;color:#333;font-size:14px;margin-bottom:5px;">
                ${index + 1}. ${kpi.indicator_title}
              </div>
              ${kpi.indicator_sub_title ? `
              <div style="color:#666;font-size:12px;margin-bottom:8px;">
                ${kpi.indicator_sub_title}
              </div>
              ` : ''}
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:white;padding:12px;border-radius:4px;">
            <div style="text-align:center;">
              <div style="font-size:10px;color:#666;margin-bottom:4px;text-transform:uppercase;">Current</div>
              <div style="font-size:18px;font-weight:700;color:#d32f2f;">${kpi.value} ${kpi.unit || ''}</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:10px;color:#666;margin-bottom:4px;text-transform:uppercase;">Target</div>
              <div style="font-size:18px;font-weight:700;color:#4caf50;">${kpi.target_value} ${kpi.unit || ''}</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:10px;color:#666;margin-bottom:4px;text-transform:uppercase;">Gap</div>
              <div style="font-size:18px;font-weight:700;color:#ff9800;">
                ${(parseFloat(kpi.target_value) - parseFloat(kpi.value)).toFixed(2)} ${kpi.unit || ''}
              </div>
            </div>
          </div>
        </div>
        `).join('')}
      </div>
      
      <!-- Action Required Section -->
      <div style="background:#e3f2fd;padding:20px;border-radius:6px;margin-bottom:25px;">
        <h3 style="color:#1976d2;font-size:15px;margin:0 0 12px 0;">📝 What You Need To Do</h3>
        <ul style="margin:0;padding-left:20px;color:#555;font-size:13px;line-height:1.8;">
          <li>Click the button below to access the corrective action form</li>
          <li>Document the root cause for each underperforming KPI</li>
          <li>Describe the implemented solutions</li>
          <li>Provide evidence of improvement actions</li>
          <li><strong>Complete within 24 hours</strong></li>
        </ul>
      </div>
      
      <!-- CTA Button -->
<div style="text-align:center;margin:30px 0;">
  <a href="http://localhost:5000/corrective-actions-bulk?responsible_id=${responsible.responsible_id}&week=${week}"
     style="display:inline-block;padding:16px 35px;background:#d32f2f;color:white;
            border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;
            box-shadow:0 4px 10px rgba(211,47,47,0.3);">
    📝 Complete Corrective Actions (${kpisWithActions.length})
  </a>
</div>
      
      <!-- Footer -->
      <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e0e0e0;text-align:center;">
        <p style="font-size:11px;color:#999;margin:0;line-height:1.6;">
          This is an automated alert from AVOCarbon KPI System<br>
          <strong>Week ${week}</strong> • Generated on ${new Date().toLocaleDateString()}<br>
          For assistance, contact: <a href="mailto:administration.STS@avocarbon.com" style="color:#0078D7;">administration.STS@avocarbon.com</a>
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
};

// Send consolidated corrective action email
const sendConsolidatedCorrectiveActionEmail = async (responsibleId, week) => {
  try {
    // Get responsible info
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

    // Get all open corrective actions with KPI details
    const actionsRes = await pool.query(
      `SELECT ca.corrective_action_id, ca.kpi_id, ca.week,
              k.indicator_title, k.indicator_sub_title, k.unit, k.target_value,
              kv.value
       FROM public.corrective_actions ca
       JOIN public."Kpi" k ON ca.kpi_id = k.kpi_id
       LEFT JOIN public.kpi_values kv ON ca.kpi_id = kv.kpi_id 
         AND kv.responsible_id = ca.responsible_id 
         AND kv.week = ca.week
       WHERE ca.responsible_id = $1 
         AND ca.week = $2 
         AND ca.status = 'Open'
       ORDER BY k.indicator_title`,
      [responsibleId, week]
    );

    if (actionsRes.rows.length === 0) {
      console.log(`No open corrective actions for responsible ${responsibleId}, week ${week}`);
      return null;
    }

    const kpisWithActions = actionsRes.rows;

    const html = generateConsolidatedCorrectiveActionEmail({
      responsible,
      week,
      kpisWithActions
    });

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: '"AVOCarbon Quality System" <administration.STS@avocarbon.com>',
      to: responsible.email,
      subject: `⚠️ ${kpisWithActions.length} Corrective Action${kpisWithActions.length > 1 ? 's' : ''} Required - Week ${week}`,
      html,
    });

    console.log(`✅ Consolidated corrective action email sent to ${responsible.email} (${kpisWithActions.length} KPIs)`);
    return info;
  } catch (err) {
    console.error(`❌ Failed to send consolidated corrective action email:`, err.message);
    throw err;
  }
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

    // Arrays to collect updates
    const targetUpdates = [];
    let hasCorrectiveActions = false;

    for (let item of kpiValues) {
      const oldRes = await pool.query(
        `SELECT value, kpi_id FROM public."kpi_values" WHERE kpi_values_id = $1`,
        [item.kpi_values_id]
      );

      if (oldRes.rows.length) {
        const { value: old_value, kpi_id } = oldRes.rows[0];

        await pool.query(
          `INSERT INTO public.kpi_values_hist26 
          (kpi_values_id, responsible_id, kpi_id, week, old_value, new_value)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [item.kpi_values_id, responsible_id, kpi_id, week, old_value, item.value]
        );

        await pool.query(
          `UPDATE public."kpi_values" SET value = $1 WHERE kpi_values_id = $2`,
          [item.value, item.kpi_values_id]
        );

        // Get the latest hist_id
        const histRes = await pool.query(
          `SELECT hist_id FROM public.kpi_values_hist26 
           WHERE kpi_values_id = $1 
             AND responsible_id = $2 
             AND kpi_id = $3 
             AND week = $4
           ORDER BY updated_at DESC LIMIT 1`,
          [item.kpi_values_id, responsible_id, kpi_id, week]
        );

        // Check and trigger actions (collects updates but doesn't send emails)
        if (histRes.rows.length > 0) {
          const histId = histRes.rows[0].hist_id;
          const result = await checkAndTriggerCorrectiveActions(responsible_id, kpi_id, week, item.value, histId);

          // Collect target update if it happened
          if (result.targetUpdated && result.updateInfo) {
            targetUpdates.push(result.updateInfo);
          }

          // Check if corrective action was created
          if (!result.targetUpdated) {
            const caCheck = await pool.query(
              `SELECT corrective_action_id FROM public.corrective_actions
               WHERE responsible_id = $1 AND kpi_id = $2 AND week = $3 AND status = 'Open'`,
              [responsible_id, kpi_id, week]
            );
            if (caCheck.rows.length > 0) {
              hasCorrectiveActions = true;
            }
          }
        }
      }
    }

    // ===== SEND ONE CONSOLIDATED EMAIL FOR TARGET UPDATES =====
    if (targetUpdates.length > 0) {
      await sendConsolidatedTargetUpdateEmail(responsible_id, week, targetUpdates);
    }

    // ===== SEND ONE CONSOLIDATED EMAIL FOR CORRECTIVE ACTIONS =====
    if (hasCorrectiveActions) {
      await sendConsolidatedCorrectiveActionEmail(responsible_id, week);
    }

    // Determine success message based on what happened
    let successMessage = `<h1>✅ KPI Submitted Successfully!</h1>`;
    let notifications = [];

    if (targetUpdates.length > 0) {
      notifications.push(`🎯 <strong>${targetUpdates.length} KPI target${targetUpdates.length > 1 ? 's' : ''} updated</strong> - You will receive a consolidated email`);
    }

    if (hasCorrectiveActions) {
      notifications.push(`⚠️ <strong>Corrective actions required</strong> - You will receive a consolidated email`);
    }

    if (notifications.length === 0) {
      notifications.push(`📊 All KPIs are within targets`);
    }

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
            max-width:600px;
          }
          h1 { color:#28a745; font-size:28px; margin-bottom:20px; }
          p { font-size:16px; color:#333; margin-bottom:10px; }
          .notifications {
            background:#f8f9fa;
            padding:20px;
            border-radius:8px;
            margin:20px 0;
            text-align:left;
          }
          .notification-item {
            display:flex;
            align-items:center;
            margin:10px 0;
            padding:10px;
            background:white;
            border-radius:6px;
          }
          .notification-icon {
            font-size:20px;
            margin-right:10px;
          }
          .notification-text {
            flex:1;
          }
          .btn {
            display:inline-block;
            padding:12px 25px;
            background:#0078D7;
            color:white;
            text-decoration:none;
            border-radius:6px;
            font-weight:bold;
            margin:5px;
          }
          .btn:hover { background:#005ea6; }
        </style>
      </head>
      <body>
        <div class="success-container">
          ${successMessage}
          <p>Your KPI values for ${week} have been saved.</p>
          
          <div class="notifications">
            <p><strong>📧 Email Notifications:</strong></p>
            ${notifications.map(notif => `
              <div class="notification-item">
                <div class="notification-text">${notif}</div>
              </div>
            `).join('')}
          </div>
          
          <a href="/dashboard?responsible_id=${responsible_id}" class="btn">Go to Dashboard</a>
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
// ---------- Modern KPI Form with Loading Spinner ----------
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
          
          /* Submit Button Styles */
          .submit-btn {
            background: #0078D7;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            margin-top: 20px;
            min-height: 48px;
            gap: 10px;
          }
          .submit-btn:hover:not(:disabled) {
            background: #005ea6;
          }
          .submit-btn:disabled {
            background: #6c757d;
            cursor: not-allowed;
            opacity: 0.8;
          }
          
          /* Loading Spinner */
          .spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
          }
          
          .submit-text {
            display: block;
          }
          
          .submitting .spinner {
            display: block;
          }
          
          .submitting .submit-text {
            display: none;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .unit-label {
            color: #888;
            font-size: 12px;
            margin-top: 5px;
          }
          
          /* Overlay for preventing interaction */
          .form-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.95);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(3px);
          }
          
          .overlay-spinner {
            width: 60px;
            height: 60px;
            border: 5px solid #f3f3f3;
            border-radius: 50%;
            border-top-color: #0078D7;
            animation: spin 1s linear infinite;
          }
          
          .overlay-message {
            margin-top: 20px;
            color: #0078D7;
            font-weight: 600;
            font-size: 18px;
          }
          
          .overlay-submessage {
            margin-top: 10px;
            color: #666;
            font-size: 14px;
            max-width: 300px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <!-- Loading Overlay -->
        <div class="form-overlay" id="loadingOverlay">
          <div style="text-align: center;">
            <div class="overlay-spinner"></div>
            <div class="overlay-message" id="overlayMessage">Submitting KPI Values...</div>
            <div class="overlay-submessage" id="overlaySubmessage">Please wait while we process your submission</div>
          </div>
        </div>
        
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
              <form id="kpiForm" action="/redirect" method="GET">
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
                      required
                    />
                    ${kpi.unit ? `<div class="unit-label">Unit: ${kpi.unit}</div>` : ''}
                  </div>
                `).join('')}
                <button type="submit" id="submitBtn" class="submit-btn">
                  <span class="spinner" id="buttonSpinner"></span>
                  <span class="submit-text" id="submitText">Submit KPI Values</span>
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('kpiForm');
            const submitBtn = document.getElementById('submitBtn');
            const buttonSpinner = document.getElementById('buttonSpinner');
            const submitText = document.getElementById('submitText');
            const loadingOverlay = document.getElementById('loadingOverlay');
            const overlayMessage = document.getElementById('overlayMessage');
            const overlaySubmessage = document.getElementById('overlaySubmessage');
            let isSubmitting = false;
            
            // Validate all inputs are filled before submission
            function validateForm() {
              const inputs = form.querySelectorAll('.kpi-input');
              let allValid = true;
              
              inputs.forEach(input => {
                const value = input.value.trim();
                if (!value || isNaN(parseFloat(value))) {
                  allValid = false;
                  input.style.borderColor = '#dc3545';
                  input.style.boxShadow = '0 0 0 2px rgba(220, 53, 69, 0.1)';
                } else {
                  input.style.borderColor = '#ddd';
                  input.style.boxShadow = '';
                }
              });
              
              return allValid;
            }
            
            // Show loading state
            function showLoading() {
              isSubmitting = true;
              submitBtn.disabled = true;
              submitBtn.classList.add('submitting');
              loadingOverlay.style.display = 'flex';
            }
            
            // Hide loading state
            function hideLoading() {
              isSubmitting = false;
              submitBtn.disabled = false;
              submitBtn.classList.remove('submitting');
              loadingOverlay.style.display = 'none';
              overlayMessage.textContent = 'Submitting KPI Values...';
              overlayMessage.style.color = '#0078D7';
              overlaySubmessage.textContent = 'Please wait while we process your submission';
            }
            
            // Show error state
            function showError(message) {
              overlayMessage.textContent = 'Submission Failed';
              overlayMessage.style.color = '#dc3545';
              overlaySubmessage.textContent = message;
              
              // Change button to retry state
              submitBtn.innerHTML = '<span class="submit-text">Retry Submission</span>';
              submitBtn.style.background = '#dc3545';
              submitBtn.disabled = false;
              submitBtn.classList.remove('submitting');
              
              // Re-enable inputs
              const inputs = form.querySelectorAll('input');
              inputs.forEach(input => {
                input.disabled = false;
              });
              
              // Auto-hide overlay after 5 seconds
              setTimeout(() => {
                hideLoading();
                submitBtn.innerHTML = '<span class="spinner" id="buttonSpinner"></span><span class="submit-text" id="submitText">Submit KPI Values</span>';
                submitBtn.style.background = '#0078D7';
                // Re-attach event listeners
                buttonSpinner = document.getElementById('buttonSpinner');
                submitText = document.getElementById('submitText');
              }, 5000);
            }
            
            form.addEventListener('submit', function(e) {
              e.preventDefault();
              
              if (isSubmitting) {
                console.log('Already submitting, ignoring click');
                return false;
              }
              
              // Validate form
              if (!validateForm()) {
                // Show error in overlay instead of alert
                loadingOverlay.style.display = 'flex';
                overlayMessage.textContent = 'Validation Error';
                overlayMessage.style.color = '#dc3545';
                overlaySubmessage.textContent = 'Please fill in all KPI values with valid numbers';
                
                // Hide overlay after 3 seconds
                setTimeout(() => {
                  loadingOverlay.style.display = 'none';
                }, 3000);
                return false;
              }
              
              // Show loading state IMMEDIATELY
              showLoading();
              
              // Get form data
              const formData = new FormData(form);
              const params = new URLSearchParams();
              
              // Add all form data to params
              for (const [key, value] of formData.entries()) {
                params.append(key, value);
              }
              
              // Store submission time in localStorage to prevent back-button resubmission
              const submissionId = 'kpi_submission_' + Date.now();
              localStorage.setItem('last_kpi_submission', submissionId);
              
              // Disable all inputs
              const inputs = form.querySelectorAll('input');
              inputs.forEach(input => {
                input.disabled = true;
              });
              
              // Show processing message
              overlayMessage.textContent = 'Processing submission...';
              overlaySubmessage.textContent = 'Saving your KPI values to the database';
              
              // Submit the form programmatically
              fetch(form.action + '?' + params.toString(), {
                method: 'GET',
                headers: {
                  'Accept': 'text/html'
                }
              })
              .then(response => {
                if (response.ok) {
                  return response.text();
                }
                throw new Error('Network response was not ok. Status: ' + response.status);
              })
              .then(html => {
                // Replace entire page with response
                document.open();
                document.write(html);
                document.close();
              })
              .catch(error => {
                console.error('Error:', error);
                showError(error.message || 'Network error. Please check your connection and try again.');
              });
              
              return false;
            });
            
            // Clear validation on input
            const inputs = form.querySelectorAll('.kpi-input');
            inputs.forEach(input => {
              input.addEventListener('input', function() {
                this.style.borderColor = '#ddd';
                this.style.boxShadow = '';
              });
              
              // Allow only numbers and decimals
              input.addEventListener('keypress', function(e) {
                const charCode = e.which ? e.which : e.keyCode;
                if (charCode === 46) {
                  // Allow decimal point if not already present
                  if (this.value.indexOf('.') > -1) {
                    e.preventDefault();
                  }
                  return;
                }
                if (charCode < 48 || charCode > 57) {
                  e.preventDefault();
                }
              });
              
              // Also allow paste and validate
              input.addEventListener('paste', function(e) {
                setTimeout(() => {
                  const value = this.value;
                  // Remove any non-numeric characters except decimal point
                  this.value = value.replace(/[^0-9.]/g, '');
                  // Ensure only one decimal point
                  const parts = this.value.split('.');
                  if (parts.length > 2) {
                    this.value = parts[0] + '.' + parts.slice(1).join('');
                  }
                }, 0);
              });
            });
            
            // Prevent form resubmission on page refresh/back
            if (localStorage.getItem('last_kpi_submission')) {
              const lastSubmission = localStorage.getItem('last_kpi_submission');
              const submissionTime = parseInt(lastSubmission.split('_')[2]);
              const now = Date.now();
              
              // If submission was less than 30 seconds ago, disable form
              if (now - submissionTime < 30000) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="submit-text">Already Submitted (Please wait 30 seconds)</span>';
                submitBtn.style.background = '#6c757d';
                
                setTimeout(() => {
                  localStorage.removeItem('last_kpi_submission');
                  submitBtn.disabled = false;
                  submitBtn.innerHTML = '<span class="spinner" id="buttonSpinner"></span><span class="submit-text" id="submitText">Submit KPI Values</span>';
                  submitBtn.style.background = '#0078D7';
                }, 30000);
              } else {
                localStorage.removeItem('last_kpi_submission');
              }
            }
          });
        </script>
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

cron.schedule(
  "16 9 * * 1",
  async () => {
    const lockId = 'kpi_form_email_job';
    const lock = await acquireJobLock(lockId, 15); // 15 minute TTL

    // Exit immediately if we didn't get the lock
    if (!lock.acquired) {
      console.log(`⏭️ [KPI Form Email] Skipping - lock held by another instance`);
      return;
    }

    try {
      const forcedWeek = "2026-Week7"; // or dynamically compute current week

      // ✅ Send only to responsibles who actually have KPI records for that week
      const resps = await pool.query(`
        SELECT DISTINCT r.responsible_id
        FROM public."Responsible" r
        JOIN public.kpi_values kv ON kv.responsible_id = r.responsible_id
        WHERE kv.week = $1
      `, [forcedWeek]);

      console.log(`📧 [KPI Form Email] Sending to ${resps.rows.length} responsibles for week ${forcedWeek}...`);

      for (let r of resps.rows) {
        await sendKPIEmail(r.responsible_id, forcedWeek);
      }

      console.log(`✅ [KPI Form Email] Successfully sent ${resps.rows.length} emails`);
    } catch (err) {
      console.error("❌ [KPI Form Email] Error:", err.message);
    } finally {
      await releaseJobLock(lockId, lock.instanceId, lock.lockHash);
    }
  },
  { scheduled: true, timezone: "Africa/Tunis" }
);

// ---------- Generate HTML/CSS Charts ----------
const generateVerticalBarChart = (chartData) => {
  const {
    title,
    subtitle,
    unit,
    data,
    weekLabels,
    currentWeek,
    stats,
    target,
    min,
    max
  } = chartData;

  // ✅ Clean values - handle "None" strings from database
  const cleantarget = target !== null && target !== undefined && target !== 'None' && !isNaN(parseFloat(target)) ? parseFloat(target) : null;
  const cleanMin = min !== null && min !== undefined && min !== 'None' && !isNaN(parseFloat(min)) ? parseFloat(min) : null;
  const cleanMax = max !== null && max !== undefined && max !== 'None' && !isNaN(parseFloat(max)) ? parseFloat(max) : null;

  // ✅ FIX: Check if data is valid and has actual values
  const validData = data ? data.filter(val => val !== null && val !== undefined && !isNaN(parseFloat(val)) && parseFloat(val) > 0) : [];

  if (!data || data.length === 0 || validData.length === 0) {
    return `
      <table border="0" cellpadding="20" cellspacing="0" width="100%" style="margin: 20px 0; background: white; border-radius: 8px; border: 1px solid #e0e0e0;">
        <tr><td>
          <h3 style="margin: 0; color: #333; font-size: 16px; font-weight: 600;">${title}</h3>
          ${subtitle ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${subtitle}</p>` : ''}
          <p style="margin: 15px 0; color: #999; font-size: 14px;">No data available</p>
        </td></tr>
      </table>
    `;
  }

  // ✅ FIX: Safely get current value
  const currentValue = validData.length > 0 ? validData[validData.length - 1] : 0;
  const valueVstargetRatio = cleantarget && cleantarget > 0 ? currentValue / cleantarget : 0;
  const isValueExtremelySmall = valueVstargetRatio < 0.01;

  // ✅ HELPER: Format large numbers for display
  const formatLargeNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'k';
    }
    if (num < 1) return num.toFixed(2);
    if (num < 10) return num.toFixed(1);
    return num.toFixed(num % 1 === 0 ? 0 : 1);
  };

  //  UPDATED: Calculate Y-axis scaling with null checks
  const calculateYAxisScaling = () => {
    // Get all values that need to be displayed
    const allValues = [...validData];
    if (cleantarget !== null && cleantarget > 0) allValues.push(cleantarget);
    if (cleanMin !== null && cleanMin > 0) allValues.push(cleanMin);
    if (cleanMax !== null && cleanMax > 0) allValues.push(cleanMax);

    if (allValues.length === 0) {
      return {
        maxValue: 10,
        interval: 2,
        numSteps: 5,
        useDualScale: false
      };
    }

    const dataMax = Math.max(...allValues);
    const dataMin = Math.min(...allValues.filter(v => v > 0));

    // ✅ CRITICAL FIX: If value is extremely small compared to target
    if (isValueExtremelySmall && cleantarget && cleantarget > 0) {
      const valueBasedMax = Math.max(dataMax * 2, 10);
      return {
        maxValue: valueBasedMax,
        interval: valueBasedMax / 4,
        numSteps: 4,
        useDualScale: true,
        targetValue: cleantarget
      };
    }

    // Normal scaling for regular cases
    if (!cleantarget || cleantarget <= 0) {
      const numSteps = 5;
      const interval = Math.max(1, Math.ceil(dataMax / numSteps));
      const maxValue = interval * numSteps;
      return { maxValue, interval, numSteps, useDualScale: false };
    }

    const targetNum = cleantarget;

    // Determine scaling based on target value
    if (targetNum <= 10) {
      return {
        maxValue: Math.max(dataMax, Math.ceil(targetNum * 1.2)),
        interval: Math.ceil(targetNum / 3),
        numSteps: 3,
        useDualScale: false
      };
    }

    if (targetNum <= 50) {
      const rounded = Math.max(dataMax, Math.ceil(targetNum / 5) * 5);
      return {
        maxValue: rounded,
        interval: rounded / 4,
        numSteps: 4,
        useDualScale: false
      };
    }

    if (targetNum <= 200) {
      const rounded = Math.max(dataMax, Math.ceil(targetNum / 20) * 20);
      return {
        maxValue: rounded,
        interval: rounded / 4,
        numSteps: 4,
        useDualScale: false
      };
    }

    if (targetNum <= 1000) {
      const rounded = Math.max(dataMax, Math.ceil(targetNum / 100) * 100);
      return {
        maxValue: rounded,
        interval: rounded / 4,
        numSteps: 4,
        useDualScale: false
      };
    }

    // For very large targets
    const rounded = Math.max(dataMax, Math.ceil(targetNum / 500) * 500);
    return {
      maxValue: rounded,
      interval: rounded / 3,
      numSteps: 3,
      useDualScale: false
    };
  };

  // Calculate scaling
  const scaling = calculateYAxisScaling();
  const { maxValue, interval, numSteps, useDualScale } = scaling;
  const chartHeight = 180;
  const segmentHeight = chartHeight / numSteps;

  // ✅ IMPROVED: Generate Y-axis with special handling for small values
  const generateYAxis = () => {
    let yAxis = '';

    for (let i = numSteps; i >= 0; i--) {
      const value = i * interval;
      let displayValue = formatLargeNumber(value);

      // Special indicator for extremely small values
      if (useDualScale && i === numSteps && cleantarget) {
        displayValue += ` (target: ${formatLargeNumber(cleantarget)})`;
      }

      const tolerance = interval / 2;
      let indicators = '';

      if (cleantarget && Math.abs(value - cleantarget) < tolerance) indicators += ' ';
      if (cleanMax && Math.abs(value - cleanMax) < tolerance) indicators += ' 📈';
      if (cleanMin && Math.abs(value - cleanMin) < tolerance) indicators += ' 📉';

      yAxis += `
        <tr>
          <td height="${segmentHeight}" valign="top" align="right" 
              style="font-size: 10px; color: #666; padding-right: 8px;">
            ${displayValue}${indicators}
          </td>
        </tr>
      `;
    }

    // Add a note for extremely small values
    if (useDualScale) {
      yAxis += `
        <tr>
          <td height="20" valign="top" align="right" 
              style="font-size: 8px; color: #ff9800; padding-right: 8px; font-style: italic;">
            * Value scale ≠ target scale
          </td>
        </tr>
      `;
    }

    return yAxis;
  };

  // ✅ IMPROVED: Calculate segment positions with minimum bar height
  const getSegmentForValue = (value) => {
    if (!value || value <= 0 || isNaN(value)) return -1;
    return Math.round((parseFloat(value) / maxValue) * numSteps);
  };

  const targetSegment = getSegmentForValue(cleantarget);
  const maxSegment = cleanMax !== null ? getSegmentForValue(cleanMax) : -1;
  const minSegment = getSegmentForValue(cleanMin);

  // ✅ CRITICAL FIX: Calculate bar heights with MINIMUM VISIBLE HEIGHT
  const barSegmentHeights = data.map(value => {
    if (!value || value <= 0 || isNaN(value)) return 0;

    let segmentHeightRatio = (value / maxValue) * numSteps;

    // ENSURE MINIMUM VISIBLE HEIGHT: At least 2 segments for any non-zero value
    if (segmentHeightRatio < 0.5 && value > 0) {
      segmentHeightRatio = 0.5;
    }

    return Math.max(1, Math.round(segmentHeightRatio));
  });

  // ✅ UPDATED: Determine bar colors
  const getBarColor = (value) => {
    return '#0078D7';  // Sky blue (you can replace with any hex)
  };
  //  UPDATED: Generate chart with visible bars
  const generateChart = () => {
    let chart = '';

    // Start from one segment above max to show values, go down to 0 (X-axis)
    for (let seg = numSteps + 1; seg >= 0; seg--) {
      const hastarget = seg === targetSegment;
      const hasMax = cleanMax !== null && seg === maxSegment && cleanMax !== cleantarget;
      const hasMin = seg === minSegment;
      const hasLine = hastarget || hasMax || hasMin;

      // 🎯 Set dashed line color based on threshold type
      let lineColor = '';
      let lineStyle = '';
      if (hasLine) {
        lineStyle = '2px dashed';
        if (hastarget) lineColor = '#28a745';      // Green for target
        else if (hasMax) lineColor = '#ff9800';    // Orange for Max
        else if (hasMin) lineColor = '#dc3545';    // Red for Min
      }

      chart += '<tr>';

      data.forEach((value, idx) => {
        const barHeight = barSegmentHeights[idx];
        const barColor = getBarColor(value);
        const isExtremelySmall = value > 0 && value < (maxValue * 0.01);

        let cellContent = '';
        let cellBorder = '';

        if (hasLine) {
          cellBorder = `border-top: ${lineStyle} ${lineColor};`;
        }

        // Top area: value label
        if (seg === barHeight + 1 && barHeight > 0) {
          const displayVal = formatLargeNumber(value);
          cellContent = `
          <table border="0" cellpadding="2" cellspacing="0" width="100%">
            <tr><td align="center" style="font-size: 10px; font-weight: bold; color: #333;">
              ${displayVal}
            </td></tr>
          </table>
        `;
        }
        else if (seg > 0 && seg <= barHeight) {
          const actualBarHeight = Math.max(segmentHeight, 4);
          cellContent = `
          <table border="0" cellpadding="0" cellspacing="0" width="60" align="center">
            <tr>
              <td height="${actualBarHeight}" 
                  style="background-color: ${barColor}; 
                         border: none; 
                         padding: 0; 
                         margin: 0; 
                         font-size: 1px; 
                         line-height: ${actualBarHeight}px;
                         ${isExtremelySmall ? 'border: 1px solid #ff9800;' : ''}">
                &nbsp;
              </td>
            </tr>
          </table>
        `;
          if (isExtremelySmall && seg === 1) {
            cellContent += `
            <div style="position: relative; top: -2px; text-align: center;">
              <div style="display: inline-block; width: 6px; height: 6px; background: #ff9800; border-radius: 50%;"></div>
            </div>
          `;
          }
        }
        else if (seg === 0) {
          const w = weekLabels[idx] || `W${idx + 1}`;
          cellContent = `
          <table border="0" cellpadding="2" cellspacing="0" width="100%">
            <tr><td align="center" style="font-size: 10px; color: #666; padding-top: 6px;">
              ${w}
            </td></tr>
          </table>
        `;
        }

        chart += `
        <td align="center" width="${100 / data.length}%" 
            style="padding: 0 4px; vertical-align: middle; ${cellBorder} 
                   height: ${seg >= 0 ? segmentHeight : 'auto'}px; 
                   line-height: 0; font-size: 0;
                   position: relative;">
          ${cellContent}
        </td>
      `;
      });

      chart += '</tr>';
    }

    return chart;
  };

  // Add warning for extremely small values
  let smallValueWarning = '';
  if (isValueExtremelySmall && cleantarget) {
    smallValueWarning = `
      <div style="margin: 10px 0; padding: 10px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
        <div style="font-size: 12px; color: #856404; font-weight: 600; margin-bottom: 5px;">
          ⚠️ Note: Current value (${formatLargeNumber(currentValue)}) is very small compared to target (${formatLargeNumber(cleantarget)})
        </div>
      </div>
    `;
  }

  // ✅ FIX: Safely format stats values
  const safeStats = {
    current: stats && stats.current ? formatNumber(stats.current) : 'N/A',
    average: stats && stats.average ? formatNumber(stats.average) : 'N/A',
    trend: stats && stats.trend ? stats.trend : '0.0%',
    dataPoints: stats && stats.dataPoints ? stats.dataPoints : data.length
  };

  // ✅ Return HTML with visible bars
  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background: white; border-radius: 8px; border: 1px solid #e0e0e0; font-family: Arial, sans-serif;">
      <tr><td style="padding: 20px;">
        
        <!-- Header -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
          <tr><td>
            <h3 style="margin: 0; color: #333; font-size: 16px; font-weight: 600;">${title}</h3>
            ${subtitle ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${subtitle}</p>` : ''}
            ${unit ? `<p style="margin: 5px 0 0 0; color: #888; font-size: 12px;">Unit: ${unit}</p>` : ''}
          
          </td></tr>
        </table>

     <!-- Target / Max / Min summary line - CENTERED -->
     <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin-bottom: 15px;">
     <tr>
      ${cleantarget !== null ? `
      <td style="font-size: 12px; padding: 0 10px;">
      <span style="font-weight: 600; color: #28a745;">Target:</span> ${formatLargeNumber(cleantarget)}
      </td>` : ''}
      ${cleanMax !== null ? `
      <td style="font-size: 12px; padding: 0 10px;">
       <span style="font-weight: 600; color: #ff9800;">Max:</span> ${formatLargeNumber(cleanMax)}
       </td>` : ''}
      ${cleanMin !== null ? `
       <td style="font-size: 12px; padding: 0 10px;">
       <span style="font-weight: 600; color: #dc3545;">Min:</span> ${formatLargeNumber(cleanMin)}
       </td>` : ''}
        </tr>
        </table>
        
        <!-- Chart -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="50" valign="top" style="border-right: 2px solid #ccc; padding-right: 10px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="height: ${chartHeight}px;">
                ${generateYAxis()}
              </table>
            </td>
            <td valign="top" style="padding-left: 10px; border-bottom: 2px solid #ccc;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${generateChart()}
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Stats -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #FFFFFF; border-radius: 6px; margin-top: 20px;">
          <tr>
            <td width="20%" align="center" style="border-right: 1px solid #e0e0e0; padding: 10px;">
              <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px;">CURRENT</div>
              <div style="font-size: 20px; font-weight: 700; color: #4CAF50;">${safeStats.current}</div>
              <div style="font-size: 10px; color: #999;">${currentWeek ? currentWeek.replace('2026-Week', 'Week ') : 'Current'}</div>
            </td>
            <td width="20%" align="center" style="padding: 10px; border-radius: 12px;">
              <div style="font-size: 11px; color: #8971df; text-transform: uppercase; margin-bottom: 5px; font-weight: 600;">TARGET</div>
              <div style="font-size: 20px; font-weight: 700; color: ${cleantarget !== null ? '#4CAF50' : '#999'};">
                ${cleantarget !== null ? formatLargeNumber(cleantarget) : 'N/A'}
              </div>
              <div style="font-size: 10px; color: rgba(255,255,255,0.7);">Achievement</div>
            </td>
            <td width="20%" align="center" style="border-left: 1px solid #e0e0e0; padding: 10px;">
              <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px;">AVERAGE</div>
              <div style="font-size: 20px; font-weight: 700; color: #8971df;">${safeStats.average}</div>
              <div style="font-size: 10px; color: #999;">${safeStats.dataPoints} periods</div>
            </td>
          
          </tr>
        </table>
        
        <!-- Legend -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0;">
          <tr><td align="center">
            <table border="0" cellpadding="8" cellspacing="0">
              <tr>
                ${cleantarget !== null ? `
                  <td><table border="0" cellpadding="0" cellspacing="5"><tr>
                    <td width="20" height="12" style="border-top: 2px dashed #28a745;"></td>
                    <td style="font-size: 11px; color: #666;">target</td>
                  </tr></table></td>
                ` : ''}
         
                ${cleanMax !== null ? `
                  <td><table border="0" cellpadding="0" cellspacing="5"><tr>
                    <td width="20" height="12" style="border-top: 2px dashed #ff9800;"></td>
                    <td style="font-size: 11px; color: #666;">Max</td>
                  </tr></table></td>
                ` : ''}
                ${cleanMin !== null ? `
                  <td><table border="0" cellpadding="0" cellspacing="5"><tr>
                    <td width="20" height="12" style="border-top: 2px dashed #dc3545;"></td>
                    <td style="font-size: 11px; color: #666;">Min</td>
                  </tr></table></td>
                ` : ''}
                ${isValueExtremelySmall ? `
                <td><table border="0" cellpadding="0" cellspacing="5"><tr>
                  <td width="12" height="12" style="background-color: #ff9800; border: 1px solid #ff9800;"></td>
                  <td style="font-size: 11px; color: #666;">Exaggerated for visibility</td>
                </tr></table></td>
                ` : ''}
              </tr>
            </table>
          </td></tr>
        </table>
        
      </td></tr>
    </table>
  `;
};

const generateWeeklyReportData = async (responsibleId, reportWeek) => {
  try {
    // Get historical data from kpi_values_hist26 table WITH threshold values
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
          k.target_value,
          k.minimum_value,
          k.maximum_value,
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
          target: row.target_value,
          min: row.minimum_value,
          max: row.maximum_value,
          weeklyData: new Map()
        };
      }

      // Parse value safely
      const value = parseFloat(row.new_value);
      if (!isNaN(value) && value > 0) {
        kpisData[kpiId].weeklyData.set(row.week, value);
        weekLabelsSet.add(row.week);
      }
    });

    // Convert week labels set to sorted array
    const weekLabels = Array.from(weekLabelsSet).sort((a, b) => {
      const [yearA, weekA] = a.includes('Week')
        ? [parseInt(a.split('-Week')[0]), parseInt(a.split('-Week')[1])]
        : [0, parseInt(a.replace('Week', ''))];

      const [yearB, weekB] = b.includes('Week')
        ? [parseInt(b.split('-Week')[0]), parseInt(b.split('-Week')[1])]
        : [0, parseInt(b.replace('Week', ''))];

      if (yearA !== yearB) return yearA - yearB;
      return weekA - weekB;
    });

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
      const validDataPoints = dataPoints.filter(val => val > 0 && !isNaN(val));
      if (validDataPoints.length === 0) {
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
        continue;
      }

      // Calculate statistics
      const nonZeroData = validDataPoints;

      const avg = nonZeroData.reduce((sum, val) => sum + val, 0) / nonZeroData.length;
      const maxValue = Math.max(...nonZeroData);
      const minValue = Math.min(...nonZeroData);

      // Calculate trend (week-over-week change) safely
      let trend = '0.0%';
      if (previousValue > 0 && currentValue > 0) {
        const trendValue = ((currentValue - previousValue) / previousValue) * 100;
        trend = (trendValue >= 0 ? '+' : '') + trendValue.toFixed(1) + '%';
      }

      // Format week labels for display
      const displayWeekLabels = weekLabels.map(week => {
        if (week.includes('2026-Week')) {
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
        target: kpiData.target,
        min: kpiData.min,
        max: kpiData.max,
        stats: {
          current: currentValue,
          previous: previousValue > 0 ? previousValue : null,
          average: avg,
          max: maxValue,
          min: minValue > 0 ? minValue : null,
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

// ---------- Schedule Weekly Reports  to send it for each responsible  ----------
// ---------- Schedule Weekly Reports ----------
// ---------- Schedule Weekly Reports ----------
cron.schedule(
  "20 9 * * 1", // Every Friday at 8:16 PM
  async () => {
    const lockId = 'weekly_report_job';
    const lock = await acquireJobLock(lockId, 60); // 60 minute TTL (longer job)

    // Exit immediately if we didn't get the lock
    if (!lock.acquired) {
      console.log(`⏭️ [Weekly Report] Skipping - lock held by another instance`);
      return;
    }

    try {
      // Calculate current week
      const now = new Date();
      const year = now.getFullYear();

      // Get week number function
      const getWeekNumber = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
      };

      const weekNumber = getWeekNumber(now);
      const currentWeek = `${year}-Week${weekNumber}`;
      const previousWeek = `${year}-Week${weekNumber - 1}`;

      console.log(`📊 [Weekly Report] Current week: ${currentWeek}, Reporting on: ${previousWeek}`);

      // Get all responsibles who have ANY KPI history data
      const resps = await pool.query(`
        SELECT DISTINCT r.responsible_id, r.email, r.name
        FROM public."Responsible" r
        JOIN public.kpi_values_hist26 h ON r.responsible_id = h.responsible_id
        WHERE r.email IS NOT NULL
          AND r.email != ''
        GROUP BY r.responsible_id, r.email, r.name
        HAVING COUNT(h.hist_id) > 0
        ORDER BY r.responsible_id
      `);

      console.log(`📊 [Weekly Report] Sending to ${resps.rows.length} responsibles for week ${previousWeek}...`);

      const results = [];
      for (const [index, resp] of resps.rows.entries()) {
        try {
          await generateWeeklyReportEmail(resp.responsible_id, previousWeek);
          console.log(`  ✅ [${index + 1}/${resps.rows.length}] Sent to ${resp.name} (${resp.email})`);
          results.push({
            responsible_id: resp.responsible_id,
            name: resp.name,
            status: 'success'
          });

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (err) {
          console.error(`  ❌ [${index + 1}/${resps.rows.length}] Failed for ${resp.name}:`, err.message);
          results.push({
            responsible_id: resp.responsible_id,
            name: resp.name,
            status: 'error',
            message: err.message
          });
        }
      }

      const succeeded = results.filter(r => r.status === 'success').length;
      console.log(`✅ [Weekly Report] Completed. Sent: ${succeeded}/${results.length}`);

    } catch (error) {
      console.error("❌ [Weekly Report] Error:", error.message);
    } finally {
      await releaseJobLock(lockId, lock.instanceId, lock.lockHash);
    }
  },
  {
    scheduled: true,
    timezone: "Africa/Tunis"
  }
);



// ========== FIXED createIndividualKPIChart FUNCTION ==========
const createIndividualKPIChart = (kpi) => {
 
  const weeklyData = kpi.weeklyData || { weeks: [], values: [] };
  const weeks = weeklyData.weeks.slice(0, 5).reverse();
  const values = weeklyData.values.slice(0, 5).reverse();

  // ----- No data / invalid data -----
  if (!values.length || values.every(v => v <= 0)) {
    return `<table ...>... no data ...</table>`;  // keep your fallback
  }
  const dataValues = values.filter(v => v > 0 && !isNaN(v)).map(v => parseFloat(v));
  if (dataValues.length === 0) return `<table ...>... invalid data ...</table>`;

  // ----- thresholds -----
  const targetNum = kpi.target_value && kpi.target_value !== 'None' ? parseFloat(kpi.target_value) : null;
  const minNum = kpi.minimum_value && kpi.minimum_value !== 'None' ? parseFloat(kpi.minimum_value) : null;
  const maxNum = kpi.maximum_value && kpi.maximum_value !== 'None' ? parseFloat(kpi.maximum_value) : null;

  // ----- trend -----
  const currentVal = values[values.length - 1] || 0;
  const prevVal = values.length >= 2 ? values[values.length - 2] : 0;
  const trendRaw = prevVal > 0 ? ((currentVal - prevVal) / prevVal * 100) : 0;
  const trendIcon = Math.abs(trendRaw) < 0.1 ? '→' : (trendRaw > 0 ? '↗' : '↘');
  const trendColor = trendRaw >= 0 ? '#28a745' : '#dc3545';
  const trendBg = trendRaw >= 0 ? '#d4edda' : '#f8d7da';
  const trendDisplay = `${trendRaw >= 0 ? '+' : ''}${trendRaw.toFixed(1)}%`;

  // ----- chart dimensions -----
  const chartHeight = 200;   // px
  const numRows = chartHeight; // 1 row per pixel
  const cellHeight = 1;     // px

  // ----- scale: all values and thresholds -----
  const allValues = [...dataValues];
  if (targetNum) allValues.push(targetNum);
  if (maxNum) allValues.push(maxNum);
  if (minNum) allValues.push(minNum);
  const maxData = Math.max(...allValues);
  const chartMax = (() => {
    const withPad = maxData * 1.2;
    if (withPad <= 10) return 10;
    if (withPad <= 20) return 20;
    if (withPad <= 50) return 50;
    if (withPad <= 100) return 100;
    if (withPad <= 200) return 200;
    if (withPad <= 500) return 500;
    if (withPad <= 1000) return 1000;
    if (withPad <= 2000) return 2000;
    if (withPad <= 5000) return 5000;
    return Math.ceil(withPad / 10000) * 10000;
  })();

  // ----- helper: value → Y pixel position (0 = top, chartHeight = bottom) -----
  const valueToY = (val) => {
    if (val <= 0 || isNaN(val)) return chartHeight;
    const pct = Math.min(100, (val / chartMax) * 100);
    return (1 - pct / 100) * chartHeight;
  };

  // ----- helper: format number (no trailing .0) -----
  const formatNumber = (n) => {
    if (n == null || isNaN(n)) return '0';
    const num = parseFloat(n);
    if (Number.isInteger(num)) return num.toString();
    const f = num.toFixed(1);
    return f.endsWith('.0') ? f.slice(0, -2) : f;
  };

  // ----- Y‑axis: labels + threshold markers at exact Y positions -----
  const yAxisLabels = [];
  for (let i = 0; i <= 5; i++) {
    const val = (5 - i) / 5 * chartMax;
    const y = valueToY(val);
    yAxisLabels.push({ label: formatNumber(val), y });
  }

  const thresholds = [];
  if (targetNum) thresholds.push({ value: targetNum, label: 'Target', color: '#28a745', y: valueToY(targetNum) });
  if (maxNum) thresholds.push({ value: maxNum, label: 'Max', color: '#ff9800', y: valueToY(maxNum) });
  if (minNum) thresholds.push({ value: minNum, label: 'Min', color: '#dc3545', y: valueToY(minNum) });

  const yMarkers = [...yAxisLabels, ...thresholds.map(t => ({ isThreshold: true, ...t }))];

  // Build Y‑axis table (exactly chartHeight tall)
  let yAxisHTML = `<table cellpadding="0" cellspacing="0" border="0" width="60" height="${chartHeight}" style="border-collapse:collapse;">`;
  for (let row = 0; row < numRows; row++) {
    const rowTop = row * cellHeight;
    const rowBottom = (row + 1) * cellHeight;
    const marker = yMarkers.find(m => m.y >= rowTop && m.y < rowBottom);
    let content = '&nbsp;';
    if (marker) {
      if (marker.isThreshold) {
        content = `<span style="display:inline-block; width:8px; height:8px; background:${marker.color}; border-radius:50%; margin-right:4px;"></span>
                   <span style="font-size:9px; color:${marker.color}; font-weight:600;">${formatNumber(marker.value)}</span>`;
      } else {
        content = `<span style="font-size:10px; color:#666;">${marker.label}</span>`;
      }
    }
    yAxisHTML += `<tr><td height="${cellHeight}" valign="top" align="right" style="font-size:1px; line-height:1; padding-right:8px; border-right:2px solid #cbd5e1;">${content}</td></tr>`;
  }
  yAxisHTML += `</table>`;

  // ----- Prepare threshold rows for the bar table -----
  // Map each pixel row (0‑199) to the threshold line(s) that should be drawn there
  const thresholdAtRow = new Array(numRows).fill(null);
  thresholds.forEach(th => {
    // Round to nearest pixel row – best we can do in email
    const rowIndex = Math.round(th.y);
    if (rowIndex >= 0 && rowIndex < numRows) {
      if (!thresholdAtRow[rowIndex]) thresholdAtRow[rowIndex] = [];
      thresholdAtRow[rowIndex].push(th);
    }
  });

  // ----- Build bar chart table row by row -----
  const barGapPx = 8;        // horizontal gap between bars
  const colWidth = `${100 / values.length}%`;

  let barRows = '';
  for (let row = 0; row < numRows; row++) {
    const rowTop = row * cellHeight;
    const rowBottom = (row + 1) * cellHeight;

    // 1) Insert threshold line(s) for this row (if any)
    if (thresholdAtRow[row]) {
      thresholdAtRow[row].forEach(th => {
        barRows += `<tr style="height:0; line-height:0; font-size:0;">
          <td colspan="${values.length}" style="border-top:2px dashed ${th.color}; padding:0; margin:0;"></td>
        </tr>`;
      });
    }

    // 2) Normal bar row
    barRows += '<tr>';
    values.forEach((val, idx) => {
      const barTopY = valueToY(val);
      const isBarCell = (rowBottom > barTopY);
      const isTopEdge = (rowTop <= barTopY && rowBottom > barTopY);
      const displayValue = formatNumber(val);
      const isCurrent = idx === values.length - 1;

      let content = '';
      let tdStyle = `padding:0 ${barGapPx / 2}px; margin:0; height:${cellHeight}px; width:${colWidth}; line-height:0; font-size:0; vertical-align:bottom;`;

      if (isBarCell) {
        content = `<div style="background-color:#0078D7; height:${cellHeight}px; width:100%;"></div>`;
        if (isTopEdge) {
          content = `<div style="background-color:#0078D7; font-size:10px; font-weight:700; color:#fff; text-align:center; line-height:12px; height:${cellHeight}px;">${displayValue}</div>`;
        }
      } else {
        content = '<div style="height:' + cellHeight + 'px;">&nbsp;</div>';
      }

      barRows += `<td style="${tdStyle}">${content}</td>`;
    });
    barRows += '</tr>';
  }

  // Wrap bar rows in a table that is exactly chartHeight tall
  const barTable = `<table cellpadding="0" cellspacing="0" border="0" width="100%" height="${chartHeight}" style="border-collapse:collapse;">${barRows}</table>`;

  // ----- X‑axis table (placed directly below the bar table, no gap) -----
  const xAxisRow = `<tr>
    ${values.map((val, idx) => {
      const weekLabel = weeks[idx]?.replace('2026-Week', 'W') || `W${idx + 1}`;
      const isCurrent = idx === values.length - 1;
      return `<td align="center" style="padding:0 ${barGapPx / 2}px; border-top:2px solid #cbd5e1; font-size:10px; color:#666; font-weight:${isCurrent ? '700' : '500'}; line-height:14px; padding-top:6px;">
                ${weekLabel}
                ${isCurrent ? '<div style="width:6px;height:6px;background:#0078D7;border-radius:50%;margin:2px auto 0;"></div>' : ''}
              </td>`;
    }).join('')}
  </tr>`;
  const xAxisTable = `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">${xAxisRow}</table>`;

  // ----- statistics -----
  const averageValue = dataValues.reduce((a, b) => a + b, 0) / dataValues.length;
  const currentValue = values[values.length - 1] || 0;
  const prevValue = values.length >= 2 ? values[values.length - 2] : 0;
  const trendVal = prevValue > 0 ? ((currentValue - prevValue) / prevValue * 100) : 0;
  const trendClr = trendVal >= 0 ? '#4CAF50' : '#F44336';
  const trendDisp = `${trendVal >= 0 ? '+' : ''}${trendVal.toFixed(1)}%`;

  // ----- threshold badges (optional) -----
  const badgeHTML = thresholds.map(th => {
    const bg = th.label === 'Target' ? '#e8f5e9' : (th.label === 'Max' ? '#fff3e0' : '#ffebee');
    return `<td style="padding:0 4px 0 0;">
              <div style="display:inline-block; background:${bg}; border:1px solid ${th.color}; border-radius:12px; padding:4px 10px;">
                <span style="font-size:10px; color:${th.color}; font-weight:600;">
                  ${th.label === 'Target' ? '🎯' : (th.label === 'Max' ? '📈' : '📉')} ${th.label}: ${formatNumber(th.value)}
                </span>
              </div>
            </td>`;
  }).join('');

  // ----- FINAL HTML -----
  return `
<table border="0" cellpadding="0" cellspacing="0" width="100%"
       style="background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; margin-bottom:20px; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
  <tr>
    <td style="padding:20px;">

      <!-- HEADER -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">
        <tr>
          <td valign="top">
            <div style="font-weight:700; font-size:18px; color:#111827; margin-bottom:6px;">
              ${kpi.subtitle || kpi.title}
            </div>
            ${kpi.indicator_sub_title ? `<div style="font-size:13px; color:#6b7280; margin-bottom:8px;">${kpi.indicator_sub_title}</div>` : ''}
            ${thresholds.length ? `<table border="0" cellpadding="0" cellspacing="0"><tr>${badgeHTML}</tr></table>` : ''}
            ${kpi.unit ? `<div style="font-size:12px; color:#9ca3af; margin-top:8px;">Unit: ${kpi.unit}</div>` : ''}
          </td>
          <td align="right" valign="top" width="170">
            <table border="0" cellpadding="0" cellspacing="0" align="right" style="margin-bottom:8px;">
              <tr><td align="center" style="background:${trendBg}; border:1.5px solid ${trendColor}; border-radius:22px; padding:6px 16px;">
                <span style="font-size:16px; color:${trendColor}; font-weight:600;">${trendIcon}</span>
              </td></tr>
            </table>
            <table border="0" cellpadding="0" cellspacing="0" align="right" style="margin-top:8px;">
              <tr><td align="center" style="font-size:13px; color:#374151; background:#f3f4f6; padding:8px 16px; border-radius:20px; font-weight:500;">
                👤 ${kpi.responsible}
              </td></tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CHART AREA: Y‑axis + bars (aligned) + X‑axis below -->
      <div style="margin-bottom:0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td width="60" valign="top" style="padding-right:6px;">
              ${yAxisHTML}
            </td>
            <td valign="bottom" style="padding-left:6px; height:${chartHeight}px; padding:0; line-height:0; vertical-align:bottom;">
              ${barTable}
            </td>
          </tr>
        </table>
        <!-- X‑axis directly below, no margin -->
        <div style="margin-left:66px; margin-top:0; padding-top:0; line-height:0;">
          ${xAxisTable}
        </div>
      </div>

      <!-- STATS FOOTER -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%"
             style="background:#0f172a; border-radius:12px; margin-top:24px; border-collapse:collapse;">
        <tr>
          <td width="25%" align="center" style="padding:14px; border-right:1px solid rgba(255,255,255,0.15);">
            <div style="font-size:10px; letter-spacing:0.6px; font-weight:600; color:rgba(255,255,255,0.75); margin-bottom:6px;">CURRENT</div>
            <div style="font-size:20px; font-weight:700; color:#ffffff;">${formatNumber(currentValue)}</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.6); margin-top:4px;">Week ${weeks[weeks.length - 1]?.replace('2026-Week', '') || '5'}</div>
          </td>
          <td width="25%" align="center" style="padding:14px; border-right:1px solid rgba(255,255,255,0.15);">
            <div style="font-size:10px; letter-spacing:0.6px; font-weight:600; color:rgba(255,255,255,0.75); margin-bottom:6px;">TARGET</div>
            <div style="font-size:20px; font-weight:700; color:#22c55e;">${targetNum ? formatNumber(targetNum) : 'N/A'}</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.6); margin-top:4px;">Achievement</div>
          </td>
          <td width="25%" align="center" style="padding:14px; border-right:1px solid rgba(255,255,255,0.15);">
            <div style="font-size:10px; letter-spacing:0.6px; font-weight:600; color:rgba(255,255,255,0.75); margin-bottom:6px;">AVERAGE</div>
            <div style="font-size:20px; font-weight:700; color:#ffffff;">${formatNumber(averageValue)}</div>
            <div style="font-size:10px; color:rgba(255,255,255,0.6); margin-top:4px;">${dataValues.length} periods</div>
          </td>
         
        </tr>
      </table>

    </td>
  </tr>
</table>
  `;
};

// Helper function for number formatting
const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const number = parseFloat(num);

  if (Number.isInteger(number)) {
    return number.toString();
  }

  const formatted = number.toFixed(1);
  return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
};

// ========== UPDATED getDepartmentKPIReport FUNCTION ==========
// This function now includes target_value, minimum_value, and maximum_value from the Kpi table

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

    // 2. Get KPIs with target, min, max values - UPDATED QUERY
    // In getDepartmentKPIReport function, update the kpiRes query:

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
    k.target_value,
    k.minimum_value,
    k.maximum_value,
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
    AND CAST(h.new_value AS TEXT) ~ '^[0-9.]+$'  -- FIXED: Cast to text first
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
    k.target_value,
    k.minimum_value,
    k.maximum_value,
    h.week,
    AVG(CAST(h.new_value AS NUMERIC)) as avg_value,
    MIN(CAST(h.new_value AS NUMERIC)) as min_value,
    MAX(CAST(h.new_value AS NUMERIC)) as max_value,
    COUNT(*) as data_points,
    CAST(SPLIT_PART(h.week, 'Week', 2) AS INTEGER) as week_num
  FROM public.kpi_values_hist26 h
  JOIN public."Kpi" k ON h.kpi_id = k.kpi_id
  JOIN public."Responsible" r ON h.responsible_id = r.responsible_id
  WHERE r.plant_id = $1 
    AND h.new_value IS NOT NULL
    AND h.new_value != ''
    AND CAST(h.new_value AS TEXT) ~ '^[0-9.]+$'  -- FIXED: Cast to text first
    AND h.week LIKE '2026-Week%'
  GROUP BY k.kpi_id, k.indicator_title, k.indicator_sub_title, k.unit, 
           k.target_value, k.minimum_value, k.maximum_value, h.week
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
      if (indicatorTitle.includes('Actual - ')) {
        const extracted = indicatorTitle.split('Actual - ')[1];
        if (extracted.includes('/')) {
          return extracted.split('/')[0].trim();
        } else if (extracted.includes('(')) {
          return extracted.split('(')[0].trim();
        }
        return extracted.trim();
      }
      return indicatorTitle;
    };

    // 4. Organize data by department
    const kpisByDepartment = {};
    const weeklyDataByKPI = {};

    // First, organize weekly trend data
    weeklyTrendRes.rows.forEach(row => {
      const kpiKey = `${row.kpi_id}_${row.indicator_title}`;
      const derivedDept = extractDepartmentFromTitle(row.indicator_title);

      if (!weeklyDataByKPI[kpiKey]) {
        weeklyDataByKPI[kpiKey] = {
          kpi_id: row.kpi_id,
          title: row.indicator_title,
          subtitle: row.indicator_sub_title || '',
          unit: row.unit || '',
          target_value: row.target_value,
          minimum_value: row.minimum_value,
          maximum_value: row.maximum_value,
          department: derivedDept,
          weeks: [],
          values: []
        };
      }

      weeklyDataByKPI[kpiKey].weeks.push(row.week);
      weeklyDataByKPI[kpiKey].values.push(parseFloat(row.avg_value));
    });

    // Then, organize current week data by extracted department
    kpiRes.rows.forEach(row => {
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
          target_value: row.target_value,
          minimum_value: row.minimum_value,
          maximum_value: row.maximum_value,
          department: derivedDepartment,
          originalDepartment: row.department_name,
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
      // Add a border-bottom to all rows except the last one
      const borderStyle = (i + 3 < kpis.length) ? 'border-bottom: 2px solid #e9ecef;' : '';
      rows += `<tr style="${borderStyle}">`;

      rowKPIs.forEach(kpi => {
        rows += `<td width="33%" valign="top" style="padding: 20px 15px;">${createIndividualKPIChart(kpi)}</td>`;
      });

      // Fill empty cells
      const emptyCells = 3 - rowKPIs.length;
      for (let j = 0; j < emptyCells; j++) {
        rows += '<td width="33%" style="padding: 20px 15px;"></td>';
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
            Week: <strong style="color: #495057;">${week.replace('2026-Week', 'W')}</strong> • 
            Manager: <strong style="color: #495057;">${plant.manager || 'N/A'}</strong>
          </div>
          <div style="
           margin-top: 6px;
           font-size: 12.5px;
           color: #6c757d;
            ">
           For any question, please contact 
           <a href="mailto:taha.khiari@avocarbon.com"
           style="color:#0078D7; text-decoration:none; font-weight:500;">
           taha.khiari@avocarbon.com
           </a>
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
          ">${week.replace('2026-Week', 'W')}</div>
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
            ${week.replace('2026-Week', 'Week ')}
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
    let hasData = false;
    let toleranceTypes = new Set();
    let frequencies = new Set();

    if (chartsData && chartsData.length > 0) {
      hasData = true;
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
            <a href="http://localhost:5000/form?responsible_id=${responsible.responsible_id}&week=${reportWeek}"
               style="display: inline-block; margin-top: 20px; padding: 12px 24px; 
                      background: #0078D7; color: white; text-decoration: none; 
                      border-radius: 6px; font-weight: 600; font-size: 14px;">
              ✏️ Fill KPI Form
            </a>
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
  <title>KPI Codir Report</title>
  <style>
    @media only screen and (max-width: 600px) {
      .header-buttons {
        flex-direction: column;
        gap: 10px !important;
      }
      .view-history-btn {
        width: 100% !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f4f6f9; line-height: 1.4;">
  <!-- Simple container for Outlook -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #f4f6f9;">
 <tr>
  <td align="center" style="padding: 20px;">
    <!-- Header Content -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="background: #0078D7; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">📊 KPI Performance Report</h1>
        </td>
      </tr>
  
    </table>
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
                    <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Group</div>
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
          
          <!-- KPI Summary Info -->
          ${hasData ? `
          <tr>
            <td style="padding: 20px 30px; background: #f8f9fa; border-bottom: 1px solid #e9ecef;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="color: #666; font-size: 12px;">
                    <p style="margin: 0 0 5px 0;">
                      <strong>${chartsData ? chartsData.length : 0} KPIs Tracked</strong> | 
      
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Charts Section -->
          <tr>
            <td style="padding: 30px;">
              ${chartsHtml}
            </td>
          </tr>
          
          <!-- Action Section -->
          <tr>
            <td style="padding: 20px 30px; background: #f8f9fa; border-top: 1px solid #e9ecef;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 15px 0 0 0; color: #666; font-size: 12px; text-align: center;">
                      Click any button above to access different views of your KPI performance
                    </p>
                  </td>
                </tr>
              </table>
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
                      Generated on ${new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })} • 
                      Contact: <a href="mailto:administration.STS@avocarbon.com" 
                                style="color: #0078D7; text-decoration: none;">administration.STS@avocarbon.com</a>
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
      subject: `📊 Weekly KPI Dashboard - ${reportData.plant.plant_name} - Week ${prevWeek.replace('2026-Week', '')}`,
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

cron.schedule(
  "21 9 * * 1", // Every day at 8:02 PM
  async () => {
    const lockId = 'department_report_job';
    const lock = await acquireJobLock(lockId, 60); // 60 minute TTL

    // Exit immediately if we didn't get the lock
    if (!lock.acquired) {
      console.log(`⏭️ [Department Report] Skipping - lock held by another instance`);
      return;
    }

    try {
      const now = new Date();

      // Get week number
      const getWeekNumber = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
      };

      const weekNumber = getWeekNumber(now);
      const currentWeek = `2026-Week${weekNumber}`;

      console.log(`📊 [Department Report] Starting for week ${currentWeek}...`);

      // Get all plants with managers
      const plantsRes = await pool.query(`
        SELECT plant_id, name, manager_email 
        FROM public."Plant" 
        WHERE manager_email IS NOT NULL AND manager_email != ''
      `);

      console.log(`📊 [Department Report] Found ${plantsRes.rows.length} plants with managers`);

      const results = [];
      for (const [index, plant] of plantsRes.rows.entries()) {
        try {
          console.log(`  🏭 [${index + 1}/${plantsRes.rows.length}] Processing ${plant.name}...`);
          await sendDepartmentKPIReportEmail(plant.plant_id, currentWeek);
          console.log(`  ✅ [${index + 1}/${plantsRes.rows.length}] Sent to ${plant.name}`);
          results.push({
            plant_id: plant.plant_id,
            name: plant.name,
            status: 'success'
          });

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (err) {
          console.error(`  ❌ [${index + 1}/${plantsRes.rows.length}] Failed for ${plant.name}:`, err.message);
          results.push({
            plant_id: plant.plant_id,
            name: plant.name,
            status: 'error',
            message: err.message
          });
        }
      }

      const succeeded = results.filter(r => r.status === 'success').length;
      console.log(`✅ [Department Report] Completed. Sent: ${succeeded}/${results.length}`);

    } catch (error) {
      console.error("❌ [Department Report] Error:", error.message);
    } finally {
      await releaseJobLock(lockId, lock.instanceId, lock.lockHash);
    }
  },
  {
    scheduled: true,
    timezone: "Africa/Tunis"
  }
);


// ========== CORRECTIVE ACTION FORM PAGE ==========
app.get("/corrective-action-form", async (req, res) => {
  try {
    const { responsible_id, kpi_id, week } = req.query;

    const resResp = await pool.query(
      `SELECT r.responsible_id, r.name, r.email, r.plant_id, r.department_id,
             p.name AS plant_name, d.name AS department_name
      FROM public."Responsible" r
      JOIN public."Plant" p ON r.plant_id = p.plant_id
      JOIN public."Department" d ON r.department_id = d.department_id
      WHERE r.responsible_id = $1`,
      [responsible_id]
    );

    const responsible = resResp.rows[0];
    if (!responsible) return res.status(404).send("Responsible not found");

    const kpiResp = await pool.query(
      `SELECT k.kpi_id, k.indicator_title, k.indicator_sub_title, k.unit, k.target_value,
              kv.value
       FROM public."Kpi" k
       LEFT JOIN public.kpi_values kv ON k.kpi_id = kv.kpi_id 
       WHERE k.kpi_id = $1 AND kv.responsible_id = $2 AND kv.week = $3`,
      [kpi_id, responsible_id, week]
    );

    const kpi = kpiResp.rows[0];
    if (!kpi) return res.status(404).send("KPI not found");

    const existingCA = await pool.query(
      `SELECT * FROM public.corrective_actions
       WHERE responsible_id = $1 AND kpi_id = $2 AND week = $3
       ORDER BY created_date DESC LIMIT 1`,
      [responsible_id, kpi_id, week]
    );

    const existingData = existingCA.rows[0] || {};

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Corrective Action Form</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f4f6f9; padding: 20px; margin: 0; }
          .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%); color: white; padding: 25px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .alert-badge { background: rgba(255,255,255,0.2); display: inline-block; padding: 8px 16px; border-radius: 20px; margin-top: 10px; font-size: 13px; }
          .form-section { padding: 30px; }
          .info-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin-bottom: 25px; border-radius: 4px; }
          .info-row { display: flex; margin-bottom: 12px; font-size: 14px; }
          .info-label { font-weight: 600; width: 140px; color: #333; }
          .info-value { flex: 1; color: #666; }
          .performance-box { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .perf-item { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 6px; }
          .perf-label { font-size: 11px; color: #666; margin-bottom: 8px; text-transform: uppercase; }
          .perf-value { font-size: 24px; font-weight: 700; }
          .perf-value.current { color: #d32f2f; }
          .perf-value.target_value { color: #4caf50; }
          .perf-value.gap { color: #ff9800; }
          .form-group { margin-bottom: 25px; }
          label { display: block; font-weight: 600; color: #333; margin-bottom: 8px; font-size: 14px; }
          label .required { color: #d32f2f; margin-left: 4px; }
          textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; font-family: 'Segoe UI', sans-serif; box-sizing: border-box; min-height: 100px; resize: vertical; }
          textarea:focus { border-color: #d32f2f; outline: none; box-shadow: 0 0 0 2px rgba(211,47,47,0.1); }
          .help-text { font-size: 12px; color: #666; margin-top: 5px; font-style: italic; }
          .submit-btn { background: #d32f2f; color: white; border: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; }
          .submit-btn:hover { background: #b71c1c; }
          .status-badge { display: inline-block; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .status-open { background: #ffebee; color: #c62828; }
          .status-completed { background: #e8f5e9; color: #2e7d32; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 40px;margin-bottom:10px;">⚠️</div>
            <h1>Corrective Action Form</h1>
            <div class="alert-badge">Week ${week} - Performance Below target_value</div>
          </div>

          <div class="form-section">
            <div class="info-box">
              <div class="info-row">
                <div class="info-label">Responsible:</div>
                <div class="info-value">${responsible.name}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Plant:</div>
                <div class="info-value">${responsible.plant_name}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Department:</div>
                <div class="info-value">${responsible.department_name}</div>
              </div>
              <div class="info-row">
                <div class="info-label">KPI:</div>
                <div class="info-value">${kpi.indicator_title}</div>
              </div>
            </div>

            <div class="performance-box">
              <div class="perf-item">
                <div class="perf-label">Current Value</div>
                <div class="perf-value current">${kpi.value || '0'}${kpi.unit || ''}</div>
              </div>
              <div class="perf-item">
                <div class="perf-label">target_value</div>
                <div class="perf-value target_value">${kpi.target_value || 'N/A'}${kpi.unit || ''}</div>
              </div>
              <div class="perf-item">
                <div class="perf-label">Gap</div>
                <div class="perf-value gap">
                  ${kpi.target_value ? (parseFloat(kpi.target_value) - parseFloat(kpi.value || 0)).toFixed(2) : 'N/A'}${kpi.unit || ''}
                </div>
              </div>
            </div>

            ${existingData.corrective_action_id ? `
            <div style="background:#e3f2fd;padding:15px;border-radius:6px;margin-bottom:20px;">
              <strong>Status:</strong> 
              <span class="status-badge status-${existingData.status.toLowerCase()}">${existingData.status}</span>
              <div style="font-size:12px;color:#666;margin-top:8px;">
                Last updated: ${new Date(existingData.updated_date).toLocaleString()}
              </div>
            </div>
            ` : ''}

            <form action="/submit-corrective-action" method="POST">
              <input type="hidden" name="responsible_id" value="${responsible_id}">
              <input type="hidden" name="kpi_id" value="${kpi_id}">
              <input type="hidden" name="week" value="${week}">
              ${existingData.corrective_action_id ?
        `<input type="hidden" name="corrective_action_id" value="${existingData.corrective_action_id}">`
        : ''}

              <div class="form-group">
                <label>Root Cause Analysis<span class="required">*</span></label>
                <textarea name="root_cause" required placeholder="Describe the root cause of the performance gap...">${existingData.root_cause || ''}</textarea>
                <div class="help-text">Use the 5 Whys technique or fishbone diagram to identify the root cause</div>
              </div>

              <div class="form-group">
                <label>Implemented Solution<span class="required">*</span></label>
                <textarea name="implemented_solution" required placeholder="Describe the corrective actions taken...">${existingData.implemented_solution || ''}</textarea>
                <div class="help-text">Detail the specific actions, responsibilities, and timeline</div>
              </div>

              <div class="form-group">
                <label>Evidence of Improvement<span class="required">*</span></label>
                <textarea name="evidence" required placeholder="Provide evidence that the solution is effective...">${existingData.evidence || ''}</textarea>
                <div class="help-text">Include data, observations, or metrics showing improvement</div>
              </div>

              <button type="submit" class="submit-btn">
                ${existingData.corrective_action_id ? '✓ Update' : '📝 Submit'} Corrective Action
              </button>
            </form>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Error loading corrective action form:", err);
    res.status(500).send(`<p style="color:red;">Error: ${err.message}</p>`);
  }
});

// ========== SUBMIT CORRECTIVE ACTION ==========
app.post("/submit-corrective-action", async (req, res) => {
  try {
    const {
      responsible_id, kpi_id, week,
      root_cause, implemented_solution, evidence,
      corrective_action_id
    } = req.body;

    if (corrective_action_id) {
      await pool.query(
        `UPDATE public.corrective_actions
         SET root_cause = $1, implemented_solution = $2, evidence = $3,
             status = 'Completed', updated_date = NOW()
         WHERE corrective_action_id = $4`,
        [root_cause, implemented_solution, evidence, corrective_action_id]
      );
    } else {
      await pool.query(
        `INSERT INTO public.corrective_actions 
         (responsible_id, kpi_id, week, root_cause, implemented_solution, evidence, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Completed')`,
        [responsible_id, kpi_id, week, root_cause, implemented_solution, evidence]
      );
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Corrective Action Submitted</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f4f6f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .success-container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
          h1 { color: #4caf50; font-size: 28px; margin-bottom: 15px; }
          p { font-size: 16px; color: #333; margin-bottom: 25px; line-height: 1.6; }
          a { display: inline-block; padding: 12px 25px; background: #0078D7; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px; }
          a:hover { background: #005ea6; }
        </style>
      </head>
      <body>
        <div class="success-container">
          <h1>✅ Corrective Action Submitted!</h1>
          <p>Your corrective action has been successfully recorded for week ${week}.</p>
          <a href="/dashboard?responsible_id=${responsible_id}">Go to Dashboard</a>
          <a href="/corrective-actions-list?responsible_id=${responsible_id}">View All Actions</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Error submitting corrective action:", err);
    res.status(500).send(`<h2 style="color:red;">Error: ${err.message}</h2>`);
  }
});

// ========== VIEW CORRECTIVE ACTIONS LIST ==========
app.get("/corrective-actions-list", async (req, res) => {
  try {
    const { responsible_id } = req.query;

    const actionsRes = await pool.query(
      `SELECT ca.*, k.indicator_title, k.indicator_sub_title, k.unit
      FROM public.corrective_actions ca
      JOIN public."Kpi" k ON ca.kpi_id = k.kpi_id
      WHERE ca.responsible_id = $1
      ORDER BY ca.created_date DESC`,
      [responsible_id]
    );

    const actions = actionsRes.rows;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Corrective Actions History</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f4f6f9; padding: 20px; margin: 0; }
          .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #0078D7; margin-bottom: 25px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
          th { background: #0078D7; color: white; font-weight: 600; }
          tr:nth-child(even) { background: #f8f9fa; }
          .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .status-open { background: #ffebee; color: #c62828; }
          .status-completed { background: #e8f5e9; color: #2e7d32; }
          .action-link { color: #0078D7; text-decoration: none; font-weight: 600; }
          .action-link:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📋 Corrective Actions History</h1>
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>KPI</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${actions.length === 0 ?
        '<tr><td colspan="5" style="text-align:center;padding:40px;color:#999;">No corrective actions found</td></tr>'
        :
        actions.map(action => `
                  <tr>
                    <td>${action.week}</td>
                    <td>
                      <strong>${action.indicator_title}</strong>
                      ${action.indicator_sub_title ? `<br><small>${action.indicator_sub_title}</small>` : ''}
                    </td>
                    <td>
                      <span class="status-badge status-${action.status.toLowerCase()}">
                        ${action.status}
                      </span>
                    </td>
                    <td>${new Date(action.created_date).toLocaleDateString()}</td>
                    <td>
                      <a href="/corrective-action-form?responsible_id=${responsible_id}&kpi_id=${action.kpi_id}&week=${action.week}" class="action-link">
                        ${action.status === 'Open' ? 'Complete' : 'View'}
                      </a>
                    </td>
                  </tr>`
        ).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Error loading corrective actions list:", err);
    res.status(500).send(`<p style="color:red;">Error: ${err.message}</p>`);
  }
});


//endppoints tree kpi 
// ========== PLANT HIERARCHY APIs ==========

// 1. Get all root plants (plants without parent/owner)
// 1. Get all root plants (plants without parent/owner) - UPDATED
app.get('/api/plants/roots', async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT 
                p.plant_id,
                p.name,
                p.manager,
                p.manager_email,
                p.created_at,
                -- Count responsible persons
                COUNT(DISTINCT r.responsible_id) as responsible_count,
                -- Count child plants
                COUNT(DISTINCT c.plant_id) as child_plant_count,
                -- Count total KPIs for all children
                COALESCE(
                    (SELECT COUNT(DISTINCT kv.kpi_id)
                     FROM "Plant" p2
                     LEFT JOIN "Responsible" r2 ON r2.plant_id = p2.plant_id
                     LEFT JOIN kpi_values kv ON kv.responsible_id = r2.responsible_id
                     WHERE p2.parent_id = p.plant_id
                     AND kv.kpi_id IS NOT NULL),
                    0
                ) as total_child_kpis
            FROM "Plant" p
            LEFT JOIN "Responsible" r ON r.plant_id = p.plant_id
            LEFT JOIN "Plant" c ON c.parent_id = p.plant_id
            WHERE p.parent_id IS NULL
            GROUP BY p.plant_id, p.name, p.manager, p.manager_email, p.created_at
            ORDER BY p.name
        `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching root plants:', error);
    res.status(500).json({ error: error.message });
  }
});
// 2. Get child plants for a parent plant
// Update your SQL query to include has_children flag:
app.get('/api/plants/:plantId/children', async (req, res) => {
  try {
    const { plantId } = req.params;
    const result = await pool.query(`
            SELECT 
                p.plant_id,
                p.name,
                p.manager,
                p.manager_email,
                p.created_at,
                p.parent_id,
                -- Check if this plant has children
                EXISTS(
                    SELECT 1 FROM "Plant" c 
                    WHERE c.parent_id = p.plant_id
                ) as has_children,
                COUNT(DISTINCT r.responsible_id) as responsible_count,
                -- Only count KPIs if no children
                CASE WHEN EXISTS(
                    SELECT 1 FROM "Plant" c WHERE c.parent_id = p.plant_id
                ) THEN 0
                ELSE COALESCE(
                    (SELECT COUNT(DISTINCT kv.kpi_id)
                     FROM "Responsible" r2
                     LEFT JOIN kpi_values kv ON kv.responsible_id = r2.responsible_id
                     WHERE r2.plant_id = p.plant_id
                     AND kv.kpi_id IS NOT NULL), 
                    0
                ) END as kpi_count
            FROM "Plant" p
            LEFT JOIN "Responsible" r ON r.plant_id = p.plant_id
            WHERE p.parent_id = $1
            GROUP BY p.plant_id, p.name, p.manager, p.manager_email, p.created_at, p.parent_id
            ORDER BY p.name
        `, [plantId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
// ========== KPI APIs ==========

// 3. Get indicators for a plant (FIXED - removed DISTINCT from JSON)

app.get('/api/plants/:plantId/indicators', async (req, res) => {
  try {
    const { plantId } = req.params;
    const { week } = req.query;

    const result = await pool.query(`
            SELECT 
                k.kpi_id,
                k.indicator_title,
                k.indicator_sub_title,
                k.unit,
                k.good_direction,
                k.tolerance_percent,
                k.created_at,
                -- Count responsible persons for this KPI in this plant
                COUNT(DISTINCT r.responsible_id) as responsible_count,
                -- Count values for this KPI
                COUNT(DISTINCT kv.kpi_values_id) as value_count,
                -- Get current week values
                COALESCE(
                    (SELECT json_agg(jsonb_build_object(
                        'value_id', kv2.kpi_values_id,
                        'week', kv2.week,
                        'value', kv2.value,
                        'target', kv2.target_snapshot
                    ))
                    FROM kpi_values kv2
                    WHERE kv2.kpi_id = k.kpi_id 
                        AND kv2.week = COALESCE($2, '2026-Week7')
                        AND EXISTS (
                            SELECT 1 FROM "Responsible" r2 
                            WHERE r2.responsible_id = kv2.responsible_id 
                            AND r2.plant_id = $1
                        )
                    LIMIT 10),
                    '[]'
                ) as current_week_values
            FROM "Kpi" k
            -- Get KPIs through responsible persons in this plant
            INNER JOIN "Responsible" r ON r.plant_id = $1
            INNER JOIN kpi_values kv ON kv.kpi_id = k.kpi_id AND kv.responsible_id = r.responsible_id
            GROUP BY k.kpi_id, k.indicator_title, k.indicator_sub_title, k.unit, 
                     k.good_direction, k.tolerance_percent, k.created_at
            ORDER BY k.indicator_title
        `, [plantId, week || '2026-Week7']);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching indicators:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Get indicator subtitles with details (SIMPLIFIED VERSION)
app.get('/api/plants/:plantId/indicators/:kpiId/subtitles', async (req, res) => {
  try {
    const { plantId, kpiId } = req.params;
    const { week } = req.query;

    const result = await pool.query(`
      SELECT 
        k.kpi_id,
        k.indicator_title,
        COALESCE(k.indicator_sub_title, 'No subtitle') as indicator_subtitle,
        k.unit,
        k.good_direction,
        k.tolerance_percent,
        r.responsible_id,
        r.name as responsible_name,
        r.email as responsible_email,
        r.phone as responsible_phone,
        r.created_at as responsible_created,
        d.name as department_name,
        kvh.hist_id,
        kvh.old_value,
        kvh.new_value as value,
        kvh.week,
        kvh.updated_at as value_date,
        CASE 
            WHEN kvh.new_value IS NULL THEN 'No Data'
            WHEN k.good_direction = 'high' AND kvh.new_value::numeric >= k.tolerance_percent THEN 'Above Target'
            WHEN k.good_direction = 'low' AND kvh.new_value::numeric <= k.tolerance_percent THEN 'Below Target'
            ELSE 'Within Target'
        END as status,
        ROUND(
            CASE 
                WHEN k.tolerance_percent > 0 
                THEN ((kvh.new_value::numeric - k.tolerance_percent) / k.tolerance_percent) * 100
                ELSE NULL
            END, 2
        ) as deviation_percent
      FROM "Kpi" k
      INNER JOIN "Responsible" r ON r.plant_id = $1
      LEFT JOIN "Department" d ON d.department_id = r.department_id
      LEFT JOIN kpi_values_hist26 kvh 
        ON kvh.kpi_id = k.kpi_id 
        AND kvh.responsible_id = r.responsible_id
        AND ($2::varchar IS NULL OR kvh.week = $2)
      WHERE k.kpi_id = $3
      ORDER BY k.indicator_sub_title, r.name
    `, [plantId, week || null, kpiId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching KPI history:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Get all departments
app.get('/api/departments', async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT 
                d.department_id,
                d.name,
                d.created_at,
                d.updated_at,
                COUNT(DISTINCT r.responsible_id) as responsible_count
            FROM "Department" d
            LEFT JOIN "Responsible" r ON r.department_id = d.department_id
            GROUP BY d.department_id, d.name, d.created_at, d.updated_at
            ORDER BY d.name
        `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Get responsible persons for a plant
app.get('/api/plants/:plantId/responsible', async (req, res) => {
  try {
    const { plantId } = req.params;
    const result = await pool.query(`
            SELECT 
                r.responsible_id,
                r.name,
                r.email,
                r.phone,
                r.created_at,
                d.name as department_name,
                COUNT(DISTINCT kv.kpi_values_id) as kpi_value_count
            FROM "Responsible" r
            LEFT JOIN "Department" d ON d.department_id = r.department_id
            LEFT JOIN kpi_values kv ON kv.responsible_id = r.responsible_id
            WHERE r.plant_id = $1
            GROUP BY r.responsible_id, r.name, r.email, r.phone, 
                     r.created_at, d.department_id, d.name
            ORDER BY r.name
        `, [plantId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching responsible persons:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Get complete plant hierarchy (SIMPLIFIED)
app.get('/api/plants/hierarchy', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH RECURSIVE plant_tree AS (
        SELECT
          plant_id,
          name::text,          -- cast to text so recursive concat matches
          manager::text,
          manager_email::text,
          parent_id,
          created_at,
          0            AS level,
          name::text   AS path_name
        FROM "Plant"
        WHERE parent_id IS NULL

        UNION ALL

        SELECT
          p.plant_id,
          p.name::text,
          p.manager::text,
          p.manager_email::text,
          p.parent_id,
          p.created_at,
          pt.level + 1,
          pt.path_name || ' > ' || p.name::text
        FROM "Plant" p
        INNER JOIN plant_tree pt ON p.parent_id = pt.plant_id
      )
      SELECT
        pt.plant_id,
        pt.name,
        pt.manager,
        pt.manager_email,
        pt.parent_id,
        pt.level,
        pt.path_name,
        (SELECT COUNT(*) FROM "Responsible" r WHERE r.plant_id = pt.plant_id) AS responsible_count,
        (SELECT COUNT(*) FROM "Plant"       c WHERE c.parent_id = pt.plant_id) AS child_count
      FROM plant_tree pt
      ORDER BY pt.path_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching plant hierarchy:', error);
    res.status(500).json({ error: error.message });
  }
});


// 8. Search across plants, KPIs, and responsible persons
app.get('/api/search', async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q) {
      return res.json([]);
    }

    const searchTerm = `%${q}%`;

    if (type === 'plant') {
      const result = await pool.query(`
                SELECT 
                    'plant' as type,
                    plant_id as id,
                    name,
                    manager as subtitle,
                    'Plant' as category
                FROM "Plant"
                WHERE name ILIKE $1 OR manager ILIKE $1
                LIMIT 10
            `, [searchTerm]);
      res.json(result.rows);
    } else if (type === 'kpi') {
      const result = await pool.query(`
                SELECT 
                    'kpi' as type,
                    kpi_id as id,
                    indicator_title as name,
                    COALESCE(indicator_sub_title, 'No subtitle') as subtitle,
                    'KPI' as category
                FROM "Kpi"
                WHERE indicator_title ILIKE $1 OR indicator_sub_title ILIKE $1
                LIMIT 10
            `, [searchTerm]);
      res.json(result.rows);
    } else {
      // General search
      const plants = await pool.query(`
                SELECT 
                    'plant' as type,
                    plant_id as id,
                    name,
                    manager as subtitle,
                    'Plant' as category
                FROM "Plant"
                WHERE name ILIKE $1 OR manager ILIKE $1
                LIMIT 5
            `, [searchTerm]);

      const kpis = await pool.query(`
                SELECT 
                    'kpi' as type,
                    kpi_id as id,
                    indicator_title as name,
                    COALESCE(indicator_sub_title, 'No subtitle') as subtitle,
                    'KPI' as category
                FROM "Kpi"
                WHERE indicator_title ILIKE $1 OR indicator_sub_title ILIKE $1
                LIMIT 5
            `, [searchTerm]);

      const responsible = await pool.query(`
                SELECT 
                    'responsible' as type,
                    responsible_id as id,
                    name,
                    email as subtitle,
                    'Responsible Person' as category
                FROM "Responsible"
                WHERE name ILIKE $1 OR email ILIKE $1
                LIMIT 5
            `, [searchTerm]);

      res.json([...plants.rows, ...kpis.rows, ...responsible.rows]);
    }
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. Get weekly KPI values for a plant
app.get('/api/plants/:plantId/weekly-values', async (req, res) => {
  const { plantId } = req.params;
  const { week }    = req.query;

  try {
    const result = await pool.query(`
      WITH latest_hist AS (
        SELECT DISTINCT ON (h.responsible_id, h.kpi_id)
               h.responsible_id,
               h.kpi_id,
               h.week,
               CASE
                 WHEN NULLIF(trim(h.new_value), '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                 THEN NULLIF(trim(h.new_value), '')::numeric
                 ELSE NULL
               END AS new_value,
               h.target
        FROM   kpi_values_hist26 h
        WHERE  ($2::varchar IS NULL OR h.week = $2)
        ORDER  BY h.responsible_id, h.kpi_id, h.updated_at DESC
      )

      SELECT
        k.kpi_id,
        k.indicator_title,
        k.indicator_sub_title,
        k.unit,
        k.good_direction,
        k.minimum_value,
        k.maximum_value,
        r.responsible_id,
        r.name              AS responsible_name,
        d.name              AS department_name,
        lh.week,
        lh.new_value        AS value,
        lh.target,

        CASE
          WHEN lh.new_value IS NULL
            THEN 'No Data'

          WHEN k.good_direction = 'UP'
           AND k.maximum_value IS NOT NULL
           AND lh.new_value > NULLIF(REPLACE(trim(k.maximum_value::text), ',', ''), '')::numeric
            THEN 'Above Maximum'

          WHEN k.good_direction = 'DOWN'
           AND k.minimum_value IS NOT NULL
           AND lh.new_value < NULLIF(trim(k.minimum_value::text), '')::numeric
            THEN 'Below Minimum'

          WHEN k.minimum_value IS NOT NULL
           AND lh.new_value < NULLIF(trim(k.minimum_value::text), '')::numeric
            THEN 'Below Minimum'

          ELSE 'On Target'
        END AS status

      FROM   "Responsible"  r
      JOIN   latest_hist    lh ON lh.responsible_id = r.responsible_id
      JOIN   "Kpi"          k  ON k.kpi_id           = lh.kpi_id
      LEFT   JOIN "Department" d ON d.department_id  = r.department_id
      WHERE  r.plant_id = $1
      ORDER  BY k.indicator_title, r.name
    `, [plantId, week || null]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching weekly values:', err);
    res.status(500).json({ error: err.message });
  }
});

// 10. Get plant statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM "Plant") as total_plants,
                (SELECT COUNT(*) FROM "Plant" WHERE parent_id IS NULL) as root_plants,
                (SELECT COUNT(*) FROM "Plant" WHERE parent_id IS NOT NULL) as child_plants,
                (SELECT COUNT(*) FROM "Kpi") as total_kpis,
                (SELECT COUNT(*) FROM "Responsible") as total_responsible,
                (SELECT COUNT(*) FROM "Department") as total_departments,
                (SELECT COUNT(*) FROM kpi_values) as total_kpi_values,
                (SELECT COUNT(DISTINCT week) FROM kpi_values) as total_weeks
        `);
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// 11. Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      status: 'Server is running',
      database_time: result.rows[0].current_time,
      message: 'API server is connected to PostgreSQL'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 12. Get basic plant information (for debugging)
app.get('/api/plants', async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT 
                plant_id,
                name,
                manager,
                parent_id
            FROM "Plant"
            ORDER BY name
            LIMIT 50
        `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ error: error.message });
  }
});

// 13. Get basic KPI information (for debugging)
app.get('/api/indicators', async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT 
                kpi_id,
                indicator_title,
                indicator_sub_title,
                unit
            FROM "Kpi"
            ORDER BY indicator_title
            LIMIT 50
        `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching indicators:', error);
    res.status(500).json({ error: error.message });
  }
});

// 14. Get plant with indicators (simpler endpoint for testing)
app.get('/api/plants/:plantId/indicators-simple', async (req, res) => {
  try {
    const { plantId } = req.params;

    const result = await pool.query(`
            SELECT DISTINCT
                k.kpi_id,
                k.indicator_title,
                k.indicator_sub_title,
                k.unit,
                k.good_direction
            FROM "Responsible" r
            INNER JOIN kpi_values kv ON kv.responsible_id = r.responsible_id
            INNER JOIN "Kpi" k ON k.kpi_id = kv.kpi_id
            WHERE r.plant_id = $1
            ORDER BY k.indicator_title
        `, [plantId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching simple indicators:', error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// 1. GET /api/plants/:plantId/performance?week=XXXX
//    Returns aggregated RED / GREEN counts per indicator_title.
//    Used by the frontend performanceMap to colour the KPI cards.
// ---------------------------------------------------------------------------
app.get('/api/plants/:plantId/performance', async (req, res) => {
  const { plantId } = req.params;
  const { week }    = req.query;

  try {
    const result = await pool.query(`
      WITH RECURSIVE plant_tree AS (
        SELECT plant_id
        FROM   "Plant"
        WHERE  plant_id = $1

        UNION ALL

        SELECT p.plant_id
        FROM   "Plant"    p
        JOIN   plant_tree pt ON p.parent_id = pt.plant_id
      ),

      latest_hist AS (
        SELECT DISTINCT ON (h.responsible_id, h.kpi_id)
               h.responsible_id,
               h.kpi_id,
               CASE
                 WHEN NULLIF(trim(h.new_value), '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                 THEN NULLIF(trim(h.new_value), '')::numeric
                 ELSE NULL
               END AS new_value,
               h.target
        FROM   kpi_values_hist26 h
        WHERE  h.week = $2
        ORDER  BY h.responsible_id, h.kpi_id, h.updated_at DESC
      )

      SELECT
        k.indicator_title,
        k.good_direction,
        k.minimum_value,
        k.maximum_value,

        CASE
          WHEN lh.new_value IS NULL
            THEN 'NO_DATA'

          WHEN k.good_direction = 'UP'
           AND k.maximum_value IS NOT NULL
           AND lh.new_value > NULLIF(REPLACE(trim(k.maximum_value::text), ',', ''), '')::numeric
            THEN 'RED'

          WHEN k.good_direction = 'DOWN'
           AND k.minimum_value IS NOT NULL
           AND lh.new_value < NULLIF(trim(k.minimum_value::text), '')::numeric
            THEN 'RED'

          WHEN k.minimum_value IS NOT NULL
           AND lh.new_value < NULLIF(trim(k.minimum_value::text), '')::numeric
            THEN 'RED'

          ELSE 'GREEN'
        END AS performance_status,

        COUNT(*) AS count

      FROM   plant_tree    pt
      JOIN   "Responsible" r  ON r.plant_id        = pt.plant_id
      JOIN   latest_hist   lh ON lh.responsible_id = r.responsible_id
      JOIN   "Kpi"         k  ON k.kpi_id           = lh.kpi_id
      GROUP  BY
        k.indicator_title,
        k.good_direction,
        k.minimum_value,
        k.maximum_value,
        performance_status
      ORDER  BY k.indicator_title
    `, [plantId, week]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error in /performance:', err);
    res.status(500).json({ error: err.message });
  }
});



app.get('/api/plants/:plantId/indicators/:kpiId/performance', async (req, res) => {
  const { plantId, kpiId } = req.params;
  const { week }           = req.query;

  try {
    const result = await pool.query(`
      WITH latest_hist AS (
        SELECT DISTINCT ON (h.responsible_id)
               h.responsible_id,
               h.kpi_id,
               CASE
                 WHEN NULLIF(trim(h.new_value), '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                 THEN NULLIF(trim(h.new_value), '')::numeric
                 ELSE NULL
               END AS new_value,
               h.target
        FROM   kpi_values_hist26 h
        WHERE  h.kpi_id = $2
          AND  h.week   = $3
        ORDER  BY h.responsible_id, h.updated_at DESC
      )

      SELECT
        k.kpi_id,
        r.responsible_id,
        r.name           AS responsible_name,
        lh.new_value,
        lh.target,
        k.minimum_value,
        k.maximum_value,
        k.good_direction,

        CASE
          WHEN lh.new_value IS NULL
            THEN 'NO_DATA'

          WHEN k.good_direction = 'UP'
           AND k.maximum_value IS NOT NULL
           AND lh.new_value > NULLIF(REPLACE(trim(k.maximum_value::text), ',', ''), '')::numeric
            THEN 'RED'

          WHEN k.good_direction = 'DOWN'
           AND k.minimum_value IS NOT NULL
           AND lh.new_value < NULLIF(trim(k.minimum_value::text), '')::numeric
            THEN 'RED'

          WHEN k.minimum_value IS NOT NULL
           AND lh.new_value < NULLIF(trim(k.minimum_value::text), '')::numeric
            THEN 'RED'

          ELSE 'GREEN'
        END AS performance_status

      FROM   "Responsible" r
      JOIN   latest_hist   lh ON lh.responsible_id = r.responsible_id
      JOIN   "Kpi"         k  ON k.kpi_id           = lh.kpi_id
      WHERE  r.plant_id = $1
        AND  k.kpi_id   = $2
      ORDER  BY r.name
    `, [plantId, kpiId, week]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error in /indicators/:kpiId/performance:', err);
    res.status(500).json({ error: err.message });
  }
});


//by department
app.get('/api/performance/by-departments', async (req, res) => {
  const { week, plantId } = req.query;

  try {
    const result = await pool.query(`
      WITH RECURSIVE plant_scope AS (
        -- If plantId provided, walk that subtree; otherwise all plants
        SELECT plant_id
        FROM   "Plant"
        WHERE  ($2::int IS NULL OR plant_id = $2::int)

        UNION ALL

        SELECT p.plant_id
        FROM   "Plant"    p
        JOIN   plant_scope ps ON p.parent_id = ps.plant_id
        WHERE  $2::int IS NOT NULL   -- only recurse when filtering by plant
      ),

      latest_hist AS (
        SELECT DISTINCT ON (h.responsible_id, h.kpi_id)
               h.responsible_id,
               h.kpi_id,
               CASE
                 WHEN NULLIF(trim(h.new_value), '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                 THEN NULLIF(trim(h.new_value), '')::numeric
                 ELSE NULL
               END AS new_value
        FROM   kpi_values_hist26 h
        WHERE  h.week = $1
        ORDER  BY h.responsible_id, h.kpi_id, h.updated_at DESC
      ),

      perf AS (
        SELECT
          COALESCE(d.name, 'No Department') AS department_name,
          CASE
            WHEN lh.new_value IS NULL
              THEN 'NO_DATA'
            WHEN k.good_direction = 'UP'
             AND k.maximum_value IS NOT NULL
             AND lh.new_value > NULLIF(REPLACE(trim(k.maximum_value::text), ',', ''), '')::numeric
              THEN 'RED'
            WHEN k.good_direction = 'DOWN'
             AND k.minimum_value IS NOT NULL
             AND lh.new_value < NULLIF(REPLACE(trim(k.minimum_value::text), ',', ''), '')::numeric
              THEN 'RED'
            WHEN k.minimum_value IS NOT NULL
             AND lh.new_value < NULLIF(REPLACE(trim(k.minimum_value::text), ',', ''), '')::numeric
              THEN 'RED'
            ELSE 'GREEN'
          END AS performance_status
        FROM   plant_scope   ps
        JOIN   "Responsible" r  ON r.plant_id        = ps.plant_id
        LEFT   JOIN "Department" d ON d.department_id = r.department_id
        JOIN   latest_hist   lh ON lh.responsible_id = r.responsible_id
        JOIN   "Kpi"         k  ON k.kpi_id           = lh.kpi_id
      )

      SELECT
        department_name,
        COUNT(*) FILTER (WHERE performance_status = 'GREEN')   AS on_target,
        COUNT(*) FILTER (WHERE performance_status = 'RED')     AS off_target,
        COUNT(*) FILTER (WHERE performance_status = 'NO_DATA') AS no_data,
        COUNT(*)                                                AS total,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE performance_status = 'GREEN') /
          NULLIF(COUNT(*) FILTER (WHERE performance_status IN ('GREEN','RED')), 0)
        , 1) AS health_pct
      FROM perf
      GROUP BY department_name
      ORDER BY off_target DESC, department_name
    `, [week, plantId || null]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error in /performance/by-departments:', err);
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/performance/by-plants', async (req, res) => {
  const { week } = req.query;

  try {
    const result = await pool.query(`
      WITH latest_hist AS (
        SELECT DISTINCT ON (h.responsible_id, h.kpi_id)
               h.responsible_id,
               h.kpi_id,
               CASE
                 WHEN NULLIF(trim(h.new_value), '') ~ '^-?[0-9]+(\.[0-9]+)?$'
                 THEN NULLIF(trim(h.new_value), '')::numeric
                 ELSE NULL
               END AS new_value
        FROM   kpi_values_hist26 h
        WHERE  h.week = $1
        ORDER  BY h.responsible_id, h.kpi_id, h.updated_at DESC
      ),

      perf AS (
        SELECT
          p.plant_id,
          p.name AS plant_name,
          p.parent_id,
          CASE
            WHEN lh.new_value IS NULL
              THEN 'NO_DATA'
            WHEN k.good_direction = 'UP'
             AND k.maximum_value IS NOT NULL
             AND lh.new_value > NULLIF(REPLACE(trim(k.maximum_value::text), ',', ''), '')::numeric
              THEN 'RED'
            WHEN k.good_direction = 'DOWN'
             AND k.minimum_value IS NOT NULL
             AND lh.new_value < NULLIF(trim(k.minimum_value::text), '')::numeric
              THEN 'RED'
            WHEN k.minimum_value IS NOT NULL
             AND lh.new_value < NULLIF(trim(k.minimum_value::text), '')::numeric
              THEN 'RED'
            ELSE 'GREEN'
          END AS performance_status
        FROM   "Plant"       p
        JOIN   "Responsible" r  ON r.plant_id        = p.plant_id
        JOIN   latest_hist   lh ON lh.responsible_id = r.responsible_id
        JOIN   "Kpi"         k  ON k.kpi_id           = lh.kpi_id
      )

      SELECT
        plant_id,
        plant_name,
        parent_id,
        COUNT(*) FILTER (WHERE performance_status = 'GREEN')   AS on_target,
        COUNT(*) FILTER (WHERE performance_status = 'RED')     AS off_target,
        COUNT(*) FILTER (WHERE performance_status = 'NO_DATA') AS no_data,
        COUNT(*)                                                AS total
      FROM perf
      GROUP BY plant_id, plant_name, parent_id
      ORDER BY off_target DESC, plant_name
    `, [week]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error in /performance/by-plants:', err);
    res.status(500).json({ error: err.message });
  }
});




// ---------- Start server ----------
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
