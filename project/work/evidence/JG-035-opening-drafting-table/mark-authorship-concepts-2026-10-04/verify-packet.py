from pathlib import Path
from PIL import Image
from html.parser import HTMLParser
import json
base=Path(__file__).resolve().parent
expected={
"01-authored-vellum.png":(2688,1520),
"02-packaging-story-v3.png":(2688,1520),
"03-ring-finish.png":(2688,1520),
"04-planet-inspection-v3.png":(2688,1520),
"05-mobile-inspection.png":(1520,2688),
}
for name, size in expected.items():
    with Image.open(base/name) as im:
        assert im.size==size,(name,im.size)
        im.verify()
class Links(HTMLParser):
    def __init__(self):super().__init__();self.refs=[]
    def handle_starttag(self,tag,attrs):
        for key,value in attrs:
            if key in ("src","href","poster") and value:self.refs.append(value)
parser=Links();parser.feed((base/"gallery.html").read_text(encoding="utf-8"))
for ref in parser.refs:
    assert (base/ref).is_file(),ref
receipts=list(base.glob("*.receipt.json"))
assert len(receipts)==10,len(receipts)
for path in receipts:
    record=json.loads(path.read_text(encoding="utf-8"))
    assert record["status"]=="completed",path.name
    assert record["result_url"].startswith("https://"),path.name
print(f"PASS: 5 decoded final images, {len(set(parser.refs))} gallery targets, 10 completed receipts")

