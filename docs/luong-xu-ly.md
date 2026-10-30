# Sơ đồ luồng xử lý SportZone

Đối chiếu mã nguồn ngày 29/10/2026. Đây là mô tả hành vi hiện có, không phải thiết kế chức năng tương lai. Các sơ đồ dùng Mermaid, có thể xem bằng Markdown Preview hỗ trợ Mermaid.

## 1. Kiến trúc và xử lý yêu cầu

```mermaid
flowchart TD
    Start[Chạy npm start] --> Server[src/server.js: nạp cấu hình]
    Server --> Connect[src/config/db.js: thử kết nối MongoDB]
    Connect --> Listen[Express lắng nghe cổng mặc định 5000]
    Browser[Trình duyệt khách hàng hoặc quản trị viên] --> App[src/app.js]
    Listen -. phục vụ .-> App
    App --> Kind{Loại yêu cầu}
    Kind -->|HTML, CSS, JS, ảnh, dữ liệu địa phương| Static[Thư mục public]
    Static --> Browser
    Kind -->|/api| Routes[src/routes/api.js và route từng module]
    Routes --> Guard{API cần đăng nhập?}
    Guard -->|Không| Controller[Controller kiểm tra và xử lý yêu cầu]
    Guard -->|Có| JWT[Kiểm tra Bearer JWT]
    JWT -->|Sai hoặc hết hạn| E401[Trả 401]
    JWT -->|Hợp lệ| Role{API quản trị?}
    Role -->|Không| Controller
    Role -->|Có| Admin{Role admin?}
    Admin -->|Không| E403[Trả 403]
    Admin -->|Có| Controller
    Controller --> Service[Service đơn hàng / kho nếu cần]
    Controller --> Models[Mongoose models]
    Service --> Models
    Models <--> DB[(MongoDB)]
    Models --> JSON[Trả JSON kết quả]
    JSON --> UI[JavaScript cập nhật giao diện và thông báo]
    Controller -->|Lỗi ngoài dự kiến| Error[Middleware xử lý lỗi toàn cục]
    Error --> JSON
```

Kết nối MongoDB thất bại hiện chỉ ghi log; server vẫn có thể mở cổng. `/api/health` trả thông báo hoạt động nhưng không ping MongoDB. Phần lớn CRUD đi trực tiếp controller → model; chỉ đơn hàng và nghiệp vụ kho có service riêng.

## 2. Đăng ký, đăng nhập và phân quyền

```mermaid
flowchart TD
    Entry[Khách mở trang tài khoản] --> Action{Thao tác}
    Action -->|Đăng ký| Register[POST /api/auth/register]
    Register --> Validate[Kiểm tra tên, email, mật khẩu và email trùng]
    Validate -->|Sai| Fail[Trả lỗi và hiển thị thông báo]
    Validate -->|Đúng| Create[Tạo User customer active]
    Create --> Hash[User pre-save: băm mật khẩu khi bị thay đổi]
    Hash --> Token[Phát JWT và trả thông tin người dùng]
    Action -->|Đăng nhập| Login[POST /api/auth/login]
    Login --> Lookup[Tìm User theo email chuẩn hóa]
    Lookup --> Compare[So sánh mật khẩu bằng bcrypt]
    Compare -->|Sai hoặc không tồn tại| Fail
    Compare -->|Đúng| Blocked{Tài khoản blocked?}
    Blocked -->|Có| Fail
    Blocked -->|Không| Token
    Token --> Storage[Lưu token và thông tin người dùng vào localStorage]
    Storage --> Destination[Chuyển trang theo giao diện và redirect]
    Destination --> Customer[Khu vực khách hàng]
    Destination --> Admin[Khu vực quản trị: xác minh lại /auth/me và role]
    Customer --> Requests[Gửi Authorization Bearer token khi gọi API]
    Admin --> Requests
    Requests --> Backend[Backend kiểm tra JWT và quyền cho từng API]
```

Trang HTML quản trị được phục vụ tĩnh; quyền đọc/ghi dữ liệu được kiểm soát ở API. Đăng xuất phía khách xóa thông tin đăng nhập ở trình duyệt, không có endpoint thu hồi JWT.

## 3. Tìm sản phẩm, yêu thích và giỏ hàng

```mermaid
flowchart TD
    Home[Trang chủ] --> List[Danh sách sản phẩm]
    Home --> API[GET products, categories, brands]
    List --> Filter[Tìm kiếm, lọc danh mục / hãng / giới tính / size / màu / giá]
    Filter --> API
    API --> Result[Hiển thị sản phẩm và phân trang]
    Result --> Detail[Trang chi tiết: GET /products/:id]
    Detail --> Variant[Chọn màu, size và số lượng]
    Result --> Wish[Yêu thích lưu localStorage]
    Detail --> Wish
    Variant --> Add[Thêm giỏ hàng]
    Add --> Auth{Có token?}
    Auth -->|Không| Login[Chuyển đăng nhập]
    Auth -->|Có| CartAPI[POST /api/cart/items]
    CartAPI --> Check[Kiểm tra sản phẩm và số lượng tổng của cùng màu / size]
    Check --> Stock{Tồn kho khả dụng đủ?}
    Stock -->|Không| Reject[Trả lỗi thiếu hàng]
    Stock -->|Có| Save[Gộp dòng có sẵn hoặc thêm dòng mới vào Cart]
    Save --> Cart[Trang giỏ hàng: GET /api/cart]
    Cart --> Update[Đổi số lượng: kiểm tra lại kho rồi lưu]
    Cart --> Remove[Xóa dòng hoặc xóa toàn bộ giỏ]
    Cart --> Coupon[POST /api/promotions/apply]
    Coupon --> Session[Lưu mã khuyến mãi vào sessionStorage]
    Cart --> Checkout[Trang thanh toán]
```

Thêm giỏ hàng chỉ kiểm tra kho, chưa trừ hoặc giữ chỗ hàng. Yêu thích hiện lưu theo trình duyệt, chưa có collection riêng hay đồng bộ giữa thiết bị.

## 4. Đặt hàng và thanh toán

```mermaid
sequenceDiagram
    actor C as Khách hàng
    participant UI as checkout.js
    participant API as order.controller
    participant S as order.service
    participant I as inventory.service
    participant DB as MongoDB
    C->>UI: Nhập địa chỉ, chọn COD hoặc chuyển khoản
    UI->>UI: Kiểm tra thông tin bắt buộc và giỏ hàng
    UI->>API: POST /api/orders kèm JWT và danh sách hàng
    API->>S: createCustomerOrder
    S->>DB: Kiểm tra User và từng Product
    S->>S: Kiểm tra size, màu và xác định giá từ sản phẩm
    loop Mỗi mặt hàng
        S->>I: checkItemAvailability
        I->>DB: Đọc hoặc khởi tạo Inventory từ variant
        DB-->>S: Số lượng khả dụng
    end
    alt Có mặt hàng thiếu kho
        S-->>UI: 400 OUT_OF_STOCK và chi tiết từng mặt hàng
        UI-->>C: Thông báo để điều chỉnh giỏ hàng
    else Đủ hàng
        S->>DB: Kiểm tra mã Promotion và tính giảm giá
        S->>S: Tổng tiền = tiền hàng - giảm giá + phí giao
        loop Mỗi mặt hàng
            S->>I: deductStock
            I->>DB: Giảm Inventory, stock variant, stock Product; tăng totalSold
        end
        S->>DB: Tăng lượt dùng mã nếu áp dụng
        S->>DB: Tạo Order pending, unpaid, in_stock
        S->>DB: Tạo Payment pending
        S->>DB: Tạo Shipment pending
        S->>DB: Xóa các dòng đã mua khỏi Cart
        S-->>UI: 201 và dữ liệu đơn hàng
        UI->>UI: Xóa mã đã áp dụng trong sessionStorage
        UI-->>C: Chuyển trang chi tiết đơn hàng
    end
```

Giá hàng được tính lại ở server. Giao diện hiện gửi phí giao hàng bằng 0. Mã giảm giá không hợp lệ trong service hiện bị bỏ qua thay vì chặn tạo đơn. Chưa có callback ngân hàng, cổng thanh toán hoặc API giao vận.

Các bước trừ kho và tạo Order/Payment/Shipment chạy tuần tự, chưa nằm trong một transaction; sơ đồ thể hiện thứ tự gọi, không hàm ý tất cả thao tác thành công hoặc rollback cùng nhau.

## 5. Quản trị đơn hàng và hoàn kho

```mermaid
flowchart TD
    A[Admin mở danh sách / chi tiết đơn] --> Get[GET /api/admin/orders hoặc /orders/:id]
    Get --> Edit[Chọn trạng thái đơn, thanh toán hoặc xử lý hàng]
    Edit --> Patch[PATCH /api/admin/orders/:id/status]
    Patch --> Validate{Enum hợp lệ và đơn tồn tại?}
    Validate -->|Không| Error[Trả lỗi]
    Validate -->|Có| Branch{Thay đổi trạng thái đơn}
    Branch -->|Sang cancelled từ trạng thái khác| Restore[Cộng trả Inventory và Product]
    Branch -->|Từ cancelled sang hoạt động| Check{Kiểm tra kho tất cả mặt hàng đủ?}
    Check -->|Không| Error
    Check -->|Có| Deduct[Trừ lại kho]
    Branch -->|Các trường hợp khác| Sync[Đồng bộ trạng thái trong Order]
    Restore --> Sync
    Deduct --> Sync
    Sync --> Rules[shipping: fulfillment shipping; completed: delivered; cancelled: cancelled]
    Rules --> Save[Lưu Order, trả kết quả và cập nhật giao diện]
```

Các giá trị trạng thái đơn gồm `pending`, `processing`, `shipping`, `completed`, `cancelled`. Backend kiểm tra enum nhưng chưa bắt buộc đi lần lượt theo chuỗi này. Việc cập nhật `Order.paymentStatus` và `Order.fulfillmentStatus` trong endpoint này chưa đồng bộ sang collection Payment/Shipment.

## 6. Nhà cung cấp, phiếu nhập và tồn kho

```mermaid
flowchart TD
    Admin[Admin] --> Supplier[Quản lý nhà cung cấp]
    Admin --> Inventory[Xem tồn kho theo sản phẩm, size, màu]
    Supplier --> PO[Tạo phiếu nhập: nhà cung cấp, mặt hàng, số lượng, giá nhập]
    Inventory --> PO
    PO --> Create[POST /api/purchase-orders: tạo pending]
    Create --> Status[Admin cập nhật trạng thái phiếu nhập]
    Status --> Received{Trạng thái đích received?}
    Received -->|Không| Save[Lưu trạng thái phiếu]
    Received -->|Có| Already{Trạng thái hiện tại đã received?}
    Already -->|Có| Error[Từ chối xác nhận received lặp trực tiếp]
    Already -->|Không| Replenish[replenishStock cho từng mặt hàng]
    Replenish --> Stock[Cộng Inventory và stock Product / variants]
    Stock --> Date[Ghi receivedAt và lưu received]
    Date --> Shop[Kho mới có thể dùng cho đơn mua sau]
```

`relatedOrder` là liên kết tùy chọn của phiếu nhập. Hiện thiếu hàng khi checkout không tự tạo phiếu nhập và nhận phiếu nhập không tự hoàn tất đơn liên quan. Chống nhập lặp chỉ kiểm tra trạng thái hiện tại; chưa khóa việc đổi ra khỏi received rồi quay lại received.

## 7. Hồ sơ, địa chỉ và mật khẩu

```mermaid
flowchart TD
    Profile[Trang hồ sơ yêu cầu đăng nhập] --> Me[GET /api/auth/me]
    Me --> Result{Tải thành công?}
    Result -->|Không| Retry[Hiện lỗi và nút Thử lại]
    Retry --> Me
    Result -->|Có| Address[Tải public/data/vietnam-addresses.json]
    Address --> Form[Điền tên, điện thoại, địa chỉ đã lưu]
    Form --> City[Chọn tỉnh / thành phố]
    City --> Ward[Lọc phường / xã và xóa lựa chọn cũ khi đổi tỉnh]
    Ward --> Dirty[Bật Lưu thay đổi khi có chỉnh sửa]
    Dirty --> Validate[Kiểm tra họ tên và số điện thoại ở giao diện]
    Validate --> Save[PUT /api/auth/profile]
    Save --> User[Lưu User, cập nhật thông tin trong localStorage]
    User --> Checkout[Checkout đọc địa chỉ mặc định]
    Form --> Password[Nhập mật khẩu hiện tại, mới và xác nhận]
    Password --> Client[Kiểm tra khớp, độ dài, khác mật khẩu cũ]
    Client --> Change[PUT /api/auth/change-password]
    Change --> Compare[Backend so sánh mật khẩu hiện tại]
    Compare --> Hash[User pre-save băm mật khẩu mới rồi lưu]
```

Danh mục địa phương được lưu cục bộ; frontend không gửi thông tin tài khoản tới dịch vụ địa phương. Hồ sơ lưu `address.ward`; checkout hiện đưa tên phường/xã này vào trường `shippingAddress.district` để tương thích cấu trúc đơn hàng đang dùng.

## 8. Đánh giá và các module quản trị khác

```mermaid
flowchart TD
    User[Khách đăng nhập] --> Review[POST /api/products/:id/reviews]
    Review --> Check[Kiểm tra sản phẩm, điểm từ 1 đến 5 và điều kiện đơn đã mua]
    Check --> Duplicate{Đã có review của khách cho sản phẩm?}
    Duplicate -->|Có| Reject[Trả lỗi]
    Duplicate -->|Không| Save[Tạo Review và gắn thông tin người dùng]
    Save --> Public[GET reviews: danh sách, tổng số, điểm trung bình]
    Public --> Product[Chi tiết sản phẩm và đánh giá trên trang chủ]
    Admin[Admin đã xác thực] --> Moderate[Xem / xóa review]
    Moderate --> Save
    Admin --> Catalog[CRUD sản phẩm, danh mục, thương hiệu]
    Admin --> Customers[Xem khách hàng, chi tiết và đổi trạng thái]
    Admin --> Promotion[CRUD khuyến mãi]
    Admin --> Dashboard[GET /api/dashboard/stats]
    Dashboard --> Aggregate[Tổng hợp Order, PurchaseOrder, Product, User, Category]
    Aggregate --> View[Doanh thu, chi phí nhập, tồn kho, sản phẩm bán, đơn gần đây]
```

## 9. Quan hệ dữ liệu chính

```mermaid
erDiagram
    User ||--o| Cart : owns
    Cart ||--o{ CartItem : embeds
    Product ||--o{ CartItem : referenced_by
    User ||--o{ Order : places
    Order ||--|{ OrderItem : embeds
    Product ||--o{ OrderItem : referenced_by
    Order ||--o{ Payment : referenced_by
    Order ||--o{ Shipment : referenced_by
    User ||--o{ Payment : pays
    Brand ||--o{ Product : has
    Category ||--o{ Product : groups
    Product ||--o{ Inventory : stocked_by_size_color
    Product ||--o{ Review : receives
    User ||--o{ Review : writes
    Supplier ||--o{ PurchaseOrder : supplies
    PurchaseOrder ||--|{ PurchaseItem : embeds
    Product ||--o{ PurchaseItem : referenced_by
    User ||--o{ PurchaseOrder : creates
    Order o|--o{ PurchaseOrder : optionally_linked
```

CartItem, OrderItem và PurchaseItem là mảng nhúng, không phải collection độc lập. Quan hệ một giỏ mỗi User dựa trên index unique; Payment/Shipment được tạo một bản ghi mỗi đơn trong service nhưng sơ đồ không giả định ràng buộc unique nếu schema không khai báo. Promotion được ghi lại trong Order bằng chuỗi mã và số tiền giảm, không phải ObjectId.

## 10. Bản đồ mã nguồn

| Khu vực | Tệp / thư mục |
|---|---|
| Khởi động, kết nối dữ liệu | `src/server.js`, `src/app.js`, `src/config/db.js` |
| Định tuyến và phân quyền | `src/routes/`, `src/middlewares/` |
| Xử lý API | `src/controllers/` |
| Nghiệp vụ đặt hàng, kho | `src/services/order.service.js`, `src/services/inventory.service.js` |
| Mô hình dữ liệu | `src/models/` |
| Giao diện khách hàng | `public/*.html`, `public/js/`, `public/css/` |
| Giao diện quản trị | `public/admin/` |
| Dữ liệu địa phương | `public/data/vietnam-addresses.json` |
| Khởi tạo, bảo trì, kiểm thử | `src/utils/` |

Các script seed, cập nhật ảnh/biến thể, dọn dữ liệu và test là công cụ chạy riêng, không nằm trong luồng request người dùng. Tài liệu này được tạo bằng đọc mã nguồn; không chạy seed, cleanup hoặc các bài test ghi dữ liệu khi lập sơ đồ.

Điều kiện đánh giá hiện chỉ cần có đơn chứa sản phẩm với `orderStatus` khác `cancelled`, chưa yêu cầu đơn `completed`. Dashboard gọi tổng tiền của các đơn chưa hủy là doanh thu, chưa giới hạn đơn đã thanh toán hoặc giao thành công.
