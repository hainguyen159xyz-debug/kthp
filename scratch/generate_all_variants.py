import os
from PIL import Image

output_dir = 'public/images/shoes'

# Operations:
# 'hsv_shift': shift hue by X (0..255)
# 'tint': set hue and ensure saturation
# 'darken': decrease value/brightness for stealth look
# 'brighten': increase brightness/whiteness

tasks = [
    # 2. Adidas Ultraboost Light (2.jpg)
    {'src': '2.jpg', 'dest': '2-mint.jpg', 'type': 'hsv_shift', 'shift': 105},
    {'src': '2.jpg', 'dest': '2-black.jpg', 'type': 'darken', 'factor': 0.45},
    
    # 3. Puma Velocity Nitro 2 (3.jpg)
    {'src': '3.jpg', 'dest': '3-blue.jpg', 'type': 'tint', 'hue': 145, 'sat': 160},
    {'src': '3.jpg', 'dest': '3-red.jpg', 'type': 'tint', 'hue': 0, 'sat': 160},
    
    # 6. Nike Dunk Low Retro Panda (6.jpg)
    {'src': '6.jpg', 'dest': '6-mint.jpg', 'type': 'hsv_shift', 'shift': 85},
    {'src': '6.jpg', 'dest': '6-lavender.jpg', 'type': 'hsv_shift', 'shift': 160},
    
    # 7. Puma Deviate Nitro Elite 2 (7.jpg)
    {'src': '7.jpg', 'dest': '7-coral.jpg', 'type': 'hsv_shift', 'shift': 135},
    {'src': '7.jpg', 'dest': '7-blue.jpg', 'type': 'hsv_shift', 'shift': 65},
    
    # 8. Nike ZoomX Vaporfly 3 (8.jpg)
    {'src': '8.jpg', 'dest': '8-pink.jpg', 'type': 'hsv_shift', 'shift': 150},
    {'src': '8.jpg', 'dest': '8-blue.jpg', 'type': 'hsv_shift', 'shift': 80},
    
    # 9. Adidas Adizero Adios Pro 3 (9.jpg)
    {'src': '9.jpg', 'dest': '9-blue.jpg', 'type': 'hsv_shift', 'shift': 75},
    {'src': '9.jpg', 'dest': '9-red.jpg', 'type': 'hsv_shift', 'shift': 150},
    
    # 12. Puma Future 7 Match FG/AG (12.jpg)
    {'src': '12.jpg', 'dest': '12-blue.jpg', 'type': 'tint', 'hue': 145, 'sat': 160},
    {'src': '12.jpg', 'dest': '12-orange.jpg', 'type': 'tint', 'hue': 22, 'sat': 180},
    
    # 13. Nike Mercurial Superfly 9 Academy (13.jpg)
    {'src': '13.jpg', 'dest': '13-blue.jpg', 'type': 'hsv_shift', 'shift': 65},
    {'src': '13.jpg', 'dest': '13-yellow.jpg', 'type': 'hsv_shift', 'shift': 130},
    
    # 14. Adidas Predator Elite FT (14.jpg)
    {'src': '14.jpg', 'dest': '14-purple.jpg', 'type': 'hsv_shift', 'shift': 60},
    {'src': '14.jpg', 'dest': '14-green.jpg', 'type': 'hsv_shift', 'shift': 120},
    
    # 15. Puma King Pro 21 FG/AG (15.jpg)
    {'src': '15.jpg', 'dest': '15-white.jpg', 'type': 'brighten', 'factor': 1.6},
    {'src': '15.jpg', 'dest': '15-blue.jpg', 'type': 'tint', 'hue': 150, 'sat': 150},
    
    # 16. Nike Giannis Freak 5 (16.jpg)
    {'src': '16.jpg', 'dest': '16-purple.jpg', 'type': 'hsv_shift', 'shift': 60},
    {'src': '16.jpg', 'dest': '16-green.jpg', 'type': 'hsv_shift', 'shift': 120},
    
    # 17. Adidas Dame 8 EXTPLY (17.jpg)
    {'src': '17.jpg', 'dest': '17-aqua.jpg', 'type': 'hsv_shift', 'shift': 70},
    {'src': '17.jpg', 'dest': '17-red.jpg', 'type': 'hsv_shift', 'shift': 140},
    
    # 18. Puma MB.03 LaMelo Ball (18.jpg)
    {'src': '18.jpg', 'dest': '18-pink.jpg', 'type': 'hsv_shift', 'shift': 80},
    {'src': '18.jpg', 'dest': '18-purple.jpg', 'type': 'hsv_shift', 'shift': 140},
    
    # 19. Nike Metcon 9 Training (19.jpg)
    {'src': '19.jpg', 'dest': '19-blue.jpg', 'type': 'hsv_shift', 'shift': 85},
    {'src': '19.jpg', 'dest': '19-green.jpg', 'type': 'hsv_shift', 'shift': 145},
    
    # 20. Adidas Dropset 2 Trainer (20.jpg)
    {'src': '20.jpg', 'dest': '20-blue.jpg', 'type': 'tint', 'hue': 150, 'sat': 140},
    {'src': '20.jpg', 'dest': '20-red.jpg', 'type': 'tint', 'hue': 0, 'sat': 140},
    
    # 21. Puma Fuse 2.0 Workout Trainer (21.jpg)
    {'src': '21.jpg', 'dest': '21-blue.jpg', 'type': 'hsv_shift', 'shift': 65},
    {'src': '21.jpg', 'dest': '21-orange.jpg', 'type': 'hsv_shift', 'shift': 130},
    
    # 22. Nike Invincible 3 Max Cushion (22.jpg)
    {'src': '22.jpg', 'dest': '22-teal.jpg', 'type': 'hsv_shift', 'shift': 70},
    {'src': '22.jpg', 'dest': '22-pink.jpg', 'type': 'hsv_shift', 'shift': 140},
    
    # 23. Adidas Boston 12 Energy Rods (23.jpg)
    {'src': '23.jpg', 'dest': '23-cyan.jpg', 'type': 'hsv_shift', 'shift': 65},
    {'src': '23.jpg', 'dest': '23-orange.jpg', 'type': 'hsv_shift', 'shift': 135},
    
    # 24. Puma Magnify Nitro 2 Comfort (24.jpg)
    {'src': '24.jpg', 'dest': '24-red.jpg', 'type': 'hsv_shift', 'shift': 65},
    {'src': '24.jpg', 'dest': '24-green.jpg', 'type': 'hsv_shift', 'shift': 130},
    
    # 25. Nike Air Max 270 Lifestyle (25.jpg)
    {'src': '25.jpg', 'dest': '25-blue.jpg', 'type': 'hsv_shift', 'shift': 70},
    {'src': '25.jpg', 'dest': '25-orange.jpg', 'type': 'hsv_shift', 'shift': 140},
    
    # 26. Adidas NMD_R1 V3 Urban (26.jpg)
    {'src': '26.jpg', 'dest': '26-mint.jpg', 'type': 'hsv_shift', 'shift': 70},
    {'src': '26.jpg', 'dest': '26-purple.jpg', 'type': 'hsv_shift', 'shift': 140},
    
    # 27. Puma RS-X Efekt Remastered (27.jpg)
    {'src': '27.jpg', 'dest': '27-blue.jpg', 'type': 'hsv_shift', 'shift': 80},
    {'src': '27.jpg', 'dest': '27-purple.jpg', 'type': 'hsv_shift', 'shift': 145},
    
    # 28. Nike InfinityRN 4 Flyknit (28.jpg)
    {'src': '28.jpg', 'dest': '28-teal.jpg', 'type': 'hsv_shift', 'shift': 70},
    {'src': '28.jpg', 'dest': '28-amber.jpg', 'type': 'hsv_shift', 'shift': 140},
    
    # 29. Adidas Supernova Rise Dreamstrike (29.jpg)
    {'src': '29.jpg', 'dest': '29-orange.jpg', 'type': 'hsv_shift', 'shift': 80},
    {'src': '29.jpg', 'dest': '29-green.jpg', 'type': 'hsv_shift', 'shift': 145},
    
    # 30. Puma Fast-R Nitro Elite Carbon (30.jpg)
    {'src': '30.jpg', 'dest': '30-green.jpg', 'type': 'hsv_shift', 'shift': 65},
    {'src': '30.jpg', 'dest': '30-blue.jpg', 'type': 'hsv_shift', 'shift': 130},
]

print(f"Generating {len(tasks)} shoe image variants...")

for task in tasks:
    src_path = os.path.join(output_dir, task['src'])
    dest_path = os.path.join(output_dir, task['dest'])
    
    if not os.path.exists(src_path):
        print(f"Warning: src file {src_path} does not exist!")
        continue
        
    im = Image.open(src_path).convert('RGB')
    hsv = im.convert('HSV')
    h, s, v = hsv.split()
    
    t = task['type']
    if t == 'hsv_shift':
        shift_byte = task['shift']
        h = h.point(lambda p: (p + shift_byte) % 256)
        # boost saturation slightly if needed
        s = s.point(lambda p: min(255, int(p * 1.15)))
    elif t == 'tint':
        target_hue = task['hue']
        target_sat = task['sat']
        h = h.point(lambda p: target_hue)
        s = s.point(lambda p: max(target_sat, int(p * 1.2)))
    elif t == 'darken':
        factor = task['factor']
        v = v.point(lambda p: int(p * factor))
        s = s.point(lambda p: int(p * 0.7))
    elif t == 'brighten':
        factor = task['factor']
        v = v.point(lambda p: min(255, int(p * factor)))
        s = s.point(lambda p: int(p * 0.3))
        
    res = Image.merge('HSV', (h, s, v)).convert('RGB')
    res.save(dest_path, quality=94)
    print(f"[OK] Saved {dest_path}")

print("All shoe image variants successfully generated!")
