import unittest
import os
import time
import chromedriver_binary
from selenium import webdriver
import shutil
import filecmp

class DisplayTest(unittest.TestCase):
    def setUp(self):
        

        options = webdriver.ChromeOptions()
        options.add_argument('--allow-file-access-from-files')
        options.add_argument('--disable-web-security')
        options.add_argument('--disable-features=CrossSiteDocumentBlockingIfIsolatin')
        options.add_argument('--enable-webgl')
        

        self.browser = webdriver.Chrome(options=options)
        self.browser.set_window_size(736, 640);
        self.browser.get("file://"+ os.path.abspath('index.html'))
        time.sleep(2)
    def tearDown(self):
        self.browser.quit()
    def test_laser01_display(self):
        self.browser.find_element_by_id('Laser01').click()
        self.browser.find_element_by_id('step').click()
        time.sleep(2)
        self.browser.save_screenshot('screenshots/Laser01.png')

        self.assertTrue(filecmp.cmp('original/Laser01.png', 'screenshots/Laser01.png'), 'Laser 01 is not equal')

    def test_laser02_display(self):
        self.browser.find_element_by_id('Laser02').click()
        self.browser.find_element_by_id('step').click()
        time.sleep(2)
        self.browser.save_screenshot('screenshots/Laser02.png')

        self.assertTrue(filecmp.cmp('original/Laser02.png', 'screenshots/Laser02.png'), 'Laser 02 is not equal')

    def test_ring_display(self):
        self.browser.find_element_by_id('Simple_Ring_Shape1').click()
        self.browser.find_element_by_id('step').click()
        time.sleep(2)
        self.browser.save_screenshot('screenshots/Ring.png')

        self.assertTrue(filecmp.cmp('original/Ring.png', 'screenshots/Ring.png'), 'ring is not equal')

    def test_block_display(self):
        self.browser.find_element_by_id('block').click()
        self.browser.find_element_by_id('step').click()
        time.sleep(2)
        self.browser.save_screenshot('screenshots/block.png')

        self.assertTrue(filecmp.cmp('original/block.png', 'screenshots/block.png'), 'block is not equal')



if __name__ == '__main__':
    if os.path.exists('screenshots'):
        shutil.rmtree("screenshots")
    os.mkdir('screenshots')
    unittest.main(verbosity=2)
