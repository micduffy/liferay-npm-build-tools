import path from 'path';
import Generator from 'yeoman-generator';

import {promptWithConfig} from '../utils';
import dependenciesJson from './dependencies.json';
import importsJson from './imports.json';
import {Copier} from '../utils';
import NpmbuildrcModifier from '../utils/modifier/npmbuildrc';
import NpmbundlerrcModifier from '../utils/modifier/npmbundlerrc';
import PkgJsonModifier from '../utils/modifier/package.json';
import StylesCssModifier from '../utils/modifier/assets/css/styles.css';

/**
 * Implementation of generation of Metal.js portlets.
 */
export default class extends Generator {
	/**
	 * Standard Yeoman initialization function
	 */
	initializing() {
		this.sourceRoot(path.join(__dirname, 'templates'));
	}

	/**
	 * Standard Yeoman prompt function
	 */
	async prompting() {
		this.answers = await promptWithConfig(this, 'target-metaljs-portlet', [
			{
				type: 'confirm',
				name: 'importMetaljs',
				message:
					'Do you want to import Metal.js packages from Liferay?',
				default: true,
			},
			{
				type: 'confirm',
				name: 'sampleWanted',
				message: 'Do you want to generate sample code?',
				default: false,
			},
		]);
	}

	/**
	 * Standard Yeoman generation function
	 */
	writing() {
		const cp = new Copier(this);
		const npmbuildrc = new NpmbuildrcModifier(this);
		const npmbundlerrc = new NpmbundlerrcModifier(this);
		const pkgJson = new PkgJsonModifier(this);
		const stylesCss = new StylesCssModifier(this);
		const {importMetaljs, sampleWanted} = this.answers;

		if (importMetaljs) {
			npmbundlerrc.mergeImports(importsJson);
			npmbundlerrc.addExclusion('incremental-dom');
			npmbundlerrc.addExclusion('incremental-dom-string');
		}

		pkgJson.mergeDependencies(dependenciesJson);
		pkgJson.addBuildStep('babel --source-maps -d build src');
		cp.copyFile('.babelrc');

		pkgJson.setMain('index.js');
		cp.copyFile('src/index.js');

		pkgJson.addDevDependency('babel-loader', '^7.0.0');
		npmbuildrc.addWebpackRule(/src\/.*\.js$/, 'babel-loader');

		if (sampleWanted) {
			cp.copyDir('src');
			stylesCss.addRule('.tag', 'font-weight: bold;');
			stylesCss.addRule('.value', 'font-style: italic;');
		}
	}
}
