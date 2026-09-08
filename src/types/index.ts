/**
 * RailBlock AI — Shared TypeScript Types
 */

// ─── DOMAIN MODELS ────────────────────────────────────────────────────────────

export interface Station {
  id:        string;
  code:      string;
  name:      string;
  chainage:  number;
  zone:      string;
  division:  string;
  provenance: string;
}

export interface TrainStop {
  sequence:      number;
  arrivalMin?:   number | null;
  departureMin?: number | null;
  arrivalHHMM?:  string | null;
  departureHHMM?: string | null;
  haltMinutes:   number;
  isOrigin:      boolean;
  isDestination: boolean;
  chainage?:     number;  // resolved from station
  stationCode?:  string;
  stationName?:  string;
}

export interface Train {
  id:          string;
  number:      string;
  name:        string;
  priority:    number;
  trainType:   string;
  rakeType:    string;
  maxSpeedKmh: number;
  direction:   string;
  isActive:    boolean;
  provenance:  string;
  stops:       TrainStop[];
}

export interface WorkOrder {
  id:               string;
  department:       "TMS" | "SMMS" | "TDMS";
  description:      string;
  kmFrom:           number;
  kmTo:             number;
  durationMinutes:  number;
  priority:         number;
  status:           "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  overdueDays:      number;
  cumulativeGmt:    number;
  tqiScore:         number;
  assetRisk?:       number | null;
  penaltyWeight?:   number | null;
  isShadowBlock:    boolean;
  trackId:          string;
  provenance:       string;
}

export interface ScheduledBlock {
  clusterIds:      string[];
  isShadowBlock:   boolean;
  departments:     string[];
  kmFrom:          number;
  kmTo:            number;
  startMin:        number;
  endMin:          number;
  durationMinutes: number;
  startHHMM:       string;
  endHHMM:         string;
  assetRisk:       number;
  penaltyWeight:   number;
  description:     string;
  justification?:  string; // Explainable AI (XAI) natural language reasoning
  trackId:         string;
  provenance:      string;
}

export interface TrainPerturbation {
  trainNumber:       string;
  priority:          number;
  stationCode:       string;
  originalDeparture: string;
  delayMinutes:      number;
  cause:             string;
  slwDiverted?:      boolean;
  slwRoute?:         string;
}

export interface OperationalEvent {
  id:            string;
  eventType:     string;
  description:   string;
  severity:      "CRITICAL" | "CAUTION" | "INFO";
  kmFrom?:       number | null;
  kmTo?:         number | null;
  startMin?:     number | null;
  endMin?:       number | null;
  delayMinutes:  number;
  affectedTrains?: string | null;
  isActive:      boolean;
  provenance:    string;
}

export interface KPIs {
  blocksScheduled:       number;
  shadowBlocks:          number;
  p1TrainsProtected:     number;
  avgRisk:               number;
  totalWorkOrders:       number;
  perturbedTrains:       number;
  corridorMinutesSaved?: number;
  error?:                string;
}

export interface SolverStats {
  status:         string;
  wallTimeMs:     number;
  conflicts?:     number;
  branches?:      number;
  objectiveValue?: number;
}

// ─── MULTI-AGENT NEGOTIATION & XAI TYPES ─────────────────────────────────────

export interface DepartmentBid {
  department:       "TMS" | "SMMS" | "TDMS";
  agentName:        string;
  workOrderId?:     string;
  description:      string;
  kmFrom:           number;
  kmTo:             number;
  durationMinutes:  number;
  trackId:          string;
  urgencyScore:     number;
  utilityWeight:    number;
  justification:    string;
  crossDepsNeeded?: string[];
}

export interface ArbitrationTranscript {
  totalBids:                number;
  bundledBlocks:            number;
  shadowBlocksCount:        number;
  corridorMinutesSaved:     number;
  departmentalSatisfaction: {
    TMS:                   number;
    SMMS:                  number;
    TDMS:                  number;
    OperationsPunctuality: number;
  };
  bids:                     DepartmentBid[];
  justifications:           string[];
}

// ─── DIGITAL TWIN TYPES ───────────────────────────────────────────────────────

export interface DigitalTwinAssetData {
  id:           string;
  assetCode:    string;
  name:         string;
  assetType:    "TRACK_SEGMENT" | "SIGNAL" | "OHE_FEEDER" | "CROSSOVER" | "STATION";
  kmFrom:       number;
  kmTo:         number;
  trackId:      string;
  status:       string;
  metadata?:    Record<string, unknown>;
  dependencies?: {
    type:        string;
    targetCode:  string;
    description: string;
  }[];
}

export interface ExecutionLogItem {
  id:               string;
  workOrderId?:     string | null;
  blockDescription: string;
  plannedStartMin:  IntToString;
  plannedEndMin:    IntToString;
  actualStartMin:   number;
  actualEndMin:     number;
  overrunMinutes:   number;
  overrunReason:    string;
  notes?:           string | null;
  loggedByEngineer: string;
  createdAt:        string;
}

type IntToString = number;

// ─── SOLVER I/O ───────────────────────────────────────────────────────────────

export interface SolverTrainStop {
  stationCode:  string;
  chainage:     number;
  arrivalMin?:  number | null;
  departureMin?: number | null;
  arrivalHHMM?: string | null;
  departureHHMM?: string | null;
}

export interface SolverTrain {
  id:       string;
  number:   string;
  priority: number;
  stops:    SolverTrainStop[];
}

export interface SolverWorkOrder {
  id:               string;
  department:       string;
  description:      string;
  kmFrom:           number;
  kmTo:             number;
  durationMinutes:  number;
  overdueDays:      number;
  cumulativeGmt:    number;
  tqiScore:         number;
  trackId:          string;
}

export interface SolverPayload {
  workOrders:      SolverWorkOrder[];
  trains:          SolverTrain[];
  horizonMinutes:  number;
  date:            string;
  monsoonActive?:  boolean;
}

export interface SolverResult {
  scheduledBlocks:        ScheduledBlock[];
  trainPerturbations:     TrainPerturbation[];
  arbitrationTranscript?: ArbitrationTranscript;
  solverStats:            SolverStats;
  kpis:                   KPIs;
  error?:                 string;
}

// ─── API RESPONSE TYPES ───────────────────────────────────────────────────────

export interface CorridorData {
  corridor:   { id: string; name: string; totalKm: number };
  stations:   Station[];
  trains:     Train[];
  workOrders: WorkOrder[];
  events:     OperationalEvent[];
  digitalTwin?: {
    assets:          DigitalTwinAssetData[];
    crossoversCount: number;
    feedersCount:    number;
    signalsCount:    number;
  };
}

export interface OptimizeResponse extends SolverResult {
  planDate: string;
}

