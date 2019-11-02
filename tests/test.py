import unittest
import os
import time
import chromedriver_binary
from selenium import webdriver
import shutil
import filecmp
import base64
import glob
import json
import requests

class DisplayTest(unittest.TestCase):
    def capturePng(self):
        canvas = self.browser.find_element_by_css_selector("#canvas")

        # get the canvas as a PNG base64 string
        canvas_base64 = self.browser.execute_script("return capturePNG()", canvas)

        canvas_png = base64.b64decode(canvas_base64)
        return canvas_png
    def setUp(self):
        files = glob.glob('../samples_for_test/**/*.efk')

        with open("test-list.json", "w") as f:
            json.dump(files, f)
        time.sleep(2)
        self.files = files
        options = webdriver.ChromeOptions()
        options.add_argument('--allow-file-access-from-files')
        options.add_argument('--disable-web-security')
        options.add_argument('--disable-features=CrossSiteDocumentBlockingIfIsolatin')
        options.add_argument('--enable-webgl')
        options.add_argument('--enable-asm-webassembly')

        self.browser = webdriver.Chrome(options=options)
        self.browser.set_window_size(736, 640)

    @classmethod
    def tearDownClass(self):
        files = {}
        for png in  glob.glob('screenshots/*.png') :
            name = os.path.basename(png)
            with open(png, 'rb') as file:
                files[name] = (name, file.read(), 'image/png')
        requests.post('https://echo.effekseer.org', files=files)





    def test_some_effects(self):
        for path in self.files:
            name = os.path.basename(path)
            self.browser.get("file://"+ os.path.abspath('index.html'))
            time.sleep(1)
            self.browser.find_element_by_id(name).click()
            time.sleep(1)
            for step in range(5) :
                with self.subTest(name=name) :
                    self.browser.find_element_by_id('step').click()
                    time.sleep(1)
                    with open('screenshots/' + name +'_step' + str(step) + '.png', 'wb') as f:
                        f.write(self.capturePng())
                    time.sleep(1)
                    self.assertTrue(filecmp.cmp('original/' + name +'_step' + str(step) + '.png', 'screenshots/' + name + '_step' + str(step) + '.png'), name + '_step' + str(step) + ' is not equal')





if __name__ == '__main__':
    if os.path.exists('screenshots'):
        shutil.rmtree("screenshots")
    os.mkdir('screenshots')
    unittest.main(verbosity=2)

