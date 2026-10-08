# 👟 SportZone - Hệ Thống Bán Giày Thể Thao & Quản Trị Tồn Kho JIT

Dự án website thương mại điện tử chuyên biệt cho ngành giày thể thao, giải quyết bài toán kinh tế về **quản lý hàng tồn kho, đọng vốn và tối ưu dòng tiền** thông qua mô hình **Hybrid / Just-In-Time (JIT)**.

---

## 1. Bài Toán Kinh Tế & Mô Hình Kinh Doanh

Trong ngành bán lẻ giày dép, mỗi mẫu giày thường có nhiều biến thể (SKU) theo **Size (38-45)** và **Màu sắc**. Nếu nhập đầy đủ toàn bộ biến thể về kho, cửa hàng sẽ đối mặt với rủi ro:
- **Đọng vốn nghiêm trọng:** Hàng trăm mã SKU lưu kho nhưng tốc độ quay vòng không đều.
- **Chi phí lưu kho cao:** Tốn diện tích và chi phí vận hành.
- **Rủi ro rớt giá / Lỗi mốt:** Giày thể thao thay đổi xu hướng rất nhanh, dẫn đến nguy cơ phải bán lỗ thanh lý.

### Giải pháp mô hình Hybrid JIT của SportZone:
1. **Sản phẩm bán chạy (Fast-moving):** Nhập sẵn một lượng nhỏ an toàn (Safety Stock: 3-5 đôi/size phổ thông 40, 41, 42). Khi khách đặt -> Giao ngay lập tức (`fulfillmentStatus: 'in_stock'`).
2. **Sản phẩm bán chậm hoặc hết kho (Slow-moving / Out of Stock):** Không trữ nhiều hoặc tồn kho = 0. Khi khách đặt -> Hệ thống ghi nhận đơn và đánh dấu `fulfillmentStatus: 'waiting_supplier'`.
3. **Quy trình nhập hàng từ Nhà cung cấp (Suppliers):**
   - Admin kiểm tra danh sách đơn chờ hoặc cảnh báo tồn kho thấp.
   - Admin tạo **Phiếu yêu cầu nhập hàng (Purchase Order - PO)** gửi đến Nhà cung cấp liên kết.
   - Khi Nhà cung cấp giao hàng tới kho, Admin cập nhật trạng thái phiếu sang `received`.
   - Hệ thống **tự động tăng tồn kho** của biến thể tương ứng và chuyển đơn hàng sang trạng thái đóng gói giao cho khách.

---

## 2. Kiến Trúc Kỹ Thuật (Architecture)

- **Frontend:** HTML5, Modern CSS3 (CSS Variables, Flexbox/Grid, Glassmorphism, Dark UI), JavaScript Vanilla (ES6+, Fetch API).
- **Backend:** Node.js + Express.js theo kiến trúc phân tầng (Layered MVC):
  - `Routes`: Định tuyến RESTful endpoints.
  - `Middlewares`: Xác thực JWT, phân quyền RBAC, xử lý lỗi toàn cục.
  - `Controllers`: Tiếp nhận request, điều phối logic nghiệp vụ và tính toán tồn kho.
  - `Models`: Mongoose Schemas với type checking, indexing và relations.
  - `Config`: Kết nối MongoDB, nạp biến môi trường.
- **Database:** MongoDB (hỗ trợ cả Local MongoDB và MongoDB Atlas).
- **Bảo mật:** JWT (JSON Web Token), Bcrypt (Băm mật khẩu 10 salt rounds).

---

## 3. Cấu Trúc Thư Mục Dự Án

```
kthp/
├── .env.example                       # File mẫu biến môi trường
├── .env                               # Cấu hình môi trường nội bộ
├── .gitignore                         # Danh sách file/thư mục Git bỏ qua
├── package.json                       # Khai báo dependencies & npm scripts
├── README.md                          # Tài liệu kiến trúc và hướng dẫn dự án
├── src/                               # Toàn bộ mã nguồn Backend
│   ├── app.js                         # Cấu hình Express app & middlewares
│   ├── server.js                      # Entry point khởi chạy HTTP Server
│   ├── config/
│   │   └── db.js                      # Kết nối MongoDB Mongoose
│   ├── middlewares/
│   │   ├── auth.middleware.js         # Xác thực JWT & phân quyền Admin (RBAC)
│   │   └── error.middleware.js        # Bắt lỗi 404 & Global Error Handler
│   ├── models/                        # Mongoose Schemas & Models
│   │   ├── User.js                    # Khách hàng & Quản trị viên
│   │   ├── Category.js                # Danh mục sản phẩm (Running, Lifestyle...)
│   │   ├── Brand.js                   # Thương hiệu (Nike, Adidas, Puma...)
│   │   ├── Supplier.js                # Nhà cung cấp giày
│   │   ├── Product.js                 # Sản phẩm & các biến thể (SKU, Size, Color, Stock)
│   │   ├── Order.js                   # Đơn đặt hàng của khách (In-stock vs Backorder)
│   │   └── PurchaseOrder.js           # Phiếu yêu cầu nhập hàng từ NCC
│   ├── controllers/                   # Xử lý nghiệp vụ Backend
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── category.controller.js
│   │   ├── brand.controller.js
│   │   ├── order.controller.js
│   │   ├── supplier.controller.js
│   │   ├── purchaseOrder.controller.js
│   │   └── dashboard.controller.js
│   └── routes/                        # Khai báo các đường dẫn API
│       ├── api.js                     # Root router tổng hợp
│       ├── auth.routes.js
│       ├── product.routes.js
│       ├── category.routes.js
│       ├── brand.routes.js
│       ├── order.routes.js
│       ├── supplier.routes.js
│       ├── purchaseOrder.routes.js
│       └── dashboard.routes.js
└── public/                            # Mã nguồn Frontend (Client)
    ├── index.html                     # Giao diện chính Storefront (Khách hàng)
    ├── admin/
    │   └── index.html                 # Giao diện Quản trị viên (Admin Dashboard)
    ├── css/
    │   ├── style.css                  # Core Design System, Variables & Utilities
    │   ├── client.css                 # Style trang người dùng mua sắm
    │   └── admin.css                  # Style bảng điều khiển quản trị
    └── js/
        ├── api.js                     # Wrapper Fetch API hỗ trợ đính kèm JWT
        ├── app.js                     # Script Storefront kiểm tra kết nối API
        └── admin.js                   # Script Admin Dashboard tải số liệu KPI
```

---

## 4. Thiết Kế Cơ Sở Dữ Liệu MongoDB

### Các Collections chính:
1. **`users`**: Quản lý tài khoản khách hàng và admin (phân biệt bằng `role: 'customer' | 'admin'`), mật khẩu băm bcrypt.
2. **`categories`**: Danh mục giày (`Running`, `Basketball`, `Lifestyle`...).
3. **`brands`**: Thương hiệu (`Nike`, `Adidas`, `Puma`, `New Balance`...).
4. **`suppliers`**: Nhà cung cấp phục vụ nhập hàng (`name`, `phone`, `leadTimeDays`...).
5. **`products`**: Sản phẩm gốc kèm mảng `variants` được nhúng trực tiếp (Embedded Schema):
   - Mỗi variant chứa: `sku`, `color`, `size`, `stockQuantity`, `lowStockThreshold`, `price`, `importPrice`.
   - Cờ `isFastMoving`: Đánh dấu mặt hàng bán chạy cần giữ tồn an toàn.
6. **`orders`**: Đơn hàng của khách:
   - Chứa danh sách `items` kèm cờ `isBackorder: true/false`.
   - `fulfillmentStatus`: `'in_stock' | 'waiting_supplier' | 'imported' | 'packing' | 'shipping' | 'delivered' | 'cancelled'`.
7. **`purchase_orders`**: Phiếu nhập hàng từ nhà cung cấp:
   - `poCode`, `supplierId`, `relatedOrderId` (liên kết đơn khách nếu nhập để trả đơn).
   - Danh sách mặt hàng, số lượng và giá nhập.
   - `status`: `'pending' | 'sent_to_supplier' | 'supplier_confirmed' | 'in_transit' | 'received' | 'cancelled'`.
   - Khi chuyển sang `'received'`, hệ thống tự động cộng dồn `stockQuantity` vào biến thể trong bảng `products`.

---

## 5. Danh Sách RESTful API

| Phương thức | Đường dẫn | Phân quyền | Chức năng |
|---|---|---|---|
| `GET` | `/api/health` | Public | Kiểm tra tình trạng server |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản khách hàng |
| `POST` | `/api/auth/login` | Public | Đăng nhập nhận JWT Token |
| `GET` | `/api/auth/profile` | Logged In | Lấy thông tin cá nhân |
| `GET` | `/api/products` | Public | Lấy danh sách sản phẩm (hỗ trợ lọc size, màu, giá, danh mục...) |
| `GET` | `/api/products/:id` | Public | Chi tiết sản phẩm & biến thể |
| `POST` | `/api/products` | Admin | Thêm sản phẩm mới |
| `PUT` | `/api/products/:id` | Admin | Cập nhật thông tin & biến thể sản phẩm |
| `GET` | `/api/categories` | Public | Lấy danh mục sản phẩm |
| `POST` | `/api/categories` | Admin | Tạo danh mục |
| `GET` | `/api/brands` | Public | Lấy danh sách thương hiệu |
| `POST` | `/api/brands` | Admin | Thêm thương hiệu |
| `POST` | `/api/orders` | Customer | Đặt hàng (tự động kiểm tra tồn kho & phân loại fulfillment) |
| `GET` | `/api/orders/my-orders` | Customer | Xem lịch sử đơn hàng của tôi |
| `GET` | `/api/orders/:id` | Customer / Admin | Xem chi tiết một đơn hàng |
| `GET` | `/api/orders` | Admin | Xem toàn bộ đơn hàng (lọc theo trạng thái JIT) |
| `PATCH`| `/api/orders/:id/status`| Admin | Cập nhật tiến độ xử lý đơn hàng |
| `GET` | `/api/suppliers` | Admin | Danh sách nhà cung cấp |
| `POST` | `/api/suppliers` | Admin | Thêm nhà cung cấp mới |
| `GET` | `/api/purchase-orders` | Admin | Danh sách phiếu nhập hàng JIT |
| `POST` | `/api/purchase-orders` | Admin | Tạo phiếu yêu cầu nhập hàng từ NCC |
| `PATCH`| `/api/purchase-orders/:id/status` | Admin | Cập nhật trạng thái phiếu nhập (nhập kho tự tăng tồn) |
| `GET` | `/api/dashboard/stats` | Admin | Thống kê doanh thu, chi phí nhập, lãi gộp & cảnh báo tồn |

---

## 6. Phân Quyền Người Dùng (RBAC)

- **JWT Token:** Được cấp khi đăng nhập, chứa payload `{ id, role }`.
- **`verifyToken`:** Middleware kiểm tra token trong header `Authorization: Bearer <token>`.
- **`requireAdmin`:** Middleware bảo vệ tất cả endpoint quản trị, từ chối với mã lỗi `403 Forbidden` nếu `role !== 'admin'`.

---

## 7. Phân Chia Công Việc Nhóm 3 Người Trên GitHub

### Quy tắc làm việc trên Git / GitHub:
1. Nhánh `main`: Chỉ chứa mã nguồn ổn định, đã kiểm thử. Không commit trực tiếp vào `main`.
2. Nhánh `develop`: Nhánh tích hợp chung của cả nhóm.
3. Nhánh tính năng `feature/<ten-tinh-nang>`: Từng thành viên tạo nhánh riêng từ `develop`, sau khi hoàn thành tạo **Pull Request (PR)** để các thành viên còn lại review trước khi merge vào `develop`.

### Phân công trách nhiệm 3 thành viên:

| Thành viên | Vai trò | Trách nhiệm chính | Các nhánh Git phụ trách |
|---|---|---|---|
| **Thành viên 1** (Team Lead / Backend Core) | Quản trị CSDL & Nghiệp vụ Tồn kho JIT | - Quản trị MongoDB, cấu hình Express, bảo mật Auth JWT & bcrypt.<br>- Module Nhà cung cấp (`suppliers`) & Phiếu nhập hàng (`purchase-orders`).<br>- Logic tự động kiểm tra tồn kho khi đặt hàng và tự động cộng dồn tồn kho khi nhập hàng.<br>- API Dashboard thống kê tài chính (Doanh thu, chi phí nhập, lãi gộp). | `feature/auth-jwt`<br>`feature/inventory-engine`<br>`feature/purchase-orders`<br>`feature/dashboard-analytics` |
| **Thành viên 2** (Full-Stack / Storefront Specialist) | Quản lý Danh mục & Trải nghiệm Mua sắm của Khách | - Module Sản phẩm (`products`), Danh mục (`categories`), Thương hiệu (`brands`).<br>- Bộ lọc sản phẩm (lọc theo size, màu, khoảng giá, brand).<br>- Giao diện Storefront cho khách hàng (Trang chủ, chi tiết sản phẩm chọn size/màu, giỏ hàng, đặt hàng, theo dõi đơn hàng).<br>- Tích hợp API tạo đơn hàng và lịch sử mua hàng. | `feature/product-catalog`<br>`feature/filter-search`<br>`feature/shopping-cart`<br>`feature/customer-orders` |
| **Thành viên 3** (Frontend / Admin Specialist) | Thiết kế Giao diện Quản trị & UI/UX | - Xây dựng hoàn chỉnh giao diện Admin Dashboard.<br>- Màn hình Quản lý kho: Danh sách cảnh báo hàng sắp hết, tạo nhanh phiếu nhập PO gửi NCC.<br>- Màn hình Quản lý đơn hàng: Phân loại đơn có sẵn hàng vs đơn chờ nhập từ NCC.<br>- Màn hình Quản lý nhà cung cấp & theo dõi tiến độ giao hàng của NCC.<br>- Đồng bộ CSS Design System, hiệu ứng tương tác, tính tương thích responsive. | `feature/admin-ui-layout`<br>`feature/admin-inventory-ui`<br>`feature/admin-orders-ui`<br>`feature/admin-suppliers-ui` |

---

## 8. Hướng Dẫn Chạy Dự Án Hiện Tại

### Bước 1: Kiểm tra môi trường
- Đảm bảo đã cài đặt **Node.js** (khuyến nghị phiên bản 18+ hoặc 20+).
- Cần có dịch vụ **MongoDB** (Local MongoDB Server hoặc MongoDB Atlas connection string).

### Bước 2: Cài đặt thư viện
```powershell
npm install
```

### Bước 3: Cấu hình biến môi trường
File `.env` đã được tạo sẵn trong thư mục gốc. Nếu sử dụng MongoDB Atlas, hãy mở file `.env` và thay đổi:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sport_shoes_db?retryWrites=true&w=majority
JWT_SECRET=sport_shoes_secret_key_development_2026_xyz
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Bước 4: Khởi chạy Server
Chế độ thông thường:
```powershell
npm start
```

Hoặc chế độ phát triển tự động reload (nodemon):
```powershell
npm run dev
```

### Bước 5: Truy cập hệ thống
- **Giao diện Storefront (Khách hàng):** [http://localhost:5000](http://localhost:5000)
- **Giao diện Quản trị viên (Admin Portal):** [http://localhost:5000/admin](http://localhost:5000/admin)
- **Kiểm tra trạng thái REST API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
