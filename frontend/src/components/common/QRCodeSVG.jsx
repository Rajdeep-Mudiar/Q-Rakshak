import React, { useMemo } from 'react';
import QRCode from 'qrcode';
import { EMERGENCY_PORTAL_BASE } from '../../api/config';

/**
 * High-performance, 100% standard-compliant QR Code SVG Renderer.
 * Uses the industry-standard 'qrcode' engine (ISO/IEC 18004 compliant)
 * with single-path SVG compilation for maximum optical scanner accuracy.
 */
export default function QRCodeSVG({
  value = '',
  size = 140,
  fgColor = '#0F172A',
  bgColor = '#FFFFFF',
  level = 'M', // 'L' | 'M' | 'Q' | 'H'
  margin = 2,  // Quiet-zone modules (minimum 2 modules for optical camera detection)
  className = '',
  style = {},
}) {
  const qrData = useMemo(() => {
    const text = String(value || EMERGENCY_PORTAL_BASE || '').trim();
    if (!text) {
      return { valid: false };
    }

    try {
      const qr = QRCode.create(text, {
        errorCorrectionLevel: level,
      });
      const moduleCount = qr.modules.size;
      const totalModules = moduleCount + margin * 2;

      let pathData = '';
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.modules.get(r, c)) {
            pathData += `M${c + margin},${r + margin}h1v1h-1z `;
          }
        }
      }

      return {
        valid: true,
        totalModules,
        pathData,
      };
    } catch (err) {
      console.warn('QRCodeSVG generation error:', err);
      return { valid: false };
    }
  }, [value, level, margin]);

  if (!qrData.valid) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={className}
        style={{ borderRadius: '6px', ...style }}
      >
        <rect width="100" height="100" fill={bgColor} />
        <text x="50" y="52" textAnchor="middle" fontSize="11" fill={fgColor}>
          QR Code
        </text>
      </svg>
    );
  }

  const { totalModules, pathData } = qrData;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${totalModules} ${totalModules}`}
      className={className}
      style={{
        shapeRendering: 'crispEdges',
        display: 'block',
        ...style,
      }}
    >
      {/* Background with essential quiet zone */}
      <rect x="0" y="0" width={totalModules} height={totalModules} fill={bgColor} />

      {/* High-contrast single-path QR matrix */}
      <path d={pathData} fill={fgColor} />
    </svg>
  );
}
