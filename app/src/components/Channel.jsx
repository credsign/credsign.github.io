import React from 'react';
import { Link } from 'react-router-dom';
import {
  getChannelFeed,
  getContentsMeta,
  getContentsData,
  parseHeaders,
  humanizeDuration,
  getContentSlug,
  prettifyTokenValue
} from '../scripts/formatting.js';

class Channel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contents: [],
      contentsMeta: [],
      channelSize: 0,
      loading: true,
      token: props.match.params.token,
      pageLimit: 5,
      sort: props.match.params.sort || 'top'
    };

    this.loadContents = this.loadContents.bind(this);
    this.loadMore = this.loadMore.bind(this);
  }

  loadContents(sort) {
    let token = 1;
    window.feed.getChannel(token, (error, channel) => {
      let postBlock = channel[0];
      let channelSize = channel[1];
      if (channelSize == 0) {
        this.setState({
          contents: [],
          contentsMeta: [],
          channelSize: 0,
          loading: false
        });
        return;
      }
      getChannelFeed(token, postBlock, 0, (error, results) => {
        // Load props for posts in channel
        getContentsMeta(results.feed.map(entry => entry.contentID), (error, contentsMeta) => {
          if (sort == 'new') {
            contentsMeta = contentsMeta.reverse();
          }
          else if (sort == 'top') {
            contentsMeta = contentsMeta.sort((a, b) => a.score > b.score ? -1 : 1);
          }
          let ids = contentsMeta.slice(0, this.state.pageLimit).map(props => props.contentID);
          let blocks = contentsMeta.slice(0, this.state.pageLimit).map(props => props.postBlock);
          getContentsData(ids, blocks, (error, contentsData) => {
            let contents = contentsData.map((post, i) => {
              let props = contentsMeta[i];
              return {
                contentID: props.contentID,
                title: parseHeaders(post.headers).title,
                tipped: props.tipped,
                timestamp: post.timestamp * 1000,
                replyCount: props.replyCount
              }
            });
            this.setState({
              contents: contents,
              contentsMeta: contentsMeta,
              channelSize: channelSize,
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
    let contentsMeta = this.state.contentsMeta;
    let newCount = this.state.contents.length + this.state.pageLimit;
    if (newCount > contentsMeta.length) {
      // TODO: this should be dependent on the channelsize,
      // and contingently load more contentsMeta in the future
      // instead of loading all the contentsMeta at the start
      newCount = contentsMeta.length;
    }
    let ids = contentsMeta.slice(0, newCount).map(props => props.contentID);
    let blocks = contentsMeta.slice(0, newCount).map(props => props.postBlock);
    getContentsData(ids, blocks, (error, contentsData) => {
      let contents = contentsData.map((post, i) => {
        let props = contentsMeta[i];
        return {
          contentID: props.contentID,
          title: parseHeaders(post.headers).title,
          tipped: props.tipped,
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
    this.loadContents(this.state.sort);
  }

  componentWillReceiveProps(nextProps) {
    let sort = nextProps.match.params.sort;
    if (this.state.sort != sort) {
      if (sort == 'top' || sort == 'new') {
        this.setState({
          sort: sort
        });
        this.loadContents(sort);
      }
    }
  }

  render() {
    var now = new Date().getTime();
    var listItems = this.state.contents.map((content) => {
      return (
        <li key={'li-'+content.contentID}>
          <a href={`#/eth/${getContentSlug(content.title)}-${content.contentID}`}>
            <div>{`${content.title}`}</div>
            <span>{`${prettifyTokenValue(content.tipped)} ETH`}</span>
            <span>{` - ${content.replyCount} response${content.replyCount == 1 ? '' : 's'}`}</span>
            <span>{` - ${humanizeDuration(content.timestamp, now)} ago`}</span>
          </a>
        </li>
      );
    });

    return (
      <div style={{width:'100%'}} className='feed flex-grow'>
        <div style={{maxWidth: '600px', margin: '0 auto'}}>
          <div style={{padding: '1em'}}>
            <Link to={`/${this.state.token}/all/top`} style={{textDecoration: this.state.sort == 'top' ? 'none' : 'underline'}}>Top</Link>
            <span> - </span>
            <Link to={`/${this.state.token}/all/new`} style={{textDecoration: this.state.sort == 'new' ? 'none' : 'underline'}}>New</Link>
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

export default Channel;
