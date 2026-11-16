from PIL import Image,ImageDraw,ImageFont,ImageStat
from pathlib import Path
import sys,json
repo=Path(sys.argv[1]).resolve();out=repo/'.scratch/metrology-review'
report=json.loads((out/'asset-report.json').read_text())
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',17)
sheet=Image.new('RGB',(1536,len(report['tools'])*420),(19,24,28));draw=ImageDraw.Draw(sheet)
for row,tool in enumerate(report['tools']):
    for col,angle in enumerate(['front','side','underside']):
        path=out/(tool['id']+'-'+angle+'.png')
        if path.exists():
            im=Image.open(path).convert('RGB');assert max(ImageStat.Stat(im).stddev)>3,path
            sheet.paste(im,(col*512,row*420+30))
        draw.text((col*512+12,row*420+7),tool['id']+' / '+angle,font=font,fill=(223,222,211))
sheet.save(out/'contact-sheet.jpg',quality=92)
print(out/'contact-sheet.jpg')
