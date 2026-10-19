import React, { useState, useRef } from 'react';
import {
  Crosshair,
  ZoomIn,
  Contrast,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
} from 'lucide-react';
import { RadiologyCase } from '../data/radiologyCases';

interface RadiographViewerProps {
  currentCase: RadiologyCase;
  placedLesion: { x: number; y: number } | null;
  onPlaceLesion: (coords: { x: number; y: number }) => void;
  isSubmitted: boolean;
  showAnatomicalHints: boolean;
}

type WindowPreset = 'standard' | 'bone' | 'air' | 'inverted';

export const RadiographViewer: React.FC<RadiographViewerProps> = ({
  currentCase,
  placedLesion,
  onPlaceLesion,
  isSubmitted,
  showAnatomicalHints,
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [windowPreset, setWindowPreset] = useState<WindowPreset>('standard');
  const [loupeActive, setLoupeActive] = useState<boolean>(true);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!viewerRef.current) return;
    const rect = viewerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setCursorPos({ x, y });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSubmitted || !viewerRef.current) return;
    const rect = viewerRef.current.getBoundingClientRect();
    const x = Math.max(3, Math.min(97, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(3, Math.min(97, ((e.clientY - rect.top) / rect.height) * 100));
    onPlaceLesion({ x, y });
  };

  // Determine anatomical region under cursor
  const probePoint = cursorPos || placedLesion || { x: 50, y: 50 };
  const hoveredRegion = currentCase.anatomicalRegions.reduce((best, reg) => {
    const dist = Math.hypot(reg.x - probePoint.x, reg.y - probePoint.y);
    const bestDist = Math.hypot(best.x - probePoint.x, best.y - probePoint.y);
    return dist < bestDist ? reg : best;
  }, currentCase.anatomicalRegions[0]);

  const isWithinRegionRadius =
    Math.hypot(hoveredRegion.x - probePoint.x, hoveredRegion.y - probePoint.y) <=
    hoveredRegion.radius + 6;

  // Compute CSS filter string for PACS Window/Level presets
  const getFilterClass = (preset: WindowPreset) => {
    switch (preset) {
      case 'bone':
        return 'contrast(1.45) brightness(0.92)';
      case 'air':
        return 'contrast(1.35) brightness(1.12)';
      case 'inverted':
        return 'invert(1) contrast(1.15)';
      default:
        return 'contrast(1.1) brightness(1.0)';
    }
  };

  // Error calculation after submission
  const lesionDistancePct = placedLesion
    ? Math.hypot(
        placedLesion.x - currentCase.targetLesion.x,
        placedLesion.y - currentCase.targetLesion.y
      )
    : null;
  const lesionErrorMm =
    lesionDistancePct !== null ? Math.round(lesionDistancePct * 5.2) : null;
  const isLesionAccurate =
    lesionDistancePct !== null &&
    lesionDistancePct <= currentCase.targetLesion.toleranceRadius;

  // Render anatomical SVG radiograph tailored to scanType
  const renderRadiographArtwork = () => {
    switch (currentCase.scanType) {
      case 'chest_pneumothorax':
        return (
          <g>
            {/* Soft Tissue Thoracic Wall */}
            <path
              d="M70,40 C50,120 45,260 55,440 L345,440 C355,260 350,120 330,40 Z"
              fill="#1E293B"
              opacity="0.55"
            />
            {/* Right Hemithorax (Patient's Right = Viewer's Left): Hyperlucent Tension Pneumothorax */}
            <path
              d="M175,85 C115,85 82,135 76,225 C72,290 74,348 78,378 Q128,382 178,365 Z"
              fill="#030712"
              stroke="#1E293B"
              strokeWidth="1"
            />
            {/* Collapsed Right Lung Atelectatic Mass at Hilum with Sharp Visceral Pleural Line */}
            <path
              d="M178,125 C146,142 134,185 138,242 C142,288 158,325 180,342 Z"
              fill="#334155"
              fillOpacity="0.85"
              stroke="#E2E8F0"
              strokeWidth="2.2"
            />
            {/* Left Lung Field (Viewer's Right): Normal Aerated Lung + Branching Vessels */}
            <path
              d="M215,85 C275,85 312,135 318,225 C322,285 318,325 314,342 Q265,318 220,335 Z"
              fill="#0B1324"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Normal Left Pulmonary Vascular Markings */}
            <g stroke="#64748B" strokeWidth="1.2" opacity="0.6" fill="none">
              <path d="M235,195 Q268,165 292,140" />
              <path d="M262,170 Q282,168 302,162" />
              <path d="M238,215 Q275,212 306,208" />
              <path d="M235,235 Q272,262 298,295" />
              <path d="M262,255 Q285,270 305,275" />
            </g>
            {/* Deviated Trachea & Carina (Shifted Leftward / Viewer's Right) */}
            <path
              d="M198,35 Q204,85 216,135 L228,135 Q216,85 210,35 Z"
              fill="#090D16"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />
            {/* Shifted Mediastinum & Cardiac Silhouette (Pushed to Left / Viewer's Right) */}
            <path
              d="M188,165 C182,220 185,285 195,332 L288,332 C302,285 292,215 245,165 Z"
              fill="#CBD5E1"
              fillOpacity="0.78"
            />
            {/* Rib Cage Bilateral Posterior & Anterior Arcs */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
              const ry = 95 + idx * 32;
              return (
                <g key={idx} stroke="#CBD5E1" strokeWidth="3.2" strokeOpacity="0.42" fill="none">
                  <path d={`M190,${ry} Q125,${ry - 6} 76,${ry + 24}`} />
                  <path d={`M210,${ry} Q275,${ry - 6} 322,${ry + 24}`} />
                </g>
              );
            })}
            {/* Clavicles */}
            <path d="M188,92 Q132,76 74,98" fill="none" stroke="#E2E8F0" strokeWidth="5" strokeOpacity="0.75" />
            <path d="M212,92 Q268,76 326,98" fill="none" stroke="#E2E8F0" strokeWidth="5" strokeOpacity="0.75" />
            {/* Depressed Right Hemidiaphragm vs Normal Left Hemidiaphragm */}
            <path
              d="M74,380 Q128,386 185,365 Q255,315 318,342 L325,445 L68,445 Z"
              fill="#94A3B8"
              fillOpacity="0.75"
            />
          </g>
        );

      case 'wrist_scaphoid':
        return (
          <g>
            {/* Soft Tissue Hand & Wrist Envelope */}
            <path
              d="M115,450 L118,305 C106,265 92,225 84,185 L125,65 L288,65 L276,285 L272,450 Z"
              fill="#1E293B"
              fillOpacity="0.45"
            />
            {/* Distal Radius (Left/Radial Side) */}
            <path
              d="M128,445 L132,308 C132,296 142,288 158,292 L205,305 L200,445 Z"
              fill="#CBD5E1"
              fillOpacity="0.85"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            {/* Distal Ulna & Styloid (Right/Ulnar Side) */}
            <path
              d="M214,445 L216,312 C216,302 246,302 252,312 L256,298 L260,315 L254,445 Z"
              fill="#CBD5E1"
              fillOpacity="0.82"
              stroke="#F8FAFC"
              strokeWidth="1.8"
            />
            {/* Scaphoid Bone (Elongated by Ulnar Deviation) WITH Transverse Waist Fracture */}
            <g>
              {/* Distal Pole of Scaphoid */}
              <path
                d="M134,255 C132,238 148,228 164,235 L170,262 L138,266 Z"
                fill="#E2E8F0"
                stroke="#F8FAFC"
                strokeWidth="1.8"
              />
              {/* Dark Transverse Fracture Line Across Scaphoid Waist */}
              <path
                d="M135,268 L172,264"
                stroke="#020617"
                strokeWidth="4.2"
                strokeLinecap="round"
              />
              {/* Proximal Pole of Scaphoid */}
              <path
                d="M138,271 L172,267 L176,288 C160,294 140,288 138,271 Z"
                fill="#CBD5E1"
                stroke="#F8FAFC"
                strokeWidth="1.8"
              />
            </g>
            {/* Lunate */}
            <path
              d="M184,266 C184,252 214,252 218,268 C218,286 186,288 184,266 Z"
              fill="#CBD5E1"
              fillOpacity="0.85"
              stroke="#F1F5F9"
              strokeWidth="1.6"
            />
            {/* Triquetrum & Pisiform */}
            <ellipse cx="238" cy="268" rx="14" ry="12" fill="#CBD5E1" fillOpacity="0.85" stroke="#F1F5F9" strokeWidth="1.5" />
            {/* Distal Carpal Row (Trapezium, Trapezoid, Capitate, Hamate) */}
            <ellipse cx="136" cy="212" rx="13" ry="11" fill="#CBD5E1" fillOpacity="0.85" stroke="#F1F5F9" strokeWidth="1.5" />
            <ellipse cx="162" cy="210" rx="11" ry="11" fill="#CBD5E1" fillOpacity="0.85" stroke="#F1F5F9" strokeWidth="1.5" />
            <ellipse cx="192" cy="215" rx="16" ry="18" fill="#CBD5E1" fillOpacity="0.88" stroke="#F1F5F9" strokeWidth="1.6" />
            <ellipse cx="228" cy="218" rx="15" ry="16" fill="#CBD5E1" fillOpacity="0.85" stroke="#F1F5F9" strokeWidth="1.5" />
            {/* 5 Metacarpal Shafts */}
            {[
              { x1: 126, y1: 196, x2: 96, y2: 125 },
              { x1: 158, y1: 192, x2: 148, y2: 92 },
              { x1: 190, y1: 192, x2: 188, y2: 85 },
              { x1: 218, y1: 195, x2: 224, y2: 95 },
              { x1: 242, y1: 202, x2: 258, y2: 115 },
            ].map((mc, i) => (
              <line
                key={i}
                x1={mc.x1}
                y1={mc.y1}
                x2={mc.x2}
                y2={mc.y2}
                stroke="#CBD5E1"
                strokeWidth="14"
                strokeLinecap="round"
                opacity="0.85"
              />
            ))}
          </g>
        );

      case 'brain_epidural':
        return (
          <g>
            {/* Cranial Vault Bone Ring (Bright White +1000 HU) */}
            <ellipse
              cx="200"
              cy="245"
              rx="132"
              ry="158"
              fill="#1E293B"
              stroke="#F8FAFC"
              strokeWidth="12"
            />
            {/* Brain Parenchyma Gray/White Matter */}
            <ellipse cx="200" cy="245" rx="122" ry="148" fill="#475569" />
            {/* Cerebral Sulci & Gyri Texture */}
            <g stroke="#1E293B" strokeWidth="2.2" fill="none" opacity="0.65">
              <path d="M115,155 Q145,168 165,152" />
              <path d="M95,205 Q132,215 152,198" />
              <path d="M92,265 Q135,258 155,275" />
              <path d="M112,325 Q148,312 168,332" />
              <path d="M235,145 Q262,162 288,150" />
              <path d="M238,330 Q268,315 292,332" />
            </g>
            {/* Shifted Midline Falx Cerebri (Bowed Rightward / Toward Viewer's Left) */}
            <path
              d="M200,96 Q172,245 200,392"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="2.2"
            />
            {/* Compressed & Shifted Lateral Ventricles (Dark CSF +10 HU) */}
            <path
              d="M172,195 C154,205 152,245 168,268 C176,245 178,215 172,195 Z"
              fill="#090D16"
            />
            <path
              d="M192,208 C198,220 198,242 190,255"
              fill="none"
              stroke="#090D16"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* ACUTE LEFT EPIDURAL HEMATOMA: Bright Biconvex Lentiform Hyperdensity on Viewer's Right */}
            <path
              d="M294,148 C236,188 232,258 298,302 C324,258 326,192 294,148 Z"
              fill="#F8FAFC"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />
            {/* Subtle Temporal Squamous Fracture Line */}
            <line x1="316" y1="215" x2="338" y2="210" stroke="#020617" strokeWidth="2.2" />
          </g>
        );

      case 'abdomen_pneumoperitoneum':
        return (
          <g>
            {/* Lower Thorax & Upper Abdomen Frame */}
            <rect x="60" y="40" width="280" height="420" rx="12" fill="#0F172A" />
            {/* Lower Lung Fields */}
            <path d="M75,45 L182,45 L182,218 Q125,195 75,235 Z" fill="#050811" />
            <path d="M218,45 L325,45 L325,245 Q275,205 218,228 Z" fill="#050811" />
            {/* Heart Shadow */}
            <path d="M168,95 C155,155 165,205 238,215 C248,165 232,105 168,95 Z" fill="#94A3B8" fillOpacity="0.75" />
            {/* Thin Diaphragmatic Domes */}
            <path d="M74,242 Q132,202 192,232" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
            <path d="M208,236 Q268,212 326,252" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
            {/* PATHOGNOMONIC RIGHT SUBDIAPHRAGMATIC FREE AIR CRESCENT (Sickle-Shaped Black Gas) */}
            <path
              d="M84,242 Q134,206 184,232 Q134,228 84,242 Z"
              fill="#020617"
              stroke="#94A3B8"
              strokeWidth="1"
            />
            {/* Left Subdiaphragmatic Free Air + Gastric Bubble */}
            <path
              d="M216,238 Q266,216 312,248 Q266,240 216,238 Z"
              fill="#020617"
            />
            {/* Homogeneous Liver Parenchyma Below the Free Air Crescent */}
            <path
              d="M76,248 Q134,232 188,238 L175,365 L76,345 Z"
              fill="#64748B"
              fillOpacity="0.72"
            />
            {/* Bowel Loops Demonstrating Rigler Double-Wall Sign */}
            <g stroke="#CBD5E1" strokeWidth="3" fill="#090D16" fillOpacity="0.85">
              <rect x="165" y="335" width="88" height="36" rx="18" />
              <rect x="155" y="378" width="102" height="38" rx="19" />
            </g>
            {/* Spine & Ribs */}
            {Array.from({ length: 10 }).map((_, idx) => (
              <rect
                key={idx}
                x="188"
                y={65 + idx * 36}
                width="24"
                height="26"
                rx="3"
                fill="#CBD5E1"
                fillOpacity="0.55"
              />
            ))}
          </g>
        );

      case 'abdomen_volvulus':
        return (
          <g>
            {/* Abdominal Wall Contour */}
            <ellipse cx="200" cy="250" rx="138" ry="195" fill="#334155" fillOpacity="0.45" />
            {/* Lumbar Spine & Pelvis Background */}
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x="186" y={160 + i * 36} width="28" height="28" rx="4" fill="#94A3B8" fillOpacity="0.45" />
            ))}
            <path
              d="M115,320 C88,320 92,385 138,405 L262,405 C308,385 312,320 285,320"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="8"
              strokeOpacity="0.5"
            />
            {/* GIANT COFFEE-BEAN TWISTED SIGMOID LOOP (Extending from LLQ to RUQ) */}
            <g transform="rotate(-24 195 225)">
              {/* Outer Dilated Ahaustral Sigmoid Contour */}
              <ellipse
                cx="195"
                cy="220"
                rx="78"
                ry="128"
                fill="#030712"
                stroke="#CBD5E1"
                strokeWidth="4.5"
              />
              {/* Central Dense Double-Wall Cleft ("Coffee Bean Crease") */}
              <path
                d="M195,94 Q186,220 205,346"
                fill="none"
                stroke="#F8FAFC"
                strokeWidth="6.5"
                strokeLinecap="round"
              />
            </g>
            {/* Point of Torsion in Left Lower Quadrant (Pelvis) */}
            <path d="M225,345 L252,385 L212,388 Z" fill="#94A3B8" fillOpacity="0.65" />
          </g>
        );

      case 'cervical_odontoid':
        return (
          <g>
            {/* Open Mouth Cavity Radiolucent Frame */}
            <ellipse cx="200" cy="245" rx="118" ry="105" fill="#090D16" stroke="#475569" strokeWidth="3" />
            {/* Upper Incisors (Projected Clearly Above Dens) */}
            <g fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5">
              <rect x="152" y="88" width="22" height="32" rx="3" />
              <rect x="176" y="86" width="23" height="36" rx="3" />
              <rect x="201" y="86" width="23" height="36" rx="3" />
              <rect x="226" y="88" width="22" height="32" rx="3" />
            </g>
            {/* C1 (Atlas) Bilateral Lateral Masses */}
            <path
              d="M115,205 L168,205 L164,252 L118,248 Z"
              fill="#CBD5E1"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            <path
              d="M285,205 L232,205 L236,252 L282,248 Z"
              fill="#CBD5E1"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            {/* Odontoid Process (Dens of C2) Apical Segment */}
            <path
              d="M180,252 L182,188 C182,168 218,168 218,188 L220,252 Z"
              fill="#E2E8F0"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            {/* TYPE II TRANSVERSE FRACTURE AT BASE OF ODONTOID */}
            <path
              d="M176,256 L224,255"
              stroke="#020617"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Body of C2 (Axis) & Inferior Articular Processes */}
            <path
              d="M122,262 L178,260 L222,260 L278,262 L268,332 L132,332 Z"
              fill="#CBD5E1"
              stroke="#F8FAFC"
              strokeWidth="2"
            />
            {/* Mandibular Rami & Lower Molars */}
            <path
              d="M82,160 L105,365 L295,365 L318,160"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="12"
              strokeOpacity="0.45"
            />
          </g>
        );

      case 'neck_croup':
        return (
          <g>
            {/* Pediatric Neck Soft Tissue Contour */}
            <path
              d="M125,55 L275,55 L288,365 L345,425 L55,425 L112,365 Z"
              fill="#334155"
              fillOpacity="0.55"
            />
            {/* Cervical Vertebrae Background */}
            {Array.from({ length: 8 }).map((_, i) => (
              <rect
                key={i}
                x="178"
                y={95 + i * 38}
                width="44"
                height="26"
                rx="4"
                fill="#94A3B8"
                fillOpacity="0.4"
              />
            ))}
            {/* Distended Hypopharynx & Pyriform Sinuses */}
            <path
              d="M166,115 C166,155 178,182 192,198 L208,198 C222,182 234,155 234,115 Z"
              fill="#030712"
            />
            {/* STEEPLE SIGN: Symmetric Church-Steeple Subglottic Narrowing at C4-C5 */}
            <path
              d="M200,192 L182,275 L180,415 L220,415 L218,275 Z"
              fill="#020617"
              stroke="#64748B"
              strokeWidth="1.2"
            />
            {/* Bilateral Pediatric Clavicles & Apices */}
            <path d="M182,382 Q125,368 72,392" fill="none" stroke="#E2E8F0" strokeWidth="6" />
            <path d="M218,382 Q275,368 328,392" fill="none" stroke="#E2E8F0" strokeWidth="6" />
          </g>
        );

      case 'wrist_colles':
        return (
          <g>
            {/* True Lateral Wrist Profile Showing "Dinner-Fork" Dorsal Deformity */}
            <path
              d="M155,450 L158,315 C148,285 112,258 108,215 L118,85 L218,85 L224,235 C235,268 242,298 242,330 L240,450 Z"
              fill="#1E293B"
              fillOpacity="0.55"
            />
            {/* Intact Radial & Ulnar Diaphysis */}
            <path
              d="M174,445 L176,315 L222,315 L220,445 Z"
              fill="#CBD5E1"
              stroke="#F8FAFC"
              strokeWidth="2.2"
            />
            {/* EXTRA-ARTICULAR METAPHYSEAL FRACTURE LINE (2.5 cm Proximal to Joint) */}
            <path
              d="M164,312 L224,316"
              stroke="#020617"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Dorsally Displaced & Dorsally Angulated Distal Radial Articular Fragment */}
            <path
              d="M138,262 L195,274 L214,312 L166,308 Z"
              fill="#E2E8F0"
              stroke="#F8FAFC"
              strokeWidth="2.2"
            />
            {/* Dorsally Shifted Carpus (Lunate + Capitate + Metacarpals) */}
            <ellipse cx="158" cy="242" rx="20" ry="15" transform="rotate(-18 158 242)" fill="#CBD5E1" stroke="#F8FAFC" strokeWidth="1.8" />
            <ellipse cx="152" cy="208" rx="18" ry="18" fill="#CBD5E1" stroke="#F8FAFC" strokeWidth="1.8" />
            <path d="M138,188 L142,95 L168,95 L166,188 Z" fill="#CBD5E1" stroke="#F8FAFC" strokeWidth="1.8" />
            {/* Bowed Pronator Quadratus Fat Pad Stripe on Volar Aspect */}
            <path
              d="M228,285 Q246,315 232,355"
              fill="none"
              stroke="#020617"
              strokeWidth="3.5"
              strokeDasharray="6 3"
            />
          </g>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* PACS Diagnostic Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-medium text-slate-200">PACS Diagnostic Lightbox</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-400 tabular-nums">
            {currentCase.modality}
          </span>
        </div>

        {/* Interactive Window/Level & Loupe Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-md">
            {(
              [
                { id: 'standard', label: 'Std W/L' },
                { id: 'bone', label: 'Bone' },
                { id: 'air', label: 'Lung/Air' },
                { id: 'inverted', label: 'Invert' },
              ] as { id: WindowPreset; label: string }[]
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setWindowPreset(preset.id)}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  windowPreset === preset.id
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setLoupeActive((v) => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              loupeActive
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Loupe 2x</span>
          </button>
        </div>
      </div>

      {/* Main Radiograph Interactive Canvas */}
      <div
        ref={viewerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setCursorPos(null)}
        onClick={handleClick}
        className={`relative flex-1 min-h-[430px] bg-[#04070E] overflow-hidden select-none ${
          isSubmitted ? 'cursor-default' : 'cursor-crosshair'
        }`}
      >
        {/* Top-Right On-Canvas Verification Overlay when Answer is Checked */}
        {isSubmitted && (
          <div className="absolute top-3 right-3 z-20 max-w-xs p-3 rounded-lg bg-slate-950/95 border border-slate-700 shadow-xl space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              {isLesionAccurate ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Lesion Pinpoint: CORRECT</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Lesion Pinpoint: {placedLesion ? `OFF BY ${lesionErrorMm} mm` : 'NOT PLACED'}
                  </span>
                </span>
              )}
            </div>
            <div className="font-mono text-[11px] text-slate-300 space-y-0.5 tabular-nums">
              <div>
                Your ROI Pin:{' '}
                {placedLesion
                  ? `(${placedLesion.x.toFixed(1)}%, ${placedLesion.y.toFixed(1)}%)`
                  : 'No pin placed'}
              </div>
              <div className="text-emerald-300">
                Target Lesion: ({currentCase.targetLesion.x.toFixed(1)}%, {currentCase.targetLesion.y.toFixed(1)}%) · Tol: ±{currentCase.targetLesion.toleranceRadius}%
              </div>
              <div className="text-slate-400">
                Site: {currentCase.targetLesion.lesionName}
              </div>
            </div>
          </div>
        )}

        <svg
          viewBox="0 0 400 500"
          className="w-full h-full object-contain pointer-events-none transition-all duration-150"
          style={{ filter: getFilterClass(windowPreset) }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* DICOM Corner Annotations */}
          <g fill="#64748B" fontSize="9.5" fontFamily="IBM Plex Mono">
            <text x="16" y="24">
              {currentCase.caseNumber} · {currentCase.patientInfo.ageSex}
            </text>
            <text x="16" y="38">
              KVp: 110 · mAs: 4.2 · W/L: {windowPreset.toUpperCase()}
            </text>
            <text x="384" y="24" textAnchor="end">
              RADLOCATE PACS
            </text>
            <text x="384" y="38" textAnchor="end">
              R / L STANDARD
            </text>
          </g>

          {/* Scale Calibration Bar on Right Edge */}
          <g stroke="#475569" strokeWidth="1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tick) => (
              <line
                key={tick}
                x1={tick % 5 === 0 ? 378 : 383}
                y1={150 + tick * 20}
                x2="388"
                y2={150 + tick * 20}
              />
            ))}
            <line x1="388" y1="150" x2="388" y2="350" />
          </g>

          {/* Primary Radiograph Anatomical Artwork */}
          {renderRadiographArtwork()}

          {/* Optional Study Mode Region Outlines */}
          {showAnatomicalHints &&
            currentCase.anatomicalRegions.map((reg) => (
              <g key={reg.id}>
                <circle
                  cx={(reg.x / 100) * 400}
                  cy={(reg.y / 100) * 500}
                  r={(reg.radius / 100) * 400}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.55"
                />
              </g>
            ))}

          {/* Student's Placed Pathology Localization Marker */}
          {placedLesion && (
            <g>
              <circle
                cx={(placedLesion.x / 100) * 400}
                cy={(placedLesion.y / 100) * 500}
                r="14"
                fill="#0284C7"
                fillOpacity="0.22"
                stroke="#38BDF8"
                strokeWidth="2"
              />
              <line
                x1={(placedLesion.x / 100) * 400 - 18}
                y1={(placedLesion.y / 100) * 500}
                x2={(placedLesion.x / 100) * 400 + 18}
                y2={(placedLesion.y / 100) * 500}
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
              <line
                x1={(placedLesion.x / 100) * 400}
                y1={(placedLesion.y / 100) * 500 - 18}
                x2={(placedLesion.x / 100) * 400}
                y2={(placedLesion.y / 100) * 500 + 18}
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
              <text
                x={(placedLesion.x / 100) * 400 + 16}
                y={(placedLesion.y / 100) * 500 - 10}
                fill="#38BDF8"
                fontSize="10"
                fontFamily="IBM Plex Mono"
                fontWeight="600"
              >
                ROI PIN
              </text>
            </g>
          )}

          {/* Gold-Standard Pathology Overlay (Post-Submission) */}
          {isSubmitted && (
            <g>
              {placedLesion && (
                <line
                  x1={(placedLesion.x / 100) * 400}
                  y1={(placedLesion.y / 100) * 500}
                  x2={(currentCase.targetLesion.x / 100) * 400}
                  y2={(currentCase.targetLesion.y / 100) * 500}
                  stroke="#F59E0B"
                  strokeWidth="1.8"
                  strokeDasharray="4 3"
                />
              )}
              <circle
                cx={(currentCase.targetLesion.x / 100) * 400}
                cy={(currentCase.targetLesion.y / 100) * 500}
                r={(currentCase.targetLesion.toleranceRadius / 100) * 400}
                fill="#10B981"
                fillOpacity="0.2"
                stroke="#10B981"
                strokeWidth="2.2"
              />
              <circle
                cx={(currentCase.targetLesion.x / 100) * 400}
                cy={(currentCase.targetLesion.y / 100) * 500}
                r="4"
                fill="#10B981"
              />
              <text
                x={(currentCase.targetLesion.x / 100) * 400}
                y={
                  (currentCase.targetLesion.y / 100) * 500 -
                  (currentCase.targetLesion.toleranceRadius / 100) * 400 -
                  8
                }
                textAnchor="middle"
                fill="#34D399"
                fontSize="10.5"
                fontFamily="IBM Plex Mono"
                fontWeight="600"
              >
                LESION TARGET
              </text>
            </g>
          )}
        </svg>

        {/* Floating Cursor Diagnostic Loupe & Densitometer */}
        {cursorPos && !isSubmitted && loupeActive && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-400/70 shadow-2xl overflow-hidden bg-[#04070E]"
            style={{
              left: `${cursorPos.x}%`,
              top: `${cursorPos.y}%`,
              width: '116px',
              height: '116px',
            }}
          >
            <div
              className="w-[400px] h-[500px] origin-top-left"
              style={{
                transform: `scale(1.85) translate(${-(cursorPos.x / 100) * 400 + 31}px, ${
                  -(cursorPos.y / 100) * 500 + 31
                }px)`,
                filter: getFilterClass(windowPreset),
              }}
            >
              <svg viewBox="0 0 400 500" className="w-[400px] h-[500px]">
                {renderRadiographArtwork()}
              </svg>
            </div>
            {/* Loupe Reticle Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-[1px] bg-sky-400/35" />
              <div className="h-full w-[1px] bg-sky-400/35 absolute" />
              <div className="w-2.5 h-2.5 rounded-full border border-sky-400" />
            </div>
            <div className="absolute bottom-1.5 inset-x-0 text-center font-mono text-[9px] text-sky-300 bg-slate-950/80 py-0.5">
              {isWithinRegionRadius ? hoveredRegion.huValue : '-120 HU'}
            </div>
          </div>
        )}

        {/* Bottom Real-Time Cursor Densitometer & Anatomical Telemetry Strip */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-slate-950/90 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <Contrast className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                DENSITOMETER:{' '}
                <span className="text-sky-300 font-semibold">
                  {isWithinRegionRadius ? hoveredRegion.huValue : '+18 HU'}
                </span>{' '}
                · {isWithinRegionRadius ? hoveredRegion.tissueType : 'Adjacent Soft Tissue'}
              </div>
              <div className="text-xs font-semibold text-slate-100">
                {showAnatomicalHints || isSubmitted
                  ? hoveredRegion.label
                  : `Region Probe (${hoveredRegion.tissueType}) — Click lesion on scan to localize`}
              </div>
            </div>
          </div>

          {isSubmitted && lesionErrorMm !== null ? (
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              {isLesionAccurate ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Pinpoint Error: {lesionErrorMm} mm (Exact Lesion Match)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Pinpoint Offset: {lesionErrorMm} mm from {currentCase.targetLesion.lesionName}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-sky-300 font-medium">
              <Crosshair className="w-3.5 h-3.5" />
              <span>
                {placedLesion
                  ? `ROI Pin at (${placedLesion.x.toFixed(0)}%, ${placedLesion.y.toFixed(0)}%)`
                  : 'Click directly on abnormality'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
