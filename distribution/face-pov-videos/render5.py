from PIL import Image, ImageDraw, ImageFont
import numpy as np
W,H=1080,1920
SER='/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
SERI='/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf'
lines=["Congratulations to me in","advance.","I do not know what is coming,","but I know I am going to win."]
targets=[592,210,703,674]
tops=[756,826,896,966]
img=Image.open('bg-v1.jpg').convert('RGB').resize((W,H))
S=2
f=ImageFont.truetype(SER,58*S)
for t,tw,top in zip(lines,targets,tops):
    layer=Image.new('RGBA',(W*S,150*S),(0,0,0,0))
    ld=ImageDraw.Draw(layer)
    ld.text(((W*S)/2,0), t, font=f, fill=(255,255,255,255), anchor='ma', stroke_width=1, stroke_fill=(255,255,255,255))
    crop=layer.crop(layer.getbbox())
    scale=(tw*S)/crop.width
    crop=crop.resize((tw*S, round(crop.height*scale)))
    crop=crop.resize((tw, round(crop.height/S)))
    img.paste(crop, (round((W-tw)/2), top), crop)
fw=ImageFont.truetype(SERI,31)
d=ImageDraw.Draw(img)
d.text((W/2,1769), "@anicca.en", font=fw, fill=(255,255,255), anchor='ma')
img.save('frame-v5.jpg', quality=92)
a=np.asarray(img.convert('RGB')).astype(int)
lum=a.sum(axis=2); mask=(lum>540)
bands={'L1':(740,820),'L2':(815,885),'L3':(885,960),'L4':(960,1035),'WM':(1760,1820)}
for k,(y0,y1) in bands.items():
    ys,xs=np.where(mask[y0:y1])
    if len(xs): print(k,'x:',xs.min(),xs.max(),'w:',xs.max()-xs.min(),' y:',ys.min()+y0, ys.max()+y0)
print('target L1 w592 y756-804 | L2 w210 y826-864 | L3 w703 y896-944 | L4 w674 y966-1015 | WM y1777-1801')
w=Image.open('winner-frame-4s.jpg').convert('RGB')
wz=w.crop((100,700,980,1080)).resize((880,380))
oz=img.crop((100,700,980,1080)).resize((880,380))
z=Image.new('RGB',(880,780),(255,255,255)); z.paste(wz,(0,0)); z.paste(oz,(0,390))
z.save('zoom-text-v5.jpg', quality=90)
combo=Image.new('RGB',(w.width+img.width+20, w.height),(255,255,255))
combo.paste(w,(0,0)); combo.paste(img,(w.width+20,0))
combo.save('side-by-side-v5.jpg', quality=88)
print('done')
