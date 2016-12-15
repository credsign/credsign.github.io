import React from 'react';
import humanizeDuration from 'humanize-duration';
import Filter from './Filter.jsx';
import { getContentTitle, getChannelName } from '../../scripts/formatting.js';

class AllContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      loading: true,
      size: 0
    };
    this.getPosts = this.getPosts.bind(this);
    this.getPostRange = this.getPostRange.bind(this);
  }

  componentDidMount() {
    window.contentseries.getSize((error, size) => {
      size = size.toNumber();
      this.setState({
        size: size
      });
      var count = size < 10 ? size : 10;
      var start = size - count;
      this.getPostRange(start, count);
    });
  }

  getPosts() {
    var remaining = this.state.size - this.state.listItems.length;
    var count = remaining < 10 ? remaining : 10;
    var start = remaining - count;
    this.getPostRange(start, count);
  }

  componentWillReceiveProps(nextProps) {
  }

  getPostRange(start, count) {
    this.setState({
      loading: true
    });
    var listItems = [];
    var indices = [...Array(count)].map((_, i) => start + i + 1);
    window.contentseries.Series({seriesNum: indices}, {fromBlock: 0, toBlock: 'latest'}).get((error, series) => {
      var contentIDs = series.map((entry) => entry.args.contentID);
      window.content.Publish({contentID: contentIDs}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
        posts.forEach((post) => {
          listItems.unshift({
            id: '0x' + post.args.contentID.toString(16),
            title: getContentTitle(post.args.header),
            publisher: post.args.publisher,
            channelName: getChannelName(post.args.channelID),
            timestamp: post.args.timestamp.toNumber() * 1000
          });
        });
        this.setState({
          listItems: this.state.listItems.concat(listItems),
          loading: false
        });
      });
    });
  }

  render() {
    var now = new Date().getTime();
    var listItems = this.state.listItems.map((listItem) => {
      var age = now - listItem.timestamp;
      if (age > 604800000) {
        age -= age % 604800000;
      }
      else if (age > 86400000) {
        age -= age % 86400000;
      }
      else if (age > 3600000) {
        age -= age % 3600000;
      }
      else if (age > 60000) {
        age -= age % 60000;
      }
      else if (age > 1000) {
        age -= age % 1000;
      }
      return (
        <li key={'li-'+listItem.id}>
          <a href={`#/content/${listItem.id}`}>
            <div>{listItem.title}</div>
            <span>{`${humanizeDuration(age)} ago`}</span>
            <span>{` by ${listItem.publisher.substr(0,5)}...${listItem.publisher.substr(-3)}`}</span>
            <span>{` in #${listItem.channelName}`}</span>
          </a>
        </li>
      );
    });
    return (
      <div>
        <Filter type='' value='' />
        <div className='feed'>
          <div style={{
            padding: '1em',
            display: this.state.listItems.length > 0 && this.state.size > 0 ? 'block'  : 'none'
          }}>{`Latest posts (${this.state.size})`}</div>
          <div style={{
            padding: '1em',
            display: !this.state.loading && this.state.size == 0 ? 'block'  : 'none'
          }}>No posts found</div>
          <ol style={{marginBottom: this.state.size == listItems.length && listItems.length != 0 ? '1em' : '0'}}>{listItems}</ol>
          <div style={{
            fontStyle: 'italic',
            padding: '1em',
            display: this.state.loading ? 'block'  : 'none'
          }}>Loading...</div>
          <div style={{
            padding: '1em',
            display: !this.state.loading && this.state.size != listItems.length ? 'block'  : 'none'
          }}><a style={{textDecoration: 'underline'}} onClick={this.getPosts}>Load more</a></div>
        </div>
      </div>
    );
  }
}

export default AllContent;
