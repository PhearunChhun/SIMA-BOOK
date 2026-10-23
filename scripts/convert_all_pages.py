import pypdfium2 as pdfium
import os
import time

def convert_all():
    t0 = time.time()
    pdf_path = 'book.pdf'
    if not os.path.exists(pdf_path):
        pdf_path = 'The SIMA Journey Book .pdf'
    
    print(f"Loading {pdf_path}...")
    pdf = pdfium.PdfDocument(pdf_path)
    total = len(pdf)
    print(f"Total spreads to convert: {total}")

    os.makedirs('pages', exist_ok=True)
    os.makedirs('thumbnails', exist_ok=True)

    total_bytes_pages = 0
    total_bytes_thumbs = 0

    for i in range(total):
        spread_num = i + 1
        page = pdf[i]

        # 1. High-Quality WebP for Reading (1296x972)
        # Scale 1.5 corresponds to 1296 x 972 for 864 x 648 PDF points
        image = page.render(scale=1.5).to_pil()
        page_file = f'pages/spread_{spread_num}.webp'
        image.save(page_file, format='WEBP', quality=80)
        total_bytes_pages += os.path.getsize(page_file)

        # 2. Ultra-Lightweight Thumbnail for Grid & Instant Preview (324x243)
        # Scale 0.375 corresponds to 324 x 243
        thumb_image = page.render(scale=0.375).to_pil()
        thumb_file = f'thumbnails/thumb_{spread_num}.webp'
        thumb_image.save(thumb_file, format='WEBP', quality=65)
        total_bytes_thumbs += os.path.getsize(thumb_file)

        if spread_num % 25 == 0 or spread_num == total:
            elapsed = time.time() - t0
            print(f"Converted {spread_num}/{total} spreads ({elapsed:.1f}s)...")

    elapsed_total = time.time() - t0
    print("\n==================================================")
    print(f"✅ All {total} spreads successfully converted!")
    print(f"⏱️ Total time: {elapsed_total:.1f}s ({elapsed_total/total*1000:.1f}ms per spread)")
    print(f"📦 Total pages directory size: {total_bytes_pages / (1024*1024):.2f} MB")
    print(f"🖼️ Total thumbnails size: {total_bytes_thumbs / (1024*1024):.2f} MB")
    print("==================================================")

if __name__ == '__main__':
    convert_all()
