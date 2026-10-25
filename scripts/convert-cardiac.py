import sys,subprocess
sys.path.insert(0,'work/media-tools')
import imageio_ffmpeg
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-i','dist/assets/medical/cardiac-mri.ogv','-an','-c:v','libvpx-vp9','-lossless','1','-pix_fmt','yuv420p','dist/assets/medical/cardiac-mri.webm'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
