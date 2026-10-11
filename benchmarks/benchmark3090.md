# Benchmark vs ComfyUI

ComfyUI and Nox run the same generation jobs on the same machine, so the timings are directly comparable. Each pipeline is generated twice: a Cold run in a fresh process (including model and pipeline load) and a Warm run immediately afterwards. Speedup is calculated as `ComfyUI time / Nox time`; above 1x means Nox was faster.

## Warm timings

Pipeline       | ComfyUI Warm | Nox Warm | Speedup
-------------- | ------------ | -------- | -------
anima          |        6.15s |    2.39s |   2.57x
flux2-klein-4b |        4.25s |    1.45s |   2.93x
flux2-klein-9b |        7.98s |    2.55s |   3.13x
ideogram4      |       16.56s |    8.17s |   2.03x
krea2          |       22.92s |    7.92s |   2.89x
ltx23          |       37.52s |   15.45s |   2.43x
ltx25          |       36.22s |   14.98s |   2.42x
minimaxh3      |       41.10s |   18.66s |   2.20x
qwen           |        9.49s |    4.00s |   2.37x
qwen21         |       42.73s |   13.19s |   3.24x
sdxl           |        8.61s |    6.27s |   1.37x
zimage         |       12.71s |    3.99s |   3.19x

## Cold timings and peak VRAM

Pipeline       | ComfyUI Cold | Nox Cold | Speedup | ComfyUI Peak VRAM | Nox Peak VRAM
-------------- | ------------ | -------- | ------- | ----------------- | -------------
anima          |        9.07s |    5.75s |   1.58x |         19.99 GiB |      5.41 GiB
flux2-klein-4b |        7.36s |    5.86s |   1.26x |         19.28 GiB |     20.26 GiB
flux2-klein-9b |       15.80s |   11.40s |   1.39x |         22.00 GiB |     20.26 GiB
ideogram4      |       22.41s |   20.35s |   1.10x |         22.56 GiB |     20.34 GiB
krea2          |       28.49s |   19.06s |   1.49x |         21.83 GiB |     20.34 GiB
ltx23          |       55.38s |   38.38s |   1.44x |         23.51 GiB |     20.36 GiB
ltx25          |       55.08s |   38.36s |   1.44x |         23.40 GiB |     20.36 GiB
minimaxh3      |       61.72s |   47.45s |   1.30x |         23.48 GiB |     20.37 GiB
qwen           |       22.14s |   21.24s |   1.04x |         22.86 GiB |     20.43 GiB
qwen21         |       48.21s |   22.13s |   2.18x |         20.95 GiB |     20.43 GiB
sdxl           |       13.92s |   10.51s |   1.32x |         22.36 GiB |     20.43 GiB
zimage         |       14.71s |   10.84s |   1.36x |         14.76 GiB |     20.43 GiB

ComfyUI total benchmark time: 600.52s
Nox total benchmark time: 350.34s

Peak VRAM is reported using each benchmark's native measurement method: actual device usage for ComfyUI and tracked allocation peak for Nox.

## What is measured

Every pipeline runs its built-in generation preset with the same fixed prompts and a deterministic seed (42 for Cold, 43 for Warm). Image pipelines render a single 1024x1024 frame. Video pipelines render at 24 fps: LTX-2.3 and LTX-2.5 render 121 frames at 512x768, and MiniMax-H3 renders 56 frames at 512x768.

Pipeline       | Output | Resolution | Frames
-------------- | ------ | ---------- | ------
anima          |  Image |  1024x1024 |      -
flux2-klein-4b |  Image |  1024x1024 |      -
flux2-klein-9b |  Image |  1024x1024 |      -
ideogram4      |  Image |  1024x1024 |      -
krea2          |  Image |  1024x1024 |      -
ltx23          |  Video |    512x768 |    121
ltx25          |  Video |    512x768 |    121
minimaxh3      |  Video |    512x768 |     56
qwen           |  Image |  1024x1024 |      -
qwen21         |  Image |  1024x1024 |      -
sdxl           |  Image |  1024x1024 |      -
zimage         |  Image |  1024x1024 |      -

## Environment

- GPU: NVIDIA GeForce RTX 3090 (SM 8.6), FP8 matmul unsupported, INT8 matmul supported, NVFP4 matmul unsupported
- ComfyUI version: 0.37.0
- ComfyUI PyTorch version: 2.9.1+cu128
