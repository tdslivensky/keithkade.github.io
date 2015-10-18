/*global React, ReactDOM, setInterval, document, console, setTimeout, Util */

var doc = document;
var container = document.getElementById('container');
var PAGES = ['TWOROADS', 'CROSSROADS', 'PORTALS', 'FOUNTAIN', 'CHASM', 'MEMEX', 'MONOLITH'];

/* Psuedo-Links */

function renderLink(){
        return (
            <div className="link" onClick={this.handleClick}>
                {this.props.text}
            </div>
        );
}

var ChoiceLink = React.createClass({
    handleClick: function(event) {
        //Ken Burns into the clicked thing
        loadPage(this.props.target);
    },
    render: renderLink
});

var LandmarkLink = React.createClass({
    handleClick: function(event) {
        loadPage(this.props.target);
    },
    render: renderLink
});

/* Perceived Choice Nodes */

var TwoRoadsNode = React.createClass({
    render: function() {
        return (
            <article className="perceived-choice">
                <h1>(Two Roads Node)</h1>
                <div className="left-path choicenav">
                    <div>Left Path</div>
                    <ChoiceLink text="Go" target={this.props.leftRoadTarget}/>
                </div>
                <div className="right-path choicenav">
                    <div>Right Path</div>
                    <ChoiceLink text="Go" target={this.props.rightRoadTarget}/>
                </div>
                <p>
                    Two roads diverge in the wood. Beyond the direction <br/>
                    they lead, there is no discernable difference between the two. 
                </p>
            </article>
        );
    }
});

var CrossRoadsNode = React.createClass({
    render: function() {
        return (
            <article className="perceived-choice">
                <h1>(Crossroads Node)</h1>
                <div className="northwest-path choicenav">    
                    <div>Northwest Path</div>
                    <ChoiceLink text="Go" target={this.props.northwestTarget}/>
                </div>
                <div className="northeast-path choicenav">
                    <div>Northeast Path</div>
                    <ChoiceLink text="Go" target={this.props.northeastTarget}/>                
                </div>
                <div className="east-path choicenav">    
                    <div>East Path</div>
                    <ChoiceLink text="Go" target={this.props.eastTarget}/>
                </div>    
                <p>
                    You approach a crossroads marked by a signpost. There are three options, <br/>
                    a northwest path, a northeast path, and an east path.  
                </p>
            </article>
        );
    }
});

//sends user random place
var PortalsNode = React.createClass({
    render: function() {
        return (
            <article className="perceived-choice">
                <h1>(Portals Node)</h1>
                <div className="left-portal choicenav">    
                    <div>Left Portal</div>
                    <ChoiceLink text="Go" target={this.props.leftTarget}/>
                </div>
                <div className="middle-portal choicenav">
                    <div>Middle Portal</div>
                    <ChoiceLink text="Go" target={this.props.middleTarget}/>                
                </div>
                <div className="right-portal choicenav">    
                    <div>Right Portal</div>
                    <ChoiceLink text="Go" target={this.props.rightTarget}/>
                </div>    
                <p>
                    There are three portals in the forest. They are large enough to walk through, <br/>
                    but it is not clear what lies on the other side.
                </p>
            </article>
        );
    }
});

/* Landmark Nodes */

var FountainNode = React.createClass({
    render: function() {
        return (
            <article className="landmark">
                <h1>(Fountain Node)</h1>
                <p>
                    You see a large urinal in a clearing. The name "R. Mutt" has been written on it. <br/>
                    On the ground you see a plaque with the inscription, "Artist: Marcel Duchamp. Submitted by: unidan"
                </p>
                <div className="flex-container">
                    <LandmarkLink text="Go Back" target={this.props.backTarget}/>
                    <LandmarkLink text="Go Forward" target={this.props.forwardTarget}/>
                </div>
            </article>
        );
    }
});

var ChasmNode = React.createClass({
    render: function() {
        return (
            <article className="landmark">
                <h1>(Chasm Node)</h1>
                <p>
                    A great chasm lies before you. On one side is a sign reading "Information" <br/>
                    On the other is a sign reading "Knowledge"
                </p>
                <div className="flex-container">
                    <LandmarkLink text="Go Left" target={this.props.leftTarget}/>
                    <LandmarkLink text="Go Right" target={this.props.rightTarget}/>
                </div>
            </article>
        );
    }
});

var MemexNode = React.createClass({
    render: function() {
        return (
            <article className="landmark">
                <h1>(Memex Node)</h1>
                <p>
                    You come up to a convoluted machine. It is a mass of wires and buttons with one primary screen <br/>
                    It appears as though the wires are meant to connect pieces of data together. <br/>
                    There is a plaque on the top of the machine that reads "Memex: Write your own adventure"
                </p>
                <div className="flex-container">
                    <LandmarkLink text="Go Left" target={this.props.leftTarget}/>
                    <LandmarkLink text="Go Forward" target={this.props.forwardTarget}/>
                    <LandmarkLink text="Go Right" target={this.props.rightTarget}/>
                </div>
            </article>
        );
    }
});

var MonolithNode = React.createClass({
    render: function() {
        return (
            <article className="landmark">
                <h1>(Monolith Node)</h1>
                <p>
                    A coal black obelisk towers above you. Its exterior is impenetrable and you cannot discern anything about its makeup <br/>
                    You feel as though it is compelling you to move in a certain direction. 
                </p>
                <div className="flex-container">
                    <LandmarkLink text="Go Left" target={this.props.leftTarget}/>
                    <LandmarkLink text="Go Forward" target={this.props.forwardTarget}/>
                    <LandmarkLink text="Go Right" target={this.props.rightTarget}/>
                </div>
            </article>
        );
    }
});

/* Page Transitions */

//there should be a realistic delay
function loadPage(page){
    Util.deleteChildren(container);
    setTimeout(renderPage, 500, page);
}

function renderPage(page){
    switch(page){
        //choices
        case 'TWOROADS':
            ReactDOM.render(
                <TwoRoadsNode leftRoadTarget="FOUNTAIN" rightRoadTarget="FOUNTAIN" />, 
                container
            );
            break;
        case 'CROSSROADS':
            ReactDOM.render(
                <CrossRoadsNode northwestTarget="FOUNTAIN" northeastTarget="CHASM"  eastTarget="MEMEX" />, 
                container
            );
            break;
        case 'PORTALS':
            ReactDOM.render(
                <PortalsNode leftTarget='MONOLITH' middleTarget={Util.getRandomEntry(PAGES)} rightTarget='CHASM' />, 
                container
            );
            break;            
        //landmarks
        case 'FOUNTAIN':
            ReactDOM.render(
                <FountainNode backTarget="TWOROADS" forwardTarget="CROSSROADS" />, 
                container
            );
            break;    
        case 'CHASM':
            ReactDOM.render(
                <ChasmNode leftTarget="PORTALS" rightTarget="MEMEX" />, 
                container
            );
            break;    
        case 'MEMEX':
            ReactDOM.render(
                <MemexNode leftTarget="MONOLITH" forwardTarget="CROSSROADS" rightTarget="TWOROADS" />, 
                container
            );
            break;
        case 'MONOLITH':
            ReactDOM.render(
                <MonolithNode leftTarget="PORTALS" forwardTarget="CROSSROADS" rightTarget="MEMEX" />, 
                container
            );
            break;               
        default:
            ReactDOM.render(
                <PortalsNode leftTarget={Util.getRandomEntry(PAGES)} middleTarget={Util.getRandomEntry(PAGES)} rightTarget={Util.getRandomEntry(PAGES)} />, 
                container
            );
            break;
    }
}

/* Start page */ 

renderPage('TWOROADS');