-- AlterTable
ALTER TABLE "Attendee" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'import',
ALTER COLUMN "phone" DROP NOT NULL;
