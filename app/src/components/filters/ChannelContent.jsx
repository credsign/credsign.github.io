import React from 'react';
import humanizeDuration from 'humanize-duration';
import Filter from './Filter.jsx';
import { getContentTitle, getChannelName } from '../../scripts/formatting.js';

class ChannelContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      size: 0
    };

    this.getPosts = this.getPosts.bind(this);
  }

  componentDidMount() {
    this.getPosts(this.props.params.channel);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.params.channel != this.props.params.channel) {
      this.getPosts(nextProps.params.channel);
    }
  }

  getPosts(channel) {
    this.setState({
      loading: true,
      listItems: [],
      size: 0
    });
    var listItems = [];

    window.content.toChannelID(channel, (error, channelID) => {
      window.channelseries.getSize(channelID, (error, size) => {
        size = size.toNumber();
        var indices = [...Array(size)].map((_, i) => i + 1);

        window.channelseries.Series({ channelID: channelID, seriesNum: indices}, {fromBlock: 0, toBlock: 'latest'}).get((error, series) => {
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
    var channel = `#${this.props.params.channel}`;
    return (
      <div>
        <Filter type='channel' value={this.props.params.channel} />
        <div className='feed'>
          <div style={{padding: '1em'}}>
            <div style={{fontStyle: 'italic'}}>
              <div style={{display: this.state.loading ? 'block'  : 'none'}}>{`Loading posts in ${channel}...`}</div>
              <div style={{display: !this.state.loading && this.state.size == 0 ? 'block'  : 'none'}}>{`No posts in ${channel}`}</div>
            </div>
            <div style={{display: this.state.size != 0 ? 'block'  : 'none'}}>{`Posts in ${channel} (${this.state.size})`}</div>
          </div>
          <ol style={{marginBottom: '1em'}}>{listItems}</ol>
        </div>
      </div>
    );
  }
}

export default ChannelContent;
