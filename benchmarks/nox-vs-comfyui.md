# Benchmark vs ComfyUI

ComfyUI and Nox run the same generation jobs on the same machine, so the timings are directly comparable. Each pipeline is generated twice: a Cold run in a fresh process (including model and pipeline load) and a Warm run immediately afterwards. Speedup is calculated as `ComfyUI time / Nox time`; above 1x means Nox was faster.

## Warm timings

Pipeline       | ComfyUI Warm | Nox Warm | Speedup
-------------- | ------------ | -------- | -------
anima          |        4.81s |    1.63s |   2.95x
flux2-klein-4b |        3.74s |    1.00s |   3.74x
flux2-klein-9b |        6.86s |    1.63s |   4.21x
ideogram4      |       13.36s |    4.94s |   2.70x
krea2          |       19.61s |    4.84s |   4.05x
ltx23          |       46.35s |   12.22s |   3.79x
ltx25          |       46.10s |   12.06s |   3.82x
minimaxh3      |       35.67s |   11.75s |   3.04x
qwen           |        9.50s |    2.73s |   3.48x
qwen21         |       34.33s |    8.40s |   4.09x
sdxl           |        6.38s |    4.58s |   1.39x
zimage         |       10.55s |    2.79s |   3.78x

## Cold timings and peak VRAM

Pipeline       | ComfyUI Cold | Nox Cold | Speedup | ComfyUI Peak VRAM | Nox Peak VRAM
-------------- | ------------ | -------- | ------- | ----------------- | -------------
anima          |        6.46s |    6.25s |   1.03x |         11.53 GiB |      5.41 GiB
flux2-klein-4b |        6.10s |    5.36s |   1.14x |         12.46 GiB |     13.61 GiB
flux2-klein-9b |       11.83s |   11.57s |   1.02x |         14.40 GiB |     13.53 GiB
ideogram4      |       16.53s |   15.33s |   1.08x |         14.96 GiB |     13.69 GiB
krea2          |       22.41s |   14.92s |   1.50x |         15.31 GiB |     13.69 GiB
ltx23          |       57.41s |   34.77s |   1.65x |         15.48 GiB |     13.86 GiB
ltx25          |       58.45s |   34.05s |   1.72x |         15.54 GiB |     13.99 GiB
minimaxh3      |       51.29s |   40.12s |   1.28x |         15.52 GiB |     13.69 GiB
qwen           |       17.54s |   19.03s |   0.92x |         15.27 GiB |     13.69 GiB
qwen21         |       38.63s |   14.61s |   2.64x |         15.43 GiB |     13.69 GiB
sdxl           |       10.94s |    7.11s |   1.54x |         15.39 GiB |     13.74 GiB
zimage         |       12.32s |    6.66s |   1.85x |         14.44 GiB |     13.74 GiB

ComfyUI total benchmark time: 486.29s
Nox total benchmark time: 278.34s

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

- GPU: NVIDIA GeForce RTX 4080 (SM 8.9), FP8 matmul supported, INT8 matmul supported, NVFP4 matmul unsupported
- ComfyUI version: 0.37.0
- ComfyUI PyTorch version: 2.9.1+cu128
