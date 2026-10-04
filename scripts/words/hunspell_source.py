import os
import urllib.request

REPO_OWNER = "tdd-ai"
REPO_NAME = "hunspell-tr"
PINNED_COMMIT = "7302eca5f3652fe7ae3d3ec06c44697c97342b4e"
RAW_BASE = f"https://raw.githubusercontent.com/{REPO_OWNER}/{REPO_NAME}/{PINNED_COMMIT}"

DIC_FILENAME = "tr_TR.dic"
LICENSE_FILENAME = "LICENSE"


def cache_dir() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(here, ".cache", PINNED_COMMIT)
    os.makedirs(path, exist_ok=True)
    return path


def fetch_file(filename: str) -> str:
    target = os.path.join(cache_dir(), filename)
    if os.path.exists(target):
        return target
    url = f"{RAW_BASE}/{filename}"
    with urllib.request.urlopen(url) as response:
        data = response.read()
    with open(target, "wb") as handle:
        handle.write(data)
    return target


def fetch_dic_path() -> str:
    return fetch_file(DIC_FILENAME)


def fetch_license_path() -> str:
    return fetch_file(LICENSE_FILENAME)


def parse_dic_line(line: str):
    line = line.strip()
    if not line:
        return None
    word, _, flag_part = line.partition("/")
    if not word:
        return None
    if not flag_part:
        return word, ()
    flags = tuple(f for f in flag_part.split(",") if f)
    return word, flags


def parse_dic_file(path: str):
    words = {}
    with open(path, encoding="utf-8") as handle:
        next(handle, None)
        for line in handle:
            parsed = parse_dic_line(line)
            if parsed is None:
                continue
            word, flags = parsed
            existing = words.get(word)
            if existing is None:
                words[word] = flags
            else:
                words[word] = tuple(set(existing) | set(flags))
    return words
