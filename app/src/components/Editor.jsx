import React from 'react';
import MediumEditor from 'medium-editor';

class Editor extends React.Component {
  constructor(props) {
    super(props);

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

    this.onEdit = this.onEdit.bind(this);
  }

  onEdit() {
    // this.props.onPostEdit(document.getElementById('new-post-body').innerHTML);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.resetCounter > this.props.resetCounter) {
      this.state.editor.setContent('');
    }
  }

  componentDidMount() {
    var editor = new MediumEditor('#new-post-body', {
      buttonLabels: 'fontawesome',
      keyboardCommands: false,
      toolbar: {
        buttons: ['bold', 'italic', 'h2', 'h3', 'anchor', 'quote'],
      },
      placeholder: {
        text: this.props.placeholder,
        hideOnClick: true
      }
    });

    this.setState({
      editor: editor
    });

    // Prevent the user from 'unbolding' text marked with h1, h2, hX...
    document.addEventListener('click', this.preventHeaderUnbold, true);

    // Prevent Bold/Italics/Underline via shortcuts
    document.addEventListener('keydown', this.preventFormatHotkey);
  }

  componentWillUnmount() {
    this.state.editor.destroy();
    document.removeEventListener('click', this.preventHeaderUnbold);
    document.removeEventListener('keydown', this.preventFormatHotkey);
  }


  render() {
    return (
      <div id='new-post-body' contentEditable='true' className='post' onKeyUp={this.onEdit}></div>
    );
  }
}

export default Editor;
