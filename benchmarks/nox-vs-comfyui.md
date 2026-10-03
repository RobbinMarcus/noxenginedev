# Benchmark vs ComfyUI

Nox speedup is calculated as `ComfyUI time / Nox time`. A value above 1x means Nox was faster; a value below 1x means ComfyUI was faster.

Pipeline       | ComfyUI Warm | Nox Warm | Speedup
-------------- | ------------ | -------- | -------
anima          |        4.81s |    1.73s |   2.78x
flux2-klein-4b |        3.74s |    1.07s |   3.50x
flux2-klein-9b |        6.86s |    1.73s |   3.97x
ideogram4      |       13.36s |    5.24s |   2.55x
krea2          |       19.61s |    5.16s |   3.80x
ltx23          |       46.35s |   12.19s |   3.80x
ltx25          |       46.10s |   12.77s |   3.61x
minimaxh3      |       35.67s |   13.53s |   2.64x
qwen           |        9.50s |    2.82s |   3.37x
qwen21         |       34.33s |    8.72s |   3.94x
sdxl           |        6.38s |    4.77s |   1.34x
zimage         |       10.55s |    2.91s |   3.63x

Cold timings and peak VRAM

Pipeline       | ComfyUI Cold | Nox Cold | Speedup | ComfyUI Peak VRAM | Nox Peak VRAM
-------------- | ------------ | -------- | ------- | ----------------- | -------------
anima          |        6.46s |    3.86s |   1.67x |         11.53 GiB |      5.41 GiB
flux2-klein-4b |        6.10s |    5.37s |   1.14x |         12.46 GiB |     13.43 GiB
flux2-klein-9b |       11.83s |    6.93s |   1.71x |         14.40 GiB |     13.17 GiB
ideogram4      |       16.53s |   13.27s |   1.25x |         14.96 GiB |     13.43 GiB
krea2          |       22.41s |   12.48s |   1.80x |         15.31 GiB |     13.43 GiB
ltx23          |       57.41s |   36.54s |   1.57x |         15.48 GiB |     13.43 GiB
ltx25          |       58.45s |   35.16s |   1.66x |         15.54 GiB |     13.50 GiB
minimaxh3      |       51.29s |   38.59s |   1.33x |         15.52 GiB |     13.43 GiB
qwen           |       17.54s |   15.77s |   1.11x |         15.27 GiB |     13.43 GiB
qwen21         |       38.63s |   17.64s |   2.19x |         15.43 GiB |     13.43 GiB
sdxl           |       10.94s |    7.32s |   1.49x |         15.39 GiB |     13.43 GiB
zimage         |       12.32s |    7.65s |   1.61x |         14.44 GiB |     13.43 GiB

ComfyUI total benchmark time: 486.29s
Nox total benchmark time: 288.10s

Peak VRAM is reported using each benchmark's native measurement method: actual device usage for ComfyUI and tracked allocation peak for Nox.
