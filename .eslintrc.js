module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
	},
	extends: [
		'@nuxtjs/eslint-config-typescript',
		'plugin:nuxt/recommended',
		'prettier',
		//'plugin:prettier/recommended', 권장하지 않는다
	],
	plugins: [],
	// add your custom rules here
	rules: {},
};