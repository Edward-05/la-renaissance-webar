#!/bin/zsh
cd -- "$(dirname -- "$0")" || exit 1
printf 'WebAR preview: http://localhost:8766
Keep this window open. Press Control+C to stop.
'
open 'http://localhost:8766'
python3 -m http.server 8766 --bind 127.0.0.1 --directory "$PWD"
