from common import *

def pencil():
    r=root('pencil-rotring-600'); z=.0047
    cylinder('hexagonal lacquer barrel',.0043,.091,(.010,0,z),'black',vertices=6)
    cylinder('grip core',.0039,.025,(-.048,0,z),'steel')
    knurl('pencil diamond grip',-.048,.024,.00395,z,count=48)
    cylinder('brass separator',.0041,.0013,(-.034,0,z),'brass')
    cylinder('conical nose',.0011,.010,(-.065,0,z),'steel',r2=.0038)
    cylinder('four mm lead sleeve',.00065,.004,(-.072,0,z),'lap')
    cylinder('graphite',.00025,.0015,(-.0747,0,z),'ink')
    cylinder('red cap ring',.0044,.002,(.057,0,z),'red')
    cylinder('eraser button',.0042,.008,(.062,0,z),'steel')
    box('folded pocket clip',(.030,.0018,.0006),(.042,0,.0095),'steel',.00025)
    box('clip attachment',(.004,.002,.002),(.055,0,.008),'steel')
    text('barrel stamp','rOtring 600',(-.028,-.0018,z+.0043*math.cos(math.pi/6)+.000025),.003,'ivory')
    consolidate(r)

def calipers():
    r=root('digital-calipers-150mm')
    box('ground beam',(.210,.013,.003),(.002,0,.002),'steel')
    box('rear beam rail slot',(.187,.0012,.0002),(.008,0,.00035),'black',.0001)
    # Ground, relieved jaw profiles, with an honest 24 mm measuring gap.
    jaw=[(-.008,-.005),(.008,-.005),(.008,-.027),(.003,-.046),(-.002,-.046),(-.008,-.018)]
    for x,mirror in [(-.099,1),(-.059,-1)]:
        profile('outside ground jaw',[(x+a*mirror,b) for a,b in jaw],.006,0,'steel',.00065)
        profile('inside nib',[(x-.006,0),(x+.006,0),(x+.004,.019),(x-.003,.028),(x-.004,.008)],.004,.001,'lap',.0003)
    box('slider underside',(.043,.023,.004),(-.055,0,.004),'steel')
    box('LCD polymer case',(.042,.027,.009),(-.052,.002,.010),'black',.0018)
    box('display bezel',(.031,.014,.001),(-.053,.006,.015),'steel',.0008)
    box('LCD glass',(.028,.011,.0006),(-.053,.006,.0157),'ivory',.0003)
    text('LCD digits','24.00',(-.066,.002,.01605),.007,'ink')
    for x,label,col in [(-.067,'ORIGIN','green'),(-.054,'ZERO','red'),(-.041,'mm/in','black')]:
        box('button '+label,(.009,.004,.0017),(x,-.007,.015),col,.0008)
        text('button legend',label,(x-.003,-.008,.0159),.0014,'ivory')
    cylinder('thumb wheel',.005,.005,(-.052,-.019,.007),'steel','X')
    cylinder('locking screw',.003,.004,(-.049,.022,.008),'steel','Y',24)
    box('depth rod',(.030,.002,.0015),(.116,0,.0018),'lap',.0002)
    for i in range(151):
        x=-.086+i*.001
        length=.005 if i%10==0 else .003 if i%5==0 else .0016
        box('detail-laser scale',(.00013,length,.000025),(x,.005-length/2,.00352),'ink',0)
        if i%10==0: text('scale numeral',str(i), (x-.001,-.001,.00355),.0018)
    text('rear serial','150 mm / 0.01   S/N 261115',(-.045,.004,.00045),.0024,'ink',(math.pi,0,0))
    consolidate(r)

def micrometer():
    r=root('micrometer-0-25mm')
    # Open C silhouette: forged outside sweep and recessed web, not torus stock.
    pts=[]
    for i in range(33):
        a=math.radians(180+180*i/32); pts.append((-.038+.034*math.cos(a),.012+.035*math.sin(a)))
    for i in range(32,-1,-1):
        a=math.radians(180+180*i/32); pts.append((-.038+.023*math.cos(a),.012+.024*math.sin(a)))
    profile('forged C frame rim',pts,.008,0,'steel',.0012)
    web=[(x*.98,y*.96) for x,y in pts]
    profile('recessed oxide web',web,.005,.0015,'black',.0005)
    box('front insulated grip',(.028,.010,.002),(-.038,-.017,.009),'grip',.002)
    box('back insulated grip',(.028,.010,.0015),(-.038,-.017,.00075),'grip',.002)
    for x in (-.048,-.028):
        cylinder('detail-grip screw',.0013,.0005,(x,-.017,.0102),'steel','Z',16)
    cylinder('anvil',.003,.012,(-.062,.012,.006),'lap')
    cylinder('carbide anvil',.003,.001,(-.0555,.012,.006),'black')
    cylinder('spindle',.003,.030,(-.016,.012,.006),'lap')
    cylinder('carbide spindle',.003,.001,(-.0315,.012,.006),'black')
    cylinder('graduated sleeve',.005,.029,(.012,.012,.006),'steel')
    cylinder('thimble',.007,.029,(.040,.012,.007),'steel')
    # knurl helper assumes y=0; move its freshly created meshes to spindle line.
    before=set(r.children); knurl('micrometer thimble',.040,.021,.0071,.007,count=48)
    for o in set(r.children)-before: o.location.y+=.012
    cylinder('ratchet stop',.0048,.014,(.062,.012,.007),'black')
    box('spindle lock',(.011,.003,.002),(-.006,.004,.008),'black')
    for i in range(26):
        box('detail-sleeve graduation',(.00018,.003+(i%5==0)*.002,.00006),(-.002+i*.001,.012,.01105),'ink',0)
        if i%5==0: text('sleeve vernier',str(i),(-.003+i*.001,.013,.0111),.0017)
    for i in range(50):
        a=2*math.pi*i/50
        y=.012+.00705*math.sin(a);z=.007+.00705*math.cos(a)
        length=.004 if i%5==0 else .002
        line('detail-thimble graduation',(.0255,y,z),(.0255+length,y,z),.000075,'ink',6)
    text('frame capacity','0-25',(-.045,-.018,.0101),.004,'ivory')
    text('frame resolution','0.01 mm',(-.045,-.021,.0101),.002,'ivory')
    consolidate(r)
