import os
from PIL import Image

SRC_DIR = "teela-hero-shapes-transparent-pack"
OUT_DIR = "public/shapes"
os.makedirs(OUT_DIR, exist_ok=True)

files = [
    ("IMG_3113.JPG", "shape-01-green-sphere.png"),
    ("IMG_3114.JPG", "shape-02-blue-column.png"),
    ("IMG_3115.JPG", "shape-03-purple-column.png"),
    ("IMG_3116.JPG", "shape-04-purple-torus.png"),
    ("IMG_3117.JPG", "shape-05-blue-spiral.png"),
    ("IMG_3118.JPG", "shape-06-purple-star.png"),
    ("IMG_3119.JPG", "shape-07-cyan-metaball.png"),
    ("IMG_3120.JPG", "shape-08-red-droplet.png"),
]

def is_background(r, g, b, filename):
    # Max difference between color channels (saturation indicator)
    diff = max(abs(r - g), abs(r - b), abs(g - b))
    
    if filename == "IMG_3113.JPG": # Green sphere on white/near-white bg
        # Green sphere itself has high green channel and strong saturation
        if g > r + 18 and g > b + 18:
            return False
        return True

    if filename == "IMG_3114.JPG": # Blue column on off-white bg
        if r > 235 and g > 235 and b > 235:
            return True
        if diff < 15 and r > 215:
            return True
        return False

    # For checkerboard backgrounds (IMG_3115 to IMG_3120):
    # The checkerboard is strictly grayscale (R ≈ G ≈ B, diff is tiny < 15, and brightness is high > 180)
    # The shapes are vibrant saturated colors (Purple, Blue, Cyan, Red)
    if diff < 18 and r > 180 and g > 180 and b > 180:
        return True
    
    return False

for src_name, out_name in files:
    src_path = os.path.join(SRC_DIR, src_name)
    if not os.path.exists(src_path):
        continue
    img = Image.open(src_path).convert("RGBA")
    w, h = img.size

    if src_name == "IMG_3113.JPG":
        # Green sphere is centered at (297, 214) with radius 186
        from PIL import ImageDraw
        # Create an anti-aliased circular mask
        mask = Image.new("L", (w * 2, h * 2), 0)
        draw = ImageDraw.Draw(mask)
        cx, cy, r = 297 * 2, 214 * 2, 185.5 * 2
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
        mask = mask.resize((w, h), Image.Resampling.LANCZOS)
        img.putalpha(mask)
    else:
        data = img.getdata()
        new_data = []
        for item in data:
            r, g, b, a = item
            diff = max(abs(r - g), abs(r - b), abs(g - b))
            if src_name == "IMG_3114.JPG":
                is_bg = (r > 235 and g > 235 and b > 235) or (diff < 15 and r > 215)
            else:
                is_bg = (diff < 18 and r > 180 and g > 180 and b > 180)
            
            if is_bg:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append((r, g, b, 255))
        img.putdata(new_data)
    
    # Crop to non-transparent bounding box
    bbox = img.getbbox()
    if bbox:
        pad = 4
        crop_box = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad)
        )
        img = img.crop(crop_box)
        
    out_path = os.path.join(OUT_DIR, out_name)
    img.save(out_path, "PNG")
    print(f"Saved {out_path} with size {img.size}")
