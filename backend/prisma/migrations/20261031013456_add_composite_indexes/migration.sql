-- CreateIndex
CREATE INDEX "transactions_date_type_idx" ON "transactions"("date", "type");

-- CreateIndex
CREATE INDEX "transactions_date_categoryId_idx" ON "transactions"("date", "categoryId");

-- CreateIndex
CREATE INDEX "transactions_date_type_categoryId_idx" ON "transactions"("date", "type", "categoryId");
