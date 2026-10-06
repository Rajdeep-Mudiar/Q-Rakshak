import React, { useState } from 'react';
import {
  Clock, AlertTriangle, ShieldCheck, CheckCircle2,
  TrendingUp, Calendar, Activity, ChevronRight, Sparkles, RefreshCw
} from 'lucide-react';

export default function TimelineProgressionGraph({
  timelineData,
  loading = false,
  onRefresh,
  onSelectMilestone,
  selectedMilestone = null,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--dt-text-muted)' }}>
        <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Preparing your health timeline...</div>
      </div>
    );
  }

  const data = timelineData || {};
  const history = data.history || [];
  const projections = data.projections || [];

  if (history.length === 0 && projections.length === 0) {
    return (
      <div
        style={{
          padding: '40px 24px',
          textAlign: 'center',
          background: 'var(--dt-bg-surface, #FFFFFF)',
          border: '1px dashed var(--dt-border-default, #E2E8F0)',
          borderRadius: '0px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '0px',
            background: 'rgba(0, 82, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0052FF',
          }}
        >
          <Clock size={24} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--dt-text-primary, #0F172A)', margin: '0 0 6px 0' }}>
            No Longitudinal Progression Data Recorded
          </h4>
          <p style={{ fontSize: '0.80rem', color: 'var(--dt-text-muted, #64748B)', maxWidth: '460px', margin: '0 auto', lineHeight: 1.5 }}>
            Prospective early detection curves and risk trajectory milestones are calculated strictly from genuine longitudinal checkup screenings. Run a diagnostic assessment to generate your personalized timeline.
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            style={{
              padding: '8px 16px',
              borderRadius: '0px',
              background: '#0052FF',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} /> Refresh Timeline
          </button>
        )}
      </div>
    );
  }
  const threshold = data.threshold || 90.0;
  const status = data.status || 'NO_EARLY_DISEASE_DETECTED';
  const isEarlyRisk = status === 'EARLY_RISK_DETECTED';
  const heading = data.insight_heading || (isEarlyRisk ? 'Early Disease Trajectory Detected' : 'No early disease detected');
  const narrative = data.insight_narrative || '';
  const projectedDate = data.projected_crossing_date;
  const daysToThreshold = data.days_to_threshold;

  // Combine history + projections into unified chart series
  // We normalize x coordinates across total days (0 to max days, e.g. 90)
  const maxDay = 90;
  const svgWidth = 520;
  const svgHeight = 220;
  const padLeft = 46;
  const padRight = 30;
  const padTop = 26;
  const padBottom = 34;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Coordinate mappers
  const getX = (day) => padLeft + (Math.max(0, Math.min(maxDay, day)) / maxDay) * chartW;
  const getY = (risk) => padTop + chartH - (Math.max(0, Math.min(100, risk)) / 100) * chartH;

  const thresholdY = getY(threshold);

  // Build projected line path
  const projPathD = projections.length > 0
    ? projections.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.day)} ${getY(p.projected_risk)}`).join(' ')
    : '';

  // Shaded area under projected curve
  const areaPathD = projections.length > 0
    ? `${projPathD} L ${getX(projections[projections.length - 1].day)} ${padTop + chartH} L ${getX(projections[0].day)} ${padTop + chartH} Z`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'var(--dt-font-sans)' }}>
      
      {/* ── 1. Early Detection & Insight Banner ── */}
      <div
        style={{
          padding: '14px 16px',
          borderRadius: '0px',
          background: isEarlyRisk ? '#FFF1F2' : '#F0FDF4',
          border: `1px solid ${isEarlyRisk ? '#FECDD3' : '#BBF7D0'}`,
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '0px',
            background: isEarlyRisk ? '#E11D48' : '#059669',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isEarlyRisk ? <AlertTriangle size={16} /> : <ShieldCheck size={18} />}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <h4
              style={{
                fontSize: '0.88rem',
                fontWeight: 800,
                color: isEarlyRisk ? '#9F1239' : '#065F46',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {heading}
            </h4>

            {isEarlyRisk && projectedDate && (
              <span
                style={{
                  fontSize: '0.66rem',
                  fontFamily: 'var(--dt-font-mono)',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '0px',
                  background: '#BE123C',
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                }}
              >
                90% THRESHOLD: {projectedDate} (~{daysToThreshold}d)
              </span>
            )}

            {!isEarlyRisk && (
              <span
                style={{
                  fontSize: '0.66rem',
                  fontFamily: 'var(--dt-font-mono)',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '0px',
                  background: '#047857',
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                }}
              >
                SURVEILLANCE: OPTIMAL (PEAK &lt; 90%)
              </span>
            )}
          </div>

          <p
            style={{
              fontSize: '0.74rem',
              color: isEarlyRisk ? '#881337' : '#047857',
              margin: '6px 0 0 0',
              lineHeight: 1.5,
            }}
          >
            {narrative}
          </p>
        </div>
      </div>

      {/* ── 2. SVG Longitudinal Progression Graph with 90% Threshold ── */}
      <div
        style={{
          background: 'var(--dt-bg-surface, #FFFFFF)',
          border: '1px solid var(--dt-border-default, #E2E8F0)',
          borderRadius: '0px',
          padding: '14px 16px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="#0052FF" />
            <span style={{ fontSize: '0.80rem', fontWeight: 800, color: 'var(--dt-text-primary, #0F172A)' }}>
              Longitudinal Risk Trajectory &amp; 90% Threshold Line
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.66rem', color: 'var(--dt-text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '0px', background: '#0052FF' }} />
              <span>Evaluated Tests</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '2px', background: isEarlyRisk ? '#E11D48' : '#059669' }} />
              <span>Projected Path</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #DC2626' }} />
              <span style={{ color: '#DC2626', fontWeight: 700 }}>90% Limit</span>
            </div>
          </div>
        </div>

        {/* Chart SVG */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: 'auto', minWidth: '460px', display: 'block' }}
          >
            <defs>
              <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isEarlyRisk ? '#E11D48' : '#059669'} stopOpacity="0.28" />
                <stop offset="100%" stopColor={isEarlyRisk ? '#E11D48' : '#059669'} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Background Grid Lines (Y-Axis) */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = getY(val);
              return (
                <g key={val}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="var(--dt-border-default, #E2E8F0)"
                    strokeWidth="1"
                    strokeDasharray={val === 0 || val === 100 ? 'none' : '3 3'}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fontFamily="var(--dt-font-mono, monospace)"
                    fill="#94A3B8"
                    fontWeight="600"
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* X-Axis Days Milestones */}
            {[0, 15, 30, 45, 60, 75, 90].map((d) => {
              const x = getX(d);
              return (
                <g key={d}>
                  <line
                    x1={x}
                    y1={padTop + chartH}
                    x2={x}
                    y2={padTop + chartH + 4}
                    stroke="#94A3B8"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={padTop + chartH + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="var(--dt-font-mono, monospace)"
                    fill="#64748B"
                    fontWeight="600"
                  >
                    {d === 0 ? 'Day 0' : `+${d}d`}
                  </text>
                </g>
              );
            })}

            {/* ── 90% THRESHOLD LINE & BADGE ── */}
            <line
              x1={padLeft}
              y1={thresholdY}
              x2={svgWidth - padRight}
              y2={thresholdY}
              stroke="#DC2626"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <rect
              x={svgWidth - padRight - 94}
              y={thresholdY - 10}
              width="90"
              height="18"
              rx="0"
              fill="#DC2626"
            />
            <text
              x={svgWidth - padRight - 49}
              y={thresholdY + 2}
              textAnchor="middle"
              fontSize="8.5"
              fontFamily="var(--dt-font-mono, monospace)"
              fill="#FFFFFF"
              fontWeight="800"
            >
              90% THRESHOLD
            </text>

            {/* Shaded Area Under Trajectory */}
            {areaPathD && (
              <path d={areaPathD} fill="url(#projGradient)" />
            )}

            {/* Projected Trajectory Path */}
            {projPathD && (
              <path
                d={projPathD}
                fill="none"
                stroke={isEarlyRisk ? '#E11D48' : '#059669'}
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
            )}

            {/* Projected Nodes (Clickable) */}
            {projections.map((p) => {
              const cx = getX(p.day);
              const cy = getY(p.projected_risk);
              const isSelected = selectedMilestone?.day === p.day;
              return (
                <g
                  key={p.day}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectMilestone && onSelectMilestone(p)}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 6 : 4.5}
                    fill={p.projected_risk >= threshold ? '#DC2626' : isEarlyRisk ? '#E11D48' : '#059669'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="9"
                      fill="none"
                      stroke="#0052FF"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}

            {/* Historical Assessment Points */}
            {history.map((h, idx) => {
              const cx = getX(0); // Anchored at baseline day
              const cy = getY(h.risk_score);
              return (
                <g key={h.id || idx} style={{ cursor: 'pointer' }}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r="5.5"
                    fill="#0052FF"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover / Selected Point Callout */}
        {hoveredPoint && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              borderRadius: '0px',
              background: 'var(--dt-bg-card-hover, #F1F5F9)',
              border: '1px solid var(--dt-border-default, #E2E8F0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.72rem',
            }}
          >
            <div>
              <strong style={{ color: 'var(--dt-text-primary)' }}>{hoveredPoint.milestone} ({hoveredPoint.date}):</strong>{' '}
              <span style={{ color: hoveredPoint.projected_risk >= threshold ? '#DC2626' : '#0052FF' }}>
                {hoveredPoint.projected_risk}% Risk
              </span>
            </div>
            <div style={{ color: 'var(--dt-text-secondary)', fontSize: '0.68rem' }}>
              {hoveredPoint.intervention}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Everyday & Monthly Milestone Progression Table ── */}
      <div
        style={{
          background: 'var(--dt-bg-surface, #FFFFFF)',
          border: '1px solid var(--dt-border-default, #E2E8F0)',
          borderRadius: '0px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--dt-bg-card, #F8FAFC)',
            borderBottom: '1px solid var(--dt-border-default, #E2E8F0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="#0052FF" />
            <strong style={{ fontSize: '0.76rem', color: 'var(--dt-text-primary)' }}>
              Projected Everyday &amp; Milestone Reports
            </strong>
          </div>
          <span style={{ fontSize: '0.64rem', color: 'var(--dt-text-muted)', fontFamily: 'var(--dt-font-mono)' }}>
            90-Day Predictive Horizon
          </span>
        </div>

        <div style={{ maxHeight: '190px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
            <thead>
              <tr style={{ background: 'var(--dt-bg-card)', borderBottom: '1px solid var(--dt-border-default)', textAlign: 'left' }}>
                <th style={{ padding: '7px 12px', color: 'var(--dt-text-muted)', fontWeight: 700 }}>Milestone</th>
                <th style={{ padding: '7px 12px', color: 'var(--dt-text-muted)', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '7px 12px', color: 'var(--dt-text-muted)', fontWeight: 700 }}>Projected Risk</th>
                <th style={{ padding: '7px 12px', color: 'var(--dt-text-muted)', fontWeight: 700 }}>Clinical Action</th>
                <th style={{ padding: '7px 12px', textAlign: 'center', color: 'var(--dt-text-muted)', fontWeight: 700 }}>Simulate 3D</th>
              </tr>
            </thead>
            <tbody>
              {projections.map((p) => {
                const isCritical = p.projected_risk >= threshold;
                const isSelected = selectedMilestone?.day === p.day;
                return (
                  <tr
                    key={p.day}
                    style={{
                      borderBottom: '1px solid var(--dt-border-default)',
                      background: isSelected ? 'rgba(0, 82, 255, 0.08)' : 'transparent',
                      transition: 'background 0.12s ease',
                    }}
                  >
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--dt-text-primary)' }}>
                      {p.milestone}
                    </td>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--dt-font-mono)', color: 'var(--dt-text-secondary)' }}>
                      {p.date}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 7px',
                          borderRadius: '0px',
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          fontFamily: 'var(--dt-font-mono)',
                          background: isCritical ? '#FFF1F2' : p.projected_risk >= 65 ? '#FFFBEB' : '#ECFDF5',
                          color: isCritical ? '#E11D48' : p.projected_risk >= 65 ? '#D97706' : '#059669',
                          border: `1px solid ${isCritical ? '#FECDD3' : p.projected_risk >= 65 ? '#FDE68A' : '#A7F3D0'}`,
                        }}
                      >
                        {p.projected_risk}% {isCritical ? '(CRITICAL)' : ''}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--dt-text-secondary)', fontSize: '0.68rem', maxWidth: '220px' }}>
                      {p.intervention}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onSelectMilestone && onSelectMilestone(p)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '0px',
                          background: isSelected ? '#0052FF' : 'var(--dt-bg-card)',
                          color: isSelected ? '#FFFFFF' : 'var(--dt-text-primary)',
                          border: '1px solid var(--dt-border-default)',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected ? 'Active 3D' : 'View 3D'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
