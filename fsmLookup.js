#!/usr/bin/env node

/**
 * lookup keyword in fsm
 */

const glstools = require('glstools');
const gprocs = glstools.procs;
const gfiles = glstools.files;

let ascii_a = "a".charCodeAt(0);

// find the ordinal value of a letter 'a' - 'z'
function ordAt(s, n) {
	return s.charCodeAt(n) - ascii_a + 1;
}

// start at the top of the FSM
// next = fsm[word[0]]
// next = fsm[next + word[1]]
// next = fsm[next + word[2]]
// ... until either next = 0 (not a keyword) or end of word
// note: fsm[0] == 0 - a cheap way to indicate not-a-keyword
function lookupFSM(fsm, word, pos=0) {
	let next = 0; // start at the top of the FSM
	for(let _c of word) { // for each character in the word
		let c = ordAt(_c, 0); // convert character to 1-26
		next = fsm[next + c]; // get the next state
		if (!next) break; // if it's zero, it's not a keyword
	}
	return -fsm[next]; // return tokenid (or zero if it's not a keyword)
}

async function main$(_opts) {
	let opts = _opts || gprocs.args("--infile=fsm.txt,", "lookup");
	let fsm = gfiles.readList(opts.infile); // read FSM
	fsm.forEach((value, index, fsm) => fsm[index]=+fsm[index]); // convert strings to integers
	let tokenid = lookupFSM(fsm, opts.lookup); // return keywordid or 0 if not a tokn
	if (tokenid === 0) console.log(opts.lookup + " is not a keyword");
	else console.log(opts.lookup, tokenid)
}

main$();