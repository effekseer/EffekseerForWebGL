import unittest
import os
import time
import shutil
import filecmp
import base64
import glob

class CompareTest(unittest.TestCase):
    def compare_results(self):
        screenshot_file_paths = glob.glob('screenshots/*.png')
        for screenshot_file_path in screenshot_file_paths:
            file_name = os.path.basename(screenshot_file_path)
            target_file_path = '../TestData/Tests/WebGL/' + file_name

            print('compare : ' + screenshot_file_path + ' vs ' + target_file_path)
            
            self.assertTrue(filecmp.cmp('../TestData/Tests/WebGL/' + file_name, screenshot_file_path), screenshot_file_path + ' is not equal')

if __name__ == '__main__':
    unittest.main(verbosity=2)

