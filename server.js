const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

const app = express();
app.use(bodyParser.json());

const cors = require("cors");
app.use(cors({
  origin: "http://localhost:3001",  // allow React frontend
  methods: ["GET", "POST"],
}));

// ----------------------------
// MySQL Connection
// ----------------------------
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'arun123',
  database: 'patchdemo',
  charset: 'utf8mb4'
});
const dbPromise = db.promise();

db.connect(err => {
  if (err) console.log(err);
  else console.log('MySQL connected');
});

// ----------------------------
// Load NVD JSON Feeds
// ----------------------------
function loadCVEFeed(fileName) {
  const filePath = path.join(__dirname, 'cve_feed', fileName);
  const data = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(data);
  if (json && json.vulnerabilities) return json.vulnerabilities;
  console.warn(`Warning: CVE feed ${fileName} has unexpected structure`);
  return [];
}

const recentCVEs = loadCVEFeed('nvdcve-2.0-recent.json');
const modifiedCVEs = loadCVEFeed('nvdcve-2.0-modified.json');

console.log(`Loaded CVE feeds: Recent=${recentCVEs.length}, Modified=${modifiedCVEs.length}`);

// ----------------------------
// Mapping plugin names to slugs
// ----------------------------
const nameMapping = {
  "Admin in English with Switch": "admin-in-english-with-switch",
  "Wordpress": "wordpress"
};

// ----------------------------
// Normalize + check vulnerability
// ----------------------------
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/microsoft|google|mozilla|oracle|inc|corp/g, '');
}

function checkVulnerability(pkg, cveItem) {
  try {
    const cve = cveItem.cve;
    const summary = (cve.descriptions || []).map(d => d.value).join(' ').toLowerCase();
    const pkgSlug = normalizeName(nameMapping[pkg.name] || pkg.name);
    const pkgVersion = semver.coerce(pkg.version);

    let vulnerable = false;

    const configs = cveItem.configurations || [];
    configs.forEach(config => {
      config.nodes?.forEach(node => {
        node.cpeMatch?.forEach(cpe => {
          if (cpe.vulnerable) {
            const cpeString = cpe.cpe23Uri || cpe.criteria || '';
            const cpeParts = cpeString.split(':');
            const cpeProduct = normalizeName(cpeParts[4] || '');

            const startVersion = cpe.versionStartIncluding ? semver.coerce(cpe.versionStartIncluding) : null;
            const endVersion   = cpe.versionEndIncluding   ? semver.coerce(cpe.versionEndIncluding)   : null;
            const exactVersion = cpe.version ? semver.coerce(cpe.version) : null;

            if (cpeProduct && (pkgSlug.includes(cpeProduct) || cpeProduct.includes(pkgSlug))) {
              if (exactVersion && semver.eq(pkgVersion, exactVersion)) vulnerable = true;
              if (startVersion && endVersion && semver.gte(pkgVersion, startVersion) && semver.lte(pkgVersion, endVersion)) vulnerable = true;
              if (startVersion && !endVersion && semver.gte(pkgVersion, startVersion)) vulnerable = true;
              if (!startVersion && endVersion && semver.lte(pkgVersion, endVersion)) vulnerable = true;
            }
          }
        });
      });
    });

    if (!vulnerable && summary.includes(pkgSlug)) {
      if (summary.includes(pkg.version)) vulnerable = true;
      if (summary.includes("and earlier") || summary.includes("before")) vulnerable = true;
    }

    if (vulnerable) {
      const severity = (cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity || 'UNKNOWN').toUpperCase();
      if (severity === 'UNKNOWN') return null;
      return {
        cve_id: cve.id,
        severity,
        description: summary
      };
    }
  } catch (err) {
    console.warn('Error parsing CVE:', err);
  }
  return null;
}

// ----------------------------
// Receive inventory from agent
// ----------------------------
app.post('/inventory', async (req, res) => {
  try {
    const { hostname, ip, packages } = req.body;

    // Insert or update asset
    await dbPromise.query(
      'INSERT INTO assets (hostname, ip, last_seen) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE last_seen=NOW()',
      [hostname, ip]
    );

    const [rows] = await dbPromise.query('SELECT id FROM assets WHERE hostname=?', [hostname]);
    const assetId = rows[0].id;

    // Fetch current versions for vulnerable packages tracking
    const [currentRows] = await dbPromise.query(
      'SELECT name, version FROM packages WHERE asset_id = ?',
      [assetId]
    );
    const versionMap = {};
    currentRows.forEach(r => versionMap[r.name] = r.version);

    // Delete old vulnerable packages for this host
    await dbPromise.query('DELETE FROM vulnerable_packages WHERE asset_id = ?', [assetId]);

    const allCVEs = [...recentCVEs, ...modifiedCVEs];
    const vulnerablePackages = [];
    const seen = new Set();

    // Identify vulnerable packages
    packages.forEach(pkg => {
      allCVEs.forEach(cveItem => {
        const vuln = checkVulnerability(pkg, cveItem);
        if (vuln) {
          const key = `${pkg.name}-${vuln.cve_id}`;
          if (!seen.has(key)) {
            seen.add(key);
            vulnerablePackages.push({
              pkg,
              cve_id: vuln.cve_id,
              severity: vuln.severity,
              description: vuln.description
            });
          }
        }
      });
    });

    // Insert/update only vulnerable packages into DB
    await Promise.all(vulnerablePackages.map(async vp => {
      const pkg = vp.pkg;
      const oldVersion = versionMap[pkg.name] || pkg.version;
      const newVersion = pkg.version;
      const status = oldVersion === newVersion ? 'rollback' : 'updated';

      // Packages table
      await dbPromise.query(
        'INSERT INTO packages (asset_id, name, version) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE version=?',
        [assetId, pkg.name, pkg.version, pkg.version]
      );

      // Package updates
      await dbPromise.query(
        `INSERT INTO package_updates (asset_id, software, old_version, new_version, status)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=?`,
        [assetId, pkg.name, oldVersion, newVersion, status, status]
      );

      // Vulnerable packages — safe insert
      await dbPromise.query(
  `INSERT INTO vulnerable_packages (asset_id, software, installed_version, cve_id, severity, description)
   VALUES (?, ?, ?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE
     installed_version = VALUES(installed_version),
     severity = VALUES(severity),
     description = VALUES(description)`,
  [assetId, pkg.name, pkg.version, vp.cve_id, vp.severity, vp.description]
);

    }));

    // ---- Print Summary ----
    const severityCount = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    vulnerablePackages.forEach(vp => {
      if (vp.severity && severityCount[vp.severity] !== undefined) {
        severityCount[vp.severity]++;
      }
    });
    const total = vulnerablePackages.length;

    console.log(`\nHost: ${hostname}`);
    console.log(`Critical: ${severityCount.CRITICAL}`);
    console.log(`High: ${severityCount.HIGH}`);
    console.log(`Medium: ${severityCount.MEDIUM}`);
    console.log(`Low: ${severityCount.LOW}`);
    console.log(`Total: ${total}\n`);

    res.send({ status: 'inventory received', vulnerable: total });

  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// ----------------------------
// Get vulnerabilities per host
// ----------------------------
app.get('/vulnerabilities/:hostname', async (req, res) => {
  const hostname = req.params.hostname;
  try {
    const [rows] = await dbPromise.query(`
      SELECT DISTINCT vp.id, vp.software, vp.installed_version, vp.cve_id, vp.severity, vp.description, a.hostname
      FROM vulnerable_packages vp
      JOIN assets a ON vp.asset_id = a.id
      WHERE a.hostname = ?
    `, [hostname]);
    res.send(rows);
  } catch(err) {
    res.status(500).send(err);
  }
});

// Get all package updates
app.get('/package_updates', async (req, res) => {
  try {
    const [rows] = await dbPromise.query(`
      SELECT pu.id, a.hostname, pu.software, pu.old_version, pu.new_version, pu.status, pu.updated_at
      FROM package_updates pu
      JOIN assets a ON pu.asset_id = a.id
      ORDER BY pu.updated_at DESC
    `);
    res.json(rows);
  } catch(err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// All vulnerabilities (org-wide)
app.get('/vulnerabilities', async (req, res) => {
  try {
    const [rows] = await dbPromise.query(`
      SELECT DISTINCT vp.id, vp.software, vp.installed_version, vp.cve_id, vp.severity, vp.description, a.hostname
      FROM vulnerable_packages vp
      JOIN assets a ON vp.asset_id = a.id
    `);
    res.json(rows);
  } catch(err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// ----------------------------
// Receive individual package update
// ----------------------------
app.post('/package_update', async (req, res) => {
  try {
    const { hostname, software, old_version, new_version, status } = req.body;
    if (!hostname || !software) {
      return res.status(400).json({ message: "hostname and software required" });
    }

    const [rows] = await dbPromise.query(
      'SELECT id FROM assets WHERE hostname=?',
      [hostname]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Asset not found" });
    }
    const assetId = rows[0].id;

    await dbPromise.query(
      `INSERT INTO package_updates (asset_id, software, old_version, new_version, status) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE old_version=VALUES(old_version), new_version=VALUES(new_version), status=VALUES(status)`,
      [assetId, software, old_version, new_version, status]
    );

    res.json({ message: "package_update stored" });
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// ----------------------------
// Get all connected devices
// ----------------------------
app.get('/devices', async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      'SELECT id, hostname, ip, last_seen FROM assets'
    );
    res.json({ count: rows.length, devices: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// ----------------------------
// Start Server  
// ----------------------------
app.listen(3000, '0.0.0.0', () => console.log('Backend running on port 3000'));
