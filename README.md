# Quản Lý Kho Đồng Hồ & Vật Tư Sửa Chữa (SOWASUCO WM)
**Công ty Cổ phần Cấp nước Sơn La**

Hệ thống quản lý chu chuyển đồng hồ nước, vật tư linh kiện sửa chữa, theo dõi xuất nhập 12 đơn vị thành viên, tự động phân quyền theo vai trò (Admin, Thủ kho, KTV, Kế toán, Chi nhánh).

---

## 🚀 1. Chạy Dự Án Trên Môi Trường Local

```bash
# 1. Cài đặt thư viện phụ thuộc
npm install

# 2. Sinh Prisma Client
npx prisma generate

# 3. Khởi động môi trường phát triển
npm run dev

# 4. Chạy kiểm thử tự động
npm test

# 5. Build bản sản xuất
npm run build
npm run start
```

---

## ☁️ 2. Triển Khai Lên Cloudflare D1 & Cloudflare Pages

### Bước 1: Tạo Database D1 trên Cloudflare
Chạy lệnh sau để tạo cơ sở dữ liệu trên Cloudflare:
```bash
npx wrangler d1 create xuongdongho-db
```
Sau khi tạo, Wrangler sẽ trả về `database_id` (ví dụ: `xxxx-xxxx-xxxx-xxxx`).

### Bước 2: Cập nhật `wrangler.toml`
Mở tệp `wrangler.toml` và dán `database_id` vừa nhận được vào:
```toml
[[d1_databases]]
binding = "DB"
database_name = "xuongdongho-db"
database_id = "<DÁN_DATABASE_ID_CỦA_BẠN_VÀO_ĐÂY>"
```

### Bước 3: Nạp toàn bộ cấu trúc bảng và dữ liệu vào Cloudflare D1
Tệp SQL đã được khởi tạo sẵn sàng tại `prisma/d1-init.sql`. Bạn chỉ cần chạy lệnh sau để nạp dữ liệu:
```bash
npx wrangler d1 execute xuongdongho-db --file=prisma/d1-init.sql --remote
```

*(Nếu muốn kiểm tra dữ liệu trên D1 qua dòng lệnh)*:
```bash
npx wrangler d1 execute xuongdongho-db --command="SELECT COUNT(*) FROM Unit;" --remote
```

### Bước 4: Xuất lại dữ liệu mới nhất (nếu có thay đổi ở local)
```bash
npm run d1:export
```

---

## 📦 3. Kho Chứa GitHub
- Repository: [https://github.com/phamphuongdong-sla/xuongdongho.git](https://github.com/phamphuongdong-sla/xuongdongho.git)
- Nhánh chính: `main`
