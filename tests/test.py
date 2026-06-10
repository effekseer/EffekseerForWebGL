import unittest
import os
import time
import shutil
import filecmp
import base64
import glob

from PIL import Image, ImageChops

class CompareTest(unittest.TestCase):
    def test_compare_results(self):
        screenshot_file_paths = glob.glob('screenshots/*.png')

        failures = []

        if not screenshot_file_paths:
            failures.append('No screenshots found in screenshots/*.png.')

        for screenshot_file_path in screenshot_file_paths:
            file_name = os.path.basename(screenshot_file_path)
            target_file_path = os.path.join('..', 'TestData', 'Tests', 'WebGL', file_name)

            print('compare : ' + screenshot_file_path + ' vs ' + target_file_path)

            if os.path.exists(target_file_path):
                is_same = filecmp.cmp(target_file_path, screenshot_file_path, shallow=False)
                if not is_same:
                    report = describe_difference(target_file_path, screenshot_file_path)
                    failures.append(f'{file_name} differs:\n{indent(report)}')
            else:
                failures.append(f'{target_file_path} is not found.')

        if failures:
            print('\n'.join(failures))

        self.assertFalse(failures, 'Screenshot mismatches found (see log above).')


def indent(text, padding='    '):
    return '\n'.join(padding + line for line in text.splitlines())


def describe_difference(expected_path, actual_path):
    expected_size = os.path.getsize(expected_path)
    actual_size = os.path.getsize(actual_path)
    size_delta = actual_size - expected_size

    lines = [
        f'Expected: {expected_path}',
        f'Actual  : {actual_path}',
        f'File size: expected {expected_size:,} bytes, actual {actual_size:,} bytes (delta {size_delta:+,})',
    ]

    lines.extend(analyze_pixels(expected_path, actual_path))

    return '\n'.join(lines)


def analyze_pixels(expected_path, actual_path):
    try:
        with Image.open(expected_path) as expected_img, Image.open(actual_path) as actual_img:
            expected = expected_img.convert('RGBA')
            actual = actual_img.convert('RGBA')
    except Exception as ex:
        return [f'Failed to inspect pixels: {ex}']

    lines = []
    if expected.size != actual.size:
        lines.append(
            f'Image size: expected {expected.size[0]}x{expected.size[1]}, '
            f'actual {actual.size[0]}x{actual.size[1]} (resize mismatch)'
        )
        return lines

    diff = ImageChops.difference(expected, actual)
    diff_extrema = diff.getextrema()
    max_channel_delta = max(channel[1] for channel in diff_extrema)

    diff_gray = diff.convert('L')
    histogram = diff_gray.histogram()
    total_pixels = diff_gray.width * diff_gray.height
    identical_pixels = histogram[0]
    changed_pixels = total_pixels - identical_pixels

    total_intensity = sum(value * count for value, count in enumerate(histogram))
    average_delta = total_intensity / float(total_pixels) if total_pixels else 0.0

    percent_changed = (changed_pixels / total_pixels) * 100 if total_pixels else 0
    bbox = diff.getbbox()

    if changed_pixels == 0:
        lines.append('Pixel data identical; PNG metadata differs.')
    else:
        lines.append(
            f'Pixel diff: {changed_pixels:,}/{total_pixels:,} pixels changed ({percent_changed:.4g}%).'
        )
        lines.append(
            f'Max channel delta: {max_channel_delta}/255; average grayscale delta: {average_delta:.2f}/255.'
        )
        if bbox:
            lines.append(
                f'Diff bounding box: left={bbox[0]}, top={bbox[1]}, right={bbox[2]}, bottom={bbox[3]}.'
            )

    return lines

if __name__ == '__main__':
    unittest.main(verbosity=2)

