import tempfile
import unittest
from pathlib import Path

from PIL import Image, PngImagePlugin

from test import analyze_pixels, pixels_equal


class ImageComparisonTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.expected = Path(self.directory.name) / 'expected.png'
        self.actual = Path(self.directory.name) / 'actual.png'
        Image.new('RGBA', (2, 2), (0, 0, 0, 255)).save(self.expected)

    def test_ignores_metadata_and_compression(self):
        metadata = PngImagePlugin.PngInfo()
        metadata.add_text('Comment', 'Different metadata')
        with Image.open(self.expected) as image:
            image.save(self.actual, pnginfo=metadata, compress_level=0)
        self.assertNotEqual(self.expected.read_bytes(), self.actual.read_bytes())
        self.assertTrue(pixels_equal(self.expected, self.actual))

    def test_detects_one_unit_change_in_each_channel(self):
        for channel in range(4):
            with self.subTest(channel=channel):
                with Image.open(self.expected) as image:
                    pixel = [0, 0, 0, 255]
                    pixel[channel] += -1 if channel == 3 else 1
                    image.putpixel((1, 0), tuple(pixel))
                    image.save(self.actual)
                self.assertFalse(pixels_equal(self.expected, self.actual))
                report = '\n'.join(analyze_pixels(self.expected, self.actual))
                self.assertIn('1/4 pixels changed', report)
                self.assertIn('left=1, top=0, right=2, bottom=1', report)

    def test_detects_size_change(self):
        Image.new('RGBA', (1, 4), (0, 0, 0, 255)).save(self.actual)
        self.assertFalse(pixels_equal(self.expected, self.actual))
        self.assertIn('resize mismatch', '\n'.join(analyze_pixels(self.expected, self.actual)))

    def test_equivalent_rgb_and_rgba(self):
        Image.new('RGB', (2, 2), (0, 0, 0)).save(self.actual)
        self.assertTrue(pixels_equal(self.expected, self.actual))


if __name__ == '__main__':
    unittest.main()
