import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {MainWindow} from "./components/MainWindow.jsx";
import 'bootstrap/dist/css/bootstrap.min.css';

function render() {
    ReactDOM.render(<MainWindow />, document.getElementById('root'));
}

render();