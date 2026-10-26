# Medical animation sources and rendering

## Integrated assets

- **Neural anatomy:** NeuroMorpho.Org NMO_1, Wearne/Hof `cnic_001`, CC BY 4.0. Original SWC and API provenance are in `dist/assets/medical/`. The reconstruction has 1,274 compartments. It is a rhesus macaque prefrontal layer-3 pyramidal neuron (soma and dendrites; no reconstructed axon). Three transformed copies form the scene. The renderer produces tapering 10-sided branch meshes, detailed somata, illustrative organelles, and instanced dendritic spines. Branch diameter is exaggerated for visibility. Traveling emission follows cumulative source-branch distances; it is not a measured firing record.
- **Cardiac scan:** Zhang, Uecker, Voit, Merboldt, and Frahm (2010), real-time two-chamber MRI, CC BY 2.0. Original OGV: 463 × 463, approximately 7.8 seconds. Browser WebM is a lossless VP9 transcode of the decoded original, retaining its actual resolution. Playback loops at the source speed. The image perimeter is feathered into the theme. No AI upscaling, generated chambers, or invented diagnostic detail.
- **Renderer:** Three.js 0.180.0, locally vendored with its MIT license. Loaded dynamically only on Analytics. All media is locally served.

## Research and selection

- https://neuromorpho.org/useterm.jsp — CC BY terms and required citations.
- https://neuromorpho.org/api/neuron/id/1 — source metadata, morphology scope, and original publication DOIs.
- https://ki-images.mit.edu/2012/bosch-4 — Miquel Bosch microscopy image and description; used as visual reference, not bundled.
- https://commons.wikimedia.org/wiki/File:Real-time_MRI_of_a_human_heart_(2-chamber_view).ogv — source footage and license.
- https://commons.wikimedia.org/wiki/File:4-CH_cine_normal.gif — evaluated, but lower resolution (304 × 304).
- https://commons.wikimedia.org/wiki/File:Four_chamber_cardiovascular_magnetic_resonance_imaging.gif — evaluated, but lower resolution (200 × 200).
- https://sketchfab.com/3d-models/neuron-d40557a1e4154267b78117433bc51296 — evaluated CC BY mesh, 66.9k triangles. Chose measured morphology instead, allowing branch-aware signal animation without relying on marketplace downloads.
- https://sketchfab.com/3d-models/animated-human-heart-cross-section-6736a2b663d5421a956bd60778fcd877 — evaluated external anatomy animation; a surface mesh does not provide real MRI intensities.
- https://allensdk.readthedocs.io/en/latest/cell_types.html and https://alleninstitute.org/legal/terms-of-use/ — evaluated; did not bundle content restricted to noncommercial reuse.

The dashboard footer links to `dist/medical-credits.html`, which includes authors, source links, license links, modifications and citations.

## Behavior and validation

Both renderers stop when hidden and honor reduced motion. Route cleanup releases GPU resources, cancels downloads and animation callbacks, and unloads video. Assets do not require external runtime requests. New loads identify readiness through `data-renderer`, including an explicit unavailable state.

`check-dashboard-ui.mjs` verifies both roles, light/dark themes, mobile overflow, and renderer readiness. `check-medical-motion.mjs` compares rendered frames to verify animation and reduced-motion stillness. The latter isolates the backdrop so the independently animated study companion cannot cause false failures.

The local converter can be reproduced by installing `imageio-ffmpeg` into `work/media-tools` with the bundled Python, then running `scripts/convert-cardiac.py`. That tools directory is ignored by Git.

## Current dashboard backgrounds (2026-10-25)

Overview uses the original centered Valus procedural bloodstream for both student and instructor roles. Its reduced-motion preference updates immediately when changed.

| Page | Renderer or asset | Source section | Delivered resolution |
| --- | --- | --- | --- |
| Student/instructor overview | bloodstream.js | Original Valus animation | Adaptive WebGL |
| Analytics | neurons-loop.webm | Starostecka, 83.8–89.6 s | 1920 × 1080 |
| Assignments | dna-helix-loop.webm | Tommaso Raso / Pexels, 1–11 s | 1920 × 1080 |
| Community, students, rankings | cells-loop.webm | Starostecka, 90–94.5 s | 1920 × 1080 |
| My Event | cardiac-mri.webm | Existing MRI | 463 × 463 |

DNA source: https://www.pexels.com/video/abstract-3d-dna-helix-animation-in-4k-30769473/ by Tommaso Raso. Website use and adaptation allowed by https://www.pexels.com/license/ (checked 2026-10-25). Downloaded rendition is 2560 × 1440, downscaled to 1080p. This decorative particle animation replaces the former horizontal yourgenome DNA footage; it is not an experimental molecular recording.

Reproduce with `scripts/prepare-medical-loops.py` (Python + imageio-ffmpeg). Optional clip names limit processing, e.g. `dna-helix`. Store sources in ignored `work/medical-sources/`:
- `neurons.webm`: https://upload.wikimedia.org/wikipedia/commons/e/e2/Animation_of_the_anatomy_and_physiology_of_the_human_brain_AS.webm
- `dna-helix.mp4`: https://videos.pexels.com/video-files/30769473/13161986_2560_1440_30fps.mp4

All three active animation clips are silent VP9, crossfaded over 0.6 seconds at the loop boundary. No AI upscaling. Credits are in `dist/medical-credits.html`. Neurons/cells use CC BY 4.0; DNA uses the Pexels License. Previous DNA and stock blood files are retained but not loaded by the active backgrounds.
