const Supplier = require('../models/Supplier');

/**
 * Lấy danh sách nhà cung cấp (Admin)
 */
exports.getAllSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Thêm mới nhà cung cấp (Admin)
 */
exports.createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone, address, leadTimeDays } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp và số điện thoại là bắt buộc.'
      });
    }

    const supplier = await Supplier.create({
      name,
      contactPerson,
      email,
      phone,
      address,
      leadTimeDays: leadTimeDays || 2
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
        message: 'Không tìm thấy nhà cung cấp.'
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
