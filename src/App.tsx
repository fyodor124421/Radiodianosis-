import React, { useState, useMemo } from 'react';
import {
  Crosshair,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  Compass,
  BookOpen,
  Award,
  Sliders,
  ChevronRight,
  Target,
  AlertTriangle,
  PlusCircle,
  UserCheck,
} from 'lucide-react';
import {
  RADIOLOGY_CASES,
  RadiologyCase,
  PatientPoseConfig,
} from './data/radiologyCases';
import { PositioningCanvas } from './components/PositioningCanvas';
import { RadiographViewer } from './components/RadiographViewer';
import { soundEngine } from './utils/soundEffects';

type ActiveSection =
  | 'workbench'
  | 'create-position'
  | 'positioning-guide'
  | 'sign-atlas'
  | 'performance';
type CaseStage = 'positioning' | 'diagnosis';

export interface CaseAttemptResult {
  caseId: string;
  caseNumber: string;
  crScore: number; // out of 25
  crOffsetMm: number;
  isCRAccurate: boolean;
  positioningScore: number; // out of 25
  poseMatchesCount: number; // out of 5 pose parameters
  lesionScore: number; // out of 25
  lesionOffsetMm: number;
  isLesionAccurate: boolean;
  diagnosisScore: number; // out of 25
  totalScore: number; // out of 100
  isCorrectDisease: boolean;
  isCorrectSign: boolean;
  isCorrectPositioning: boolean;
}

const DEFAULT_USER_POSE: PatientPoseConfig = {
  bodyPosture: 'Supine',
  projectionView: 'AP',
  specialManeuver: 'Neutral Standard',
  tubeAngleDeg: 0,
  respirationPhase: 'Suspended / Immobility',
};

const BODY_POSTURES: PatientPoseConfig['bodyPosture'][] = [
  'Erect',
  'Supine',
  'Prone',
  'Lateral Decubitus',
];

const PROJECTION_VIEWS: PatientPoseConfig['projectionView'][] = [
  'PA',
  'AP',
  'True Lateral',
  'Axial CT',
];

const SPECIAL_MANEUVERS: PatientPoseConfig['specialManeuver'][] = [
  'Neutral Standard',
  'Shoulders Rolled Forward',
  'Ulnar Deviation (20°)',
  'Open-Mouth Transoral',
  'OML Parallel (No Contrast)',
  'Chin Slightly Extended',
  'Radioulnar Superimposed (90°)',
];

const RESPIRATION_PHASES: PatientPoseConfig['respirationPhase'][] = [
  'Full Inspiration',
  'Full Expiration',
  'Suspended / Immobility',
  'Phonate "Ahhh"',
];

export default function App() {
  const [casesList, setCasesList] = useState<RadiologyCase[]>(RADIOLOGY_CASES);
  const [activeSection, setActiveSection] = useState<ActiveSection>('workbench');
  const [selectedSubspecialty, setSelectedSubspecialty] = useState<string>('All');
  const [currentCaseIndex, setCurrentCaseIndex] = useState<number>(0);
  const [activeStage, setActiveStage] = useState<CaseStage>('positioning');

  // Interactive Cursor & Patient Position Builder State for Current Case
  const [placedCR, setPlacedCR] = useState<{ x: number; y: number } | null>(null);
  const [userPose, setUserPose] = useState<PatientPoseConfig>(DEFAULT_USER_POSE);
  const [selectedPositioningId, setSelectedPositioningId] = useState<string>('');
  const [collimationScale, setCollimationScale] = useState<number>(100);
  const [step1Checked, setStep1Checked] = useState<boolean>(false);

  const [placedLesion, setPlacedLesion] = useState<{ x: number; y: number } | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string>('');
  const [selectedSign, setSelectedSign] = useState<string>('');

  const [showAnatomicalHints, setShowAnatomicalHints] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [history, setHistory] = useState<Record<string, CaseAttemptResult>>({});

  // State for Custom Patient Position & Case Creator Studio
  const [customTitle, setCustomTitle] = useState<string>(
    'Suspected Left Lower Lobe Pneumonia — Position for PA Chest'
  );
  const [customAgeSex, setCustomAgeSex] = useState<string>('42M');
  const [customSubspecialty, setCustomSubspecialty] =
    useState<RadiologyCase['subspecialty']>('Thoracic');
  const [customScanType, setCustomScanType] =
    useState<RadiologyCase['scanType']>('chest_pneumothorax');
  const [customLandmarkName, setCustomLandmarkName] = useState<string>(
    'T7 Spinous Process (Mid-Thorax)'
  );
  const [customTargetCR, setCustomTargetCR] = useState<{ x: number; y: number }>({
    x: 50,
    y: 36,
  });
  const [customPose, setCustomPose] = useState<PatientPoseConfig>({
    bodyPosture: 'Erect',
    projectionView: 'PA',
    specialManeuver: 'Shoulders Rolled Forward',
    tubeAngleDeg: 0,
    respirationPhase: 'Full Inspiration',
  });
  const [customDisease, setCustomDisease] = useState<string>(
    'Right-Sided Tension Pneumothorax'
  );
  const [customSign, setCustomSign] = useState<string>(
    'Visceral Pleural Line & Contralateral Mediastinal Shift'
  );
  const [customTargetLesion, setCustomTargetLesion] = useState<{ x: number; y: number }>({
    x: 31,
    y: 38,
  });

  // Filtered cases by subspecialty
  const filteredCases = useMemo(() => {
    if (selectedSubspecialty === 'All') return casesList;
    return casesList.filter((c) => c.subspecialty === selectedSubspecialty);
  }, [selectedSubspecialty, casesList]);

  const currentCase: RadiologyCase =
    filteredCases[currentCaseIndex] || filteredCases[0] || casesList[0];

  const subspecialties = useMemo(() => {
    const set = new Set<string>(['All']);
    casesList.forEach((c) => set.add(c.subspecialty));
    return Array.from(set);
  }, [casesList]);

  const resetCaseInputs = () => {
    setPlacedCR(null);
    setUserPose(DEFAULT_USER_POSE);
    setSelectedPositioningId('');
    setCollimationScale(100);
    setStep1Checked(false);
    setPlacedLesion(null);
    setSelectedDisease('');
    setSelectedSign('');
    setIsSubmitted(false);
    setActiveStage('positioning');
  };

  const handleSelectCase = (index: number) => {
    setCurrentCaseIndex(index);
    resetCaseInputs();
    setActiveSection('workbench');
  };

  const handlePlaceCR = (coords: { x: number; y: number }) => {
    soundEngine.playCursorPinClick();
    setPlacedCR(coords);
  };

  const handlePlaceLesion = (coords: { x: number; y: number }) => {
    soundEngine.playCursorPinClick();
    setPlacedLesion(coords);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.enabled = next;
  };

  const handleRestartRotation = () => {
    setHistory({});
    setCurrentCaseIndex(0);
    setSelectedSubspecialty('All');
    resetCaseInputs();
    setActiveSection('workbench');
  };

  // Sync preset option card click with the interactive Patient Position Builder
  const handleSelectPositioningOption = (optId: string) => {
    setSelectedPositioningId(optId);
    if (optId === currentCase.correctPositioningId) {
      setUserPose({ ...currentCase.targetPatientPose });
    }
  };

  // Compare user-constructed PatientPoseConfig against currentCase.targetPatientPose
  const evaluatePatientPose = (pose: PatientPoseConfig, target: PatientPoseConfig) => {
    const postureMatch = pose.bodyPosture === target.bodyPosture;
    const viewMatch = pose.projectionView === target.projectionView;
    const maneuverMatch = pose.specialManeuver === target.specialManeuver;
    const angleMatch = Math.abs(pose.tubeAngleDeg - target.tubeAngleDeg) <= 5;
    const respMatch = pose.respirationPhase === target.respirationPhase;

    const matchesCount = [
      postureMatch,
      viewMatch,
      maneuverMatch,
      angleMatch,
      respMatch,
    ].filter(Boolean).length;

    return {
      postureMatch,
      viewMatch,
      maneuverMatch,
      angleMatch,
      respMatch,
      matchesCount,
      scoreOutOf25: matchesCount * 5,
    };
  };

  const poseEval = evaluatePatientPose(userPose, currentCase.targetPatientPose);

  // Immediate check for Step 1 (Positioning & Central Ray Cursor)
  const handleCheckStep1 = () => {
    const crDist = placedCR
      ? Math.hypot(placedCR.x - currentCase.targetCR.x, placedCR.y - currentCase.targetCR.y)
      : 999;
    const crOk = crDist <= currentCase.targetCR.toleranceRadius;
    const posOk =
      poseEval.matchesCount >= 4 ||
      selectedPositioningId === currentCase.correctPositioningId;

    if (crOk && posOk) {
      soundEngine.playSuccessEval();
    } else {
      soundEngine.playPartialOrMissEval();
    }
    setStep1Checked(true);
  };

  // Evaluate full case
  const handleEvaluateCase = () => {
    // 1. CR Cursor Placement Score (0-25) via Euclidean distance formula
    const crDist = placedCR
      ? Math.hypot(
          placedCR.x - currentCase.targetCR.x,
          placedCR.y - currentCase.targetCR.y
        )
      : 100;
    const crOffsetMm = placedCR ? Math.round(crDist * 6.5) : 999;
    const isCRAccurate = placedCR !== null && crDist <= currentCase.targetCR.toleranceRadius;
    let crScore = 0;
    if (placedCR) {
      if (crDist <= currentCase.targetCR.toleranceRadius) {
        crScore = 25;
      } else if (crDist <= currentCase.targetCR.toleranceRadius * 1.8) {
        crScore = 15;
      } else if (crDist <= currentCase.targetCR.toleranceRadius * 2.6) {
        crScore = 8;
      }
    }

    // 2. Constructed Patient Position Score (0-25)
    const isPresetExact = selectedPositioningId === currentCase.correctPositioningId;
    const positioningScore = isPresetExact
      ? 25
      : Math.max(poseEval.scoreOutOf25, selectedPositioningId ? 5 : 0);
    const isCorrectPositioning = positioningScore >= 20;

    // 3. Lesion Cursor Localization Score (0-25) via Euclidean distance formula
    const lesionDist = placedLesion
      ? Math.hypot(
          placedLesion.x - currentCase.targetLesion.x,
          placedLesion.y - currentCase.targetLesion.y
        )
      : 100;
    const lesionOffsetMm = placedLesion ? Math.round(lesionDist * 5.2) : 999;
    const isLesionAccurate =
      placedLesion !== null && lesionDist <= currentCase.targetLesion.toleranceRadius;
    let lesionScore = 0;
    if (placedLesion) {
      if (lesionDist <= currentCase.targetLesion.toleranceRadius) {
        lesionScore = 25;
      } else if (lesionDist <= currentCase.targetLesion.toleranceRadius * 1.75) {
        lesionScore = 15;
      } else if (lesionDist <= currentCase.targetLesion.toleranceRadius * 2.5) {
        lesionScore = 8;
      }
    }

    // 4. Disease & Radiological Sign Score (0-25)
    const isCorrectDisease = selectedDisease === currentCase.correctDisease;
    const isCorrectSign = selectedSign === currentCase.correctSign;
    const diagnosisScore = (isCorrectDisease ? 15 : 0) + (isCorrectSign ? 10 : 0);

    const totalScore = crScore + positioningScore + lesionScore + diagnosisScore;

    if (totalScore >= 70) {
      soundEngine.playSuccessEval();
    } else {
      soundEngine.playPartialOrMissEval();
    }

    const result: CaseAttemptResult = {
      caseId: currentCase.id,
      caseNumber: currentCase.caseNumber,
      crScore,
      crOffsetMm,
      isCRAccurate,
      positioningScore,
      poseMatchesCount: isPresetExact ? 5 : poseEval.matchesCount,
      lesionScore,
      lesionOffsetMm,
      isLesionAccurate,
      diagnosisScore,
      totalScore,
      isCorrectDisease,
      isCorrectSign,
      isCorrectPositioning,
    };

    setHistory((prev) => ({ ...prev, [currentCase.id]: result }));
    setStep1Checked(true);
    setIsSubmitted(true);
  };

  const handleNextCase = () => {
    if (currentCaseIndex < filteredCases.length - 1) {
      setCurrentCaseIndex((i) => i + 1);
      resetCaseInputs();
    } else {
      setActiveSection('performance');
    }
  };

  // Save a newly created Custom Patient Position Case and launch it immediately
  const handleCreateCustomCase = (e: React.FormEvent) => {
    e.preventDefault();
    const templateCase =
      RADIOLOGY_CASES.find((c) => c.scanType === customScanType) || RADIOLOGY_CASES[0];
    const newCaseNum = `CASE 0${casesList.length + 1}`;
    const newCaseId = `custom-case-${Date.now()}`;

    const createdCase: RadiologyCase = {
      ...templateCase,
      id: newCaseId,
      caseNumber: newCaseNum,
      subspecialty: customSubspecialty,
      difficulty: 'Custom Case',
      patientInfo: {
        ageSex: customAgeSex || '35M',
        chiefComplaint: customTitle,
        clinicalHistory: `Custom student-designed positioning & diagnosis scenario requiring ${customPose.bodyPosture} ${customPose.projectionView} positioning with ${customPose.specialManeuver}.`,
        vitals: 'HR 82 bpm · BP 122/78 mmHg · SpO2 98% RA',
      },
      positioningPrompt: `Create the custom patient position (${customPose.bodyPosture}, ${customPose.projectionView}, ${customPose.specialManeuver}, CR ${customPose.tubeAngleDeg}°) and place the Central Ray cursor at ${customLandmarkName}.`,
      targetCR: {
        x: customTargetCR.x,
        y: customTargetCR.y,
        toleranceRadius: 8,
        landmarkName: customLandmarkName,
        collimationWidth: 55,
        collimationHeight: 50,
      },
      targetPatientPose: { ...customPose },
      correctPositioningId: 'custom-optimal-pos',
      positioningOptions: [
        {
          id: 'custom-optimal-pos',
          projectionName: `${customPose.projectionView} ${customPose.bodyPosture} (${customPose.specialManeuver})`,
          patientPosture: `${customPose.bodyPosture} posture with ${customPose.specialManeuver}`,
          tubeAngle: `${customPose.tubeAngleDeg}° Central Ray to ${customLandmarkName}`,
          respiration: customPose.respirationPhase,
        },
        ...templateCase.positioningOptions.slice(1, 4),
      ],
      positioningExplanation: `Custom positioning protocol: ${customPose.bodyPosture} ${customPose.projectionView} projection with ${customPose.specialManeuver}, ${customPose.tubeAngleDeg}° tube angle, and ${customPose.respirationPhase} centered at ${customLandmarkName}.`,
      targetLesion: {
        ...templateCase.targetLesion,
        x: customTargetLesion.x,
        y: customTargetLesion.y,
      },
      correctDisease: customDisease,
      diseaseOptions: Array.from(
        new Set([customDisease, ...templateCase.diseaseOptions])
      ).slice(0, 4),
      correctSign: customSign,
      signOptions: Array.from(new Set([customSign, ...templateCase.signOptions])).slice(
        0,
        4
      ),
    };

    const updated = [...casesList, createdCase];
    setCasesList(updated);
    setSelectedSubspecialty('All');
    setCurrentCaseIndex(updated.length - 1);
    resetCaseInputs();
    soundEngine.playSuccessEval();
    setActiveSection('workbench');
  };

  // Live Step 1 evaluation metrics
  const step1CrDist = placedCR
    ? Math.hypot(placedCR.x - currentCase.targetCR.x, placedCR.y - currentCase.targetCR.y)
    : null;
  const step1CrOffsetMm = step1CrDist !== null ? Math.round(step1CrDist * 6.5) : null;
  const step1CrCorrect =
    step1CrDist !== null && step1CrDist <= currentCase.targetCR.toleranceRadius;
  const step1PosScore =
    selectedPositioningId === currentCase.correctPositioningId
      ? 25
      : poseEval.scoreOutOf25;

  // Aggregate rotation metrics
  const completedResults = Object.values(history) as CaseAttemptResult[];
  const averageScore =
    completedResults.length > 0
      ? Math.round(
          completedResults.reduce((acc, r) => acc + r.totalScore, 0) / completedResults.length
        )
      : 0;

  const currentResult = history[currentCase.id];
  const isPhase1Ready = Boolean(placedCR && (poseEval.matchesCount >= 3 || selectedPositioningId));
  const isPhase2Ready = Boolean(placedLesion && selectedDisease && selectedSign);

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-slate-100">
      {/* Mandatory 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#workbench"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('workbench');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          RadLocate
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a
            href="#workbench"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('workbench');
            }}
            className={`hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'workbench' ? 'text-slate-100 underline' : ''
            }`}
          >
            Clinical Cases
          </a>
          <a
            href="#create-position"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('create-position');
            }}
            className={`hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'create-position' ? 'text-sky-400 underline' : ''
            }`}
          >
            Create Position
          </a>
          <a
            href="#positioning-guide"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('positioning-guide');
            }}
            className={`hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'positioning-guide' ? 'text-slate-100 underline' : ''
            }`}
          >
            Positioning Guide
          </a>
          <a
            href="#sign-atlas"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('sign-atlas');
            }}
            className={`hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'sign-atlas' ? 'text-slate-100 underline' : ''
            }`}
          >
            Sign Atlas
          </a>
          <a
            href="#performance"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('performance');
            }}
            className={`hover:text-slate-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeSection === 'performance' ? 'text-slate-100 underline' : ''
            }`}
          >
            Performance
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleRestartRotation}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
          >
            Reset Rotation
          </button>
        </div>
      </header>

      {/* Sub-Header Workspace Controls & Progress Strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Interactive Filter Controls for Subspecialty */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
            {subspecialties.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  setSelectedSubspecialty(sub);
                  setCurrentCaseIndex(0);
                  resetCaseInputs();
                  setActiveSection('workbench');
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedSubspecialty === sub
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Unboxed Metadata & Utility Toggles */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <div className="font-mono tabular-nums text-slate-300">
              <span>Completed: {completedResults.length}/{casesList.length} Cases</span>
              <span className="mx-2 text-slate-600">·</span>
              <span>Mean Score: {averageScore}/100</span>
            </div>

            <button
              type="button"
              onClick={() => setActiveSection('create-position')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Custom Position</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAnatomicalHints((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                showAnatomicalHints
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showAnatomicalHints ? 'Hide Region Zones' : 'Show Region Zones'}</span>
            </button>

            <button
              type="button"
              onClick={toggleSound}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
              aria-label="Toggle Workstation Audio"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{soundEnabled ? 'Audio On' : 'Muted'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">
        {activeSection === 'workbench' && (
          <div className="space-y-6">
            {/* Case Selector Strip */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 overflow-x-auto">
              <div className="flex items-center gap-2">
                {filteredCases.map((c, idx) => {
                  const done = Boolean(history[c.id]);
                  const isActive = idx === currentCaseIndex;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCase(idx)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-mono tabular-nums border transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                        isActive
                          ? 'bg-slate-800 border-sky-500 text-white font-semibold'
                          : done
                          ? 'bg-slate-900/70 border-emerald-500/40 text-emerald-300 hover:bg-slate-800'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span>{c.caseNumber}</span>
                      <span className="text-slate-500">·</span>
                      <span className="font-sans">{c.subspecialty}</span>
                      {done && (
                        <span className="text-emerald-400 font-semibold">
                          ({history[c.id].totalScore}%)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                <span>{currentCase.difficulty}</span>
                <span className="mx-2 text-slate-600">·</span>
                <span>{currentCase.modality}</span>
              </div>
            </div>

            {/* Two-Zone Sandbox Layout: Left Interactive Cursor Stage (60%), Right Clinical & Patient Position Builder Deck (40%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* LEFT ZONE: Interactive Cursor Canvas (7 columns on 12-col grid) */}
              <div className="lg:col-span-7 flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                {/* Stage Switcher Tabs */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-950 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveStage('positioning')}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        activeStage === 'positioning'
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>1. Create Patient Position & CR</span>
                      {isPhase1Ready && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playXrayExposureBeep();
                        setActiveStage('diagnosis');
                      }}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        activeStage === 'diagnosis'
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>2. Scan Pinpoint & Diagnosis</span>
                      {isPhase2Ready && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 hidden sm:block">
                    {activeStage === 'positioning'
                      ? 'Step 1: Pose Patient & Click Central Ray'
                      : 'Step 2: Click Pathology on Scan'}
                  </div>
                </div>

                {/* Active Task Banner Above Canvas */}
                <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-sky-400">
                      {activeStage === 'positioning'
                        ? 'Interactive Patient Position & Central Ray Task'
                        : 'Interactive Radiograph Localization Task'}
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {activeStage === 'positioning'
                        ? currentCase.positioningPrompt
                        : currentCase.diagnosisPrompt}
                    </p>
                  </div>
                </div>

                {/* Render Active Interactive Cursor Canvas */}
                <div className="flex-1 flex flex-col">
                  {activeStage === 'positioning' ? (
                    <PositioningCanvas
                      currentCase={currentCase}
                      placedCR={placedCR}
                      onPlaceCR={handlePlaceCR}
                      userPose={userPose}
                      collimationScale={collimationScale}
                      isSubmitted={isSubmitted || step1Checked}
                    />
                  ) : (
                    <RadiographViewer
                      currentCase={currentCase}
                      placedLesion={placedLesion}
                      onPlaceLesion={handlePlaceLesion}
                      isSubmitted={isSubmitted}
                      showAnatomicalHints={showAnatomicalHints}
                    />
                  )}
                </div>
              </div>

              {/* RIGHT ZONE: Clinical Requisition, Interactive Patient Position Creator & Diagnosis Deck (5 columns) */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                {/* Clinical Requisition Header Card */}
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span>Clinical Requisition · {currentCase.caseNumber}</span>
                    <span className="font-mono tabular-nums text-slate-300">
                      Patient: {currentCase.patientInfo.ageSex}
                    </span>
                  </div>

                  <h1 className="font-display text-lg font-bold text-slate-100 leading-snug">
                    {currentCase.patientInfo.chiefComplaint}
                  </h1>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentCase.patientInfo.clinicalHistory}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-400 tabular-nums">
                    Vitals: {currentCase.patientInfo.vitals}
                  </div>
                </div>

                {/* Interactive Controls Card */}
                {activeStage === 'positioning' ? (
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-base font-semibold text-slate-100 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-sky-400" />
                          <span>Create the Patient Position</span>
                        </h2>
                        <span className="text-xs font-mono text-sky-300 tabular-nums">
                          Pose Match: {poseEval.matchesCount}/5
                        </span>
                      </div>

                      {/* Immediate Step 1 Answer Verification Banner */}
                      {(step1Checked || isSubmitted) && (
                        <div className="p-3.5 rounded-lg border border-slate-700 bg-slate-950/90 space-y-2 text-xs">
                          <div className="font-semibold text-slate-100 flex items-center justify-between">
                            <span>Step 1 Positioning & CR Inspection</span>
                            <span className="font-mono text-sky-400">
                              {(step1CrCorrect ? 25 : step1CrOffsetMm && step1CrOffsetMm < 90 ? 15 : 0) +
                                step1PosScore}{' '}
                              / 50 pts
                            </span>
                          </div>
                          <div className="space-y-1.5 pt-1 border-t border-slate-800">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-400">1. Central Ray Cursor:</span>
                              {step1CrCorrect ? (
                                <span className="text-emerald-400 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  Correct ({step1CrOffsetMm} mm offset)
                                </span>
                              ) : (
                                <span className="text-amber-400 font-medium flex items-center gap-1 text-right">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  {placedCR
                                    ? `Off by ${step1CrOffsetMm} mm (Target: ${currentCase.targetCR.landmarkName})`
                                    : `Click canvas to place CR at ${currentCase.targetCR.landmarkName}`}
                                </span>
                              )}
                            </div>

                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-400">2. Created Patient Position:</span>
                              <span
                                className={
                                  step1PosScore >= 20
                                    ? 'text-emerald-400 font-medium'
                                    : 'text-amber-400 font-medium'
                                }
                              >
                                {step1PosScore}/25 pts (Ideal: {currentCase.targetPatientPose.bodyPosture} ·{' '}
                                {currentCase.targetPatientPose.projectionView} ·{' '}
                                {currentCase.targetPatientPose.specialManeuver})
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* INTERACTIVE PATIENT POSE SCULPTOR / BUILDER */}
                      <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3.5">
                        {/* 1. Body Posture Selector */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">1. Patient Body Posture:</span>
                            {(step1Checked || isSubmitted) && (
                              <span
                                className={`font-mono text-[11px] ${
                                  poseEval.postureMatch ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {poseEval.postureMatch
                                  ? '✓ Correct'
                                  : `Target: ${currentCase.targetPatientPose.bodyPosture}`}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {BODY_POSTURES.map((posture) => (
                              <button
                                key={posture}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() =>
                                  setUserPose((p) => ({ ...p, bodyPosture: posture }))
                                }
                                className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                                  userPose.bodyPosture === posture
                                    ? 'bg-sky-600 border-sky-500 text-white'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {posture}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Beam / Receptor Projection View */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">
                              2. Beam / Receptor Projection:
                            </span>
                            {(step1Checked || isSubmitted) && (
                              <span
                                className={`font-mono text-[11px] ${
                                  poseEval.viewMatch ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {poseEval.viewMatch
                                  ? '✓ Correct'
                                  : `Target: ${currentCase.targetPatientPose.projectionView}`}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {PROJECTION_VIEWS.map((view) => (
                              <button
                                key={view}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() =>
                                  setUserPose((p) => ({ ...p, projectionView: view }))
                                }
                                className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                                  userPose.projectionView === view
                                    ? 'bg-sky-600 border-sky-500 text-white'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {view}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. Anatomical Joint / Part Positioning Maneuver */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">
                              3. Joint / Part Positioning Maneuver:
                            </span>
                            {(step1Checked || isSubmitted) && (
                              <span
                                className={`font-mono text-[11px] ${
                                  poseEval.maneuverMatch ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {poseEval.maneuverMatch
                                  ? '✓ Correct'
                                  : `Target: ${currentCase.targetPatientPose.specialManeuver}`}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {SPECIAL_MANEUVERS.map((maneuver) => (
                              <button
                                key={maneuver}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() =>
                                  setUserPose((p) => ({ ...p, specialManeuver: maneuver }))
                                }
                                className={`px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                                  userPose.specialManeuver === maneuver
                                    ? 'bg-sky-600 border-sky-500 text-white'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {maneuver}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 4. X-Ray Tube Tilt & Collimation Sliders */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <label
                                htmlFor="tube-angle-slider"
                                className="text-slate-300 font-medium"
                              >
                                4. Tube Tilt Angle:
                              </label>
                              <span className="font-mono text-sky-300 tabular-nums">
                                {userPose.tubeAngleDeg === 0
                                  ? '0° Perp'
                                  : userPose.tubeAngleDeg > 0
                                  ? `+${userPose.tubeAngleDeg}° Ceph`
                                  : `${userPose.tubeAngleDeg}° Caud`}
                              </span>
                            </div>
                            <input
                              id="tube-angle-slider"
                              type="range"
                              min={-30}
                              max={30}
                              step={5}
                              disabled={isSubmitted}
                              value={userPose.tubeAngleDeg}
                              onChange={(e) =>
                                setUserPose((p) => ({
                                  ...p,
                                  tubeAngleDeg: Number(e.target.value),
                                }))
                              }
                              className="w-full accent-sky-500 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <label
                                htmlFor="collimation-slider"
                                className="text-slate-300 font-medium flex items-center gap-1"
                              >
                                <Sliders className="w-3 h-3 text-amber-400" />
                                <span>Collimation Field:</span>
                              </label>
                              <span className="font-mono text-amber-300 tabular-nums">
                                {collimationScale}%
                              </span>
                            </div>
                            <input
                              id="collimation-slider"
                              type="range"
                              min={60}
                              max={130}
                              step={5}
                              disabled={isSubmitted}
                              value={collimationScale}
                              onChange={(e) => setCollimationScale(Number(e.target.value))}
                              className="w-full accent-sky-500 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* 5. Patient Respiration Instruction */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-medium">
                              5. Patient Respiration Instruction:
                            </span>
                            {(step1Checked || isSubmitted) && (
                              <span
                                className={`font-mono text-[11px] ${
                                  poseEval.respMatch ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {poseEval.respMatch
                                  ? '✓ Correct'
                                  : `Target: ${currentCase.targetPatientPose.respirationPhase}`}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {RESPIRATION_PHASES.map((resp) => (
                              <button
                                key={resp}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() =>
                                  setUserPose((p) => ({ ...p, respirationPhase: resp }))
                                }
                                className={`px-2.5 py-1.5 rounded text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                                  userPose.respirationPhase === resp
                                    ? 'bg-sky-600 border-sky-500 text-white'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {resp}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Optional Quick-Apply Standard Projection Protocol Cards */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-slate-400">
                          Or Quick-Apply a Standard Clinical Protocol Preset:
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {currentCase.positioningOptions.map((opt) => {
                            const isSelected = selectedPositioningId === opt.id;
                            const isCorrect = opt.id === currentCase.correctPositioningId;
                            let borderStyle =
                              'border-slate-800 bg-slate-950/50 hover:border-slate-700';
                            if (step1Checked || isSubmitted) {
                              if (isCorrect) {
                                borderStyle = 'border-emerald-500/70 bg-emerald-950/25';
                              } else if (isSelected && !isCorrect) {
                                borderStyle = 'border-rose-500/70 bg-rose-950/25';
                              }
                            } else if (isSelected) {
                              borderStyle = 'border-sky-500 bg-sky-950/30';
                            }

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => handleSelectPositioningOption(opt.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${borderStyle}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-slate-100">
                                    {opt.projectionName}
                                  </span>
                                  {(step1Checked || isSubmitted) && isCorrect && (
                                    <span className="text-[11px] font-mono text-emerald-400 shrink-0 flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      CORRECT
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Step 1 Actions: Check Step 1 Immediately OR Proceed to Step 2 */}
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleCheckStep1}
                        className="px-3.5 py-2 text-xs font-semibold rounded-lg border bg-emerald-600/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/30 transition-colors whitespace-nowrap shrink-0"
                      >
                        Check Created Position & CR
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playXrayExposureBeep();
                          setActiveStage('diagnosis');
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Step 2: Expose & Inspect Scan</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-base font-semibold text-slate-100">
                          Step 2: Pathology Localization & Diagnosis
                        </h2>
                        <span className="text-xs font-mono text-slate-400 tabular-nums">
                          {placedLesion
                            ? `ROI Pin: (${placedLesion.x.toFixed(0)}%, ${placedLesion.y.toFixed(0)}%)`
                            : 'Click Lesion on Scan'}
                        </span>
                      </div>

                      {/* Immediate In-Card Answer Verification Summary when Submitted */}
                      {isSubmitted && currentResult && (
                        <div className="p-3.5 rounded-lg border border-slate-700 bg-slate-950/90 space-y-2 text-xs">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-slate-100">Answer Inspection Summary</span>
                            <span
                              className={`font-mono text-sm ${
                                currentResult.totalScore >= 70
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              Total Score: {currentResult.totalScore}/100
                            </span>
                          </div>
                          <div className="space-y-1.5 pt-1.5 border-t border-slate-800">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-400">1. CR Cursor Placement:</span>
                              <span
                                className={
                                  currentResult.isCRAccurate
                                    ? 'text-emerald-400 font-medium'
                                    : 'text-amber-400 font-medium'
                                }
                              >
                                {placedCR
                                  ? `${currentResult.isCRAccurate ? '✓ Correct' : '△ Off'} (${currentResult.crOffsetMm} mm offset · ${currentResult.crScore}/25)`
                                  : '✗ Not placed (0/25)'}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-400">2. Created Patient Position:</span>
                              <span
                                className={
                                  currentResult.isCorrectPositioning
                                    ? 'text-emerald-400 font-medium'
                                    : 'text-amber-400 font-medium'
                                }
                              >
                                {currentResult.positioningScore}/25 pts ({currentResult.poseMatchesCount}/5 parameters matched)
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-400">3. Scan Lesion Pinpoint:</span>
                              <span
                                className={
                                  currentResult.isLesionAccurate
                                    ? 'text-emerald-400 font-medium'
                                    : 'text-amber-400 font-medium'
                                }
                              >
                                {placedLesion
                                  ? `${currentResult.isLesionAccurate ? '✓ Correct' : '△ Off'} (${currentResult.lesionOffsetMm} mm offset · ${currentResult.lesionScore}/25)`
                                  : '✗ Not clicked (0/25)'}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-400">4. Disease & Sign ID:</span>
                              <span
                                className={
                                  currentResult.diagnosisScore === 25
                                    ? 'text-emerald-400 font-medium'
                                    : currentResult.diagnosisScore > 0
                                    ? 'text-amber-400 font-medium'
                                    : 'text-rose-400 font-medium'
                                }
                              >
                                {currentResult.diagnosisScore === 25
                                  ? '✓ Both Correct (25/25)'
                                  : `${currentResult.diagnosisScore}/25 pts`}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Primary Disease Selection */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-slate-300">
                          1. Select Primary Radiodiagnosis:
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {currentCase.diseaseOptions.map((disease) => {
                            const isSelected = selectedDisease === disease;
                            const isCorrect = disease === currentCase.correctDisease;
                            let btnClass =
                              'border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-700';
                            if (isSubmitted) {
                              if (isCorrect) {
                                btnClass =
                                  'border-emerald-500/70 bg-emerald-950/30 text-emerald-200';
                              } else if (isSelected && !isCorrect) {
                                btnClass = 'border-rose-500/70 bg-rose-950/30 text-rose-200';
                              }
                            } else if (isSelected) {
                              btnClass = 'border-sky-500 bg-sky-950/35 text-white';
                            }

                            return (
                              <button
                                key={disease}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => setSelectedDisease(disease)}
                                className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center justify-between gap-2 ${btnClass}`}
                              >
                                <span>{disease}</span>
                                {isSubmitted && isCorrect && (
                                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                    CORRECT
                                  </span>
                                )}
                                {isSubmitted && isSelected && !isCorrect && (
                                  <span className="flex items-center gap-1 text-[11px] font-mono text-rose-400 shrink-0">
                                    <XCircle className="w-4 h-4" />
                                    INCORRECT
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Classic Radiological Sign Selection */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-slate-300">
                          2. Identify Classic Radiological Sign / Finding:
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {currentCase.signOptions.map((sign) => {
                            const isSelected = selectedSign === sign;
                            const isCorrect = sign === currentCase.correctSign;
                            let btnClass =
                              'border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-700';
                            if (isSubmitted) {
                              if (isCorrect) {
                                btnClass =
                                  'border-emerald-500/70 bg-emerald-950/30 text-emerald-200';
                              } else if (isSelected && !isCorrect) {
                                btnClass = 'border-rose-500/70 bg-rose-950/30 text-rose-200';
                              }
                            } else if (isSelected) {
                              btnClass = 'border-sky-500 bg-sky-950/35 text-white';
                            }

                            return (
                              <button
                                key={sign}
                                type="button"
                                disabled={isSubmitted}
                                onClick={() => setSelectedSign(sign)}
                                className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center justify-between gap-2 ${btnClass}`}
                              >
                                <span>{sign}</span>
                                {isSubmitted && isCorrect && (
                                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                    CORRECT
                                  </span>
                                )}
                                {isSubmitted && isSelected && !isCorrect && (
                                  <span className="flex items-center gap-1 text-[11px] font-mono text-rose-400 shrink-0">
                                    <XCircle className="w-4 h-4" />
                                    INCORRECT
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Readiness Status & Submit Action */}
                    <div className="pt-3 border-t border-slate-800 space-y-3">
                      {!isSubmitted ? (
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setActiveStage('positioning')}
                            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 rounded-lg hover:text-white transition-colors whitespace-nowrap shrink-0"
                          >
                            Back to Positioning
                          </button>

                          <button
                            type="button"
                            onClick={handleEvaluateCase}
                            className="flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
                          >
                            Check Answer & Reveal Solution
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={resetCaseInputs}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 rounded-lg hover:text-white transition-colors whitespace-nowrap shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retry Case</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleNextCase}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
                          >
                            <span>
                              {currentCaseIndex < filteredCases.length - 1
                                ? 'Advance to Next Case'
                                : 'View Rotation Report'}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Post-Submission Detailed Diagnostic & Positioning Rubric Panel */}
            {isSubmitted && currentResult && (
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/75 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="text-xs text-slate-400">
                      Attending Radiologist Verification · {currentCase.caseNumber}
                    </div>
                    <h2 className="font-display text-xl font-bold text-slate-100 mt-0.5">
                      {currentCase.correctDisease} — {currentCase.correctSign}
                    </h2>
                  </div>

                  <div className="flex items-center gap-6 font-mono tabular-nums">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Case Score</div>
                      <div className="text-2xl font-bold text-emerald-400">
                        {currentResult.totalScore}/100
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4-Column Quantitative Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-1">
                    <div className="text-xs text-slate-400">1. Central Ray (CR) Cursor</div>
                    <div className="font-mono text-lg font-bold text-slate-100 tabular-nums">
                      {currentResult.crScore}/25 pts
                    </div>
                    <div className="text-xs text-slate-400 font-mono tabular-nums">
                      {placedCR
                        ? `Offset: ${currentResult.crOffsetMm} mm from ${currentCase.targetCR.landmarkName.split('(')[0]}`
                        : 'No CR pin placed on canvas'}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-1">
                    <div className="text-xs text-slate-400">2. Created Patient Position</div>
                    <div className="font-mono text-lg font-bold text-slate-100 tabular-nums">
                      {currentResult.positioningScore}/25 pts
                    </div>
                    <div className="text-xs text-slate-400">
                      {currentResult.poseMatchesCount}/5 Pose Parameters Matched
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-1">
                    <div className="text-xs text-slate-400">3. Lesion Pinpoint Cursor</div>
                    <div className="font-mono text-lg font-bold text-slate-100 tabular-nums">
                      {currentResult.lesionScore}/25 pts
                    </div>
                    <div className="text-xs text-slate-400 font-mono tabular-nums">
                      {placedLesion
                        ? `Offset: ${currentResult.lesionOffsetMm} mm from lesion center`
                        : 'No ROI pin clicked on scan'}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800/90 space-y-1">
                    <div className="text-xs text-slate-400">4. Disease & Sign ID</div>
                    <div className="font-mono text-lg font-bold text-slate-100 tabular-nums">
                      {currentResult.diagnosisScore}/25 pts
                    </div>
                    <div className="text-xs text-slate-400">
                      {currentResult.isCorrectDisease && currentResult.isCorrectSign
                        ? 'Accurate Diagnosis & Sign'
                        : `Correct: ${currentCase.correctDisease}`}
                    </div>
                  </div>
                </div>

                {/* Clinical Pearl & Positioning Teaching Points */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <h3 className="font-display text-sm font-semibold text-sky-300">
                      Radiographic Positioning & Central Ray Rationale
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {currentCase.positioningExplanation}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display text-sm font-semibold text-emerald-300">
                      Diagnostic Clinical Pearl & Key Features
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {currentCase.clinicalPearl}
                    </p>
                    <ul className="space-y-1 pt-1 text-xs text-slate-300 list-disc list-inside">
                      {currentCase.keyRadiologicalFeatures.map((feat, i) => (
                        <li key={i}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION: Custom Patient Position & Case Creator Studio */}
        {activeSection === 'create-position' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-100">
                  Custom Patient Position & Clinical Case Creator
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Configure a custom patient posture, click on the Bucky stage with your cursor to set the target Central Ray (CR), and add it to the rotation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('workbench')}
                className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
              >
                Back to Cases
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Interactive Preview Stage to Click & Set Target CR */}
              <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-sky-400">
                    Click Stage Below to Set Target Central Ray (CR) Coordinates
                  </span>
                  <span className="text-xs font-mono text-emerald-400 tabular-nums">
                    Target CR: ({customTargetCR.x.toFixed(1)}%, {customTargetCR.y.toFixed(1)}%)
                  </span>
                </div>
                <PositioningCanvas
                  currentCase={{
                    ...(RADIOLOGY_CASES.find((c) => c.scanType === customScanType) ||
                      RADIOLOGY_CASES[0]),
                    targetCR: {
                      x: customTargetCR.x,
                      y: customTargetCR.y,
                      toleranceRadius: 8,
                      landmarkName: customLandmarkName,
                      collimationWidth: 55,
                      collimationHeight: 50,
                    },
                  }}
                  placedCR={customTargetCR}
                  onPlaceCR={(coords) => {
                    soundEngine.playCursorPinClick();
                    setCustomTargetCR(coords);
                  }}
                  userPose={customPose}
                  collimationScale={100}
                  isSubmitted={false}
                />
              </div>

              {/* Right Form to Configure Custom Patient Position & Diagnosis */}
              <form
                onSubmit={handleCreateCustomCase}
                className="lg:col-span-6 p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-5"
              >
                <h2 className="font-display text-lg font-bold text-slate-100">
                  Define Target Patient Position & Clinical Scenario
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Clinical Indication / Prompt Title
                    </label>
                    <input
                      type="text"
                      required
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Patient Age/Sex
                    </label>
                    <input
                      type="text"
                      required
                      value={customAgeSex}
                      onChange={(e) => setCustomAgeSex(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Anatomical Region / Scan Template
                    </label>
                    <select
                      value={customScanType}
                      onChange={(e) =>
                        setCustomScanType(e.target.value as RadiologyCase['scanType'])
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                    >
                      <option value="chest_pneumothorax">Thorax — Chest PA/AP</option>
                      <option value="wrist_scaphoid">Upper Extremity — Wrist / Scaphoid</option>
                      <option value="wrist_colles">Upper Extremity — Distal Forearm Lateral</option>
                      <option value="brain_epidural">Cranium — Axial Head CT</option>
                      <option value="abdomen_pneumoperitoneum">Thoracoabdominal — Erect Diaphragm</option>
                      <option value="abdomen_volvulus">Abdomen — Supine KUB</option>
                      <option value="cervical_odontoid">Cervical Spine — Open-Mouth C1–C2</option>
                      <option value="neck_croup">Pediatric Airway — Soft-Tissue Neck</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Target Central Ray (CR) Landmark Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customLandmarkName}
                      onChange={(e) => setCustomLandmarkName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                    />
                  </div>
                </div>

                {/* Patient Position Parameters */}
                <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-sky-400">
                    Required Patient Position Parameters (Previewed Live on Left)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Body Posture</label>
                      <select
                        value={customPose.bodyPosture}
                        onChange={(e) =>
                          setCustomPose((p) => ({
                            ...p,
                            bodyPosture: e.target.value as PatientPoseConfig['bodyPosture'],
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
                      >
                        {BODY_POSTURES.map((bp) => (
                          <option key={bp} value={bp}>
                            {bp}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Projection View</label>
                      <select
                        value={customPose.projectionView}
                        onChange={(e) =>
                          setCustomPose((p) => ({
                            ...p,
                            projectionView: e.target.value as PatientPoseConfig['projectionView'],
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
                      >
                        {PROJECTION_VIEWS.map((pv) => (
                          <option key={pv} value={pv}>
                            {pv}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Anatomical Part Maneuver</label>
                      <select
                        value={customPose.specialManeuver}
                        onChange={(e) =>
                          setCustomPose((p) => ({
                            ...p,
                            specialManeuver: e.target.value as PatientPoseConfig['specialManeuver'],
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
                      >
                        {SPECIAL_MANEUVERS.map((sm) => (
                          <option key={sm} value={sm}>
                            {sm}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Respiration Phase</label>
                      <select
                        value={customPose.respirationPhase}
                        onChange={(e) =>
                          setCustomPose((p) => ({
                            ...p,
                            respirationPhase: e.target.value as PatientPoseConfig['respirationPhase'],
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100"
                      >
                        {RESPIRATION_PHASES.map((rp) => (
                          <option key={rp} value={rp}>
                            {rp}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Target X-Ray Tube Angle:</span>
                      <span className="font-mono text-sky-300">{customPose.tubeAngleDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      step={5}
                      value={customPose.tubeAngleDeg}
                      onChange={(e) =>
                        setCustomPose((p) => ({
                          ...p,
                          tubeAngleDeg: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Target Diagnosis & Sign */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Target Primary Diagnosis
                    </label>
                    <input
                      type="text"
                      required
                      value={customDisease}
                      onChange={(e) => setCustomDisease(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      Target Classic Radiological Sign
                    </label>
                    <input
                      type="text"
                      required
                      value={customSign}
                      onChange={(e) => setCustomSign(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-mono">
                      Target Lesion X (%) on Scan
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={95}
                      value={customTargetLesion.x}
                      onChange={(e) =>
                        setCustomTargetLesion((p) => ({ ...p, x: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-mono">
                      Target Lesion Y (%) on Scan
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={95}
                      value={customTargetLesion.y}
                      onChange={(e) =>
                        setCustomTargetLesion((p) => ({ ...p, y: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors"
                >
                  Save & Launch Custom Patient Position Case
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SECTION 2: Radiographic Positioning & Central Ray Reference Guide */}
        {activeSection === 'positioning-guide' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-100">
                  Radiographic Positioning & Central Ray (CR) Reference
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Standard anatomical surface landmarks, patient postures, and Central Ray entrance points for board exams.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('workbench')}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
              >
                Return to Active Case
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {casesList.map((c, idx) => {
                const optimalOpt = c.positioningOptions.find(
                  (o) => o.id === c.correctPositioningId
                );
                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {c.caseNumber} · {c.subspecialty}
                        </span>
                        <span className="font-mono text-sky-400">{c.modality}</span>
                      </div>
                      <h2 className="font-display text-lg font-bold text-slate-100">
                        {optimalOpt?.projectionName}
                      </h2>
                      <div className="text-xs font-mono text-amber-300">
                        Target Central Ray (CR): {c.targetCR.landmarkName}
                      </div>
                      <div className="text-xs font-mono text-emerald-300">
                        Pose: {c.targetPatientPose.bodyPosture} · {c.targetPatientPose.projectionView} ·{' '}
                        {c.targetPatientPose.specialManeuver}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {c.positioningExplanation}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">
                        Resp: {optimalOpt?.respiration}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectCase(idx)}
                        className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <span>Practice Positioning</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: Classic Radiological Sign Atlas */}
        {activeSection === 'sign-atlas' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-100">
                  Classic Radiological Signs & Densitometry Atlas
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Pathognomonic imaging signs, Hounsfield attenuation values, and anatomical localization criteria.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('workbench')}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
              >
                Return to Active Case
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {casesList.map((c, idx) => (
                <div
                  key={c.id}
                  className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{c.subspecialty}</span>
                      <span className="font-mono text-emerald-400">
                        Lesion Site: {c.targetLesion.lesionName}
                      </span>
                    </div>
                    <h2 className="font-display text-lg font-bold text-slate-100">
                      {c.correctSign}
                    </h2>
                    <div className="text-xs font-medium text-sky-300">
                      Associated Pathology: {c.correctDisease}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{c.clinicalPearl}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {c.anatomicalRegions.length} Indexed Densitometry Zones
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectCase(idx);
                        setActiveStage('diagnosis');
                      }}
                      className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <span>Inspect Scan with Cursor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: Student Rotation Performance & Precision Log */}
        {activeSection === 'performance' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-100">
                  Radiodiagnosis Rotation Performance Log
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Quantitative breakdown of Central Ray (CR) cursor precision, positioning accuracy, and lesion pinpointing.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('workbench')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
                >
                  Continue Cases
                </button>
              </div>
            </div>

            {/* Summary KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-sky-400" />
                  <span>Cases Evaluated</span>
                </div>
                <div className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
                  {completedResults.length} / {casesList.length}
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>Overall Rotation Accuracy</span>
                </div>
                <div className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                  {averageScore}%
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Mean Central Ray Offset</span>
                </div>
                <div className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
                  {completedResults.length > 0
                    ? `${Math.round(
                        completedResults.reduce((a, b) => a + b.crOffsetMm, 0) /
                          completedResults.length
                      )} mm`
                    : '—'}
                </div>
              </div>

              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Mean Lesion Pinpoint Offset</span>
                </div>
                <div className="font-mono text-2xl font-bold text-slate-100 tabular-nums">
                  {completedResults.length > 0
                    ? `${Math.round(
                        completedResults.reduce((a, b) => a + b.lesionOffsetMm, 0) /
                          completedResults.length
                      )} mm`
                    : '—'}
                </div>
              </div>
            </div>

            {/* Tabular Case Log */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/70 text-xs text-slate-400">
                      <th className="py-3.5 px-4 font-semibold">Case</th>
                      <th className="py-3.5 px-4 font-semibold">Target Diagnosis</th>
                      <th className="py-3.5 px-4 font-semibold font-mono">CR Offset</th>
                      <th className="py-3.5 px-4 font-semibold font-mono">Created Position</th>
                      <th className="py-3.5 px-4 font-semibold font-mono">Lesion Offset</th>
                      <th className="py-3.5 px-4 font-semibold font-mono">Total Score</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-xs">
                    {casesList.map((c, idx) => {
                      const res = history[c.id];
                      return (
                        <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-200 tabular-nums">
                            {c.caseNumber} · {c.subspecialty}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">{c.correctDisease}</td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                            {res ? `${res.crOffsetMm} mm (${res.crScore}/25)` : 'Not Attempted'}
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                            {res ? `${res.positioningScore}/25 (${res.poseMatchesCount}/5)` : '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                            {res ? `${res.lesionOffsetMm} mm (${res.lesionScore}/25)` : '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold tabular-nums">
                            {res ? (
                              <span
                                className={
                                  res.totalScore >= 75 ? 'text-emerald-400' : 'text-amber-400'
                                }
                              >
                                {res.totalScore}/100
                              </span>
                            ) : (
                              <span className="text-slate-500">Pending</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleSelectCase(idx)}
                              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors whitespace-nowrap shrink-0"
                            >
                              {res ? 'Review / Retry' : 'Launch Case'}
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
        )}
      </main>
    </div>
  );
}
