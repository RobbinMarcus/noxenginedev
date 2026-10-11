# Benchmark vs ComfyUI

ComfyUI and Nox run the same generation jobs on the same machine, so the timings are directly comparable. Each pipeline is generated twice: a Cold run in a fresh process (including model and pipeline load) and a Warm run immediately afterwards. Speedup is calculated as `ComfyUI time / Nox time`; above 1x means Nox was faster.

## Warm timings

Pipeline       | ComfyUI Warm | Nox Warm | Speedup
-------------- | ------------ | -------- | -------
anima          |        3.60s |    1.05s |   3.43x
flux2-klein-4b |        2.44s |    0.72s |   3.39x
flux2-klein-9b |        3.58s |    1.07s |   3.35x
ideogram4      |        6.26s |    2.92s |   2.14x
krea2          |        8.70s |    2.73s |   3.19x
ltx23          |       19.96s |    6.42s |   3.11x
ltx25          |       19.69s |    6.47s |   3.04x
minimaxh3      |       30.63s |    5.89s |   5.20x
qwen           |        4.77s |    1.63s |   2.93x
qwen21         |       16.52s |    4.80s |   3.44x
sdxl           |        9.07s |    2.27s |   4.00x
zimage         |        5.85s |    1.61s |   3.63x

## Cold timings and peak VRAM

Pipeline       | ComfyUI Cold | Nox Cold | Speedup | ComfyUI Peak VRAM | Nox Peak VRAM
-------------- | ------------ | -------- | ------- | ----------------- | -------------
anima          |       10.15s |    2.05s |   4.95x |         17.68 GiB |      5.41 GiB
flux2-klein-4b |       10.68s |    1.12s |   9.54x |         17.39 GiB |     28.70 GiB
flux2-klein-9b |       26.42s |    2.25s |  11.74x |         20.14 GiB |     21.64 GiB
ideogram4      |       16.76s |    4.28s |   3.92x |         20.21 GiB |     30.11 GiB
krea2          |       35.53s |    3.93s |   9.04x |         19.43 GiB |     30.11 GiB
ltx23          |       49.06s |   13.38s |   3.67x |         31.31 GiB |     30.44 GiB
ltx25          |       50.83s |    9.86s |   5.15x |         31.28 GiB |     30.45 GiB
minimaxh3      |       87.13s |   28.61s |   3.05x |         31.15 GiB |     30.36 GiB
qwen           |       30.91s |   15.26s |   2.03x |         28.61 GiB |     30.44 GiB
qwen21         |       38.59s |   14.79s |   2.61x |         27.24 GiB |     30.44 GiB
sdxl           |       40.66s |    6.43s |   6.32x |         28.78 GiB |     30.44 GiB
zimage         |       19.72s |    7.40s |   2.66x |         13.46 GiB |     30.44 GiB

ComfyUI total benchmark time: 547.51s
Nox total benchmark time: 146.95s

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

- GPU: NVIDIA GeForce RTX 5090 (SM 12.0), FP8 matmul supported, INT8 matmul supported, NVFP4 matmul supported
- ComfyUI version: 0.37.0
- ComfyUI PyTorch version: 2.9.1+cu128
