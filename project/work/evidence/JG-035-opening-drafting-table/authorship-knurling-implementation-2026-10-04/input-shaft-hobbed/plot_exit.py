import json, numpy as np, math
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
S=np.array(json.load(open(r'C:\Projects\CAD\jgun-input-shaft-hobbed\silhouette.json')))
y,rmax=S[:,0],S[:,1]
ROOT=4.298; Y_B=9.525; NECK=6.077; JOURNAL_Y=11.43; JOURNAL_R=6.325; Y0=3.175
fig,ax=plt.subplots(figsize=(13,6.2),dpi=140)
ax.fill_between(y,-rmax,rmax,color='#d9dde2',zorder=1); ax.plot(y,rmax,color='#444',lw=1.2,zorder=2); ax.plot(y,-rmax,color='#444',lw=1.2,zorder=2)
ax.axhline(0,color='#999',lw=.6,ls='-.')
ax.axvspan(Y0,Y_B,color='#2f7fd1',alpha=.10,zorder=0)
ax.text((Y0+Y_B)/2,7.7,'functional face width\n6.35 mm (0.250 in)',ha='center',va='top',fontsize=9,color='#1d5a9c')
ax.axvline(Y_B,color='#1d5a9c',lw=1); ax.axvline(JOURNAL_Y,color='#b3261e',lw=1.4,ls='--')
ax.text(JOURNAL_Y+.1,-7.9,'bearing journal starts\ny = 11.43 mm  (r 6.325)',color='#b3261e',fontsize=9,va='bottom')
ax.hlines(ROOT,Y0,Y_B,color='#c25b00',lw=1.4); ax.text(Y0+.1,ROOT-.45,'tooth root r 4.30',color='#c25b00',fontsize=8)
cfg=[(1.885,'#1b8a3a','R 1.9 mm (built)'),(4.0,'#8a6d00','R 4 mm'),(8.0,'#7b3fb5','R 8 mm'),(11.0,'#b3261e','R 11 mm')]
for R,c,lab in cfg:
    t=np.linspace(0,1,200); yy=np.linspace(Y_B,Y_B+R*math.sin(math.acos(1-(NECK-ROOT)/R)) if (NECK-ROOT)<R else Y_B+R,300)
    fl=ROOT+R-np.sqrt(np.maximum(R*R-(yy-Y_B)**2,0))
    keep=fl<=NECK+0.4
    ax.plot(np.r_[Y0,Y_B,yy[keep]],np.r_[ROOT,ROOT,fl[keep]],color=c,lw=2.0,label=lab)
    # exit point: floor reaches the neck radius 6.077
    ye=Y_B+math.sqrt(max(2*R*(NECK-ROOT)-(NECK-ROOT)**2,0))
    ax.plot([ye],[NECK],'o',color=c,ms=6,zorder=5)
    ax.annotate(f'exit y={ye:.1f}',(ye,NECK),textcoords='offset points',xytext=(4,6+ (cfg.index((R,c,lab)))*0),color=c,fontsize=8,rotation=35)
ax.set_xlim(2,19); ax.set_ylim(-8.6,8.6); ax.set_aspect('equal')
ax.set_xlabel('axial position y (mm)  gear end at left'); ax.set_ylabel('radius (mm)')
ax.set_title('P001835 Input Shaft: hob lead-out gap floor vs part profile (dots = where the floor reaches the 6.077 mm neck surface)',fontsize=10)
ax.legend(loc='lower right',fontsize=9,title='hob radius'); fig.tight_layout()
fig.savefig(r'C:\Projects\CAD\jgun-input-shaft-hobbed\hob_leadout_exit.png')
for R,_,_ in cfg: print('EXIT',R, round(Y_B+math.sqrt(2*R*(NECK-ROOT)-(NECK-ROOT)**2),2))

