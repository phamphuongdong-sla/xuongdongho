UPDATE "Unit" SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE "User" SET
  lastLogin = CASE WHEN typeof(lastLogin) = 'integer' THEN datetime(lastLogin / 1000, 'unixepoch') ELSE lastLogin END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE "Meter" SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE "SparePart" SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE "MeterSparePart" SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END;

UPDATE "Contract" SET
  signDate = CASE WHEN typeof(signDate) = 'integer' THEN datetime(signDate / 1000, 'unixepoch') ELSE signDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE "ContractBatch" SET
  expectedDate = CASE WHEN typeof(expectedDate) = 'integer' THEN datetime(expectedDate / 1000, 'unixepoch') ELSE expectedDate END,
  actualDate = CASE WHEN typeof(actualDate) = 'integer' THEN datetime(actualDate / 1000, 'unixepoch') ELSE actualDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE "Inventory" SET
  lastUpdated = CASE WHEN typeof(lastUpdated) = 'integer' THEN datetime(lastUpdated / 1000, 'unixepoch') ELSE lastUpdated END;

UPDATE "ImportVoucher" SET
  voucherDate = CASE WHEN typeof(voucherDate) = 'integer' THEN datetime(voucherDate / 1000, 'unixepoch') ELSE voucherDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE "ImportVoucherDetail" SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END;

UPDATE "ExportVoucher" SET
  voucherDate = CASE WHEN typeof(voucherDate) = 'integer' THEN datetime(voucherDate / 1000, 'unixepoch') ELSE voucherDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE "ExportVoucherDetail" SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END;

UPDATE "TransferVoucher" SET
  voucherDate = CASE WHEN typeof(voucherDate) = 'integer' THEN datetime(voucherDate / 1000, 'unixepoch') ELSE voucherDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE "TransferVoucherDetail" SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END;

UPDATE "RepairVoucher" SET
  repairDate = CASE WHEN typeof(repairDate) = 'integer' THEN datetime(repairDate / 1000, 'unixepoch') ELSE repairDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE "RepairVoucherSparePart" SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END;

UPDATE "MeterInspection" SET
  inspectionDate = CASE WHEN typeof(inspectionDate) = 'integer' THEN datetime(inspectionDate / 1000, 'unixepoch') ELSE inspectionDate END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;

UPDATE "AuditLog" SET
  changedAt = CASE WHEN typeof(changedAt) = 'integer' THEN datetime(changedAt / 1000, 'unixepoch') ELSE changedAt END;

UPDATE "Alert" SET
  readAt = CASE WHEN typeof(readAt) = 'integer' THEN datetime(readAt / 1000, 'unixepoch') ELSE readAt END,
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END;

UPDATE "Employee" SET
  createdAt = CASE WHEN typeof(createdAt) = 'integer' THEN datetime(createdAt / 1000, 'unixepoch') ELSE createdAt END,
  updatedAt = CASE WHEN typeof(updatedAt) = 'integer' THEN datetime(updatedAt / 1000, 'unixepoch') ELSE updatedAt END;
