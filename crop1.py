
from PIL import Image
im = Image.open(r"C:\\Users\\phill\\AppData\\Roaming\\Hermes\\composer-images\\image_28fdbd.png").convert("RGB")
W,H = im.size
im.crop((0, round(H*0.82), W, H)).save(r"C:\\Users\\phill\\pokemon-grader\\user_strip.png")
im.crop((0, round(H*0.86), round(W*0.55), H)).resize((round(W*0.55*3), (H-round(H*0.86))*3), Image.NEAREST).save(r"C:\Users\\phill\\pokemon-grader\\user_strip_big.png")
