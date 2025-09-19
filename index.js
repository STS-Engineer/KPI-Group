require("dotenv").config();
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require("node-cron");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ---------- Postgres ----------
const pool = new Pool({
    user: 'adminavo',
    host: 'avo-adb-001.postgres.database.azure.com',
    database: 'indicatordb',
    password: '$#fKcdXPg4@ue8AW',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

// ---------- Nodemailer ----------
const createTransporter = () => nodemailer.createTransport({
    host: "avocarbon-com.mail.protection.outlook.com",
    port: 25,
    secure: false,
    auth: {
        user: "administration.STS@avocarbon.com",
        pass: "shnlgdyfbcztbhxn",
    },
});

// ---------- Get current ISO week ----------
const getCurrentWeekNumber = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(),0,1);
    const pastDays = (now - startOfYear) / 86400000;
    return Math.ceil((pastDays + startOfYear.getDay()+1)/7);
};

// ---------- Fetch Responsible + their KPIs ----------
const getResponsibleWithKPIs = async (responsibleId, week) => {
    const resResp = await pool.query(`SELECT * FROM public."Responsible" WHERE id=$1`, [responsibleId]);
    const responsible = resResp.rows[0];
    if (!responsible) throw new Error("Responsible not found");

    const plant = responsible["Plant"];
    if (!plant) throw new Error(`Responsible ${responsible.name} does not have a Plant defined`);

    const plantToTable = {
        "Sceet": "kpis-sceet",
        "India": "kpis-india",
        "Korea": "kpis-korea",
        "Anhui": "kpis-anhui",
        "Germany": "kpis-germany"
    };

    const kpiTableName = plantToTable[plant];
    if (!kpiTableName) throw new Error(`No KPI table found for Plant: ${plant}`);
    const kpiTable = `"${kpiTableName}"`;

    const kpiRes = await pool.query(
        `SELECT * FROM public.${kpiTable} WHERE responsable_id=$1 AND week=$2 ORDER BY id ASC`,
        [responsibleId, week]
    );

    return { responsible, kpis: kpiRes.rows, kpiTable };
};

// ---------- Generate email HTML form with AJAX submission ----------
const generateEmailHtml = ({ responsible, kpis, week, kpiTable }) => {
    if (!responsible) throw new Error("Responsible not found");
    if (!kpis.length) return `<p>No KPIs found for week ${week}</p>`;

    const groupedKpis = {};
    kpis.forEach(kpi => {
        if (!groupedKpis[kpi["indicator-title"]]) groupedKpis[kpi["indicator-title"]] = [];
        groupedKpis[kpi["indicator-title"]].push(kpi);
    });

    let kpiFields = '';
    Object.keys(groupedKpis).forEach(title => {
        kpiFields += `
            <div style="margin-bottom:25px;padding:15px;border:1px solid #ddd;border-radius:8px;">
                <h3 style="margin:0 0 15px 0;font-size:18px;color:#0078D7;font-weight:700;">
                    ${title}
                </h3>
        `;
        groupedKpis[title].forEach(kpi => {
            kpiFields += `
                <div style="margin-bottom:15px;">
                    <label style="display:block;margin-bottom:5px;color:#555;font-size:14px;">
                        ${kpi["indicator-sub-title"]} (${kpi.unit || ''}):
                    </label>
                    <input type="text" name="value_${kpi.id}" placeholder="Enter value" 
                        style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;box-sizing:border-box;" />
                </div>
            `;
        });
        kpiFields += `</div>`;
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>KPI Form</title>
        </head>
        <body style="font-family: 'Segoe UI', sans-serif; background:#f4f4f4; padding:20px;">
            <div style="max-width:600px;margin:0 auto;background:#fff;padding:25px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.1);">
                
                <!-- Header: Logo + Title -->
                 <!-- Header: Logo + Centered Title -->
                <div style="display:flex;align-items:center;justify-center:flex-start;gap:25px;margin-bottom:30px;">
              <img src="https://media.licdn.com/dms/image/v2/D4E0BAQGYVmAPO2RZqQ/company-logo_200_200/company-logo_200_200/0/1689240189455/avocarbon_group_logo?e=2147483647&v=beta&t=nZNCXd3ypoMFQnQMxfAZrljyNBbp4E5HM11Y1yl9_L0" 
        alt="AVOCarbon Logo" style="width:80px;height:80px;object-fit:contain;">
    <h2 style="color:#0078D7;font-size:22px;margin:0;font-weight:700;text-align:center;width:100%;">
        KPI Submission Form - Week ${week}
    </h2>
</div>



                <form id="kpiForm">
                    <div style="margin-bottom:20px;">
                        <label style="display:block;margin-bottom:5px;color:#555;font-weight:600;">Responsible Name</label>
                        <input type="text" name="responsible_name" value="${responsible.name}" readonly
                            style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;background:#f9f9f9;" />
                    </div>
                       <div style="margin-bottom:20px;">
                        <label style="display:block;margin-bottom:5px;color:#555;font-weight:600;">Plant</label>
                        <input type="text" name="responsible_name" value="${responsible.Plant}" readonly
                            style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;background:#f9f9f9;" />
                    </div>

                      <div style="margin-bottom:20px;">
                      <label style="display:block;margin-bottom:5px;color:#555;font-weight:600;">Department</label>
                    <input type="text" name="department" value="${responsible.departments || ''}" readonly
                      style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;background:#f9f9f9;" />
                   </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:block;margin-bottom:5px;color:#555;font-weight:600;">Week</label>
                        <input type="text" name="week" value="${week}" readonly
                            style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px;background:#f9f9f9;" />
                    </div>

                    ${kpiFields}            

                    <input type="hidden" name="responsible_id" value="${responsible.id}" />
                    <input type="hidden" name="kpi_table" value="${kpiTable}" />

                    <button type="submit"
                        style="width:100%;padding:12px;background:#0078D7;color:#fff;font-size:16px;font-weight:600;border:none;border-radius:8px;cursor:pointer;">
                        Submit KPI
                    </button>
                </form>
            </div>

            <script>
                document.getElementById('kpiForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const form = e.target;
                    const data = {};
                    new FormData(form).forEach((value, key) => { data[key] = value });

                    try {
                        const res = await fetch("http://localhost:5000/api/submit-kpi", {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }, 
                            body: JSON.stringify(data)
                        });  
                        const result = await res.json();
                        if(result.status === 'success'){
                            alert(result.message); // Success popup
                        } else {
                            alert('❌ ' + result.message);
                        }
                    } catch(err) {
                        console.error(err);
                        alert('❌ Submission failed, check console.');
                    }
                });
            </script>
        </body>
        </html>
    `;
};


// ---------- Submit KPI endpoint ----------
app.post('/api/submit-kpi', async (req, res) => {
    try {
        const { responsible_id, kpi_table, ...values } = req.body;
        const keys = Object.keys(values).filter(k => k.startsWith('value_'));

        for (let key of keys) {
            const kpiId = key.split('_')[1];
            await pool.query(`UPDATE public.${kpi_table} SET value=$1 WHERE id=$2`, [values[key], kpiId]);
        }

        res.json({ status: "success", message: "✅ KPI values submitted successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: "❌ Error submitting KPI values." });
    }
});

// ---------- Health check ----------
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ---------- Send KPI email ----------
const sendKPIEmail = async (responsibleId, week) => {
    try {
        const { responsible, kpis, kpiTable } = await getResponsibleWithKPIs(responsibleId, week);
        if (!kpis.length) {
            console.log(`No KPIs for Responsible ID ${responsibleId}, skipping email.`);
            return;
        }

        const html = generateEmailHtml({ responsible, kpis, week, kpiTable });
        console.log(`Sending email to: ${responsible.email}`);
        const transporter = createTransporter();

        const info = await transporter.sendMail({
            from: '"Avocarbon Administration" <administration.STS@avocarbon.com>',
            to: responsible.email,
            subject: `KPI Form for ${responsible.name} - Week ${week}`,
            html
        });

        console.log(`✅ Email sent to ${responsible.email}: ${info.messageId}`);
    } catch (err) {
        console.error(`❌ Failed to send KPI email to responsible ID ${responsibleId}:`, err.message);
    }
};

 
// ---------- Start server & send weekly emails ----------
app.listen(port, async () => {
    console.log(`Server running on port ${port}`);

    // Schedule: Every day at 17:45 Tunisia time
    cron.schedule("45 16 * * *", async () => {
        const forcedWeek = "37-25";  // Or dynamically use getCurrentWeekNumber()
        try {
            const resps = await pool.query(`SELECT id FROM public."Responsible"`);
            for (let r of resps.rows) {
                await sendKPIEmail(r.id, forcedWeek);
            }
            console.log("✅ All KPI emails sent at 17:45 Africa/Tunis time");
        } catch (err) {
            console.error("❌ Error sending scheduled emails:", err.message);
        }
    }, {
        scheduled: true,
        timezone: "Africa/Tunis"
    });
});
