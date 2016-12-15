import React from 'react';
import humanizeDuration from 'humanize-duration';
import Filter from './Filter.jsx';
import { getContentTitle, getChannelName } from '../../scripts/formatting.js';

class AddressContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      size: 0
    };

    this.getPosts = this.getPosts.bind(this);
  }

  componentDidMount() {
    this.getPosts(this.props.params.address);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.params.address != this.props.params.address) {
      this.getPosts(nextProps.params.address);
    }
  }

  getPosts(address) {
    this.setState({
      loading: true,
      listItems: [],
      size: 0
    });
    var listItems = [];

    window.addressseries.getSize(address, (error, size) => {
      size = size.toNumber();
      var indices = [...Array(size)].map((_, i) => i + 1);

      window.addressseries.Series({publisher: address, seriesNum: indices}, {fromBlock: 0, toBlock: 'latest'}).get((error, series) => {
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
    var address = `${this.props.params.address.substr(0,5)}...${this.props.params.address.substr(-3)}`;
    return (
      <div>
        <Filter type='address' value={this.props.params.address} />
        <div className='feed'>
          <div style={{padding: '1em'}}>
            <div style={{fontStyle: 'italic'}}>
              <div style={{display: this.state.loading ? 'block'  : 'none'}}>{`Loading posts by ${address}`}</div>
              <div style={{display: !this.state.loading && this.state.size == 0 ? 'block'  : 'none'}}>{`No posts found by ${address}`}</div>
            </div>
            <div style={{display: this.state.size != 0 ? 'block'  : 'none'}}>{`Posts by ${address} (${this.state.size})`}</div>
          </div>
          <ol style={{marginBottom: '1em'}}>{listItems}</ol>
        </div>
      </div>
    );
  }
}

export default AddressContent;
