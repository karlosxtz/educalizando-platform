import sys
from PIL import Image

def make_transparent(img_path):
    img = Image.open(img_path)
    img = img.convert("RGBA")
    datas = img.getdata()
    
    newData = []
    # threshold for considering something white
    for item in datas:
        # If the pixel is very close to white, make it fully transparent
        if item[0] >= 240 and item[1] >= 240 and item[2] >= 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(img_path, "PNG")
    print(f"Updated {img_path} to transparent")

make_transparent("public/branding/logo-educalizando.png")
