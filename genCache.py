#!/usr/bin/env python3
"""
make_precache.py – collect local files *and* external CDN URLs,
but ignore folders in IGNORE_DIRS **and any *.py file**.
"""
import os, re, json, sys
from pathlib import Path

# ---------- CONFIG ----------------------------------------------------------
IGNORE_DIRS = {"node_modules", ".git", "songs"}          # folders to skip
TEXT_EXTS   = {".html", ".htm", ".js", ".css"}  # files we scan for URLs
URL_RE      = re.compile(r"""["'`]((https?:)?//[^\s"'`<>]+)""")
# ---------------------------------------------------------------------------


def is_ignored(path: Path) -> bool:
    return any(p.name in IGNORE_DIRS for p in path.parents)


def discover_local_and_remote(root: Path = Path(".")):
    remote_urls: set[str] = set()

    for path in root.rglob("*"):
        if path.is_dir() or is_ignored(path):
            continue
        if path.suffix == ".py":            # ⬅️ skip *.py completely
            continue

        # -------- local asset ----------
        yield "/" + path.relative_to(root).as_posix()

        # -------- scan for remote URLs -
        if path.suffix.lower() in TEXT_EXTS:
            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            for m in URL_RE.finditer(text):
                url = m.group(1)
                if url.startswith("//"):
                    url = "https:" + url
                remote_urls.add(url)

    for url in sorted(remote_urls):
        yield url


def main() -> None:
    precache = list(discover_local_and_remote())
    js = "const PRECACHE = " + json.dumps(precache, indent=2) + ";"
    sys.stdout.write(js + "\n")


if __name__ == "__main__":
    main()
