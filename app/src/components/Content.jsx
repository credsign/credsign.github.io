import React from 'react';
import { Link } from 'react-router-dom';
import { getContentProps, getContentPosts, parseHeaders, parseDocument, getContentSlug, submitPost } from '../scripts/formatting.js';
import Editor from './Editor.jsx';
import Replies from './Replies.jsx';
import Popup from './Popup.jsx';

class Content extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      loadingParent: false,
      isValidParent: false,
      parentID: '0x0',
      publisher: '0x0',
      timestamp: 0,
      loading: true,
      tipValue: '',
      error: '',
      replyResetCounter: 0,
      contentID: this.props.match.params.slug.split('-').slice(-1)[0],
    };
    this.loadView = this.loadView.bind(this);
    this.submitReply = this.submitReply.bind(this);
    this.tipPost = this.tipPost.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    let nextContentID = nextProps.match.params.slug.split('-').slice(-1)[0];
    if (nextContentID != this.state.contentID) {
      this.setState({
        contentID: nextContentID
      });
      this.loadView(nextContentID);
    }
  }

  loadView(contentID) {
    this.setState({
      loadingParent: false,
      isValidParent: false,
      loading: true
    });
    getContentProps([contentID], (error, contentProps) => {
      getContentPosts([contentID], [contentProps[0].block], (error, contentPosts) => {
        let content = Object.assign({}, contentProps[0], contentPosts[0]);
        let hasParent = content.parentID != '0x0';
        let headers = parseHeaders(content.headers);
        this.setState({
          title: headers.title,
          funds: content.funds,
          parentID: content.parentID,
          publisher: content.publisher,
          replyCount: content.replyCount,
          timestamp: content.timestamp * 1000,
          loading: false,
          loadingParent: hasParent
        });
        document.getElementById(`post-${contentID}`).innerHTML = parseDocument(content.document, headers.format, headers.compression);
        if (hasParent) {
          getContentProps([content.parentID], (error, contentProps) => {
            getContentPosts([content.parentID], [contentProps[0].block], (error, contentPosts) => {
              let content = Object.assign({}, contentProps[0], contentPosts[0]);
              let replyToTitle = parseHeaders(content.headers).title;
              if (error || !replyToTitle) {
                this.setState({
                  loadingParent: false,
                  isValidParent: false
                });
              }
              else {
                this.setState({
                  loadingParent: false,
                  isValidParent: true,
                  title: replyToTitle
                });
              }
            });
          });
        }
      });
    });
  }

  tipPost() {
    let tip = new web3.BigNumber(this.state.tipValue || .01).times(web3.toWei(1));
    this.setState({
      view: 'tip'
    });
    let tx = {from: window.account, value: tip};
    console.log(tip.toString());
    window.web3.eth.getBlockNumber((error, currentBlock) => {
      window.feed.tip.estimateGas(this.state.contentID, '0x0', tip, tx, (error, gasEstimate) => {
        tx.gas = gasEstimate + 100000;
        window.feed.tip(this.state.contentID, '0x0', tip, tx, (error, result) => {
          if (error) {
            this.setState({
              error: error.toString()
            });
          }
          else {
            var watcherTimeout;
            var watcherFn = () => {
              window.feed.Tip({contentID: this.state.contentID, tipper: window.account}, {fromBlock: currentBlock}).get((error, tip) => {
                if (error) {
                  this.setState({
                    error: error.toString()
                  });
                }
                else if (tip.length == 0) {
                  this.setState({
                    publishWatcher: window.setTimeout(watcherFn, 3000)
                  });
                }
                else {
                  this.setState({
                    view: '',
                    tipValue: ''
                  });
                  this.loadView(this.state.contentID);
                }
              });
            }
            watcherFn();
          }
        });
      });
    });

  }

  submitReply() {
    this.setState({
      view: 'reply'
    });
    var title = null;
    var body = document.getElementById('new-post-body');
    var token = 0;
    var parentID = this.state.contentID;
    window.web3.eth.getBlockNumber((error, currentBlock) => {
      submitPost(title, body, token, parentID, (error, contentID) => {
        if (error) {
          this.setState({
            error: error.toString()
          });
        }
        else {
          var watcherTimeout;
          var watcherFn = () => {
            window.feed.Publish({contentID: contentID}, {fromBlock: currentBlock}).get((error, post) => {
              if (error) {
                this.setState({
                  error: error.toString()
                });
              }
              else if (post.length == 0) {
                this.setState({
                  publishWatcher: window.setTimeout(watcherFn, 3000)
                });
              }
              else {
                this.setState({
                  view: '',
                  replyResetCounter: this.state.replyResetCounter + 1,
                });
                this.loadView(this.state.contentID);
              }
            });
          }
          watcherFn();
        }
      });
    });
  }

  componentDidMount() {
    this.loadView(this.state.contentID);
  }

  render() {
    return (
      <div>
        <div style={{width: '100%', backgroundColor: '#fafafa'}}>
          <div style={{maxWidth: '600px', margin: '0 auto', padding: '1em 0'}}>
            <div style={{padding: '0 1em', color: 'dimgray'}}>
              <div style={{display: !this.state.loading ? 'block' : 'none'}}>
                <div style={{float: 'left'}}>
                  <span>by&nbsp;</span>
                  <Link to={`/profile/${this.state.publisher}`}>{`${this.state.publisher.substr(0,5)}...${this.state.publisher.substr(-3)}`}</Link>
                  <span>&nbsp;</span>
                </div>
                <div style={{float: 'left'}}>
                  <span>{`on ${new Date(this.state.timestamp).toLocaleString()}`}</span>
                </div>
                <div style={{float: 'none', clear: 'both'}}></div>
              </div>
              <div style={{fontStyle: 'italic', display: this.state.loading ? 'block' : 'none'}}>Loading...</div>
            </div>
          </div>
        </div>
        <div style={{backgroundColor: '#FFF'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{padding: '1.5em 1em', display: this.state.loading ? 'none' : 'block', wordWrap: 'break-word'}}>
              <div style={{display: !this.state.isValidParent && !this.state.loadingParent ? 'block' : 'none'}}>
                <h1 style={{visibility: this.state.loadingParent ? 'hidden' : 'visible'}}>{this.state.title}</h1>
              </div>
              <div style={{display: this.state.isValidParent && !this.state.loadingParent ? 'block' : 'none', color: '#777'}}>
                <span><i className='fa fa-reply'></i></span>
                <span> in response to </span>
                <Link to={`/${getContentSlug(this.state.title)}-${this.state.parentID}`}>{this.state.title}</Link>
              </div>
              <div id={'post-'+this.state.contentID} className='post'><p><i>Loading...</i></p></div>
            </div>
          </div>
        </div>
        <div style={{width: '100%'}} className='flex-grow'>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{height: '1em', padding: '1em'}}>
              <div style={{color: '#777'}}>
                <div style={{float: 'left'}}>
                  <span>{`${this.state.funds} ETH total`}</span>
                </div>
                <div style={{float: 'right', color: 'black', display: window.account ? 'block' : 'none'}}>
                  <input
                    type='text'
                    placeholder='0.01'
                    value={this.state.tipValue}
                    onChange={(e) => this.setState({tipValue: e.target.value})}
                    style={{textAlign: 'right', border: 0, fontSize: '1em', width: '5em', backgroundColor: 'inherit'}}></input>
                  <span> ETH </span>
                  <a style={{display: 'inline-block', textDecoration: 'underline'}} onClick={this.tipPost}>Tip</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{maxWidth: '600px', backgroundColor: '#FFF', margin: '0 auto', border: '1px solid #ddd'}}>
          <div style={{padding: '1em', wordWrap: 'break-word'}}>
            <Editor contentID={this.state.contentID} resetCounter={this.state.replyResetCounter} placeholder={'write a response...'} />
          </div>
          <div style={{padding: '1em', borderTop: '1px solid #eee'}}>
            <div style={{textAlign: 'right'}}>
              <a style={{display: 'inline-block', textDecoration: 'underline', marginLeft: '.5em'}} onClick={this.submitReply}>Publish</a>
            </div>
          </div>
        </div>
        {
          this.state.view == 'reply' ?
          <Popup
            onClose={() => this.setState({view: '', error: ''})}
            errorHeader={'Unable to publish'}
            errorMessage={this.state.error}
            actionHeader={'Publishing'}
            actionMessage={'Your reply is being published. This window will close automatically. If it does not close after several minutes, please close this window and try again.'}
            /> : ''
        }
        {
          this.state.view == 'tip' ?
          <Popup
            onClose={() => this.setState({view: '', error: ''})}
            errorHeader={'Unable to tip'}
            errorMessage={this.state.error}
            actionHeader={'Sending Tip'}
            actionMessage={'Your tip is being sent! This window should close automatically within a few minutes. If it does not, try closing this message and tipping again.'}
            /> : ''
        }
        <Replies contentID={this.state.contentID} resetCounter={this.state.replyResetCounter} />
        <div style={{height: '3em'}}>&nbsp;</div>
      </div>
    );
  }
}

export default Content;
