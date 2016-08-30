class Post extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cred: 0,
      signature: -1,
      error: ''
    };
    this.signPost = this.signPost.bind(this);
    this.voidSignature = this.voidSignature.bind(this);
    this.onCredChange = this.onCredChange.bind(this);
  }

  componentDidMount() {
    contract.GetSignatureCred(this.props.id, web3.eth.accounts[0], (error, cred) => {
      this.setState({
        signature: cred.toString()
      });
    });
    document.getElementById('post-'+this.props.id).innerHTML = marked(this.props.body);
  }

  onCredChange(e) {
    this.setState({
      cred: parseInt(e.target.value)
    });
  }

  signPost() {
    this.setState({
      error: 'Confirming on the network, please wait'
    });
    var cred = this.state.cred;
    contract.SignPost(this.props.id, {from: web3.eth.accounts[0], value: cred * contract.CRED()}, (error, result) => {
      if (!error) {
        this.setState({
          signature: cred,
          error: ''
        });
      }
      else {
        this.setState({
          error: error.toString()
        });
      }
    });
  }

  voidSignature() {
    contract.VoidSignature(this.props.id, {from: web3.eth.accounts[0], value: 0}, (error, result) => {
      if (!error) {
        this.setState({
          signature: 0
        });
      }
      else {
        this.setState({
          error: error.toString()
        });
      }
    });
  }

  render() {
    return (
      <div>
        <div style={{backgroundColor: '#FFF'}}>
          <div style={{maxWidth: '600px', padding: '1em', margin: '0 auto'}}>
            <div style={{padding: '1em'}}>
              <div style={{color: 'gray'}}>{'Posted '+new Date(this.props.timestamp* 1000).toLocaleString()+' in #'+this.props.channel}</div>
              <h1>{this.props.title}</h1>
              <div id={'post-'+this.props.id}></div>
            </div>
          </div>
        </div>
        <div style={{maxWidth: '600px', padding: '1em', margin: '0 auto'}}>
          <div style={{display: this.state.signature == 0 ? 'block' : 'none', padding: '1em', textAlign: 'right'}}>
            <input type="text" name="cred" placeholder="0" onChange={this.onCredChange} style={{textAlign: 'right', fontSize: '1em', border: '0', backgroundColor: 'transparent', outline: 'none'}} />
            <span style={{paddingRight: '.5em'}}>¢</span>
            <a onClick={this.signPost}>Sign</a>
          </div>
          <div style={{display: this.state.signature > 0 ? 'block' : 'none', padding: '1em', textAlign: 'right'}}>
            <span style={{paddingRight: '.5em'}}>Signed {this.state.signature}¢</span>
            <a onClick={this.voidSignature}>Void</a>
          </div>
          <div style={{color: 'red', fontSize:'60%', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center'}}>{this.state.error}</div>
        </div>
      </div>
    );
  }
}

class NewPost extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: 'edit',
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
    document.getElementById('new-post-title-preview').innerHTML = document.getElementById('new-post-title').innerHTML;
    document.getElementById('new-post-body-preview').innerHTML = marked(toMarkdown(document.getElementById('new-post-body')));
  }

  submitPost() {
    if (this.props.channel == '') {
      this.setState({
        error: 'Please specify a channel (top right)'
      });
    }
    else {
      var title = document.getElementById('new-post-title').innerHTML;
      var body = toMarkdown(document.getElementById('new-post-body'));
      contract.CreatePost(this.props.channel, title, body, {from: web3.eth.accounts[0], value: 0}, (error) => {
        if (error) {
          this.setState({
            error: error.toString()
          });
        }
        else {
          this.setState({
            view: 'success',
            error: ''
          });
        }
      });
    }
  }

  render() {
    return (
      <div style={{width: '100%', margin: '0 auto'}}>
        <div style={{width: '100%', backgroundColor: '#FFF'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{padding: '1em'}}>
              <div style={{display: this.state.view == 'edit' ? 'block' : 'none'}}>
                <input type="hidden" name="channel" value="test"></input>
                <h1 id="new-post-title" contentEditable="true" placeholder="title"></h1>
                <div id="new-post-body" contentEditable="true"></div>
              </div>
              <div style={{display: this.state.view == 'preview' ? 'block' : 'none'}}>
                <h1 id="new-post-title-preview"></h1>
                <div id="new-post-body-preview"></div>
              </div>
              <div style={{display: this.state.view == 'success' ? 'block' : 'none'}}>
                <div>Your new post has been published. Please allow a few minutes for it to broadcast across the network.</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{width: '100%'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{display: this.state.view == 'edit' ? 'block' : 'none', padding: '1em', textAlign: 'right'}}>
              <a onClick={this.previewPost}>Preview</a>
            </div>
            <div style={{display: this.state.view == 'preview' ? 'block' : 'none', padding: '1em'}}>
              <a style={{float: 'left'}} onClick={this.editPost}>Edit</a>
              <a style={{float: 'right'}} onClick={this.submitPost}>Publish</a>
              <div style={{float: 'none', clear: 'bloth'}}>{' '}</div>
            </div>
            <div style={{color: 'red', fontSize:'60%', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center'}}>{this.state.error}</div>
          </div>
        </div>
      </div>
    );
  }
}

class RankedChannelList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      listItems: []
    };
  }

  componentDidMount() {
    contract.GetChannelsByRankRange(1, 10, (error, tuple) => {
      var ranks = tuple[0].map((rank) => parseInt(rank.toString()));
      var ids = tuple[1].map((id) => '0x' + id.toString(16));
      var cred = tuple[2].map((cred) => parseInt(cred.toString()));
      var idToIndex = {};
      var listItems = [];
      for (var i = 0; i < ids.length; i++) {
        idToIndex[ids[i]] = i;
        listItems.push({
          id: ids[i],
          rank: ranks[i].toString(),
          cred: cred[i].toString(),
        });
      }
      contract.ChannelCreate({channelID: ids}, {fromBlock: 0, toBlock: 'pending'}).get((error, channels) => {
        channels.forEach(function (channel) {
          var listItem = listItems[idToIndex['0x' + channel.args.channelID.toString(16)]];
          listItem.channel = channel.args.channelName;
          listItem.timestamp = channel.args.timestamp;
        });
        this.setState({
          loaded: true,
          listItems: listItems
        });
      });
    });
  }

  render() {
    var listItems = this.state.listItems.map((listItem) => {
      return (
        <li key={'li-'+listItem.id} value={listItem.rank} onClick={this.props.selectChannel.bind(this, listItem)}>
          <div>#{listItem.channel}</div>
          <span>{'Rank ' +listItem.rank + '  ·  ' + listItem.cred + '¢  ·  Created ' + new Date(listItem.timestamp* 1000).toLocaleString()}</span>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <div>{'Top channels'}</div>
        <ol>{listItems}</ol>
      </div>
    );
  }
}

class RankedPostList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      listItems: []
    };
    this.getPosts = this.getPosts.bind(this);
  }

  getPosts(channel) {
    contract.GetPostsByRankRange(channel, 1, 10, (error, tuple) => {
      var ranks = tuple[0].map((rank) => parseInt(rank.toString()));
      var ids = tuple[1].map((id) => '0x' + id.toString(16));
      var cred = tuple[2].map((cred) => parseInt(cred.toString()));
      var idToIndex = {};
      var listItems = [];
      for (var i = 0; i < ids.length; i++) {
        idToIndex[ids[i]] = i;
        listItems.push({
          id: ids[i],
          rank: ranks[i].toString(),
          cred: cred[i].toString(),
        });
      }
      var filter = contract.PostCreate({postID: ids}, {fromBlock: 0, toBlock: 'pending'});
      filter.get((error, posts) => {
        posts.forEach(function (post) {
          var listItem = listItems[idToIndex['0x' + post.args.postID.toString(16)]];
          listItem.title = post.args.title;
          listItem.body = post.args.body;
          listItem.channel = post.args.channelName;
          listItem.timestamp = post.args.timestamp;
        });
        this.setState({
          channel: channel,
          loaded: true,
          listItems: listItems
        });
      });
    });
  }

  componentDidMount() {
    this.getPosts(this.props.channel);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.channel != this.state.channel) {
      this.getPosts(nextProps.channel);
    }
  }

  render() {
    var listItems = this.state.listItems.map((listItem) => {
      return (
        <li key={'li-'+listItem.id} value={listItem.rank} onClick={this.props.selectItem.bind(this, listItem)}>
          <div>{listItem.title}</div>
          <span>{'Rank ' +listItem.rank + '  ·  ' + listItem.cred + '¢  ·  Posted ' + new Date(listItem.timestamp* 1000).toLocaleString()}</span>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <div>{'Top content in #'+this.state.channel}</div>
        <ol>{listItems}</ol>
      </div>
    );
  }
}

class NewestChannelList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      listItems: []
    };
  }

  componentDidMount() {
    contract.ChannelCreate({}, {fromBlock: 0, toBlock: 'pending'}).get((error, channels) => {
      var listItems = channels.map((channel) => {
        return {
          id: '0x' + channel.args.channelID.toString(16),
          channel: channel.args.channelName,
          timestamp: channel.args.timestamp
        }
      }).sort((a, b) => a.timestamp > b.timestamp ? -1 : 1);
      this.setState({
        loaded: true,
        listItems: listItems
      });
    });
  }

  render() {
    var listItems = this.state.listItems.map((listItem) => {
      return (
        <li key={'li-'+listItem.id} onClick={this.props.selectChannel.bind(this, listItem)}>
          <div>#{listItem.channel}</div>
          <span>{'Created ' + new Date(listItem.timestamp * 1000).toLocaleString()}</span>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <div>{'Newest channels'}</div>
        <ol>{listItems}</ol>
      </div>
    );
  }
}

class NewestPostList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      listItems: []
    };
    this.getPosts = this.getPosts.bind(this);
  }

  getPosts(channel) {
    contract.GetChannelID(channel, (error, channelID) => {
      contract.PostCreate({channelID: channelID}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
        var listItems = posts.map((post) => {
          return {
            id: '0x' + post.args.postID.toString(16),
            body: post.args.body,
            title: post.args.title,
            channel: post.args.channelName,
            timestamp: post.args.timestamp
          }
        }).sort((a, b) => a.timestamp > b.timestamp ? -1 : 1);
        this.setState({
          loaded: true,
          listItems: listItems
        });
      });
    })
  }

  componentDidMount() {
    this.getPosts(this.props.channel);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.channel != this.state.channel) {
      this.getPosts(nextProps.channel);
    }
  }
  render() {
    var listItems = this.state.listItems.map((listItem) => {
      return (
        <li key={'li-'+listItem.id} onClick={this.props.selectItem.bind(this, listItem)}>
          <div>{listItem.title}</div>
          <span>{'Posted ' + new Date(listItem.timestamp* 1000).toLocaleString() + ' in #'+listItem.channel}</span>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <div>{'Newest content in #'+this.props.channel}</div>
        <ol>{listItems}</ol>
      </div>
    );
  }
}

class PostedList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      listItems: []
    };
    this.getPosts = this.getPosts.bind(this);
  }

  getPosts(channel) {
    contract.GetChannelID(channel, (error, channelID) => {
      var filter;
      if (channelID > 0) {
        filter = contract.PostCreate({sourceAddress: web3.eth.accounts[0], channelID: channelID}, {fromBlock: 0, toBlock: 'pending'});
      }
      else {
        filter = contract.PostCreate({sourceAddress: web3.eth.accounts[0]}, {fromBlock: 0, toBlock: 'pending'});
      }
      filter.get((error, posts) => {
        var listItems = posts.map((post) => {
          return {
            id: '0x' + post.args.postID.toString(16),
            channel: post.args.channelName,
            title: post.args.title,
            body: post.args.body,
            timestamp: post.args.timestamp
          }
        }).sort((a, b) => a.timetamp > b.timestamp ? -1 : 1);
        this.setState({
          channel: channel,
          loaded: true,
          listItems: listItems
        });
      });
    });
  }

  componentDidMount() {
    this.getPosts(this.props.channel);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.channel != this.state.channel) {
      this.getPosts(nextProps.channel);
    }
  }

  render() {
    var listItems = this.state.listItems.map((listItem) => {
      return (
        <li key={'li-'+listItem.id} onClick={this.props.selectItem.bind(this, listItem)}>
          <div>{listItem.title}</div>
          <span>{'Posted ' + new Date(listItem.timestamp* 1000).toLocaleString()}</span>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <div>{'Content posted by you ('+listItems.length+')'}</div>
        <ol>{listItems}</ol>
      </div>
    );
  }
}

class SignedList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      listItems: []
    };
    this.getPosts = this.getPosts.bind(this);
  }

  getPosts(channel) {
    contract.GetChannelID(channel, (error, channelID) => {
      var signatureFilter;
      var signatureVoidFilter;
      if (channelID > 0) {
        signatureFilter = contract.PostSign({sourceAddress: web3.eth.accounts[0], channelID: channelID}, {fromBlock: 0, toBlock: 'pending'});
        signatureVoidFilter = contract.SignatureVoid({sourceAddress: web3.eth.accounts[0], channelID: channelID}, {fromBlock: 0, toBlock: 'pending'});
      }
      else {
        signatureFilter = contract.PostSign({sourceAddress: web3.eth.accounts[0]}, {fromBlock: 0, toBlock: 'pending'});
        signatureVoidFilter = contract.SignatureVoid({sourceAddress: web3.eth.accounts[0]}, {fromBlock: 0, toBlock: 'pending'});
      }
      signatureFilter.get((error, signatures) => {
        signatureVoidFilter.get((error, signatureVoids) => {
          var signSum = {};
          var signTime = {};
          signatures.forEach((signature) => {
            var postID = '0x' + signature.args.postID.toString(16);
            var cred = parseInt(signature.args.cred.toString(10));
            var timestamp = parseInt(signature.args.timestamp.toString(10));
            signSum[postID] = signSum[postID] > 0 ? (signSum[postID] + cred) : cred;
            if (!signTime[postID] || timestamp > signTime[postID]) {
              signTime[postID] = timestamp;
            }
          });
          signatureVoids.forEach((signatureVoid) => {
            var postID = '0x' + signatureVoid.args.postID.toString(16);
            var cred = parseInt(signatureVoid.args.cred.toString(10));
            var timestamp = parseInt(signatureVoid.args.timestamp.toString(10));
            signSum[postID] -= cred;
            if (timestamp > signTime[postID]) {
              signTime[postID] = timestamp;
            }
          });
          var postFilter = contract.PostCreate({postID: Object.keys(signSum).filter((key) => signSum[key] > 0)}, {fromBlock: 0, toBlock: 'pending'});
          postFilter.get((error, posts) => {
            var listItems = posts.map((post) => {
              var postID = '0x' + post.args.postID.toString(16);
              return {
                id: postID,
                channel: post.args.channelName,
                title: post.args.title,
                body: post.args.body,
                timestamp: post.args.timestamp,
                signatureAmount: signSum[postID],
                signatureTime: signTime[postID]
              }
            }).sort((a, b) => signTime[a.id] > signTime[b.id] ? -1 : 1);
            this.setState({
              channel: channel,
              loaded: true,
              listItems: listItems
            });
          });
        });
      });
    });
  }

  componentDidMount() {
    this.getPosts(this.props.channel);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.channel != this.state.channel) {
      this.getPosts(nextProps.channel);
    }
  }

  render() {
    var listItems = this.state.listItems.map((listItem) => {
      return (
        <li key={'li-'+listItem.id} onClick={this.props.selectItem.bind(this, listItem)}>
          <div>{listItem.title}</div>
          <span>{'Signed ' + listItem.signatureAmount +'¢  on ' + new Date(listItem.signatureTime * 1000).toLocaleString()}</span>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <div>{'Content currently signed by you ('+listItems.length+')'}</div>
        <ol>{listItems}</ol>
      </div>
    );
  }
}

class VoidedList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      listItems: []
    };
    this.getPosts = this.getPosts.bind(this);
  }

  getPosts(channel) {
    contract.GetChannelID(channel, (error, channelID) => {
      var signatureFilter;
      var signatureVoidFilter;
      if (channelID > 0) {
        signatureFilter = contract.PostSign({sourceAddress: web3.eth.accounts[0], channelID: channelID}, {fromBlock: 0, toBlock: 'pending'});
        signatureVoidFilter = contract.SignatureVoid({sourceAddress: web3.eth.accounts[0], channelID: channelID}, {fromBlock: 0, toBlock: 'pending'});
      }
      else {
        signatureFilter = contract.PostSign({sourceAddress: web3.eth.accounts[0]}, {fromBlock: 0, toBlock: 'pending'});
        signatureVoidFilter = contract.SignatureVoid({sourceAddress: web3.eth.accounts[0]}, {fromBlock: 0, toBlock: 'pending'});
      }
      signatureFilter.get((error, signatures) => {
        signatureVoidFilter.get((error, signatureVoids) => {
          var signSum = {};
          var signTime = {};
          var signVoid = {};
          signatures.forEach((signature) => {
            var postID = '0x' + signature.args.postID.toString(16);
            var cred = parseInt(signature.args.cred.toString(10));
            var timestamp = parseInt(signature.args.timestamp.toString(10));
            signSum[postID] = signSum[postID] > 0 ? (signSum[postID] + cred) : cred;
            if (!signTime[postID] || timestamp > signTime[postID]) {
              signTime[postID] = timestamp;
            }
          });
          signatureVoids.forEach((signatureVoid) => {
            var postID = '0x' + signatureVoid.args.postID.toString(16);
            var cred = parseInt(signatureVoid.args.cred.toString(10));
            var timestamp = parseInt(signatureVoid.args.timestamp.toString(10));
            signSum[postID] -= cred;
            if (timestamp > signTime[postID]) {
              signVoid[postID] = cred;
              signTime[postID] = timestamp;
            }
          });
          // The only logical difference from getting the Signed posts is in the `filter` function
          var postFilter = contract.PostCreate({postID: Object.keys(signSum).filter((key) => signSum[key] == 0)}, {fromBlock: 0, toBlock: 'pending'});
          postFilter.get((error, posts) => {
            var listItems = posts.map((post) => {
              var postID = '0x' + post.args.postID.toString(16);
              return {
                id: postID,
                channel: post.args.channelName,
                title: post.args.title,
                body: post.args.body,
                timestamp: post.args.timestamp,
                signatureAmount: signVoid[postID],
                signatureTime: signTime[postID]
              }
            }).sort((a, b) => signTime[a.id] > signTime[b.id] ? -1 : 1);
            this.setState({
              channel: channel,
              loaded: true,
              listItems: listItems
            });
          });
        });
      });
    });
  }

  componentDidMount() {
    this.getPosts(this.props.channel);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.channel != this.state.channel) {
      this.getPosts(nextProps.channel);
    }
  }

  render() {
    var listItems = this.state.listItems.map((listItem) => {
      return (
        <li key={'li-'+listItem.id} onClick={this.props.selectItem.bind(this, listItem)}>
          <div>{listItem.title}</div>
          <span>{'Voided ' + listItem.signatureAmount + '¢  on  ' + new Date(listItem.signatureTime * 1000).toLocaleString()}</span>
        </li>
      );
    });
    return (
      <div className='view-align'>
        <div>{'Content no longer signed by you ('+listItems.length+')'}</div>
        <ol>{listItems}</ol>
      </div>
    );
  }
}

// Manage navigation
class App extends React.Component {
  constructor(props) {
    super(props);

    // TODO merge in hashtag deetz
    this.state = {
      channel: '',
      view: 'ranked',
      postID: null
    };


    this.selectItem = this.selectItem.bind(this);
    this.selectChannel = this.selectChannel.bind(this);
    this.setChannel = this.setChannel.bind(this);
    this.setView = this.setView.bind(this);

    this.views = {
      'ranked': (channel) => channel == '' ?
        <RankedChannelList selectChannel={this.selectChannel} /> :
        <RankedPostList channel={channel} selectItem={this.selectItem} />,
      'newest': (channel) => channel == '' ?
        <NewestChannelList selectChannel={this.selectChannel} /> :
        <NewestPostList channel={channel} selectItem={this.selectItem} />,
      'posted': (channel) => <PostedList channel={channel} selectItem={this.selectItem} />,
      'signed': (channel) => <SignedList channel={channel} selectItem={this.selectItem} />,
      'voided': (channel) => <VoidedList channel={channel} selectItem={this.selectItem} />,
      'create': (channel) => <NewPost channel={channel} />
    }
  }

  selectItem(listItem) {
    this.setState({
      postID: listItem.id,
      listItem: listItem
    });
  }

  selectChannel(listItem) {
    this.setState({
      channel: listItem.channel
    });
    document.getElementById('channel').innerHTML = listItem.channel;
  }

  setChannel(e) {
    var channel = e.target.innerHTML;
    this.setState({
      channel: channel
    });
  }

  setView(e) {
    var path = e.target.getAttribute('href', '').split('/');
    if (path.length < 3) {
      this.setState({
        postID: path[path.length - 1]
      });
    }
    else if (this.views[path[1]] !== undefined) {
      this.setState({
        view: path[1],
        postID: null
      });
    }
  }

  componentDidMount() {
    document.getElementById('channel').innerHTML = this.state.channel;
  }

  render() {
    var view = '';
    // if the view is a post,
    if (this.state.postID) {
      view = (
        <Post
          id={this.state.postID}
          channel={this.state.listItem.channel}
          title={this.state.listItem.title}
          body={this.state.listItem.body}
          timestamp={this.state.listItem.timestamp} />
      );
    }
    else if (typeof this.views[this.state.view] === "function") {
      view = this.views[this.state.view](this.state.channel);
    }
    else {
      view = <div>Invalid Path</div>;
    }

    return (
      <div>
        <div style={{maxWidth: '600px', margin: '0 auto'}}>
          <ol style={{listStyleType: 'none', padding: '1em 0 2em 0', margin: '0'}} id="navigation">
            <li><a href={"#/ranked/" + this.state.channel} className={this.state.view == 'ranked' ? 'selected' : ''} onClick={this.setView}>Ranked</a></li>
            <li><a href={"#/newest/" + this.state.channel} className={this.state.view == 'newest' ? 'selected' : ''} onClick={this.setView}>Newest</a></li>
            <li><a href={"#/posted/" + this.state.channel} className={this.state.view == 'posted' ? 'selected' : ''} onClick={this.setView}>Posted</a></li>
            <li><a href={"#/signed/" + this.state.channel} className={this.state.view == 'signed' ? 'selected' : ''} onClick={this.setView}>Signed</a></li>
            <li><a href={"#/voided/" + this.state.channel} className={this.state.view == 'voided' ? 'selected' : ''} onClick={this.setView}>Voided</a></li>
            <li><a href={"#/create/" + this.state.channel} className={this.state.view == 'create' ? 'selected' : ''} onClick={this.setView}>Create</a></li>
            <li style={{position: 'relative'}}>
              <div style={{position: 'absolute', left: '0', top: '0',/* paddingBottom: '.5em', borderBottom: '2px solid gray',*/ cursor: 'pointer'}}>
              <div onClick={() => document.getElementById('channel').focus()}>
                <span>#</span>
                <span onKeyUp={this.setChannel} id="channel" contentEditable="true" placeholder="channel"></span>
              </div>
              </div>
            </li>
          </ol>
        </div>
        <div>{view}</div>
      </div>
    );
  }
}
window.App = App;