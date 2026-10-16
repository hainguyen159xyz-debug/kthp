from PIL import Image
import os

files = [f for f in os.listdir('public/images/shoes') if f.endswith('.jpg')]

def get_corners(im):
    w, h = im.size
    return [im.getpixel((0,0)), im.getpixel((w-1, 0)), im.getpixel((0, h-1)), im.getpixel((w-1, h-1))]

for i in range(1, 31):
    base_file = f'public/images/shoes/{i}.jpg'
    if not os.path.exists(base_file):
        continue
    base_im = Image.open(base_file).convert('RGB')
    base_corners = get_corners(base_im)
    
    # check variants
    variants = [f for f in files if f.startswith(f'{i}-') and f.endswith('.jpg')]
    for v in variants:
        v_path = f'public/images/shoes/{v}'
        v_im = Image.open(v_path).convert('RGB')
        v_corners = get_corners(v_im)
        
        diff = sum(sum(abs(c1[ch] - c2[ch]) for ch in range(3)) for c1, c2 in zip(base_corners, v_corners))
        if diff > 30:
            print(f"CHANGED BACKGROUND: Shoe {i} variant {v} has corner diff {diff}")
        else:
            print(f"OK (clean bg): Shoe {i} variant {v}")
