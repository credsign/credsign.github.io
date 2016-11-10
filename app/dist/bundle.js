/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _App = __webpack_require__(1);

	var _App2 = _interopRequireDefault(_App);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	window.addEventListener('load', function () {
	  marked.setOptions({
	    gfm: false,
	    tables: false,
	    breaks: false,
	    pedantic: false,
	    sanitize: true,
	    smartLists: false
	  });

	  function getWeb3(done) {
	    var providerURL = '';
	    var targetNetworkID;
	    var network = window.location.pathname.split('/')[1];
	    if (network == 'privnet') {
	      providerURL = 'http://localhost:8545';
	    } else if (network == 'testnet') {
	      providerURL = window.location.protocol == 'https:' ? 'https://morden.infura.io/rKXO8uv6njXPdnUsNSeE' : 'http://localhost:8545';
	      targetNetworkID = 2;
	    } else {
	      providerURL = window.location.protocol == 'https:' ? 'https://infura.io/rKXO8uv6njXPdnUsNSeE' : 'http://localhost:8545';
	      targetNetworkID = 1;
	    }
	    window.infura = false;
	    if (window.web3 === undefined) {
	      (function (d, script) {
	        script = d.createElement('script');
	        script.type = 'text/javascript';
	        script.async = true;
	        script.onload = function () {
	          window.web3 = new Web3(new Web3.providers.HttpProvider(providerURL));
	          window.infura = window.location.protocol == 'https:';
	          done();
	        };
	        script.src = 'https://unpkg.com/web3@0.16.0/dist/web3.js';
	        d.getElementsByTagName('head')[0].appendChild(script);
	      })(document);
	    } else {
	      web3.version.getNetwork(function (error, networkID) {
	        if (networkID != targetNetworkID) {
	          window.web3 = new Web3(new Web3.providers.HttpProvider(providerURL));
	          window.infura = window.location.protocol == 'https:';
	        }
	        done();
	      });
	    }
	  }

	  function getContracts(done) {
	    var xhr = new XMLHttpRequest();
	    xhr.open('GET', 'contracts.json');
	    xhr.onreadystatechange = function () {
	      if (xhr.readyState == 4) {
	        var contracts = JSON.parse(xhr.responseText);
	        window.indexer = web3.eth.contract(contracts.Indexer.interface).at(contracts.Indexer.address);
	        window.publisher = web3.eth.contract(contracts.Publisher.interface).at(contracts.Publisher.address);
	        done();
	      }
	    };
	    xhr.send(null);
	  }

	  getWeb3(function () {
	    getContracts(function () {
	      ReactDOM.render(React.createElement(_App2.default, null), document.getElementById('main'));
	    });
	  });
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _Account = __webpack_require__(2);

	var _Account2 = _interopRequireDefault(_Account);

	var _Content = __webpack_require__(4);

	var _Content2 = _interopRequireDefault(_Content);

	var _ContentFeed = __webpack_require__(5);

	var _ContentFeed2 = _interopRequireDefault(_ContentFeed);

	var _Publish = __webpack_require__(6);

	var _Publish2 = _interopRequireDefault(_Publish);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var App = function (_React$Component) {
	  _inherits(App, _React$Component);

	  function App(props) {
	    _classCallCheck(this, App);

	    var _this = _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).call(this, props));

	    _this.state = {
	      levelOne: '',
	      levelTwo: '',
	      levelThree: '',
	      levelFour: '',
	      account: '',
	      contentID: null
	    };

	    _this.route = _this.route.bind(_this);
	    _this.setFilter = _this.setFilter.bind(_this);

	    window.addEventListener('hashchange', function () {
	      return _this.route(window.location.hash);
	    });
	    return _this;
	  }

	  _createClass(App, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      var _this2 = this;

	      this.route(window.location.hash);
	      web3.eth.getAccounts(function (error, accounts) {
	        if (!window.infura && accounts && accounts.length > 0) {
	          var address = accounts[0];
	          _this2.setState({
	            account: address
	          });
	        } else {
	          _this2.setState({
	            warn: true
	          });
	        }
	      });
	    }
	  }, {
	    key: 'setFilter',
	    value: function setFilter(e) {
	      var _this3 = this;

	      var filter = e.target.value;
	      if (this.state.timeout > 0) {
	        clearTimeout(this.state.timeout);
	      }
	      this.setState({
	        levelTwo: filter,
	        timeout: setTimeout(function () {
	          window.location.hash = '#/' + _this3.state.levelOne + '/' + filter;
	        }, 500)
	      });
	    }
	  }, {
	    key: 'route',
	    value: function route(href) {
	      var path = href.split('/');
	      path[1] = path.length > 1 ? path[1] : 'channel';
	      path[2] = path.length > 2 ? path[2] : '';
	      path[3] = path.length > 3 ? path[3] : '';
	      path[4] = path.length > 4 ? path[4] : '';
	      this.setState({
	        levelOne: path[1],
	        levelTwo: path[2],
	        levelThree: path[3],
	        levelFour: path[4]
	      });
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _ref,
	          _this4 = this;

	      var view = '';
	      var showNav = true;
	      if (this.state.levelOne == 'channel') {
	        if (this.state.levelThree == 'post') {
	          view = React.createElement(_Content2.default, { id: this.state.levelFour, channel: this.state.levelTwo, account: this.state.account });
	          showNav = false;
	        } else {
	          view = React.createElement(_ContentFeed2.default, { channel: this.state.levelTwo, account: this.state.account });
	        }
	      } else if (this.state.levelOne == 'publish') {
	        view = React.createElement(_Publish2.default, { channel: this.state.levelTwo, account: this.state.account });
	      } else if (this.state.levelOne == 'account') {
	        view = React.createElement(_Account2.default, { account: this.state.levelTwo });
	      }

	      var filter;
	      if (this.state.levelOne == 'account') {
	        filter = '#/channel/';
	      } else if (this.state.levelOne == 'publish') {
	        filter = '#/publish/' + this.state.levelTwo;
	      } else {
	        filter = '#/account/' + this.state.account;
	      }
	      return React.createElement(
	        'div',
	        { style: { position: 'relative', minHeight: '100%' } },
	        React.createElement(
	          'div',
	          { style: {
	              position: 'fixed',
	              width: '100%',
	              backgroundColor: '#fafafa',
	              borderBottom: '1px solid #DDD',
	              color: 'black',
	              height: '3em',
	              top: 0,
	              fontWeight: 'bold',
	              textAlign: 'center',
	              zIndex: 10
	            } },
	          React.createElement(
	            'div',
	            { style: { maxWidth: '600px', margin: '0 auto' } },
	            React.createElement(
	              'a',
	              { href: '/', alt: '\xA2' },
	              React.createElement('img', { src: '/app/logo.svg', style: { width: '1.5em', height: '1.5em', margin: '0 auto', padding: '.75em' } })
	            )
	          )
	        ),
	        React.createElement(
	          'div',
	          { style: { height: '3em' } },
	          '\xA0'
	        ),
	        React.createElement(
	          'div',
	          { style: { maxWidth: '600px', margin: '0 auto', padding: '1em 0', display: showNav ? 'block' : 'none' } },
	          React.createElement(
	            'div',
	            { className: 'flex' },
	            React.createElement(
	              'a',
	              { className: 'flex-shrink', href: filter, style: {
	                  color: this.state.levelOne == 'publish' ? 'gray' : 'purple',
	                  padding: '.5em 0',
	                  paddingLeft: '1em',
	                  border: '1px solid #DDD',
	                  borderRight: '0',
	                  textAlign: 'center',
	                  fontWeight: 'bold',
	                  backgroundColor: 'white'
	                } },
	              React.createElement('i', { style: { paddingTop: '.05em' }, className: this.state.levelOne == 'account' ? 'fa fa-user' : 'fa fa-hashtag' })
	            ),
	            React.createElement('input', { type: 'text', placeholder: this.state.levelOne == 'account' ? '0x321...' : 'channel', id: 'channel', className: 'flex-grow', style: (_ref = {
	                backgroundColor: 'transparent',
	                fontSize: '1em',
	                padding: '.5em',
	                margin: 0,
	                border: '1px solid #DDD',
	                borderRadius: 0,
	                boxShadow: 'none',
	                borderLeft: 0
	              }, _defineProperty(_ref, 'backgroundColor', 'white'), _defineProperty(_ref, 'outline', 0), _defineProperty(_ref, 'color', 'black'), _ref), value: this.state.levelTwo, onChange: this.setFilter }),
	            React.createElement(
	              'a',
	              { className: 'flex-shrink', style: {
	                  color: 'white',
	                  backgroundColor: 'purple',
	                  display: this.state.levelOne == 'publish' || this.state.account == '' ? 'none' : 'block',
	                  padding: '.5em 0',
	                  marginLeft: '1em',
	                  borderTop: '1px solid purple',
	                  borderBottom: '1px solid purple',
	                  width: '3em',
	                  textAlign: 'center'
	                }, href: '#/publish/' + (this.state.levelOne == 'channel' ? this.state.levelTwo : '') },
	              React.createElement('i', { className: 'fa fa-pencil' })
	            )
	          )
	        ),
	        React.createElement(
	          'div',
	          { style: { display: this.state.warn ? 'block' : 'none' } },
	          React.createElement(
	            'div',
	            { className: 'backdrop', style: {
	                width: '100%',
	                height: '100%',
	                opacity: 0.5,
	                backgroundColor: 'black',
	                position: 'fixed',
	                zIndex: 1,
	                top: '0',
	                left: '0'
	              } },
	            ' '
	          ),
	          React.createElement(
	            'div',
	            { style: {
	                top: '15%',
	                left: '0',
	                margin: '0 auto',
	                width: '100%',
	                zIndex: 2,
	                position: 'fixed',
	                backgroundColor: 'transparent'
	              } },
	            React.createElement(
	              'div',
	              { style: { maxWidth: '600px', margin: '0 auto', backgroundColor: '#FCFCFC', border: '1px solid #DDD' } },
	              React.createElement(
	                'div',
	                { style: { padding: '1em' } },
	                React.createElement(
	                  'h1',
	                  null,
	                  'Please link an account'
	                ),
	                React.createElement(
	                  'div',
	                  { style: { padding: '1em 0' } },
	                  'Credsign was unable to detect your Ethereum account. ' + 'If you do not have an account, please install Mist or ' + 'MetaMask and create one. If you do, please ensure you ' + 'are configured to use the test network. You will need ' + 'an account to publish content.'
	                ),
	                React.createElement(
	                  'span',
	                  { onClick: function onClick() {
	                      return _this4.setState({ warn: false });
	                    }, style: {
	                      borderBottom: '2px solid black',
	                      padding: '.5em 0',
	                      display: 'inline-block',
	                      cursor: 'pointer'
	                    } },
	                  'Close'
	                )
	              )
	            )
	          )
	        ),
	        React.createElement(
	          'div',
	          null,
	          view
	        ),
	        React.createElement(
	          'div',
	          { style: { height: '3em' } },
	          '\xA0'
	        ),
	        React.createElement(
	          'div',
	          { style: {
	              width: '100%',
	              position: 'absolute',
	              backgroundColor: '#fafafa',
	              borderTop: '1px solid #DDD',
	              color: 'dimgray',
	              bottom: 0,
	              height: '1em',
	              padding: '1em 0',
	              zIndex: 10
	            } },
	          React.createElement(
	            'div',
	            { style: {
	                fontSize: '69%',
	                textTransform: 'uppercase',
	                textAlign: 'center'
	              } },
	            React.createElement(
	              'span',
	              { className: 'collapsable' },
	              'Message us on '
	            ),
	            React.createElement(
	              'a',
	              { href: 'https://facebook.com/Credsign', style: {
	                  display: 'inline-block',
	                  color: 'inherit'
	                } },
	              'Facebook'
	            ),
	            React.createElement(
	              'span',
	              null,
	              ' · '
	            ),
	            React.createElement(
	              'span',
	              { className: 'collapsable' },
	              'View source on '
	            ),
	            React.createElement(
	              'a',
	              { href: 'https://github.com/credsign/credsign.github.io', style: {
	                  display: 'inline-block',
	                  color: 'inherit'
	                } },
	              'Github'
	            ),
	            React.createElement(
	              'span',
	              null,
	              ' · '
	            ),
	            React.createElement(
	              'span',
	              { className: 'collapsable' },
	              'Usage governed by '
	            ),
	            React.createElement(
	              'a',
	              {
	                href: 'https://github.com/credsign/credsign.github.io/blob/master/LICENSE',
	                style: {
	                  color: 'inherit',
	                  display: 'inline-block'
	                } },
	              'terms'
	            )
	          )
	        )
	      );
	    }
	  }]);

	  return App;
	}(React.Component);

	exports.default = App;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _formatting = __webpack_require__(3);

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Account = function (_React$Component) {
	  _inherits(Account, _React$Component);

	  function Account(props) {
	    _classCallCheck(this, Account);

	    var _this = _possibleConstructorReturn(this, (Account.__proto__ || Object.getPrototypeOf(Account)).call(this, props));

	    _this.state = {
	      listItems: [],
	      size: 0
	    };

	    _this.getPosts = _this.getPosts.bind(_this);
	    return _this;
	  }

	  _createClass(Account, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      this.getPosts(this.props.account);
	    }
	  }, {
	    key: 'componentWillReceiveProps',
	    value: function componentWillReceiveProps(nextProps) {
	      if (nextProps.account != window.location.hash.split('/').slice(-1)) {
	        this.setState({
	          loading: true,
	          listItems: [],
	          size: 0
	        });
	      } else {
	        this.getPosts(nextProps.account);
	      }
	    }
	  }, {
	    key: 'getPosts',
	    value: function getPosts(account) {
	      var _this2 = this;

	      this.setState({
	        loading: true,
	        listItems: [],
	        size: 0
	      });
	      var listItems = [];
	      publisher.Publish({ accountID: account }, { fromBlock: 0, toBlock: 'latest' }).get(function (error, posts) {
	        posts.forEach(function (post) {
	          listItems.push({
	            id: '0x' + post.args.contentID.toString(16),
	            title: (0, _formatting.getContentTitle)(post.args.attributes),
	            publisher: post.args.accountID,
	            channelName: (0, _formatting.getChannelName)(post.args.channelID),
	            timestamp: post.args.timestamp.toNumber() * 1000
	          });
	        });
	        _this2.setState({
	          listItems: listItems.reverse(),
	          size: listItems.length,
	          loading: false
	        });
	      });
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var now = new Date().getTime();
	      var listItems = this.state.listItems.map(function (listItem) {
	        var age = now - listItem.timestamp;
	        if (age > 3600000) {
	          age -= age % 3600000;
	        }
	        if (age > 60000) {
	          age -= age % 60000;
	        }
	        if (age > 1000) {
	          age -= age % 1000;
	        }
	        return React.createElement(
	          'li',
	          { key: 'li-' + listItem.id },
	          React.createElement(
	            'a',
	            { href: '#/channel/' + listItem.channelName + '/post/' + listItem.id },
	            React.createElement(
	              'div',
	              null,
	              listItem.title
	            ),
	            React.createElement(
	              'span',
	              null,
	              humanizeDuration(age) + ' ago'
	            ),
	            React.createElement(
	              'span',
	              null,
	              ' by ' + listItem.publisher.substr(0, 5) + '...' + listItem.publisher.substr(-3)
	            ),
	            React.createElement(
	              'span',
	              null,
	              ' in #' + listItem.channelName
	            )
	          )
	        );
	      });
	      var byAccount = this.props.account.length != 0 ? ' by account' : '';
	      return React.createElement(
	        'div',
	        { className: 'view-align' },
	        React.createElement(
	          'div',
	          { style: { paddingLeft: '1em', paddingBottom: '1em' } },
	          React.createElement(
	            'div',
	            { style: { fontStyle: 'italic', display: this.state.loading ? 'block' : 'none' } },
	            'Loading...'
	          ),
	          React.createElement(
	            'div',
	            { style: { display: !this.state.loading && this.state.size == 0 ? 'block' : 'none' } },
	            'No posts found'
	          ),
	          React.createElement(
	            'div',
	            { style: { display: this.state.size != 0 ? 'block' : 'none' } },
	            'Newest posts' + byAccount + ' (' + this.state.size + ')'
	          )
	        ),
	        React.createElement(
	          'ol',
	          null,
	          listItems
	        )
	      );
	    }
	  }]);

	  return Account;
	}(React.Component);

	exports.default = Account;

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getChannelName = getChannelName;
	exports.getContentTitle = getContentTitle;
	function getChannelName(channelID) {
	  var channelName = '';
	  while (channelID != 0) {
	    channelName = String.fromCharCode(channelID.mod(256)) + channelName;
	    channelID = channelID.div(256).floor();
	  }
	  return channelName;
	}

	function getContentTitle(attributes) {
	  var title = null;
	  try {
	    title = JSON.parse(attributes).title;
	  } catch (e) {
	    console.log('Invalid JSON: ' + attributes);
	  }

	  // If the title is empty or just spaces, return empty
	  if (title.replace(/ /g, '').length == 0) {
	    title = null;
	  }
	  return title;
	}

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _formatting = __webpack_require__(3);

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Content = function (_React$Component) {
	  _inherits(Content, _React$Component);

	  function Content(props) {
	    _classCallCheck(this, Content);

	    var _this = _possibleConstructorReturn(this, (Content.__proto__ || Object.getPrototypeOf(Content)).call(this, props));

	    _this.state = {
	      title: '',
	      body: '',
	      publisher: '0x0',
	      timestamp: '0',
	      loading: true,
	      retries: 10,
	      error: ''
	    };
	    return _this;
	  }

	  _createClass(Content, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      var _this2 = this;

	      var contentID = web3.toBigNumber(this.props.id);
	      publisher.Publish({ contentID: contentID }, { fromBlock: 0, toBlock: 'latest' }).get(function (error, post) {
	        publisher.Store({ contentID: contentID }, { fromBlock: 0, toBlock: 'latest' }).get(function (error, content) {
	          if (!post || !content || post.length == 0 || content.length == 0) {
	            _this2.setState({
	              loading: false,
	              retries: 0
	            });
	          } else {
	            _this2.setState({
	              title: (0, _formatting.getContentTitle)(content[0].args.attributes),
	              body: JSON.parse(content[0].args.document).body,
	              publisher: post[0].args.accountID,
	              channelName: (0, _formatting.getChannelName)(post[0].args.channelID),
	              timestamp: post[0].args.timestamp * 1000,
	              loading: false
	            });
	          }
	        });
	      });
	    }
	  }, {
	    key: 'componentDidUpdate',
	    value: function componentDidUpdate() {
	      document.getElementById('post-' + this.props.id).innerHTML = marked(this.state.body);
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      return React.createElement(
	        'div',
	        null,
	        React.createElement(
	          'div',
	          { style: { maxWidth: '600px', margin: '0 auto', padding: '1.5em 0' } },
	          React.createElement(
	            'div',
	            { style: { padding: '0 1em', color: 'dimgray' } },
	            React.createElement(
	              'div',
	              { style: { display: !this.state.loading ? 'block' : 'none' } },
	              React.createElement(
	                'div',
	                { style: { float: 'left' } },
	                React.createElement(
	                  'span',
	                  null,
	                  'Published by '
	                ),
	                React.createElement(
	                  'a',
	                  { href: '#/account/' + this.state.publisher },
	                  this.state.publisher.substr(0, 5) + '...' + this.state.publisher.substr(-3)
	                ),
	                React.createElement(
	                  'span',
	                  null,
	                  ' in '
	                ),
	                React.createElement(
	                  'a',
	                  { href: '#/channel/' + this.state.channelName },
	                  '#' + this.state.channelName
	                ),
	                '\xA0'
	              ),
	              React.createElement(
	                'div',
	                { style: { float: 'left' } },
	                React.createElement(
	                  'span',
	                  null,
	                  'on ' + new Date(this.state.timestamp).toLocaleString()
	                )
	              ),
	              React.createElement('div', { style: { float: 'none', clear: 'both' } })
	            ),
	            React.createElement(
	              'div',
	              { style: { fontStyle: 'italic', display: this.state.loading ? 'block' : 'none' } },
	              'Loading...'
	            )
	          )
	        ),
	        React.createElement(
	          'div',
	          { style: { backgroundColor: '#FFF' } },
	          React.createElement(
	            'div',
	            { style: { maxWidth: '600px', margin: '0 auto' } },
	            React.createElement(
	              'div',
	              { style: { padding: '1.5em 1em', display: this.state.loading ? 'none' : 'block', wordWrap: 'break-word' } },
	              React.createElement(
	                'h1',
	                null,
	                this.state.title
	              ),
	              React.createElement('div', { id: 'post-' + this.props.id, className: 'post' })
	            )
	          )
	        )
	      );
	    }
	  }]);

	  return Content;
	}(React.Component);

	exports.default = Content;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _formatting = __webpack_require__(3);

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var ContentFeed = function (_React$Component) {
	  _inherits(ContentFeed, _React$Component);

	  function ContentFeed(props) {
	    _classCallCheck(this, ContentFeed);

	    var _this = _possibleConstructorReturn(this, (ContentFeed.__proto__ || Object.getPrototypeOf(ContentFeed)).call(this, props));

	    _this.state = {
	      listItems: [],
	      size: 0
	    };
	    _this.getPosts = _this.getPosts.bind(_this);
	    return _this;
	  }

	  _createClass(ContentFeed, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      this.getPosts(this.props.channel);
	    }
	  }, {
	    key: 'componentWillReceiveProps',
	    value: function componentWillReceiveProps(nextProps) {
	      if (nextProps.channel != window.location.hash.split('/').slice(-1)) {
	        this.setState({
	          loading: true,
	          listItems: [],
	          size: 0
	        });
	      } else {
	        this.getPosts(nextProps.channel);
	      }
	    }
	  }, {
	    key: 'getPosts',
	    value: function getPosts(channel) {
	      var _this2 = this;

	      this.setState({
	        loading: true,
	        listItems: [],
	        size: 0
	      });
	      if (channel == '') {
	        publisher.getOverallSize(function (error, overallSize) {
	          overallSize = overallSize.toNumber();
	          if (overallSize == 0) {
	            _this2.setState({
	              loading: false
	            });
	          } else {
	            var indices = Array.from(Array(overallSize)).map(function (_, i) {
	              return i;
	            });
	            publisher.Sequence({ overallIndex: indices }, { fromBlock: 0, toBlock: 'latest' }).get(function (error, sequence) {
	              var ids = sequence.map(function (post) {
	                return post.args.contentID;
	              });
	              var listItems = [];
	              publisher.Publish({ contentID: ids }, { fromBlock: 0, toBlock: 'latest' }).get(function (error, posts) {
	                for (var i = 0; i < posts.length; i++) {
	                  listItems.push({
	                    id: '0x' + ids[i].toString(16),
	                    title: (0, _formatting.getContentTitle)(posts[i].args.attributes),
	                    publisher: posts[i].args.accountID,
	                    channelName: (0, _formatting.getChannelName)(posts[i].args.channelID),
	                    timestamp: posts[i].args.timestamp.toNumber() * 1000
	                  });
	                }
	                _this2.setState({
	                  loading: false,
	                  listItems: listItems.reverse(),
	                  size: overallSize
	                });
	              });
	            });
	          }
	        });
	      } else {
	        publisher.getChannelByName(channel, function (error, channelID) {
	          publisher.getChannelSize(channelID, function (error, channelSize) {
	            channelSize = channelSize.toNumber();
	            if (channelID == 0 || channelSize == 0) {
	              _this2.setState({
	                loading: false,
	                listItems: [],
	                size: 0
	              });
	            } else {
	              var channelName = (0, _formatting.getChannelName)(channelID);
	              var indices = Array.from(Array(channelSize)).map(function (_, i) {
	                return i;
	              });
	              publisher.Sequence({ channelID: channelID, channelIndex: indices }, { fromBlock: 0, toBlock: 'latest' }).get(function (error, sequence) {
	                var ids = sequence.map(function (post) {
	                  return post.args.contentID;
	                });
	                var listItems = [];
	                publisher.Publish({ contentID: ids }, { fromBlock: 0, toBlock: 'latest' }).get(function (error, posts) {
	                  for (var i = 0; i < posts.length; i++) {
	                    listItems.push({
	                      id: '0x' + ids[i].toString(16),
	                      title: (0, _formatting.getContentTitle)(posts[i].args.attributes),
	                      publisher: posts[i].args.accountID,
	                      channelName: channelName,
	                      timestamp: posts[i].args.timestamp.toNumber() * 1000
	                    });
	                  }
	                  _this2.setState({
	                    loading: false,
	                    listItems: listItems.reverse(),
	                    size: channelSize
	                  });
	                });
	              });
	            }
	          });
	        });
	      }
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var now = new Date().getTime();
	      var listItems = this.state.listItems.map(function (listItem) {
	        var age = now - listItem.timestamp;
	        if (age > 3600000) {
	          age -= age % 3600000;
	        }
	        if (age > 60000) {
	          age -= age % 60000;
	        }
	        if (age > 1000) {
	          age -= age % 1000;
	        }
	        return React.createElement(
	          'li',
	          { key: 'li-' + listItem.id },
	          React.createElement(
	            'a',
	            { href: '#/channel/' + listItem.channelName + '/post/' + listItem.id },
	            React.createElement(
	              'div',
	              null,
	              listItem.title
	            ),
	            React.createElement(
	              'span',
	              null,
	              humanizeDuration(age) + ' ago'
	            ),
	            React.createElement(
	              'span',
	              null,
	              ' by ' + listItem.publisher.substr(0, 5) + '...' + listItem.publisher.substr(-3)
	            ),
	            React.createElement(
	              'span',
	              null,
	              ' in #' + listItem.channelName
	            )
	          )
	        );
	      });
	      var inChannel = this.props.channel.length != 0 ? ' in channel' : '';
	      return React.createElement(
	        'div',
	        { className: 'view-align' },
	        React.createElement(
	          'div',
	          { style: { paddingLeft: '1em', paddingBottom: '1em' } },
	          React.createElement(
	            'div',
	            { style: { fontStyle: 'italic', display: this.state.loading ? 'block' : 'none' } },
	            'Loading...'
	          ),
	          React.createElement(
	            'div',
	            { style: { display: !this.state.loading && this.state.size == 0 ? 'block' : 'none' } },
	            'No posts found'
	          ),
	          React.createElement(
	            'div',
	            { style: { display: this.state.size != 0 ? 'block' : 'none' } },
	            'Newest posts' + inChannel + ' (' + this.state.size + ')'
	          )
	        ),
	        React.createElement(
	          'ol',
	          null,
	          listItems
	        )
	      );
	    }
	  }]);

	  return ContentFeed;
	}(React.Component);

	exports.default = ContentFeed;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _toMarkdown = __webpack_require__(7);

	var _toMarkdown2 = _interopRequireDefault(_toMarkdown);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Publish = function (_React$Component) {
	  _inherits(Publish, _React$Component);

	  function Publish(props) {
	    _classCallCheck(this, Publish);

	    var _this = _possibleConstructorReturn(this, (Publish.__proto__ || Object.getPrototypeOf(Publish)).call(this, props));

	    _this.state = {
	      view: 'edit',
	      channel: '',
	      error: ''
	    };

	    _this.preventHeaderUnbold = function (e) {
	      var action = e.target.getAttribute('data-action') || e.target.parentNode.getAttribute('data-action');
	      if (action == 'bold') {
	        var active = document.getElementsByClassName('medium-editor-button-active');
	        for (var i = 0; i < active.length; i++) {
	          if (/h+/.test(active[i].getAttribute('data-action', ''))) {
	            e.stopPropagation();
	            e.preventDefault();
	            return;
	          }
	        }
	      }
	    };

	    _this.preventFormatHotkey = function (e) {
	      if (e.ctrlKey || e.metaKey) {
	        switch (e.keyCode) {
	          case 66: //ctrl+B or ctrl+b
	          case 98:
	          case 73: //ctrl+I or ctrl+i
	          case 105:
	          case 85: //ctrl+U or ctrl+u
	          case 117:
	            e.stopPropagation();
	            e.preventDefault();
	            return false;
	        }
	      }
	    };

	    _this.editPost = _this.editPost.bind(_this);
	    _this.previewPost = _this.previewPost.bind(_this);
	    _this.setChannel = _this.setChannel.bind(_this);
	    _this.submitPost = _this.submitPost.bind(_this);
	    return _this;
	  }

	  _createClass(Publish, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      var editor = new MediumEditor('#new-post-body', {
	        buttonLabels: 'fontawesome',
	        keyboardCommands: false,
	        toolbar: {
	          buttons: ['bold', 'italic', 'h2', 'h3', 'image', 'anchor', 'pre', 'quote']
	        },
	        placeholder: {
	          text: 'body',
	          hideOnClick: true
	        }
	      });
	      // Prevent the user from 'unbolding' text marked with h1, h2, hX...
	      document.addEventListener('click', this.preventHeaderUnbold, true);

	      // Prevent Bold/Italics/Underline via shortcuts
	      document.addEventListener('keydown', this.preventFormatHotkey);
	    }
	  }, {
	    key: 'componentWillUnmount',
	    value: function componentWillUnmount() {
	      document.removeEventListener('click', this.preventHeaderUnbold);
	      document.removeEventListener('keydown', this.preventFormatHotkey);
	    }
	  }, {
	    key: 'editPost',
	    value: function editPost() {
	      this.setState({
	        view: 'edit',
	        error: ''
	      });
	    }
	  }, {
	    key: 'previewPost',
	    value: function previewPost() {
	      this.setState({
	        view: 'preview',
	        error: ''
	      });
	      document.getElementById('new-post-title-preview').innerHTML = document.getElementById('new-post-title').value;
	      document.getElementById('new-post-body-preview').innerHTML = marked((0, _toMarkdown2.default)(document.getElementById('new-post-body')));
	    }
	  }, {
	    key: 'setChannel',
	    value: function setChannel(e) {
	      this.setState({
	        channel: e.target.innerHTML
	      });
	    }
	  }, {
	    key: 'submitPost',
	    value: function submitPost() {
	      var _this2 = this;

	      this.setState({
	        view: 'submit'
	      });
	      var errors = [];
	      var title = document.getElementById('new-post-title').value;
	      var body = (0, _toMarkdown2.default)(document.getElementById('new-post-body'));

	      var attributes = JSON.stringify({
	        version: '1.0',
	        title: title
	      });
	      var doc = JSON.stringify({
	        version: '1.0',
	        body: body
	      });
	      publisher.getChannelByName(this.props.channel, function (error, channelID) {
	        publisher.getContentByData(_this2.props.account, channelID, attributes, doc, function (error, contentID) {
	          if (channelID == 0) {
	            errors.push('Channel must be between 3 and 30 characters and consist of only letters numbers and underscores');
	          }
	          _this2.setState({
	            error: errors.join('. ')
	          });
	          if (errors.length == 0) {
	            publisher.publish.estimateGas(_this2.props.channel, attributes, doc, indexer.address, { from: _this2.props.account, value: 0 }, function (error, gasEstimate) {
	              console.log(gasEstimate);
	              gasEstimate += 100000;
	              publisher.publish(_this2.props.channel, attributes, doc, indexer.address, { from: _this2.props.account, value: 0, gas: gasEstimate }, function (error) {
	                if (error) {
	                  _this2.setState({
	                    error: error.toString()
	                  });
	                } else {
	                  var watcher = publisher.Publish({ contentID: contentID }, { fromBlock: 'latest' });
	                  watcher.watch(function (error, post) {
	                    watcher.stopWatching(function () {});
	                    if (error) {
	                      _this2.setState({
	                        error: error.toString()
	                      });
	                    } else {
	                      window.location.hash = '#/channel/' + _this2.props.channel + '/post/0x' + post.args.contentID.toString(16);
	                    }
	                  });
	                }
	              });
	            });
	          }
	        });
	      });
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _this3 = this;

	      return React.createElement(
	        'div',
	        { style: { width: '100%', margin: '0 auto' } },
	        React.createElement(
	          'div',
	          { style: { width: '100%', backgroundColor: '#FFF' } },
	          React.createElement(
	            'div',
	            { style: { maxWidth: '600px', margin: '0 auto' } },
	            React.createElement(
	              'div',
	              { style: { padding: '1.5em 1em', wordWrap: 'break-word' } },
	              React.createElement(
	                'div',
	                { style: { display: this.state.view == 'edit' ? 'block' : 'none' } },
	                React.createElement('textarea', { id: 'new-post-title', type: 'text', placeholder: 'title' }),
	                React.createElement('div', { id: 'new-post-body', contentEditable: 'true', className: 'post' })
	              ),
	              React.createElement(
	                'div',
	                { style: { display: this.state.view != 'edit' ? 'block' : 'none' } },
	                React.createElement('h1', { id: 'new-post-title-preview' }),
	                React.createElement('div', { id: 'new-post-body-preview', className: 'post' })
	              )
	            )
	          )
	        ),
	        React.createElement(
	          'div',
	          { style: { width: '100%' } },
	          React.createElement(
	            'div',
	            { style: { maxWidth: '600px', margin: '0 auto', color: 'black' } },
	            React.createElement(
	              'div',
	              { className: 'flex', style: { padding: '1.5em 1em' } },
	              React.createElement(
	                'div',
	                { className: 'flex-grow', style: { textAlign: 'left' } },
	                React.createElement(
	                  'a',
	                  { style: {
	                      color: 'inherit',
	                      textDecoration: 'none',
	                      display: this.state.view == 'edit' ? 'inline-block' : 'none',
	                      borderBottom: '2px solid black',
	                      paddingBottom: '.5em'
	                    }, href: '#/channel/' + this.props.channel },
	                  'Cancel'
	                ),
	                React.createElement(
	                  'a',
	                  { style: {
	                      color: 'inherit',
	                      textDecoration: 'none',
	                      display: this.state.view != 'edit' ? 'inline-block' : 'none',
	                      borderBottom: '2px solid black',
	                      paddingBottom: '.5em'
	                    }, onClick: this.editPost },
	                  'Edit'
	                )
	              ),
	              React.createElement(
	                'div',
	                { className: 'flex-grow', style: { textAlign: 'right' } },
	                React.createElement(
	                  'a',
	                  { style: {
	                      color: 'inherit',
	                      textDecoration: 'none',
	                      display: this.state.view == 'edit' ? 'inline-block' : 'none',
	                      borderBottom: '2px solid black',
	                      paddingBottom: '.5em'
	                    }, onClick: this.previewPost },
	                  'Preview'
	                ),
	                React.createElement(
	                  'a',
	                  { style: {
	                      color: 'inherit',
	                      textDecoration: 'none',
	                      display: this.state.view != 'edit' ? 'inline-block' : 'none',
	                      borderBottom: '2px solid black',
	                      paddingBottom: '.5em'
	                    }, onClick: this.submitPost },
	                  'Publish'
	                )
	              ),
	              React.createElement(
	                'div',
	                { className: 'backdrop', style: {
	                    width: '100%',
	                    height: '100%',
	                    opacity: 0.5,
	                    backgroundColor: 'black',
	                    position: 'fixed',
	                    zIndex: 1,
	                    display: this.state.view == 'submit' ? 'block' : 'none',
	                    top: '0',
	                    left: '0'
	                  } },
	                ' '
	              ),
	              React.createElement(
	                'div',
	                { style: {
	                    display: this.state.view == 'submit' ? 'block' : 'none',
	                    top: '15%',
	                    left: '0',
	                    width: '100%',
	                    position: 'fixed',
	                    backgroundColor: 'transparent',
	                    zIndex: 2
	                  } },
	                React.createElement(
	                  'div',
	                  { style: { maxWidth: '600px', margin: '0 auto', backgroundColor: '#FCFCFC', border: '1px solid #DDD' } },
	                  React.createElement(
	                    'div',
	                    { style: { padding: '1em', display: this.state.error.length > 0 ? 'block' : 'none' } },
	                    React.createElement(
	                      'h1',
	                      null,
	                      'Unable to publish'
	                    ),
	                    React.createElement(
	                      'div',
	                      { style: { padding: '1em 0' } },
	                      this.state.error
	                    ),
	                    React.createElement(
	                      'span',
	                      { onClick: function onClick() {
	                          return _this3.setState({ view: 'edit', error: '' });
	                        }, style: {
	                          borderBottom: '2px solid black',
	                          padding: '.5em 0',
	                          display: 'inline-block',
	                          cursor: 'pointer'
	                        } },
	                      'Close'
	                    )
	                  ),
	                  React.createElement(
	                    'div',
	                    { style: { padding: '1em', display: this.state.error.length == 0 ? 'block' : 'none' } },
	                    React.createElement(
	                      'h1',
	                      null,
	                      'Publishing...'
	                    ),
	                    React.createElement(
	                      'div',
	                      { style: { padding: '1em 0' } },
	                      'Your post is being published. This page will redirect to your post once published. ' + 'If you are not redirected after several minutes, try closing this message and publishing again.'
	                    ),
	                    React.createElement(
	                      'span',
	                      { onClick: function onClick() {
	                          return _this3.setState({ view: 'publish', error: '' });
	                        }, style: {
	                          borderBottom: '2px solid black',
	                          padding: '.5em 0',
	                          display: 'inline-block',
	                          cursor: 'pointer'
	                        } },
	                      'Close'
	                    )
	                  )
	                )
	              )
	            )
	          )
	        )
	      );
	    }
	  }]);

	  return Publish;
	}(React.Component);

	exports.default = Publish;

/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.default = toMarkdown;
	// Adapted from https://gist.github.com/Youwotma/1762527
	// No license provided in original, so assume license of this repo.

	function toMarkdown(node) {

	    var markdownEscape = function markdownEscape(text) {
	        return text ? text.replace(/\s+/g, " ").replace(/[\\\-*_>#]/g, "\\$&") : '';
	    };

	    var repeat = function repeat(str, times) {
	        return new Array(times + 1).join(str);
	    };

	    var childsToMarkdown = function childsToMarkdown(tree, mode) {
	        var res = "";
	        for (var i = 0, l = tree.childNodes.length; i < l; i++) {
	            res += nodeToMarkdown(tree.childNodes[i], mode);
	        }
	        return res;
	    };

	    var nodeToMarkdown = function nodeToMarkdown(tree, mode) {
	        var nl = "\n\n";
	        if (tree.nodeType == 3) {
	            // Text node
	            return markdownEscape(tree.nodeValue);
	        } else if (tree.nodeType == 1) {
	            if (mode == "block") {
	                switch (tree.tagName.toLowerCase()) {
	                    case "br":
	                        return nl;
	                    case "hr":
	                        return nl + "---" + nl;
	                    // Block container elements
	                    case "p":
	                    case "div":
	                    case "section":
	                    case "address":
	                    case "center":
	                        return nl + childsToMarkdown(tree, "block") + nl;
	                    case "ul":
	                        return nl + childsToMarkdown(tree, "u") + nl;
	                    case "ol":
	                        return nl + childsToMarkdown(tree, "o") + nl;
	                    case "pre":
	                        return nl + "    " + childsToMarkdown(tree, "inline") + nl;
	                    case "code":
	                        if (tree.childNodes.length == 1) {
	                            break; // use the inline format
	                        }
	                        return nl + "    " + childsToMarkdown(tree, "inline") + nl;
	                    case "h1":
	                    case "h2":
	                    case "h3":
	                    case "h4":
	                    case "h5":
	                    case "h6":
	                        return nl + repeat("#", +tree.tagName[1]) + "  " + childsToMarkdown(tree, "inline") + nl;
	                    case "blockquote":
	                        return nl + "> " + childsToMarkdown(tree, "inline") + nl;
	                }
	            }
	            if (/^[ou]+$/.test(mode)) {
	                if (tree.tagName == "LI") {
	                    return "\n" + repeat("  ", mode.length - 1) + (mode[mode.length - 1] == "o" ? "1. " : "- ") + childsToMarkdown(tree, mode + "l");
	                } else {
	                    console.log("[toMarkdown] - invalid element at this point " + mode.tagName);
	                    return childsToMarkdown(tree, "inline");
	                }
	            } else if (/^[ou]+l$/.test(mode)) {
	                if (tree.tagName == "UL") {
	                    return childsToMarkdown(tree, mode.substr(0, mode.length - 1) + "u");
	                } else if (tree.tagName == "OL") {
	                    return childsToMarkdown(tree, mode.substr(0, mode.length - 1) + "o");
	                }
	            }

	            // Inline tags
	            switch (tree.tagName.toLowerCase()) {
	                case "strong":
	                case "b":
	                    return "**" + childsToMarkdown(tree, "inline") + "**";
	                case "em":
	                case "i":
	                    return "_" + childsToMarkdown(tree, "inline") + "_";
	                case "code":
	                    // Inline version of code
	                    return "`" + childsToMarkdown(tree, "inline") + "`";
	                case "a":
	                    return "[" + childsToMarkdown(tree, "inline") + "](" + tree.getAttribute("href") + ")";
	                case "img":
	                    return nl + "![: " + markdownEscape(tree.getAttribute("alt")) + "](" + tree.getAttribute("src") + ")" + nl;
	                case "script":
	                case "style":
	                case "meta":
	                    return "";
	                default:
	                    console.log("[toMarkdown] - undefined element " + tree.tagName);
	                    return childsToMarkdown(tree, mode);
	            }
	        }
	    };

	    return nodeToMarkdown(node, "block").replace(/[\n]{2,}/g, "\n\n").replace(/^[\n]+/, "").replace(/[\n]+$/, "");
	}

/***/ }
/******/ ]);