const Brand = require('../models/Brand');

exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
};

exports.createBrand = async (req, res, next) => {
  try {
    const { name, slug, logoUrl } = req.body;
    const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const brand = await Brand.create({ name, slug: autoSlug, logoUrl });
    res.status(201).json({ success: true, message: 'Tạo thương hiệu thành công.', data: brand });
  } catch (error) {
    next(error);
  }
};
