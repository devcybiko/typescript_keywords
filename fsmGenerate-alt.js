#!/usr/bin/env node

/**
 * alternate version of fsmGenerate.js
 * where we don't use a null terminator
 * and we don't have 'sub-keywords'
 * See the Implementation Notes in the README.md
 */

const glstools = require('glstools');
const gprocs = glstools.procs;
const gfiles = glstools.files;

// constant value for lowercase 'a'
let ascii_a = "a".charCodeAt(0);

// get the ordinal value of a character in a string 
// 'a' -> 0
// 'z' -> 25
function ordAt(s, n) {
	return s.charCodeAt(n) - ascii_a;
}

// build an dictionary of dictionaries of keywords
// arr[i1] - i1 is the first char of the token
// arr[i1][i2] - i2 is the second char of the token
// arr[i1][i2][i3]... - i3 is the third char of the token
// if any of arr[...] is undefined - then it's the end of the token string
function buildDictionaries(dict, word, pos, tokenid) {
	let c = word[pos]; // get the character
	if (c === undefined) { //if it's the end of the string, (null terminator, if you will) store the tokenid
		return tokenid;
	} else { // recursively add dictionaries of dictionaries for each successive character
		dict[c] = buildDictionaries(dict[c] || {}, word, pos + 1, tokenid);
	}
	return dict; // return the resultant dictionary
}

// push 27 zeroes onto the fsm
function push26(fsm) {
	for (let i = 0; i < 26; i++) {
		fsm.push(0);
	}
}

// let's flatten our dictionary of dictionaries into a list of present-state / next-state values
// each element in the fsm points to the next state
// the first 27 elements represent the 'null' plus the next state for each letter in the alphabet
// the next 27 elements represent the next-states for letter 'a'
// the next 27 element represent the next-states for letters 'aa' etc... if it exists
function buildFSM(fsm, dict, i) {
	push26(fsm);  // initial 27 zeroes
	let ii = i + 26; // locate the base of the next table of 27 entries
	for (let j in dict) { // for each element of the dictionary
		if (typeof dict[j] === 'number') { // if dict[j] has a number then we've found a marker for a valid token
			fsm[i + ordAt(j, 0)] = -dict[j]; // set the fsm entry to -tokenid
		} else { // otherwise it's a sub dictionary and we need to descend recursively
			fsm[i + ordAt(j, 0)] = ii; // point the the next block of 27 fsm entries
			ii = buildFSM(fsm, dict[j], ii); // build the next block of fsm entries
		}
	}
	return ii; // return where the last block of fsm entries was stored, so we can continue to build the dictionary from there
}

async function main$(_opts) {
	let opts = _opts || gprocs.args("--infile=keywords-alt.txt,", ""); // parse command line
	let keywords = gfiles.readList(opts.infile); // read list of keywords
	let dict = {}
	for (let i=0; i<keywords.length; i++) { // for each keyword
		buildDictionaries(dict, keywords[i], 0, i + 1); // build the dictionaries of dictionaries
	}
	gfiles.writeJSON("dict-alt.json", dict); // write it out to a file, just for our interest
	let fsm = []; // initialize the FSM
	buildFSM(fsm, dict, 0); // build the fsm from the dictionaries of dictionaries
	gfiles.writeList("fsm-alt.txt", fsm); // write the fsm to a file
}

main$();