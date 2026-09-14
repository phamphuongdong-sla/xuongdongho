# 📋 SPEC HOÀN CHỈNH: WATER METER MANAGEMENT SYSTEM (WM) - SOWASUCO

**Phiên bản:** 1.0  
**Ngày tạo:** 2026-09-08  
**Dự án:** Webapp Quản Lý Kho Đồng Hồ & Vật Tư Linh Kiện - SOWASUCO  
**Người chủ trì:** Phạm Phương Đông (Trưởng phòng Quản lý Khách hàng)

---

## 🎯 I. TỔNG QUAN HỆ THỐNG

### A. Mục Đích
Webapp quản lý kho toàn quy trình nhập/xuất đồng hồ đo nước và vật tư linh kiện sửa chữa trong xưởng đồng hồ của 12 đơn vị trực thuộc SOWASUCO.

### B. Phạm Vi
- **Loại sản phẩm:** 30+ mã đồng hồ + 100+ mã vật tư linh kiện
- **Đơn vị quản lý:** 12 xưởng/chi nhánh cấp nước (xem danh sách bên dưới)
- **Qui mô người dùng:** ~20-50 nhân viên kho
- **Giao dịch dự kiến:** ~500-1000 phiếu/tháng
- **Lịch sử lưu giữ:** 3 năm

### C. Phạm Vi Không Bao Gồm
- ❌ Kiểm định / Hiệu chuẩn đồng hồ
- ❌ Bán hàng trực tiếp khách hàng
- ❌ Quản lý dự án cấp nước

---

## 📦 II. DANH MỤC CHÍNH

### A. DANH MỤC ĐỒNG HỒ (30+ SKU)

| ID | Mã Đồng Hồ | Tên Sản Phẩm | Nhóm | Ghi Chú |
|----|----|------------|------|--------|
| 001 | DH-D15-001 | Đồng hồ D15 | Tiêu chuẩn | Mặc định |
| 002 | DH-D15-002 | Đồng hồ sửa chữa D15 | Sửa chữa | Đơn vị: cái |
| 003 | DH-D15-003 | Đồng hồ sửa chữa D15 đơn vị | Sửa chữa | Loại khác |
| 004 | DH-D15-THAICHI | Đồng hồ Thái Aichi MAM-15 | Ngoại nhập | Không kèm rắc co |
| 005 | DH-D15-METCON | Đồng hồ D15 METCON | Ngoại nhập | - |
| 006 | DH-D20 | Đồng hồ D20 | Tiêu chuẩn | - |
| 007 | DH-D25-001 | Đồng hồ D25 | Tiêu chuẩn | - |
| 008 | DH-D25-002 | Đồng hồ D25 (sửa chữa) | Sửa chữa | - |
| 009 | DH-D25-FLODIS | Đồng hồ D25 Flodis | Ngoại nhập | - |
| 010 | DH-D32-001 | Đồng hồ D32 | Tiêu chuẩn | - |
| 011 | DH-D32-002 | Đồng hồ D32 (sửa chữa) | Sửa chữa | - |
| 012 | DH-D32-FLODIS | Đồng hồ D32 Flodis | Ngoại nhập | - |
| 013 | DH-D40-001 | Đồng hồ D40 | Tiêu chuẩn | - |
| 014 | DH-D40-002 | Đồng hồ D40 (sửa chữa) | Sửa chữa | - |
| 015 | DH-D40-BERMAD | Đồng hồ đo lưu lượng Turbobar Bermad DN40 | Ngoại nhập | Lưu lượng |
| 016 | DH-D50-001 | Đồng hồ D50 | Tiêu chuẩn | - |
| 017 | DH-D50-002 | Đồng hồ D50 (sửa chữa) | Sửa chữa | - |
| 018 | DH-D50-BERMAD | Đồng hồ DN50 Bermad | Ngoại nhập | - |
| 019 | DH-D65 | Đồng hồ D65 | Tiêu chuẩn | - |
| 020 | DH-D65-BERMAD | Đồng hồ đo lưu lượng Turbobar Bermad DN65 | Ngoại nhập | Lưu lượng |
| 021 | DH-D80 | Đồng hồ D80 | Tiêu chuẩn | - |
| 022 | DH-D100 | Đồng hồ D100 | Tiêu chuẩn | - |
| 023 | DH-D150 | Đồng hồ D150 | Tiêu chuẩn | - |
| 024 | DH-D150-CONTOR | Đồng hồ nước DN150 CONTOR-Metcon (Qn=150m³/h) | Ngoại nhập | Cấp B (4,5-300m³/h) |
| 025 | DH-D200 | Đồng hồ D200 | Tiêu chuẩn | - |

### B. DANH MỤC VẬT TƯ LINH KIỆN (100+ mã)

**Vật tư cho Đồng Hồ D15 (12 mã chính):**

| ID | Mã Vật Tư | Tên Vật Tư | Nhóm | Kích Thước | Đơn Vị | Liên Kết |
|----|----|---------|------|---------|------|---------|
| VP001 | VP-D15-001 | Nắp đồng hồ D15 | Nắp | D15 | cái | DH-D15-001 |
| VP002 | VP-D15-002 | Chụp xoay đồng hồ D15 | Chụp | D15 | cái | DH-D15-001 |
| VP003 | VP-D15-003 | Gioăng sắt | Gioăng | D15 | cái | DH-D15-001 |
| VP004 | VP-D15-004 | Mặt số đồng hồ D15 | Mặt số | D15 | cái | DH-D15-001 |
| VP005 | VP-D15-005 | Nắp chặn buồng đo D15 | Nắp chặn | D15 | cái | DH-D15-001 |
| VP006 | VP-D15-006 | Cánh quạt đồng hồ D15 | Cánh quạt | D15 | cái | DH-D15-001 |
| VP007 | VP-D15-007 | Buồng đo đồng hồ D15 | Buồng đo | D15 | cái | DH-D15-001 |
| VP008 | VP-D15-008 | Bộ phận chỉnh bù lưu lượng D15 (vít tinh chỉnh) | Bộ phận chỉnh | D15 | bộ | DH-D15-001 |
| VP009 | VP-D15-009 | Gioăng nắp chặn buồng đo D15 (số 9) | Gioăng | D15 | cái | DH-D15-001 |
| VP010 | VP-D15-010 | Gioăng ốc chặn nút chỉnh D15 (số 14) | Gioăng | D15 | cái | DH-D15-001 |
| VP011 | VP-D15-011 | Vành chống từ đồng hồ D15 | Vành chống | D15 | cái | DH-D15-001 |
| VP012 | VP-D15-012 | Gioăng cao su chặn buồng đo D15 (số 12) | Gioăng | D15 | cái | DH-D15-001 |

**Ghi chú:** Vật tư cho D20, D25, D32... sẽ tương tự, thay đổi loại phù hợp theo đồng hồ.

### C. DANH MỤC 12 ĐƠN VỊ QUẢN LÝ

| ID | Mã ĐV | Tên Đơn Vị | Loại | Địa Chỉ |
|----|----|----|------|--------|
| 01 | XNCN-TP01 | XNCN TP số 1 | Xưởng | Sơn La |
| 02 | XNCN-TP02 | XNCN TP số 2 | Xưởng | Sơn La |
| 03 | XNCN-MS | XNCN Mai Sơn | Xưởng | Mai Sơn |
| 04 | CNCN-MC | CNCN Mộc Châu | Công ty | Mộc Châu |
| 05 | CNCN-YC | CNCN Yên Châu | Công ty | Yên Châu |
| 06 | CNCN-PY | CNCN Phù Yên | Công ty | Phù Yên |
| 07 | CNCN-BY | CNCN Bắc Yên | Công ty | Bắc Yên |
| 08 | CNCN-SM | CNCN Sông Mã | Công ty | Sông Mã |
| 09 | CN-SC | CNCN Sốp Cộp | Chi nhánh | Sốp Cộp |
| 10 | CNCN-TC | CNCN Thuận Châu | Công ty | Thuận Châu |
| 11 | CNCN-ML | CNCN Mường La | Công ty | Mường La |
| 12 | CNCN-QN | CNCN Quỳnh Nhai | Công ty | Quỳnh Nhai |

---

## 🔄 III. CHỨC NĂNG CHÍNH

### A. QUẢN LÝ KHO

#### 1. PHIẾU NHẬP KHO
**Mục đích:** Ghi nhận khi hàng nhập vào kho từ nhà cung cấp, trả lại, di chuyển nội bộ

**Thông tin phiếu:**
- Mã phiếu (tự động sinh, VD: PNK-2024-001)
- Ngày nhập
- Người nhập (chọn từ danh sách nhân viên)
- Lý do nhập: Mua hàng mới / Hàng trả lại / Di chuyển từ đơn vị khác
- Đơn vị nhập (chọn từ 12 đơn vị)
- Ghi chú

**Chi tiết phiếu (Danh sách Hàng Hóa):**
- Mã đồng hồ / mã vật tư (tìm kiếm, auto-complete)
- Số lượng
- Đơn vị (cái/bộ)
- Đơn giá (mặc định lấy từ bảng giá, có thể sửa)
- Thành tiền (tự tính)
- Tình trạng: Mới / Đã qua sử dụng / Cần sửa chữa
- Ghi chú

**Tệp đính kèm:**
- Hóa đơn/Chứng từ (optional)
- Ảnh hàng hóa (optional)

**Trạng thái phiếu:**
- Nháp (chỉnh sửa được)
- Đã xác nhận (khóa, không thể sửa)
- Đã kết thúc

#### 2. PHIẾU XUẤT KHO
**Mục đích:** Ghi nhận khi hàng xuất khỏi kho (bán, cấp phát sửa chữa, loại bỏ)

**Thông tin phiếu:**
- Mã phiếu (tự động sinh, VD: PXK-2024-001)
- Ngày xuất
- Người xuất (chọn từ danh sách nhân viên)
- Lý do xuất: Bán / Cấp phát sửa chữa / Hỏng-Loại bỏ
- Đơn vị xuất (chọn từ 12 đơn vị)
- Ghi chú

**Chi tiết phiếu:**
- Mã đồng hồ / mã vật tư
- Số lượng (kiểm tra không được vượt tồn kho)
- Đơn vị
- Đơn giá (hiển thị)
- Thành tiền
- Ghi chú

**Lựa chọn hàng:**
- FIFO (First-In-First-Out) - ưu tiên hàng cũ nhất
- Theo tình trạng (Mới → Đã qua sử dụng → Cần sửa)
- Manual (chọn tay)

**Trạng thái phiếu:**
- Nháp
- Đã xác nhận
- Đã kết thúc

#### 3. PHIẾU CHUYỂN KHO
**Mục đích:** Ghi nhận chuyển hàng từ đơn vị này sang đơn vị khác

**Thông tin phiếu:**
- Mã phiếu (VD: PCK-2024-001)
- Ngày chuyển
- Người chuyển
- Chuyển từ (đơn vị)
- Chuyển đến (đơn vị)
- Ghi chú

**Chi tiết phiếu:**
- Giống như phiếu xuất (lựa chọn hàng từ kho nguồn)
- Số lượng, đơn vị, tình trạng

**Trạng thái:**
- Nháp
- Đang chuyển
- Đã nhận (xác nhận tại đơn vị đích)
- Đã kết thúc

---

### B. QUẢN LÝ TỒN KHO

#### 1. Theo Dõi Tồn Kho Thực Thời
- Hiển thị tồn kho từng loại đồng hồ/vật tư tại từng đơn vị
- Tồn kho theo tình trạng (Mới, Đã qua sử dụng, Cần sửa)
- Tồn kho gộp toàn công ty
- Cảnh báo nếu tồn kho < ngưỡng tối thiểu (cấu hình được)

#### 2. Kiểm Kho
- Tạo phiếu kiểm kho (so sánh tồn hệ thống vs thực tế)
- Ghi nhận chênh lệch
- Điều chỉnh tồn kho nếu cần
- Lưu lịch sử kiểm kho

#### 3. Định Giá Tồn Kho
- Giá trị tồn kho = Số lượng × Đơn giá
- Xuất báo cáo giá trị tồn kho (hỗ trợ phân tích tài chính)

---

### C. TÌM KIẾM & LỌC NÂNG CAO

#### 1. Tìm Kiếm Nhanh
- Input: Gõ vào, tìm ngay (full-text search)
- Tìm theo: Mã đồng hồ, Tên đồng hồ, Mã vật tư, Tên vật tư
- Kết quả: Liệt kê hàng hóa, hiển thị tồn kho từng đơn vị

#### 2. Lọc Nâng Cao
- Lọc theo: Loại sản phẩm, Đơn vị, Tình trạng, Khoảng giá, Thời gian
- Áp dụng bộ lọc kết hợp
- Lưu bộ lọc yêu thích

---

### D. BÁOCÁO & THỐNG KÊ

#### 1. Báo Cáo Tồn Kho
- **Báo cáo tồn kho toàn công ty:** Gộp tất cả 12 đơn vị
- **Báo cáo tồn kho theo đơn vị:** Chi tiết từng đơn vị
- **Báo cáo tồn kho theo tình trạng:** Mới, Đã qua sử dụng, Cần sửa
- **Báo cáo tồn kho vật tư:** Phân loại theo nhóm (Nắp, Gioăng, Chụp...)
- **Báo cáo giá trị tồn kho:** Tính giá trị = SL × Đơn giá

#### 2. Báo Cáo Giao Dịch
- **Báo cáo nhập/xuất:** Tổng số phiếu, tổng SL, tổng giá trị theo thời gian
- **Báo cáo chi tiết giao dịch:** Danh sách phiếu nhập/xuất/chuyển kho
- **Báo cáo theo người dùng:** Thống kê phiếu từng nhân viên
- **Báo cáo theo lý do:** Phân loại nhập/xuất theo lý do

#### 3. Biểu Đồ Phân Tích
- **Biểu đồ nhập/xuất theo thời gian:** Line chart (30 ngày, 12 tháng)
- **Biểu đồ tồn kho theo loại:** Pie chart / Bar chart
- **Biểu đồ xu hướng:** Trend line tồn kho từng sản phẩm
- **Biểu đồ phân bố:** Tồn kho theo đơn vị, theo tình trạng

#### 4. Xuất Báo Cáo
- **Xuất Excel (.xlsx):**
  - Bảng dữ liệu chi tiết
  - Định dạng đẹp (header, định dạng cột)
  - Công thức tính tổng tự động
- **Xuất PDF:**
  - Báo cáo định dạng chính thức (theo mẫu SOWASUCO)
  - Thêm logo, ngày lập báo cáo, chữ ký
- **Xuất CSV:** Cho import vào Excel/hệ thống khác
- **Lên lịch báo cáo:** Tự động gửi báo cáo hàng ngày/tuần/tháng qua email

---

### E. QUẢN LÝ GIAO DỊCH & LỊCH SỬ

#### 1. Phân Quyền Giao Dịch
- **Admin:** Xem/Tạo/Sửa/Xóa tất cả phiếu, xem audit log
- **Nhân viên Kho:** Tạo/Sửa phiếu của mình, xem toàn bộ phiếu công ty
- **Kỹ Thuật Viên:** Xem phiếu, cập nhật tình trạng sản phẩm

#### 2. Audit Logging (Kiểm Toán)
- Ghi lại: **Ai, Khi nào, Sửa gì, Giá trị cũ, Giá trị mới**
- Không thể xóa/chỉnh sửa lịch sử (chỉ xem)
- Lọc audit log theo: Người dùng, Loại thay đổi, Khoảng thời gian
- Xuất audit log cho báo cáo kiểm toán

#### 3. Khóa Phiếu
- Phiếu "Đã xác nhận" không thể chỉnh sửa/xóa
- Chỉ Admin có quyền mở khóa (ghi lại reason)
- Phiếu cũ (>3 tháng) tự động khóa

---

### F. QUẢN LÝ DANH MỤC

#### 1. Quản Lý Đồng Hồ
- Thêm/Sửa/Xóa mã đồng hồ
- Thuộc tính: Mã, Tên, Nhóm, Hãng, Năm sản xuất, Giá mua, Giá tính khấu hao
- Trạng thái: Kích hoạt / Tắt

#### 2. Quản Lý Vật Tư
- Thêm/Sửa/Xóa mã vật tư
- Thuộc tính: Mã, Tên, Nhóm, Kích thước, Đơn vị, Giá, Ngưỡng cảnh báo
- Liên kết với đồng hồ
- Trạng thái: Kích hoạt / Tắt

#### 3. Quản Lý Giá
- Bảng giá đồng hồ/vật tư (có thể cập nhật batch từ Excel)
- Lịch sử thay đổi giá
- Áp dụng giá theo thời gian

---

### G. QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN

#### 1. Vai Trò & Quyền

| Vai Trò | Xem Kho | Tạo Phiếu | Sửa Phiếu | Xóa Phiếu | Xem Báo Cáo | Quản Lý DM | Quản Lý ĐV |
|--------|--------|---------|---------|---------|-----------|----------|---------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Kho** | ✅ | ✅ | ✅ Phiếu của mình | ❌ | ✅ | ❌ | ❌ |
| **KTV** | ✅ | ❌ | Chỉ tình trạng | ❌ | ✅ | ❌ | ❌ |

#### 2. Thông Tin Người Dùng
- Email (bắt buộc, dùng đăng nhập)
- Tên đầy đủ
- Phòng/Bộ phận
- Đơn vị (chỉ xem dữ liệu của đơn vị mình)
- Số điện thoại
- Trạng thái: Kích hoạt / Tắt

#### 3. Authentication & Security
- Đăng nhập: Email + Mật khẩu
- Mật khẩu: Mã hóa bcrypt, tối thiểu 8 ký tự
- JWT Token: Có hiệu lực 24 giờ
- Refresh Token: Có hiệu lực 7 ngày
- Khóa tài khoản sau 5 lần đăng nhập sai (30 phút)
- Đổi mật khẩu bắt buộc lần đầu tiên

---

## 📐 IV. THIẾT KẾ DATABASE (SCHEMA)

### Bảng Chính

```sql
-- 1. Người dùng
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100),
  unit_id INT,
  role ENUM('admin', 'kho', 'ktv') DEFAULT 'kho',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

-- 2. Đơn vị (12 xưởng/chi nhánh)
CREATE TABLE units (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- XNCN-TP01
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- Xưởng, Công ty, Chi nhánh
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Danh mục đồng hồ
CREATE TABLE meters (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- DH-D15-001
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- Tiêu chuẩn, Sửa chữa, Ngoại nhập
  manufacturer VARCHAR(100),
  year_manufacture INT,
  unit_price DECIMAL(15, 2), -- Giá mua
  depreciation_price DECIMAL(15, 2), -- Giá tính khấu hao
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Danh mục vật tư
CREATE TABLE spare_parts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- VP-D15-001
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- Nắp, Gioăng, Chụp, etc
  size VARCHAR(50), -- D15, D20, etc
  unit VARCHAR(20), -- cái, bộ, etc
  unit_price DECIMAL(15, 2),
  min_stock INT, -- Ngưỡng cảnh báo
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Liên kết đồng hồ - vật tư
CREATE TABLE meter_spare_parts (
  id SERIAL PRIMARY KEY,
  meter_id INT NOT NULL,
  spare_part_id INT NOT NULL,
  quantity_per_set INT DEFAULT 1, -- Số vật tư cần cho 1 bộ đồng hồ
  UNIQUE (meter_id, spare_part_id),
  FOREIGN KEY (meter_id) REFERENCES meters(id),
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id)
);

-- 6. Tồn kho theo đơn vị
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  unit_id INT NOT NULL,
  meter_id INT,
  spare_part_id INT,
  quantity INT DEFAULT 0,
  status ENUM('new', 'used', 'repair_needed') DEFAULT 'new',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (unit_id, meter_id, status),
  UNIQUE (unit_id, spare_part_id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (meter_id) REFERENCES meters(id),
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id)
);

-- 7. Phiếu nhập kho
CREATE TABLE import_vouchers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- PNK-2024-001
  voucher_date DATE NOT NULL,
  import_reason ENUM('purchase', 'return', 'transfer') DEFAULT 'purchase',
  unit_id INT NOT NULL,
  created_by INT NOT NULL,
  status ENUM('draft', 'confirmed', 'completed') DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 8. Chi tiết phiếu nhập
CREATE TABLE import_voucher_details (
  id SERIAL PRIMARY KEY,
  import_voucher_id INT NOT NULL,
  meter_id INT,
  spare_part_id INT,
  quantity INT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  status ENUM('new', 'used', 'repair_needed') DEFAULT 'new',
  notes TEXT,
  FOREIGN KEY (import_voucher_id) REFERENCES import_vouchers(id) ON DELETE CASCADE,
  FOREIGN KEY (meter_id) REFERENCES meters(id),
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id)
);

-- 9. Phiếu xuất kho
CREATE TABLE export_vouchers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- PXK-2024-001
  voucher_date DATE NOT NULL,
  export_reason ENUM('sale', 'repair_allocation', 'discard') DEFAULT 'sale',
  unit_id INT NOT NULL,
  created_by INT NOT NULL,
  status ENUM('draft', 'confirmed', 'completed') DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 10. Chi tiết phiếu xuất
CREATE TABLE export_voucher_details (
  id SERIAL PRIMARY KEY,
  export_voucher_id INT NOT NULL,
  meter_id INT,
  spare_part_id INT,
  quantity INT NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  status ENUM('new', 'used', 'repair_needed') DEFAULT 'new',
  fifo_selection BOOLEAN DEFAULT true, -- Sử dụng FIFO?
  notes TEXT,
  FOREIGN KEY (export_voucher_id) REFERENCES export_vouchers(id) ON DELETE CASCADE,
  FOREIGN KEY (meter_id) REFERENCES meters(id),
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id)
);

-- 11. Phiếu chuyển kho
CREATE TABLE transfer_vouchers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL, -- PCK-2024-001
  voucher_date DATE NOT NULL,
  from_unit_id INT NOT NULL,
  to_unit_id INT NOT NULL,
  created_by INT NOT NULL,
  status ENUM('draft', 'in_transit', 'received', 'completed') DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_unit_id) REFERENCES units(id),
  FOREIGN KEY (to_unit_id) REFERENCES units(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 12. Chi tiết phiếu chuyển
CREATE TABLE transfer_voucher_details (
  id SERIAL PRIMARY KEY,
  transfer_voucher_id INT NOT NULL,
  meter_id INT,
  spare_part_id INT,
  quantity INT NOT NULL,
  status ENUM('new', 'used', 'repair_needed') DEFAULT 'new',
  notes TEXT,
  FOREIGN KEY (transfer_voucher_id) REFERENCES transfer_vouchers(id) ON DELETE CASCADE,
  FOREIGN KEY (meter_id) REFERENCES meters(id),
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id)
);

-- 13. Audit Log (Lịch sử chỉnh sửa)
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100), -- 'CREATE', 'UPDATE', 'DELETE'
  table_name VARCHAR(100),
  record_id INT,
  old_value JSON,
  new_value JSON,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 14. Cảnh báo & thông báo
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  unit_id INT,
  alert_type ENUM('low_stock', 'out_of_stock', 'high_damage') DEFAULT 'low_stock',
  meter_id INT,
  spare_part_id INT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (meter_id) REFERENCES meters(id),
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id)
);
```

---

## 🔌 V. API ENDPOINTS (RESTful)

### A. Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/change-password
```

### B. Quản Lý Người Dùng (Admin)
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### C. Quản Lý Đơn Vị (Admin)
```
GET    /api/units
POST   /api/units
GET    /api/units/:id
PUT    /api/units/:id
```

### D. Danh Mục Đồng Hồ & Vật Tư
```
GET    /api/meters
POST   /api/meters
GET    /api/meters/:id
PUT    /api/meters/:id

GET    /api/spare-parts
POST   /api/spare-parts
GET    /api/spare-parts/:id
PUT    /api/spare-parts/:id

GET    /api/meters/:id/spare-parts  -- Vật tư liên kết
```

### E. Tồn Kho
```
GET    /api/inventory
GET    /api/inventory/by-unit/:unitId
GET    /api/inventory/meter/:meterId
GET    /api/inventory/spare-part/:sparePartId
```

### F. Phiếu Nhập Kho
```
GET    /api/import-vouchers
POST   /api/import-vouchers
GET    /api/import-vouchers/:id
PUT    /api/import-vouchers/:id
DELETE /api/import-vouchers/:id
POST   /api/import-vouchers/:id/confirm
POST   /api/import-vouchers/:id/add-detail
DELETE /api/import-vouchers/:id/detail/:detailId
```

### G. Phiếu Xuất Kho
```
GET    /api/export-vouchers
POST   /api/export-vouchers
GET    /api/export-vouchers/:id
PUT    /api/export-vouchers/:id
DELETE /api/export-vouchers/:id
POST   /api/export-vouchers/:id/confirm
POST   /api/export-vouchers/:id/add-detail
DELETE /api/export-vouchers/:id/detail/:detailId
```

### H. Phiếu Chuyển Kho
```
GET    /api/transfer-vouchers
POST   /api/transfer-vouchers
GET    /api/transfer-vouchers/:id
PUT    /api/transfer-vouchers/:id
DELETE /api/transfer-vouchers/:id
POST   /api/transfer-vouchers/:id/confirm
POST   /api/transfer-vouchers/:id/receive
```

### I. Báo Cáo & Thống Kê
```
GET    /api/reports/inventory
GET    /api/reports/inventory-by-unit/:unitId
GET    /api/reports/import-export
GET    /api/reports/transactions
GET    /api/reports/stock-value
POST   /api/reports/export-excel
POST   /api/reports/export-pdf
```

### J. Audit Log
```
GET    /api/audit-logs
GET    /api/audit-logs/:recordId
```

### K. Tìm Kiếm & Lọc
```
GET    /api/search?q=:query
GET    /api/search/meters?q=:query
GET    /api/search/spare-parts?q=:query
```

---

## 🎨 VI. WIREFRAME GIAO DIỆN

### A. Dashboard Chính
```
┌─────────────────────────────────────────────┐
│  WATER METER MANAGEMENT - SOWASUCO          │
│  [Logo]  Dashboard  [User Menu]             │
├──────────┬──────────────────────────────────┤
│ Menu:    │ Welcome, [User]!                  │
│ • Kho    │                                   │
│ • Phiếu  │ ╔═══════════════╗  ╔════════════╗│
│ • Báo Cáo│ ║Tồn kho: 5432  ║  ║Tổng giá trị║
│ • Quản Lý│ ╚═══════════════╝  ║2,500,000 đ ║
│ • Cấu Hình
            │ ╚════════════╝
│           │ 📊 Nhập/Xuất 30 ngày:        │
│           │ [Line Chart]                  │
│           │ ⚠️ Cảnh báo:                  │
│           │ - Đồng hồ D15: Tồn < 50      │
│           │ - VP-D15-003: Hết hàng       │
└──────────┴──────────────────────────────────┘
```

### B. Trang Danh Sách Phiếu Nhập
```
┌────────────────────────────────────────────┐
│ Phiếu Nhập Kho                             │
│ [+ Tạo Phiếu] [Tìm kiếm...] [Lọc] [Xuất]  │
├────────────────────────────────────────────┤
│ Mã Phiếu | Ngày | Đơn Vị | SL | Trạng Thái│
├────────────────────────────────────────────┤
│PNK-24001 |1/9/24|XNCN-TP1|10 |Đã xác nhận │
│PNK-24002 |2/9/24|CNCN-MC |5  |Nháp        │
│...                                         │
└────────────────────────────────────────────┘
```

### C. Form Tạo Phiếu Nhập
```
┌────────────────────────────────────────────┐
│ Tạo Phiếu Nhập Kho                         │
├────────────────────────────────────────────┤
│ Ngày nhập: [2024-09-08]                    │
│ Lý do: [Mua hàng ▼]                        │
│ Đơn vị: [XNCN-TP1 ▼]                       │
│ Ghi chú: [________________]                │
│                                             │
│ ╔ Chi tiết hàng hóa                       ║
│ ║ Sản phẩm | SL | Đơn Vị | Giá | Thành TN║
│ ║ [Đồng hồ D15 ▼] [10] [cái] [50] [500]   ║
│ ║ [Gioăng D15 ▼] [20] [cái] [2]  [40]    ║
│ ╚────────────────────────────────────────║
│ [+ Thêm dòng]  [Lưu]  [Xác nhận]  [Hủy]   │
└────────────────────────────────────────────┘
```

### D. Trang Báo Cáo Tồn Kho
```
┌────────────────────────────────────────────┐
│ Báo Cáo Tồn Kho                            │
│ Khoảng ngày: [từ] [đến]  [Lọc]             │
│ Đơn vị: [Tất cả ▼]  [Xuất Excel] [Xuất PDF]│
├────────────────────────────────────────────┤
│ Sản Phẩm      │ Mới │ Đã Dùng │ Cần Sửa │ SL║
│ Đồng hồ D15   │100  │20       │5        │125
│ Đồng hồ D20   │50   │10       │2        │62 │
│ VP-D15-001    │500  │0        │0        │500
│ ...                                        │
├─ Tồn kho theo đơn vị:                     │
│ XNCN-TP1: 450,  CNCN-MC: 380, ...        │
│                                             │
│ 📊 Biểu đồ tồn kho: [Pie Chart]           │
└────────────────────────────────────────────┘
```

---

## 🛠️ VII. CÔNG NGHỆ & STACK ĐƯỢC KHUYẾN NGHỊ

| Thành Phần | Công Nghệ | Phiên Bản |
|-----------|----------|---------|
| Frontend | React + TypeScript | 18.x |
| Styling | Tailwind CSS | 3.x |
| UI Library | Shadcn/ui | latest |
| State Management | TanStack Query + Zustand | latest |
| Backend | Node.js + Express + TypeScript | 20 LTS |
| ORM | Sequelize | 6.x |
| Database | PostgreSQL (Neon) | 14+ |
| Cache | Redis (Upstash) | latest |
| Job Queue | Bull (BullMQ) | latest |
| Authentication | JWT + Passport.js | latest |
| Logging | Winston | 3.x |
| File Storage | Cloudflare R2 / AWS S3 | - |
| Testing | Jest + Supertest | latest |
| Deployment | Vercel (FE) + Railway (BE) | - |

---

## 📋 VIII. YÊU CẦU KỸ THUẬT NÂNG CAO

### A. Performance
- ⚡ Thời gian tải trang: < 2 giây (3G)
- ⚡ API response: < 500ms (p95)
- ⚡ Báo cáo với 1 năm dữ liệu: < 30 giây

### B. Scalability
- 📈 Hỗ trợ 50+ người dùng đồng thời
- 📈 Cache queries thường xuyên sử dụng (Redis)
- 📈 Database indexing tối ưu

### C. Security
- 🔐 HTTPS bắt buộc
- 🔐 SQL Injection protection (ORM + parameterized queries)
- 🔐 XSS prevention (input sanitization, output encoding)
- 🔐 CSRF tokens cho mọi form
- 🔐 Rate limiting API (100 req/phút/IP)
- 🔐 Audit log tất cả thay đổi
- 🔐 Encrypt sensitive data (mật khẩu, thông tin cá nhân)

### D. Reliability
- 🛡️ Backup database hàng ngày
- 🛡️ Error tracking (Sentry)
- 🛡️ Monitoring & alerting
- 🛡️ Graceful error handling
- 🛡️ Data validation (frontend + backend)

### E. Compliance
- 📋 Tuân thủ định dạng văn thư SOWASUCO
- 📋 Lưu giữ dữ liệu 3 năm (per policy)
- 📋 Audit trail không thể thay đổi

---

## ✅ IX. TIÊU CHÍ THÀNH CÔNG

| Tiêu Chí | Mục Tiêu | Cách Đo |
|---------|---------|--------|
| **Độ chính xác tồn kho** | 100% | So sánh hệ thống vs thực tế |
| **Thời gian phê duyệt phiếu** | < 2 giờ | Thống kê thời gian trung bình |
| **Tốc độ tạo báo cáo** | < 30 giây | Benchmark with 1 năm dữ liệu |
| **Mobile responsiveness** | 100% | Kiểm tra trên 5+ thiết bị |
| **Uptime** | 99.5% | Monitoring 24/7 |
| **User adoption rate** | > 80% | Khảo sát người dùng sau 1 tháng |
| **Support tickets** | < 2/tuần | Theo dõi từ helpdesk |

---

## 🎯 X. ROADMAP PHÁT TRIỂN

### Phase 1 (V1.0 - Core Features) - 8-10 tuần
- ✅ Thiết kế database & API
- ✅ Authentication & Authorization
- ✅ CRUD danh mục (Đồng hồ, Vật tư, Đơn vị, Người dùng)
- ✅ Phiếu nhập/xuất/chuyển kho
- ✅ Quản lý tồn kho
- ✅ Tìm kiếm & lọc
- ✅ Báo cáo tồn kho cơ bản

### Phase 2 (V1.1 - Reports & Analytics) - 4-6 tuần
- 📊 Báo cáo giao dịch chi tiết
- 📊 Biểu đồ phân tích (nhập/xuất, xu hướng)
- 📊 Xuất Excel/PDF
- 📊 Lên lịch báo cáo tự động

### Phase 3 (V1.2 - Advanced) - 4-6 tuần
- 🔧 Kiểm kho & điều chỉnh tồn
- 🔧 Cảnh báo & thông báo (Email/SMS)
- 🔧 Dự báo nhu cầu (simple forecasting)
- 🔧 Tích hợp API với CRM SOWASUCO

### Phase 4 (V1.3 - Mobile) - 3-4 tuần
- 📱 Progressive Web App (PWA)
- 📱 Offline mode
- 📱 Scan barcode (đồng hồ/vật tư)

---

## 📞 XI. YÊU CẦU THÊM THÔNG TIN

Để hoàn thiện thêm spec, cần các thông tin:

1. **Dữ liệu lịch sử:** Có bao nhiêu năm dữ liệu hiện tại (Excel/Database)?
2. **Tích hợp CRM:** CRM SOWASUCO dùng platform nào? (SAP, Odoo, custom?)
3. **Chi phí & Timeline:** Ngân sách bao nhiêu? Deadline launch v1.0 khi?
4. **Email notifications:** Có cần gửi email báo cáo/cảnh báo không?
5. **Multi-language:** Chỉ tiếng Việt hay cần tiếng Anh?

---

**Prompt này đã hoàn chỉnh. Bạn có chấp thuận không? Nếu chưa, cần điều chỉnh gì thêm?**
