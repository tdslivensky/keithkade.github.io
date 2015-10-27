/*global React, ReactDOM, setInterval, document, console, setTimeout, Util, window */

var doc = document;
var container = document.getElementById('container');
var image = document.getElementById('background-img');
var preview = document.getElementById('link-preview');

var PAGES = ['tworoads', 'crossroads', 'portals', 'fountain', 'chasm', 'memex', 'monolith'];

/* Psuedo-Links */

function renderLink(){
        return (
            <div className="link" onClick={this.handleClick} onMouseOver={this.handleMouseOver} onMouseOut={this.handleMouseOut}>
                {this.props.text}
            </div>
        );
}

function showLinkPreview(){
    preview.style.display = "block";
    preview.innerHTML = 'kadekeith.me/classes/csce444/essaysketch/' + this.props.target;
}

function hideLinkPreview(){
    preview.style.display = "none";
}

var ChoiceLink = React.createClass({
    handleClick: function(event) {
        var xDelt = window.innerWidth/2 - event.clientX;
        var yDelt = 310 - event.clientY;    
        image.style.transition = '1s ease';
        image.style.transform = 'scale(1.3, 1.3) translate(' + xDelt/4 + 'px,' + yDelt/4 + 'px)';
        setTimeout(loadPage, 1000, this.props.target, 600);
        hideLinkPreview();
    },
    handleMouseOver: showLinkPreview,
    handleMouseOut: hideLinkPreview,    
    render: renderLink
});

var LandmarkLink = React.createClass({
    handleClick: function(event) {
        loadPage(this.props.target, 600);
        hideLinkPreview();
    },
    handleMouseOver: showLinkPreview,
    handleMouseOut: hideLinkPreview,    
    render: renderLink
});

/* Perceived Choice Nodes */

var TwoRoadsNode = React.createClass({
    render: function() {
        return (
            <article className="perceived-choice">
                <div className="left-path choicenav">
                    <div className="path-lbl">Left Path</div>
                    <ChoiceLink text="Go" target={this.props.leftRoadTarget}/>
                </div>
                <div className="right-path choicenav">
                    <div className="path-lbl">Right Path</div>
                    <ChoiceLink text="Go" target={this.props.rightRoadTarget}/>
                </div>
                <p className="main-text">
                    Two roads diverge in the wood. Beyond the direction <br/>
                    they lead, there is no discernable difference between the two. 
                </p>
            </article>
        );
    }
});

var CrossRoadsNode = React.createClass({

//TODO {this.props.northwestTarget}
//add image to landmark maybe

    render: function() {
        return (
            <article className="perceived-choice">
                <div className="northwest-path choicenav">    
                    <div className="path-lbl">Northwest Path</div>
                    <ChoiceLink text="Go" target={this.props.northwestTarget}/>
                </div>
                <div className="northeast-path choicenav">
                    <div className="path-lbl">Northeast Path</div>
                    <ChoiceLink text="Go" target={this.props.northeastTarget}/>                
                </div>
                <div className="east-path choicenav">    
                    <div className="path-lbl">East Path</div>
                    <ChoiceLink text="Go" target={this.props.eastTarget}/>
                </div>    
                <p className="main-text">
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
                <div className="left-portal choicenav">    
                    <div className="path-lbl">Left Portal</div>
                    <ChoiceLink text="Go" target={this.props.leftTarget}/>
                </div>
                <div className="middle-portal choicenav">
                    <div className="path-lbl">Middle Portal</div>
                    <ChoiceLink text="Go" target={this.props.middleTarget}/>                
                </div>
                <div className="right-portal choicenav">    
                    <div className="path-lbl">Right Portal</div>
                    <ChoiceLink text="Go" target={this.props.rightTarget}/>
                </div>    
                <p className="main-text">
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
                <p className="main-text">
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
                <p className="main-text">
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
                <p className="main-text">
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
                <p className="main-text">
                    A coal black obelisk towers above you. <br/>
                    Its exterior is impenetrable and you cannot discern anything about its makeup. <br/>
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
function loadPage(page, delay){
    Util.deleteChildren(container);
    setTimeout(renderPage, delay, page);
}

/** choices */
function renderPage(page){
    image.style.transition = "";
    image.style.transform = "";
    switch(page){  
        case 'tworoads':
            image.src = "img/tworoads-crop.jpg";
            ReactDOM.render(
                <TwoRoadsNode leftRoadTarget="fountain" rightRoadTarget="fountain" />, 
                container
            );
            break;
        case 'crossroads':
            image.src = "img/crossroads-crop.jpg";
            ReactDOM.render(
                <CrossRoadsNode northwestTarget="fountain" northeastTarget="chasm"  eastTarget="memex" />, 
                container
            );
            break;
        case 'portals':
            image.src = "img/chasm-crop.jpg";
            ReactDOM.render(
                <PortalsNode leftTarget='monolith' middleTarget={Util.getRandomEntry(PAGES)} rightTarget='chasm' />, 
                container
            );
            break;            
        //landmarks
        case 'fountain':
            image.src = "img/fountain-crop.jpg";
            ReactDOM.render(
                <FountainNode backTarget="tworoads" forwardTarget="crossroads" />, 
                container
            );
            break;    
        case 'chasm':
            image.src = "img/chasm-crop.jpg";        
            ReactDOM.render(
                <ChasmNode leftTarget="portals" rightTarget="memex" />, 
                container
            );
            break;    
        case 'memex':
            image.src = "img/chasm-crop.jpg";        
            ReactDOM.render(
                <MemexNode leftTarget="monolith" forwardTarget="crossroads" rightTarget="tworoads" />, 
                container
            );
            break;
        case 'monolith':
            image.src = "img/chasm-crop.jpg";        
            ReactDOM.render(
                <MonolithNode leftTarget="portals" forwardTarget="crossroads" rightTarget="memex" />, 
                container
            );
            break;               
        default:
            image.src = "img/chasm-crop.jpg";        
            ReactDOM.render(
                <PortalsNode leftTarget={Util.getRandomEntry(PAGES)} middleTarget={Util.getRandomEntry(PAGES)} rightTarget={Util.getRandomEntry(PAGES)} />, 
                container
            );
            break;
    }
}

/* Start page */ 

renderPage('tworoads');