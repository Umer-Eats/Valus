"""Prepare licensed local loops. Source URLs and permissions: MEDICAL_MODELS.md."""
import sys, subprocess
from pathlib import Path
sys.path.insert(0, 'work/media-tools')
import imageio_ffmpeg
ff = imageio_ffmpeg.get_ffmpeg_exe()
# name, source, in-point, length, crop; retain native resolution (never upscale).
clips = [('neurons','neurons.webm',83.8,5.8,None),('dna-helix','dna-helix.mp4',1,10,'scale=1920:1080'),('cells','neurons.webm',90,4.5,None)]
for name, source, start, length, crop in clips:
    if len(sys.argv)>1 and name not in sys.argv[1:]: continue
    blend = .6
    base = ('%s,' % crop if crop else '') + 'fps=30,format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS'
    graph = f'[0:v]{base},split=3[h][m][t];[h]trim=0:{blend},setpts=PTS-STARTPTS,fps=30[head];[m]trim={blend}:{length-blend},setpts=PTS-STARTPTS[main];[t]trim={length-blend}:{length},setpts=PTS-STARTPTS,fps=30[tail];[tail][head]xfade=transition=fade:duration={blend}:offset=0[seam];[main][seam]concat=n=2:v=1:a=0[out]'
    dest = Path('dist/assets/medical') / f'{name}-loop.webm'
    subprocess.run([ff,'-hide_banner','-loglevel','error','-y','-ss',str(start),'-t',str(length),'-i',f'work/medical-sources/{source}','-filter_complex',graph,'-map','[out]','-an','-c:v','libvpx-vp9','-crf','26','-b:v','0','-cpu-used','4','-row-mt','1',str(dest)],check=True)
    print(f'{dest}: {dest.stat().st_size/1024/1024:.2f} MiB',flush=True)

