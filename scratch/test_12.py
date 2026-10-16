from PIL import Image

def test_shoe_12():
    im = Image.open('public/images/shoes/12.jpg').convert('RGB')
    w, h = im.size
    pix = im.load()
    
    # White AF1 edition: brighten dark leather to clean white/grey, leave background white
    im_white = im.copy()
    pix_w = im_white.load()
    for y in range(h):
        for x in range(w):
            r, g, b = pix[x, y]
            # Is it the dark shoe leather?
            if r < 140 and g < 140 and b < 140 and x < w * 0.85 and y > h * 0.25:
                # Invert dark leather to bright white/silver
                val = 240 - int(r * 0.5)
                pix_w[x, y] = (val, val, val)
    im_white.save('public/images/shoes/12-white.jpg', quality=94)

test_shoe_12()
