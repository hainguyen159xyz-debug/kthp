require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');

async function seedCustomerReviews() {
  try {
    console.log('[Seed Reviews] Đang kết nối tới MongoDB Atlas...');
    await connectDB();

    // 1. Dọn dẹp các review bị mồ côi (product là null hoặc không còn tồn tại)
    console.log('[Seed Reviews] Dọn dẹp các đánh giá mồ côi...');
    const allReviews = await Review.find();
    for (const rev of allReviews) {
      if (!rev.product) {
        await Review.findByIdAndDelete(rev._id);
      } else {
        const prodExists = await Product.exists({ _id: rev.product });
        if (!prodExists) {
          await Review.findByIdAndDelete(rev._id);
        }
      }
    }

    // 2. Khởi tạo danh sách khách hàng chân thật
    console.log('[Seed Reviews] Khởi tạo tài khoản khách hàng đánh giá...');
    const customerProfiles = [
      { name: 'Trần Minh Quân', fullName: 'Trần Minh Quân', email: 'quan.tran@sportzone.vn', phone: '0912345001' },
      { name: 'Lê Thanh Thảo', fullName: 'Lê Thanh Thảo', email: 'thao.le@sportzone.vn', phone: '0912345002' },
      { name: 'Phạm Hải Đăng', fullName: 'Phạm Hải Đăng', email: 'dang.pham@sportzone.vn', phone: '0912345003' },
      { name: 'Vũ Tuấn Kiệt', fullName: 'Vũ Tuấn Kiệt', email: 'kiet.vu@sportzone.vn', phone: '0912345004' },
      { name: 'Đỗ Ngọc Bích', fullName: 'Đỗ Ngọc Bích', email: 'bich.do@sportzone.vn', phone: '0912345005' },
      { name: 'Hoàng Gia Bảo', fullName: 'Hoàng Gia Bảo', email: 'bao.hoang@sportzone.vn', phone: '0912345006' },
      { name: 'Nguyễn Quỳnh Anh', fullName: 'Nguyễn Quỳnh Anh', email: 'quynhanh.nguyen@sportzone.vn', phone: '0912345007' },
      { name: 'Đặng Nhật Nam', fullName: 'Đặng Nhật Nam', email: 'nam.dang@sportzone.vn', phone: '0912345008' }
    ];

    const customerDocs = [];
    for (const p of customerProfiles) {
      let u = await User.findOne({ email: p.email });
      if (!u) {
        u = await User.create({
          name: p.name,
          fullName: p.fullName,
          email: p.email,
          password: 'Customer123456',
          phone: p.phone,
          address: { street: 'Phố Thể Thao', city: 'Hà Nội' },
          role: 'customer',
          status: 'active'
        });
      }
      customerDocs.push(u);
    }

    // 3. Lấy toàn bộ sản phẩm đang hoạt động
    const products = await Product.find({ status: 'active' });
    console.log(`[Seed Reviews] Tìm thấy ${products.length} sản phẩm đang hoạt động.`);

    // 4. Mẫu nội dung đánh giá chân thật đa dạng theo phong cách thể thao
    const reviewTemplates = [
      {
        rating: 5,
        title: 'Đệm giày cực kỳ êm ái, bảo vệ khớp gối và gót chân xuất sắc',
        comment: (pName) => `Mình mua ${pName} để tập luyện và đi hàng ngày. Cảm giác tiếp đất êm ái vượt trội, phản hồi lực tốt, đi cả ngày không hề đau mỏi gót. Form ôm chân chắc chắn, đường keo mũi chỉ sắc nét đúng chuẩn chính hãng.`,
        tags: ['Độ vừa vặn: Chuẩn size', 'Đệm nảy êm ái', 'Rất hài lòng'],
        helpful: 28,
        shopReply: 'SportZone trân trọng cảm ơn bạn đã tin tưởng ủng hộ sản phẩm chính hãng! Chúc bạn luôn tràn đầy năng lượng trên từng bước chạy ạ!'
      },
      {
        rating: 5,
        title: 'Màu sắc bên ngoài đẹp hơn cả trong hình, phối đồ cực kỳ ưng ý',
        comment: (pName) => `Đôi ${pName} nhận được đóng gói 2 lớp hộp rất cẩn thận, không móp méo chút nào. Chất liệu thoáng khí, mang vào mùa hè chân không bị bí mùi. Đi làm hay đi cà phê cuối tuần đều rất cá tính.`,
        tags: ['Chuẩn form dáng', 'Đóng gói cẩn thận', 'Thoáng khí'],
        helpful: 19,
        shopReply: 'Cảm ơn bạn đã yêu thích phối màu này ạ! Chúc bạn luôn tự tin và phong cách cùng SportZone!'
      },
      {
        rating: 5,
        title: 'Đế cao su bám sân rất chắc, di chuyển linh hoạt và an toàn',
        comment: (pName) => `Đã test thực tế ${pName} trên nhiều bề mặt sân khác nhau, độ bám rất tốt, không lo trơn trượt khi chuyển hướng đột ngột. Trọng lượng nhẹ giúp bước chân thanh thoát hơn hẳn.`,
        tags: ['Bám sân xuất sắc', 'Trọng lượng nhẹ', 'Chính hãng 100%'],
        helpful: 23,
        shopReply: 'Cảm ơn đánh giá chi tiết và hữu ích của bạn! SportZone luôn nỗ lực đem lại sản phẩm chất lượng tốt nhất.'
      },
      {
        rating: 4,
        title: 'Chất lượng gia công sắc sảo, chân bè nên cân nhắc nhích 0.5 size',
        comment: (pName) => `Thiết kế ${pName} rất thể thao, chất liệu cao cấp. Bàn chân mình hơi bè nên ngày đầu đi ôm sát mu bàn chân một chút, sau 2 ngày giày giãn ra theo form thì đi êm ru. Bạn nào chân to ngang nên lấy nhỉnh hơn nửa size nhé.`,
        tags: ['Khuyên tăng 0.5 size cho chân bè', 'Form thể thao', 'Chất liệu cao cấp'],
        helpful: 35,
        shopReply: 'SportZone cảm ơn chia sẻ kinh nghiệm chọn size rất hữu ích của bạn đến cộng đồng yêu giày ạ!'
      },
      {
        rating: 5,
        title: 'Giao hàng hỏa tốc, tem mác thẻ bảo hành chính hãng đầy đủ',
        comment: (pName) => `Đặt buổi sáng mà đầu giờ chiều đã nhận được giày. Quét mã QR ra đúng trang web của hãng, tem phân phối rõ ràng. Nhân viên tư vấn chọn size rất chuẩn xác và nhiệt tình. Sẽ tiếp tục ủng hộ shop!`,
        tags: ['Giao hàng siêu tốc', 'Tư vấn nhiệt tình', 'Đầy đủ phụ kiện'],
        helpful: 16,
        shopReply: 'SportZone vô cùng hạnh phúc khi nhận được phản hồi tốt từ bạn! Rất mong được phục vụ bạn ở các đơn hàng tiếp theo ạ!'
      },
      {
        rating: 5,
        title: 'Độ bền ấn tượng, sau hơn 2 tháng sử dụng đệm vẫn giữ nguyên độ nảy',
        comment: (pName) => `Mình đi cày cuốc liên tục hơn 2 tháng nay, đế cao su mòn rất ít, đệm không bị xẹp lún. Cầm trên tay thấy đầm chắc, từng đường may tỉ mỉ. Xứng đáng từng đồng bỏ ra.`,
        tags: ['Độ bền cao', 'Đáng giá tiền', 'Sau 2 tháng sử dụng'],
        helpful: 21,
        shopReply: 'Cảm ơn bạn đã kiểm chứng độ bền thực tế của sản phẩm! Chúc bạn có thêm thật nhiều trải nghiệm tuyệt vời cùng đôi giày này nhé!'
      }
    ];

    let totalCreated = 0;

    for (const prod of products) {
      // Chọn 3-5 đánh giá cho mỗi sản phẩm từ các khách hàng khác nhau
      const reviewCountForProd = Math.floor(Math.random() * 3) + 3; // 3 đến 5 reviews
      const shuffledCustomers = [...customerDocs].sort(() => 0.5 - Math.random());

      for (let i = 0; i < reviewCountForProd; i++) {
        const customer = shuffledCustomers[i];
        if (!customer) continue;

        // Kiểm tra xem đã có review giữa user và product chưa
        const exists = await Review.findOne({ product: prod._id, user: customer._id });
        if (exists) continue;

        const tmpl = reviewTemplates[i % reviewTemplates.length];
        const chosenSize = (prod.sizes && prod.sizes.length > 0) ? prod.sizes[i % prod.sizes.length] : 41;
        const chosenColor = (prod.colors && prod.colors.length > 0) ? prod.colors[i % prod.colors.length] : 'Tiêu chuẩn';

        // Tạo bản ghi Order để đảm bảo tính hợp lệ logic nghiệp vụ (khách đã mua hàng)
        await Order.create({
          orderCode: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          user: customer._id,
          customer: customer._id,
          items: [
            {
              product: prod._id,
              productName: prod.name,
              price: prod.salePrice,
              quantity: 1,
              size: chosenSize,
              color: chosenColor,
              subtotal: prod.salePrice
            }
          ],
          totalAmount: prod.salePrice,
          paymentMethod: 'COD',
          paymentStatus: 'paid',
          orderStatus: 'completed',
          status: 'completed',
          shippingAddress: {
            fullName: customer.fullName,
            phone: customer.phone,
            street: '123 Hoàng Cầu',
            city: 'Hà Nội'
          }
        });

        // Tạo review
        const createdDate = new Date(Date.now() - (i * 3 + Math.floor(Math.random() * 5) + 1) * 24 * 60 * 60 * 1000);

        await Review.create({
          product: prod._id,
          user: customer._id,
          rating: tmpl.rating,
          title: tmpl.title,
          comment: tmpl.comment(prod.name),
          variant: `Phân loại: Size ${chosenSize} | Màu ${chosenColor}`,
          tags: tmpl.tags,
          helpful: tmpl.helpful + Math.floor(Math.random() * 5),
          shopReply: tmpl.shopReply,
          createdAt: createdDate,
          updatedAt: createdDate
        });

        totalCreated++;
      }
    }

    console.log(`[Seed Reviews] Hoàn tất! Đã tạo thêm ${totalCreated} đánh giá sản phẩm thành công.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Reviews Error]:', err);
    process.exit(1);
  }
}

seedCustomerReviews();
