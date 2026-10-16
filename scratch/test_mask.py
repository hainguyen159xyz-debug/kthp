from PIL import Image, ImageFilter
import math
import colorsys

def test_isolate_and_recolor(base_path, out_path, target_hue=0.6, brighten_shoe=True):
    im = Image.open(base_path).convert('RGB')
    w, h = im.size
    orig_pixels = im.load()
    
    # 1. Sample background color from corners and borders
    border_samples = []
    for x in range(0, w, 5):
        border_samples.append(orig_pixels[x, 0])
        border_samples.append(orig_pixels[x, h-1])
    for y in range(0, h, 5):
        border_samples.append(orig_pixels[0, y])
        border_samples.append(orig_pixels[w-1, y])
        
    avg_bg_r = sum(s[0] for s in border_samples) / len(border_samples)
    avg_bg_g = sum(s[1] for s in border_samples) / len(border_samples)
    avg_bg_b = sum(s[2] for s in border_samples) / len(border_samples)
    print(f"Detected background average RGB: ({avg_bg_r:.1f}, {avg_bg_g:.1f}, {avg_bg_b:.1f})")
    
    result = im.copy()
    res_pixels = result.load()
    
    # 2. Iterate and recolor only shoe
    for y in range(h):
        for x in range(w):
            r, g, b = orig_pixels[x, y]
            
            # Distance from background color
            dist = math.sqrt((r - avg_bg_r)**2 + (g - avg_bg_g)**2 + (b - avg_bg_b)**2)
            
            # If distance is small, it's the background -> KEEP 100% UNCHANGED!
            if dist < 45:
                res_pixels[x, y] = (r, g, b)
                continue
                
            # It's part of the shoe!
            h_val, s_val, v_val = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            
            # If shoe is dark/black (v < 0.4), brighten it and give it color saturation
            if v_val < 0.35:
                v_val = 0.35 + v_val * 0.9
                s_val = 0.85
                h_val = target_hue
            elif s_val > 0.1:
                # Colored part of shoe: change hue
                h_val = target_hue
                s_val = min(1.0, s_val * 1.3)
            else:
                # White or grey parts of shoe (like sole or white swoosh): keep white/grey or tint slightly
                pass
                
            new_r, new_g, new_b = colorsys.hsv_to_rgb(h_val, s_val, v_val)
            res_pixels[x, y] = (int(new_r * 255), int(new_g * 255), int(new_b * 255))
            
    result.save(out_path, quality=94)
    print(f"Saved {out_path}")

test_isolate_and_recolor('public/images/shoes/14.jpg', 'scratch/14_mask_blue.jpg', target_hue=0.60) # Royal Blue
test_isolate_and_recolor('public/images/shoes/14.jpg', 'scratch/14_mask_red.jpg', target_hue=0.98) # Crimson Red
