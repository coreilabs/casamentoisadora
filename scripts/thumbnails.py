"""Generate resumable WebP thumbnails with ImageMagick; full photos are untouched."""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets/gallery-thumbs'
STATE = ROOT / 'scripts/thumbnails-progress.json'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--width', type=int, default=320)
    parser.add_argument('--quality', type=int, default=76)
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    if args.width < 1 or not 1 <= args.quality <= 100 or not 1 <= args.workers <= 8:
        parser.error('width must be positive, quality 1..100, workers 1..8')
    magick = shutil.which('magick')
    if not magick:
        parser.error('ImageMagick must be available on PATH.')
    if (ROOT / 'scripts/webp-conversion.lock').exists():
        parser.error('Wait until the full photo conversion finishes.')
    lock = ROOT / 'scripts/thumbnails.lock'
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        parser.error('Another thumbnail conversion is running.')
    os.close(fd)
    try:
        DEST.mkdir(parents=True, exist_ok=True)
        state = json.loads(STATE.read_text(encoding='utf-8')) if STATE.exists() else {}
        files = sorted(p for p in (ROOT / 'assets/gallery-webp').glob('*.webp')
                       if not p.name.endswith('.tmp.webp'))
        if not files:
            parser.error('No full WebP photos found. Run convert_webp.py first.')

        def current(path):
            entry = state.get(path.name, {})
            target = DEST / path.name
            stat = path.stat()
            return (entry.get('mtime_ns') == stat.st_mtime_ns
                    and entry.get('source_bytes') == stat.st_size
                    and entry.get('max_width') == args.width and entry.get('quality') == args.quality
                    and target.is_file() and entry.get('bytes') == target.stat().st_size)

        def convert(path):
            target = DEST / path.name
            temporary = target.with_suffix('.tmp.webp')
            stat = path.stat()
            try:
                subprocess.run([magick, str(path), '-auto-orient', '-resize', f'{args.width}x>',
                                '-strip', '-quality', str(args.quality), '-define', 'webp:method=4',
                                str(temporary)], check=True, capture_output=True, timeout=120,
                               env={**os.environ, 'MAGICK_THREAD_LIMIT': '1'})
                result = subprocess.run([magick, '-regard-warnings', str(temporary), '-format',
                                         '%w %h', 'info:'], check=True, capture_output=True,
                                        text=True, timeout=120)
                width, height = map(int, result.stdout.split())
                if not 0 < width <= args.width or height < 1 or temporary.stat().st_size == 0:
                    raise ValueError('Invalid thumbnail output')
                if path.stat().st_mtime_ns != stat.st_mtime_ns or path.stat().st_size != stat.st_size:
                    raise ValueError('Source changed during conversion; rerun the script')
                os.replace(temporary, target)
                return path.name, dict(mtime_ns=stat.st_mtime_ns, source_bytes=stat.st_size,
                                      max_width=args.width, quality=args.quality,
                                      bytes=target.stat().st_size, width=width, height=height)
            finally:
                temporary.unlink(missing_ok=True)

        pending = [p for p in files if not current(p)]
        print(f'{len(files)} photos | {len(pending)} pending thumbnails', flush=True)
        failures = 0
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            for start in range(0, len(pending), 100):
                futures = {pool.submit(convert, p): p for p in pending[start:start + 100]}
                for future in as_completed(futures):
                    try:
                        name, entry = future.result()
                        state[name] = entry
                    except Exception as error:
                        failures += 1
                        print(f'ERROR {futures[future].name}: {error}', flush=True)
                temporary = STATE.with_suffix('.tmp.json')
                temporary.write_text(json.dumps(state, separators=(',', ':')), encoding='utf-8')
                os.replace(temporary, STATE)
                print(f'Processed {min(start + 100, len(pending))}/{len(pending)} | {failures} errors', flush=True)
        subprocess.run([sys.executable, str(ROOT / 'scripts/catalog.py')], check=True)
        subprocess.run([sys.executable, str(ROOT / 'scripts/version_assets.py'), '--force'], check=True)
        ready = [p for p in files if current(p)]
        size = sum((DEST / p.name).stat().st_size for p in ready)
        print(f'Ready: {len(ready)}/{len(files)} | thumbnails {size / 1e6:.2f} MB', flush=True)
        return 1 if failures else 0
    finally:
        lock.unlink(missing_ok=True)


if __name__ == '__main__':
    sys.exit(main())
