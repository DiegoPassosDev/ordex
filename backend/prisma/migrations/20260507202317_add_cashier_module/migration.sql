-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_PAID', 'CANCELLED');

-- AlterEnum
ALTER TYPE "EmployeeRole" ADD VALUE 'CASHIER';

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'PIX', 'DEBIT', 'CREDIT', 'VOUCHER', 'CHECK', 'STORE_CREDIT', 'MIXED');
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old" CASCADE;
COMMIT;

-- AlterTable Bill
ALTER TABLE "Bill"
ADD COLUMN "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable Guest
ALTER TABLE "Guest"
ADD COLUMN "address" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "cpf" TEXT,
ADD COLUMN "neighborhood" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Guest_cpf_key" ON "Guest"("cpf");

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "serviceCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalAmount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PAID',
    "cashReceived" DOUBLE PRECISION,
    "change" DOUBLE PRECISION,
    "notes" TEXT,
    "authorizedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentItem" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "PaymentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerDebt" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "totalDebt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerDebt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtTransaction" (
    "id" TEXT NOT NULL,
    "customerDebtId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "authorizedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DebtTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TableSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentItem" ADD CONSTRAINT "PaymentItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerDebt" ADD CONSTRAINT "CustomerDebt_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DebtTransaction" ADD CONSTRAINT "DebtTransaction_customerDebtId_fkey" FOREIGN KEY ("customerDebtId") REFERENCES "CustomerDebt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;