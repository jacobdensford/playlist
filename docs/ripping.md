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

Input drive should be `/dev/sr0` or `/dev/dvd`.

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

**Note:** `--comb-detect`/`--decomb` only fix interlacing — most NTSC movie DVDs are actually telecined (24fps film via 3:2 pulldown), which decomb doesn't undo. Add `--detelecine` alongside them (bare, using its defaults) to restore the true progressive framerate on those discs; it only acts on frames it identifies as telecined, so it's safe to include by default. Also consider adding `--audio-fallback ac3` (or similar) so `--aencoder copy` doesn't hard-fail on a track that can't be passed through.

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

**Note:** to specifically confirm detelecine/decomb worked (no residual judder or combing), also run `ffmpeg -filter:v idet -frames:v 300 -an -f null -i "The Fast and the Furious (2001).mkv"`, which reports counts of progressive vs. interlaced (TFF/BFF) frames.

**Review note (2026-07-31):** the core codec/quality choices above (mkv, x265 CQ ~20, `--comb-detect`+`--decomb`, `--markers`, `--main-feature`) are in line with common community practice for DVD rips. A few gaps worth keeping in mind for Jellyfin cross-device compatibility with minimal transcoding: (1) black bars on widescreen DVDs are already handled — HandBrake's `--crop-mode` defaults to `auto` (crops automatically) even though the command never sets it explicitly, but this isn't foolproof, so if a scan or the output still looks letterboxed, override with `--crop-mode conservative` or an explicit `--crop top:bottom:left:right`; (2) `--detelecine` and `--audio-fallback ac3` are mentioned above only as prose asides, not in the actual runnable command block, so copy-pasting the block as-is misses them; (3) `--aencoder copy` alone has no fallback for clients that can't direct-play the source codec (DTS, or AC3 on some web/Safari clients) — the `copy:ac3,av_aac` pattern described above for customizing audio tracks is worth making the default rather than an optional tweak, so 5.1 AC3 passthrough stays available for receivers while an AAC stereo track covers browsers/mobile without a server-side transcode; (4) `--all-subtitles` will include the DVD's VOBSUB (image-based) tracks, which most non-desktop Jellyfin clients can't render without a burn-in transcode, so it's worth narrowing to the tracks actually wanted; (5) x265 is a fine default, but its compression advantage over x264 is much smaller at DVD (480i/576i) resolution than at 1080p/4K, so x264 remains the safer choice specifically for older or embedded hardware that lacks HEVC decode support.

**Preset comparison note (2026-07-31):** checked HandBrake's own built-in presets against this doc's hand-built command, using the canonical `preset_builtin.json` from HandBrake's GitHub repo directly — this machine's local `HandBrakeCLI --preset-export` turned out to ignore whatever preset name it's given and return the same generic CLI-defaults template regardless (confirmed by passing it a nonexistent preset name and getting identical output back), so its numbers weren't trustworthy and aren't used here. The closest official match to this doc's intent is `Matroska/H.265 MKV 480p30` (or `576p25` for PAL): it uses mkv + `x265_10bit` (Main 10 profile, not the 8-bit Main this doc assumed was the safer pick — HandBrake's own preset uses 10-bit even for SD sources, so that assumption above should be revised: Main10 looks like the more mainstream default, at some cost to older/embedded hardware decode support) at CQ 20 with the "slow" encoder preset (this doc uses "medium" — slightly slower for marginal gain, not wrong). Its `PictureCombDetectPreset: default` + `PictureDeinterlaceFilter: decomb` matches this doc's `--comb-detect --decomb` combo exactly, which is good confirmation. Notably, though, its `PictureDetelecine` is `off` by default — HandBrake's own official preset does not enable detelecine automatically even though the filter only acts on frames it identifies as telecined, which softens the suggestion above to fold `--detelecine` into the base command; better framing is "add it per-disc when a specific NTSC/film-sourced title needs it" rather than "bake it into the default for every rip." On audio, the official preset uses a single track only (`copy:aac` with `aac` stereo 160kbps fallback) — it sacrifices surround entirely for guaranteed direct-play everywhere, rather than doing a dual surround-passthrough-plus-stereo-fallback pair. Cross-checked against the [jellywatch.app Jellyfin encoding guide](https://jellywatch.app/blog/best-handbrake-ffmpeg-settings-jellyfin-encode-2026) already linked below for Blu-rays, which takes the opposite audio stance: it explicitly recommends a surround-passthrough track (EAC3/AC3) plus a stereo AAC fallback specifically so "every device picks the track it can handle," and separately warns "do NOT add PGS or VobSub — image-based subtitles force a full video transcode," which backs up the concern raised above about `--all-subtitles` pulling in DVD VOBSUB tracks. Net for this doc's stated goal (Jellyfin, cross-device, minimal transcoding): the dual-audio-track approach is a better target than either this doc's plain `--aencoder copy` or HandBrake's single-track official preset; the crop and comb-detect defaults are already correct and match HandBrake's own choices; detelecine is better treated as a per-disc addition than a blanket default; and the x265 Main-vs-Main10 profile choice is a genuine open tradeoff (compatibility vs. compression) rather than a clear-cut pick, worth deciding deliberately rather than defaulting silently either way.

**Alternative: generally safe default command (2026-07-31)** — synthesizing both review notes above into one command to default to for every DVD, rather than hand-tuning each disc from scratch:

```bash
HandBrakeCLI \
  -i <VIDEO_TS dir> \
  --main-feature \
  -o "<Title (Year)>.mkv" \
  -f av_mkv \
  -e x265 \
  -q 20 \
  --encoder-preset medium \
  --encoder-profile main \
  --crop-mode auto \
  --comb-detect \
  --decomb \
  --detelecine \
  --markers \
  --audio 1,1 \
  --aencoder copy:ac3,av_aac \
  --audio-fallback ac3 \
  --ab 448,192 \
  --mixdown 5point1,stereo \
  --subtitle scan \
  --subtitle-forced
```

Deviates from the main example above in: making crop-mode explicit rather than relying on the silent default; folding `--detelecine` into the base command instead of leaving it as a prose aside (safe here since it's a no-op on non-telecined sources); staying on `--encoder-profile main` (8-bit) rather than the Main10 that HandBrake's own official preset uses, favoring wider hardware decode compatibility over HandBrake's slightly-better compression efficiency, since the DVD source is 8-bit anyway; replacing `--all-audio`/`copy` with an explicit AC3-passthrough-plus-AAC-stereo-fallback pair so surround stays available on TVs/receivers while phones/browsers never trigger a server-side audio transcode (per the jellywatch.app guide linked below, not HandBrake's own single-track official preset, which drops surround entirely); and replacing `--all-subtitles` with `--subtitle scan --subtitle-forced` to avoid pulling in full VOBSUB tracks that force a burn-in transcode on most non-desktop clients. As always, run `--scan` on the actual disc first — the `1,1` audio-track placeholder assumes track 1 is the main 5.1 track, which should be confirmed (and adjusted for stereo-only sources) per disc.

## Blu-Rays

- https://jellywatch.app/blog/best-handbrake-ffmpeg-settings-jellyfin-encode-2026
- H.265 Main 10
- RF 18–20

**Review note — LLM-generated, unverified, regular (1080p) Blu-ray only (2026-07-31):** this section only lists a codec/quality target and a link, with no actual command or ripping-tool step, unlike the DVD section above. The following expands on it using web research and HandBrake's own official presets (extracted from the same `preset_builtin.json` used for the DVD comparison above), but none of it has been tested against an actual Blu-ray disc or MakeMKV output on this machine — confirm before relying on it. This is scoped specifically to regular 1080p Blu-ray, not 4K/UHD Blu-ray, which has its own HDR10/HDR10+ metadata and tone-mapping concerns that don't apply here.

Unlike DVD, HandBrakeCLI can't read most commercial Blu-ray discs directly — they use AACS/BD+ encryption HandBrake doesn't handle — so [MakeMKV](https://www.makemkv.com/) (already listed under Tools below) is the actual required first step: it decrypts and demuxes the disc to an intermediate `.mkv` with all tracks intact, and HandBrake then encodes from that file rather than from a BDMV folder. This section should probably note that dependency explicitly rather than only listing MakeMKV as a generic tool further down the page.

x265 Main10 at RF 18–20, as this section already states, is a reasonable target for regular 1080p Blu-ray specifically — at DVD's SD resolution the Main-vs-Main10 profile tradeoff (see the DVD preset-comparison note above) was a genuine toss-up, but at true 1080p the compression benefit of 10-bit x265 is more worthwhile and lines up with jellywatch.app's own recommendation of CQ 20 for standard 1080p content.

Audio is the biggest gotcha inherited from the MakeMKV rip: Blu-ray's lossless tracks (TrueHD, DTS-HD Master Audio) can't be passed through by HandBrake — per HandBrake/MakeMKV forum discussion, HandBrake can decode and re-encode them but not copy them byte-for-byte — so the same dual-track approach used for DVD applies here too: re-encode down to an AC3 5.1 track (with `--audio-fallback ac3` in case the disc's compatibility track isn't already AC3) plus an AAC stereo track, rather than trying to preserve the lossless track untouched. This also matches HandBrake's own official "HQ 1080p30 Surround" preset, which pairs a `copy:ac3` (640kbps) track with an AAC stereo (160kbps) track instead of attempting lossless passthrough.

Suggested alternative command (again: LLM-generated and unverified, confirm before use), assuming `<ripped>.mkv` is MakeMKV's output for the main title:

```bash
HandBrakeCLI \
  -i "<ripped>.mkv" \
  -o "<Title (Year)>.mkv" \
  -f av_mkv \
  -e x265_10bit \
  -q 19 \
  --encoder-preset slow \
  --crop-mode auto \
  --comb-detect \
  --decomb \
  --markers \
  --audio 1,1 \
  --aencoder copy:ac3,av_aac \
  --audio-fallback ac3 \
  --ab 640,160 \
  --mixdown 5point1,stereo \
  --subtitle scan \
  --subtitle-forced
```

`--detelecine` is dropped here versus the DVD default — Blu-ray masters are sourced progressive rather than through an interlaced/telecined broadcast chain, so it shouldn't be needed (also unverified; worth confirming with `ffmpeg -filter:v idet` on the output, same as the DVD workflow, if anything looks off). As with the DVD command, `--audio 1,1` is a placeholder for the main 5.1 track's index and must be confirmed per disc with `--scan`.

## Tools

- dvdbackup
- [MakeMKV](https://www.makemkv.com/)
- [ABCDE](https://abcde.einval.com/wiki/FrontPage)
- [HandBrake](https://handbrake.fr/)

## Other Links

- [Optical disc drive (arch wiki)](https://wiki.archlinux.org/title/Optical_disc_drive)
- [One World, One Region](https://tdb.rpc1.org/)
- [Automatic Ripping Machine](https://b3n.org/automatic-ripping-machine/)


