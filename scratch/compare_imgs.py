from PIL import Image

img1 = Image.open('public/images/shoes/1.jpg')
img1_w = Image.open('public/images/shoes/1-white.jpg')
print(f"1.jpg size: {img1.size}, 1-white.jpg size: {img1_w.size}")

arr1 = np.array(img1) if 'np' in globals() else None
# Let's check average color
def get_avg_rgb(im):
    stat = im.resize((1, 1)).getpixel((0,0))
    return stat

print("1.jpg avg:", get_avg_rgb(img1))
print("1-white.jpg avg:", get_avg_rgb(img1_w))

img10 = Image.open('public/images/shoes/10.jpg')
img10_b = Image.open('public/images/shoes/10-black.jpg')
print("10.jpg avg:", get_avg_rgb(img10))
print("10-black.jpg avg:", get_avg_rgb(img10_b))
