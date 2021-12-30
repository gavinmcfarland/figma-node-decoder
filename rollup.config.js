import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import svg from 'rollup-plugin-svg';
import typescript from 'rollup-plugin-typescript';
import nodePolyfills from 'rollup-plugin-node-polyfills'
import replace from '@rollup/plugin-replace'
import json from '@rollup/plugin-json'
import globals from 'rollup-plugin-node-globals'

/* Post CSS */
import postcss from 'rollup-plugin-postcss';
// import cssnano from 'cssnano';


/* Inline to single html */
import htmlBundle from 'rollup-plugin-html-bundle';

import { stylup } from './stylup'

const production = !process.env.ROLLUP_WATCH;

export default [{
	input: 'src/main.js',
	output: {
		format: 'iife',
		name: 'ui',
		file: 'src/build/bundle.js'
	},
	plugins: [
		svelte({
			// enable run-time checks when not in production
			// dev: !production,
			// preprocess: [stylup]
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration —
		// consult the documentation for details:¡
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/'),
			extensions: ['.svelte', '.mjs', '.js', '.json', '.node']
		}),
		commonjs(),
		svg(),
		postcss(),
		htmlBundle({
			template: 'src/template.html',
			target: 'public/index.html',
			inline: true
		}),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `dist` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
},
{
	input: 'package/index.ts',
	output: {
		file: 'package/index.js',
		format: 'cjs',
		name: 'javascript-api'
	},
	plugins: [
		typescript(),
		nodePolyfills({ include: null, exclude: ['../**/node_modules/voca/*.js'] }),
		resolve(),
		replace({
			'process.env.PKG_PATH': JSON.stringify(process.cwd() + '/package.json'),
			'process.env.VERSIONS_PATH': JSON.stringify(process.cwd() + '/.plugma/versions.json')
		}),
		json(),
		commonjs(),
		production && terser()
	]
},
{
	input: 'src/code.ts',
	output: {
		file: 'public/code.js',
		format: 'cjs',
		name: 'code'
	},
	plugins: [
		typescript(),
		nodePolyfills({ include: null, exclude: ['../**/node_modules/voca/*.js'] }),
		resolve(),
		replace({
			'process.env.PKG_PATH': JSON.stringify(process.cwd() + '/package.json'),
			'process.env.VERSIONS_PATH': JSON.stringify(process.cwd() + '/.plugma/versions.json')
		}),
		json(),
		commonjs(),
		production && terser()
	]
}
];

function serve() {
	let started = false;

	return {
		writeBundle() {
			if (!started) {
				started = true;

				require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}
		}
	};
}
