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
  }
  catch (e) {
    console.log(`Invalid JSON: ${attributes}`);
  }

  // If the title is empty or just spaces, return empty
  if (title.replace(/ /g, '').length == 0) {
    title = null;
  }
  return title;
}

class Post extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      body: '',
      publisher: '0x0',
      timestamp: '0',
      loading: true,
      retries: 10,
      error: ''
    };
  }

  componentDidMount() {
    var contentID = web3.toBigNumber(this.props.id);
    publisher.Publish({contentID: contentID}, {fromBlock: 0, toBlock: 'latest'}).get((error, post) => {
      publisher.Store({contentID: contentID}, {fromBlock: 0, toBlock: 'latest'}).get((error, content) => {
        if (!post || !content || post.length == 0 || content.length == 0) {
          this.setState({
            loading: false,
            retries: 0
          });
        }
        else {
          this.setState({
            title: getContentTitle(content[0].args.attributes),
            body: JSON.parse(content[0].args.document).body,
            publisher: post[0].args.accountID,
            timestamp: post[0].args.timestamp,
            loading: false
          });
        }
      });
    });
  }

  componentDidUpdate() {
    document.getElementById('post-'+this.props.id).innerHTML = marked(this.state.body);
  }

  render() {
    return (
      <div>
        <div style={{backgroundColor: '#FFF'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{padding: '1.5em 1em', display: this.state.loading ? 'none' : 'block', wordWrap: 'break-word'}}>
              <div style={{color: 'gray', paddingBottom: '1em'}}>
                <span>{`Published ${new Date(this.state.timestamp* 1000).toLocaleString()} by `}</span>
                <a href={`#/account/${this.state.publisher}`} style={{
                  paddingBottom: '1px',
                  borderBottom: '1px solid gray',
                  color: 'gray'
                }}>{`${this.state.publisher.substr(0,5)}...${this.state.publisher.substr(-3)}`}</a>
                <span>{` in `}</span>
                <a href={`#/channel/${this.props.channel}`} style={{
                  color:'gray',
                  paddingBottom: '1px',
                  borderBottom: '1px solid gray'
                }}>{
                  `#${this.props.channel}`
                }</a>
              </div>
              <h1>{this.state.title}</h1>
              <div id={'post-'+this.props.id} className='post'></div>
            </div>
            <div style={{padding: '1.5em 1em', display: this.state.loading ? 'block' : 'none', fontStyle: 'italic'}}>
              <div style={{color: 'gray'}}>
                <span style={{display: this.state.retries == 0 ? 'block' : 'none'}}>Unable to fetch content</span>
                <span style={{display: this.state.retries != 0 ? 'block' : 'none'}}>Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class Create extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: 'edit',
      channel: '',
      error: ''
    };

    this.preventHeaderUnbold = (e) => {
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

    this.preventFormatHotkey = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.keyCode){
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

    this.editPost = this.editPost.bind(this);
    this.previewPost = this.previewPost.bind(this);
    this.setChannel = this.setChannel.bind(this);
    this.submitPost = this.submitPost.bind(this);
  }

  componentDidMount() {
    var editor = new MediumEditor('#new-post-body', {
      buttonLabels: 'fontawesome',
      keyboardCommands: false,
      toolbar: {
        buttons: ['bold', 'italic', 'h2', 'h3', 'image', 'anchor', 'pre', 'quote'],
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

  componentWillUnmount() {
    document.removeEventListener('click', this.preventHeaderUnbold);
    document.removeEventListener('keydown', this.preventFormatHotkey);
  }

  editPost() {
    this.setState({
      view: 'edit',
      error: ''
    });
  }

  previewPost() {
    this.setState({
      view: 'preview',
      error: ''
    });
    document.getElementById('new-post-title-preview').innerHTML = document.getElementById('new-post-title').value;
    document.getElementById('new-post-body-preview').innerHTML = marked(toMarkdown(document.getElementById('new-post-body')));
  }

  setChannel(e) {
    this.setState({
      channel: e.target.innerHTML
    });
  }

  submitPost() {
    this.setState({
      view: 'submit'
    });
    var errors = [];
    var title = document.getElementById('new-post-title').value;
    var body = toMarkdown(document.getElementById('new-post-body'));

    var attributes = JSON.stringify({
      version: '1.0',
      title: title
    });
    var doc = JSON.stringify({
      version: '1.0',
      body: body
    });
    publisher.getChannelByName(this.props.channel, (error, channelID) => {
      publisher.getContentByData(this.props.account, channelID, attributes, doc, (error, contentID) => {
        if (channelID == 0) {
          errors.push('Channel must be between 3 and 30 characters and consist of only letters numbers and underscores');
        }
        this.setState({
          error: errors.join('. ')
        });
        if (errors.length == 0) {
          publisher.publish.estimateGas(this.props.channel, attributes, doc, indexer.address, {from: this.props.account, value: 0}, (error, gasEstimate) => {
            console.log(gasEstimate);
            gasEstimate += 100000;
            publisher.publish(this.props.channel, attributes, doc, indexer.address, {from: this.props.account, value: 0, gas: gasEstimate}, (error) => {
              if (error) {
                this.setState({
                  error: error.toString()
                });
              }
              else {
                var watcher = publisher.Publish({contentID: contentID}, {fromBlock: 'latest'});
                watcher.watch((error, post) => {
                  watcher.stopWatching();
                  if (error) {
                    this.setState({
                      error: error.toString()
                    });
                  }
                  else {
                    window.location.hash = `#/channel/${this.props.channel}/post/0x${post.args.contentID.toString(16)}`;
                  }
                });
              }
            });
          });
        }
      });
    });
  }

  render() {
    return (
      <div style={{width: '100%', margin: '0 auto'}}>
        <div style={{width: '100%', backgroundColor: '#FFF'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{padding: '1em', wordWrap: 'break-word'}}>
              <div style={{display: this.state.view == 'edit' ? 'block' : 'none'}}>
                <textarea id='new-post-title' type='text' placeholder='title'></textarea>
                <div id='new-post-body' contentEditable='true' className='post'></div>
              </div>
              <div style={{display: this.state.view != 'edit' ? 'block' : 'none'}}>
                <h1 id='new-post-title-preview'></h1>
                <div id='new-post-body-preview' className='post'></div>
              </div>
            </div>
          </div>
        </div>
        <div style={{width: '100%'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div className='flex' style={{padding: '1.5em 1em'}}>
              <div className='flex-grow' style={{textAlign: 'left'}}>
                <a style={{
                  color: 'black',
                  display: this.state.view == 'edit' ? 'inline-block' : 'none',
                  borderBottom: '2px solid black',
                  paddingBottom: '.5em'
                }} href={'#/channel/'+this.props.channel}>Cancel</a>
                <a style={{
                  display: this.state.view != 'edit' ? 'inline-block' : 'none',
                  borderBottom: '2px solid black',
                  paddingBottom: '.5em'
                }} onClick={this.editPost}>Edit</a>
              </div>
              <div className='flex-grow' style={{textAlign: 'right'}}>
                <a style={{
                  display: this.state.view == 'edit' ? 'inline-block' : 'none',
                  borderBottom: '2px solid black',
                  paddingBottom: '.5em'
                }} onClick={this.previewPost}>Preview</a>
                <a style={{
                  display: this.state.view != 'edit' ? 'inline-block' : 'none',
                  borderBottom: '2px solid black',
                  paddingBottom: '.5em'
                }} onClick={this.submitPost}>Publish</a>
              </div>
              <div className='backdrop' style={{
                width: '100%',
                height: '100%',
                opacity: 0.5,
                backgroundColor: 'black',
                position: 'fixed',
                zIndex: 1,
                display: this.state.view == 'submit' ? 'block' : 'none',
                top: '0',
                left: '0'
              }}>{' '}</div>
              <div style={{
                display: this.state.view == 'submit' ? 'block' : 'none',
                top: '25%',
                left: '0',
                width: '100%',
                position: 'fixed',
                backgroundColor: 'transparent',
                zIndex: 2
              }}>
                <div style={{maxWidth: '600px', margin: '0 auto', backgroundColor: '#FCFCFC', border: '1px solid #DDD'}}>
                  <div style={{padding: '1em', display: this.state.error.length > 0 ? 'block' : 'none'}}>
                    <h1>Unable to publish</h1>
                    <div style={{padding: '1em 0'}}>{this.state.error}</div>
                    <span onClick={() => this.setState({view: 'edit', error: ''})} style={{
                      borderBottom: '2px solid black',
                      padding: '.5em 0',
                      display: 'inline-block',
                      cursor: 'pointer'
                    }}>Close</span>
                  </div>
                  <div style={{padding: '1em', display: this.state.error.length == 0 ? 'block' : 'none'}}>
                    <h1>Publishing...</h1>
                    <div style={{padding: '1em 0'}}>{
                      'Your post is being published. This page will redirect to your post once published. '+
                      'If you are not redirected after several minutes, try closing this message and publishing again.'
                    }</div>
                    <span onClick={() => this.setState({view: 'publish', error: ''})} style={{
                      borderBottom: '2px solid black',
                      padding: '.5em 0',
                      display: 'inline-block',
                      cursor: 'pointer'
                    }}>Close</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class NewestPosts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      size: 0
    };
    this.getPosts = this.getPosts.bind(this);
  }

  componentDidMount() {
    this.getPosts(this.props.channel);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.channel != this.props.channel) {
      this.getPosts(nextProps.channel);
    }
  }

  getPosts(channel) {
    this.setState({
      loading: true,
      menu: false
    });
    if (channel == '') {
      publisher.getOverallSize((error, overallSize) => {
        overallSize = overallSize.toNumber();
        if (overallSize == 0) {
          this.setState({
            loading: false,
            listItems: [],
            size: 0
          });
        }
        else {
          var indices = Array.from(Array(overallSize)).map((_, i) => i);
          publisher.Sequence({overallIndex: indices}, {fromBlock: 0, toBlock: 'latest'}).get((error, sequence) => {
            var ids = sequence.map((post) => post.args.contentID);
            var listItems = [];
            publisher.Publish({contentID: ids}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
              for (var i = 0; i < posts.length; i++) {
                listItems.push({
                  id: '0x' + ids[i].toString(16),
                  title: getContentTitle(posts[i].args.attributes),
                  channelName: getChannelName(posts[i].args.channelID),
                  timestamp: posts[i].args.timestamp.toNumber() * 1000
                });
              }
              this.setState({
                loading: false,
                listItems: listItems.reverse(),
                size: overallSize
              });
            });
          });
        }
      });
    }
    else {
      publisher.getChannelByName(channel, (error, channelID) => {
        publisher.getChannelSize(channelID, (error, channelSize) => {
          channelSize = channelSize.toNumber();
          if (channelID == 0 || channelSize == 0) {
            this.setState({
              loading: false,
              listItems: [],
              size: 0
            });
          }
          else {
            var channelName = getChannelName(channelID);
            var indices = Array.from(Array(channelSize)).map((_, i) => i);
            publisher.Sequence({channelID: channelID, channelIndex: indices}, {fromBlock: 0, toBlock: 'latest'}).get((error, sequence) => {
              var ids = sequence.map((post) => post.args.contentID);
              var listItems = [];
              publisher.Publish({contentID: ids}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
                for (var i = 0; i < posts.length; i++) {
                  listItems.push({
                    id: '0x' + ids[i].toString(16),
                    title: getContentTitle(posts[i].args.attributes),
                    channelName: channelName,
                    timestamp: posts[i].args.timestamp.toNumber() * 1000
                  });
                }
                this.setState({
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

  render() {
    var now = new Date().getTime();
    var listItems = this.state.listItems.map((listItem) => {
      var age = now - listItem.timestamp;
      if (age > 3600000) {
        age -= (age % 3600000);
      }
      if (age > 60000) {
        age -= age % 60000;
      }
      if (age > 1000) {
        age -= age % 1000;
      }
      return (
        <li key={'li-'+listItem.id}>
          <a href={`#/channel/${listItem.channelName}/post/${listItem.id}`}>
            <div>{listItem.title}</div>
            <span>{`${humanizeDuration(age)} ago in #${listItem.channelName}`}</span>
          </a>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <ol>{listItems}</ol>
        <span style={{paddingLeft: '1em', display: listItems.length == 0 ? 'block' : 'none', fontStyle: 'italic'}}>{
          this.state.loading ? 'Loading...' : 'Nothing to see here'
        }</span>
      </div>
    );
  }
}

class Account extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: []
    };

    this.getPosts = this.getPosts.bind(this);
    this.getAddress = this.getAddress.bind(this);
  }

  getAddress(input) {
    if (parseInt(input) > 0)
      return input;
    else
      return '-1';
  }

  componentDidMount() {
    var account = this.getAddress(this.props.account);
    this.getPosts(this.state.filter, account);
  }

  componentWillReceiveProps(nextProps) {
    var account = this.getAddress(nextProps.account);
    if (account != this.props.account) {
      this.getPosts(account);
    }
  }

  getPosts(account) {
    this.setState({
      loading: true,
      menu: false,
    });
    var listItems = [];
    publisher.Publish({accountID: account}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
      posts.forEach((post) => {
        listItems.push({
          id: '0x' + post.args.contentID.toString(16),
          title: getContentTitle(post.args.attributes),
          channelName: getChannelName(post.args.channelID),
          timestamp: post.args.timestamp.toNumber() * 1000
        });
      });
      this.setState({
        listItems: listItems.reverse(),
        loading: false
      });
    });
  }

  render() {
    var now = new Date().getTime();
    var listItems = this.state.listItems.map((listItem) => {
      var age = now - listItem.timestamp;
      if (age > 60000) {
        age -= age % 60000;
      }
      return (
        <li key={'li-'+listItem.id}>
          <a href={`#/channel/${listItem.channelName}/post/${listItem.id}`}>
            <div>{listItem.title}</div>
            <span>{`${humanizeDuration(age)} ago in #${listItem.channelName}`}</span>
          </a>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <ol>{listItems}</ol>
        <span style={{paddingLeft: '1em', display: listItems.length == 0 ? 'block' : 'none', fontStyle: 'italic'}}>{
          this.state.loading ? 'Loading...' : 'Nothing to see here'
        }</span>
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      levelOne: '',
      levelTwo: '',
      levelThree: '',
      levelFour: '',
      account: '',
      contentID: null
    };


    this.route = this.route.bind(this);
    this.setFilter = this.setFilter.bind(this);

    window.addEventListener('hashchange', () => this.route(window.location.hash));
  }

  componentDidMount() {
    this.route(window.location.hash);
    web3.eth.getAccounts((error, accounts) => {
      if (accounts.length > 0) {
        var address = accounts[0];
        this.setState({
          account: address
        });
      }
      else {
        this.setState({
          warn: true
        });
      }
    });
  }

  setFilter(e) {
    var filter = e.target.value;
    if (this.state.timeout > 0) {
      clearTimeout(this.state.timeout);
    }
    this.setState({
      levelTwo: e.target.value,
      timeout: setTimeout(() => {
        window.location.hash = `#/${this.state.levelOne}/${filter}`;
      }, 500)
    });
  }

  componentDidUpdate() {
    document.getElementById('channel').innerHTML = this.state.levelTwo;
  }

  route(href) {
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

  render() {

    var view = '';
    if (this.state.levelOne == 'channel') {
      if (this.state.levelThree == 'post') {
        view = <Post id={this.state.levelFour} channel={this.state.levelTwo} account={this.state.account} />;
      }
      else {
        view = <NewestPosts channel={this.state.levelTwo} account={this.state.account} />;
      }
    }
    else if (this.state.levelOne == 'publish'){
      view = <Create channel={this.state.levelTwo} account={this.state.account} />
    }
    else if (this.state.levelOne == 'account') {
      view = <Account account={this.state.levelTwo} />;
    }
    var filter;
    if (this.state.levelOne == 'account') {
      filter = `#/channel/`;
    }
    else if (this.state.levelOne == 'publish') {
      filter = `#/publish/${this.state.levelTwo}`;
    }
    else {
      filter = `#/account/${this.state.account}`;
    }
    return (
      <div style={{padding: '3em 0'}}>
        <div style={{
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
        }}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <a href='/' alt='¢'><img src='logo.svg' style={{width: '1.5em', height: '1.5em', margin: '0 auto', padding: '.75em'}} /></a>
          </div>
        </div>
        <div style={{maxWidth: '600px', margin: '0 auto', padding: '1.5em 0'}}>
          <div className='flex'>
            <a className='flex-shrink' href={filter} style={{
              color: this.state.levelOne == 'publish' ? 'gray' : 'purple',
              padding: '.5em 0',
              paddingLeft: '1em',
              border: '1px solid #DDD',
              borderRight: '0',
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: 'white'
            }}>
              <i style={{paddingTop: '.05em'}} className={this.state.levelOne == 'account' ? 'fa fa-user' : 'fa fa-hashtag'}></i>
            </a>
            <input type='text' placeholder={this.state.levelOne == 'account' ? '0x321...' : 'channel'} id='channel' className='flex-grow' style={{
              backgroundColor: 'transparent',
              fontSize: '1em',
              padding: '.5em',
              margin: 0,
              border: '1px solid #DDD',
              borderLeft: 0,
              backgroundColor: 'white',
              outline: 0,
              color: 'black'
            }} value={this.state.levelTwo} onChange={this.setFilter}></input>
            <a className='flex-shrink' style={{
              color: 'white',
              backgroundColor: 'purple',
              display: (this.state.levelOne == 'publish' || this.state.account == '') ? 'none' : 'block',
              padding: '.5em 0',
              marginLeft: '1em',
              borderTop: '1px solid purple',
              borderBottom: '1px solid purple',
              width: '3em',
              textAlign: 'center'
            }} href={`#/publish/${this.state.levelOne == 'channel' ? this.state.levelTwo : ''}`}>
              <i className='fa fa-pencil'></i>
            </a>
          </div>
        </div>
        <div style={{display: this.state.warn ? 'block': 'none'}}>
          <div className='backdrop' style={{
            width: '100%',
            height: '100%',
            opacity: 0.5,
            backgroundColor: 'black',
            position: 'fixed',
            zIndex: 1,
            top: '0',
            left: '0'
          }}>{' '}</div>
          <div style={{
            top: '25%',
            left: '0',
            margin: '0 auto',
            width: '100%',
            zIndex: 2,
            position: 'fixed',
            backgroundColor: 'transparent'
          }}>
            <div style={{maxWidth: '600px', margin: '0 auto', backgroundColor: '#FCFCFC', border: '1px solid #DDD'}}>
              <div style={{padding: '1em'}}>
                <h1>Please link an account</h1>
                <div style={{padding: '1em 0'}}>{
                  'CredSign was unable to detect your Ethereum account. '+
                  'If you do not have an account, please install Mist or '+
                  'MetaMask and create one. If you do, please ensure you '+
                  'are configured to use the test network. You will need '+
                  'an account to publish content.'
                }</div>
                <span onClick={() => this.setState({warn: false})} style={{
                  borderBottom: '2px solid black',
                  padding: '.5em 0',
                  display: 'inline-block',
                  cursor: 'pointer'
                }}>Close</span>
              </div>
            </div>
          </div>
        </div>
        <div>{view}</div>
        <div style={{
          width: '100%',
          position: 'fixed',
          backgroundColor: '#fafafa',
          borderTop: '1px solid #DDD',
          color: 'gray',
          bottom: 0,
          height: '1em',
          padding: '1em 0',
          zIndex: 10
        }}>
          <div style={{
            fontSize: '69%',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            textAlign: 'center'
          }}>
            <span className='collapsable'>{'Message us on '}</span>
            <a href={'https://facebook.com/CredSign'} style={{
              paddingBottom: '1px',
              borderBottom: '1px solid gray',
              display: 'inline-block',
              color: 'gray'
            }}>Facebook</a>
            <span>{' · '}</span>
            <span className='collapsable'>{'View source on '}</span>
            <a href={'https://github.com/CredSign/credsign.github.io'} style={{
              paddingBottom: '1px',
              borderBottom: '1px solid gray',
              display: 'inline-block',
              color: 'gray'
            }}>Github</a>
            <span>{' · '}</span>
            <span className='collapsable'>{'Usage governed by '}</span>
            <a
              href='https://github.com/CredSign/credsign.github.io/blob/master/LICENSE'
              style={{
                color: 'gray',
                display: 'inline-block',
                paddingBottom: '1px',
                borderBottom: '1px solid gray'
              }}>terms</a>
          </div>
        </div>
      </div>
    );
  }
}

window.App = App;
