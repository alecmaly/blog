---
layout: post
title: Image Slicing with Python
description: >-
    Slicing and manipulating images with a Python GUI program.
tags: Python CTF Image-Manipulation POC
toc: true
published: true
---

## Details

I recently worked on a CTF challenge with an image that was sliced into chunks and rearranged. The initial image looked like this:

<p class='codeblock-label'><a href='/assets/posts/2022/2022-01-25-Image-Slicing/bleepbloop_sliced.jpg' target='_blank'>bleepbloop_sliced.jpg</a></p>
<img src='/assets/posts/2022/2022-01-25-Image-Slicing/bleepbloop_sliced.jpg'>

I spent some time overengineering a python script to help me solve other CTF challenges like this in the future. I mostly wasted my time as challenges get very specific and highly customized. That said, the tool is still fun to use and can be found [here](https://github.com/alecmaly/hacking-myTools/blob/master/tools/images/img_slice_rearranger.py).

It should operate cross-platform and gives options to slice the image into desired chunks of size WIDTHxHEIGHT, you can then crop each slice, scale them, rotate them, and output into a grid of X columns. You can also dump the slices and run a custom script against them.

![script output](/assets/posts/2022/2022-01-25-Image-Slicing/2022-01-25-11-40-58.png)

Above you see the image has been reconstructed by taking slices of the skewed image, using slices of size 7x100, and rearranging the slices into a single row.

> Note that a simple command can be run to convert the image back, instead of using this tool:
> `convert -set colorspace Gray +append +repage -crop 266x100 bleepbloop_sliced.jpg original_image.jpg`

The code is sloppy and the functionality can also be slightly buggy as this was just a quick POC; I had no experience with the Pillow or tkinter GUI packages - it was just a fun side project for a few hours. That said, someone else may want to clean up and expand on or just open an image and play with it. Maybe one day it will actually be useful for something, who knows...

Cheers!