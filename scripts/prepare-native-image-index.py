#!/usr/bin/env python3
"""Assemble and verify a two-architecture OCI layout without registry writes."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import tarfile

INDEX = "application/vnd.oci.image.index.v1+json"
MANIFEST = "application/vnd.oci.image.manifest.v1+json"
CONFIG = "application/vnd.oci.image.config.v1+json"
ARCHES = ("amd64", "arm64")
DIGEST = re.compile(r"sha256:([a-f0-9]{64})")
BLOB = re.compile(r"blobs/sha256/[a-f0-9]{64}")
LAYERS = {
    "application/vnd.oci.image.layer.v1.tar",
    "application/vnd.oci.image.layer.v1.tar+gzip",
    "application/vnd.oci.image.layer.v1.tar+zstd",
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return "sha256:" + hashlib.sha256(data).hexdigest()


def extract(archive_path, destination):
    """Accept only the files emitted by the OCI exporter, not arbitrary tar paths."""
    require(archive_path.stat().st_size <= 4 * 2**30, "oversized OCI archive")
    seen = set()
    with tarfile.open(archive_path, "r:") as archive:
        for entry in archive:
            name = entry.name.removeprefix("./")
            if entry.isdir() and name in {"", ".", "blobs", "blobs/sha256"}:
                continue
            require(
                entry.isfile()
                and name not in seen
                and (name in {"index.json", "oci-layout"} or BLOB.fullmatch(name)),
                "unexpected OCI archive member",
            )
            require(0 < entry.size <= 2**31, "unexpected OCI archive member size")
            require(BLOB.fullmatch(name) or entry.size <= 2**20, "oversized OCI metadata")
            seen.add(name)
            target = destination / name
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.extractfile(entry) as source, target.open("xb") as output:
                shutil.copyfileobj(source, output)
    require({"oci-layout", "index.json"} <= seen, "incomplete OCI archive")
    require(
        json.loads((destination / "oci-layout").read_bytes())
        == {"imageLayoutVersion": "1.0.0"},
        "unsupported OCI layout",
    )
    return seen - {"oci-layout", "index.json"}


def blob(layout, descriptor, allowed_media, *, metadata=False):
    match = DIGEST.fullmatch(descriptor.get("digest", ""))
    require(match and descriptor.get("mediaType") in allowed_media, "invalid descriptor")
    require(not descriptor.get("urls"), "external blob URLs are forbidden")
    path = layout / "blobs" / "sha256" / match[1]
    require(path.stat().st_size == descriptor.get("size"), "wrong blob size")
    require(not metadata or path.stat().st_size <= 2**20, "oversized OCI metadata")
    with path.open("rb") as contents:
        actual = "sha256:" + hashlib.file_digest(contents, "sha256").hexdigest()
    require(actual == descriptor["digest"], "wrong blob digest")
    return path


def verify_native(layout, architecture, sha, source, version, config_id):
    index = json.loads((layout / "index.json").read_bytes())
    children = index.get("manifests", [])
    require(index.get("schemaVersion") == 2 and len(children) == 1, "expected one image")
    child = children[0]
    manifest_path = blob(layout, child, {MANIFEST}, metadata=True)
    manifest = json.loads(manifest_path.read_bytes())
    require(manifest.get("schemaVersion") == 2, "unexpected image schema")
    config_path = blob(layout, manifest["config"], {CONFIG}, metadata=True)
    require(manifest["config"]["digest"] == config_id, "image differs from smoke-tested config")
    config = json.loads(config_path.read_bytes())
    platform = {"os": "linux", "architecture": architecture}
    require(all(config.get(key) == val for key, val in platform.items()), "wrong native platform")
    for metadata in (child.get("platform") or platform, config):
        require(
            all(metadata.get(key) == value for key, value in platform.items())
            and metadata.get("variant") in ({None, "", "v8"} if architecture == "arm64" else {None, ""}),
            "wrong descriptor platform",
        )
    labels = config["config"]["Labels"]
    require(labels.get("org.opencontainers.image.revision") == sha, "wrong source SHA")
    require(labels.get("org.opencontainers.image.source") == source, "wrong source repository")
    env = config["config"]["Env"]
    require(
        [item for item in env if item.startswith("DSPACE_VERSION=")]
        == ["DSPACE_VERSION=" + version],
        "wrong image runtime version",
    )
    layers = [blob(layout, item, LAYERS) for item in manifest["layers"]]
    descriptor = {key: child[key] for key in ("mediaType", "digest", "size")}
    return {**descriptor, "platform": platform}, {manifest_path, config_path, *layers}


def assemble(inputs, output, sha, source, version):
    require(re.fullmatch(r"[a-f0-9]{40}", sha), "invalid full source SHA")
    output.mkdir()
    blobs = output / "blobs" / "sha256"
    blobs.mkdir(parents=True)
    children = []
    for arch in ARCHES:
        native = inputs / ("publisher-native-" + arch)
        layout = output / arch
        layout.mkdir()
        paths = extract(native / "image.tar", layout)
        config_id = (native / "tested-config").read_text(encoding="ascii").strip()
        child, files = verify_native(layout, arch, sha, source, version, config_id)
        require(paths == {str(p.relative_to(layout)) for p in files}, "unreferenced OCI blobs")
        children.append(child)
        for path in files:
            target = blobs / path.name
            if not target.exists():
                path.rename(target)
        shutil.rmtree(layout)
    require(len({c["digest"] for c in children}) == 2, "duplicate architectures")
    index = json.dumps(
        {"schemaVersion": 2, "mediaType": INDEX, "manifests": children},
        separators=(",", ":"),
    ).encode()
    (output / "index.json").write_bytes(index)
    (output / "oci-layout").write_text('{"imageLayoutVersion":"1.0.0"}', encoding="ascii")
    return digest(index)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for attr in ("inputs", "output"):
        parser.add_argument(attr, type=Path)
    for attr in ("sha", "source", "version"):
        parser.add_argument(attr)
    args = parser.parse_args()
    print(assemble(args.inputs, args.output, args.sha, args.source, args.version))


if __name__ == "__main__":
    main()
