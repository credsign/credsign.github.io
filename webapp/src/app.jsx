class Post extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newCred: '',
      title: '',
      body: '',
      cred: 0,
      rank: 0,
      publisher: '0x0',
      timestamp: '0',
      signature: 0,
      error: ''
    };
    this.signPost = this.signPost.bind(this);
    this.voidSignature = this.voidSignature.bind(this);
    this.onCredChange = this.onCredChange.bind(this);
  }

  componentDidMount() {
    credsign.Store({contentID: this.props.id}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
      credsign.getContentCredSignedByUser(this.props.account, this.props.id, (error, credSigned) => {
        batchread.getCredRanksByContents([this.props.id], (error, credRanks) => {
          this.setState({
            title: posts[0].args.title,
            body: posts[0].args.body,
            cred: credRanks[0][0].toString(10),
            rank: credRanks[1][0].toString(10),
            publisher: posts[0].args.publisher,
            signature: parseInt(credSigned.toString()),
            timestamp: posts[0].args.timestamp
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
      newCred: parseInt(e.target.value) || ''
    });
  }

  signPost() {
    this.setState({
      error: 'Confirming on the network, please wait'
    });
    var newCred = this.state.newCred;
    var value = credsign.CRED().times(newCred);
    credsign.sign.estimateGas(this.props.id, newCred, {from: this.props.account, value: value}, (error, gasEstimate) => {
      console.log(gasEstimate);
      credsign.sign(this.props.id, newCred, {from: this.props.account, value: value, gas: gasEstimate}, (error, result) => {
        if (!error) {
          this.setState({
            newCred: '',
            signature: newCred,
            error: ''
          });
        }
        else {
          this.setState({
            error: error.toString()
          });
        }
      });
    });
  }

  voidSignature() {
    this.setState({
      error: 'Confirming on the network, please wait'
    });
    credsign.void.estimateGas(this.props.id, {from: this.props.account, value: 0}, (error, gasEstimate) => {
      console.log(gasEstimate);
      credsign.void(this.props.id, {from: this.props.account, value: 0, gas: gasEstimate}, (error, result) => {
        if (!error) {
          this.setState({
            signature: 0,
            error: ''
          });
        }
        else {
          this.setState({
            error: error.toString()
          });
        }
      });
    });
  }

  render() {
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
              <h1 style={{}}>{this.state.title}</h1>
              <div id={'post-'+this.props.id}></div>
            </div>
          </div>
        </div>
        <div style={{maxWidth: '600px', margin: '0 auto'}}>
          <div style={{padding: '1.5em 1em', display: 'flex'}}>
            <div style={{display: 'block', flex: '1 0 0', textAlign: 'left'}}>
              <div style={{}}>
                <span>{`Rank ${this.state.rank} with ${this.state.cred}¢`}</span>
              </div>
            </div>
            <div style={{
              flex: '1 0 0',
              textAlign: 'right',
              display: (this.props.account == '') ? 'none' : 'block',
            }}>
              <input type="text" name="cred" placeholder={this.state.signature} value={this.state.newCred} onChange={this.onCredChange} style={{textAlign: 'right', fontSize: '1em', border: '0', backgroundColor: 'transparent', outline: 'none'}} />
              <span style={{paddingRight: '.5em'}}>¢</span>
              <a onClick={this.signPost} style={{
                color: 'black',
                display: 'inline-block',
                borderBottom: '2px solid black',
                paddingBottom: '.5em'
              }}>Sign</a>
            </div>
          </div>
          <div style={{color: 'red', fontSize:'60%', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center'}}>{this.state.error}</div>
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

    if (credsign.getChannelByName(this.props.channel) == 0) {
      errors.push('Channel must be between 3 and 30 characters and consist of only letters numbers and underscores');
    }
    if (title.length < 3 || title > 100) {
      errors.push('Title must be between 3 and 100 characters');
    }
    this.setState({
      error: errors.join('. '),
      view: 'submit'
    });

    if (errors.length == 0) {
      credsign.post.estimateGas(this.props.channel, title, body, {from: this.props.account, value: 0}, (error, gasEstimate) => {
        console.log(gasEstimate);
        credsign.post(this.props.channel, title, body, {from: this.props.account, value: 0, gas: gasEstimate}, (error) => {
          if (error) {
            this.setState({
              error: error.toString()
            });
          }
          else {
            var watcher = credsign.Post({publisher: this.props.account}, {fromBlock: 'latest'});
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
                <textarea id="new-post-title" type="text" placeholder="title"></textarea>
                <div id="new-post-body" contentEditable="true"></div>
              </div>
              <div style={{display: this.state.view != 'edit' ? 'block' : 'none'}}>
                <h1 id="new-post-title-preview"></h1>
                <div id="new-post-body-preview"></div>
              </div>
            </div>
          </div>
        </div>
        <div style={{width: '100%'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{display: 'flex', padding: '1.5em 1em'}}>
              <div style={{flex: '1 0 0', textAlign: 'left'}}>
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
              <div style={{flex: '1 0 0', textAlign: 'right'}}>
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
                left: '50%',
                top: '30%',
                marginLeft: '-300px',
                position: 'fixed',
                zIndex: 2,
                backgroundColor: '#FCFCFC',
                border: '1px solid #DDD',
                width: '600px'
              }}>
                <div style={{padding: '1em', display: this.state.error.length > 0 ? 'block' : 'none'}}>
                  <h1>Unable to publish...</h1>
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
    credsign.getNumChannels((error, numRanks) => {
      if (numRanks == 0) {
        this.setState({
          loaded: true,
          listItems: [],
          count: 0
        });
        return;
      }
      batchread.getChannelsByRanks(1, numRanks, (error, tuple) => {
        var ids = tuple[0];
        var cred = tuple[1].map((cred) => parseInt(cred.toString()));
        var ranks = tuple[2].map((rank) => parseInt(rank.toString()));

        var listItems = [];
        for (var i = 0; i < ids.length; i++) {
          var id = ids[i];
          var channelName = '';
          while (id != 0) {
            channelName = String.fromCharCode(id.mod(256)) + channelName;
            id = id.div(256).floor();
          }
          listItems.push({
            id: '0x' + ids[i].toString(16),
            channelName: channelName,
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
        <li key={'li-'+listItem.id} value={listItem.rank}>
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
      </div>
    );
  }
}

class ChannelPosts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      toggle: false,
      listItems: [],
      filter: "Top",
      count: 0
    };
    this.getPosts = this.getPosts.bind(this);
    this.getTopPosts = this.getTopPosts.bind(this);
    this.getNewPosts = this.getNewPosts.bind(this);
  }
  getTopPosts(channel) {
    credsign.getChannelByName(channel, (error, channelID) => {
      credsign.getNumContents(channelID, (error, numRanks) => {
        if (numRanks == 0) {
          this.setState({
            loaded: true,
            listItems: [],
            count: 0
          });
          return;
        }
        batchread.getContentsByRanks(1, numRanks, channelID, (error, tuple) => {
          var ids = tuple[0].map((id) => '0x' + id.toString(16));
          var cred = tuple[1].map((cred) => parseInt(cred.toString()));
          var ranks = tuple[2].map((rank) => parseInt(rank.toString()));
          console.log(ids);
          var listItems = [];
          var idToIndex = {};
          for (var i = 0; i < ids.length; i++) {
            idToIndex[ids[i]] = i;
            listItems.push({
              id: ids[i],
              rank: ranks[i].toString(),
              cred: cred[i].toString()
            });
          }
          credsign.Store({contentID: ids}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
            posts.forEach((post) => {
              var index = idToIndex['0x' + post.args.contentID.toString(16)];
              listItems[index].title = post.args.title;
              listItems[index].timestamp = post.args.timestamp;
            });
            this.setState({
              toggle: !this.state.toggle,
              listItems: listItems,
              count: numRanks
            });
          });
        });
      });
    });
  }

  getNewPosts(channel) {
    credsign.getChannelByName(channel, (error, channelID) => {
      credsign.getNumContents(channelID, (error, numRanks) => {
        if (numRanks == 0) {
          this.setState({
            loaded: true,
            listItems: [],
            count: 0
          });
          return;
        }
        var listItems = [];
        credsign.Store({channelID: channelID}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
          posts.forEach((post) => {
            listItems.unshift({
              id: '0x' + post.args.contentID.toString(16),
              title: post.args.title,
              timestamp: post.args.timestamp,
              cred: 0,
              rank: 0
            });
          });
          batchread.getCredRanksByContents(listItems.map((post) => post.id), (error, credRanks) => {
            for (var i = 0; i < posts.length; i++) {
              listItems[i].cred = credRanks[0][i].toString();
              listItems[i].rank = credRanks[1][i].toString();
            }
            this.setState({
              toggle: !this.state.toggle,
              listItems: listItems,
              count: numRanks
            });
          });
        });
      })
    });
  }

  getPosts(e) {
    var filter = e.target.innerHTML;
    this.setState({
      filter: filter,
      menu: false
    });
    if (filter == "Top") {
      this.getTopPosts(this.props.channel);
    }
    else {
      this.getNewPosts(this.props.channel);
    }
  }

  componentDidMount() {
    if (this.state.filter == "Top") {
      this.getTopPosts(this.props.channel);
    }
    else {
      this.getNewPosts(this.props.channel);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.filter == "Top") {
      this.getTopPosts(nextProps.channel);
    }
    else {
      this.getNewPosts(nextProps.channel);
    }
  }
  render() {
    var listItems = this.state.listItems.map((listItem) => {
      return (
        <li key={'li-'+listItem.id} value={listItem.rank}>
          <a href={`#/channel/${this.props.channel}/post/${listItem.id}`}>
            <div>{listItem.title}</div>
            <span>{`Rank ${listItem.rank} with ${listItem.cred}¢ - Posted ${new Date(listItem.timestamp* 1000).toLocaleString()}`}</span>
          </a>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <div style={{position: 'relative'}}>
          <span onClick={() => this.setState({menu: !this.state.menu})} style={{cursor: 'pointer'}}>{`${this.state.filter} ▾`}</span>
          <ul onMouseLeave={() => this.setState({menu: false})} style={{position: 'absolute', top: '1.5em', left: '0', display: this.state.menu ? 'block' : 'none'}}>
            <li onClick={this.getPosts}>Top</li>
            <li onClick={this.getPosts}>New</li>
          </ul>
          <span>{` posts in #${this.props.channel}`}</span>
          <span>{' (' + this.state.count + ')'}</span>
        </div>
        <ol>{listItems}</ol>
      </div>
    );
  }
}

class Account extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: this.props.filter || 'Posted',
      toggle: false,
      listItems: [],
      count: 0
    };

    this.getPosts = this.getPosts.bind(this);
    this.getAddress = this.getAddress.bind(this);
    this.getPostsPublished = this.getPostsPublished.bind(this);
    this.getPostsSigned = this.getPostsSigned.bind(this);
    this.getPostsFunded = this.getPostsFunded.bind(this);
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
    this.getPosts(this.state.filter, account);
  }

  getPosts(filter, account) {
    this.setState({menu: false, filter: filter});
    if (filter == 'Posted') {
      this.getPostsPublished(account);
    }
    else if (filter == 'Funded') {
      this.getPostsFunded(account);
    }
    else if (filter == 'Signed') {
      this.getPostsSigned(account);
    }
  }

  onFilterChange(e) {
    var filter = e.target.innerHTML;
    var account = this.getAddress(this.props.account);
    this.getPosts(filter, account);
  }

  getPostsPublished(address) {
    credsign.Post({publisher: address}, {fromBlock: 0, toBlock: 'latest'}).get((error, postEvents) => {
      var ids = [];
      postEvents.forEach((postEvent) => ids.unshift('0x' + postEvent.args.contentID.toString(16)));
      var listItems = [];
      var idToIndex = {};
      for (var i = 0; i < ids.length; i++) {
        idToIndex[ids[i]] = i;
        listItems.unshift({
          id: ids[i],
          timestamp: parseInt(postEvents[i].args.timestamp.toString(10))
        });
      }
      batchread.getCredRanksByContents(ids, (error, credRanks) => {
        for (var i = 0; i < ids.length; i++) {
          listItems[i].cred = credRanks[0][i].toString();
          listItems[i].rank = credRanks[1][i].toString();
        }
        credsign.Store({contentID: ids}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
          posts.forEach((post) => {
            var index = idToIndex['0x' + post.args.contentID.toString(16)];
            var id = post.args.channelID;
            var channelName = '';
            while (id != 0) {
              channelName = String.fromCharCode(id.mod(256)) + channelName;
              id = id.div(256).floor();
            }
            listItems[index].title = post.args.title;
            listItems[index].channelName = channelName;
          });
          this.setState({
            toggle: !this.state.toggle,
            listItems: listItems
          });
        });
      });
    });
  }

  getPostsSigned(address) {
    credsign.Sign({signatory: address}, {fromBlock: 0, toBlock: 'latest'}).get((error, signatures) => {
      var ids = [];
      signatures.forEach((signature) => ids.unshift('0x' + signature.args.contentID.toString(16)));
      var listItems = [];
      var idToIndex = {};
      for (var i = 0; i < ids.length; i++) {
        idToIndex[ids[i]] = i;
        listItems.unshift({
          id: ids[i],
          timestamp: parseInt(signatures[i].args.timestamp.toString(10))
        });
      }
      batchread.getCredRanksByContents(ids, (error, credRanks) => {
        for (var i = 0; i < ids.length; i++) {
          listItems[i].cred = credRanks[0][i].toString();
          listItems[i].rank = credRanks[1][i].toString();
        }
        credsign.Store({contentID: ids}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
          posts.forEach((post) => {
            var index = idToIndex['0x' + post.args.contentID.toString(16)];
            var id = post.args.channelID;
            var channelName = '';
            while (id != 0) {
              channelName = String.fromCharCode(id.mod(256)) + channelName;
              id = id.div(256).floor();
            }
            listItems[index].title = post.args.title;
            listItems[index].channelName = channelName;
          });
          this.setState({
            toggle: !this.state.toggle,
            listItems: listItems
          });
        });
      });
    });
  }

  getPostsFunded(address) {
    batchread.getContentsFundedByUser(address, (error, tuple) => {
      var ids = tuple[0].map((id) => '0x' + id.toString(16));
      var credSigned = tuple[1].map((cred) => parseInt(cred.toString()));
      console.log(ids);
      var listItems = [];
      var idToIndex = {};
      for (var i = 0; i < ids.length; i++) {
        idToIndex[ids[i]] = i;
        listItems.push({
          id: ids[i],
          credSigned: credSigned[i].toString()
        });
      }
      batchread.getCredRanksByContents(ids, (error, credRanks) => {
        for (var i = 0; i < ids.length; i++) {
          listItems[i].cred = credRanks[0][i].toString();
          listItems[i].rank = credRanks[1][i].toString();
        }
        credsign.Store({contentID: ids}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
          posts.forEach((post) => {
            var index = idToIndex['0x' + post.args.contentID.toString(16)];
            var id = post.args.channelID;
            var channelName = '';
            while (id != 0) {
              channelName = String.fromCharCode(id.mod(256)) + channelName;
              id = id.div(256).floor();
            }
            listItems[index].title = post.args.title;
            listItems[index].timestamp = post.args.timestamp;
            listItems[index].channelName = channelName;
          });
          this.setState({
            toggle: !this.state.toggle,
            listItems: listItems
          });
        });
      });
    });
  }

  render() {
    var listItems = this.state.listItems.map((listItem) => {
      var action = '';
      if (this.state.filter == 'Posted') {
        action = `Posted ${new Date(listItem.timestamp* 1000).toLocaleString()}`;
      }
      else if (this.state.filter == 'Funded') {
        action = `Signed with ${listItem.credSigned}¢`;
      }
      else {
        action = `Signed ${new Date(listItem.timestamp* 1000).toLocaleString()}`;
      }
      return (
        <li key={'li-'+listItem.id} value={listItem.rank}>
          <a href={`#/channel/${listItem.channelName}/post/${listItem.id}`}>
            <div>{listItem.title}</div>
            <span>{`Rank ${listItem.rank} in #${listItem.channelName} with ${listItem.cred}¢ - ${action}`}</span>
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
      editChannel: true,
      contentID: null
    };


    this.route = this.route.bind(this);
    this.setChannel = this.setChannel.bind(this);

    window.addEventListener('hashchange', () => this.route(window.location.hash));
  }

  componentDidMount() {
    this.route(window.location.hash);
    web3.eth.getAccounts((error, accounts) => {
      if (accounts.length > 0) {
        this.setState({
          account: accounts[0]
        });
      }
      else {
        this.setState({
          warn: true
        });
      }
    });
  }

  setChannel(e) {
    window.location.hash = "#/"+this.state.levelOne+"/" + e.target.value;
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
      editChannel: (path[1] == 'channel' && path[3] == '') || (path[1] == 'publish') || (path[1] == 'account')
    });
  }

  render() {

    var view;
    if (this.state.levelOne == 'channel') {
      if (this.state.levelThree == 'post') {
        view = <Post id={this.state.levelFour} channel={this.state.levelTwo} account={this.state.account} />;
      }
      else if (this.state.levelTwo == '') {
        view = <RankedChannels />;
      }
      else {
        view = <ChannelPosts channel={this.state.levelTwo} />;
      }
    }
    else if (this.state.levelOne == 'publish'){
      view = <Create channel={this.state.levelTwo} account={this.state.account} />
    }
    else if (this.state.levelOne == 'account') {
      view = <Account account={this.state.levelTwo} />;
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
            width: '600px',
            margin: '0 auto'
          }}>
            <div style={{padding: '0 .66em', display: 'flex'}}>
              <a href='#/channel' style={{
                flex: '1 0 0',
                color: 'black',
                textAlign: 'left',
                display: 'inline-block'
              }}>Channels</a>
              <div style={{
                flex: '0 1 auto',
                display: 'inline-block'
              }}>¢</div>
              <a href={`#/account/${this.state.account}`} style={{
                flex: '1 0 0',
                color: 'black',
                textAlign: 'right',
                display: 'inline-block'
              }}>Accounts</a>
            </div>
          </div>
        </div>
        <div style={{width: '600px', margin: '0 auto', padding: '1.5em 0'}}>
          <div style={{display: 'flex'}}>
            <div style={{flex: '1 0 0'}}>
              <div style={{
                display: 'flex',
                padding: '.5em 1em',
                backgroundColor: 'white',
                borderTop: '2px solid white',
                borderBottom: '2px solid white',
                borderRight: '0',
                borderLeft: '0'
              }}>
                <span style={{
                  color: 'gray',
                  flex: '0 1 auto',
                  fontWeight: 'normal',
                }}>{this.state.levelOne == 'account' ? '@' : '#'}</span>
                <input type="text" placeholder={this.state.levelOne == "account" ? "0x321..." : "channel"} id="channel" style={{
                  backgroundColor: 'transparent',
                  fontSize: '1em',
                  padding: 0,
                  margin: 0,
                  border: 0,
                  outline: 0,
                  flex: '1 0 0',
                  placeholderTextColor: 'gray',
                  color: 'black'
                }} value={this.state.levelTwo} onChange={this.setChannel}></input>
              </div>
            </div>
            <div style={{
              flex: '0 1 auto'
            }}>
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
            left: '50%',
            top: '30%',
            marginLeft: '-300px',
            zIndex: 2,
            position: 'fixed',
            backgroundColor: '#FCFCFC',
            border: '1px solid #DDD',
            width: '600px'
          }}>
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
          <span>{'Message us on '}</span>
          <a href={'https://facebook.com/CredSign'} style={{
            padding: '.5em 0',
            borderBottom: '2px solid gray',
            display: 'inline-block',
            color: 'gray'
          }}>Facebook</a>
          <span>{' · View source on '}</span>
          <a href={'https://github.com/CredSign/credsign.github.io'} style={{
            padding: '.5em 0',
            borderBottom: '2px solid gray',
            display: 'inline-block',
            color: 'gray'
          }}>Github</a>
          <span>{' · Usage governed by '}</span>
          <a
            href="https://github.com/CredSign/credsign.github.io/blob/master/LICENSE"
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
