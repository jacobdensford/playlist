# Ripping Disks

## All

- Clean disk using microfiber cloth 
    - Use water, preferably distilled, if needed
    - A tiny deluded amount of mild dish soap may also be used
    - Be sure to let dry completely before continuing)
- Use a command such as `lsblk` or `blkid` to find the CD/DVD/BR drive (usually `/dev/sr0`)
- After following the specific steps for the type of media, sync to server with `rsync -avh --progress <dir of media> jacob@192.168.0.10:<dir for media>`

## CDs

## DVDs

### dvdbackup

See the man page and the [archlinux wiki dvdbackup page](https://wiki.archlinux.org/title/Dvdbackup) for more details.

- Run `dvdbackup -i <drive> -o <output dir> -M -p` to rip the whole disk

### HandBrakeCLI

*See `HandBrakeCLI --help` (or the [HandBrake command line reference](https://handbrake.fr/docs/en/latest/cli/command-line-reference.html)) and [Cli Options](https://handbrake.fr/docs/en/latest/cli/cli-options.html) for more details.*

Run `HandBrakeCLI --scan -i <VIDEO_TS dir>` and find all the info needed to customize the following command—main feature track number, audio tracks, and subtitle tracks.

Run the following command, replacing the `VIDEO_TS` location and output file:

```bash
HandBrakeCLI \
  -i ~/Downloads/media-staging/Fast\ And\ The\ Furious/VIDEO_TS \
  --main-feature \
  -o "The Fast and the Furious (2001).mkv" \
  -f av_mkv \
  -e x265 \
  -q 20 \
  --encoder-preset medium \
  --encoder-profile main \
  --comb-detect \
  --decomb \
  --markers \
  --all-audio \
  --aencoder copy \
  --all-subtitles
```

To customize audio tracks, use `--audio <track #>` instead of `--all-audio`, separating desired track numbers with a comma (`1,3,4`). For 5.1, usually include the ac3 track (most compatible 5.1). For stereo and compatibility, aac. If one or both formats aren't available, modify `--aencoder copy` to something like (depending on track numbers—this command maps to the `--audio` command, so you may change it to `--audio 1,1` for example) `--aencoder copy:ac3,av_aac`, `--ab 448,192`  and add something like `--mixdown 5point1,stereo`.

To customize subtitle tracks, use `--subtitle <track #>` just as above with audio instead of `--all-subtitles`. (If unwanted subtitles are burned in, use `--subtitle-burned=none`.)

If needed, run a test first by adding `--start-at duration:60 --stop-at duration:120`, adjusting start and stop as needed.

To ensure the output is as expected, run:

```bash
ffprobe -v error \
  -show_entries stream=index,codec_name,codec_type,channels \
  -of default=noprint_wrappers=1 \
  "The Fast and the Furious (2001).mkv"
```

As always, refer to the documentation (`HandBrakeCLI -help`) for anything unclear.

## Blu-Rays

- https://jellywatch.app/blog/best-handbrake-ffmpeg-settings-jellyfin-encode-2026
- H.265 Main 10
- RF 18–20

## Tools

- dvdbackup
- [MakeMKV](https://www.makemkv.com/)
- [ABCDE](https://abcde.einval.com/wiki/FrontPage)
- [HandBrake](https://handbrake.fr/)

## Other Links

- [Optical disc drive (arch wiki)](https://wiki.archlinux.org/title/Optical_disc_drive)
- [One World, One Region](https://tdb.rpc1.org/)
- [Automatic Ripping Machine](https://b3n.org/automatic-ripping-machine/)


