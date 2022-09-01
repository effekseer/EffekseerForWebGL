import unittest
import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import shutil
import filecmp
import base64
import glob
import json
import requests

class DisplayTest(unittest.TestCase):
    def capturePng(self):
        # get the canvas as a PNG base64 string
        canvas_base64 = self.browser.execute_script("return capturePNG()")

        canvas_png = base64.b64decode(canvas_base64)
        return canvas_png
    def setUp(self):
        files = []
        for file in glob.glob('../TestData/**/*.efk', recursive=True) :
            files.append(file.replace('\\', '/'))
        for file in glob.glob('../TestData/Effects/15/*.efkefc', recursive=True) :
            files.append(file.replace('\\', '/'))
        for file in glob.glob('../TestData/Effects/16/*.efkefc', recursive=True) :
            files.append(file.replace('\\', '/'))
        for file in glob.glob('../ResourceData/samples/03_Hanmado01/Effect/*.efkefc', recursive=True) :
            files.append(file.replace('\\', '/'))
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
        options.add_argument('--headless')

        d = DesiredCapabilities.CHROME
        d['goog:loggingPrefs'] = { 'browser':'ALL' }

        self.browser = webdriver.Chrome(options=options, desired_capabilities=d)
        self.browser.set_window_size(320, 320)

    @classmethod
    def tearDownClass(self):
        files = {}
        for png in  glob.glob('screenshots/*.png') :
            name = os.path.basename(png)
            with open(png, 'rb') as file:
                files[name] = (name, file.read(), 'image/png')
        # requests.post('https://echo.effekseer.org', files=files)

    def test_some_effects(self):
        for path in self.files:
            name = os.path.basename(path)
            self.browser.get("file://"+ os.path.abspath('index.html'))
            time.sleep(1)
            self.browser.find_element(By.ID, name).click()
            time.sleep(1)
            for step in range(1) :
                with self.subTest(name=name) :
                    self.browser.find_element(By.ID, 'step').click()
                    time.sleep(1)
                    with open('screenshots/' + name +'_step' + str(step) + '.png', 'wb') as f:
                        f.write(self.capturePng())
                    time.sleep(1)

        for entry in self.browser.get_log('browser'):
            print(entry)

if __name__ == '__main__':
    if os.path.exists('screenshots'):
        shutil.rmtree("screenshots")
    os.mkdir('screenshots')
    unittest.main(verbosity=2)

