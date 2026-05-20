-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateTable
CREATE TABLE "TableAccessRequest" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableAccessRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TableAccessRequest" ADD CONSTRAINT "TableAccessRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAccessRequest" ADD CONSTRAINT "TableAccessRequest_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAccessRequest" ADD CONSTRAINT "TableAccessRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
