# Original User Request

## Initial Request — 2026-09-08T09:00:15Z

Webapp Quản lý Kho Đồng hồ & Vật tư Linh kiện Sửa chữa (SOWASUCO WM) cho xưởng sửa chữa và 12 đơn vị trực thuộc, phát triển bằng Next.js (App Router, Tailwind CSS, SQLite/Prisma) dựa trên dữ liệu 2 file Excel và file đặc tả hệ thống có sẵn.

Working directory: /Users/mrdong/Downloads/QuanLyKho
Integrity mode: development

## Requirements

### R1. Quản lý Xưởng Đồng hồ & Quản lý Linh kiện Vật tư theo Hợp đồng
- Quản lý việc nhập vật tư linh kiện theo các Hợp đồng mua sắm qua nhiều đợt khác nhau trong năm do Công ty cấp.
- Quản lý xuất kho vật tư linh kiện đã dùng để sửa chữa đồng hồ (báo xuất theo phiếu sửa chữa/loại đồng hồ), tự động tính toán trừ tồn kho linh kiện.
- Ghi nhận nhập kho xưởng đồng hồ đã sửa chữa hoàn tất (chuyển trạng thái sang đồng hồ sẵn sàng cấp phát/quay vòng).

### R2. Quản lý Luân chuyển Đồng hồ giữa Kho/Xưởng và 12 Đơn vị Trực thuộc
- Quản lý nghiệp vụ xuất/nhập đồng hồ mới (100%) và đồng hồ xưởng sửa chữa cho 12 đơn vị trực thuộc (TP1, TP2, Mai Sơn, Mộc Châu, Yên Châu, Bắc Yên, Thuận Châu, Phù Yên, Mường La, Sông Mã, Sốp Cộp, Quỳnh Nhai).
- Quản lý tiếp nhận đồng hồ từ 12 đơn vị gửi về xưởng để sửa chữa hoặc kiểm định (phân loại: Đạt / Không đạt / Cần sửa).
- Theo dõi tồn kho thời gian thực theo từng đơn vị, phân định rõ trạng thái: Mới, Quay vòng (đã sửa), Gửi về sửa, Hỏng/chờ thanh lý.

### R3. Báo cáo Thống kê & Đối soát Nhập - Xuất - Tồn (Đồng hồ & Vật tư)
- Tổng hợp báo cáo Nhập - Xuất - Tồn theo tháng/quý/năm bám sát mẫu biểu và cấu trúc của 2 file Excel (`Nhập Xuất ĐH 2026.xlsx` và `Nhập xuất vật tư sửa chữa 2026.xlsx`).
- Báo cáo tồn kho chi tiết theo từng đơn vị và tồn kho hợp nhất toàn công ty.
- Báo cáo chi tiết sử dụng linh kiện theo từng đợt hợp đồng và từng loại đồng hồ sửa chữa.
- Tính năng xuất dữ liệu ra file Excel (.xlsx) chuẩn định dạng.

### R4. Kiến trúc Hệ thống & Khởi tạo Dữ liệu
- Xây dựng ứng dụng Full-stack Next.js (App Router, Tailwind CSS, TypeScript, SQLite với Prisma ORM).
- Có script phân tích và tự động import dữ liệu danh mục (Đồng hồ, Vật tư, 12 Đơn vị) và dữ liệu tồn kho ban đầu từ 2 file Excel (`Nhập Xuất ĐH 2026.xlsx`, `Nhập xuất vật tư sửa chữa 2026.xlsx`) vào cơ sở dữ liệu SQLite.
- Giao diện thân thiện, hiện đại, hỗ trợ thao tác nhanh cho thủ kho và kỹ thuật viên.

## Acceptance Criteria

### 1. Khởi tạo & Dữ liệu
- [ ] Dự án Next.js khởi tạo thành công trong thư mục làm việc, cài đặt đầy đủ dependencies và lệnh `npm run build` hoàn thành không lỗi.
- [ ] Database SQLite được cấu hình qua Prisma với schema đầy đủ bảng: meters, spare_parts, contracts, units, inventory, import/export vouchers và chi tiết phiếu.
- [ ] Script import (`npm run seed` hoặc script tương đương) chạy thành công, nạp toàn bộ danh mục 12 đơn vị, danh mục đồng hồ, danh mục linh kiện và số liệu ban đầu từ 2 file Excel vào database.

### 2. Nghiệp vụ Xưởng & Linh kiện (Workflow 1)
- [ ] Có giao diện và tính năng tạo/quản lý đợt nhập linh kiện theo hợp đồng mua sắm (hỗ trợ nhập theo nhiều đợt).
- [ ] Có giao diện tạo phiếu sửa chữa: ghi nhận xuất linh kiện sửa chữa và trừ tồn kho linh kiện tương ứng.
- [ ] Ghi nhận nhập kho xưởng đồng hồ sau khi sửa xong, tăng tồn kho đồng hồ quay vòng.

### 3. Nghiệp vụ 12 Đơn vị Trực thuộc (Workflow 2)
- [ ] Có giao diện tạo phiếu xuất/nhập đồng hồ phân định rõ: đồng hồ mới và đồng hồ xưởng sửa gửi cho 12 đơn vị.
- [ ] Có giao diện tiếp nhận đồng hồ từ đơn vị gửi về xưởng (ghi nhận trạng thái kiểm tra/kiểm định).
- [ ] Xem tồn kho tức thời của từng đơn vị trực thuộc với bộ lọc theo loại đồng hồ và tình trạng.

### 4. Báo cáo & Xuất Excel
- [ ] Trang Báo cáo hiển thị bảng tổng hợp Nhập - Xuất - Tồn đồng hồ theo từng tháng/năm giống sheet Báo cáo trong Excel.
- [ ] Trang Báo cáo hiển thị bảng tổng hợp Nhập - Sử dụng vật tư linh kiện theo từng tháng bám sát sheet Vật tư.
- [ ] Có nút xuất file Excel (.xlsx) cho báo cáo tồn kho và báo cáo xuất nhập.

### 5. Kiểm thử Tự động (Verification)
- [ ] Có bộ kiểm thử tự động (test script) kiểm tra tính đúng đắn của logic tính toán tồn kho: `Tồn cuối = Tồn đầu + Tổng Nhập - Tổng Xuất`.
- [ ] Test script xác minh việc xuất kho linh kiện không được vượt quá số lượng tồn thực tế.

## Follow-up — 2026-09-09T07:48:29Z

Xây dựng phân hệ Đăng nhập, Đăng xuất, Quản lý phiên làm việc (Session/Cookie) và Phân quyền kiểm soát truy cập (Role-based access control) cho Hệ thống Quản lý Kho Đồng hồ & Vật tư SOWASUCO WM.

Working directory: /Users/mrdong/Downloads/QuanLyKho
Integrity mode: development

## Requirements

### R1. Trang Đăng Nhập & Cơ Chế Đăng Xuất (Authentication)
- Xây dựng trang đăng nhập `/login` hiện đại, chuyên nghiệp, mang nhận diện thương hiệu SOWASUCO.
- Hỗ trợ đăng nhập bằng Email và Mật khẩu (đã có sẵn trong database SQLite/Prisma).
- Hỗ trợ nút Đăng nhập nhanh theo vai trò demo (1-click login) để tiện kiểm thử ngay: Admin (Phạm Phương Đông), Thủ kho (Nguyễn Văn Kho), Kỹ thuật viên (Trần Kỹ Thuật), Lãnh đạo/Kế toán, Cán bộ Chi nhánh.
- Lưu phiên làm việc bảo mật qua Cookie/Session HTTP-only (sử dụng Server Actions hoặc cookies() của Next.js).
- Nút Đăng Xuất trên thanh Topbar (Navigation), hiển thị rõ tên cán bộ, vai trò và đơn vị đang đăng nhập. Khi bấm Đăng xuất, xóa phiên và chuyển hướng về trang `/login`.

### R2. Kiểm Soát Truy Cập & Phân Quyền Theo Vai Trò (Authorization & Guards)
- Middleware hoặc Server Auth Guard kiểm tra trạng thái đăng nhập: nếu chưa đăng nhập, tự động chuyển hướng về `/login` (ngoại trừ route `/login` và static assets).
- Ẩn/hiện các chức năng trên giao diện tương ứng theo vai trò:
  - Admin: Xem toàn bộ menu bao gồm `/admin/users`.
  - Thủ kho: Nhập kho theo Hợp đồng, Xuất đồng hồ 12 Đơn vị, xem Báo cáo.
  - Kỹ thuật viên: Nhập kho (ĐH Sửa Chữa), xuất dùng linh kiện sửa chữa.
  - Kế toán / Lãnh đạo: Xem Báo cáo, xem & in ấn phiếu, không có nút thêm/sửa/xóa kho thực tế.
  - Cán bộ 12 Chi nhánh: Xem danh sách cấp phát và tồn kho đơn vị của mình.

### R3. Bộ Chuyển Đổi Nhanh Tài Khoản (User Role Switcher)
- Hỗ trợ dropdown trên thanh Header cho phép chuyển đổi nhanh qua lại giữa các vai trò cán bộ (để phục vụ kiểm thử, demo, hoặc quyền ủy thác công việc của Admin) mà không cần nhập lại mật khẩu.

## Acceptance Criteria

### 1. Đăng nhập & Đăng xuất
- [ ] Truy cập hệ thống khi chưa đăng nhập sẽ chuyển hướng đến `/login`.
- [ ] Đăng nhập thành công lưu cookie session và chuyển hướng về trang `/`.
- [ ] Bấm nút Đăng xuất trên thanh Navigation sẽ xóa cookie session và quay về `/login`.
- [ ] Có nút chọn nhanh tài khoản demo trên trang đăng nhập.

### 2. Phân quyền hiển thị
- [ ] Menu Navigation thay đổi linh hoạt theo vai trò của người đang đăng nhập.
- [ ] Trang Quản trị `/admin/users` chỉ cho phép vai trò admin truy cập.
- [ ] Các thao tác xóa phiếu / hoàn tác chỉ cho phép vai trò có thẩm quyền.

### 3. Kiểm thử & Độ ổn định
- [ ] Lệnh `npm run build` biên dịch thành công 100% không có lỗi TypeScript hay Next.js.
- [ ] Toàn bộ bộ test hiện tại (`npm test`) vẫn chạy pass 100%.
