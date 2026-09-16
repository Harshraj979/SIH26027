-- CreateTable
CREATE TABLE "AssetNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "kmFrom" REAL NOT NULL,
    "kmTo" REAL NOT NULL,
    "trackId" TEXT NOT NULL DEFAULT 'UP',
    "status" TEXT NOT NULL DEFAULT 'OPERATIONAL',
    "division" TEXT NOT NULL DEFAULT 'DLI',
    "zone" TEXT NOT NULL DEFAULT 'NR',
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AssetDependency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dependencyType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceAssetId" TEXT NOT NULL,
    "targetAssetId" TEXT NOT NULL,
    CONSTRAINT "AssetDependency_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "AssetNode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssetDependency_targetAssetId_fkey" FOREIGN KEY ("targetAssetId") REFERENCES "AssetNode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentBid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "department" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "workOrderId" TEXT,
    "targetKmFrom" REAL NOT NULL,
    "targetKmTo" REAL NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "urgencyScore" REAL NOT NULL,
    "utilityWeight" REAL NOT NULL,
    "bidDetails" TEXT NOT NULL,
    "crossDepsNeeded" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "concessionNotes" TEXT,
    "planDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ArbitrationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planDate" DATETIME NOT NULL,
    "totalBidsReceived" INTEGER NOT NULL,
    "bundledBlocksCount" INTEGER NOT NULL,
    "arbitrationRounds" INTEGER NOT NULL DEFAULT 1,
    "naturalLanguageJustification" TEXT NOT NULL,
    "compromiseMetrics" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "division" TEXT NOT NULL DEFAULT 'DLI',
    "passwordHash" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" DATETIME
);

-- CreateTable
CREATE TABLE "ExecutionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT,
    "blockDescription" TEXT NOT NULL,
    "plannedStartMin" INTEGER NOT NULL,
    "plannedEndMin" INTEGER NOT NULL,
    "actualStartMin" INTEGER NOT NULL,
    "actualEndMin" INTEGER NOT NULL,
    "overrunMinutes" INTEGER NOT NULL DEFAULT 0,
    "overrunReason" TEXT NOT NULL DEFAULT 'NONE',
    "notes" TEXT,
    "loggedByEngineer" TEXT NOT NULL DEFAULT 'SSE/P-Way/UMB',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScheduledBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "startHHMM" TEXT NOT NULL,
    "endHHMM" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isShadowBlock" BOOLEAN NOT NULL DEFAULT false,
    "departments" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "planDate" DATETIME NOT NULL,
    "provenance" TEXT NOT NULL DEFAULT 'MODELED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lineId" TEXT NOT NULL DEFAULT 'UP_FAST',
    "slotOptionType" TEXT,
    "slotScore" REAL,
    "delayPenalty" REAL,
    "clubbingBonus" REAL,
    "setupSavedMin" INTEGER NOT NULL DEFAULT 0,
    "horizonType" TEXT NOT NULL DEFAULT 'WEEKLY',
    "workOrderId" TEXT NOT NULL,
    CONSTRAINT "ScheduledBlock_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ScheduledBlock" ("createdAt", "departments", "durationMinutes", "endHHMM", "endMin", "id", "isShadowBlock", "planDate", "provenance", "startHHMM", "startMin", "status", "workOrderId") SELECT "createdAt", "departments", "durationMinutes", "endHHMM", "endMin", "id", "isShadowBlock", "planDate", "provenance", "startHHMM", "startMin", "status", "workOrderId" FROM "ScheduledBlock";
DROP TABLE "ScheduledBlock";
ALTER TABLE "new_ScheduledBlock" RENAME TO "ScheduledBlock";
CREATE TABLE "new_TrainPerturbation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationCode" TEXT NOT NULL,
    "originalDeparture" TEXT,
    "delayMinutes" INTEGER NOT NULL,
    "cause" TEXT NOT NULL,
    "planDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainId" TEXT NOT NULL,
    CONSTRAINT "TrainPerturbation_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TrainPerturbation" ("cause", "createdAt", "delayMinutes", "id", "originalDeparture", "planDate", "stationCode", "trainId") SELECT "cause", "createdAt", "delayMinutes", "id", "originalDeparture", "planDate", "stationCode", "trainId" FROM "TrainPerturbation";
DROP TABLE "TrainPerturbation";
ALTER TABLE "new_TrainPerturbation" RENAME TO "TrainPerturbation";
CREATE TABLE "new_WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "department" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kmFrom" REAL NOT NULL,
    "kmTo" REAL NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedDate" DATETIME NOT NULL,
    "completedDate" DATETIME,
    "lineId" TEXT NOT NULL DEFAULT 'UP_FAST',
    "kpMarker" TEXT,
    "defectType" TEXT,
    "ssrTaskCode" TEXT,
    "ssrStandardMin" INTEGER,
    "aiAdjustedMin" INTEGER,
    "nearestDepot" TEXT,
    "transitMinutes" INTEGER NOT NULL DEFAULT 0,
    "hardSafetyOverride" BOOLEAN NOT NULL DEFAULT false,
    "explanation" TEXT,
    "horizonType" TEXT NOT NULL DEFAULT 'WEEKLY',
    "overdueDays" INTEGER NOT NULL DEFAULT 0,
    "cumulativeGmt" REAL NOT NULL DEFAULT 0,
    "tqiScore" REAL NOT NULL DEFAULT 70,
    "assetRisk" REAL,
    "penaltyWeight" INTEGER,
    "isShadowBlock" BOOLEAN NOT NULL DEFAULT false,
    "parentClusterId" TEXT,
    "provenance" TEXT NOT NULL DEFAULT 'LIVE',
    "trackId" TEXT NOT NULL,
    CONSTRAINT "WorkOrder_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WorkOrder" ("assetRisk", "completedDate", "cumulativeGmt", "department", "description", "durationMinutes", "id", "isShadowBlock", "kmFrom", "kmTo", "overdueDays", "parentClusterId", "penaltyWeight", "priority", "provenance", "requestedDate", "status", "tqiScore", "trackId") SELECT "assetRisk", "completedDate", "cumulativeGmt", "department", "description", "durationMinutes", "id", "isShadowBlock", "kmFrom", "kmTo", "overdueDays", "parentClusterId", "penaltyWeight", "priority", "provenance", "requestedDate", "status", "tqiScore", "trackId" FROM "WorkOrder";
DROP TABLE "WorkOrder";
ALTER TABLE "new_WorkOrder" RENAME TO "WorkOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AssetNode_assetCode_key" ON "AssetNode"("assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");
