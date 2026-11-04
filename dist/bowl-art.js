// Original inked character art drawn locally for the competition room.
// Transparent portraits are mapped onto the articulated 3D character rigs.
export function drawBowlPortrait(canvas,{robot=false,index=0,moderator=false}={}) {
 canvas.width=384;canvas.height=448;
 const c=canvas.getContext('2d');c.lineJoin='round';c.lineCap='round';
 const ink='#101014',paper='#fff9e9',red='#e51b36';
 const skins=['#d99c79','#edc3a0','#ab7156','#d8aa89'];
 const skin=robot?paper:skins[index%4],shadow=robot?'#92949b':['#b56f57','#d19980','#7f493b','#b78068'][index%4];
 const path=(points,fill,stroke=ink,width=5)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}};
 const line=(points,color=ink,width=4)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();};
 // Angular silhouette and neck: long proportions rather than toy-like heads.
 path([[158,310],[226,310],[232,396],[259,435],[120,435],[152,392]],skin);
 path([[198,316],[226,312],[230,391],[202,411]],shadow,null);
 path([[89,164],[77,157],[67,179],[80,226],[101,238]],skin);
 path([[284,167],[306,161],[316,183],[301,228],[280,236]],skin);
 path([[99,109],[142,61],[231,64],[284,117],[290,214],[268,279],[226,324],[191,345],[145,318],[112,273],[94,205]],skin);
 path([[246,97],[283,125],[288,214],[267,277],[226,324],[193,343],[209,304],[241,265],[254,203]],shadow,null);
 // Eyes are brush-shaped, inset into the illustration; no protruding eyeballs.
 for(const right of [false,true]){
  const x=right?213:110,y=right?190:193;
  path([[x,y],[x+27,y-9],[x+57,y-1],[x+45,y+15],[x+20,y+17]],paper,ink,4);
  path([[x+25,y-5],[x+39,y-3],[x+36,y+14],[x+24,y+14]],robot?red:'#45434c',null);
  line([[x-4,y-2],[x+24,y-12],[x+60,y-3]],ink,7);
  line([[x+2,y-25],[x+29,y-31],[x+53,y-25]],ink,5);
 }
 line([[190,207],[179,252],[192,258]],shadow,4);
 line([[164,285],[188,281],[216,285]],ink,3);
 line([[179,300],[201,299]],shadow,2);
 if(robot){
  // Sleek android panel seams and a crimson temple mark.
  line([[100,218],[122,263],[143,273]],ink,3);line([[284,217],[264,263],[245,273]],ink,3);
  path([[85,171],[107,173],[106,213],[87,210]],red);
  path([[280,171],[300,167],[298,209],[282,214]],red);
  path([[82,159],[86,95],[137,45],[239,49],[289,104],[299,162],[260,135],[228,93],[188,143],[166,100],[126,159]],'#26262d');
  path([[140,48],[237,53],[254,79],[161,67]],paper,null);
 }else{
  // Four original hair silhouettes: swept fringe, bob, short crop, and side part.
  const hair=moderator?'#ededeb':['#111117','#19131c','#151317','#33202b'][index%4];
  const styles=[
   [[83,184],[69,114],[97,118],[84,67],[131,79],[148,33],[180,61],[229,35],[238,70],[286,77],[302,130],[287,182],[259,137],[241,102],[217,173],[195,112],[154,174],[161,112],[112,181],[111,133]],
   [[79,265],[65,162],[88,87],[132,48],[244,52],[294,103],[310,266],[277,292],[276,165],[251,113],[207,176],[212,112],[167,166],[168,105],[108,172],[107,281]],
   [[86,189],[72,124],[93,100],[91,79],[114,74],[129,49],[165,53],[187,39],[224,54],[250,54],[279,83],[296,130],[286,184],[259,131],[246,105],[219,123],[198,101],[174,127],[150,101],[128,137],[107,136]],
   [[81,194],[72,129],[89,88],[135,51],[216,38],[272,75],[299,125],[289,184],[266,130],[228,94],[201,155],[167,191],[179,123],[140,171],[148,109],[104,180]],
  ];
  path(styles[moderator?3:index%4],hair);
  line(moderator?[[116,108],[167,77],[218,67]]:[[107,104],[153,74],[186,68]],moderator?'#9c9aa2':'#49404d',4);
  if(moderator){
   line([[105,191],[167,184],[171,211],[115,218],[105,191]],ink,4);
   line([[210,185],[273,190],[263,216],[210,211],[210,185]],ink,4);
   line([[170,195],[209,195]],ink,3);
  }
 }
 return canvas;
}
