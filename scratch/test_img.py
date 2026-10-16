from PIL import Image, ImageEnhance, ImageOps
import os

img_path = 'public/images/shoes/2.jpg'
if os.path.exists(img_path):
    img = Image.open(img_path)
    print(f"Loaded {img_path}: format={img.format}, size={img.size}, mode={img.mode}")
