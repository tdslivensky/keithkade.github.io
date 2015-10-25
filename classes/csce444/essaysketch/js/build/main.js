/*global React, ReactDOM, setInterval, document, console, setTimeout, Util */

'use strict';

var doc = document;
var container = document.getElementById('container');
var image = document.getElementById('backgroundImg');

var PAGES = ['TWOROADS', 'CROSSROADS', 'PORTALS', 'FOUNTAIN', 'CHASM', 'MEMEX', 'MONOLITH'];

/* Psuedo-Links */

function renderLink() {
    return React.createElement(
        'div',
        { className: 'link', onClick: this.handleClick },
        this.props.text
    );
}

var ChoiceLink = React.createClass({
    displayName: 'ChoiceLink',

    handleClick: function handleClick(event) {
        //Ken Burns into the clicked thing
        loadPage(this.props.target);
    },
    render: renderLink
});

var LandmarkLink = React.createClass({
    displayName: 'LandmarkLink',

    handleClick: function handleClick(event) {
        loadPage(this.props.target);
    },
    render: renderLink
});

/* Perceived Choice Nodes */

var TwoRoadsNode = React.createClass({
    displayName: 'TwoRoadsNode',

    render: function render() {
        return React.createElement(
            'article',
            { className: 'perceived-choice' },
            React.createElement(
                'div',
                { className: 'left-path choicenav' },
                React.createElement(
                    'div',
                    null,
                    'Left Path'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: this.props.leftRoadTarget })
            ),
            React.createElement(
                'div',
                { className: 'right-path choicenav' },
                React.createElement(
                    'div',
                    null,
                    'Right Path'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: this.props.rightRoadTarget })
            ),
            React.createElement(
                'p',
                null,
                'Two roads diverge in the wood. Beyond the direction ',
                React.createElement('br', null),
                'they lead, there is no discernable difference between the two.'
            )
        );
    }
});

var CrossRoadsNode = React.createClass({
    displayName: 'CrossRoadsNode',

    //TODO {this.props.northwestTarget}
    //add image to landmark maybe

    render: function render() {
        return React.createElement(
            'article',
            { className: 'perceived-choice' },
            React.createElement(
                'div',
                { className: 'northwest-path choicenav' },
                React.createElement(
                    'div',
                    null,
                    'Northwest Path'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: this.props.northwestTarget })
            ),
            React.createElement(
                'div',
                { className: 'northeast-path choicenav' },
                React.createElement(
                    'div',
                    null,
                    'Northeast Path'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: this.props.northeastTarget })
            ),
            React.createElement(
                'div',
                { className: 'east-path choicenav' },
                React.createElement(
                    'div',
                    null,
                    'East Path'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: this.props.eastTarget })
            ),
            React.createElement(
                'p',
                null,
                'You approach a crossroads marked by a signpost. There are three options, ',
                React.createElement('br', null),
                'a northwest path, a northeast path, and an east path.'
            )
        );
    }
});

//sends user random place
var PortalsNode = React.createClass({
    displayName: 'PortalsNode',

    render: function render() {
        return React.createElement(
            'article',
            { className: 'perceived-choice' },
            React.createElement(
                'div',
                { className: 'left-portal choicenav' },
                React.createElement(
                    'div',
                    null,
                    'Left Portal'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: this.props.leftTarget })
            ),
            React.createElement(
                'div',
                { className: 'middle-portal choicenav' },
                React.createElement(
                    'div',
                    null,
                    'Middle Portal'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: this.props.middleTarget })
            ),
            React.createElement(
                'div',
                { className: 'right-portal choicenav' },
                React.createElement(
                    'div',
                    null,
                    'Right Portal'
                ),
                React.createElement(ChoiceLink, { text: 'Go', target: this.props.rightTarget })
            ),
            React.createElement(
                'p',
                null,
                'There are three portals in the forest. They are large enough to walk through, ',
                React.createElement('br', null),
                'but it is not clear what lies on the other side.'
            )
        );
    }
});

/* Landmark Nodes */

var FountainNode = React.createClass({
    displayName: 'FountainNode',

    render: function render() {
        return React.createElement(
            'article',
            { className: 'landmark' },
            React.createElement(
                'p',
                null,
                'You see a large urinal in a clearing. The name "R. Mutt" has been written on it. ',
                React.createElement('br', null),
                'On the ground you see a plaque with the inscription, "Artist: Marcel Duchamp. Submitted by: unidan"'
            ),
            React.createElement(
                'div',
                { className: 'flex-container' },
                React.createElement(LandmarkLink, { text: 'Go Back', target: this.props.backTarget }),
                React.createElement(LandmarkLink, { text: 'Go Forward', target: this.props.forwardTarget })
            )
        );
    }
});

var ChasmNode = React.createClass({
    displayName: 'ChasmNode',

    render: function render() {
        return React.createElement(
            'article',
            { className: 'landmark' },
            React.createElement(
                'p',
                null,
                'A great chasm lies before you. On one side is a sign reading "Information" ',
                React.createElement('br', null),
                'On the other is a sign reading "Knowledge"'
            ),
            React.createElement(
                'div',
                { className: 'flex-container' },
                React.createElement(LandmarkLink, { text: 'Go Left', target: this.props.leftTarget }),
                React.createElement(LandmarkLink, { text: 'Go Right', target: this.props.rightTarget })
            )
        );
    }
});

var MemexNode = React.createClass({
    displayName: 'MemexNode',

    render: function render() {
        return React.createElement(
            'article',
            { className: 'landmark' },
            React.createElement(
                'p',
                null,
                'You come up to a convoluted machine. It is a mass of wires and buttons with one primary screen ',
                React.createElement('br', null),
                'It appears as though the wires are meant to connect pieces of data together. ',
                React.createElement('br', null),
                'There is a plaque on the top of the machine that reads "Memex: Write your own adventure"'
            ),
            React.createElement(
                'div',
                { className: 'flex-container' },
                React.createElement(LandmarkLink, { text: 'Go Left', target: this.props.leftTarget }),
                React.createElement(LandmarkLink, { text: 'Go Forward', target: this.props.forwardTarget }),
                React.createElement(LandmarkLink, { text: 'Go Right', target: this.props.rightTarget })
            )
        );
    }
});

var MonolithNode = React.createClass({
    displayName: 'MonolithNode',

    render: function render() {
        return React.createElement(
            'article',
            { className: 'landmark' },
            React.createElement(
                'p',
                null,
                'A coal black obelisk towers above you. Its exterior is impenetrable and you cannot discern anything about its makeup ',
                React.createElement('br', null),
                'You feel as though it is compelling you to move in a certain direction.'
            ),
            React.createElement(
                'div',
                { className: 'flex-container' },
                React.createElement(LandmarkLink, { text: 'Go Left', target: this.props.leftTarget }),
                React.createElement(LandmarkLink, { text: 'Go Forward', target: this.props.forwardTarget }),
                React.createElement(LandmarkLink, { text: 'Go Right', target: this.props.rightTarget })
            )
        );
    }
});

/* Page Transitions */

//there should be a realistic delay
function loadPage(page) {
    Util.deleteChildren(container);
    setTimeout(renderPage, 500, page);
}

function renderPage(page) {
    switch (page) {
        //choices
        case 'TWOROADS':
            ReactDOM.render(React.createElement(TwoRoadsNode, { leftRoadTarget: 'FOUNTAIN', rightRoadTarget: 'FOUNTAIN' }), container);
            image.src = "img/tworoads-crop.jpg";
            break;
        case 'CROSSROADS':
            ReactDOM.render(React.createElement(CrossRoadsNode, { northwestTarget: 'FOUNTAIN', northeastTarget: 'CHASM', eastTarget: 'MEMEX' }), container);
            image.src = "img/crossroads-crop.jpg";
            break;
        case 'PORTALS':
            ReactDOM.render(React.createElement(PortalsNode, { leftTarget: 'MONOLITH', middleTarget: Util.getRandomEntry(PAGES), rightTarget: 'CHASM' }), container);
            break;
        //landmarks
        case 'FOUNTAIN':
            ReactDOM.render(React.createElement(FountainNode, { backTarget: 'TWOROADS', forwardTarget: 'CROSSROADS' }), container);
            image.src = "img/fountain-crop.jpg";
            break;
        case 'CHASM':
            ReactDOM.render(React.createElement(ChasmNode, { leftTarget: 'PORTALS', rightTarget: 'MEMEX' }), container);
            image.src = "img/chasm-crop.jpg";
            break;
        case 'MEMEX':
            ReactDOM.render(React.createElement(MemexNode, { leftTarget: 'MONOLITH', forwardTarget: 'CROSSROADS', rightTarget: 'TWOROADS' }), container);
            break;
        case 'MONOLITH':
            ReactDOM.render(React.createElement(MonolithNode, { leftTarget: 'PORTALS', forwardTarget: 'CROSSROADS', rightTarget: 'MEMEX' }), container);
            break;
        default:
            ReactDOM.render(React.createElement(PortalsNode, { leftTarget: Util.getRandomEntry(PAGES), middleTarget: Util.getRandomEntry(PAGES), rightTarget: Util.getRandomEntry(PAGES) }), container);
            break;
    }
}

/* Start page */

renderPage('TWOROADS');