import React from 'react';
import Editor from './Editor.jsx';
import Popup from './Popup.jsx';
import { Link } from 'react-router-dom';

import {
  submitReply,
  getContentReplyFeed,
  getContentMeta,
  getContentsMeta,
  getContentsData,
  parseHeaders,
  parseDocument,
  getContentSlug,
  prettifyTokenValue
} from '../scripts/formatting.js';

class Replies extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: '',
      loading: true,
      listItems: [],
      resetCounter: 0
    };
    this.reply = this.reply.bind(this);
    this.getReplies = this.getReplies.bind(this);
  }

  getReplies(parentID, lastReplyBlock) {
    if (!(lastReplyBlock > 0)) {
      this.setState({
        listItems: [],
        loading: false
      });
      return;
    }
    getContentReplyFeed(parentID, lastReplyBlock, 0, (error, results) => {
      let contentIDs = results.feed.map(entry => entry.contentID);
      getContentsMeta(contentIDs, (error, contentsMeta) => {
        getContentsData(contentIDs, contentsMeta.map(props => props.postBlock), (error, contentsData) => {
          let contents = [];
          for (let i = 0; i < contentIDs.length; i++) {
            let content = Object.assign({}, contentsMeta[i], contentsData[i]);
            let headers = parseHeaders(content.headers);
            let ether = web3.toWei(1);
            contents.unshift({
              contentID: content.contentID,
              title: headers.title,
              body: parseDocument(content.document, headers.format, headers.compression),
              tipped: content.tipped,
              publisher: content.publisher,
              replyCount: content.replyCount,
              timestamp: content.timestamp * 1000
            });
          }
          this.setState({
            listItems: contents,
            loading: false
          });
        });
      });
    });
  }

  reply() {
    this.setState({
      replying: true
    });
    var title = null;
    var body = document.getElementById('new-post-body');
    var token = 1;
    var parentID = this.props.contentID;

    submitReply(title, body, token, parentID, (error, contentID) => {
      if (error) {
        this.setState({
          error: error.toString()
        });
      }
      else {
        let watcherFn = () => {
          getContentMeta(contentID, (error, contentMeta) => {
            if (contentMeta.postBlock > 0) {
              this.setState({
                replying: false,
                resetCounter: this.state.resetCounter + 1
              });
              this.props.onReply(contentMeta.postBlock);
            }
            else {
              this.setState({
                watcherTimeout: window.setTimeout(watcherFn, 5000)
              });
            }
          });
        }
        watcherFn();
      }
    });
  }

  componentDidMount() {
    this.getReplies(this.props.contentID, this.props.lastReplyBlock);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.contentID != this.props.contentID || nextProps.lastReplyBlock != this.props.lastReplyBlock) {
      this.setState({
        loading: true,
        listItems: []
      });
      this.getReplies(nextProps.contentID, nextProps.lastReplyBlock);
    }
  }

  componentDidUpdate() {
    this.state.listItems.forEach((content) => {
      document.getElementById('post-'+content.contentID).innerHTML = content.body;
    });
  }

  render() {
    var posts = this.state.listItems.map(content => {
      return (
        <div key={'wrapper-' + content.contentID} style={{maxWidth: '600px', margin: '0 auto 1em auto', border: '1px solid #eee', backgroundColor: '#FFF'}}>
          <div style={{padding: '1em', color: 'dimgray'}}>
            <div style={{float: 'left'}}>
              <span>by&nbsp;</span>
              <Link to={`/account/${content.publisher}`}>{`${content.publisher.substr(0,5)}...${content.publisher.substr(-3)}`}</Link>
              <span>&nbsp;</span>
            </div>
            <div style={{float: 'left'}}>
              <span>{`on ${new Date(content.timestamp).toLocaleString()}`}</span>
            </div>
            <div style={{float: 'none', clear: 'both'}}></div>
          </div>
          <div id={'post-' + content.contentID} className='post' style={{padding: '0 1em', wordWrap: 'break-word'}}>
          </div>
          <div style={{height: '1em', padding: '1em'}}>
            <div style={{color: '#777'}}>
              <span>{`${prettifyTokenValue(content.tipped)} ETH`}</span>
              <span>{' and '}</span>
              <Link to={`/eth/${getContentSlug(content.title)}-${content.contentID}`}>{`${content.replyCount} response${content.replyCount != 1 ? 's' : ''}`}</Link>
            </div>
          </div>
        </div>
      );
    });
    return (
      <div>
        <div style={{maxWidth: '600px', backgroundColor: '#FFF', margin: '0 auto', border: '1px solid #ddd'}}>
          <div style={{padding: '1em', wordWrap: 'break-word'}}>
            <Editor contentID={this.state.contentID} resetCounter={this.state.resetCounter} placeholder={'write a response...'} />
          </div>
          <div style={{padding: '1em', borderTop: '1px solid #eee'}}>
            <div style={{textAlign: 'right'}}>
              <a style={{display: 'inline-block', textDecoration: 'underline', marginLeft: '.5em'}} onClick={this.reply}>Publish</a>
            </div>
          </div>
        </div>
        <div style={{maxWidth: '600px', margin: '0em auto'}}>
          <div style={{padding: '1em', color: '#777', display: posts.length > 0 ? 'block' : 'none'}}>Responses below</div>
          <div style={{display: posts.length == 0 ? 'block' : 'none', height: '1em'}}>&nbsp;</div>
        </div>
        {posts}
        {
          this.state.replying ?
          <Popup
            onClose={() => { clearTimeout(this.state.watcherTimeout); this.setState({replying: false, error: '', watcherTimeout: -1}) } }
            errorHeader={'Unable to publish'}
            errorMessage={this.state.error}
            actionHeader={'Publishing'}
            actionMessage={'Your reply is being published. This window will close automatically. If it does not close after several minutes, please close this window and try again.'} /> : ''
        }
      </div>
    );
  }
}

export default Replies;
