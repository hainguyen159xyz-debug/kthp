// Snapshot: Province Open API v2, retrieved 2026-10-29.
// https://provinces.open-api.vn/api/v2/redoc
window.createAddressPicker = async (city, ward, saved = {}) => {
  const response = await fetch('/data/vietnam-addresses.json');
  if (!response.ok) throw new Error('Không tải được danh sách địa phương.');
  const provinces = await response.json();
  const fill = (select, items, placeholder, selected = '') => {
    select.replaceChildren(new Option(placeholder, ''));
    items.forEach(item => select.add(new Option(item.name, item.name)));
    if (selected && !items.some(item => item.name === selected)) {
      select.add(new Option(`${selected} (địa chỉ đã lưu)`, selected));
    }
    select.value = selected;
  };
  const updateWard = (selected = '') => {
    const province = provinces.find(p => p.name === city.value);
    fill(ward, province?.wards || [], 'Chọn phường / xã', selected);
    ward.disabled = !province && !selected;
  };
  fill(city, provinces, 'Chọn tỉnh / thành phố', saved.city || '');
  updateWard(saved.ward || '');
  city.addEventListener('change', () => {
    updateWard();
    ward.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
