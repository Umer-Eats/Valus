// Synthetic cine-MRI style illustration. No patient imaging or diagnostic data.
// A fixed slice shows wall thickening and cavity narrowing through each cycle.
export const cardiacScanFragment=`
precision highp float;
uniform vec2 resolution;uniform float time;uniform float dark;
float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float oval(vec2 p,vec2 center,vec2 radius){return length((p-center)/radius);}
float mask(float d){return 1.-smoothstep(.98,1.02,d);}
void main(){
 vec2 p=(gl_FragCoord.xy-resolution*.5)/min(resolution.x,resolution.y)*3.2;
 // A stable four-chamber plane; the geometry deforms, rather than rotating.
 float c=cos(.2),s=sin(.2);p=mat2(c,-s,s,c)*p;
 float phase=fract(time*1.08);
 float systole=exp(-pow((phase-.3)/.14,2.));
 float atrial=exp(-pow((phase-.91)/.08,2.));
 vec2 q=p;q.y+=systole*.035;
 q.x+=.028*sin(q.y*7.)+.012*sin(q.y*17.);q.y+=.015*sin(q.x*13.);
 float envelope=oval(q,vec2(0.,-.02),vec2(.91,1.2));
 float body=mask(oval(q,vec2(0.,.05),vec2(1.36,1.5)));
 float tissue=.1*body;
 tissue+=body*(.018*sin(q.y*34.+sin(q.x*19.)*2.)+.012*sin(q.x*51.));
 float pericardium=exp(-pow((envelope-1.)/.024,2.))*.38;
 float leftOuter=oval(q,vec2(.32,-.38),vec2(.4-.015*systole,.64-.025*systole));
 float rightOuter=oval(q,vec2(-.34,-.27),vec2(.41-.02*systole,.56-.02*systole));
 float leftCavity=oval(q,vec2(.32,-.38+systole*.05),vec2(.265-.085*systole,.48-.09*systole));
 float rightCavity=oval(q,vec2(-.34,-.27+systole*.04),vec2(.29-.075*systole,.415-.065*systole));
 float leftAtrium=oval(q,vec2(.29,.56),vec2(.30-.025*atrial+.015*systole,.34-.035*atrial));
 float rightAtrium=oval(q,vec2(-.37,.5),vec2(.32-.025*atrial,.36-.03*atrial));
 float wall=max(mask(leftOuter),mask(rightOuter));
 float atria=max(mask(leftAtrium),mask(rightAtrium));
 float atrialWall=max(mask(leftAtrium*.86),mask(rightAtrium*.86));
 tissue=max(tissue,wall*.43);tissue=max(tissue,atrialWall*.38);
 float trabeculae=.016*sin(atan(q.y+.38,q.x-.32)*23.)+.012*sin(q.y*51.);
 leftCavity+=trabeculae*smoothstep(.65,1.,leftCavity);
 rightCavity+=.018*sin(q.y*48.+q.x*28.)*smoothstep(.7,1.,rightCavity);
 float blood=max(max(mask(leftCavity),mask(rightCavity)),atria);
 float flow=.035*sin(q.x*24.+q.y*13.-time*2.)+.025*sin(q.y*35.+time*3.);
 tissue=mix(tissue,.83+flow,blood);
 // Papillary muscles and fine trabecular structure in the ventricular cavities.
 float papillary=mask(oval(q,vec2(.23,-.54+systole*.04),vec2(.045+.02*systole,.10)));
 papillary=max(papillary,mask(oval(q,vec2(.43,-.51),vec2(.04+.015*systole,.085))));
 tissue=mix(tissue,.36,papillary);
 float valveY=.12-.045*systole;
 float valve=exp(-pow((q.y-valveY-(1.-systole)*.11*abs(sin(q.x*7.)))/.016,2.));
 valve*=1.-smoothstep(.52,.64,abs(q.x));
 tissue=mix(tissue,.30,valve*.85);
 tissue+=pericardium;
 float grain=(noise(floor(gl_FragCoord.xy*.7)+floor(time*18.))-.5)*.075;
 float structure=sin(q.x*75.+sin(q.y*20.)*2.)*sin(q.y*67.)*.018;
 tissue=clamp(tissue+grain*body+structure*wall,0.,1.);
 vec3 bg=mix(vec3(.9,.92,.94),vec3(.035,.045,.06),dark);
 vec3 scan=vec3(tissue*.94,tissue*.98,tissue);
 float vignette=1.-smoothstep(1.1,1.65,length(p*vec2(.82,1.)));
 vec3 color=mix(bg,scan,vignette*.94);
 gl_FragColor=vec4(color,1.);
}`;
