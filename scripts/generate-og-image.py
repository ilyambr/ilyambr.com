import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)

font_path = os.path.join(SCRIPT_DIR, 'fonts', 'SpaceGrotesk.ttf')
mono_path = os.path.join(SCRIPT_DIR, 'fonts', 'SpaceMono-Bold.ttf')

font_headline = ImageFont.truetype(font_path, 58)
font_headline.set_variation_by_name(b'Bold')

font_desc = ImageFont.truetype(font_path, 22)
font_desc.set_variation_by_name(b'Medium')

font_mono = ImageFont.truetype(mono_path, 13)

# Canvas with subtle ambient lift for left side so black shadows pop with depth
canvas = Image.new('RGBA', (W, H), (16, 17, 19, 255))

ambient = Image.new('RGBA', (W, H), (0, 0, 0, 0))
adraw = ImageDraw.Draw(ambient)
adraw.ellipse([(20, 30), (560, 580)], fill=(28, 30, 35, 160))
ambient = ambient.filter(ImageFilter.GaussianBlur(70))
canvas = Image.alpha_composite(canvas, ambient)

draw = ImageDraw.Draw(canvas)

# Complete outer border rectangle
draw.rectangle([(20, 20), (W - 21, H - 21)], outline=(38, 41, 46, 255), width=1)

# Corner crosshair marks at all 4 corners
def draw_cross(x, y, size=8, color=(80, 86, 96, 255)):
    draw.line([(x - size, y), (x + size, y)], fill=color, width=1)
    draw.line([(x, y - size), (x, y + size)], fill=color, width=1)

draw_cross(20, 20)
draw_cross(W - 21, 20)
draw_cross(20, H - 21)
draw_cross(W - 21, H - 21)

# Right pane: full-view image
pane_x = 550
pane_y = 38
pane_w = 612
pane_h = 554

card_shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
cs_draw = ImageDraw.Draw(card_shadow)
cs_draw.rectangle([(pane_x, pane_y), (pane_x + pane_w, pane_y + pane_h)], fill=(0, 0, 0, 240))
card_shadow = card_shadow.filter(ImageFilter.GaussianBlur(30))
canvas = Image.alpha_composite(canvas, card_shadow)

draw = ImageDraw.Draw(canvas)
draw.rectangle([(pane_x, pane_y), (pane_x + pane_w, pane_y + pane_h)], fill=(10, 11, 13, 255), outline=(42, 46, 54, 255), width=1)

fv = Image.open(os.path.join(ROOT_DIR, 'public', 'backtrack', 'full-view.png')).convert('RGBA')
scale = pane_h / fv.height
fv_scaled_w = int(fv.width * scale)
fv_scaled_h = pane_h
fv_scaled = fv.resize((fv_scaled_w, fv_scaled_h), Image.Resampling.LANCZOS)

crop_left = (fv_scaled_w - pane_w) // 2
fv_cropped = fv_scaled.crop((crop_left, 0, crop_left + pane_w, pane_h))
canvas.paste(fv_cropped, (pane_x, pane_y), fv_cropped)

draw = ImageDraw.Draw(canvas)
draw.rectangle([(pane_x, pane_y), (pane_x + pane_w, pane_y + pane_h)], outline=(48, 52, 62, 255), width=1)

# ==================== TEXT & LOGO DROP SHADOW LAYER ====================
shadow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(shadow_layer)

logo = Image.open(os.path.join(ROOT_DIR, 'public', 'backtrack', 'backtrack-text-logo.png')).convert('RGBA')
logo_w = 325
logo_h = int(logo.height * (logo_w / logo.width))
logo_res = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
logo_alpha = logo_res.split()[3]

black_logo = Image.new('RGBA', (logo_w, logo_h), (0, 0, 0, 255))
shadow_layer.paste(black_logo, (60 + 3, 52 + 5), logo_alpha)

sdraw.text((60 + 3, 160 + 5), 'capture without\nalt-tabbing.', font=font_headline, fill=(0, 0, 0, 255), spacing=8)

desc_lines = [
    'Instant replay buffers, clip gallery, and',
    'live recording controls over your games',
    'via OBS without leaving fullscreen.'
]
y_desc = 330
for line in desc_lines:
    sdraw.text((60 + 2, y_desc + 4), line, font=font_desc, fill=(0, 0, 0, 255))
    y_desc += 38

sdraw.text((60 + 2, 555 + 3), 'ilyambr.com/backtrack', font=font_mono, fill=(0, 0, 0, 255))
sdraw.text((375 + 2, 555 + 3), 'OPEN SOURCE // FREE', font=font_mono, fill=(0, 0, 0, 255))

soft_shadow = shadow_layer.filter(ImageFilter.GaussianBlur(8))
canvas = Image.alpha_composite(canvas, soft_shadow)

crisp_shadow = shadow_layer.filter(ImageFilter.GaussianBlur(3))
canvas = Image.alpha_composite(canvas, crisp_shadow)

# ==================== RENDER LOGO & TEXT ====================
canvas.paste(logo_res, (60, 52), logo_res)

draw = ImageDraw.Draw(canvas)
draw.text((60, 160), 'capture without\nalt-tabbing.', font=font_headline, fill=(245, 246, 248, 255), spacing=8)

y_desc = 330
for line in desc_lines:
    draw.text((60, y_desc), line, font=font_desc, fill=(174, 180, 189, 255))
    y_desc += 38

draw.text((60, 555), 'ilyambr.com/backtrack', font=font_mono, fill=(174, 180, 189, 255))
draw.text((375, 555), 'OPEN SOURCE // FREE', font=font_mono, fill=(174, 180, 189, 255))

# ==================== CRITTERS ====================
downloads_dir = os.path.expanduser(r'~\Downloads')
cat = Image.open(os.path.join(downloads_dir, 'cat.png')).convert('RGBA')
dog = Image.open(os.path.join(downloads_dir, 'dog.png')).convert('RGBA')

critter_h = 270
cat_w = int(cat.width * (critter_h / cat.height))
dog_w = int(dog.width * (critter_h / dog.height))

cat_res = cat.resize((cat_w, critter_h), Image.Resampling.LANCZOS)
dog_res = dog.resize((dog_w, critter_h), Image.Resampling.LANCZOS)

def add_outline(img, stroke_px=5, color=(255, 255, 255, 255)):
    alpha = img.split()[3]
    dilated_alpha = alpha.filter(ImageFilter.MaxFilter(stroke_px))
    outline = Image.new('RGBA', img.size, color)
    outline.putalpha(dilated_alpha)
    return Image.alpha_composite(outline, img)

cat_outlined = add_outline(cat_res, stroke_px=5)
dog_outlined = add_outline(dog_res, stroke_px=5)

critter_y = H - critter_h

cat_x = W - cat_w - 30
dog_x = cat_x - 150

critter_shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
dog_alpha = dog_outlined.split()[3]
cat_alpha = cat_outlined.split()[3]

black_cat = Image.new('RGBA', (cat_w, critter_h), (0, 0, 0, 220))
critter_shadow.paste(black_cat, (cat_x, critter_y + 4), cat_alpha)

black_dog = Image.new('RGBA', (dog_w, critter_h), (0, 0, 0, 220))
critter_shadow.paste(black_dog, (dog_x, critter_y + 4), dog_alpha)

critter_shadow = critter_shadow.filter(ImageFilter.GaussianBlur(14))
canvas = Image.alpha_composite(canvas, critter_shadow)

canvas.paste(cat_outlined, (cat_x, critter_y), cat_outlined)
canvas.paste(dog_outlined, (dog_x, critter_y), dog_outlined)

out_backtrack = os.path.join(ROOT_DIR, 'public', 'backtrack', 'og-image.png')
out_root = os.path.join(ROOT_DIR, 'public', 'og-image.png')
canvas.save(out_backtrack)
canvas.save(out_root)
print('Updated', out_backtrack)
