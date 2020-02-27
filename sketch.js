var black = 0;
var grey = 217;
var white = 255;

var dimension;
var weight = 0.003;
var bigRadius = 0.35;
var littleRadius = 0.0905;

var velocity = [];
for(let n = 0; n < 7; n++) {
  velocity.push(0);
}

var number = [];
for(let n = 0; n < 75; n++) {
  number.push(0);
}

var notesOn = [];
for(let n = 0; n < 7; n++) {
  notesOn.push([]);
}

var notes = [];
var millisecond = 0;
var notePressed = -1;

var midiButton;
var midi = 0;
var midiRadius = 0.25*littleRadius;

var midiInput, midiOutput;

var launchpad;

var noteOnStatus     = 144;
var noteOffStatus    = 128;
var aftertouchStatus = 160;

let t1 = 0.001;
let l1 = 1; // velocity
let t2 = 0.1;
let l2 = 0.5; // aftertouch
let t3 = 0.3;
let l3 = 0;

var fonDeg = 0;
//var fonNum = 130;
var nextNote = false;

var dragX, dragY, dragDist;
var dragLimit = 0.1;

var progression = 0;

var fileInput;

//var standardFile;

var chordCursor = 0;

var scaleByFunction = [["augmented ionian",
                        "augmented lydian"],
                       ["harmonic major",
                        "ionian",
                        "lydian",
                        "lydian #9"],
                       ["altered",
                        "mixolydian b9 b13",
                        "mixolydian b13",
                        "mixolydian",
                        "lydian dominant"],
                       ["dorian #11",
                        "dorian",
                        "dorian b9",
                        "phrygian",
                        "aeolian",
                        "harmonic minor",
                        "melodic minor"],
                       ["altered",
                        "half diminished",
                        "locrian",
                        "locrian #13"],
                       ["diatonic diminished"]];

function deg(d)
{
	return ((d-1) % 7 + 7) % 7 + 1;
}

function ndt(n)
{
	return (n % 12 + 12) % 12;
}

function alt(a)
{
  return ((a+5) % 12 + 12) % 12 - 5;
}

function degToNdt(d) {
  switch(deg(d)) {
    default:
    case 1: return 0;
    case 2: return 2;
    case 3:	return 4;
    case 4: return 5;
    case 5: return 7;
    case 6: return 9;
		case 7: return 11;
  }
}

function ndtToDeg(n) {
  switch(ndt(n)){
    case 0: return 1;
    case 2: return 2;
    case 4: return 3;
    case 5: return 4;
    case 7: return 5;
    case 9: return 6;
    case 11:return 7;
    default: return false;
  }
}

function degToColor(d,light=false) {
  if(light) {
    switch(d) {
      case 1:  return 41;
      case 3:  return 25;
      case 5:  return 60;
      case 7:  return 13;
      default: return 0;//70;
    }
  }
  switch(d) {
    case 1:  return [109,158,235];
    case 3:  return [146,196,125];
    case 5:  return [224,102,101];
    case 7:  return [254,217,102];
    default: return [217,217,217];
  }
}

class Note {
  constructor(d,a=0) {
    this.d = deg(d);
    this.n = ndt(degToNdt(d)+a);
  }

  alt() {
    return alt(this.n-degToNdt(this.d));
  }

  alter(a) {
    this.n = ndt(this.n+a);
  }

  enharm(up) {
    if(up) {
      this.d = deg(this.d+1);
    }
    else {
      this.d = deg(this.d-1);
    }
  }

  altInt(note) {
    let d = deg(note.d-this.d+1);
    let n = ndt(note.n-this.n);
    return n-degToNdt(d);
  }

  newNote(d,a) {
    var nD = deg(this.d+d-1);
    let n = ndt(degToNdt(d)+degToNdt(this.d)+this.alt())+a;
    return new Note(nD,alt(n-degToNdt(nD)));
  }

  name() {
    var s;
    switch(this.d) {
      case 1:
        s = "C";
        break;
      case 2:
        s = "D";
        break;
      case 3:
        s = "E";
        break;
      case 4:
        s = "F";
      	break;
      case 5:
        s = "G";
        break;
      case 6:
        s = "A";
        break;
      case 7:
        s = "B";
        break;
      default:
        s = "X";
    }

    switch(this.alt()) {
      case -2:
        return concat(s, "bb");
      case -1:
        return concat(s, "b");
      case 0:
        return s;
      case 1:
        return concat(s,  "#");
      case 2:
        return concat(s,"##");
      default:
        return concat(s, "?");
    }

    return s;
  }
}

class Chord {
  constructor(str) {
    this.name = str;
    var d;
    switch(str.slice(0,1)) {
      case 'C' : d = 1; break;
      case 'D' : d = 2; break;
      case 'E' : d = 3; break;
      case 'F' : d = 4; break;
      case 'G' : d = 5; break;
      case 'A' : d = 6; break;
      case 'B' : d = 7; break;
      default  : d = 1;
    }
    var a;
  	var isAlt = false;
    switch(str.slice(1,2)) {
      case 'b' : a = -1; break;
      case '#' : a = 1;  break;
      default  : a = 0;
    }
    this.notes = [];
    this.notes.push(new Note(d,a));
    switch(str.slice(a!=0?2:1)) {
      default     :
      case ''     : this.newNote(3);
        						this.newNote(5);
                    this.setScale('ionian');
        						break;
      case '6'    : this.newNote(3);
        						this.newNote(5);
        						this.newNote(6);
                    this.setScale('ionian');
        						break;
      case '69'   : this.newNote(3);
        						this.newNote(5);
        						this.newNote(6);
        						this.newNote(9);
                    this.setScale('ionian');
        						break;
      case 'maj7' : this.newNote(3);
        						this.newNote(5);
        						this.newNote(7);
                    this.setScale('ionian');
        						break;
      case 'maj9' : this.newNote(3);
        						this.newNote(5);
        						this.newNote(7);
        						this.newNote(9);
                    this.setScale('ionian');
        						break;
      case '7'    : this.newNote(3);
        						this.newNote(5);
        						this.newNote(7,-1);
                    this.setScale('mixolydian');
        						break;
      case '9'    : this.newNote(3);
        						this.newNote(5);
        						this.newNote(7,-1);
        						this.newNote(9);
                    this.setScale('mixolydian');
        						break;
      case '7b9'  : this.newNote(3);
        						this.newNote(5);
        						this.newNote(7,-1);
        						this.newNote(9,-1);
                    this.setScale('mixolydian b9 b13');
        						break;
      case '7alt' : this.newNote(3);
        						this.newNote(4,1);
        						this.newNote(7,-1);
        						this.newNote(9,-1);
                    this.setScale('altered');
        						break;
      case 'm'    : this.newNote(3,-1);
        						this.newNote(5);
                    this.setScale('aeolian');
        						break;
      case 'm6'   : this.newNote(3,-1);
        						this.newNote(5);
        						this.newNote(6);
                    this.setScale('melodic minor');
        						break;
      case 'm7'   : this.newNote(3,-1);
        						this.newNote(5);
        						this.newNote(7,-1);
                    this.setScale('dorian');
        						break;
      case 'm9'		: this.newNote(3,-1);
        						this.newNote(5);
        						this.newNote(7,-1);
        						this.newNote(9);
                    this.setScale('dorian');
        						break;
      case 'mmaj7': this.newNote(3,-1);
        						this.newNote(5);
        						this.newNote(7);
                    this.setScale('melodic minor');
        						break;
    	case '+'		: this.newNote(3);
        						this.newNote(5,1);
                    this.setScale('aug. lydian');
        						break;
      case 'o'		: this.newNote(3,-1);
        						this.newNote(5,-1);
                    this.setScale('diatonic diminished');
        						break;
      case 'm7b5' : this.newNote(3,-1);
        						this.newNote(5,-1);
        						this.newNote(7,-1);
                    this.setScale('half diminished');
        						break;
      case 'o7'   : this.newNote(3,-1);
        						this.newNote(5,-1);
        						this.newNote(7,-2);
                    this.setScale('diatonic diminished');
    }
  }

  newNote(d,a=0) {
    this.notes.push(this.notes[0].newNote(d,a));
  }

  setScale(name) {
    for(var t = 0; t < scaleByFunction.length; t++) {
      for(var j = 0; j < scaleByFunction[t].length; j++) {
        if(name == scaleByFunction[t][j]) {
          this.scale = new Scale(this.notes[0],name);
          this.type = t;
          this.jazz = j;
          return;
        }
      }
    }
    console.log('scale not found: '+name);
    this.setScale('ionian');
  }

  changeScale(up=true) {
    var j = this.jazz + (up?1:(-1));
    if(j >= 0 && j < scaleByFunction[this.type].length) {
      this.scale = new Scale(this.notes[0],scaleByFunction[this.type][j]);
      this.jazz = j;
      if(midi) {
        this.scale.send();
      }
      console.log('yes');
    }
    console.log('type: '+this.type+' jazz: '+this.jazz);
  }

  setDuration(dur) {
    this.duration = dur;
  }
}

class Scale {
	constructor(note,s) {
    this.name = s;
    var a = [0,0,0,0,0,0,0];
    switch(s) {
      case 'majeur':
      case 'ionien':
      case 'major':
      case 'maj7' :
        break;
      case 'dorien':
      case 'dorian':
        a[2]--;
        a[6]--;
      	break;
      case 'phrygien':
      case 'phrygian':
        a[1]--;
        a[2]--;
        a[5]--;
        a[6]--;
      	break;
      case 'lydien':
      case 'lydian':
        a[3]++;
        break;
      case 'mixolydien':
      case 'mixolydian':
        a[6]--;
        break;
      case 'mineur':
      case 'mineur naturel':
      case 'aeolien':
      case 'minor':
      case 'natural minor' :
      case 'aeolian' :
        a[2]--;
        a[5]--;
        a[6]--;
        break;
      case 'locrien':
      case 'locrian':
        a[1]--;
        a[2]--;
        a[4]--;
        a[5]--;
        a[6]--;
        break;
      case 'mineur melodique' :
      case 'melodic minor' :
        a[2]--;
      	break;
      case 'dorien b9' :
      case 'dorian b9' :
        a[1]--;
        a[2]--;
        a[6]--;
        break;
      case 'lydien augmente' :
      case 'aug. lydian' :
        a[3]++;
        a[4]++;
        break;
      case 'lydien dominant' :
      case 'lydian dominant' :
        a[3]++;
        a[6]--;
        break;
      case 'mixolydien b13' :
      case 'mixolydian b13' :
        a[5]--;
        a[6]--;
        break;
      case 'demi diminue' :
      case 'half diminished' :
        a[2]--;
        a[4]--;
        a[5]--;
        a[6]--;
        break;
      case 'super locrien' :
      case 'altere' :
      case 'super locrian' :
      case 'altered' :
        a[1]--;
        a[2]--;
        a[3]--;
        a[4]--;
        a[5]--;
        a[6]--;
        break;
      case 'mineur harmonique' :
      case 'harmonic minor' :
        a[2]--;
        a[5]--;
        break;
      case 'locrien #13' :
      case 'locrian #13' :
        a[1]--;
        a[2]--;
        a[4]--;
        a[6]--;
        break;
      case 'ionien augmente' :
      case 'aug. ionian' :
        a[4]++;
        break;
      case 'dorien #11' :
      case 'dorian #11' :
        a[2]--;
        a[3]++;
        a[6]--;
        break;
      case 'mixolydian b9 b13' :
        a[1]--;
        a[5]--;
        a[6]--;
        break;
      case 'lydien #9' :
      case 'lydian #9' :
        a[1]++;
        a[3]++;
        break;
      case 'diminue' :
      case 'diatonic diminished' :
        a[1]--;
        a[2]--;
        a[3]--;
        a[4]--;
        a[5]--;
        a[6]-=2;
        break;
      case 'harmonic major' :
        a[5]--;
        break;
    }
    this.notes = [];
    var d;
    var n;
    for(var i = 0; i < a.length; i++) {
      d = note.d+i;
      n = ndt(degToNdt(i+1)+degToNdt(note.d)+note.alt()+a[i]);
      this.notes.push(new Note(d,n-degToNdt(d)));
    }
    /*if(s == 'altered') {
      this.notes[2].enharm(false);
      this.notes[3].enharm(false);
      this.notes[4].enharm(false);
    }*/
  }

  send() {
    if(midi) {
      for(let n = 0; n < 7; n++) {
        midiOutput.send(noteOnStatus+1,[this.notes[0].n+ndt(this.notes[n].n-this.notes[0].n),this.notes[n].d]);
      }
    }
  }
}

class Progression {
  constructor(standard) {
    this.name = standard[0];
    this.chords = [];
    var nbrBeat = 0;
    for(var l = 1; l < standard.length; l++) {
      var line = standard[l];
      for(var c = 0; c < line.length;) {
        var s = c;
        while(line[s] != '-' && s < line.length) {
          s++;
        }
        this.chords.push(new Chord(line.substring(c,s)));
        c = s;
        while(line[c] == '-') {
          c++;
        }
        let dur = c-s;
        nbrBeat += dur;
        this.chords[this.chords.length-1].setDuration(dur);
        var chord = this.chords[this.chords.length-1];
      }
    }
    this.length = nbrBeat;
  }

  setKey(key) {
    this.key = key;
  }

  draw(x0,y0,w0,h0) {
    var nbrBeat = this.length;
    var nbrCol = 16;
    var nbrRow = Math.ceil(nbrBeat/nbrCol)+2;
    var wb = w0/nbrCol;
    var h = h0/nbrRow;
    fill(black);
    textSize(w0/20);
    textAlign(CENTER,TOP);
    text(this.name,x0,y0,w0,2*h);
    textSize(w0/32);
    textAlign(LEFT,CENTER);
    var cho = 0;
    var dur = 0;
    var x, y, w, h;
    for(var row = 2; row < nbrRow; row++) {
      for(var col = 0; col < nbrCol; col++) {
        if(!dur) {
          if(cho >= this.chords.length) {
            return;
          }
          var chord = this.chords[cho];
          x = x0 + col*wb;
          y = y0 + row*h;
          dur = chord.duration;
          w = dur*wb;
          if(cho == chordCursor && midi) {
            fill(white);
            noStroke();
            rectMode(CENTER);
            rect(x+w/2,y+h/2,w,sqrt(w0*h)*1/5);
            fill(black);
            rectMode(CORNER);
          }
          text(chord.name,x+wb/5,y-w0/250,w-wb/5,h);
          cho++;
        }
        dur--;
      }
    }
  }
}

function parseChord(openName) {
  var name = '';
  var length = openName.length;
  switch(openName[0]) {
    case 'a': name += 'A'; break;
    case 'b': name += 'B'; break;
    case 'c': name += 'C'; break;
    case 'd': name += 'D'; break;
    case 'e': name += 'E'; break;
    case 'f': name += 'F'; break;
    case 'g': name += 'G'; break;
    default: return;
  }
  var c = 1;
  if(length >= 3) {
    var alt = openName.substring(c,c+2);
    if(alt == 'es') {
      name += 'b';
      c += 2;
    }
    else if(alt == 'is') {
      name += '#';
      c += 2;
    }
  }
  while(c < length && openName[c] != ':') {
    c++;
  }
  if(c == length) {
    return name;
  }
  switch(openName.substring(c,length)) {
    case '':
    case '5':
      name += '';
      break;
    case 'm':
    case 'm5':
      name += 'm';
      break;
    case 'aug':
      name += '+';
      break;
    case 'dim':
      name += 'o';
      break;
    case '7':
      name += '7';
      break;
    case 'maj':
    case 'maj7':
      name += 'maj7';
      break;
    case 'm7':
      name += 'm7';
      break;
    case 'dim7':
      name += 'o7';
      break;
    case 'aug7':
      name += '7#5';
      break;
    case 'm7.5-':
      name += 'm7b5';
      break;
    case 'm7+':
      name += 'mmaj7';
      break;
    case '6':
      name += '6';
      break;
    case 'm6':
      name += 'm6';
      break;
    case '9':
      name += '9';
      break;
    case 'maj9':
      name += 'maj9';
      break;
    case 'm9':
      name += 'm9';
      break;
    case '11':
      name += '11';
      break;
    case 'maj11':
      name += 'maj11';
      break;
    case 'm11':
      name += 'm11';
      break;
    case '13':
      name += '913';
      break;
    case '13.11':
      name += '13';
      break;
    case 'maj13.11':
      name += 'maj13';
      break;
    case 'm13.11':
      name += 'm13';
      break;
    case 'sus2':
      name += 'sus2';
      break;
    case 'sus4':
      name += 'sus4';
      break;
  }
}

function initMidiButton() {
  midiButton = new Clickable();
  midiButton.color = grey;
  midiButton.cornerRadius = 1000;
  midiButton.stroke = black;
  midiButton.text = '';
  midiButton.onPress = function() {
    //if(this.color == white) {
      enableMidi();
    /*}
    else {
      disableMidi();
    }*/
  }
  updateMidiButton();
}

function updateMidiButton() {
  let r = midiRadius*dimension;
  let x = -0.37*width;
  let y = -0.37*height;
  midiButton.resize(2*r,2*r);
  midiButton.locate(width/2 -r+x,
                    height/2-r+y);
  midiButton.strokeWeight = weight*dimension;
}

function drawMidiButton() {
  midiButton.draw();

  noStroke();
  fill(black);
  let r  = 0.14*midiRadius*dimension;
  let br = 0.6*midiRadius*dimension;
  var x = -0.37*width;
  var y = -0.37*height;
  for(let n = 0; n < 5; n++) {
    let a = n*PI/4;
    circle(width/2+br*cos(a)+x,height/2-br*sin(a)+y,2*r,2*r);
  }
  let l = 0.7*midiRadius*dimension;
  let h = 0.35*midiRadius*dimension;
  rect(width/2-l/2+x,height/2+1.1*br+y,l,h,h);
}

function handleFile(file) {
  var standardFile = '';
  if(navigator.appVersion.search('Windows') >= 0) {
    standardFile = file.data.split('\r\n');
  }
  else if(navigator.appVersion.search('Mac') >= 0) {
    standardFile = file.data.split('\n');
  }
  else {
    console.log('OS non reconnue');
  }
  for(var l = 0; l < standardFile.length; l++) {
    standardFile[l] = standardFile[l].slice(0,standardFile[l].length);
  }
  progression = new Progression(standardFile);
  fileInput.hide();
}

function preload() {
  font = loadFont('nunito.ttf');

  //openbook = loadStrings('openbook.ly');
  //standardFile = loadStrings('all_of_me.txt');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  textFont(font);

  dimension = Math.min(width,height);

  initMidiButton();

  userStartAudio().then(function() {
     console.log('Audio ready');
  });

  fileInput = createFileInput(handleFile);
  fileInput.position(0, 0);

  /*for(c = 0; c < progression.chords.length; c++) {
    console.log(progression.chords[c].name,' ',progression.chords[c].duration);
  }*/

  /*var standardList;

  for(let s = 0; s < openbook.length; s++) {
    if(openbook[s].includes('tocItem')) {
      var name = openbook[s].substring(openbook[s].indexOf('"')+1,openbook[s].indexOf('/')-1);
      //standardList += openbook[s].substring(openbook[s].indexOf('"')+1,openbook[s].indexOf('/')-1) + '\n';
      if(name.includes('All Of Me')) {
        while(!openbook[s].includes('chordmode')) {
          s++;
        }
        s++;
        var duree = 0;
        while(!openbook[s].includes('endChords')) {
          var line = openbook[s];
          var c = 0;
          while(c < line.length) {
            if(line[c] == 'a' ||
               line[c] == 'b' ||
               line[c] == 'c' ||
               line[c] == 'd' ||
               line[c] == 'e' ||
               line[c] == 'f' ||
               line[c] == 'g'){
              console.log('oui');
              var c2 = c;
              while(line[c2] != ' ' && c2 < line.length) {
                c2++;
              }
              console.log((line.substring(c,c2+2)));
            }
            c++;
          }
          s++;
        }
      }
    }
  }*/
  //window.alert(standardList);
}

function draw() {
  background(grey);

  if(progression) {
    progression.draw(width/10,height/10,4/5*width,4/5*height);
  }

  if(!midi) {
    drawMidiButton();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  dimension = Math.min(width,height);

  updateMidiButton();
}

//------------------------------------------------------------------------------
//                             MIDI
//------------------------------------------------------------------------------

function enableMidi() {
  WebMidi.enable(function (err) {
    if (err) console.log("An error occurred", err);

    //---------------------INPUT--------------------

    var liste = '';
    var taille = WebMidi.inputs.length;
    var i, num;
    var numStr = '0';

    if(taille == 0) {
      window.alert("No MIDI input device detected.");
      disableMidi();
      return;
    }

    for(let i = 0; i < taille; i++) {
      num = i+1;
      liste += '   ' + num.toString() + '   -   ' + WebMidi.inputs[i].name + '\n';
    }

    i = 0;
    num = 0;

    while((num < 1 || num > taille) && i < 1) {
      numStr = window.prompt("Write the number of the desired MIDI synchronization input:\n\n"+liste);
      if(numStr == null)
      {
        num = 0;
        break;
      }
      else if(numStr) num = parseInt(numStr);
      i++;
    }

    if(num < 0 || !num || num > taille) {
      window.alert("No MIDI input selected. No synchronization.");
    }
    else {
      midiInput = WebMidi.inputs[num-1];
      let name = midiInput.name;
      /*if(name == 'MIDIIN2 (Launchpad Pro)') {
        launchpad.turnOn('MIDIOUT2 (Launchpad Pro)');
        name += '.\nColours will be displayed on the matrix. Please put your Launchpad Pro into Programmer Mode';
      }*/
      window.alert('Input selected: ' + name + '.');
      if(!midiInput.hasListener('clock',      'all', handleClock)) {
        midiInput.addListener('clock',        'all', handleClock);
        midiInput.addListener('start',        'all', handleStart);
        midiInput.addListener('stop',         'all', handleStop);
        midiInput.addListener('continue',     'all', handleContinue);
        midiInput.addListener('songposition', 'all', handleSongposition);
      }
      midi = 1;
      //midiButton.color  = black;
      //midiButton.stroke = white;
    }

    //--------------------OUTPUT--------------------

    liste = '';
    taille = WebMidi.outputs.length;
    numStr = '0';

    if(taille == 0) {
      window.alert("No MIDI output device detected. MIDI disabled.");
      disableMidi();
      return;
    }

    for(let i = 0; i < taille; i++) {
      num = i+1;
      var name = WebMidi.outputs[i].name;
      liste += '   ' + num.toString() + '   -   ' + WebMidi.outputs[i].name + '\n';
    }

    i = 0;
    num = 0;

    while((num < 1 || num > taille) && i < 1) {
      numStr = window.prompt("Write the number of the desired MIDI output device:\n\n"+liste);
      if(numStr == null)
      {
        num = 0;
        break;
      }
      else if(numStr) num = parseInt(numStr);
      i++;
    }

    if(num < 0 || !num || num > taille) {
      window.alert("No MIDI output selected.");
      disableMidi();
      return;
    }
    else {
      midiOutput = WebMidi.outputs[num-1];
      window.alert('Output selected: ' + midiOutput.name + '.');
      midi = 1;
      if(progression) {
        progression.chords[chordCursor].scale.send();
      }
    }
  },true);
}

var tick = 0;
var beat = 0;

function handleClock(e) {
  console.log('clock');
  if(progression) {
    tick++;
    if(tick == 24) {
      tick = 0;
      beat++;
      if(beat == progression.chords[chordCursor].duration) {
        beat = 0;
        nextChord();
      }
    }
  }
}

function handleStart(e) {
  console.log('start');
  if(progression) {
    tick = 0;
    beat = 0;
    firstChord();
  }
}

function handleStop(e) {
  console.log('stop');
}

function handleContinue(e) {
  console.log('continue');
}

function handleSongposition(e) {
  //console.log('songposition: ',128*e.data[2]+e.data[1]);
  if(progression) {
    var spp = 128*e.data[2]+e.data[1];
    var tic = 0;
    var bea = 0;
    var chp = 0;
    for(var p = 0; p < spp; p++) {
      tic += 6;
      if(tic == 24) {
        tic = 0;
        bea++;
        if(bea == progression.chords[chp].duration) {
          bea = 0;
          chp++;
          chp %= progression.chords.length;
        }
      }
    }
    if(chp < progression.chords.length) {
      tick = tic;
      beat = bea;
      chordCursor = chp;
      if(midi) {
        progression.chords[chordCursor].scale.send();
      }
    }
  }
}

function disableMidi() {
  midi = 0;

  for(let i = 0; i < WebMidi.inputs.length; i++) {
    WebMidi.inputs[i].removeListener();
  }

  WebMidi.disable();

  //midiButton.color  = white;
  //midiButton.stroke = black;
}

function nextChord() {
  chordCursor++;
  chordCursor %= progression.chords.length;
  if(midi) {
    progression.chords[chordCursor].scale.send();
  }
}

function prevChord() {
  chordCursor--;
  if(chordCursor < 0) {
    chordCursor += progression.chords.length;
  }
  if(midi) {
    progression.chords[chordCursor].scale.send();
  }
}

function firstChord() {
  chordCursor = 0;
  if(midi) {
    progression.chords[chordCursor].scale.send();
  }
}

function keyPressed() {
  if(progression) {
    if(keyCode === LEFT_ARROW) {
      prevChord();
    }
    else if(keyCode === RIGHT_ARROW) {
      nextChord();
    }
    else if(keyCode === UP_ARROW) {
      progression.chords[chordCursor].changeScale();
    }
    else if(keyCode === DOWN_ARROW) {
      progression.chords[chordCursor].changeScale(false);
    }
  }
}
