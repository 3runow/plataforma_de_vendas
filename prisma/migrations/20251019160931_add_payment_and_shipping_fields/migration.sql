-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "melhorEnvioOrderId" TEXT,
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "shippingDeliveryTime" INTEGER,
ADD COLUMN     "shippingPrice" DOUBLE PRECISION,
ADD COLUMN     "shippingService" TEXT,
ADD COLUMN     "shippingTrackingCode" TEXT;
