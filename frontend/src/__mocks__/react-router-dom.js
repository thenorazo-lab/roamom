const React = require('react');

module.exports = {
  HashRouter: ({ children }) => React.createElement(React.Fragment, null, children),
  Routes: ({ children }) => React.createElement(React.Fragment, null, children),
  Route: ({ element }) => element,
  Link: ({ children, ...props }) => React.createElement('a', props, children),
};
