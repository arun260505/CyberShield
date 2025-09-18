import React, { useEffect, useState, useCallback } from "react";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";

const severityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4, UNKNOWN: 5 };

// ----------------- Enhanced Professional Styles -----------------
const styles = {
  page: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    display: "flex",
    height: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
    color: "#ffffff",
    overflow: "hidden",
  },
  sidebar: {
    width: 320,
    background: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(20px)",
    borderRight: "1px solid rgba(59, 130, 246, 0.2)",
    padding: "32px 24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  sidebarHeader: {
    marginBottom: 32,
    textAlign: "center",
  },
  brand: {
    fontSize: 28,
    fontWeight: 800,
    background: "linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: 8,
  },
  brandSub: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "2px",
  },
  deviceSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#e2e8f0",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  deviceCount: {
    background: "rgba(59, 130, 246, 0.2)",
    color: "#60a5fa",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid rgba(59, 130, 246, 0.3)",
  },
  deviceItem: {
    padding: "16px 20px",
    marginBottom: 8,
    borderRadius: 12,
    cursor: "pointer",
    background: "rgba(30, 41, 59, 0.5)",
    border: "1px solid rgba(51, 65, 85, 0.6)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
  },
  deviceItemActive: {
    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 100%)",
    border: "1px solid rgba(59, 130, 246, 0.5)",
    boxShadow: "0 8px 32px rgba(59, 130, 246, 0.2)",
    transform: "translateX(4px)",
  },
  deviceName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#f1f5f9",
    marginBottom: 4,
  },
  deviceIP: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "'JetBrains Mono', monospace",
  },
  statusIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  topBar: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(51, 65, 85, 0.3)",
    padding: "24px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#f1f5f9",
  },
  autoRefresh: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "#10b981",
    fontSize: 14,
    fontWeight: 500,
  },
  refreshDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10b981",
    animation: "pulse 2s infinite",
  },
  content: {
    flex: 1,
    padding: "32px",
    overflowY: "auto",
    overflowX: "hidden",
    display: "flex",
    gap: 32,
    minWidth: 0,
  },
  leftPanel: {
    flex: 2,
    display: "flex",
    flexDirection: "column",
    gap: 24,
    minWidth: 0,
    overflowX: "hidden",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 24,
    minWidth: 320,
    maxWidth: 400,
  },
  card: {
    background: "rgba(30, 41, 59, 0.6)",
    backdropFilter: "blur(20px)",
    borderRadius: 20,
    border: "1px solid rgba(51, 65, 85, 0.4)",
    padding: 28,
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 24,
  },
  statBox: {
    background: "rgba(51, 65, 85, 0.4)",
    padding: "16px",
    borderRadius: 12,
    textAlign: "center",
    border: "1px solid rgba(71, 85, 105, 0.3)",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 800,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#94a3b8",
    textTransform: "uppercase",
    fontWeight: 600,
    letterSpacing: "0.5px",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    borderRadius: 12,
    overflow: "hidden",
    background: "rgba(51, 65, 85, 0.3)",
    tableLayout: "fixed",
  },
  th: {
    background: "rgba(15, 23, 42, 0.8)",
    color: "#e2e8f0",
    padding: "16px",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  td: {
    padding: "16px",
    borderBottom: "1px solid rgba(51, 65, 85, 0.3)",
    fontSize: 14,
    color: "#cbd5e1",
    wordWrap: "break-word",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  severityBadge: {
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  critical: { 
    background: "linear-gradient(135deg, #dc2626, #b91c1c)", 
    color: "#ffffff", 
    border: "1px solid #dc2626",
    boxShadow: "0 0 20px rgba(220, 38, 38, 0.4), 0 0 40px rgba(220, 38, 38, 0.2)",
    animation: "criticalPulse 2s infinite",
    fontWeight: 800,
    textShadow: "0 1px 2px rgba(0,0,0,0.5)"
  },
  high: { 
    background: "linear-gradient(135deg, #ea580c, #c2410c)", 
    color: "#ffffff", 
    border: "1px solid #ea580c",
    boxShadow: "0 0 15px rgba(234, 88, 12, 0.3)",
    fontWeight: 700,
    textShadow: "0 1px 2px rgba(0,0,0,0.3)"
  },
  medium: { 
    background: "linear-gradient(135deg, #d97706, #b45309)", 
    color: "#ffffff", 
    border: "1px solid #d97706",
    boxShadow: "0 0 10px rgba(217, 119, 6, 0.2)",
    fontWeight: 600
  },
  low: { 
    background: "linear-gradient(135deg, #16a34a, #15803d)", 
    color: "#ffffff", 
    border: "1px solid #16a34a",
    fontWeight: 600
  },
  pieContainer: {
    height: 300,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#64748b",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.3,
  },
  logsContainer: {
    background: "rgba(15, 23, 42, 0.8)",
    borderRadius: 12,
    padding: 20,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    maxHeight: 300,
    overflowY: "auto",
    border: "1px solid rgba(59, 130, 246, 0.2)",
  },
  logEntry: {
    marginBottom: 8,
    padding: "4px 0",
  },
  codeBlock: {
    background: "rgba(59, 130, 246, 0.1)",
    color: "#60a5fa",
    padding: "2px 8px",
    borderRadius: 6,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
  },
};

const cssKeyframes = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes criticalPulse {
    0%, 100% { 
      box-shadow: 0 0 20px rgba(220, 38, 38, 0.4), 0 0 40px rgba(220, 38, 38, 0.2);
      transform: scale(1);
    }
    50% { 
      box-shadow: 0 0 30px rgba(220, 38, 38, 0.6), 0 0 60px rgba(220, 38, 38, 0.3);
      transform: scale(1.05);
    }
  }
  
  @keyframes criticalGlow {
    0%, 100% { 
      background: linear-gradient(135deg, #dc2626, #b91c1c);
    }
    50% { 
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }
  }
  
  .device-item:hover:not(.active) {
    background: rgba(51, 65, 85, 0.7) !important;
    border-color: rgba(71, 85, 105, 0.8) !important;
    transform: translateX(2px);
  }
  
  .vuln-row:hover {
    background: rgba(59, 130, 246, 0.05) !important;
  }
  
  .critical-row {
    background: rgba(220, 38, 38, 0.05) !important;
    border-left: 4px solid #dc2626 !important;
  }
  
  .critical-row:hover {
    background: rgba(220, 38, 38, 0.1) !important;
  }
  
  .high-row {
    background: rgba(234, 88, 12, 0.03) !important;
    border-left: 3px solid #ea580c !important;
  }
  
  .severity-critical {
    animation: criticalPulse 2s infinite !important;
  }
  
  .severity-high {
    box-shadow: 0 0 15px rgba(234, 88, 12, 0.3) !important;
  }
`;

export default function Admin() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [logs, setLogs] = useState([]);
  const [allVulnerabilities, setAllVulnerabilities] = useState([]);
  const [packageUpdates, setPackageUpdates] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Add CSS keyframes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = cssKeyframes;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Real-time data fetching
  const fetchAllData = useCallback(async () => {
    try {
      const [devicesRes, vulnRes, updatesRes] = await Promise.all([
        fetch("http://localhost:3000/devices"),
        fetch("http://localhost:3000/vulnerabilities"),
        fetch("http://localhost:3000/package_updates")
      ]);

      const devicesData = await devicesRes.json();
      const vulnData = await vulnRes.json();
      const updatesData = await updatesRes.json();

      setDevices(devicesData.devices || []);
      setAllVulnerabilities(vulnData || []);
      setPackageUpdates(updatesData || []);
      setLastUpdate(new Date());

      if (selectedDevice) {
        const deviceVulnRes = await fetch(
          `http://localhost:3000/vulnerabilities/${encodeURIComponent(selectedDevice.hostname)}`
        );
        const deviceVulnData = await deviceVulnRes.json();
        setVulnerabilities(deviceVulnData || []);
      }
    } catch (err) {
      console.error("Real-time update failed:", err);
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Auto-sync failed`]);
    }
  }, [selectedDevice]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Fetch device vulnerabilities when device is selected
  const selectDevice = useCallback(async (device) => {
    setSelectedDevice(device);
    try {
      const res = await fetch(
        `http://localhost:3000/vulnerabilities/${encodeURIComponent(device.hostname)}`
      );
      const data = await res.json();
      setVulnerabilities(data || []);
    } catch (err) {
      console.error(err);
      setVulnerabilities([]);
    }
  }, []);

  // Calculate severity counts
  const severityCounts = selectedDevice
    ? vulnerabilities.reduce((acc, v) => {
        const sev = (v.severity || "UNKNOWN").toUpperCase();
        acc[sev] = (acc[sev] || 0) + 1;
        return acc;
      }, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 })
    : { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  const orgSeverityCounts = allVulnerabilities.reduce((acc, v) => {
    const sev = (v.severity || "UNKNOWN").toUpperCase();
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });

  const devicePieData = {
    labels: ["Critical", "High", "Medium", "Low"],
    datasets: [{
      data: [severityCounts.CRITICAL, severityCounts.HIGH, severityCounts.MEDIUM, severityCounts.LOW],
      backgroundColor: ["#ef4444", "#f97316", "#eab308", "#22c55e"],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const [expandedRows, setExpandedRows] = useState({});

const toggleRow = (index) => {
  setExpandedRows((prev) => ({
    ...prev,
    [index]: !prev[index],
  }));
};

  const orgPieData = {
    labels: ["Critical", "High", "Medium", "Low"],
    datasets: [{
      data: [orgSeverityCounts.CRITICAL, orgSeverityCounts.HIGH, orgSeverityCounts.MEDIUM, orgSeverityCounts.LOW],
      backgroundColor: ["#ef4444", "#f97316", "#eab308", "#22c55e"],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          font: { size: 12, weight: 600 },
          padding: 20,
        },
      },
    },
  };

  const getSeverityBadge = (severity) => {
    const sev = (severity || "UNKNOWN").toUpperCase();
    let badgeStyle = { ...styles.severityBadge };
    let className = "";
    
    switch (sev) {
      case "CRITICAL": 
        badgeStyle = { ...badgeStyle, ...styles.critical };
        className = "severity-critical";
        break;
      case "HIGH": 
        badgeStyle = { ...badgeStyle, ...styles.high };
        className = "severity-high";
        break;
      case "MEDIUM": 
        badgeStyle = { ...badgeStyle, ...styles.medium };
        break;
      case "LOW": 
        badgeStyle = { ...badgeStyle, ...styles.low };
        break;
      default: 
        badgeStyle = { ...badgeStyle, background: "#64748b", color: "#ffffff" };
    }
    
    return (
      <span className={className} style={badgeStyle}>
        {sev === "CRITICAL" && "🚨 "}
        {sev === "HIGH" && "⚠️ "}
        {sev}
      </span>
    );
  };

  const truncateDescription = (desc, maxLength = 60) => {
    if (!desc) return "No description available";
    return desc.length > maxLength ? desc.substring(0, maxLength) + "..." : desc;
  };

  return (
    <div style={styles.page}>
      {/* Fixed Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.brand}>🛡️ CyberShield</div>
          <div style={styles.brandSub}>Security Center</div>
        </div>

        <div style={styles.deviceSection}>
          <div style={styles.sectionTitle}>
            <span>Connected Devices</span>
            <div style={styles.deviceCount}>{devices.length}</div>
          </div>

          {devices.map((device) => (
            <div
              key={device.id}
              className={`device-item ${selectedDevice?.id === device.id ? 'active' : ''}`}
              style={{
                ...styles.deviceItem,
                ...(selectedDevice?.id === device.id ? styles.deviceItemActive : {}),
              }}
              onClick={() => selectDevice(device)}
            >
              <div style={styles.statusIndicator}></div>
              <div style={styles.deviceName}>{device.hostname}</div>
              <div style={styles.deviceIP}>{device.ip}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <div style={styles.topBar}>
          <div style={styles.pageTitle}>
            {selectedDevice ? `${selectedDevice.hostname} Security Analysis` : "Security Dashboard"}
          </div>
          <div style={styles.autoRefresh}>
            <div style={styles.refreshDot}></div>
            <span>Auto-sync • Last updated {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.leftPanel}>
            {/* Vulnerabilities Table */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  🔍 Vulnerability Assessment
                </div>
              </div>

              {selectedDevice ? (
                <>
                  <div style={styles.statsRow}>
                    <div style={styles.statBox}>
                      <div style={{ 
                        ...styles.statNumber, 
                        color: "#ef4444",
                        animation: severityCounts.CRITICAL > 0 ? "criticalPulse 2s infinite" : "none",
                        textShadow: severityCounts.CRITICAL > 0 ? "0 0 10px rgba(239, 68, 68, 0.5)" : "none"
                      }}>
                        {severityCounts.CRITICAL}
                      </div>
                      <div style={styles.statLabel}>
                        {severityCounts.CRITICAL > 0 ? "🚨 CRITICAL" : "Critical"}
                      </div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={{ 
                        ...styles.statNumber, 
                        color: "#f97316",
                        textShadow: severityCounts.HIGH > 0 ? "0 0 8px rgba(249, 115, 22, 0.4)" : "none"
                      }}>
                        {severityCounts.HIGH}
                      </div>
                      <div style={styles.statLabel}>
                        {severityCounts.HIGH > 0 ? "⚠️ HIGH" : "High"}
                      </div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={{ ...styles.statNumber, color: "#eab308" }}>{severityCounts.MEDIUM}</div>
                      <div style={styles.statLabel}>Medium</div>
                    </div>
                    <div style={styles.statBox}>
                      <div style={{ ...styles.statNumber, color: "#22c55e" }}>{severityCounts.LOW}</div>
                      <div style={styles.statLabel}>Low</div>
                    </div>
                  </div>

                  {vulnerabilities.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={{ ...styles.th, width: "20%" }}>Software</th>
                            <th style={{ ...styles.th, width: "15%" }}>Version</th>
                            <th style={{ ...styles.th, width: "15%" }}>CVE ID</th>
                            <th style={{ ...styles.th, width: "17%" }}>Severity</th>
                            <th style={{ ...styles.th, width: "38%" }}>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vulnerabilities
                            .sort((a, b) => (severityOrder[a.severity?.toUpperCase() || "UNKNOWN"] || 5) - (severityOrder[b.severity?.toUpperCase() || "UNKNOWN"] || 5))
                            .map((v, i) => (
                              <tr key={i} className="vuln-row">
                                <td style={styles.td}><strong>{v.software}</strong></td>
                                <td style={styles.td}>
                                  <span style={styles.codeBlock}>{v.installed_version}</span>
                                </td>
                                <td style={styles.td}>
                                  <span style={styles.codeBlock}>{v.cve_id}</span>
                                </td>
                                <td style={styles.td}>{getSeverityBadge(v.severity)}</td>
                                <td
  style={{ ...styles.td, cursor: "pointer", color: "#60a5fa" }}
  onClick={() => toggleRow(i)}
>
  {expandedRows[i]
    ? v.description || "No description available"
    : truncateDescription(v.description, 45)}
</td>

                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>✅</div>
                      <div>No vulnerabilities found</div>
                    </div>
                  )}
                </>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>👈</div>
                  <div>Select a device to view vulnerabilities</div>
                </div>
              )}
            </div>

            {/* Package Updates Table */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  📦 Package Updates
                </div>
              </div>

              {selectedDevice ? (
                <>
                  {packageUpdates.filter(p => p.hostname === selectedDevice.hostname).length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={{ ...styles.th, width: "25%" }}>Software</th>
                            <th style={{ ...styles.th, width: "18%" }}>Previous</th>
                            <th style={{ ...styles.th, width: "18%" }}>Updated</th>
                            <th style={{ ...styles.th, width: "20%" }}>Status</th>
                            <th style={{ ...styles.th, width: "24%" }}>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {packageUpdates
                            .filter(p => p.hostname === selectedDevice.hostname)
                            .map((p, i) => (
                              <tr key={i} className="vuln-row">
                                <td style={styles.td}><strong>{p.software}</strong></td>
                                <td style={styles.td}>
                                  <span style={{ ...styles.codeBlock, background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5" }}>
                                    {p.old_version}
                                  </span>
                                </td>
                                <td style={styles.td}>
                                  <span style={{ ...styles.codeBlock, background: "rgba(34, 197, 94, 0.1)", color: "#4ade80" }}>
                                    {p.new_version}
                                  </span>
                                </td>
                                <td style={styles.td}>
                                  <span style={{ ...styles.severityBadge, ...styles.low }}>
                                    {p.status}
                                  </span>
                                </td>
                                <td style={styles.td}>
                                  {new Date(p.updated_at).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>📦</div>
                      <div>No package updates available</div>
                    </div>
                  )}
                </>
              ) : (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>👈</div>
                  <div>Select a device to view package updates</div>
                </div>
              )}
            </div>
          </div>

          <div style={styles.rightPanel}>
            {/* Device Risk Chart */}
            {selectedDevice && Object.values(severityCounts).some(v => v > 0) && (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitle}>📊 Risk Distribution</div>
                </div>
                <div style={styles.pieContainer}>
                  <Pie data={devicePieData} options={pieOptions} />
                </div>
              </div>
            )}

            {/* Organization Overview */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>🏢 Organization Overview</div>
              </div>
              <div style={styles.statsRow}>
                <div style={styles.statBox}>
                  <div style={{ ...styles.statNumber, color: "#ef4444" }}>{orgSeverityCounts.CRITICAL}</div>
                  <div style={styles.statLabel}>Critical</div>
                </div>
                <div style={styles.statBox}>
                  <div style={{ ...styles.statNumber, color: "#f97316" }}>{orgSeverityCounts.HIGH}</div>
                  <div style={styles.statLabel}>High</div>
                </div>
                <div style={styles.statBox}>
                  <div style={{ ...styles.statNumber, color: "#eab308" }}>{orgSeverityCounts.MEDIUM}</div>
                  <div style={styles.statLabel}>Medium</div>
                </div>
                <div style={styles.statBox}>
                  <div style={{ ...styles.statNumber, color: "#22c55e" }}>{orgSeverityCounts.LOW}</div>
                  <div style={styles.statLabel}>Low</div>
                </div>
              </div>
              <div style={styles.pieContainer}>
                <Pie data={orgPieData} options={pieOptions} />
              </div>
            </div>

            {/* Activity Logs */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>📝 System Activity</div>
              </div>
              <div style={styles.logsContainer}>
                {logs.length > 0 ? (
                  logs.slice(-8).map((log, i) => (
                    <div key={i} style={styles.logEntry}>
                      <span style={{ color: "#22d3ee" }}>[SYS]</span> {log}
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#64748b", fontStyle: "italic" }}>
                    Real-time monitoring active...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}