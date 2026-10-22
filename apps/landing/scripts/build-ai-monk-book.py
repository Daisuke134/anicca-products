#!/usr/bin/env python3
"""Build the published English book from its original manuscript with installed tools."""
from pathlib import Path
import hashlib
import html
import json
import re
import subprocess
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
LANDING = ROOT / 'apps/landing'
SOURCE = ROOT / 'docs/books/the-art-of-ai-monks-en.md'
CATALOG = LANDING / 'data/books/the-art-of-ai-monks-en.json'
OUTPUT = LANDING / 'private/ebooks'


def command(args, **kwargs):
    return subprocess.run(args, text=True, capture_output=True, check=True, **kwargs)


def main():
    text = SOURCE.read_text()
    sources = json.loads((ROOT / 'docs/books/the-art-of-ai-monks-sources.json').read_text())
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    assert digest == sources['book']['manuscript_sha256'], 'review source manifest after manuscript changes'
    chapters = re.findall(r'^## Chapter \d+\. (.+)$', text, re.M)
    assert len(chapters) == 10
    book = json.loads(CATALOG.read_text())
    OUTPUT.mkdir(parents=True, exist_ok=True)
    pdf_css = OUTPUT / 'the-art-of-ai-monks-book.css'
    pdf_css.write_text('@page { size: A5; margin: 19mm 16mm 20mm; @bottom-center { content: counter(page); font: 8pt Georgia, serif; color: #78715e; } }\n@page cover { margin: 0; @bottom-center { content: none; } }\nbody { font-family: Georgia, "Hiragino Mincho ProN", serif; font-size: 10.2pt; line-height: 1.48; color: #28352b; }\n.cover { page: cover; height: 210mm; width: 148mm; break-after: page; }\n.cover img { display: block; width: 148mm; height: 210mm; object-fit: contain; }\nh1 { font-size: 28pt; line-height: 1.12; font-weight: 400; color: #203b2e; margin: 18mm 0 6mm; }\nh2 { font-size: 19pt; line-height: 1.25; font-weight: 400; color: #203b2e; }\nh2[id^="chapter-"], h2[id^="appendix-"], h3#contents { break-before: page; }\nh3 { font-size: 13pt; line-height: 1.3; margin-top: 7mm; color: #5e644d; }\nh1, h2, h3, h4 { break-after: avoid; }\np { margin: .7em 0; text-align: justify; hyphens: auto; orphans: 3; widows: 3; }\na { color: #6c612f; text-decoration: none; overflow-wrap: anywhere; }\nli { margin: .25em 0; }\nblockquote { margin: 5mm 0; padding: 1mm 4mm; border-left: 2px solid #9c9d77; color: #5f6754; }\nhr { border: 0; border-top: .5pt solid #d3d2bc; margin: 6mm 0; }\ntable { width: 100%; border-collapse: collapse; font-size: 8.3pt; margin: 5mm 0; }\nth, td { padding: 2mm; border-bottom: .5pt solid #d3d2bc; vertical-align: top; overflow-wrap: anywhere; }\nth { background: #edf0e5; text-align: left; }\ntr { break-inside: avoid; }\npre { font-size: 7.5pt; white-space: pre-wrap; overflow-wrap: anywhere; background: #f3f3ea; padding: 3mm; }\ncode { font-size: .85em; overflow-wrap: anywhere; }\n')
    epub_css = OUTPUT / 'the-art-of-ai-monks-epub.css'
    epub_css.write_text('body { font-family: serif; line-height: 1.5; margin: 5%; } h1,h2,h3 { line-height: 1.2; } h2 { break-before: page; } p { margin: .7em 0; } a,code { overflow-wrap: anywhere; } pre { white-space: pre-wrap; } table { width: 100%; border-collapse: collapse; font-size: .85em; } td,th { padding: .3em; border-bottom: 1px solid #aaa; }')
    fragment = command(['pandoc', '--from=markdown', '--to=html5', '--wrap=none'], input=text).stdout
    reference_urls = dict(re.findall(r'^\[(S\d{2})\]:\s+(\S+)$', text, re.M))
    assert len(reference_urls) == len(sources['references']), 'reference definitions must remain separate from body text'
    def check_citations(markup):
        pairs = re.findall(r'<a href="([^"]+)"[^>]*>(S\d{2})</a>', markup)
        for target, label in pairs:
            assert html.unescape(target) == reference_urls[label], f'citation target mismatch: {label}'
        return len(pairs)
    citation_pairs = check_citations(fragment)
    assert citation_pairs > 0, 'rendered citations must be linked'
    rendered = OUTPUT / 'the-art-of-ai-monks-en.html'
    rendered.write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="author" content="Anicca"><title>' + html.escape(book['title']) + '</title><link rel="stylesheet" href="' + pdf_css.name + '"></head><body><section class="cover"><img src="../../public/assets/the-art-of-ai-monks-cover.png" alt="The Art of AI Monks cover"></section><article>' + fragment + '</article></body></html>')
    pdf = OUTPUT / book['formats']['pdf']
    result = command(['weasyprint', str(rendered), str(pdf)])
    if result.stderr.strip():
        print('PDF renderer notices: ' + result.stderr[-1500:])
    # Pandoc supplies the EPUB title page, so omit the two duplicate title headings.
    epub_text = text.replace('# ' + book['title'] + '\n', '', 1).replace('## ' + book['subtitle'] + '\n', '', 1)
    cover = LANDING / 'public/assets/the-art-of-ai-monks-cover.png'
    epub = OUTPUT / book['formats']['epub']
    command(['pandoc', '--from=markdown', '--to=epub3', '--standalone', '--toc', '--toc-depth=2', '--split-level=2', '--epub-cover-image=' + str(cover), '--css=' + str(epub_css), '-M', 'title=' + book['title'], '-M', 'subtitle=' + book['subtitle'], '-M', 'author=Anicca', '-M', 'lang=en', '-M', 'identifier=urn:anicca:' + book['sku'], '-M', 'rights=Original text and worksheets CC BY 4.0; third-party material retains its own rights.', '--output=' + str(epub)], input=epub_text)
    with zipfile.ZipFile(epub) as archive:
        for item in archive.namelist():
            if item.endswith('.xhtml'):
                check_citations(archive.read(item).decode('utf-8'))
        assert archive.read('mimetype') == b'application/epub+zip'
        assert archive.infolist()[0].filename == 'mimetype' and archive.infolist()[0].compress_type == 0
        container = ET.fromstring(archive.read('META-INF/container.xml'))
        package_path = container.find('.//{urn:oasis:names:tc:opendocument:xmlns:container}rootfile').attrib['full-path']
        package = ET.fromstring(archive.read(package_path))
        ns = {'opf': 'http://www.idpf.org/2007/opf'}
        manifest = {item.attrib['id']: item.attrib['href'] for item in package.findall('opf:manifest/opf:item', ns)}
        spine = package.findall('opf:spine/opf:itemref', ns)
        assert len(spine) >= 10
        for item in spine:
            assert str(Path(package_path).parent / manifest[item.attrib['idref']]) in archive.namelist()
    info = command(['pdfinfo', str(pdf)]).stdout
    pages = int(re.search(r'^Pages:\s+(\d+)', info, re.M).group(1))
    book.update(word_count=sources['book']['word_count_full'], chapters=chapters, pages=pages, manuscript_sha256=digest, research_snapshot='2026-10-21/2026-10-22')
    CATALOG.write_text(json.dumps(book, ensure_ascii=False, indent=2) + '\n')
    files = [{'path': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for path in (pdf, epub)]
    receipt = {'manuscript_sha256': digest, 'word_count': book['word_count'], 'chapters': len(chapters), 'pdf_pages': pages, 'epub_spine_items': len(spine), 'citation_link_pairs_checked': citation_pairs, 'files': files, 'validation': 'PDF metadata; EPUB mimetype/container/manifest/spine; visual review follows'}
    (ROOT / 'docs/evidence/ai-monk-book-artifacts-20261023.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
