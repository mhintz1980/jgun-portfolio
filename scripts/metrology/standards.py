from common import *

def standards():
    shared_blocks={}; shared_pins={}
    for mm in (10,20,25,30,50):
        r=root(f'gauge-block-{mm}mm'); length=mm/1000
        box('hardened gauge body',(length,.009,.024),(0,0,.012),'steel',.00022)
        # Two lapped measuring faces, opposite ends of the nominal length.
        for s in (-1,1):
            box('wringing face',(.00008,.0085,.0235),(s*(length/2-.00004),0,.012),'lap',.000025)
        text('nominal',str(mm),(-length*.30,-.002,.02403),min(.006,length*.45),'ink')
        text('grade serial','K / 26115',(-length*.35,.0028,.02404),.0014,'ink')
        consolidate(r)
        for o in r.children:
            mat=o.data.materials[0].name
            if mat in ('steel','lap'):
                if mat not in shared_blocks: shared_blocks[mat]=o.data
                else: o.data=shared_blocks[mat]; o.scale.x=mm/10
    for mm in (6,8,10):
        r=root(f'pin-gauge-{mm}mm'); radius=mm/2000
        cylinder('lapped pin',radius,.050,(0,0,radius),'lap',vertices=48)
        for x in (-.019,.019): cylinder('etched collar',radius+.000015,.00025,(x,0,radius),'black')
        text('pin nominal',f'{mm}.000',(-.009,-.001,radius*2+.000025),.002,'ink')
        consolidate(r)
        for o in r.children:
            mat=o.data.materials[0].name
            if mat in ('lap','black'):
                if mat not in shared_pins: shared_pins[mat]=o.data
                else: o.data=shared_pins[mat]; o.scale.y=o.scale.z=mm/6

def go_nogo():
    r=root('plug-gauge-gonogo'); z=.007
    cylinder('hexagonal handle',.006,.049,(0,0,z),'black',vertices=6)
    for x,col in [(-.019,'green'),(.019,'red')]:
        cylinder('anodized tolerance band',.005,.005,(x,0,z),col,vertices=48)
    for s in (-1,1):
        cylinder('collet nut',.006,.009,(s*.028,0,z),'steel',vertices=6)
        cylinder('shoulder',.004,.004,(s*.034,0,z),'steel')
    cylinder('GO lapped plug',.005,.028,(-.048,0,z),'lap')
    cylinder('NO GO lapped plug',.0052,.014,(.041,0,z),'lap')
    text('handle tolerance','10 H7',(-.012,-.0016,.0123),.0034,'ivory')
    text('go label','GO',(-.022,-.001,.01205),.002,'ivory')
    text('no go label','NO',(.017,-.001,.01205),.002,'ivory')
    consolidate(r)
