import Account from './Account.jsx';
import Content from './Content.jsx';
import ContentFeed from './ContentFeed.jsx';
import Publish from './Publish.jsx';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      levelOne: '',
      levelTwo: '',
      levelThree: '',
      levelFour: '',
      account: '',
      contentID: null
    };


    this.route = this.route.bind(this);
    this.setFilter = this.setFilter.bind(this);

    window.addEventListener('hashchange', () => this.route(window.location.hash));
  }

  componentDidMount() {
    this.route(window.location.hash);
    web3.eth.getAccounts((error, accounts) => {
      if (!window.infura && accounts && accounts.length > 0) {
        var address = accounts[0];
        this.setState({
          account: address
        });
      }
      else {
        this.setState({
          warn: true
        });
      }
    });
  }

  setFilter(e) {
    var filter = e.target.value;
    if (this.state.timeout > 0) {
      clearTimeout(this.state.timeout);
    }
    this.setState({
      levelTwo: filter,
      timeout: setTimeout(() => {
        window.location.hash = `#/${this.state.levelOne}/${filter}`;
      }, 500)
    });
  }

  route(href) {
    var path = href.split('/');
    path[1] = path.length > 1 ? path[1] : 'channel';
    path[2] = path.length > 2 ? path[2] : '';
    path[3] = path.length > 3 ? path[3] : '';
    path[4] = path.length > 4 ? path[4] : '';
    this.setState({
      levelOne: path[1],
      levelTwo: path[2],
      levelThree: path[3],
      levelFour: path[4]
    });
  }

  render() {

    var view = '';
    var showNav = true;
    if (this.state.levelOne == 'channel') {
      if (this.state.levelThree == 'post') {
        view = <Content id={this.state.levelFour} channel={this.state.levelTwo} account={this.state.account} />;
        showNav = false;
      }
      else {
        view = <ContentFeed channel={this.state.levelTwo} account={this.state.account} />;
      }
    }
    else if (this.state.levelOne == 'publish'){
      view = <Publish channel={this.state.levelTwo} account={this.state.account} />
    }
    else if (this.state.levelOne == 'account') {
      view = <Account account={this.state.levelTwo} />;
    }

    var filter;
    if (this.state.levelOne == 'account') {
      filter = `#/channel/`;
    }
    else if (this.state.levelOne == 'publish') {
      filter = `#/publish/${this.state.levelTwo}`;
    }
    else {
      filter = `#/account/${this.state.account}`;
    }
    return (
      <div style={{position: 'relative', minHeight: '100%'}}>
        <div style={{
          position: 'fixed',
          width: '100%',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #DDD',
          color: 'black',
          height: '3em',
          top: 0,
          fontWeight: 'bold',
          textAlign: 'center',
          zIndex: 10
        }}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <a href='/' alt='¢'><img src='/app/logo.svg' style={{width: '1.5em', height: '1.5em', margin: '0 auto', padding: '.75em'}} /></a>
          </div>
        </div>
        <div style={{height: '3em'}}>&nbsp;</div>
        <div style={{maxWidth: '600px', margin: '0 auto', padding: '1em 0', display: showNav ? 'block' : 'none'}}>
          <div className='flex'>
            <a className='flex-shrink' href={filter} style={{
              color: this.state.levelOne == 'publish' ? 'gray' : 'purple',
              padding: '.5em 0',
              paddingLeft: '1em',
              border: '1px solid #DDD',
              borderRight: '0',
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: 'white'
            }}>
              <i style={{paddingTop: '.05em'}} className={this.state.levelOne == 'account' ? 'fa fa-user' : 'fa fa-hashtag'}></i>
            </a>
            <input type='text' placeholder={this.state.levelOne == 'account' ? '0x321...' : 'channel'} id='channel' className='flex-grow' style={{
              backgroundColor: 'transparent',
              fontSize: '1em',
              padding: '.5em',
              margin: 0,
              border: '1px solid #DDD',
              borderRadius: 0,
              boxShadow: 'none',
              borderLeft: 0,
              backgroundColor: 'white',
              outline: 0,
              color: 'black'
            }} value={this.state.levelTwo} onChange={this.setFilter}></input>
            <a className='flex-shrink' style={{
              color: 'white',
              backgroundColor: 'purple',
              display: (this.state.levelOne == 'publish' || this.state.account == '') ? 'none' : 'block',
              padding: '.5em 0',
              marginLeft: '1em',
              borderTop: '1px solid purple',
              borderBottom: '1px solid purple',
              width: '3em',
              textAlign: 'center'
            }} href={`#/publish/${this.state.levelOne == 'channel' ? this.state.levelTwo : ''}`}>
              <i className='fa fa-pencil'></i>
            </a>
          </div>
        </div>
        <div style={{display: this.state.warn ? 'block': 'none'}}>
          <div className='backdrop' style={{
            width: '100%',
            height: '100%',
            opacity: 0.5,
            backgroundColor: 'black',
            position: 'fixed',
            zIndex: 1,
            top: '0',
            left: '0'
          }}>{' '}</div>
          <div style={{
            top: '15%',
            left: '0',
            margin: '0 auto',
            width: '100%',
            zIndex: 2,
            position: 'fixed',
            backgroundColor: 'transparent'
          }}>
            <div style={{maxWidth: '600px', margin: '0 auto', backgroundColor: '#FCFCFC', border: '1px solid #DDD'}}>
              <div style={{padding: '1em'}}>
                <h1>Please link an account</h1>
                <div style={{padding: '1em 0'}}>{
                  'Credsign was unable to detect your Ethereum account. '+
                  'If you do not have an account, please install Mist or '+
                  'MetaMask and create one. If you do, please ensure you '+
                  'are configured to use the test network. You will need '+
                  'an account to publish content.'
                }</div>
                <span onClick={() => this.setState({warn: false})} style={{
                  borderBottom: '2px solid black',
                  padding: '.5em 0',
                  display: 'inline-block',
                  cursor: 'pointer'
                }}>Close</span>
              </div>
            </div>
          </div>
        </div>
        <div>{view}</div>
        <div style={{height: '3em'}}>&nbsp;</div>
        <div style={{
          width: '100%',
          position: 'absolute',
          backgroundColor: '#fafafa',
          borderTop: '1px solid #DDD',
          color: 'dimgray',
          bottom: 0,
          height: '1em',
          padding: '1em 0',
          zIndex: 10
        }}>
          <div style={{
            fontSize: '69%',
            textTransform: 'uppercase',
            textAlign: 'center'
          }}>
            <span className='collapsable'>{'Message us on '}</span>
            <a href={'https://facebook.com/Credsign'} style={{
              display: 'inline-block',
              color: 'inherit'
            }}>Facebook</a>
            <span>{' · '}</span>
            <span className='collapsable'>{'View source on '}</span>
            <a href={'https://github.com/credsign/credsign.github.io'} style={{
              display: 'inline-block',
              color: 'inherit'
            }}>Github</a>
            <span>{' · '}</span>
            <span className='collapsable'>{'Usage governed by '}</span>
            <a
              href='https://github.com/credsign/credsign.github.io/blob/master/LICENSE'
              style={{
                color: 'inherit',
                display: 'inline-block'
              }}>terms</a>
          </div>
        </div>
      </div>
    );
  }
}

export default App;