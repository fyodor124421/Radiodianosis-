import React, { useState, useRef } from 'react';
import { Crosshair, Move, CheckCircle2, AlertTriangle, Compass } from 'lucide-react';
import { RadiologyCase } from '../data/radiologyCases';

interface PositioningCanvasProps {
  currentCase: RadiologyCase;
  placedCR: { x: number; y: number } | null;
  onPlaceCR: (coords: { x: number; y: number }) => void;
  collimationScale: number;
  isSubmitted: boolean;
}

interface SurfaceLandmark {
  label: string;
  x: number;
  y: number;
  regionTag: string;
}

const SURFACE_LANDMARKS: SurfaceLandmark[] = [
  { label: 'Glabella / Orbitomeatal Line (OML)', x: 50, y: 21, regionTag: 'Cranial Base' },
  { label: 'Open-Mouth Transoral Axis (C1–C2)', x: 50, y: 25, regionTag: 'Upper Cervical' },
  { label: 'Thyroid Cartilage / C4–C5 Airway', x: 50, y: 28, regionTag: 'Anterior Neck' },
  { label: 'Jugular (Suprasternal) Notch (T2–T3)', x: 50, y: 31, regionTag: 'Superior Thorax' },
  { label: 'T7 Spinous Process / Inferior Scapular Angle', x: 50, y: 36, regionTag: 'Mid-Thorax' },
  { label: 'Xiphoid Tip / Diaphragmatic Domes (T9–T10)', x: 50, y: 44, regionTag: 'Thoracoabdominal' },
  { label: 'Subcostal Plane (L1–L2)', x: 50, y: 50, regionTag: 'Upper Abdomen' },
  { label: 'Iliac Crest Interspace (L4–L5)', x: 50, y: 56, regionTag: 'Mid-Abdomen (KUB)' },
  { label: 'ASIS / Pelvic Inlet', x: 50, y: 63, regionTag: 'Pelvis' },
  { label: 'Pubic Symphysis & Greater Trochanters', x: 50, y: 70, regionTag: 'Inferior Pelvis' },
];

const EXTREMITY_LANDMARKS: SurfaceLandmark[] = [
  { label: '3rd Metacarpophalangeal (MCP) Joint', x: 46, y: 31, regionTag: 'Distal Hand' },
  { label: 'Capitate / Mid-Carpal Row', x: 48, y: 44, regionTag: 'Proximal Carpus' },
  { label: 'Anatomical Snuffbox / Scaphoid Waist & Styloid', x: 44, y: 52, regionTag: 'Radiocarpal' },
  { label: 'Ulnar Head & Styloid Process', x: 60, y: 54, regionTag: 'Ulnocarpal' },
  { label: 'Distal Radius Metaphysis (2 cm Proximal)', x: 46, y: 63, regionTag: 'Distal Forearm' },
  { label: 'Mid-Diaphysis of Radius & Ulna', x: 50, y: 78, regionTag: 'Forearm Shaft' },
];

export const PositioningCanvas: React.FC<PositioningCanvasProps> = ({
  currentCase,
  placedCR,
  onPlaceCR,
  collimationScale,
  isSubmitted,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const isExtremityCase =
    currentCase.scanType === 'wrist_scaphoid' || currentCase.scanType === 'wrist_colles';

  const activeLandmarks = isExtremityCase ? EXTREMITY_LANDMARKS : SURFACE_LANDMARKS;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setCursorPos({ x, y });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSubmitted || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(4, Math.min(96, ((e.clientY - rect.top) / rect.height) * 100));
    onPlaceCR({ x, y });
  };

  // Find closest palpable anatomical landmark to active cursor or placed pin
  const probePoint = cursorPos || placedCR || { x: 50, y: 50 };
  const nearestLandmark = activeLandmarks.reduce((best, item) => {
    const dist = Math.hypot(item.x - probePoint.x, item.y - probePoint.y);
    const bestDist = Math.hypot(best.x - probePoint.x, best.y - probePoint.y);
    return dist < bestDist ? item : best;
  }, activeLandmarks[0]);

  const activeCRDisplay = cursorPos && !isSubmitted ? cursorPos : placedCR;
  const colW = (currentCase.targetCR.collimationWidth * collimationScale) / 100;
  const colH = (currentCase.targetCR.collimationHeight * collimationScale) / 100;

  // Calculate error in mm (1% canvas ~ 7.5 mm clinical field)
  const crDistancePct = placedCR
    ? Math.hypot(placedCR.x - currentCase.targetCR.x, placedCR.y - currentCase.targetCR.y)
    : null;
  const crErrorMm = crDistancePct !== null ? Math.round(crDistancePct * 6.5) : null;
  const isCRAccurate =
    crDistancePct !== null && crDistancePct <= currentCase.targetCR.toleranceRadius;

  return (
    <div className="flex flex-col h-full">
      {/* Top Diagnostic Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Crosshair className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-medium">Bucky Positioning & Laser Central Ray (CR) Stage</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">
            {isExtremityCase ? 'Tabletop Extremity Cassette (40" SID)' : 'Vertical / Table Bucky Grid Receptor'}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-slate-300 tabular-nums">
          <span>
            CURSOR:{' '}
            {cursorPos
              ? `X:${cursorPos.x.toFixed(1)}% Y:${cursorPos.y.toFixed(1)}%`
              : placedCR
              ? `LOCKED X:${placedCR.x.toFixed(1)}% Y:${placedCR.y.toFixed(1)}%`
              : 'MOVE CURSOR ON STAGE'}
          </span>
        </div>
      </div>

      {/* Interactive Positioning Stage */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setCursorPos(null)}
        onClick={handleClick}
        className={`relative flex-1 min-h-[430px] bg-[#090D16] overflow-hidden select-none ${
          isSubmitted ? 'cursor-default' : 'cursor-none'
        }`}
      >
        {/* Top-Right On-Canvas Verification Overlay when Answer is Checked */}
        {isSubmitted && (
          <div className="absolute top-3 right-3 z-20 max-w-xs p-3 rounded-lg bg-slate-950/95 border border-slate-700 shadow-xl space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              {isCRAccurate ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>CR Cursor Placement: CORRECT</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    CR Cursor Placement: {placedCR ? `OFF BY ${crErrorMm} mm` : 'NOT PLACED'}
                  </span>
                </span>
              )}
            </div>
            <div className="font-mono text-[11px] text-slate-300 space-y-0.5 tabular-nums">
              <div>
                Your Cursor:{' '}
                {placedCR
                  ? `(${placedCR.x.toFixed(1)}%, ${placedCR.y.toFixed(1)}%)`
                  : 'No pin placed'}
              </div>
              <div className="text-emerald-300">
                Target CR: ({currentCase.targetCR.x.toFixed(1)}%, {currentCase.targetCR.y.toFixed(1)}%) · Tol: ±{currentCase.targetCR.toleranceRadius}%
              </div>
              <div className="text-slate-400">
                Landmark: {currentCase.targetCR.landmarkName}
              </div>
            </div>
          </div>
        )}

        {/* Subtle Bucky Detector Grid & Measurement Ticks */}
        <svg
          viewBox="0 0 400 500"
          className="w-full h-full object-contain pointer-events-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="buckyGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#1E293B"
                strokeWidth="0.6"
                strokeOpacity="0.65"
              />
            </pattern>
            <radialGradient id="patientGlow" cx="50%" cy="48%" r="48%">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#090D16" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Detector Background Grid */}
          <rect x="0" y="0" width="400" height="500" fill="url(#buckyGrid)" />
          <rect x="0" y="0" width="400" height="500" fill="url(#patientGlow)" />

          {/* Bucky Ionization Chambers (AEC Cells) */}
          <g stroke="#334155" strokeWidth="1" fill="none" opacity="0.5">
            <rect x="50" y="30" width="300" height="440" rx="8" strokeDasharray="4 4" />
            <line x1="200" y1="20" x2="200" y2="480" stroke="#334155" strokeWidth="0.8" />
            <line x1="40" y1="250" x2="360" y2="250" stroke="#334155" strokeWidth="0.8" />
            {/* R / L Lead Marker */}
            <rect x="64" y="46" width="22" height="22" rx="3" fill="#0F172A" stroke="#475569" />
            <text x="75" y="61" textAnchor="middle" fill="#94A3B8" fontSize="11" fontFamily="IBM Plex Mono" fontWeight="600">
              R
            </text>
          </g>

          {!isExtremityCase ? (
            /* Full Head, Neck, Thorax, Abdomen, Pelvis Anatomical Silhouette & Landmarks */
            <g>
              {/* Outer Body Contour */}
              <path
                d="M200,45 C228,45 242,68 240,98 C238,118 228,132 224,142 C258,148 302,158 314,186 C324,210 326,280 320,340 L304,340 C302,285 298,225 288,205 L282,300 C286,335 292,375 286,435 L212,435 L206,375 L194,375 L188,435 L114,435 C108,375 114,335 118,300 L112,205 C102,225 98,285 96,340 L80,340 C74,280 76,210 86,186 C98,158 142,148 176,142 C172,132 162,118 160,98 C158,68 172,45 200,45 Z"
                fill="#1E293B"
                fillOpacity="0.55"
                stroke="#475569"
                strokeWidth="1.5"
              />

              {/* Cranial Vault & Orbitomeatal Reference */}
              <ellipse cx="200" cy="86" rx="32" ry="38" fill="none" stroke="#64748B" strokeWidth="1.2" />
              {/* OML Dashed Guide */}
              <line x1="158" y1="105" x2="242" y2="105" stroke="#38BDF8" strokeWidth="0.9" strokeDasharray="3 2" opacity="0.5" />
              {/* Open Mouth C1-C2 Guide */}
              <rect x="186" y="116" width="28" height="12" rx="4" fill="#0F172A" stroke="#64748B" strokeWidth="1" />

              {/* Cervical & Thoracic & Lumbar Vertebral Column */}
              {Array.from({ length: 19 }).map((_, idx) => {
                const vy = 128 + idx * 11.5;
                const vw = 14 + idx * 0.6;
                return (
                  <rect
                    key={idx}
                    x={200 - vw / 2}
                    y={vy}
                    width={vw}
                    height="8"
                    rx="2"
                    fill="#334155"
                    stroke="#64748B"
                    strokeWidth="0.8"
                  />
                );
              })}

              {/* Clavicles & Scapulae */}
              <path d="M192,155 Q155,148 122,164" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M208,155 Q245,148 278,164" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

              {/* Rib Cage & Lung Fields */}
              <path
                d="M192,162 C152,162 132,195 130,235 C155,228 178,228 192,235 Z"
                fill="#0F172A"
                fillOpacity="0.65"
                stroke="#475569"
                strokeWidth="1"
              />
              <path
                d="M208,162 C248,162 268,195 270,235 C245,228 222,228 208,235 Z"
                fill="#0F172A"
                fillOpacity="0.65"
                stroke="#475569"
                strokeWidth="1"
              />
              {/* Rib Arcs */}
              {[0, 1, 2, 3, 4, 5].map((r) => (
                <g key={r} stroke="#64748B" strokeWidth="1.1" fill="none" opacity="0.65">
                  <path d={`M192,${166 + r * 11} Q148,${168 + r * 11} 132,${180 + r * 11}`} />
                  <path d={`M208,${166 + r * 11} Q252,${168 + r * 11} 268,${180 + r * 11}`} />
                </g>
              ))}

              {/* Diaphragmatic Domes (T9-T10) */}
              <path d="M128,225 Q162,210 200,222 Q238,212 272,226" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 2" />

              {/* Pelvic Iliac Crests (L4-L5) & Symphysis */}
              <path
                d="M158,280 C130,275 122,305 136,332 C150,352 178,358 196,356 L204,356 C222,358 250,352 264,332 C278,305 270,275 242,280"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.8"
              />

              {/* Palpable Anatomical Fiducial Dots */}
              {SURFACE_LANDMARKS.map((lm, i) => (
                <g key={i}>
                  <circle
                    cx={(lm.x / 100) * 400}
                    cy={(lm.y / 100) * 500}
                    r="3.2"
                    fill="#38BDF8"
                    fillOpacity="0.45"
                    stroke="#0284C7"
                    strokeWidth="1"
                  />
                </g>
              ))}
            </g>
          ) : (
            /* Dedicated Upper Extremity Hand / Wrist / Forearm Positioning Stage */
            <g>
              {/* Forearm & Hand Outline on Tabletop Cassette */}
              <path
                d="M145,440 L148,295 C142,272 132,245 128,218 L102,175 C96,164 104,154 114,162 L136,188 L142,112 C143,98 156,98 157,112 L162,172 L174,95 C176,82 190,82 190,96 L191,168 L206,104 C208,90 222,92 219,106 L212,174 L228,126 C232,114 244,118 240,130 L224,205 C226,238 220,268 214,295 L218,440 Z"
                fill="#1E293B"
                fillOpacity="0.6"
                stroke="#64748B"
                strokeWidth="1.8"
              />
              {/* Distal Radius & Ulna Outlines */}
              <path
                d="M156,430 L158,288 L192,284 L190,430 Z"
                fill="#334155"
                fillOpacity="0.7"
                stroke="#94A3B8"
                strokeWidth="1.4"
              />
              <path
                d="M198,430 L198,290 L214,292 L214,430 Z"
                fill="#334155"
                fillOpacity="0.7"
                stroke="#94A3B8"
                strokeWidth="1.4"
              />
              {/* Carpal Bones Cluster (Scaphoid highlighted slightly) */}
              <ellipse cx="172" cy="262" rx="14" ry="10" transform="rotate(-25 172 262)" fill="#475569" stroke="#CBD5E1" strokeWidth="1.3" />
              <ellipse cx="195" cy="266" rx="11" ry="9" fill="#334155" stroke="#94A3B8" strokeWidth="1.2" />
              <ellipse cx="186" cy="242" rx="12" ry="11" fill="#334155" stroke="#94A3B8" strokeWidth="1.2" />
              {/* Extremity Landmark Fiducials */}
              {EXTREMITY_LANDMARKS.map((lm, i) => (
                <circle
                  key={i}
                  cx={(lm.x / 100) * 400}
                  cy={(lm.y / 100) * 500}
                  r="3.8"
                  fill="#38BDF8"
                  fillOpacity="0.5"
                  stroke="#0284C7"
                  strokeWidth="1"
                />
              ))}
            </g>
          )}

          {/* Illuminated Collimator Light Field & Laser Crosshair following Cursor or Placed CR */}
          {activeCRDisplay && (
            <g>
              {/* Warm Collimator Light Box */}
              <rect
                x={(activeCRDisplay.x / 100) * 400 - (colW / 100) * 200}
                y={(activeCRDisplay.y / 100) * 500 - (colH / 100) * 250}
                width={(colW / 100) * 400}
                height={(colH / 100) * 500}
                fill="#FDE047"
                fillOpacity="0.07"
                stroke="#FACC15"
                strokeWidth="1.2"
                strokeDasharray="6 3"
              />
              {/* Laser Red Central Ray Crosshair Lines */}
              <line
                x1={(activeCRDisplay.x / 100) * 400 - (colW / 100) * 200}
                y1={(activeCRDisplay.y / 100) * 500}
                x2={(activeCRDisplay.x / 100) * 400 + (colW / 100) * 200}
                y2={(activeCRDisplay.y / 100) * 500}
                stroke="#EF4444"
                strokeWidth="1.4"
                strokeOpacity="0.85"
              />
              <line
                x1={(activeCRDisplay.x / 100) * 400}
                y1={(activeCRDisplay.y / 100) * 500 - (colH / 100) * 250}
                x2={(activeCRDisplay.x / 100) * 400}
                y2={(activeCRDisplay.y / 100) * 500 + (colH / 100) * 250}
                stroke="#EF4444"
                strokeWidth="1.4"
                strokeOpacity="0.85"
              />
              {/* Center CR Reticle */}
              <circle
                cx={(activeCRDisplay.x / 100) * 400}
                cy={(activeCRDisplay.y / 100) * 500}
                r="7"
                fill="none"
                stroke="#EF4444"
                strokeWidth="1.8"
              />
              <circle
                cx={(activeCRDisplay.x / 100) * 400}
                cy={(activeCRDisplay.y / 100) * 500}
                r="2"
                fill="#EF4444"
              />
            </g>
          )}

          {/* Locked Central Ray Pin */}
          {placedCR && (
            <g>
              <circle
                cx={(placedCR.x / 100) * 400}
                cy={(placedCR.y / 100) * 500}
                r="10"
                fill="#0284C7"
                fillOpacity="0.25"
                stroke="#38BDF8"
                strokeWidth="2"
              />
              <circle
                cx={(placedCR.x / 100) * 400}
                cy={(placedCR.y / 100) * 500}
                r="3.5"
                fill="#38BDF8"
              />
              <text
                x={(placedCR.x / 100) * 400 + 14}
                y={(placedCR.y / 100) * 500 + 4}
                fill="#38BDF8"
                fontSize="10"
                fontFamily="IBM Plex Mono"
                fontWeight="600"
              >
                YOUR CR
              </text>
            </g>
          )}

          {/* Post-Submission Gold-Standard Target Overlay */}
          {isSubmitted && (
            <g>
              {placedCR && (
                <line
                  x1={(placedCR.x / 100) * 400}
                  y1={(placedCR.y / 100) * 500}
                  x2={(currentCase.targetCR.x / 100) * 400}
                  y2={(currentCase.targetCR.y / 100) * 500}
                  stroke="#F59E0B"
                  strokeWidth="1.8"
                  strokeDasharray="4 3"
                />
              )}
              <circle
                cx={(currentCase.targetCR.x / 100) * 400}
                cy={(currentCase.targetCR.y / 100) * 500}
                r={(currentCase.targetCR.toleranceRadius / 100) * 400}
                fill="#10B981"
                fillOpacity="0.18"
                stroke="#10B981"
                strokeWidth="2"
              />
              <circle
                cx={(currentCase.targetCR.x / 100) * 400}
                cy={(currentCase.targetCR.y / 100) * 500}
                r="4"
                fill="#10B981"
              />
              <text
                x={(currentCase.targetCR.x / 100) * 400 - 14}
                y={(currentCase.targetCR.y / 100) * 500 - 14}
                textAnchor="end"
                fill="#34D399"
                fontSize="10"
                fontFamily="IBM Plex Mono"
                fontWeight="600"
              >
                IDEAL CR ({currentCase.targetCR.landmarkName.split('(')[0].trim()})
              </text>
            </g>
          )}
        </svg>

        {/* Live Palpable Landmark Telemetry Overlay at Bottom of Stage */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-slate-950/90 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-400">
                Palpable Landmark Under Cursor ({nearestLandmark.regionTag})
              </div>
              <div className="text-xs font-semibold text-slate-100">
                {nearestLandmark.label}
              </div>
            </div>
          </div>

          {isSubmitted && crErrorMm !== null ? (
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              {isCRAccurate ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  CR Offset: {crErrorMm} mm (Within Clinical Tolerance)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  CR Offset: {crErrorMm} mm from {currentCase.targetCR.landmarkName}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-sky-300 font-medium">
              <Move className="w-3.5 h-3.5" />
              <span>{placedCR ? 'Click anywhere to reposition CR pin' : 'Move cursor & click to place Central Ray'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
