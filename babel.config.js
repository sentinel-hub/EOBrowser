module.exports = {
  presets: [
    'babel-preset-vite',
    '@babel/preset-react',
    ['@babel/preset-env', { targets: { node: 'current' } }],
  ],
};
