-- ================================================
-- WATER METER MANAGEMENT SYSTEM (WM) - SOWASUCO
-- PostgreSQL Schema
-- ================================================

-- Tạo extension nếu cần
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. BẢNG NGƯỜI DÙNG
-- ================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100),
  unit_id INT,
  role VARCHAR(50) NOT NULL DEFAULT 'kho', -- 'admin', 'kho', 'ktv'
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- Index cho tìm kiếm nhanh
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_unit_id ON users(unit_id);
CREATE INDEX idx_users_role ON users(role);

-- ================================================
-- 2. BẢNG ĐƠN VỊ (12 XƯỞNG/CHI NHÁNH)
-- ================================================
CREATE TABLE units (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- XNCN-TP01
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- 'Xưởng', 'Công ty', 'Chi nhánh'
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX idx_units_code ON units(code);
CREATE INDEX idx_units_is_active ON units(is_active);

-- Dữ liệu mẫu 12 đơn vị
INSERT INTO units (code, name, type, address, phone, email, is_active) VALUES
('XNCN-TP01', 'XNCN TP số 1', 'Xưởng', 'Sơn La', '0294-XXXXX', 'xncn1@sowasuco.vn', true),
('XNCN-TP02', 'XNCN TP số 2', 'Xưởng', 'Sơn La', '0294-XXXXX', 'xncn2@sowasuco.vn', true),
('XNCN-MS', 'XNCN Mai Sơn', 'Xưởng', 'Mai Sơn', '0294-XXXXX', 'xncn-ms@sowasuco.vn', true),
('CNCN-MC', 'CNCN Mộc Châu', 'Công ty', 'Mộc Châu', '0294-XXXXX', 'cncn-mc@sowasuco.vn', true),
('CNCN-YC', 'CNCN Yên Châu', 'Công ty', 'Yên Châu', '0294-XXXXX', 'cncn-yc@sowasuco.vn', true),
('CNCN-PY', 'CNCN Phù Yên', 'Công ty', 'Phù Yên', '0294-XXXXX', 'cncn-py@sowasuco.vn', true),
('CNCN-BY', 'CNCN Bắc Yên', 'Công ty', 'Bắc Yên', '0294-XXXXX', 'cncn-by@sowasuco.vn', true),
('CNCN-SM', 'CNCN Sông Mã', 'Công ty', 'Sông Mã', '0294-XXXXX', 'cncn-sm@sowasuco.vn', true),
('CN-SC', 'CNCN Sốp Cộp', 'Chi nhánh', 'Sốp Cộp', '0294-XXXXX', 'cn-sc@sowasuco.vn', true),
('CNCN-TC', 'CNCN Thuận Châu', 'Công ty', 'Thuận Châu', '0294-XXXXX', 'cncn-tc@sowasuco.vn', true),
('CNCN-ML', 'CNCN Mường La', 'Công ty', 'Mường La', '0294-XXXXX', 'cncn-ml@sowasuco.vn', true),
('CNCN-QN', 'CNCN Quỳnh Nhai', 'Công ty', 'Quỳnh Nhai', '0294-XXXXX', 'cncn-qn@sowasuco.vn', true);

-- ================================================
-- 3. BẢNG DANH MỤC ĐỒNG HỒ (25 mã)
-- ================================================
CREATE TABLE meters (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- DH-D15-001
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- 'Tiêu chuẩn', 'Sửa chữa', 'Ngoại nhập'
  manufacturer VARCHAR(100),
  year_manufacture INT,
  unit_price DECIMAL(15, 2), -- Giá mua
  depreciation_price DECIMAL(15, 2), -- Giá tính khấu hao
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX idx_meters_code ON meters(code);
CREATE INDEX idx_meters_category ON meters(category);
CREATE INDEX idx_meters_is_active ON meters(is_active);

-- Dữ liệu mẫu các loại đồng hồ
INSERT INTO meters (code, name, category, manufacturer, year_manufacture, unit_price, depreciation_price, is_active) VALUES
('DH-D15-001', 'Đồng hồ D15', 'Tiêu chuẩn', 'SOWASUCO', 2023, 500000.00, 450000.00, true),
('DH-D15-002', 'Đồng hồ sửa chữa D15', 'Sửa chữa', 'SOWASUCO', 2023, 450000.00, 400000.00, true),
('DH-D15-003', 'Đồng hồ sửa chữa D15 đơn vị', 'Sửa chữa', 'SOWASUCO', 2023, 480000.00, 430000.00, true),
('DH-D15-THAICHI', 'Đồng hồ Thái Aichi MAM-15 (không kèm rắc co)', 'Ngoại nhập', 'Aichi', 2023, 600000.00, 540000.00, true),
('DH-D15-METCON', 'Đồng hồ D15 METCON', 'Ngoại nhập', 'METCON', 2023, 550000.00, 495000.00, true),
('DH-D20', 'Đồng hồ D20', 'Tiêu chuẩn', 'SOWASUCO', 2023, 600000.00, 540000.00, true),
('DH-D25-001', 'Đồng hồ D25', 'Tiêu chuẩn', 'SOWASUCO', 2023, 700000.00, 630000.00, true),
('DH-D25-002', 'Đồng hồ D25 (sửa chữa)', 'Sửa chữa', 'SOWASUCO', 2023, 650000.00, 585000.00, true),
('DH-D25-FLODIS', 'Đồng hồ D25 Flodis', 'Ngoại nhập', 'Flodis', 2023, 750000.00, 675000.00, true),
('DH-D32-001', 'Đồng hồ D32', 'Tiêu chuẩn', 'SOWASUCO', 2023, 800000.00, 720000.00, true),
('DH-D32-002', 'Đồng hồ D32 (sửa chữa)', 'Sửa chữa', 'SOWASUCO', 2023, 750000.00, 675000.00, true),
('DH-D32-FLODIS', 'Đồng hồ D32 Flodis', 'Ngoại nhập', 'Flodis', 2023, 850000.00, 765000.00, true),
('DH-D40-001', 'Đồng hồ D40', 'Tiêu chuẩn', 'SOWASUCO', 2023, 900000.00, 810000.00, true),
('DH-D40-002', 'Đồng hồ D40 (sửa chữa)', 'Sửa chữa', 'SOWASUCO', 2023, 850000.00, 765000.00, true),
('DH-D40-BERMAD', 'Đồng hồ đo lưu lượng Turbobar Bermad DN40', 'Ngoại nhập', 'Bermad', 2023, 1200000.00, 1080000.00, true),
('DH-D50-001', 'Đồng hồ D50', 'Tiêu chuẩn', 'SOWASUCO', 2023, 1000000.00, 900000.00, true),
('DH-D50-002', 'Đồng hồ D50 (sửa chữa)', 'Sửa chữa', 'SOWASUCO', 2023, 950000.00, 855000.00, true),
('DH-D50-BERMAD', 'Đồng hồ DN50 Bermad', 'Ngoại nhập', 'Bermad', 2023, 1300000.00, 1170000.00, true),
('DH-D65', 'Đồng hồ D65', 'Tiêu chuẩn', 'SOWASUCO', 2023, 1200000.00, 1080000.00, true),
('DH-D65-BERMAD', 'Đồng hồ đo lưu lượng Turbobar Bermad DN65', 'Ngoại nhập', 'Bermad', 2023, 1500000.00, 1350000.00, true),
('DH-D80', 'Đồng hồ D80', 'Tiêu chuẩn', 'SOWASUCO', 2023, 1400000.00, 1260000.00, true),
('DH-D100', 'Đồng hồ D100', 'Tiêu chuẩn', 'SOWASUCO', 2023, 1600000.00, 1440000.00, true),
('DH-D150', 'Đồng hồ D150', 'Tiêu chuẩn', 'SOWASUCO', 2023, 2000000.00, 1800000.00, true),
('DH-D150-CONTOR', 'Đồng hồ nước DN150 CONTOR-Metcon (Qn=150m³/h)', 'Ngoại nhập', 'CONTOR-Metcon', 2023, 2500000.00, 2250000.00, true),
('DH-D200', 'Đồng hồ D200', 'Tiêu chuẩn', 'SOWASUCO', 2023, 2500000.00, 2250000.00, true);

-- ================================================
-- 4. BẢNG DANH MỤC VẬT TƯ LINH KIỆN
-- ================================================
CREATE TABLE spare_parts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- VP-D15-001
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- 'Nắp', 'Gioăng', 'Chụp', 'Mặt số', etc
  size VARCHAR(50), -- D15, D20, etc
  unit VARCHAR(20), -- 'cái', 'bộ', 'cặp', etc
  unit_price DECIMAL(15, 2),
  min_stock INT DEFAULT 10, -- Ngưỡng cảnh báo
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX idx_spare_parts_code ON spare_parts(code);
CREATE INDEX idx_spare_parts_category ON spare_parts(category);
CREATE INDEX idx_spare_parts_size ON spare_parts(size);
CREATE INDEX idx_spare_parts_is_active ON spare_parts(is_active);

-- Dữ liệu mẫu vật tư cho D15
INSERT INTO spare_parts (code, name, category, size, unit, unit_price, min_stock, is_active) VALUES
('VP-D15-001', 'Nắp đồng hồ D15', 'Nắp', 'D15', 'cái', 50000.00, 20, true),
('VP-D15-002', 'Chụp xoay đồng hồ D15', 'Chụp', 'D15', 'cái', 35000.00, 15, true),
('VP-D15-003', 'Gioăng sắt', 'Gioăng', 'D15', 'cái', 15000.00, 50, true),
('VP-D15-004', 'Mặt số đồng hồ D15', 'Mặt số', 'D15', 'cái', 80000.00, 10, true),
('VP-D15-005', 'Nắp chặn buồng đo D15', 'Nắp chặn', 'D15', 'cái', 45000.00, 15, true),
('VP-D15-006', 'Cánh quạt đồng hồ D15', 'Cánh quạt', 'D15', 'cái', 60000.00, 10, true),
('VP-D15-007', 'Buồng đo đồng hồ D15', 'Buồng đo', 'D15', 'cái', 200000.00, 5, true),
('VP-D15-008', 'Bộ phận chỉnh bù lưu lượng D15 (vít tinh chỉnh)', 'Bộ phận chỉnh', 'D15', 'bộ', 120000.00, 8, true),
('VP-D15-009', 'Gioăng nắp chặn buồng đo D15 (số 9)', 'Gioăng', 'D15', 'cái', 12000.00, 60, true),
('VP-D15-010', 'Gioăng ốc chặn nút chỉnh D15 (số 14)', 'Gioăng', 'D15', 'cái', 10000.00, 70, true),
('VP-D15-011', 'Vành chống từ đồng hồ D15', 'Vành chống', 'D15', 'cái', 25000.00, 20, true),
('VP-D15-012', 'Gioăng cao su chặn buồng đo D15 (số 12)', 'Gioăng', 'D15', 'cái', 18000.00, 40, true);

-- ================================================
-- 5. LIÊN KẾT ĐỒNG HỒ - VẬT TƯ
-- ================================================
CREATE TABLE meter_spare_parts (
  id SERIAL PRIMARY KEY,
  meter_id INT NOT NULL,
  spare_part_id INT NOT NULL,
  quantity_per_set INT DEFAULT 1, -- Số vật tư cần cho 1 bộ đồng hồ
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (meter_id, spare_part_id),
  FOREIGN KEY (meter_id) REFERENCES meters(id) ON DELETE CASCADE,
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE CASCADE
);

-- Index
CREATE INDEX idx_meter_spare_parts_meter_id ON meter_spare_parts(meter_id);

-- ================================================
-- 6. BẢNG TỒN KHO (INVENTORY)
-- ================================================
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  unit_id INT NOT NULL,
  meter_id INT,
  spare_part_id INT,
  quantity INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'used', 'repair_needed'
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (unit_id, meter_id, status),
  UNIQUE (unit_id, spare_part_id),
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
  FOREIGN KEY (meter_id) REFERENCES meters(id) ON DELETE CASCADE,
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE CASCADE
);

-- Index
CREATE INDEX idx_inventory_unit_id ON inventory(unit_id);
CREATE INDEX idx_inventory_meter_id ON inventory(meter_id);
CREATE INDEX idx_inventory_spare_part_id ON inventory(spare_part_id);
CREATE INDEX idx_inventory_status ON inventory(status);

-- ================================================
-- 7. BẢNG PHIẾU NHẬP KHO
-- ================================================
CREATE TABLE import_vouchers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- PNK-2024-001
  voucher_date DATE NOT NULL,
  import_reason VARCHAR(50) DEFAULT 'purchase', -- 'purchase', 'return', 'transfer'
  unit_id INT NOT NULL,
  created_by INT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'confirmed', 'completed'
  total_amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Index
CREATE INDEX idx_import_vouchers_code ON import_vouchers(code);
CREATE INDEX idx_import_vouchers_voucher_date ON import_vouchers(voucher_date);
CREATE INDEX idx_import_vouchers_unit_id ON import_vouchers(unit_id);
CREATE INDEX idx_import_vouchers_created_by ON import_vouchers(created_by);
CREATE INDEX idx_import_vouchers_status ON import_vouchers(status);

-- ================================================
-- 8. BẢNG CHI TIẾT PHIẾU NHẬP
-- ================================================
CREATE TABLE import_voucher_details (
  id SERIAL PRIMARY KEY,
  import_voucher_id INT NOT NULL,
  meter_id INT,
  spare_part_id INT,
  quantity INT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  line_amount DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'used', 'repair_needed'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (import_voucher_id) REFERENCES import_vouchers(id) ON DELETE CASCADE,
  FOREIGN KEY (meter_id) REFERENCES meters(id) ON DELETE SET NULL,
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX idx_import_voucher_details_import_voucher_id ON import_voucher_details(import_voucher_id);
CREATE INDEX idx_import_voucher_details_meter_id ON import_voucher_details(meter_id);

-- ================================================
-- 9. BẢNG PHIẾU XUẤT KHO
-- ================================================
CREATE TABLE export_vouchers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- PXK-2024-001
  voucher_date DATE NOT NULL,
  export_reason VARCHAR(50) DEFAULT 'sale', -- 'sale', 'repair_allocation', 'discard'
  unit_id INT NOT NULL,
  created_by INT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'confirmed', 'completed'
  total_amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Index
CREATE INDEX idx_export_vouchers_code ON export_vouchers(code);
CREATE INDEX idx_export_vouchers_voucher_date ON export_vouchers(voucher_date);
CREATE INDEX idx_export_vouchers_unit_id ON export_vouchers(unit_id);
CREATE INDEX idx_export_vouchers_status ON export_vouchers(status);

-- ================================================
-- 10. BẢNG CHI TIẾT PHIẾU XUẤT
-- ================================================
CREATE TABLE export_voucher_details (
  id SERIAL PRIMARY KEY,
  export_voucher_id INT NOT NULL,
  meter_id INT,
  spare_part_id INT,
  quantity INT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  line_amount DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'used', 'repair_needed'
  fifo_selection BOOLEAN DEFAULT true, -- Sử dụng FIFO?
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (export_voucher_id) REFERENCES export_vouchers(id) ON DELETE CASCADE,
  FOREIGN KEY (meter_id) REFERENCES meters(id) ON DELETE SET NULL,
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX idx_export_voucher_details_export_voucher_id ON export_voucher_details(export_voucher_id);

-- ================================================
-- 11. BẢNG PHIẾU CHUYỂN KHO
-- ================================================
CREATE TABLE transfer_vouchers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- PCK-2024-001
  voucher_date DATE NOT NULL,
  from_unit_id INT NOT NULL,
  to_unit_id INT NOT NULL,
  created_by INT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'in_transit', 'received', 'completed'
  total_quantity INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_unit_id) REFERENCES units(id) ON DELETE RESTRICT,
  FOREIGN KEY (to_unit_id) REFERENCES units(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Index
CREATE INDEX idx_transfer_vouchers_code ON transfer_vouchers(code);
CREATE INDEX idx_transfer_vouchers_from_unit_id ON transfer_vouchers(from_unit_id);
CREATE INDEX idx_transfer_vouchers_to_unit_id ON transfer_vouchers(to_unit_id);
CREATE INDEX idx_transfer_vouchers_status ON transfer_vouchers(status);

-- ================================================
-- 12. BẢNG CHI TIẾT PHIẾU CHUYỂN
-- ================================================
CREATE TABLE transfer_voucher_details (
  id SERIAL PRIMARY KEY,
  transfer_voucher_id INT NOT NULL,
  meter_id INT,
  spare_part_id INT,
  quantity INT NOT NULL,
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'used', 'repair_needed'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transfer_voucher_id) REFERENCES transfer_vouchers(id) ON DELETE CASCADE,
  FOREIGN KEY (meter_id) REFERENCES meters(id) ON DELETE SET NULL,
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE SET NULL
);

-- ================================================
-- 13. BẢNG AUDIT LOG (KIỂM TOÁN)
-- ================================================
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100), -- 'CREATE', 'UPDATE', 'DELETE'
  table_name VARCHAR(100),
  record_id INT,
  old_value JSONB,
  new_value JSONB,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Index
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);

-- ================================================
-- 14. BẢNG CẢNH BÁO & THÔNG BÁO
-- ================================================
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  unit_id INT,
  alert_type VARCHAR(50) DEFAULT 'low_stock', -- 'low_stock', 'out_of_stock', 'high_damage'
  meter_id INT,
  spare_part_id INT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL,
  FOREIGN KEY (meter_id) REFERENCES meters(id) ON DELETE SET NULL,
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX idx_alerts_unit_id ON alerts(unit_id);
CREATE INDEX idx_alerts_alert_type ON alerts(alert_type);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);

-- ================================================
-- 15. BẢNG GIẢO DỊC & NHẬN HÀNG
-- ================================================
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  meter_id INT,
  spare_part_id INT,
  old_price DECIMAL(15, 2),
  new_price DECIMAL(15, 2),
  changed_by INT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meter_id) REFERENCES meters(id) ON DELETE CASCADE,
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Index
CREATE INDEX idx_price_history_changed_at ON price_history(changed_at);

-- ================================================
-- TRIGGER & FUNCTION (Tạo mã tự động)
-- ================================================

-- Function tạo mã phiếu nhập
CREATE OR REPLACE FUNCTION generate_import_voucher_code()
RETURNS VARCHAR AS $$
DECLARE
  v_code VARCHAR(50);
  v_count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count 
  FROM import_vouchers 
  WHERE voucher_date = CURRENT_DATE;
  
  v_code := 'PNK-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function tạo mã phiếu xuất
CREATE OR REPLACE FUNCTION generate_export_voucher_code()
RETURNS VARCHAR AS $$
DECLARE
  v_code VARCHAR(50);
  v_count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count 
  FROM export_vouchers 
  WHERE voucher_date = CURRENT_DATE;
  
  v_code := 'PXK-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function tạo mã phiếu chuyển
CREATE OR REPLACE FUNCTION generate_transfer_voucher_code()
RETURNS VARCHAR AS $$
DECLARE
  v_code VARCHAR(50);
  v_count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count 
  FROM transfer_vouchers 
  WHERE voucher_date = CURRENT_DATE;
  
  v_code := 'PCK-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VIEWS CHO BÁOCÁO
-- ================================================

-- View: Tồn kho theo đơn vị
CREATE OR REPLACE VIEW v_inventory_by_unit AS
SELECT 
  u.id,
  u.code AS unit_code,
  u.name AS unit_name,
  COALESCE(m.id, sp.id) AS product_id,
  CASE WHEN m.id IS NOT NULL THEN 'meter' ELSE 'spare_part' END AS product_type,
  COALESCE(m.code, sp.code) AS product_code,
  COALESCE(m.name, sp.name) AS product_name,
  i.quantity,
  i.status,
  i.last_updated
FROM units u
LEFT JOIN inventory i ON u.id = i.unit_id
LEFT JOIN meters m ON i.meter_id = m.id
LEFT JOIN spare_parts sp ON i.spare_part_id = sp.id
WHERE i.quantity > 0;

-- View: Tổng tồn kho toàn công ty
CREATE OR REPLACE VIEW v_total_inventory AS
SELECT 
  CASE WHEN m.id IS NOT NULL THEN 'meter' ELSE 'spare_part' END AS product_type,
  COALESCE(m.code, sp.code) AS product_code,
  COALESCE(m.name, sp.name) AS product_name,
  SUM(i.quantity) AS total_quantity,
  CASE WHEN m.id IS NOT NULL THEN m.unit_price ELSE sp.unit_price END AS unit_price,
  SUM(i.quantity * CASE WHEN m.id IS NOT NULL THEN m.unit_price ELSE sp.unit_price END) AS total_value
FROM inventory i
LEFT JOIN meters m ON i.meter_id = m.id
LEFT JOIN spare_parts sp ON i.spare_part_id = sp.id
GROUP BY 
  CASE WHEN m.id IS NOT NULL THEN 'meter' ELSE 'spare_part' END,
  COALESCE(m.code, sp.code),
  COALESCE(m.name, sp.name),
  CASE WHEN m.id IS NOT NULL THEN m.unit_price ELSE sp.unit_price END;

-- View: Cảnh báo hết hàng
CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT 
  u.id AS unit_id,
  u.code AS unit_code,
  u.name AS unit_name,
  COALESCE(m.code, sp.code) AS product_code,
  COALESCE(m.name, sp.name) AS product_name,
  i.quantity,
  CASE WHEN m.id IS NOT NULL THEN m.unit_price ELSE sp.unit_price END AS unit_price,
  COALESCE(sp.min_stock, 10) AS min_stock
FROM inventory i
JOIN units u ON i.unit_id = u.id
LEFT JOIN meters m ON i.meter_id = m.id
LEFT JOIN spare_parts sp ON i.spare_part_id = sp.id
WHERE i.quantity < COALESCE(sp.min_stock, 10)
  AND (m.is_active = true OR sp.is_active = true)
ORDER BY i.quantity ASC;

-- ================================================
-- COMMENT VÀ GNOMIC
-- ================================================

COMMENT ON TABLE users IS 'Bảng người dùng của hệ thống';
COMMENT ON TABLE units IS 'Bảng đơn vị quản lý (12 xưởng/chi nhánh)';
COMMENT ON TABLE meters IS 'Bảng danh mục đồng hồ đo nước';
COMMENT ON TABLE spare_parts IS 'Bảng danh mục vật tư linh kiện sửa chữa';
COMMENT ON TABLE inventory IS 'Bảng tồn kho theo đơn vị';
COMMENT ON TABLE import_vouchers IS 'Bảng phiếu nhập kho';
COMMENT ON TABLE export_vouchers IS 'Bảng phiếu xuất kho';
COMMENT ON TABLE transfer_vouchers IS 'Bảng phiếu chuyển kho';
COMMENT ON TABLE audit_logs IS 'Bảng kiểm toán (lưu lịch sử chỉnh sửa)';
COMMENT ON TABLE alerts IS 'Bảng cảnh báo tồn kho';

-- ================================================
-- TÍNH TOÁN TỔNG TIỀN CHO PHIẾU
-- ================================================

-- Trigger cập nhật tổng tiền phiếu nhập
CREATE OR REPLACE FUNCTION update_import_voucher_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE import_vouchers
  SET total_amount = (
    SELECT COALESCE(SUM(line_amount), 0)
    FROM import_voucher_details
    WHERE import_voucher_id = NEW.import_voucher_id
  )
  WHERE id = NEW.import_voucher_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_import_voucher_total
AFTER INSERT OR UPDATE ON import_voucher_details
FOR EACH ROW
EXECUTE FUNCTION update_import_voucher_total();

-- Trigger cập nhật tổng tiền phiếu xuất
CREATE OR REPLACE FUNCTION update_export_voucher_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE export_vouchers
  SET total_amount = (
    SELECT COALESCE(SUM(line_amount), 0)
    FROM export_voucher_details
    WHERE export_voucher_id = NEW.export_voucher_id
  )
  WHERE id = NEW.export_voucher_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_export_voucher_total
AFTER INSERT OR UPDATE ON export_voucher_details
FOR EACH ROW
EXECUTE FUNCTION update_export_voucher_total();

-- ================================================
-- END OF SCHEMA
-- ================================================
