const Supplier = require('../models/Supplier');
const { isValidObjectId } = require('../validators/validate');

/**
 * Lấy danh sách nhà cung cấp (Admin)
 * GET /api/suppliers
 */
exports.getAllSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find()
      .populate('products', 'name slug salePrice')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết nhà cung cấp theo ID (Admin)
 * GET /api/suppliers/:id
 */
exports.getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID nhà cung cấp không hợp lệ.',
        errors: ['Invalid ObjectId']
      });
    }

    const supplier = await Supplier.findById(id).populate('products', 'name slug salePrice');
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp.',
        errors: ['Nhà cung cấp không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Thêm mới nhà cung cấp (Admin)
 * POST /api/suppliers
 */
exports.createSupplier = async (req, res, next) => {
  try {
    const { name, contactName, contactPerson, email, phone, address, leadTimeDays, products, status } =
      req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp và số điện thoại là bắt buộc.',
        errors: ['Thiếu tên hoặc số điện thoại']
      });
    }

    const supplier = await Supplier.create({
      name,
      contactName: contactName || contactPerson || '',
      contactPerson: contactPerson || contactName || '',
      email: email || '',
      phone,
      address: address || '',
      leadTimeDays: Number(leadTimeDays) || 2,
      products: products || [],
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Thêm nhà cung cấp thành công.',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật thông tin nhà cung cấp (Admin)
 * PUT /api/suppliers/:id
 */
exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp.',
        errors: ['Nhà cung cấp không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật nhà cung cấp thành công.',
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa nhà cung cấp (Admin)
 * DELETE /api/suppliers/:id
 */
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp để xóa.',
        errors: ['Nhà cung cấp không tồn tại']
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa nhà cung cấp thành công.'
    });
  } catch (error) {
    next(error);
  }
};
