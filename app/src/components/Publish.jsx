import toMarkdown from '../scripts/toMarkdown.js';

class Publish extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: 'edit',
      channel: '',
      error: ''
    };

    this.preventHeaderUnbold = (e) => {
      var action = e.target.getAttribute('data-action') || e.target.parentNode.getAttribute('data-action');
      if (action == 'bold') {
        var active = document.getElementsByClassName('medium-editor-button-active');
        for (var i = 0; i < active.length; i++) {
          if (/h+/.test(active[i].getAttribute('data-action', ''))) {
            e.stopPropagation();
            e.preventDefault();
            return;
          }
        }
      }
    };

    this.preventFormatHotkey = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.keyCode){
          case 66: //ctrl+B or ctrl+b
          case 98:
          case 73: //ctrl+I or ctrl+i
          case 105:
          case 85: //ctrl+U or ctrl+u
          case 117:
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
      }
    };

    this.editPost = this.editPost.bind(this);
    this.previewPost = this.previewPost.bind(this);
    this.setChannel = this.setChannel.bind(this);
    this.submitPost = this.submitPost.bind(this);
  }

  componentDidMount() {
    var editor = new MediumEditor('#new-post-body', {
      buttonLabels: 'fontawesome',
      keyboardCommands: false,
      toolbar: {
        buttons: ['bold', 'italic', 'h2', 'h3', 'image', 'anchor', 'pre', 'quote'],
      },
      placeholder: {
        text: 'body',
        hideOnClick: true
      }
    });
    // Prevent the user from 'unbolding' text marked with h1, h2, hX...
    document.addEventListener('click', this.preventHeaderUnbold, true);

    // Prevent Bold/Italics/Underline via shortcuts
    document.addEventListener('keydown', this.preventFormatHotkey);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.preventHeaderUnbold);
    document.removeEventListener('keydown', this.preventFormatHotkey);
  }

  editPost() {
    this.setState({
      view: 'edit',
      error: ''
    });
  }

  previewPost() {
    this.setState({
      view: 'preview',
      error: ''
    });
    document.getElementById('new-post-title-preview').innerHTML = document.getElementById('new-post-title').value;
    document.getElementById('new-post-body-preview').innerHTML = marked(toMarkdown(document.getElementById('new-post-body')));
  }

  setChannel(e) {
    this.setState({
      channel: e.target.innerHTML
    });
  }

  submitPost() {
    this.setState({
      view: 'submit'
    });
    var errors = [];
    var title = document.getElementById('new-post-title').value;
    var body = toMarkdown(document.getElementById('new-post-body'));

    var attributes = JSON.stringify({
      version: '1.0',
      title: title
    });
    var doc = JSON.stringify({
      version: '1.0',
      body: body
    });
    publisher.getChannelByName(this.props.channel, (error, channelID) => {
      publisher.getContentByData(this.props.account, channelID, attributes, doc, (error, contentID) => {
        if (channelID == 0) {
          errors.push('Channel must be between 3 and 30 characters and consist of only letters numbers and underscores');
        }
        this.setState({
          error: errors.join('. ')
        });
        if (errors.length == 0) {
          publisher.publish.estimateGas(this.props.channel, attributes, doc, indexer.address, {from: this.props.account, value: 0}, (error, gasEstimate) => {
            console.log(gasEstimate);
            gasEstimate += 100000;
            publisher.publish(this.props.channel, attributes, doc, indexer.address, {from: this.props.account, value: 0, gas: gasEstimate}, (error) => {
              if (error) {
                this.setState({
                  error: error.toString()
                });
              }
              else {
                var watcher = publisher.Publish({contentID: contentID}, {fromBlock: 'latest'});
                watcher.watch((error, post) => {
                  watcher.stopWatching(() => {});
                  if (error) {
                    this.setState({
                      error: error.toString()
                    });
                  }
                  else {
                    window.location.hash = `#/channel/${this.props.channel}/post/0x${post.args.contentID.toString(16)}`;
                  }
                });
              }
            });
          });
        }
      });
    });
  }

  render() {
    return (
      <div style={{width: '100%', margin: '0 auto'}}>
        <div style={{width: '100%', backgroundColor: '#FFF'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{padding: '1.5em 1em', wordWrap: 'break-word'}}>
              <div style={{display: this.state.view == 'edit' ? 'block' : 'none'}}>
                <textarea id='new-post-title' type='text' placeholder='title'></textarea>
                <div id='new-post-body' contentEditable='true' className='post'></div>
              </div>
              <div style={{display: this.state.view != 'edit' ? 'block' : 'none'}}>
                <h1 id='new-post-title-preview'></h1>
                <div id='new-post-body-preview' className='post'></div>
              </div>
            </div>
          </div>
        </div>
        <div style={{width: '100%'}}>
          <div style={{maxWidth: '600px', margin: '0 auto', color: 'black'}}>
            <div className='flex' style={{padding: '1.5em 1em'}}>
              <div className='flex-grow' style={{textAlign: 'left'}}>
                <a style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  display: this.state.view == 'edit' ? 'inline-block' : 'none',
                  borderBottom: '2px solid black',
                  paddingBottom: '.5em'
                }} href={'#/channel/'+this.props.channel}>Cancel</a>
                <a style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  display: this.state.view != 'edit' ? 'inline-block' : 'none',
                  borderBottom: '2px solid black',
                  paddingBottom: '.5em'
                }} onClick={this.editPost}>Edit</a>
              </div>
              <div className='flex-grow' style={{textAlign: 'right'}}>
                <a style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  display: this.state.view == 'edit' ? 'inline-block' : 'none',
                  borderBottom: '2px solid black',
                  paddingBottom: '.5em'
                }} onClick={this.previewPost}>Preview</a>
                <a style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  display: this.state.view != 'edit' ? 'inline-block' : 'none',
                  borderBottom: '2px solid black',
                  paddingBottom: '.5em'
                }} onClick={this.submitPost}>Publish</a>
              </div>
              <div className='backdrop' style={{
                width: '100%',
                height: '100%',
                opacity: 0.5,
                backgroundColor: 'black',
                position: 'fixed',
                zIndex: 1,
                display: this.state.view == 'submit' ? 'block' : 'none',
                top: '0',
                left: '0'
              }}>{' '}</div>
              <div style={{
                display: this.state.view == 'submit' ? 'block' : 'none',
                top: '15%',
                left: '0',
                width: '100%',
                position: 'fixed',
                backgroundColor: 'transparent',
                zIndex: 2
              }}>
                <div style={{maxWidth: '600px', margin: '0 auto', backgroundColor: '#FCFCFC', border: '1px solid #DDD'}}>
                  <div style={{padding: '1em', display: this.state.error.length > 0 ? 'block' : 'none'}}>
                    <h1>Unable to publish</h1>
                    <div style={{padding: '1em 0'}}>{this.state.error}</div>
                    <span onClick={() => this.setState({view: 'edit', error: ''})} style={{
                      borderBottom: '2px solid black',
                      padding: '.5em 0',
                      display: 'inline-block',
                      cursor: 'pointer'
                    }}>Close</span>
                  </div>
                  <div style={{padding: '1em', display: this.state.error.length == 0 ? 'block' : 'none'}}>
                    <h1>Publishing...</h1>
                    <div style={{padding: '1em 0'}}>{
                      'Your post is being published. This page will redirect to your post once published. '+
                      'If you are not redirected after several minutes, try closing this message and publishing again.'
                    }</div>
                    <span onClick={() => this.setState({view: 'publish', error: ''})} style={{
                      borderBottom: '2px solid black',
                      padding: '.5em 0',
                      display: 'inline-block',
                      cursor: 'pointer'
                    }}>Close</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Publish;