from common import *

def vblock():
    r=root('v-block-clamp')
    # Extruded actual 90-degree notch. Profile initially XY, rotate into YZ.
    pts=[(-.025,0),(.025,0),(.025,.035),(.017,.035),(0,.018),(-.017,.035),(-.025,.035)]
    o=profile('ground V block',pts,.050,0,'steel',.0005)
    o.rotation_euler=(math.pi/2,0,math.pi/2); o.location.x=-.025
    for s in (-1,1):
        box('side relief groove',(.039,.00035,.004),(0,s*.0251,.012),'black',.00025)
        box('clamp riser',(.008,.006,.040),(0,s*.028,.028),'black',.0007)
    box('stepped clamp bridge',(.012,.063,.007),(0,0,.051),'steel',.001)
    cylinder('clamping screw',.003,.022,(0,0,.050),'steel','Z',32)
    cylinder('brass thumb wheel',.007,.004,(0,0,.064),'brass','Z',40)
    for i in range(36):
        a=2*math.pi*i/36
        line('detail-clamp screw knurl',(.007*math.cos(a),.007*math.sin(a),.062),
             (.007*math.cos(a+.1),.007*math.sin(a+.1),.066),.00012,'brass',6)
    line('crossbar',(-.014,0,.064),(.014,0,.064),.0013,'steel')
    shaft_z=.018+.008*math.sqrt(2)
    cylinder('test shaft',.008,.075,(0,0,shaft_z),'lap')
    cylinder('screw pad',.004,.002,(0,0,shaft_z+.009),'steel','Z')
    text('fixture stamp','90 DEG',(-.020,-.020,.0352),.003,'ink')
    consolidate(r)
def height_gauge():
    r=root('height-gauge-dial')
    profile('cast iron base',[(-.036,-.030),(.030,-.030),(.039,-.021),(.039,.021),(.030,.030),(-.036,.030)],.009,0,'black',.002)
    box('ground sole',(.073,.058,.0016),(.001,0,.001),'lap',.0006)
    box('stepped pedestal',(.043,.039,.012),(-.009,0,.015),'black',.0016)
    for y in (-.012,.012): cylinder('precision column',.004,.145,(-.018,y,.0915),'lap','Z')
    box('top bridge',(.020,.035,.006),(-.018,0,.167),'steel',.001)
    box('sliding carriage',(.027,.040,.022),(-.012,0,.091),'black',.001)
    cylinder('fine adjustment',.009,.008,(.003,0,.092),'steel','X')
    knurl('fine handwheel',.003,.008,.009,.092,count=36)
    cylinder('carriage lock',.004,.012,(-.012,-.024,.093),'brass','Y',24)
    line('indicator arm',(.005,0,.086),(.039,0,.086),.003,'lap')
    cylinder('swivel clamp',.005,.012,(.028,0,.086),'black','Z')
    # Dial face points up: all radial marks and numerals are actual geometry.
    cylinder('indicator case',.016,.009,(.043,0,.082),'black','Z',64)
    cylinder('polished bezel',.0165,.002,(.043,0,.087),'steel','Z',64)
    for i in range(64):
        a=2*math.pi*i/64
        line('detail-bezel knurl',(.043+.0165*math.cos(a),.0165*math.sin(a),.086),
             (.043+.0165*math.cos(a+.025),.0165*math.sin(a+.025),.088),.00010,'steel',6)
    cylinder('dial face',.0147,.0005,(.043,0,.0882),'ivory','Z',64)
    for i in range(100):
        a=2*math.pi*i/100
        ri=.0118 if i%10==0 else .0128 if i%5==0 else .0135
        line('detail-dial graduation',(.043+ri*math.cos(a),ri*math.sin(a),.08855),
             (.043+.0142*math.cos(a),.0142*math.sin(a),.08855),.00010,'ink',6)
        if i%10==0:
            text('dial number',str(i//10),(.042+.0094*math.cos(a),-.001+.0094*math.sin(a),.0886),.0021)
    line('red indicator needle',(.043,0,.0889),(.035,.007,.0889),.0003,'red',8)
    cylinder('needle hub',.0012,.0006,(.043,0,.089),'steel','Z',24)
    text('dial resolution','0.01',(.039,-.005,.0887),.002,'ink')
    line('pivoted contact lever',(.043,0,.077),(.058,0,.035),.0012,'steel')
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=.002,location=(.058,0,.034))
    finish(bpy.context.object,'ruby contact ball','ruby')
    # Engraving follows the cylindrical column surface, never a floating strip.
    for i in range(131):
        z=.030+i*.001; half=.0018 if i%10==0 else .0012 if i%5==0 else .0007
        for j in range(4):
            x0=-half+2*half*j/4; x1=-half+2*half*(j+1)/4
            line('detail-column scale',(-.018+x0,-.012-math.sqrt(.004**2-x0*x0)-.000015,z),
                (-.018+x1,-.012-math.sqrt(.004**2-x1*x1)-.000015,z),.000045,'ink',6)
        if i%10==0 and not .077<z<.105:
            text('column scale numeral',str(i),(-.0188,-.01603,z+.00025),.0015,'ink',(math.pi/2,0,0))
    for i in range(11):
        box('detail-carriage vernier',(.003 if i%5 else .005,.00004,.00012),(-.016,-.02003,.083+i*.0009),'ivory',0)
    text('carriage vernier nominal','0  5  10',(-.014,-.02006,.083),.0016,'ivory',(math.pi/2,0,math.pi/2))
    text('base identification','DIAL / 0.01',(-.028,-.024,.0091),.003,'ivory')
    consolidate(r)
