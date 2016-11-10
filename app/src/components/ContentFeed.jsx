import {getContentTitle, getChannelName} from '../scripts/formatting.js';

class ContentFeed extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      size: 0
    };
    this.getPosts = this.getPosts.bind(this);
  }

  componentDidMount() {
    this.getPosts(this.props.channel);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.channel != window.location.hash.split('/').slice(-1)) {
      this.setState({
        loading: true,
        listItems: [],
        size: 0
      });
    }
    else {
      this.getPosts(nextProps.channel);
    }
  }

  getPosts(channel) {
    this.setState({
      loading: true,
      listItems: [],
      size: 0
    });
    if (channel == '') {
      publisher.getOverallSize((error, overallSize) => {
        overallSize = overallSize.toNumber();
        if (overallSize == 0) {
          this.setState({
            loading: false
          });
        }
        else {
          var indices = Array.from(Array(overallSize)).map((_, i) => i);
          publisher.Sequence({overallIndex: indices}, {fromBlock: 0, toBlock: 'latest'}).get((error, sequence) => {
            var ids = sequence.map((post) => post.args.contentID);
            var listItems = [];
            publisher.Publish({contentID: ids}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
              for (var i = 0; i < posts.length; i++) {
                listItems.push({
                  id: '0x' + ids[i].toString(16),
                  title: getContentTitle(posts[i].args.attributes),
                  publisher: posts[i].args.accountID,
                  channelName: getChannelName(posts[i].args.channelID),
                  timestamp: posts[i].args.timestamp.toNumber() * 1000
                });
              }
              this.setState({
                loading: false,
                listItems: listItems.reverse(),
                size: overallSize
              });
            });
          });
        }
      });
    }
    else {
      publisher.getChannelByName(channel, (error, channelID) => {
        publisher.getChannelSize(channelID, (error, channelSize) => {
          channelSize = channelSize.toNumber();
          if (channelID == 0 || channelSize == 0) {
            this.setState({
              loading: false,
              listItems: [],
              size: 0
            });
          }
          else {
            var channelName = getChannelName(channelID);
            var indices = Array.from(Array(channelSize)).map((_, i) => i);
            publisher.Sequence({channelID: channelID, channelIndex: indices}, {fromBlock: 0, toBlock: 'latest'}).get((error, sequence) => {
              var ids = sequence.map((post) => post.args.contentID);
              var listItems = [];
              publisher.Publish({contentID: ids}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
                for (var i = 0; i < posts.length; i++) {
                  listItems.push({
                    id: '0x' + ids[i].toString(16),
                    title: getContentTitle(posts[i].args.attributes),
                    publisher: posts[i].args.accountID,
                    channelName: channelName,
                    timestamp: posts[i].args.timestamp.toNumber() * 1000
                  });
                }
                this.setState({
                  loading: false,
                  listItems: listItems.reverse(),
                  size: channelSize
                });
              });
            });
          }
        });
      });
    }
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
          <a href={`#/channel/${listItem.channelName}/post/${listItem.id}`}>
            <div>{listItem.title}</div>
            <span>{`${humanizeDuration(age)} ago`}</span>
            <span>{` by ${listItem.publisher.substr(0,5)}...${listItem.publisher.substr(-3)}`}</span>
            <span>{` in #${listItem.channelName}`}</span>
          </a>
        </li>
      );
    });
    var inChannel = this.props.channel.length != 0 ? ' in channel' : '';
    return (
      <div className='view-align'>
        <div style={{paddingLeft: '1em', paddingBottom: '1em'}}>
          <div style={{fontStyle: 'italic', display: this.state.loading ? 'block'  : 'none'}}>Loading...</div>
          <div style={{display: !this.state.loading && this.state.size == 0 ? 'block'  : 'none'}}>No posts found</div>
          <div style={{display: this.state.size != 0 ? 'block'  : 'none'}}>{`Newest posts${inChannel} (${this.state.size})`}</div>
        </div>
        <ol>{listItems}</ol>
      </div>
    );
  }
}

export default ContentFeed;
