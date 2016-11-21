import React from 'react';
import { HashRouter, Match, Link, Miss, Redirect } from 'react-router';

import Account from './Account.jsx';
import Content from './Content.jsx';
import Filter from './Filter.jsx';
import Navigation from './Navigation.jsx';
import Publish from './Publish.jsx';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      account: '',
      contentID: null
    };

  }

  componentDidMount() {

  }

  render() {
    return (
      <HashRouter>
        <div style={{position: 'relative', minHeight: '100%'}}>
          <Navigation />
          <div style={{height: '3em'}}>&nbsp;</div>
          <Match pattern='/content/:id' component={Content}/>
          <Match pattern='/filter/:type/:value' component={Filter}/>
          <Match pattern='/publish' component={Publish}/>
          <Match pattern='/account' component={Account}/>
          <Miss render={() => <Redirect to='/filter/all/new' />} />
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
              <a href='https://facebook.com/Credsign'>Contact</a>
              <span>{' · '}</span>
              <a href='https://github.com/credsign/credsign.github.io'>Source</a>
              <span>{' · '}</span>
              <a href='https://github.com/credsign/credsign.github.io/blob/master/LICENSE'>Terms</a>
            </div>
          </div>
        </div>
      </HashRouter>
    );
  }
}

export default App;
