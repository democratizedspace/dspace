#!/usr/bin/env python3
"""Offline fixtures for the native index handoff."""

import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location(
    "native_index", Path(__file__).with_name("prepare-native-image-index.py")
)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
SOURCE = "https://github.com/democratizedspace/dspace"
SHA = "a" * 40
VERSION = "v3.1.0+aaaaaaa"


def fixture(root, arch, *, config_arch=None, config_id=None, revision=SHA, version=VERSION,
            bad_size=False, wrong_layer=False, extra=None, duplicate=False):
    native = root / ("publisher-native-" + arch)
    native.mkdir()
    files = {}

    def add(data, media):
        if not isinstance(data, bytes):
            data = json.dumps(data, separators=(",", ":")).encode()
        dig = MODULE.digest(data)
        files["blobs/sha256/" + dig[7:]] = data
        return {"digest": dig, "mediaType": media, "size": len(data)}

    config = add({
        "os": "linux",
        "architecture": config_arch or arch,
        "config": {
            "Labels": {
                "org.opencontainers.image.source": SOURCE,
                "org.opencontainers.image.revision": revision,
            },
            "Env": ["DSPACE_VERSION=" + version],
        },
    }, MODULE.CONFIG)
    layer = add(b"fake layer tar", "application/vnd.oci.image.layer.v1.tar")
    if bad_size:
        layer["size"] += 1
    if wrong_layer:
        files["blobs/sha256/" + layer["digest"][7:]] = b"evil layer tar"
    manifest = add({"schemaVersion": 2, "config": config, "layers": [layer]}, MODULE.MANIFEST)
    files.update({
        "oci-layout": b'{"imageLayoutVersion":"1.0.0"}',
        "index.json": json.dumps({
            "schemaVersion": 2, "manifests": [manifest, manifest] if duplicate else [manifest],
        }).encode(),
    })
    if extra:
        files[extra] = b"x"
    with tarfile.open(native / "image.tar", "w") as archive:
        for name, data in files.items():
            info = tarfile.TarInfo(name)
            info.size = len(data)
            archive.addfile(info, io.BytesIO(data))
    (native / "tested-config").write_text(config_id or config["digest"], encoding="ascii")
    return manifest["digest"]


class NativeIndexTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def assemble(self, target="output"):
        return MODULE.assemble(self.root, self.root / target, SHA, SOURCE, VERSION)

    def test_digest_is_deterministic_and_retains_both_exact_native_manifests(self):
        amd64 = fixture(self.root, "amd64")
        arm64 = fixture(self.root, "arm64")
        index = self.assemble()
        self.assertEqual(index, self.assemble("again"))
        raw = (self.root / "output/index.json").read_bytes()
        self.assertEqual(index, MODULE.digest(raw))
        self.assertEqual(
            [(x["platform"], x["digest"]) for x in json.loads(raw)["manifests"]],
            [({"os": "linux", "architecture": "amd64"}, amd64),
             ({"os": "linux", "architecture": "arm64"}, arm64)],
        )
        self.assertEqual(len(list((self.root / "output/blobs/sha256").iterdir())), 5)

    def test_wrong_artifacts_fail_closed(self):
        bad = (
            ({"config_arch": "amd64"}, "wrong native platform"),
            ({"config_id": "sha256:" + "b" * 64}, "differs from smoke-tested config"),
            ({"revision": "b" * 40}, "wrong source SHA"),
            ({"version": "v3.1.0+bbbbbbb"}, "wrong image runtime version"),
            ({"bad_size": True}, "wrong blob size"),
            ({"wrong_layer": True}, "wrong blob digest"),
            ({"extra": "../../outside"}, "unexpected OCI archive member"),
            ({"extra": "blobs/sha256/" + "f" * 64}, "unreferenced OCI blobs"),
            ({"duplicate": True}, "expected one image"),
        )
        for options, reason in bad:
            with self.subTest(reason=reason), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                fixture(root, "amd64")
                fixture(root, "arm64", **options)
                with self.assertRaisesRegex(ValueError, reason):
                    MODULE.assemble(root, root / "bad", SHA, SOURCE, VERSION)
                self.assertFalse((root / "bad/index.json").exists())

    def test_missing_architecture_fails_closed(self):
        fixture(self.root, "amd64")
        with self.assertRaises(FileNotFoundError):
            self.assemble()
        self.assertFalse((self.root / "output/index.json").exists())


if __name__ == "__main__":
    unittest.main()
