-- CreateTable
CREATE TABLE "Corridor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "divisionCode" TEXT NOT NULL,
    "zoneCode" TEXT NOT NULL,
    "totalKm" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chainage" REAL NOT NULL,
    "zone" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "provenance" TEXT NOT NULL DEFAULT 'AUTHORITATIVE',
    "corridorId" TEXT NOT NULL,
    "upArrivalMin" INTEGER,
    "dnArrivalMin" INTEGER,
    CONSTRAINT "Station_corridorId_fkey" FOREIGN KEY ("corridorId") REFERENCES "Corridor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackId" TEXT NOT NULL,
    "kmFrom" REAL NOT NULL,
    "kmTo" REAL NOT NULL,
    "trackType" TEXT NOT NULL DEFAULT 'MAIN',
    "maxSpeedKmh" INTEGER NOT NULL DEFAULT 160,
    "corridorId" TEXT NOT NULL,
    CONSTRAINT "Track_corridorId_fkey" FOREIGN KEY ("corridorId") REFERENCES "Corridor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Train" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "trainType" TEXT NOT NULL,
    "rakeType" TEXT NOT NULL,
    "maxSpeedKmh" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "provenance" TEXT NOT NULL DEFAULT 'AUTHORITATIVE'
);

-- CreateTable
CREATE TABLE "TrainStop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sequence" INTEGER NOT NULL,
    "arrivalMin" INTEGER,
    "departureMin" INTEGER,
    "arrivalHHMM" TEXT,
    "departureHHMM" TEXT,
    "haltMinutes" INTEGER NOT NULL DEFAULT 0,
    "isOrigin" BOOLEAN NOT NULL DEFAULT false,
    "isDestination" BOOLEAN NOT NULL DEFAULT false,
    "platform" TEXT,
    "trainId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    CONSTRAINT "TrainStop_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TrainStop_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrder" (
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

-- CreateTable
CREATE TABLE "ScheduledBlock" (
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
    "workOrderId" TEXT NOT NULL,
    CONSTRAINT "ScheduledBlock_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperationalEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'CAUTION',
    "kmFrom" REAL,
    "kmTo" REAL,
    "startMin" INTEGER,
    "endMin" INTEGER,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "affectedTrains" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "provenance" TEXT NOT NULL DEFAULT 'LIVE'
);

-- CreateTable
CREATE TABLE "TrainPerturbation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationCode" TEXT NOT NULL,
    "originalDeparture" TEXT NOT NULL,
    "delayMinutes" INTEGER NOT NULL,
    "cause" TEXT NOT NULL,
    "planDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainId" TEXT NOT NULL,
    CONSTRAINT "TrainPerturbation_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Station_code_key" ON "Station"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Train_number_key" ON "Train"("number");
