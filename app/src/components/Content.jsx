import React from 'react';
import { Link } from 'react-router-dom';
import {
  getContentMeta,
  getContentData,
  parseHeaders,
  parseDocument,
  getContentSlug
} from '../scripts/formatting.js';
import Replies from './Replies.jsx';
import Tips from './Tips.jsx';

class Content extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contentID: this.props.match.params.slug.split('-').slice(-1)[0],
      title: '',
      timestamp: 0,
      parentID: '0x0',
      publisher: '0x0',
      replyCount: 0,
      tipped: 0,
      loading: true,
      loadingParent: false,
      isValidParent: false,
      watcherTimeout: 0
    };
    this.loadView = this.loadView.bind(this);
    this.onReply = this.onReply.bind(this);
    this.onTip = this.onTip.bind(this);
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

  onReply(lastReplyBlock) {
    this.setState({
      lastReplyBlock: lastReplyBlock
    });
  }

  onTip(tipped) {
    this.setState({
      tipped: tipped
    });
  }

  loadView(contentID) {
    this.setState({
      loadingParent: false,
      isValidParent: false,
      loading: true
    });
    getContentMeta(contentID, (error, contentMeta) => {
      getContentData(contentID, contentMeta.postBlock, (error, contentData) => {
        let content = Object.assign({}, contentMeta, contentData);
        let hasParent = parseInt(content.parentID != 0);
        let headers = parseHeaders(content.headers);
        this.setState({
          title: headers.title,
          tipped: content.tipped,
          parentID: content.parentID,
          publisher: content.publisher,
          lastReplyBlock: content.lastReplyBlock,
          replyCount: content.replyCount,
          timestamp: content.timestamp * 1000,
          loading: false,
          loadingParent: hasParent
        });
        document.getElementById(`post-${contentID}`).innerHTML = parseDocument(content.document, headers.format, headers.compression);
        if (hasParent) {
          getContentMeta(content.parentID, (error, contentMeta) => {
            getContentsData(content.parentID, contentMeta.postBlock, (error, contentData) => {
              let content = Object.assign({}, contentMeta, contentData);
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

  componentDidMount() {
    this.loadView(this.state.contentID);
  }

  componentWillUnmount() {
    if (this.state.watcherTimeout > 0) {
      window.clearTimeout(this.state.watcherTimeout);
    }
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
                  <Link to={`/account/${this.state.publisher}`}>{`${this.state.publisher.substr(0,5)}...${this.state.publisher.substr(-3)}`}</Link>
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
                <Link to={`/eth/${getContentSlug(this.state.title)}-${this.state.parentID}`}>{this.state.title}</Link>
              </div>
              <div id={'post-'+this.state.contentID} className='post'><p><i>Loading...</i></p></div>
            </div>
          </div>
        </div>
        <Tips contentID={this.state.contentID} tipped={this.state.tipped} onTip={this.onTip} />
        <Replies contentID={this.state.contentID} lastReplyBlock={this.state.lastReplyBlock} onReply={this.onReply} />
        <div style={{height: '3em'}}>&nbsp;</div>
      </div>
    );
  }
}

export default Content;
