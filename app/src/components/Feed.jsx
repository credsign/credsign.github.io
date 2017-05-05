import React from 'react';
import { getContentProps, getContentPosts, parseHeaders, humanizeDuration, getContentSlug } from '../scripts/formatting.js';

class Feed extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contents: [],
      contentProps: [],
      channelSize: 0,
      loading: true,

      pageLimit: 5,
      sort: 'new'
    };

    this.loadContents = this.loadContents.bind(this);
    this.loadMore = this.loadMore.bind(this);
  }

  loadContents() {
    window.feed.getChannelSize(0, (error, size) => {
      size = size.toNumber();
      if (size == 0) {
        this.setState({
          contents: [],
          contentProps: [],
          channelSize: 0,
          loading: false
        });
        return;
      }
      window.read.getChannelFeed(0, 0, size, (error, contentIDs) => {
        // Load props for posts in channel
        getContentProps(contentIDs, (error, contentProps) => {
          if (this.state.sort == 'new') {
            contentProps = contentProps.reverse();
          }
          else if (this.state.sort == 'top') {
            contentProps = contentProps.sort((a, b) => a.score > b.score ? -1 : 1);
          }
          let ids = contentProps.slice(0, this.state.pageLimit).map(props => props.contentID);
          let blocks = contentProps.slice(0, this.state.pageLimit).map(props => props.block);
          getContentPosts(ids, blocks, (error, contentPosts) => {
            let contents = contentPosts.map((post, i) => {
              let props = contentProps[i];
              return {
                contentID: props.contentID,
                publisher: post.publisher,
                title: parseHeaders(post.headers).title,
                funds: props.funds,
                timestamp: post.timestamp * 1000,
                replyCount: props.replyCount
              }
            });
            this.setState({
              contents: contents,
              contentProps: contentProps,
              channelSize: size,
              loading: false
            });
          });
        });
      });
    });
  }

  loadMore() {
    this.setState({
      loading: true
    });
    let contentProps = this.state.contentProps;
    let newCount = this.state.contents.length + this.state.pageLimit;
    if (newCount > contentProps.length) {
      // TODO: this should be dependent on the channelsize,
      // and contingently load more contentProps in the future
      // instead of loading all the contentProps at the start
      newCount = contentProps.length;
    }
    let ids = contentProps.slice(0, newCount).map(props => props.contentID);
    let blocks = contentProps.slice(0, newCount).map(props => props.block);
    getContentPosts(ids, blocks, (error, contentPosts) => {
      let contents = contentPosts.map((post, i) => {
        let props = contentProps[i];
        return {
          contentID: props.contentID,
          publisher: post.publisher,
          title: parseHeaders(post.headers).title,
          funds: props.funds,
          timestamp: post.timestamp * 1000,
          replyCount: props.replyCount
        }
      });
      this.setState({
        contents: contents,
        loading: false
      });
    });
  }

  componentDidMount() {
    this.loadContents();
  }

  render() {
    var now = new Date().getTime();
    var listItems = this.state.contents.map((content) => {
      return (
        <li key={'li-'+content.contentID}>
          <a href={`#/eth/${getContentSlug(content.title)}-${content.contentID}`}>
            <div>{`${content.title}`}</div>
            <span>{`${content.funds} ETH`}</span>
            <span>{` - ${content.replyCount} response${content.replyCount == 1 ? '' : 's'}`}</span>
            <span>{` - published ${humanizeDuration(content.timestamp, now)} ago`}</span>
          </a>
        </li>
      );
    });

    return (
      <div style={{width:'100%'}} className='feed flex-grow'>
        <div style={{maxWidth: '600px', margin: '0 auto'}}>
          <div style={{padding: '1em'}}>
            {`All posts (${this.state.channelSize})`}
          </div>
          <div style={{
            margin: '1em',
            display: !this.state.loading && this.state.channelSize == 0 ? 'block'  : 'none'
          }}>Nothing found</div>
          <ol>{listItems}</ol>
          <div style={{
            fontStyle: 'italic',
            margin: '1em',
            display: this.state.loading ? 'block'  : 'none'
          }}>Loading...</div>
          <div style={{
            margin: '1em',
            display: !this.state.loading && this.state.channelSize != listItems.length ? 'block'  : 'none'
          }}><a style={{textDecoration: 'underline'}} onClick={this.loadMore}>Load more</a></div>
        </div>
        <div style={{height: '3em'}}>&nbsp;</div>
      </div>
    );
  }
}

export default Feed;
