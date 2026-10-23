from PIL import Image
import os
import shutil
import time

def process():
    t0 = time.time()
    os.makedirs('assets/spreads', exist_ok=True)
    os.makedirs('assets/pages', exist_ok=True)
    os.makedirs('assets/thumbs', exist_ok=True)

    total_spreads = 254
    print(f"Processing all {total_spreads} spreads into assets/...")

    for s in range(1, total_spreads + 1):
        src_spread = f'pages/spread_{s}.webp'
        dest_spread = f'assets/spreads/spread_{s}.webp'
        src_thumb = f'thumbnails/thumb_{s}.webp'
        dest_thumb = f'assets/thumbs/thumb_{s}.webp'

        # 1. Copy spread to assets/spreads
        if os.path.exists(src_spread):
            shutil.copy2(src_spread, dest_spread)
            
            # Slice into single pages
            img = Image.open(src_spread)
            w, h = img.size
            p_left = (s - 1) * 2 + 1
            p_right = s * 2

            left_page = img.crop((0, 0, w // 2, h))
            right_page = img.crop((w // 2, 0, w, h))

            left_page.save(f'assets/pages/page_{p_left}.webp', format='WEBP', quality=80)
            right_page.save(f'assets/pages/page_{p_right}.webp', format='WEBP', quality=80)

        # 2. Copy thumb
        if os.path.exists(src_thumb):
            shutil.copy2(src_thumb, dest_thumb)

        if s % 50 == 0 or s == total_spreads:
            print(f"Processed spread {s}/{total_spreads} ({time.time() - t0:.1f}s)...")

    # Clean up old temporary folders
    shutil.rmtree('pages', ignore_errors=True)
    shutil.rmtree('thumbnails', ignore_errors=True)

    elapsed = time.time() - t0
    p_size = sum(os.path.getsize(os.path.join('assets/pages', f)) for f in os.listdir('assets/pages'))
    s_size = sum(os.path.getsize(os.path.join('assets/spreads', f)) for f in os.listdir('assets/spreads'))
    t_size = sum(os.path.getsize(os.path.join('assets/thumbs', f)) for f in os.listdir('assets/thumbs'))

    print("\n==================================================")
    print(f"Successfully processed all assets in {elapsed:.1f}s!")
    print(f"assets/pages (508 pages): {p_size / (1024*1024):.2f} MB")
    print(f"assets/spreads (254 spreads): {s_size / (1024*1024):.2f} MB")
    print(f"assets/thumbs (254 thumbnails): {t_size / (1024*1024):.2f} MB")
    print(f"Total optimized assets size: {(p_size + s_size + t_size) / (1024*1024):.2f} MB")
    print("==================================================")

if __name__ == '__main__':
    process()
