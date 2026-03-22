-- CreateTable
CREATE TABLE "c" (
    "id" SERIAL NOT NULL,
    "appVersion" TEXT NOT NULL,
    "dbVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "c_pkey" PRIMARY KEY ("id")
);
