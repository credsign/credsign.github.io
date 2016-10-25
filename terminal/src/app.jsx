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

function aggregateSignature(result, signature) {
  var contentID = '0x' + signature.args.contentID.toString(16);
  if (result.funds[contentID] === undefined) {
    result.sequence.unshift(contentID);
  }
  result.funds[contentID] = signature.args.newCred.toString();
}

class Post extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newCred: '',
      title: '',
      body: '',
      publisher: '0x0',
      timestamp: '0',
      cred: 0,
      rank: 0,
      funds: 0,
      signed: false,
      signing: false,
      error: ''
    };
    this.signPost = this.signPost.bind(this);
    this.onCredChange = this.onCredChange.bind(this);
  }

  componentDidMount() {
    var contentID = web3.toBigNumber(this.props.id);
    credsign.Post({contentID: contentID}, {fromBlock: 0, toBlock: 'latest'}).get((error, post) => {
      credsign.Store({contentID: contentID}, {fromBlock: 0, toBlock: 'latest'}).get((error, content) => {
        credrank.getCredRanksByContents(credsign.address, [this.props.id], (error, credRanks) => {
          var funds = 0;
          if (window.accountSignatures !== undefined) {
            funds = window.accountSignatures[this.props.account].funds[this.props.id] || 0;
          }
          this.setState({
            title: getContentTitle(content[0].args.attributes),
            body: JSON.parse(content[0].args.document).body,
            publisher: post[0].args.accountID,
            timestamp: post[0].args.timestamp,
            cred: parseInt(credRanks[0][0].toString()),
            rank: parseInt(credRanks[1][0].toString()),
            funds: funds
          });
        });
      });
    });
  }

  componentDidUpdate() {
    document.getElementById('post-'+this.props.id).innerHTML = marked(this.state.body);
  }

  onCredChange(e) {
    this.setState({
      newCred: e.target.value
    });
  }

  signPost() {
    this.setState({
      signing: true
    });
    var newCred = this.state.newCred;
    var oldCred = parseInt(this.state.funds);
    var value = newCred > oldCred ? web3.toBigNumber(10).pow(16).times(newCred - oldCred) : 0;
    credsign.sign.estimateGas(this.props.id, newCred, credrank.address, {from: this.props.account, value: value}, (error, gasEstimate) => {
      console.log(gasEstimate);
      gasEstimate += 100000;
      credsign.sign(this.props.id, newCred, credrank.address, {from: this.props.account, value: value, gas: gasEstimate}, (error, result) => {
        if (error) {
          this.setState({
            error: error.toString()
          });
        }
        else {
          var watcher = credsign.Sign({accountID: this.props.account, contentID: this.props.id}, {fromBlock: 'latest'});
          watcher.watch((error, signature) => {
            watcher.stopWatching();
            if (error) {
              this.setState({
                error: error.toString()
              });
            }
            else {
              credrank.getCredRanksByContents(credsign.address, [this.props.id], (error, credRanks) => {
                this.setState({
                  signing: false,
                  cred: parseInt(credRanks[0][0].toString()),
                  rank: parseInt(credRanks[1][0].toString()),
                  newCred: '',
                  signed: true,
                  funds: parseInt(signature.args.newCred.toString())
                });
              });
            }
          });
        }
      });
    });
  }

  render() {
    var rankCaption = this.state.rank > 0
      ? `Rank ${this.state.rank} with ${this.state.cred}¢`
      : `Currently unranked`;
    return (
      <div>
        <div style={{backgroundColor: '#FFF'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{padding: '1.5em 1em'}}>
              <div style={{color: 'gray', paddingBottom: '1em'}}>
                <span>{`Posted ${new Date(this.state.timestamp* 1000).toLocaleString()} by `}</span>
                <a href={`#/account/${this.state.publisher}`} style={{
                  borderBottom: '2px solid gray',
                  padding: '.5em 0',
                  color: 'gray'
                }}>{`${this.state.publisher.substr(0,5)}...${this.state.publisher.substr(-3)}`}</a>
                <span>{` in `}</span>
                <a href={`#/channel/${this.props.channel}`} style={{
                  color:'gray',
                  borderBottom: '2px solid gray',
                  paddingBottom: '.5em'}}>{
                  `#${this.props.channel}`
                }</a>
              </div>
              <h1>{this.state.title}</h1>
              <div id={'post-'+this.props.id}></div>
            </div>
          </div>
        </div>
        <div style={{maxWidth: '600px', margin: '0 auto'}}>
          <div className='flex' style={{padding: '1.5em 1em'}}>
            <div className='flex-grow' style={{display: 'block', textAlign: 'left'}}>
              <div>
                <span>{rankCaption}</span>
              </div>
            </div>
            <div className='flex-grow' style={{
              textAlign: 'right',
              display: (this.props.account == '') ? 'none' : 'block'
            }}>
              <div style={{display: !this.state.signing ? 'block' : 'none'}}>
                <input type='text' name='cred' placeholder={this.state.funds} value={this.state.newCred} onChange={this.onCredChange} style={{
                  textAlign: 'right',
                  fontSize: '1em',
                  border: '0',
                  backgroundColor: 'transparent',
                  outline: 'none'
                }} />
                <span style={{paddingRight: '.5em'}}>¢</span>
                <a onClick={this.signPost} style={{
                  color: 'black',
                  display: 'inline-block',
                  borderBottom: '2px solid black',
                  paddingBottom: '.5em'
                }}>Sign</a>
              </div>
              <div style={{display: this.state.signing ? 'block' : 'none'}}>
                <span>Signing, please wait...</span>
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

    if (credsign.getChannelByName(this.props.channel) == 0) {
      errors.push('Channel must be between 3 and 30 characters and consist of only letters numbers and underscores');
    }
    if (title.length < 10 || title > 100) {
      errors.push('Title must be between 10 and 100 characters');
    }
    this.setState({
      error: errors.join('. '),
      view: 'submit'
    });

    if (errors.length == 0) {
      var nonce = web3.sha3(web3.toBigNumber(0).constructor.random().toString());
      this.setState({
        nonce: nonce
      })
      credsign.post.estimateGas(this.props.channel, attributes, doc, nonce, 0, credrank.address, {from: this.props.account, value: 0}, (error, gasEstimate) => {
        console.log(gasEstimate);
        gasEstimate += 100000;
        credsign.post(this.props.channel, attributes, doc, nonce, 0, credrank.address, {from: this.props.account, value: 0, gas: gasEstimate}, (error) => {
          if (error) {
            this.setState({
              error: error.toString()
            });
          }
          else {
            var watcher = credsign.Store({accountID: this.props.account, nonce: this.state.nonce}, {fromBlock: 'latest'});
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
  }

  render() {
    return (
      <div style={{width: '100%', margin: '0 auto'}}>
        <div style={{width: '100%', backgroundColor: '#FFF'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{padding: '2em 1em'}}>
              <div style={{display: this.state.view == 'edit' ? 'block' : 'none'}}>
                <textarea id='new-post-title' type='text' placeholder='title'></textarea>
                <div id='new-post-body' contentEditable='true'></div>
              </div>
              <div style={{display: this.state.view != 'edit' ? 'block' : 'none'}}>
                <h1 id='new-post-title-preview'></h1>
                <div id='new-post-body-preview'></div>
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

class RankedChannels extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      listItems: [],
      count: 0
    };
  }

  componentDidMount() {
    credrank.getNumChannels(credsign.address, (error, numRanks) => {
      if (numRanks == 0) {
        this.setState({
          loaded: true,
          listItems: [],
          count: 0
        });
        return;
      }
      credrank.getChannelsByRanks(credsign.address, 1, numRanks, (error, tuple) => {
        var ids = tuple[0];
        var cred = tuple[1].map((cred) => parseInt(cred.toString()));
        var ranks = tuple[2].map((rank) => parseInt(rank.toString()));

        var listItems = [];
        for (var i = 0; i < ids.length; i++) {
          listItems.push({
            id: '0x' + ids[i].toString(16),
            channelName: getChannelName(ids[i]),
            rank: ranks[i].toString(),
            cred: cred[i].toString()
          });
        }
        this.setState({
          loaded: true,
          listItems: listItems,
          count: numRanks
        });
      });
    });
  }

  render() {
    var listItems = this.state.listItems.map((listItem) => {
      return (
        <li key={'li-'+listItem.id}>
          <a href={`#/channel/${listItem.channelName}`}>
            <div>{'#' + listItem.channelName}</div>
            <span>{'Rank '+listItem.rank + ' with '+listItem.cred + '¢ signed'}</span>
          </a>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <div>
          <span>{'Top channels'}</span>
          <span>{' (' + this.state.count + ')'}</span>
          </div>
        <ol>{listItems}</ol>
        <span style={{paddingLeft: '1em', display: listItems.length == 0 ? 'block' : 'none', fontStyle: 'italic'}}>Nothing to see here</span>
      </div>
    );
  }
}

class ChannelPosts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      channelID: -1,
      listItems: [],
      filter: 'Top',
      count: 0
    };
    this.getPosts = this.getPosts.bind(this);
    this.getTopPosts = this.getTopPosts.bind(this);
    this.getNewPosts = this.getNewPosts.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
  }

  componentDidMount() {
    this.getPosts(this.state.filter, this.props.channel);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.channel != this.props.channel) {
      this.getPosts(this.state.filter, nextProps.channel);
    }
  }

  onFilterChange(e) {
    this.getPosts(e.target.innerHTML, this.props.channel);
  }

  getPosts(filter, channel) {
    this.setState({
      loading: true,
      filter: filter,
      menu: false
    });
    if (filter == 'Top') {
      this.getTopPosts(channel);
    }
    else if (filter == 'New') {
      this.getNewPosts(channel);
    }
  }

  getTopPosts(channel) {
    credsign.getChannelByName(channel, (error, channelID) => {
      credrank.getNumContents(credsign.address, channelID, (error, numRanks) => {
        if (numRanks == 0 || channelID == 0) {
          this.setState({
            loading: false,
            listItems: [],
            channelID: channelID,
            count: 0
          });
          return;
        }
        else {
          this.setState({
            channelID: channelID,
            channelName: getChannelName(channelID)
          });
        }
        credrank.getContentsByRanks(credsign.address, channelID, 1, numRanks, (error, tuple) => {
          var listItems = [];
          var idToIndex = {};
          for (var i = 0; i < tuple[0].length; i++) {
            var id = '0x' + tuple[0][i].toString(16);
            idToIndex[id] = i;
            listItems.push({
              id: id,
              cred: parseInt(tuple[1][i].toString()),
              rank: parseInt(tuple[2][i].toString())
            });
          }
          credsign.Post({contentID: tuple[0]}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
            posts.forEach((post) => {
              var index = idToIndex['0x' + post.args.contentID.toString(16)];
              listItems[index].title = getContentTitle(post.args.attributes);
              listItems[index].timestamp = post.args.timestamp;
            });
            this.setState({
              listItems: listItems,
              count: numRanks,
              loading: false
            });
          });
        });
      });
    });
  }

  getNewPosts(channel) {
    this.setState({
      loading: true
    });
    credsign.getChannelByName(channel, (error, channelID) => {
      credsign.getNumContents(channelID, (error, numRanks) => {
        if (numRanks == 0) {
          this.setState({
            loading: false,
            listItems: [],
            count: 0
          });
          return;
        }
        else {
          this.setState({
            channelID: channelID,
            channelName: getChannelName(channelID)
          });
        }
        var sequenceNums = [Array.from(Array(numRanks))].map((_, i) => i + 1);
        credsign.Post({channelID: channelID, sequenceNum: sequenceNums}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
          var ids = [];
          var listItems = [];
          for (var i = 0; i < posts.length; i++) {
            ids.push(posts[i].args.contentID);
            listItems.push({
              id: '0x' + ids[i].toString(16),
              title: getContentTitle(posts[i].args.attributes),
              timestamp: posts[i].args.timestamp
            });
          };
          credrank.getCredRanksByContents(credsign.address, ids, (error, credRanks) => {
            for (var i = 0; i < posts.length; i++) {
              listItems[i].cred = parseInt(credRanks[0][i].toString());
              listItems[i].rank = parseInt(credRanks[1][i].toString());
            }
            this.setState({
              loading: false,
              listItems: listItems.reverse(),
              count: numRanks
            });
          });
        });
      })
    });
  }

  render() {
    var listItems = this.state.listItems.map((listItem) => {
      var caption = '';
      if (listItem.rank > 0) {
        caption = `Rank ${listItem.rank} with ${listItem.cred}¢`;
        if (listItem.signed) {
          if (listItem.funds > 0) {
            caption += ` - Signed with ${listItem.funds}¢`;
          }
          else {
            caption += ` - Signed`;
          }
        }
      }
      else {
        caption = `Unranked in #${this.state.channelName}`;
      }
      return (
        <li key={'li-'+listItem.id}>
          <a href={`#/channel/${this.props.channel}/post/${listItem.id}`}>
            <div>{listItem.title}</div>
            <span>{caption}</span>
          </a>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <div style={{position: 'relative', display: this.state.channelID > 0 ? 'block' : 'none'}}>
          <span onClick={() => this.setState({menu: !this.state.menu})} style={{cursor: 'pointer'}}>{`${this.state.filter} ▾`}</span>
          <ul onMouseLeave={() => this.setState({menu: false})} style={{position: 'absolute', top: '1.5em', left: '0', display: this.state.menu ? 'block' : 'none'}}>
            <li onClick={this.onFilterChange}>Top</li>
            <li onClick={this.onFilterChange}>New</li>
          </ul>
          <span>{` posts in #${this.props.channel}`}</span>
          <span>{' (' + this.state.count + ')'}</span>
        </div>
        <div style={{display: this.state.channelID == 0 ? 'block' : 'none'}}>Invalid channel</div>
        <ol>{listItems}</ol>
        <span style={{paddingLeft: '1em', display: listItems.length == 0 ? 'block' : 'none', fontStyle: 'italic'}}>{
          this.state.channelID != 0
            ? (this.state.loading ? 'Loading...' : 'Nothing to see here')
            : 'Channels must be between 3 and 30 characters consisting of letters, numbers, and underscores.'
        }</span>
      </div>
    );
  }
}

class Account extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: this.props.filter || 'Posted',
      listItems: [],
      count: 0
    };

    this.getPosts = this.getPosts.bind(this);
    this.getAddress = this.getAddress.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
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
      this.getPosts(this.state.filter, account);
    }
  }

  getPosts(filter, account) {
    this.setState({
      loading: true,
      menu: false,
      filter: filter
    });
    var listItems = [];
    var signedContents = {
      sequence: [],
      funds: {}
    };
    if (filter == 'Posted') {
      credsign.Post({accountID: account}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
        var ids = [];
        posts.forEach((post) => {
          ids.push(post.args.contentID);
          listItems.push({
            id: '0x' + post.args.contentID.toString(16),
            title: getContentTitle(post.args.attributes),
            channelName: getChannelName(post.args.channelID),
            timestamp: post.args.timestamp
          });
        });
        credsign.Sign({accountID: account}, {fromBlock: 0, toBlock: 'latest'}).get((error, signatures) => {
          signatures.forEach((signature) => {
            aggregateSignature(signedContents, signature);
          });
          credrank.getCredRanksByContents(credsign.address, ids, (error, credRanks) => {
            listItems.forEach((listItem, i) => {
              listItem.cred = parseInt(credRanks[0][i].toString());
              listItem.rank = parseInt(credRanks[1][i].toString());
              listItem.signed = signedContents.funds[listItem.id] !== undefined;
              listItem.funds = signedContents.funds[listItem.id] || 0;
            })
            this.setState({
              loading: false,
              listItems: listItems
            });
          });
        });
      });
    }
    else if (filter == 'Funded') {
      credsign.Sign({accountID: account}, {fromBlock: 0, toBlock: 'latest'}).get((error, signatures) => {
        signatures.forEach((signature) => {
          aggregateSignature(signedContents, signature);
        });
        var fundedIDs = signedContents.sequence.filter((contentID) => signedContents.funds[contentID] > 0);
        credsign.Post({contentID: fundedIDs}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
          credrank.getCredRanksByContents(credsign.address, fundedIDs, (error, credRanks) => {
            fundedIDs.forEach((contentID, i) => {
              listItems.push({
                id: contentID,
                title: getContentTitle(posts[i].args.attributes),
                channelName: getChannelName(posts[i].args.channelID),
                timestamp: posts[i].args.timestamp,
                cred: parseInt(credRanks[0][i].toString()),
                rank: parseInt(credRanks[1][i].toString()),
                signed: true,
                funds: signedContents.funds[contentID]
              });
            });
            this.setState({
              loading: false,
              listItems: listItems
            });
          });
        });
      });
    }
    else if (filter == 'Signed') {
      credsign.Sign({accountID: account}, {fromBlock: 0, toBlock: 'latest'}).get((error, signatures) => {
        signatures.forEach((signature) => {
          aggregateSignature(signedContents, signature);
        });
        credsign.Post({contentID: signedContents.sequence}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
          credrank.getCredRanksByContents(credsign.address, signedContents.sequence, (error, credRanks) => {
            signedContents.sequence.forEach((contentID, i) => {
              listItems.push({
                id: contentID,
                title: getContentTitle(posts[i].args.attributes),
                channelName: getChannelName(posts[i].args.channelID),
                timestamp: posts[i].args.timestamp,
                cred: parseInt(credRanks[0][i].toString()),
                rank: parseInt(credRanks[1][i].toString()),
                signed: true,
                funds: signedContents.funds[contentID]
              });
            });
            this.setState({
              loading: false,
              listItems: listItems
            });
          });
        });
      });
    }
  }

  onFilterChange(e) {
    var filter = e.target.innerHTML;
    var account = this.getAddress(this.props.account);
    this.getPosts(filter, account);
  }

  render() {
    var listItems = this.state.listItems.map((listItem) => {
      var caption = '';
      if (listItem.rank > 0) {
        caption = `Rank ${listItem.rank} in #${listItem.channelName} with ${listItem.cred}¢`;
        if (listItem.signed) {
          if (listItem.funds > 0) {
            caption += ` - Signed with ${listItem.funds}¢`;
          }
          else {
            caption += ` - Signed`;
          }
        }
      }
      else {
        caption = `Unranked in #${listItem.channelName}`;
      }
      return (
        <li key={'li-'+listItem.id}>
          <a href={`#/channel/${listItem.channelName}/post/${listItem.id}`}>
            <div>{listItem.title}</div>
            <span>{caption}</span>
          </a>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <div style={{position: 'relative'}}>
          <span onClick={() => this.setState({menu: !this.state.menu})} style={{cursor: 'pointer'}}>{`${this.state.filter} ▾`}</span>
          <ul onMouseLeave={() => this.setState({menu: false})} onClick={this.onFilterChange} style={{position: 'absolute', top: '1.5em', left: '0', display: this.state.menu ? 'block' : 'none'}}>
            <li>Posted</li>
            <li>Funded</li>
            <li>Signed</li>
          </ul>
          <span>{` by account (${listItems.length})`}</span>
        </div>
        <ol>{listItems}</ol>
        <span style={{paddingLeft: '1em', display: listItems.length == 0 ? 'block' : 'none', fontStyle: 'italic'}}>{
          this.state.loading ? 'Loading...' : 'Nothing to see here'
        }</span>
      </div>
    );
  }
}

class Preview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      body: '',
      publisher: '0x0',
      loading: true,
      retries: 10
    };
  }

  componentDidMount() {
    var contentID = web3.toBigNumber(this.props.id);
    credsign.Store({contentID: contentID}, {fromBlock: 0, toBlock: 'latest'}).get((error, content) => {
      // FIXME - hack to keep trying since infura may be unresponsive
      if (error || content.length == 0) {
        if (error) {
          console.log(error.toString());
        }
        if (this.state.retries > 0) {
          this.setState({
            retries: this.state.retries - 1
          });
          setTimeout(() => {this.componentDidMount()}, 500);
        }
      }
      else {
        this.setState({
          title: getContentTitle(content[0].args.attributes),
          body: JSON.parse(content[0].args.document).body,
          publisher: content[0].args.accountID,
          channelName: getChannelName(content[0].args.channelID),
          loading: false
        });
      }
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
            <div style={{padding: '1.5em 1em', display: this.state.loading ? 'none' : 'block'}}>
              <div style={{color: 'gray', paddingBottom: '1em'}}>
                <span>{`Posted in #${this.state.channelName}`}</span>
              </div>
              <h1>{this.state.title}</h1>
              <div id={'post-'+this.props.id}></div>
            </div>
            <div style={{padding: '1.5em 1em', display: this.state.loading ? 'block' : 'none'}}>
              <div style={{color: 'gray', paddingBottom: '1em'}}>
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

// Manage navigation
class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      levelOne: '',
      levelTwo: '',
      levelThree: '',
      levelFour: '',
      account: '',
      mounted: false,
      contentID: null
    };


    this.route = this.route.bind(this);
    this.setChannel = this.setChannel.bind(this);

    window.addEventListener('hashchange', () => this.route(window.location.hash));
  }

  componentDidMount() {
    this.route(window.location.hash);
    if (!window.infura) {
      web3.eth.getAccounts((error, accounts) => {
        if (accounts.length > 0) {
          var address = accounts[0];
          window.accountSignatures = {
            [address]: {
              sequence: [],
              funds: {}
            }
          };
          var watcher = credsign.Sign({accountID: address}, {fromBlock: 0, toBlock: 'latest'});
          watcher.get((error, signatures) => {
            watcher.watch((error, signature) => {
              aggregateSignature(accountSignatures[address], signature);
            });
            signatures.forEach((signature) => {
              aggregateSignature(accountSignatures[address], signature);
            });
          });
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
  }

  setChannel(e) {
    window.location.hash = `#/${this.state.levelOne}/${e.target.value}`;
    this.route(window.location.hash);
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
      levelFour: path[4],
      mounted: true
    });
  }

  render() {

    var view = '';
    if (this.state.mounted) {
      if (window.infura) {
        if (this.state.levelOne == 'channel' && this.state.levelThree == 'post') {
          view = <Preview id={this.state.levelFour} channel={this.state.levelTwo} />;
        }
        else{
          window.location.replace('/?err=url');
        }
      }
      else if (this.state.levelOne == 'channel') {
        if (this.state.levelThree == 'post') {
          view = <Post id={this.state.levelFour} channel={this.state.levelTwo} account={this.state.account} />;
        }
        else if (this.state.levelTwo == '') {
          view = <RankedChannels />;
        }
        else {
          view = <ChannelPosts channel={this.state.levelTwo} account={this.state.account} />;
        }
      }
      else if (this.state.levelOne == 'publish'){
        view = <Create channel={this.state.levelTwo} account={this.state.account} />
      }
      else if (this.state.levelOne == 'account') {
        view = <Account account={this.state.levelTwo} />;
      }
    }

    return (
      <div style={{padding: '3em 0'}}>
        <div style={{
          position: 'fixed',
          width: '100%',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #DDD',
          color: 'black',
          fontSize: '1.5em',
          top: 0,
          fontWeight: 'bold',
          padding: '.5em 0',
          textAlign: 'center',
          zIndex: 10
        }}>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            display: window.infura ? 'none' : 'block'
          }}>
            <div className='flex' style={{padding: '0 .66em'}}>
              <a href='#/channel' className='flex-grow' style={{
                color: 'black',
                textAlign: 'left',
                display: 'inline-block'
              }}>Channels</a>
              <a href='/terminal' alt='¢'><img src='logo.svg' style={{width: '1em', height: '1em', paddingTop: '2px'}} /></a>
              <a href={`#/account/${this.state.account}`} className='flex-grow' style={{
                color: 'black',
                textAlign: 'right',
                display: 'inline-block'
              }}>Accounts</a>
            </div>
          </div>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            display: window.infura ? 'block' : 'none'
          }}>
            <a href='/' style={{
              padding: '0 .66em',
              display: 'inline-block',
              color: 'black',
              textDecoration: 'none'
            }}>{
              '¢'
            }</a></div>
        </div>
        <div style={{maxWidth: '600px', margin: '0 auto', display: window.infura ? 'none' : 'block', padding: '1.5em 0'}}>
          <div className='flex'>
            <div className='flex-grow'>
              <div className='flex' style={{
                padding: '0 1em',
                backgroundColor: 'white',
                borderTop: '2px solid white',
                borderBottom: '2px solid white',
                borderRight: '0',
                borderLeft: '0'
              }}>
                <span className='flex-shrink' style={{
                  color: 'gray',
                  padding: '.5em 0',
                  fontWeight: 'normal'
                }}>{this.state.levelOne == 'account' ? '@' : '#'}</span>
                <input type='text' placeholder={this.state.levelOne == 'account' ? '0x321...' : 'channel'} id='channel' className='flex-grow' style={{
                  backgroundColor: 'transparent',
                  fontSize: '1em',
                  padding: '.5em 0',
                  margin: 0,
                  border: 0,
                  outline: 0,
                  placeholderTextColor: 'gray',
                  color: 'black'
                }} value={this.state.levelTwo} onChange={this.setChannel}></input>
              </div>
            </div>
            <div className='flex-shrink'>
              <a style={{
                margin: '0 1em',
                color: 'black',
                display: (this.state.levelOne == 'publish' || this.state.account == '') ? 'none' : 'block',
                borderBottom: '2px solid black',
                padding: '.5em 0'
              }} href={`#/publish/${this.state.levelOne == 'channel' ? this.state.levelTwo : ''}`}>Publish</a>
            </div>
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
                  'MetaMask and create one. You will need an account to '+
                  'publish and sign content.'
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
          fontSize: '69%',
          fontWeight: 'bold',
          padding: '1em 0',
          textTransform: 'uppercase',
          textAlign: 'center',
          zIndex: 10
        }}>
          <span className='collapsable'>{'Message us on '}</span>
          <a href={'https://facebook.com/CredSign'} style={{
            padding: '.5em 0',
            borderBottom: '2px solid gray',
            display: 'inline-block',
            color: 'gray'
          }}>Facebook</a>
          <span>{' · '}</span>
          <span className='collapsable'>{'View source on '}</span>
          <a href={'https://github.com/CredSign/credsign.github.io'} style={{
            padding: '.5em 0',
            borderBottom: '2px solid gray',
            display: 'inline-block',
            color: 'gray'
          }}>Github</a>
          <span>{' · '}</span>
          <span className='collapsable'>{'Usage governed by '}</span>
          <a
            href='https://github.com/CredSign/credsign.github.io/blob/master/LICENSE'
            style={{
              color: 'gray',
              padding: '.5em 0',
              display: 'inline-block',
              borderBottom: '2px solid gray'
            }}>terms</a>
        </div>
      </div>
    );
  }
}

window.App = App;
