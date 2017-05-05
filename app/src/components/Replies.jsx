import React from 'react';
import Editor from './Editor.jsx';
import { Link } from 'react-router-dom';

import toMarkdown from '../scripts/toMarkdown.js';
import { getContentProps, getContentPosts, parseHeaders, parseDocument, getContentSlug } from '../scripts/formatting.js';

class Replies extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      listItems: []
    };
    this.getReplies = this.getReplies.bind(this);
  }

  getReplies(parentID) {
    let ether = web3.toWei(1);
    window.read.getContentReplies(parentID, (error, contentIDs) => {
      if (contentIDs.length == 0) {
        this.setState({
          listItems: [],
          loading: false
        });
        return;
      }
      getContentProps(contentIDs, (error, contentProps) => {
        getContentPosts(contentIDs, contentProps.map(props => props.block), (error, contentPosts) => {
          let contents = [];
          for (let i = 0; i < contentIDs.length; i++) {
            let content = Object.assign({}, contentProps[i], contentPosts[i]);
            let headers = parseHeaders(content.headers);
            contents.unshift({
              contentID: content.contentID,
              title: headers.title,
              body: parseDocument(content.document, headers.format, headers.compression),
              funds: content.funds,
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

  componentDidMount() {
    this.getReplies(this.props.contentID);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.contentID != this.props.contentID || nextProps.resetCounter > this.props.resetCounter) {
      this.setState({
        loading: true,
        listItems: []
      });
      this.getReplies(nextProps.contentID);
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
              <Link to={`/filter/address/${content.publisher}`}>{`${content.publisher.substr(0,5)}...${content.publisher.substr(-3)}`}</Link>
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
              <span>{`${content.funds} ETH`}</span>
              <span>{' and '}</span>
              <Link to={`/eth/${getContentSlug(content.title)}-${content.contentID}`}>{`${content.replyCount} response${content.replyCount != 1 ? 's' : ''}`}</Link>
            </div>
          </div>
        </div>
      );
    });
    return (
      <div>
        <div style={{maxWidth: '600px', margin: '0em auto'}}>
          <div style={{padding: '1em', color: '#777', display: posts.length > 0 ? 'block' : 'none'}}>Responses below</div>
          <div style={{display: posts.length == 0 ? 'block' : 'none', height: '1em'}}>&nbsp;</div>
        </div>
        {posts}
      </div>
    );
  }
}

export default Replies;
