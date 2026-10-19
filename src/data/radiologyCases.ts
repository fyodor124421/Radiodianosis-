export interface AnatomicalRegion {
  id: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  radius: number; // percentage radius
  huValue: string;
  tissueType: string;
}

export interface PositioningOption {
  id: string;
  projectionName: string;
  patientPosture: string;
  tubeAngle: string;
  respiration: string;
}

export interface RadiologyCase {
  id: string;
  caseNumber: string;
  modality: 'Digital Radiography (DR)' | 'Computed Tomography (CT)' | 'Fluoroscopy / Contrast DR';
  subspecialty: 'Thoracic' | 'Musculoskeletal' | 'Neuroradiology' | 'Abdominal' | 'Emergency Trauma' | 'Pediatric';
  difficulty: 'Year 1 Resident' | 'Year 2 Resident' | 'Board Prep';
  patientInfo: {
    ageSex: string;
    chiefComplaint: string;
    clinicalHistory: string;
    vitals: string;
  };
  // Phase 1: Radiographic Positioning & Central Ray (CR) placement
  positioningPrompt: string;
  targetCR: {
    x: number; // 0-100 on positioning canvas
    y: number; // 0-100 on positioning canvas
    toleranceRadius: number; // percentage for full credit
    landmarkName: string;
    collimationWidth: number; // ideal collimation box % width
    collimationHeight: number; // ideal collimation box % height
  };
  correctPositioningId: string;
  positioningOptions: PositioningOption[];
  positioningExplanation: string;

  // Phase 2: Pathology Localization & Disease Diagnosis
  diagnosisPrompt: string;
  scanType:
    | 'chest_pneumothorax'
    | 'wrist_scaphoid'
    | 'brain_epidural'
    | 'abdomen_pneumoperitoneum'
    | 'abdomen_volvulus'
    | 'cervical_odontoid'
    | 'neck_croup'
    | 'wrist_colles';
  targetLesion: {
    x: number; // 0-100 on radiograph canvas
    y: number; // 0-100 on radiograph canvas
    toleranceRadius: number; // percentage for full credit
    lesionName: string;
    findingDescription: string;
  };
  anatomicalRegions: AnatomicalRegion[];
  correctDisease: string;
  diseaseOptions: string[];
  correctSign: string;
  signOptions: string[];
  clinicalPearl: string;
  keyRadiologicalFeatures: string[];
}

export const RADIOLOGY_CASES: RadiologyCase[] = [
  {
    id: 'case-pneumothorax',
    caseNumber: 'CASE 01',
    modality: 'Digital Radiography (DR)',
    subspecialty: 'Thoracic',
    difficulty: 'Year 1 Resident',
    patientInfo: {
      ageSex: '24M',
      chiefComplaint: 'Sudden-onset pleuritic right chest pain and acute dyspnea',
      clinicalHistory: 'Tall, thin male presenting to ED 30 minutes after sudden sharp chest pain at rest. Decreased breath sounds and hyperresonance on the right hemithorax.',
      vitals: 'HR 118 bpm · BP 96/62 mmHg · RR 28/min · SpO2 89% RA',
    },
    positioningPrompt:
      'Position the patient and move your cursor to place the Central Ray (CR) for a standard Upright Chest PA projection to evaluate suspected acute pneumothorax.',
    targetCR: {
      x: 50,
      y: 36,
      toleranceRadius: 8,
      landmarkName: 'T7 Spinous Process (Inferior Angle of Scapula)',
      collimationWidth: 64,
      collimationHeight: 54,
    },
    correctPositioningId: 'pa-erect-chest',
    positioningOptions: [
      {
        id: 'pa-erect-chest',
        projectionName: 'PA Erect Chest (72" SID)',
        patientPosture: 'Upright, anterior chest against bucky, shoulders rolled forward to rotate scapulae laterally',
        tubeAngle: 'Perpendicular (0°) horizontal beam to T7',
        respiration: 'Expose at end of 2nd full inspiration (10 posterior ribs visible)',
      },
      {
        id: 'ap-supine-chest',
        projectionName: 'AP Supine Chest (40" SID)',
        patientPosture: 'Supine on table, arms at side, scapulae superimposed over lung fields',
        tubeAngle: '15° Cephalad toward sternal angle',
        respiration: 'Shallow tidal breathing',
      },
      {
        id: 'ap-lordotic-chest',
        projectionName: 'AP Apical Lordotic Projection',
        patientPosture: 'Patient leaning backward 30° against vertical grid device',
        tubeAngle: '15°–20° Cephalad to mid-sternum',
        respiration: 'Suspend on full expiration only',
      },
      {
        id: 'right-lat-decub',
        projectionName: 'Right Lateral Decubitus (Affected Side Down)',
        patientPosture: 'Lying on right side so free pleural air layers medially',
        tubeAngle: 'Vertical beam centered to L3',
        respiration: 'Suspend respiration',
      },
    ],
    positioningExplanation:
      'Upright PA Chest centered at T7 (level of the inferior scapular angles) with shoulders rolled anteriorly removes the scapulae from the lung fields and allows pleural air to rise to the non-dependent apical-lateral thorax. A 72-inch (180 cm) SID minimizes cardiac magnification.',
    diagnosisPrompt:
      'Move your cursor over the chest radiograph to inspect tissue densities (HU/OD), click directly on the primary pleural/lung pathology, and select the correct diagnosis and sign.',
    scanType: 'chest_pneumothorax',
    targetLesion: {
      x: 31,
      y: 38,
      toleranceRadius: 11,
      lesionName: 'Right Apicolateral Pleural Space & Visceral Pleural Line',
      findingDescription: 'Hyperlucent avascular right hemithorax with sharply demarcated visceral pleural edge and leftward mediastinal shift.',
    },
    anatomicalRegions: [
      { id: 'r-pleural-air', label: 'Right Apicolateral Pleural Space (Absent Lung Markings)', x: 29, y: 34, radius: 13, huValue: '-992 HU', tissueType: 'Free Pleural Air' },
      { id: 'r-collapsed-lung', label: 'Collapsed Right Lung Margin (Visceral Pleural Line)', x: 39, y: 45, radius: 9, huValue: '-410 HU', tissueType: 'Atelectatic Lung' },
      { id: 'l-lung-normal', label: 'Left Aerated Lung Field (Normal Vascular Markings)', x: 68, y: 40, radius: 14, huValue: '-780 HU', tissueType: 'Aerated Parenchyma' },
      { id: 'mediastinum-shift', label: 'Displaced Heart & Mediastinum (Shifted Left)', x: 61, y: 55, radius: 12, huValue: '+45 HU', tissueType: 'Myocardium / Blood Pool' },
      { id: 'r-hemidiaphragm', label: 'Depressed Right Hemidiaphragm (Deep Costophrenic Sulcus)', x: 32, y: 70, radius: 11, huValue: '+38 HU', tissueType: 'Diaphragmatic Dome' },
      { id: 'trachea', label: 'Tracheal Air Column (Deviated Contralaterally)', x: 54, y: 21, radius: 7, huValue: '-960 HU', tissueType: 'Tracheal Lumen' },
    ],
    correctDisease: 'Right-Sided Tension Pneumothorax',
    diseaseOptions: [
      'Right-Sided Tension Pneumothorax',
      'Massive Right Pleural Effusion',
      'Right Upper Lobe Lobar Pneumonia',
      'Bullous Emphysema (Vanishing Lung Syndrome)',
    ],
    correctSign: 'Visceral Pleural Line & Contralateral Mediastinal Shift',
    signOptions: [
      'Visceral Pleural Line & Contralateral Mediastinal Shift',
      'Meniscus Sign with Blunted Costophrenic Angle',
      'Air Bronchogram with Silhouette Sign',
      'Hampton Hump & Westermark Sign',
    ],
    clinicalPearl:
      'Tension pneumothorax occurs via a one-way valve mechanism trapping air in the pleural space. Positive intrapleural pressure collapses the ipsilateral lung, flattens/inverts the ipsilateral hemidiaphragm, and shifts the trachea and mediastinum toward the contralateral side—compromising venous return.',
    keyRadiologicalFeatures: [
      'Thin, sharp white visceral pleural line with absent peripheral bronchovascular markings lateral to it',
      'Hyperlucent (dark) right hemithorax compared to normal left lung parenchyma',
      'Contralateral shift of the trachea, carina, and cardiac silhouette to the left',
      'Depression and flattening of the ipsilateral right hemidiaphragm',
    ],
  },
  {
    id: 'case-scaphoid',
    caseNumber: 'CASE 02',
    modality: 'Digital Radiography (DR)',
    subspecialty: 'Musculoskeletal',
    difficulty: 'Year 1 Resident',
    patientInfo: {
      ageSex: '19F',
      chiefComplaint: 'Radial wrist pain after fall onto an outstretched hand (FOOSH)',
      clinicalHistory: 'Collegiate snowboarder fell backward onto dorsiflexed right wrist. Point tenderness directly inside the anatomical snuffbox and pain on axial loading of the thumb.',
      vitals: 'HR 76 bpm · BP 118/74 mmHg · Afebrile',
    },
    positioningPrompt:
      'Standard PA wrist views often foreshorten the scaphoid bone. Position the wrist and place the Central Ray (CR) with your cursor to elongate the scaphoid perpendicular to the receptor.',
    targetCR: {
      x: 44,
      y: 52,
      toleranceRadius: 8,
      landmarkName: 'Scaphoid / Mid-Carpal Radial Snuffbox',
      collimationWidth: 42,
      collimationHeight: 46,
    },
    correctPositioningId: 'pa-ulnar-deviation',
    positioningOptions: [
      {
        id: 'pa-ulnar-deviation',
        projectionName: 'PA Scaphoid View with Ulnar Deviation (Stecher Method)',
        patientPosture: 'Palm flat on detector, hand gently deviated toward the ulnar (medial) side',
        tubeAngle: 'Perpendicular or 15°–20° Cephalad (proximally) toward scaphoid waist',
        respiration: 'Not applicable (immobilize extremity)',
      },
      {
        id: 'pa-radial-deviation',
        projectionName: 'PA Wrist with Extreme Radial Deviation',
        patientPosture: 'Hand deviated forcefully toward thumb (radial) side, foreshortening scaphoid',
        tubeAngle: 'Perpendicular to 3rd MCP joint',
        respiration: 'Not applicable',
      },
      {
        id: 'gaynor-hart',
        projectionName: 'Gaynor-Hart Tangential Carpal Canal View',
        patientPosture: 'Wrist hyperextended 75° with fingers pulled back by tape',
        tubeAngle: '25°–30° to long axis of palm',
        respiration: 'Not applicable',
      },
      {
        id: 'ap-forearm-mid',
        projectionName: 'AP Mid-Forearm Shaft Projection',
        patientPosture: 'Supinated forearm centered to mid-diaphysis of radius and ulna',
        tubeAngle: 'Perpendicular to mid-forearm',
        respiration: 'Not applicable',
      },
    ],
    positioningExplanation:
      'Ulnar deviation (adducting the hand toward the ulna) rotates the scaphoid out of its normal foreshortened palmar-flexed tilt, opening the scaphoid waist and intercarpal joint spaces free of superposition. Combining this with a 15°–20° proximal tube angle (Stecher method) demonstrates transverse waist fractures clearly.',
    diagnosisPrompt:
      'Inspect the dedicated PA ulnar-deviation wrist radiograph with your cursor, click on the fractured carpal bone, and identify the diagnosis and vascular complication risk.',
    scanType: 'wrist_scaphoid',
    targetLesion: {
      x: 38,
      y: 54,
      toleranceRadius: 9,
      lesionName: 'Scaphoid Waist Transverse Cortical Lucency',
      findingDescription: 'Transverse radiolucent fracture line across the mid-waist of the scaphoid with cortical step-off on the radial aspect.',
    },
    anatomicalRegions: [
      { id: 'scaphoid-waist', label: 'Scaphoid Waist (Transverse Cortical Fracture Line)', x: 38, y: 54, radius: 9, huValue: '+310 HU', tissueType: 'Trabecular Cortical Breach' },
      { id: 'scaphoid-prox', label: 'Proximal Pole of Scaphoid (Retrograde Blood Supply Zone)', x: 41, y: 60, radius: 7, huValue: '+740 HU', tissueType: 'Carpal Subchondral Bone' },
      { id: 'lunate', label: 'Lunate Bone (Intact Semilunar Contour)', x: 52, y: 58, radius: 8, huValue: '+790 HU', tissueType: 'Carpal Bone' },
      { id: 'capitate', label: 'Capitate (Largest Carpal Bone)', x: 49, y: 46, radius: 8, huValue: '+810 HU', tissueType: 'Carpal Bone' },
      { id: 'distal-radius', label: 'Distal Radius Articular Surface', x: 44, y: 71, radius: 11, huValue: '+880 HU', tissueType: 'Cortical Bone' },
      { id: 'ulnar-styloid', label: 'Distal Ulna & Ulnar Styloid Process', x: 62, y: 72, radius: 8, huValue: '+860 HU', tissueType: 'Cortical Bone' },
    ],
    correctDisease: 'Acute Scaphoid Waist Fracture',
    diseaseOptions: [
      'Acute Scaphoid Waist Fracture',
      'Perilunate Dislocation (Terry Thomas Sign)',
      'Kienböck Disease (Lunate Osteonecrosis)',
      'Bennett Intra-Articular Thumb Base Fracture',
    ],
    correctSign: 'Transverse Scaphoid Waist Lucency & Snuffbox Fat Pad Obliteration',
    signOptions: [
      'Transverse Scaphoid Waist Lucency & Snuffbox Fat Pad Obliteration',
      'Piece-of-Pie Sign of the Lunate on PA View',
      'widened Scapholunate Interval > 3 mm',
      'Dinner Fork Dorsal Displacement of Distal Radius',
    ],
    clinicalPearl:
      'The scaphoid is the most commonly fractured carpal bone (70% at the waist). Because the dorsal carpal branch of the radial artery enters the distal pole and flows retrograde to the proximal pole, displaced waist or proximal pole fractures carry a high risk of avascular necrosis (AVN) and nonunion.',
    keyRadiologicalFeatures: [
      'Linear transverse radiolucency through the middle third (waist) of the scaphoid',
      'Disruption of the smooth convex lateral cortical margin of the scaphoid',
      'Obliteration or convex displacement of the navicular (scaphoid) fat stripe',
      'High risk of proximal pole sclerosis (avascular necrosis) on follow-up imaging',
    ],
  },
  {
    id: 'case-epidural',
    caseNumber: 'CASE 03',
    modality: 'Computed Tomography (CT)',
    subspecialty: 'Neuroradiology',
    difficulty: 'Year 1 Resident',
    patientInfo: {
      ageSex: '28M',
      chiefComplaint: 'Head trauma from baseball impact with brief loss of consciousness, lucid interval, then rapid obtundation',
      clinicalHistory: 'Struck on the left temple by a line drive. Initially alert in dugout ("lucid interval"), then developed severe headache, vomiting, and a dilated left pupil (ipsilateral CN III palsy).',
      vitals: 'HR 52 bpm · BP 178/96 mmHg (Cushing Triad) · GCS 8 (E2V2M4)',
    },
    positioningPrompt:
      'Position the patient in the CT gantry and place the laser reference cursor along the cranial baseline for an Emergency Non-Contrast Axial Head CT.',
    targetCR: {
      x: 50,
      y: 22,
      toleranceRadius: 8,
      landmarkName: 'Orbitomeatal Line (OML) / Glabella-to-EAM Plane',
      collimationWidth: 46,
      collimationHeight: 38,
    },
    correctPositioningId: 'ct-head-oml',
    positioningOptions: [
      {
        id: 'ct-head-oml',
        projectionName: 'Non-Contrast Axial Head CT (Parallel to Orbitomeatal Line)',
        patientPosture: 'Supine head-first in cranial holder, chin tucked so OML is parallel to gantry plane, no IV contrast',
        tubeAngle: 'Gantry aligned parallel to OML (from skull base to vertex)',
        respiration: 'Quiet respiration (strict head immobilization)',
      },
      {
        id: 'ct-head-contrast-delayed',
        projectionName: 'Delayed Venous Phase Contrast-Enhanced Brain CT',
        patientPosture: 'Supine with 100 mL iodinated IV contrast injected prior to acute hemorrhage rule-out',
        tubeAngle: '30° Coronal tilt only',
        respiration: 'Valsalva maneuver',
      },
      {
        id: 'waters-sinus',
        projectionName: 'Parietoacanthial (Waters) Sinus Radiography',
        patientPosture: 'Upright chin extended on vertical bucky (mentomeatal line perpendicular)',
        tubeAngle: 'Horizontal beam to acanthion',
        respiration: 'Suspend respiration',
      },
      {
        id: 'towne-occipital',
        projectionName: 'AP Axial Towne Skull Projection',
        patientPosture: 'Supine on radiographic table without cross-sectional tomography',
        tubeAngle: '30° Caudad to OML',
        respiration: 'Suspend respiration',
      },
    ],
    positioningExplanation:
      'Acute head trauma ALWAYS requires a Non-Contrast Head CT first because acute clotted blood is hyperdense (+50 to +80 HU); IV contrast would obscure or mimic acute hemorrhage. Aligning acquisition parallel to the Orbitomeatal Line (OML) or Supraorbitomeatal Line reduces beam-hardening streak artifacts from the petrous ridges and orbits.',
    diagnosisPrompt:
      'Sweep your cursor across the axial Head CT to measure Hounsfield Units (HU), click directly on the extra-axial hemorrhage, and determine the diagnosis and morphological sign.',
    scanType: 'brain_epidural',
    targetLesion: {
      x: 68,
      y: 44,
      toleranceRadius: 11,
      lesionName: 'Left Temporoparietal Biconvex Extra-Axial Hyperdensity',
      findingDescription: 'Hyperdense (+68 HU) lentiform/biconvex collection bounded by the coronal and lambdoid sutures with subfalcine midline shift.',
    },
    anatomicalRegions: [
      { id: 'edh-collection', label: 'Left Temporoparietal Epidural Collection (Biconvex)', x: 68, y: 44, radius: 11, huValue: '+72 HU', tissueType: 'Acute Clotted Blood' },
      { id: 'r-hemisphere', label: 'Right Cerebral Hemisphere (Normal Parenchyma)', x: 34, y: 48, radius: 14, huValue: '+36 HU', tissueType: 'Gray/White Matter' },
      { id: 'midline-falx', label: 'Falx Cerebri & Ventricles (Shifted Rightward)', x: 45, y: 46, radius: 9, huValue: '+12 HU', tissueType: 'Compressed Lateral Ventricles' },
      { id: 'skull-vault', label: 'Squamous Temporal Bone (Underlying Linear Fracture)', x: 76, y: 43, radius: 7, huValue: '+940 HU', tissueType: 'Calvarial Cortical Bone' },
      { id: 'frontal-lobes', label: 'Bilateral Frontal Lobes', x: 50, y: 26, radius: 11, huValue: '+38 HU', tissueType: 'Frontal Cortex' },
      { id: 'occipital-lobes', label: 'Occipital Poles & Superior Sagittal Sinus', x: 50, y: 74, radius: 10, huValue: '+44 HU', tissueType: 'Occipital Parenchyma' },
    ],
    correctDisease: 'Acute Left Epidural Hematoma (Middle Meningeal Artery Tear)',
    diseaseOptions: [
      'Acute Left Epidural Hematoma (Middle Meningeal Artery Tear)',
      'Acute Subdural Hematoma (Bridging Vein Rupture)',
      'Diffuse Subarachnoid Hemorrhage (Basal Cisterns)',
      'Left Middle Cerebral Artery (MCA) Ischemic Infarct',
    ],
    correctSign: 'Biconvex (Lentiform) Hyperdensity Respecting Cranial Sutures',
    signOptions: [
      'Biconvex (Lentiform) Hyperdensity Respecting Cranial Sutures',
      'Crescentic Hyperdensity Crossing Suture Lines',
      'Dense MCA Sign with Insular Ribbon Loss',
      'Star-Shaped Hyperdensity in the Suprasellar Cistern',
    ],
    clinicalPearl:
      'Note that standard CT scans are viewed from the patient’s feet (radiological convention: right side of image = patient’s left). Epidural hematomas typically result from temporal bone fractures lacerating the middle meningeal artery. Because the periosteal dura is tightly adherent to cranial sutures, epidural hematomas form a biconvex (lens-shaped) mass that cannot cross suture lines.',
    keyRadiologicalFeatures: [
      'Biconvex (lentiform / lemon-shaped) high-attenuation (+60 to +80 HU) extra-axial collection',
      'Bounded anteriorly and posteriorly by the coronal and lambdoid sutures (does not cross sutures)',
      'Mass effect with effacement of the ipsilateral left lateral ventricle and rightward subfalcine herniation',
      'Associated linear fracture of the thin squamous temporal bone (pterion)',
    ],
  },
  {
    id: 'case-pneumoperitoneum',
    caseNumber: 'CASE 04',
    modality: 'Digital Radiography (DR)',
    subspecialty: 'Abdominal',
    difficulty: 'Year 1 Resident',
    patientInfo: {
      ageSex: '56M',
      chiefComplaint: 'Sudden severe epigastric pain radiating to both shoulders with board-like abdominal rigidity',
      clinicalHistory: 'Longstanding history of NSAID use for osteoarthritis. Sudden catastrophic epigastric pain 3 hours ago. Peritoneal signs (rebound tenderness and guarding) on physical exam.',
      vitals: 'HR 114 bpm · BP 104/68 mmHg · Temp 38.3°C · RR 24/min',
    },
    positioningPrompt:
      'To detect as little as 1–2 mL of free intraperitoneal gas from a perforated viscus, position the patient and place the Central Ray (CR) cursor for the highest-sensitivity upright radiograph.',
    targetCR: {
      x: 50,
      y: 44,
      toleranceRadius: 9,
      landmarkName: 'Erect Chest / Bilateral Hemidiaphragms (T7–T10 Window)',
      collimationWidth: 64,
      collimationHeight: 54,
    },
    correctPositioningId: 'erect-chest-diaphragm',
    positioningOptions: [
      {
        id: 'erect-chest-diaphragm',
        projectionName: 'Erect Chest / Upright Diaphragm Radiograph (After 10 min Upright)',
        patientPosture: 'Patient seated or standing upright for 5–10 minutes prior to exposure so free air rises to domes',
        tubeAngle: 'Horizontal central ray tangential to the diaphragmatic domes (avoiding obliquity)',
        respiration: 'Expose on full expiration (for abdomen) or inspiration (erect chest)',
      },
      {
        id: 'supine-kub-only',
        projectionName: 'Single Supine AP Abdomen (KUB) Centered at Iliac Crests',
        patientPosture: 'Flat supine on table with vertical overhead X-ray beam',
        tubeAngle: 'Vertical beam perpendicular to L4–L5 (misses small subdiaphragmatic crescents)',
        respiration: 'Suspend on inspiration',
      },
      {
        id: 'right-lat-decub-abdo',
        projectionName: 'Right Lateral Decubitus Abdomen (Right Side Down)',
        patientPosture: 'Patient lying on right side so gastric air mixes with colonic loops on the left',
        tubeAngle: 'Vertical overhead beam',
        respiration: 'Tidal breathing',
      },
      {
        id: 'prone-pelvic',
        projectionName: 'Prone Pelvic Inlet Projection',
        patientPosture: 'Prone centered over pubic symphysis',
        tubeAngle: '40° Caudad',
        respiration: 'Suspend respiration',
      },
    ],
    positioningExplanation:
      'An Erect Chest radiograph (or Upright Abdomen including the diaphragms) with a strictly horizontal beam is more sensitive than a supine KUB for free intraperitoneal air because the X-ray beam strikes the thin subdiaphragmatic air crescent tangentially. If the patient cannot stand, a Left Lateral Decubitus view (left side down, right side up over the liver) is the alternative of choice.',
    diagnosisPrompt:
      'Move your cursor over the thoracoabdominal radiograph, click directly on the pathognomonic subdiaphragmatic abnormality, and select the diagnosis and radiological sign.',
    scanType: 'abdomen_pneumoperitoneum',
    targetLesion: {
      x: 34,
      y: 52,
      toleranceRadius: 10,
      lesionName: 'Right Subdiaphragmatic Free Air Crescent',
      findingDescription: 'Sickle-shaped radiolucent gas collection interposed between the superior surface of the liver and the right hemidiaphragm.',
    },
    anatomicalRegions: [
      { id: 'r-subdiaphragm-air', label: 'Subdiaphragmatic Free Air Crescent (Over Liver Dome)', x: 34, y: 52, radius: 10, huValue: '-975 HU', tissueType: 'Intraperitoneal Free Gas' },
      { id: 'l-subdiaphragm-air', label: 'Left Subdiaphragmatic Free Gas & Gastric Fundus', x: 66, y: 54, radius: 10, huValue: '-940 HU', tissueType: 'Free Gas / Gastric Bubble' },
      { id: 'liver-parenchyma', label: 'Hepatic Parenchyma (Displaced Inferiorly)', x: 34, y: 66, radius: 13, huValue: '+58 HU', tissueType: 'Hepatic Soft Tissue' },
      { id: 'rigler-bowel', label: 'Bowel Loop Demonstrating Rigler Double-Wall Sign', x: 52, y: 74, radius: 11, huValue: '-620 HU', tissueType: 'Serosal + Luminal Gas' },
      { id: 'heart-base', label: 'Cardiac Silhouette Above Diaphragm', x: 53, y: 36, radius: 12, huValue: '+46 HU', tissueType: 'Mediastinum' },
    ],
    correctDisease: 'Pneumoperitoneum (Perforated Peptic Ulcer)',
    diseaseOptions: [
      'Pneumoperitoneum (Perforated Peptic Ulcer)',
      'Chilaiditi Syndrome (Hepatodiaphragmatic Colonic Interposition)',
      'Right Lower Lobe Basal Atelectasis',
      'Subphrenic Pyogenic Abscess without Gas',
    ],
    correctSign: 'Subdiaphragmatic Crescent Sign & Rigler Double-Wall Sign',
    signOptions: [
      'Subdiaphragmatic Crescent Sign & Rigler Double-Wall Sign',
      'String of Pearls Sign with Step-Ladder Air-Fluid Levels',
      'Thumbprinting of the Transverse Colon Wall',
      'Lead-Pipe Loss of Haustral Markings',
    ],
    clinicalPearl:
      'Free intraperitoneal gas rises beneath the thin leaves of the diaphragm on upright films, best seen over the homogeneous density of the right hepatic lobe. On supine radiographs, large-volume pneumoperitoneum outlines both the inner mucosal and outer serosal surfaces of bowel wall (Rigler’s Double-Wall Sign) and the falciform ligament.',
    keyRadiologicalFeatures: [
      'Sharp sickle-shaped radiolucent crescent of free gas immediately beneath the right hemidiaphragm',
      'Clear separation between the thin diaphragmatic slip and the superior hepatic contour',
      'Rigler sign: visualization of both luminal and serosal surfaces of bowel wall due to extraluminal gas',
      'Absence of haustral plicae within the right subdiaphragmatic gas crescent (distinguishing it from Chilaiditi sign)',
    ],
  },
  {
    id: 'case-volvulus',
    caseNumber: 'CASE 05',
    modality: 'Digital Radiography (DR)',
    subspecialty: 'Abdominal',
    difficulty: 'Year 2 Resident',
    patientInfo: {
      ageSex: '74M',
      chiefComplaint: 'Progressive massive abdominal distension, obstipation for 4 days, and crampy lower abdominal pain',
      clinicalHistory: 'Nursing home resident with chronic constipation. Tympanic, markedly distended asymmetric abdomen with high-pitched metallic bowel sounds.',
      vitals: 'HR 98 bpm · BP 132/82 mmHg · Temp 37.4°C · WBC 13.8k',
    },
    positioningPrompt:
      'Position the patient and move your cursor to place the Central Ray (CR) for a Supine AP Abdomen (KUB) projection ensuring inclusion of the pubic symphysis.',
    targetCR: {
      x: 50,
      y: 56,
      toleranceRadius: 8,
      landmarkName: 'Level of Iliac Crests (L4–L5 Interspace)',
      collimationWidth: 62,
      collimationHeight: 58,
    },
    correctPositioningId: 'ap-supine-kub',
    positioningOptions: [
      {
        id: 'ap-supine-kub',
        projectionName: 'AP Supine Abdomen (KUB) Centered at Iliac Crests (L4–L5)',
        patientPosture: 'Supine on bucky table, midsagittal plane centered, legs extended with support under knees',
        tubeAngle: 'Perpendicular (0°) to level of iliac crests (L4–L5), lower margin at pubic symphysis',
        respiration: 'Expose at the end of full expiration (diaphragm elevated, abdominal viscera relaxed)',
      },
      {
        id: 'pa-chest-t7',
        projectionName: 'PA Erect Chest Centered at T7 Only',
        patientPosture: 'Standing facing chest bucky, excluding pelvis and sigmoid colon',
        tubeAngle: 'Perpendicular to T7',
        respiration: 'Full inspiration',
      },
      {
        id: 'oblique-l-spine',
        projectionName: '45° RPO Lumbar Spine (Scotty Dog View)',
        patientPosture: 'Rotated 45° right posterior oblique with tight collimation to L3 pedicles',
        tubeAngle: 'Perpendicular to L3',
        respiration: 'Tidal breathing',
      },
      {
        id: 'axial-outlet',
        projectionName: 'Taylor Method AP Axial Pelvic Outlet',
        patientPosture: 'Supine centered 2 inches distal to pubic symphysis',
        tubeAngle: '30° Cephalad',
        respiration: 'Suspend respiration',
      },
    ],
    positioningExplanation:
      'A standard Supine AP Abdomen (KUB) is centered at the level of the iliac crests (L4–L5 interspace) on full expiration so the diaphragm rises and abdominal organs spread uniformly. Including the lower pelvis down to the pubic symphysis is essential to see the point of torsion in sigmoid volvulus and rule out incarcerated inguinal hernias.',
    diagnosisPrompt:
      'Examine the supine abdominal radiograph with your cursor, click on the apex/central cleft of the massively twisted colonic loop, and choose the correct diagnosis and sign.',
    scanType: 'abdomen_volvulus',
    targetLesion: {
      x: 48,
      y: 44,
      toleranceRadius: 12,
      lesionName: 'Dilated Ahaustral Sigmoid Loop & Central Mesenteric Cleft',
      findingDescription: 'Giant inverted U-shaped distended sigmoid loop arising from the left pelvis toward the right upper quadrant with central double-wall crease.',
    },
    anatomicalRegions: [
      { id: 'coffee-bean-cleft', label: 'Central Cleft of Twisted Sigmoid Loop (Coffee Bean Crease)', x: 48, y: 44, radius: 12, huValue: '-840 HU', tissueType: 'Apposed Oedematous Bowel Walls' },
      { id: 'sigmoid-apex-ruq', label: 'Apex of Volvulus Extending to Right Upper Quadrant (Above T10)', x: 37, y: 28, radius: 11, huValue: '-910 HU', tissueType: 'Distended Ahaustral Colon' },
      { id: 'left-pelvic-beak', label: 'Left Lower Quadrant Point of Torsion (Mesenteric Twist)', x: 63, y: 74, radius: 10, huValue: '+32 HU', tissueType: 'Twisted Sigmoid Mesocolon' },
      { id: 'rectum-empty', label: 'Paucity of Rectal Gas in Pelvis', x: 50, y: 82, radius: 9, huValue: '+28 HU', tissueType: 'Collapsed Rectal Ampulla' },
      { id: 'iliac-wing', label: 'Iliac Crest Reference Landmark (L4–L5)', x: 24, y: 64, radius: 9, huValue: '+780 HU', tissueType: 'Pelvic Bone' },
    ],
    correctDisease: 'Sigmoid Volvulus (Closed-Loop Large Bowel Obstruction)',
    diseaseOptions: [
      'Sigmoid Volvulus (Closed-Loop Large Bowel Obstruction)',
      'Cecal Volvulus Directed to Left Upper Quadrant',
      'Small Bowel Adhesive Obstruction',
      'Toxic Megacolon Secondary to Ulcerative Colitis',
    ],
    correctSign: 'Coffee Bean Sign & Northern Exposure Sign',
    signOptions: [
      'Coffee Bean Sign & Northern Exposure Sign',
      'Coiled Spring Sign & Target Sign',
      'Apple Core Stenosing Lesion',
      'Double Bubble Sign of Duodenal Atresia',
    ],
    clinicalPearl:
      'Sigmoid volvulus occurs when a redundant sigmoid colon twists around its narrow mesenteric axis (>180°). The two apposed medial walls of the dilated loop form the central cleft of a "Coffee Bean", while the outer walls form the bean contour. When the apex rises above the transverse colon into the RUQ, it is termed the "Northern Exposure Sign".',
    keyRadiologicalFeatures: [
      'Massively dilated, ahaustral inverted U-shaped loop arising out of the left pelvis',
      'Coffee Bean Sign: central dense white line (apposed medial walls) flanked by two radiolucent gas compartments',
      'Northern Exposure Sign: apex of the twisted sigmoid colon extends cephalad to the transverse colon toward the RUQ',
      'Absence of gas in the rectum',
    ],
  },
  {
    id: 'case-odontoid',
    caseNumber: 'CASE 06',
    modality: 'Digital Radiography (DR)',
    subspecialty: 'Emergency Trauma',
    difficulty: 'Year 2 Resident',
    patientInfo: {
      ageSex: '68F',
      chiefComplaint: 'High-cervical neck pain after hyperextension fall down 4 stairs',
      clinicalHistory: 'Patient struck forehead on carpeted floor causing forceful cervical hyperextension. Midline C1–C2 tenderness in rigid cervical collar; neurologically intact.',
      vitals: 'HR 82 bpm · BP 138/84 mmHg · SpO2 98% RA',
    },
    positioningPrompt:
      'Standard AP cervical spine views superimpose the teeth and occiput over C1–C2. Move your cursor to place the Central Ray (CR) and align the patient for an AP Open-Mouth (Transoral) C1–C2 Odontoid view.',
    targetCR: {
      x: 50,
      y: 25,
      toleranceRadius: 7,
      landmarkName: 'Center of Open Mouth (Lower Margin of Upper Incisors to Mastoid Tip)',
      collimationWidth: 36,
      collimationHeight: 36,
    },
    correctPositioningId: 'ap-open-mouth',
    positioningOptions: [
      {
        id: 'ap-open-mouth',
        projectionName: 'AP Open-Mouth (Transoral) C1–C2 Odontoid Projection',
        patientPosture: 'Supine (do NOT flex/extend neck in trauma!), mouth wide open so line from upper incisors to mastoid tip is perpendicular to detector',
        tubeAngle: 'Perpendicular (0°) through the center of the open mouth to C1–C2',
        respiration: 'Softly phonate "Ahhh" during exposure to immobilize tongue on floor of mouth',
      },
      {
        id: 'ap-lower-cspine',
        projectionName: 'AP Axial Lower Cervical Spine (C3–T2)',
        patientPosture: 'Mouth closed, chin extended, biting occlusal plane',
        tubeAngle: '15°–20° Cephalad entering at C4 (thyroid cartilage)',
        respiration: 'Suspend respiration',
      },
      {
        id: 'swimmers-view',
        projectionName: 'Twining Lateral Cervicothoracic (Swimmer’s) View',
        patientPosture: 'Lateral recumbent with one arm elevated and one depressed for C7–T1',
        tubeAngle: '5° Caudad to T1',
        respiration: 'Suspend respiration',
      },
      {
        id: 'flexion-extension',
        projectionName: 'Forced Active Flexion & Extension Lateral Views',
        patientPosture: 'Forcefully flex and extend the traumatized neck prior to clearing fractures',
        tubeAngle: 'Horizontal beam to C4',
        respiration: 'Suspend respiration',
      },
    ],
    positioningExplanation:
      'To visualize the Odontoid Process (Dens of C2) and the lateral masses of the Atlas (C1) without superposition of the upper incisors or occipital base, the line connecting the lower edge of the upper incisors to the base of the skull (mastoid tips) must be aligned perpendicular to the detector with the mouth wide open.',
    diagnosisPrompt:
      'Move your cursor over the AP Open-Mouth Odontoid radiograph, click directly on the fracture line at the base of the dens, and identify the classification and diagnosis.',
    scanType: 'cervical_odontoid',
    targetLesion: {
      x: 50,
      y: 52,
      toleranceRadius: 9,
      lesionName: 'Base of Odontoid Process (Junction with C2 Body)',
      findingDescription: 'Transverse radiolucent fracture line at the base of the odontoid peg where it joins the body of C2 (Axis).',
    },
    anatomicalRegions: [
      { id: 'dens-base-fx', label: 'Base of Odontoid Process (Transverse Fracture Line)', x: 50, y: 52, radius: 9, huValue: '+290 HU', tissueType: 'Fracture Cleft at C2 Base' },
      { id: 'dens-tip', label: 'Apex of Odontoid Process (Intact Apical Tip)', x: 50, y: 38, radius: 7, huValue: '+840 HU', tissueType: 'Cortical Bone of Dens' },
      { id: 'c1-lat-mass-r', label: 'Right Lateral Mass of C1 (Atlas)', x: 35, y: 45, radius: 8, huValue: '+820 HU', tissueType: 'C1 Lateral Mass' },
      { id: 'c1-lat-mass-l', label: 'Left Lateral Mass of C1 (Atlas)', x: 65, y: 45, radius: 8, huValue: '+820 HU', tissueType: 'C1 Lateral Mass' },
      { id: 'c2-body', label: 'Centrum / Body of C2 (Axis)', x: 50, y: 65, radius: 11, huValue: '+760 HU', tissueType: 'Vertebral Body' },
      { id: 'upper-incisors', label: 'Maxillary Incisors (Projected Superiorly Clear of Dens)', x: 50, y: 20, radius: 10, huValue: '+1450 HU', tissueType: 'Dental Enamel' },
    ],
    correctDisease: 'Anderson & D’Alonzo Type II Odontoid Fracture',
    diseaseOptions: [
      'Anderson & D’Alonzo Type II Odontoid Fracture',
      'Jefferson Burst Fracture of C1 Ring (Bilateral Lateral Mass Offset)',
      'Hangman Fracture (Traumatic Spondylolisthesis of C2 Pedicles)',
      'Clay-Shoveler Avulsion Fracture of C7 Spinous Process',
    ],
    correctSign: 'Transverse Lucency at the Junction of Dens and C2 Body',
    signOptions: [
      'Transverse Lucency at the Junction of Dens and C2 Body',
      'Combined Bilateral C1 Lateral Mass Overhang > 7 mm (Rule of Spence)',
      'Mach Band Optical Illusion from Overlying Incisor Gap',
      'Teardrop Anteroinferior Vertebral Body Fragment',
    ],
    clinicalPearl:
      'Anderson & D’Alonzo classify odontoid fractures into Type I (oblique avulsion of the tip — stable), Type II (transverse fracture at the waist/base junction with C2 body — most common, unstable, highest nonunion rate due to watershed blood supply), and Type III (extends downward into the cancellous body of C2). Always distinguish a true Type II fracture from a "Mach effect" shadow cast by the upper incisors or posterior arch of C1.',
    keyRadiologicalFeatures: [
      'Sharp transverse cortical discontinuity across the base of the odontoid peg at its junction with the C2 body',
      'Preserved symmetric alignment of the C1 lateral masses relative to C2 (ruling out Jefferson burst fracture)',
      'Cortical step-off distinguishing a true fracture from a smooth Mach band shadow',
      'High risk of nonunion and atlantoaxial instability requiring halo immobilization or C1–C2/odontoid screw fixation',
    ],
  },
  {
    id: 'case-croup',
    caseNumber: 'CASE 07',
    modality: 'Digital Radiography (DR)',
    subspecialty: 'Pediatric',
    difficulty: 'Year 1 Resident',
    patientInfo: {
      ageSex: '2yo M',
      chiefComplaint: 'Barking "seal-like" cough, hoarseness, and inspiratory stridor worse at night',
      clinicalHistory: 'Toddler with 2-day prodrome of low-grade coryza followed by nocturnal barking cough and mild suprasternal retractions. No drooling or tripod posture.',
      vitals: 'HR 132 bpm · RR 32/min · Temp 38.1°C · SpO2 96% RA',
    },
    positioningPrompt:
      'Position the pediatric patient and move your cursor to place the Central Ray (CR) for an AP Soft-Tissue Neck radiograph to evaluate the subglottic airway.',
    targetCR: {
      x: 50,
      y: 28,
      toleranceRadius: 7,
      landmarkName: 'C4–C5 Level (Inferior Margin of Thyroid Cartilage)',
      collimationWidth: 40,
      collimationHeight: 40,
    },
    correctPositioningId: 'ap-soft-neck',
    positioningOptions: [
      {
        id: 'ap-soft-neck',
        projectionName: 'AP Soft-Tissue Neck (Low kVp Technique Centered at C4–C5)',
        patientPosture: 'Erect or supine, head slightly extended to prevent chin superimposition, low kVp (65–75 kVp) for airway-to-soft-tissue contrast',
        tubeAngle: 'Perpendicular (0°) to C4–C5 (cricoid/thyroid cartilage region)',
        respiration: 'Expose during slow inspiration to distend the vocal cords and subglottic trachea',
      },
      {
        id: 'high-kvp-grid-spine',
        projectionName: 'High-kVp (120 kVp) Bucky Cervical Bone Technique',
        patientPosture: 'Chin tucked onto chest, overpenetrating soft tissues and airway column',
        tubeAngle: '25° Caudad',
        respiration: 'Valsalva maneuver (closed glottis)',
      },
      {
        id: 'waters-paranasal',
        projectionName: 'Waters Paranasal Sinus Projection',
        patientPosture: 'Prone nose-chin position centered to maxillary sinuses',
        tubeAngle: 'Perpendicular to acanthion',
        respiration: 'Apnea',
      },
      {
        id: 'thoracic-ap-t7',
        projectionName: 'Lower Thoracic Spine AP Projection (T7)',
        patientPosture: 'Centered over mid-sternum excluding the larynx and subglottis',
        tubeAngle: 'Perpendicular to T7',
        respiration: 'Full expiration',
      },
    ],
    positioningExplanation:
      'Evaluating the pediatric upper airway requires a Soft-Tissue Neck technique (lower kVp than osseous spine imaging so the radiolucent tracheal air column contrasts sharply against perilaryngeal soft tissues) centered at C4–C5 during inspiration.',
    diagnosisPrompt:
      'Move your cursor over the AP Soft-Tissue Neck radiograph, click directly on the subglottic tracheal narrowing, and select the diagnosis and classic sign.',
    scanType: 'neck_croup',
    targetLesion: {
      x: 50,
      y: 48,
      toleranceRadius: 9,
      lesionName: 'Symmetric Subglottic Tracheal Tapering',
      findingDescription: 'Loss of the normal lateral convex subglottic shoulders with symmetric inverted V-shaped narrowing extending 1–2 cm below the vocal cords.',
    },
    anatomicalRegions: [
      { id: 'steeple-subglottis', label: 'Subglottic Trachea (Symmetric Inverted-V Narrowing)', x: 50, y: 48, radius: 9, huValue: '-620 HU', tissueType: 'Edematous Subglottic Mucosa' },
      { id: 'pyriform-sinuses', label: 'Hypopharynx & Pyriform Sinuses (Normal Superior Airway)', x: 50, y: 31, radius: 9, huValue: '-940 HU', tissueType: 'Pharyngeal Air Column' },
      { id: 'distal-trachea', label: 'Normal Caliber Cervical-Thoracic Trachea', x: 50, y: 68, radius: 9, huValue: '-965 HU', tissueType: 'Tracheal Air Column' },
      { id: 'r-clavicle', label: 'Right Pediatric Clavicle & Lung Apex', x: 32, y: 78, radius: 10, huValue: '+690 HU', tissueType: 'Clavicular Bone' },
      { id: 'l-clavicle', label: 'Left Pediatric Clavicle & Lung Apex', x: 68, y: 78, radius: 10, huValue: '+690 HU', tissueType: 'Clavicular Bone' },
    ],
    correctDisease: 'Viral Laryngotracheobronchitis (Croup)',
    diseaseOptions: [
      'Viral Laryngotracheobronchitis (Croup)',
      'Acute Bacterial Epiglottitis (Thumb Sign)',
      'Retropharyngeal Abscess with Prevertebral Widening',
      'Radiopaque Esophageal Coin Foreign Body (En Face on AP)',
    ],
    correctSign: 'Steeple Sign (Wine Bottle Sign) on AP Neck View',
    signOptions: [
      'Steeple Sign (Wine Bottle Sign) on AP Neck View',
      'Thumb Sign of Swollen Epiglottis on Lateral View',
      'Omega-Shaped Aryepiglottic Fold Thickening',
      'Double Aortic Arch Vascular Ring Indentation',
    ],
    clinicalPearl:
      'Normally on an AP soft-tissue neck radiograph, the subglottic airway directly beneath the vocal cords has symmetric squared lateral "shoulders" (resembling a domed cathedral roof). Subglottic mucosal edema within the rigid cricoid cartilage ring obliterates these shoulders, producing a pointed church-steeple appearance ("Steeple Sign").',
    keyRadiologicalFeatures: [
      'Symmetric funnel-like or church-steeple tapering of the subglottic trachea on AP projection',
      'Loss of the normal lateral convex subglottic shoulders immediately inferior to the vocal cords',
      'Normal epiglottis and aryepiglottic folds on lateral view (excluding acute epiglottitis)',
      'Overdistension (ballooning) of the hypopharynx during inspiration above the fixed cricoid narrowing',
    ],
  },
  {
    id: 'case-colles',
    caseNumber: 'CASE 08',
    modality: 'Digital Radiography (DR)',
    subspecialty: 'Musculoskeletal',
    difficulty: 'Board Prep',
    patientInfo: {
      ageSex: '64F',
      chiefComplaint: 'Severe left wrist pain and "dinner-fork" dorsal deformity after slipping on ice',
      clinicalHistory: 'Postmenopausal female fell forward onto an outstretched, dorsiflexed palm. Visible dorsal prominence at the distal forearm.',
      vitals: 'HR 84 bpm · BP 142/86 mmHg · Neurovascularly intact distally',
    },
    positioningPrompt:
      'To measure dorsal angulation and radial tilt accurately, position the patient and place the Central Ray (CR) cursor for a True Lateral Wrist projection.',
    targetCR: {
      x: 44,
      y: 52,
      toleranceRadius: 8,
      landmarkName: 'Mid-Carpal / Radial Styloid Joint Line (True Lateral)',
      collimationWidth: 42,
      collimationHeight: 48,
    },
    correctPositioningId: 'lateral-wrist-true',
    positioningOptions: [
      {
        id: 'lateral-wrist-true',
        projectionName: 'True Lateral Wrist (Ulnar Side Down, Distal Radius & Ulna Superimposed)',
        patientPosture: 'Elbow flexed 90°, ulnar surface of wrist resting on detector so radial and ulnar styloids are superimposed',
        tubeAngle: 'Perpendicular (0°) to mid-carpal area',
        respiration: 'Not applicable (immobilize extremity)',
      },
      {
        id: 'ap-elbow-joint',
        projectionName: 'AP Fully Extended Elbow Joint Projection',
        patientPosture: 'Arm extended, centered to humeral epicondyles',
        tubeAngle: 'Perpendicular to elbow joint',
        respiration: 'Not applicable',
      },
      {
        id: 'norgaard-ballcatcher',
        projectionName: 'Norgaard "Ball-Catcher" Bilateral Hand Oblique',
        patientPosture: 'Both hands half-supinated 45° for rheumatoid erosions at MCP bases',
        tubeAngle: 'Perpendicular to 5th MCP joints',
        respiration: 'Not applicable',
      },
      {
        id: 'axial-calcaneus',
        projectionName: 'Plantodorsal Axial Projection',
        patientPosture: 'Lower extremity positioning',
        tubeAngle: '40° Cephalad',
        respiration: 'Not applicable',
      },
    ],
    positioningExplanation:
      'A True Lateral Wrist radiograph (with elbow flexed 90° and distal radius/ulna superimposed) is mandatory alongside the PA view to determine whether the distal radial fragment is angulated dorsally (Colles fracture) or volarly/anteriorly (Smith fracture), and to assess normal 11° palmar tilt.',
    diagnosisPrompt:
      'Inspect the Lateral & PA Wrist composite radiograph with your cursor, click on the extra-articular distal radius metaphyseal fracture with dorsal tilt, and select the diagnosis and sign.',
    scanType: 'wrist_colles',
    targetLesion: {
      x: 46,
      y: 62,
      toleranceRadius: 10,
      lesionName: 'Distal Radius Metaphysis (2 cm Proximal to Articular Surface)',
      findingDescription: 'Extra-articular transverse fracture of the distal radial metaphysis with dorsal displacement, dorsal angulation, and radial shortening.',
    },
    anatomicalRegions: [
      { id: 'colles-metaphysis', label: 'Distal Radial Metaphysis (Extra-Articular Fracture & Dorsal Tilt)', x: 46, y: 62, radius: 10, huValue: '+340 HU', tissueType: 'Impacted Metaphyseal Fracture' },
      { id: 'dorsal-fragment', label: 'Dorsally Displaced Distal Radial Articular Fragment', x: 38, y: 50, radius: 9, huValue: '+810 HU', tissueType: 'Dorsally Tilted Fragment' },
      { id: 'pronator-fat', label: 'Anterior Displacement of Pronator Quadratus Fat Stripe', x: 57, y: 64, radius: 8, huValue: '-75 HU', tissueType: 'Volar Fat Pad Bowing' },
      { id: 'carpal-row', label: 'Lunate & Capitate Carpal Alignment (Dorsally Shifted)', x: 35, y: 36, radius: 10, huValue: '+790 HU', tissueType: 'Carpal Axis' },
      { id: 'radial-shaft', label: 'Intact Diaphysis of Radius & Ulna', x: 52, y: 80, radius: 11, huValue: '+920 HU', tissueType: 'Cortical Diaphysis' },
    ],
    correctDisease: 'Colles Fracture (Dorsally Angulated Extra-Articular Distal Radius)',
    diseaseOptions: [
      'Colles Fracture (Dorsally Angulated Extra-Articular Distal Radius)',
      'Smith Fracture (Volarly Angulated "Garden Spade" Deformity)',
      'Barton Intra-Articular Rim Fracture-Dislocation',
      'Galeazzi Fracture-Dislocation (Radial Shaft + DRUJ Disruption)',
    ],
    correctSign: 'Dinner Fork (Bayonet) Dorsal Deformity & Loss of Palmar Tilt',
    signOptions: [
      'Dinner Fork (Bayonet) Dorsal Deformity & Loss of Palmar Tilt',
      'Garden Spade Volar Displacement of Distal Fragment',
      'Sail Sign of Elevated Anterior Elbow Fat Pad',
      'Terry Thomas Widening of Scapholunate Interval',
    ],
    clinicalPearl:
      'Normally on a true lateral wrist radiograph, the distal radial articular surface tilts 10°–15° volarly (palmar tilt). In a Colles fracture, a FOOSH injury drives the distal radial fragment dorsally and radially within 2–3 cm of the articular surface, reversing normal palmar tilt into dorsal angulation ("Dinner Fork Deformity") and frequently avulsing the ulnar styloid.',
    keyRadiologicalFeatures: [
      'Extra-articular transverse fracture of the distal radius 2–3 cm proximal to the radiocarpal joint',
      'Dorsal angulation (loss/reversal of normal 11° volar tilt) and dorsal displacement ("Dinner Fork" profile)',
      'Radial shortening (impaction) with positive ulnar variance',
      'Convex volar bowing or obliteration of the pronator quadratus fat pad on the lateral view',
    ],
  },
];
