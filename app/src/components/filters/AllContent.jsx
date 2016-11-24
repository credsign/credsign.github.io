import React from 'react';
import humanizeDuration from 'humanize-duration';
import Filter from './Filter.jsx';
import { getContentTitle, getChannelName } from '../../scripts/formatting.js';

class AllContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      size: 0
    };
    this.getPosts = this.getPosts.bind(this);
  }

  componentDidMount() {
    this.getPosts();
  }

  componentWillReceiveProps(nextProps) {
  }

  getPosts() {
    this.setState({
      loading: true,
      listItems: [],
      size: 0
    });
    var listItems = [];
    window.contentseries.getSize((error, size) => {
      size = size.toNumber();
      var indices = [...Array(size)].map((_, i) => i);

      window.contentseries.Series({seriesNum: indices}, {fromBlock: 0, toBlock: 'latest'}).get((error, series) => {
        var contentIDs = series.map((entry) => entry.args.contentID);

        window.content.Publish({contentID: contentIDs}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
          posts.forEach((post) => {
            listItems.push({
              id: '0x' + post.args.contentID.toString(16),
              title: getContentTitle(post.args.header),
              publisher: post.args.publisher,
              channelName: getChannelName(post.args.channelID),
              timestamp: post.args.timestamp.toNumber() * 1000
            });
          });
          this.setState({
            listItems: listItems.reverse(),
            size: size,
            loading: false
          });
        });
      });
    });
  }

  render() {
    var now = new Date().getTime();
    var listItems = this.state.listItems.map((listItem) => {
      var age = now - listItem.timestamp;
      if (age > 3600000) {
        age -= (age % 3600000);
      }
      if (age > 60000) {
        age -= age % 60000;
      }
      if (age > 1000) {
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
          <div style={{padding: '1em'}}>
            <div style={{fontStyle: 'italic'}}>
              <div style={{display: this.state.loading ? 'block'  : 'none'}}>Loading...</div>
              <div style={{display: !this.state.loading && this.state.size == 0 ? 'block'  : 'none'}}>No posts found</div>
            </div>
            <div style={{display: this.state.size != 0 ? 'block'  : 'none'}}>{`Latest posts (${this.state.size})`}</div>
          </div>
          <ol>{listItems}</ol>
        </div>
      </div>
    );
  }
}

export default AllContent;
