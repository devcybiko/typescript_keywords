# typescript_keywords

Let's build a Finite State Machine for well-known keywords.

* `fsmGenerate.js --infile=keywords.txt`
    * reads `keywords.txt`
    * generates `fsm.txt`
* `fsmLookup.js --infile=fsm.txt keyword`
    * reads `fsm.txt`
    * looks up `token`
    * reports token's id or 'not a token'
* `test.sh`
    * executes `fsmLookup.js` against each entry in `keywords.txt`

## Finite State Machine generation

 * The first step is to build a dictionary of dictionary of nodes
 * Each entry in the first dictionary is keyed by the first letter of the keyword
 * Each entry in each subsequent dictionary is keyed by the second letter of the keyword
 * A special 'null' entry indicates the end of the keyword (null terminator) and stores the tokenid

```
{
  "a": {
    "n": {
      "y": {
        "null": 1
      }
    },
    "s": {
      "null": 2
    }
  },
...
}
```

 * The next step is to 'flatten' the dictionary of dictionaries
 * And make for a very easy present-state / next-state table to traverse
 * fsm[0] = null
 * fsm['a'] = pointer to the next-state table for letter 'a'
 * fsm[fsm['a']+'s'] pointer to the next-state table for "a" -> "s"
 * fsm[fsm[fsm['a']+'s']+null] = token id of 'as'

# Example: 'any'
```
    0: 0     'null'
  * 1: 27    'a' - look in entry 27+
    2: 135   'b' - look in entry 135+
    3: 432   'c' - look in entry 432+
...
    27: 0    'a+null' - not a token
    28: 0    'aa' - not a token
    29: 0    'ab' - not a token
    30: 0    'ac' - not a token
    31: 0    'ad' - not a token
    32: 0    'ae' - not a token
    33: 0    'af' - not a token
    34: 0    'ag' - not a token
    35: 0    'ah' - not a token
    36: 0    'ai' - not a token
    37: 0    'aj' - not a token
    38: 0    'ak' - not a token
    39: 0    'al' - not a token
    40: 0    'am' - not a token
  * 41: 54   'an' - look in entry 54+
    42: 0    'ap' - not a token
    43: 0    'aq' - not a token
...
    54: 0   'aa+null' - not a token
    55: 0   'aaa' - not a token
    56: 0   'aab' - not a token
~
    77: 0   'aaw' - not a token
    78: 0   'aax' - not a token
  * 79: 81  'any' - look in entry 81+
    80: 0   'anz' - not a token
*** 81: -1  'any+null' - tokenID = '1'
    82: 0   'anya' - not a token
```

## Implementation Notes

* The example keyword list has 60 entries. 
    * It generates an FSM of 6912 entries. 
    * If you were to use 2-byte integers for each entry that results in a table of 13824 bytes. 
    * It's arguable if almost 14K of memory justifies the speed of lookup for 60 keywords.
* There might be some optimizations to significantly reduce the table size if you didn't have to check end-of-word (null) markers.
    * For example, words like 'in' could be terminated at the 'n'. 
    * But upon lookup, if you were searching for 'interface', the lookup would stop at 'in' thinking it was a token.
    * So, if you could doctor your keywords such that there were no 'sub-keywords' (like 'in', a sub-keyword of 'interface') you would not have to do 'null' checks and your table might be significantly smaller.
* I've demonstrated this in fsmGenerate-alt.js / fsmLookup-alt.js / keywords-alt.txt / dict-alt.json / fsm-alt.txt
    * where I remove 'in' and 'type' from keywords.txt, which were sub-keywords
    * and the fsmGenerate / fsmLookup use the string length to determine end-of-word
    * I got a 27% reduction in the size of the FSM
    * Note: this only works where you have control over your choice of keywords.
    * In the case of Typescript, we're constrained by the choices that came before us.