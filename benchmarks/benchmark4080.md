# Benchmark vs ComfyUI

ComfyUI and Nox run the same generation jobs on the same machine, so the timings are directly comparable. Each pipeline is generated twice: a Cold run in a fresh process (including model and pipeline load) and a Warm run immediately afterwards. Speedup is calculated as `ComfyUI time / Nox time`; above 1x means Nox was faster.

## Warm timings

Pipeline       | ComfyUI Warm | Nox Warm | Speedup
-------------- | ------------ | -------- | -------
anima          |        4.61s |    1.66s |   2.78x
flux2-klein-4b |        3.53s |    1.10s |   3.21x
flux2-klein-9b |        6.56s |    1.83s |   3.58x
ideogram4      |       12.84s |    4.96s |   2.59x
krea2          |       18.70s |    4.87s |   3.84x
ltx23          |       29.37s |   11.57s |   2.54x
ltx25          |       29.18s |   11.88s |   2.46x
minimaxh3      |       36.27s |   11.73s |   3.09x
qwen           |        9.50s |    2.77s |   3.43x
qwen21         |       35.50s |    8.30s |   4.28x
sdxl           |        6.25s |    4.52s |   1.38x
zimage         |       10.44s |    2.75s |   3.80x

## Cold timings and peak VRAM

Pipeline       | ComfyUI Cold | Nox Cold | Speedup | ComfyUI Peak VRAM | Nox Peak VRAM
-------------- | ------------ | -------- | ------- | ----------------- | -------------
anima          |        6.25s |    3.65s |   1.71x |         11.60 GiB |      5.41 GiB
flux2-klein-4b |        5.74s |    3.85s |   1.49x |         12.64 GiB |     13.83 GiB
flux2-klein-9b |       11.49s |    7.35s |   1.56x |         14.72 GiB |     13.73 GiB
ideogram4      |       15.92s |   11.60s |   1.37x |         15.08 GiB |     13.83 GiB
krea2          |       21.75s |   12.88s |   1.69x |         14.42 GiB |     13.83 GiB
ltx23          |       39.61s |   27.14s |   1.46x |         15.48 GiB |     13.83 GiB
ltx25          |       40.81s |   26.55s |   1.54x |         15.49 GiB |     13.83 GiB
minimaxh3      |       53.68s |   30.10s |   1.78x |         15.33 GiB |     13.83 GiB
qwen           |       17.54s |   14.78s |   1.19x |         15.48 GiB |     13.83 GiB
qwen21         |       40.25s |   13.78s |   2.92x |         15.41 GiB |     13.83 GiB
sdxl           |       11.02s |    7.53s |   1.46x |         15.21 GiB |     13.83 GiB
zimage         |       12.17s |    7.75s |   1.57x |         14.58 GiB |     13.83 GiB

ComfyUI total benchmark time: 478.98s
Nox total benchmark time: 234.93s

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
