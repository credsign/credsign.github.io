import {getContentTitle, getChannelName} from '../scripts/formatting.js';

class Account extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      size: 0
    };

    this.getPosts = this.getPosts.bind(this);
  }

  componentDidMount() {
    this.getPosts(this.props.account);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.account != window.location.hash.split('/').slice(-1)) {
      this.setState({
        loading: true,
        listItems: [],
        size: 0
      });
    }
    else {
      this.getPosts(nextProps.account);
    }
  }

  getPosts(account) {
    this.setState({
      loading: true,
      listItems: [],
      size: 0
    });
    var listItems = [];
    publisher.Publish({accountID: account}, {fromBlock: 0, toBlock: 'latest'}).get((error, posts) => {
      posts.forEach((post) => {
        listItems.push({
          id: '0x' + post.args.contentID.toString(16),
          title: getContentTitle(post.args.attributes),
          publisher: post.args.accountID,
          channelName: getChannelName(post.args.channelID),
          timestamp: post.args.timestamp.toNumber() * 1000
        });
      });
      this.setState({
        listItems: listItems.reverse(),
        size: listItems.length,
        loading: false
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
          <a href={`#/channel/${listItem.channelName}/post/${listItem.id}`}>
            <div>{listItem.title}</div>
            <span>{`${humanizeDuration(age)} ago`}</span>
            <span>{` by ${listItem.publisher.substr(0,5)}...${listItem.publisher.substr(-3)}`}</span>
            <span>{` in #${listItem.channelName}`}</span>
          </a>
        </li>
      );
    });
    var byAccount = this.props.account.length != 0 ? ' by account' : '';
    return (
      <div className='view-align'>
        <div style={{paddingLeft: '1em', paddingBottom: '1em'}}>
          <div style={{fontStyle: 'italic', display: this.state.loading ? 'block'  : 'none'}}>Loading...</div>
          <div style={{display: !this.state.loading && this.state.size == 0 ? 'block'  : 'none'}}>No posts found</div>
          <div style={{display: this.state.size != 0 ? 'block'  : 'none'}}>{`Newest posts${byAccount} (${this.state.size})`}</div>
        </div>
        <ol>{listItems}</ol>
      </div>
    );
  }
}

export default Account;
