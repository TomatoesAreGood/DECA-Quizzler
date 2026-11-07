-- AlterTable
ALTER TABLE "User" DROP COLUMN "userName",
ADD COLUMN     "username" VARCHAR(20);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

