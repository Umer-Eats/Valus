import {mountCardiacMRI} from './cardiac-mri.js';
import {mountBloodstream} from './bloodstream.js';
import {mountMedicalVideo} from './medical-video.js';

export function mountMedicalBackground(canvas,kind){
 if(kind==='overview'){canvas.dataset.centered='true';return mountBloodstream(canvas);}
 if(kind==='event')return mountCardiacMRI(canvas);
 const source=({analytics:'neurons',assignments:'dna-helix'})[kind]||'cells';
 return mountMedicalVideo(canvas,source);
}
