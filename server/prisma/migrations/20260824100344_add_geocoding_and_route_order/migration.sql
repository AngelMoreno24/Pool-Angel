-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "routeOrder" INTEGER;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
