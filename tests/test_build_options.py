import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch


spec = importlib.util.spec_from_file_location('webgl_build', Path(__file__).resolve().parents[1] / 'build.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class BuildOptionsTest(unittest.TestCase):
    def test_main_passes_separate_clamp_option(self):
        with patch.object(build.sys, 'argv', ['build.py', '--skip-asmjs', '--emsdk-1-38-clamp']), \
                patch.object(build, 'compile') as compile_mock, \
                patch.object(build.shutil, 'copy'):
            build.main()
        self.assertEqual(compile_mock.call_args.args[2],
                         ['-DAS_WASM=ON', '-DEMSCRIPTEN_1_38_CLAMP=ON'])

    def test_default_build_options(self):
        with patch.object(build.sys, 'argv', ['build.py']), \
                patch.object(build, 'compile') as compile_mock, \
                patch.object(build.shutil, 'copy'):
            build.main()
        self.assertEqual([call.args[2] for call in compile_mock.call_args_list],
                         [['-DAS_WASM=OFF'], ['-DAS_WASM=ON']])

    def test_cmake_receives_individual_arguments(self):
        options = ['-DAS_WASM=ON', '-DEMSCRIPTEN_1_38_CLAMP=ON']
        for system in ('Linux', 'Windows'):
            with self.subTest(system=system), \
                    patch.object(build.platform, 'system', return_value=system), \
                    patch.object(build.os.path, 'exists', return_value=True), \
                    patch.object(build.os, 'chdir'), \
                    patch.object(build.subprocess, 'check_call', side_effect=RuntimeError('stop')) as command:
                with self.assertRaisesRegex(RuntimeError, 'stop'):
                    build.compile('build', '../src/', options, '', '', '', '', '')
                self.assertEqual(command.call_args.args[0][-3:], options + ['../src/'])


if __name__ == '__main__':
    unittest.main()
