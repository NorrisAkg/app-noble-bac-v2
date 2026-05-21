#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Rebuild assets/pdfjs/viewer.html by inlining PDF.js into viewer.template.html.
#
# Run this script when PDF.js needs to be upgraded. The generated viewer.html
# is the only asset bundled with the app — pdf.min.js and pdf.worker.min.js
# are intermediate artefacts and are not committed.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

VERSION="3.11.174"
BASE_URL="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${VERSION}"

cd "$(dirname "$0")"

echo "→ Downloading PDF.js ${VERSION}…"
curl -sL -o pdf.min.js        "${BASE_URL}/pdf.min.js"
curl -sL -o pdf.worker.min.js "${BASE_URL}/pdf.worker.min.js"

echo "→ Assembling viewer.html…"
python3 - <<'PYEOF'
with open('viewer.template.html', 'r') as f: template = f.read()
with open('pdf.min.js', 'r') as f: pdfjs = f.read()
with open('pdf.worker.min.js', 'r') as f: worker = f.read()

for name, content in [('pdf.min.js', pdfjs), ('pdf.worker.min.js', worker)]:
    assert '</script>' not in content.lower(), f'{name} contains </script>'

out = template.replace('/*__PDFJS_INLINE__*/', pdfjs)\
              .replace('/*__PDFJS_WORKER_INLINE__*/', worker)

with open('viewer.html', 'w') as f: f.write(out)
print(f'✅ viewer.html written: {len(out):,} bytes ({len(out)/1024:.1f} KB)')
PYEOF

echo "→ Cleaning up intermediate files…"
rm -f pdf.min.js pdf.worker.min.js

echo "✅ Done. Commit assets/pdfjs/viewer.html"
